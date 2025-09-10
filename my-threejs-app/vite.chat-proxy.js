// NEW: Vite dev-server middleware to proxy /api/chat to OpenAI

/**
 * Minimal chat proxy plugin for Vite dev server.
 * - Adds POST /api/chat endpoint
 * - Calls OpenAI Chat Completions (gpt-4o-mini by default)
 * - Reads API key from process.env.OPENAI_API_KEY (do not expose to client)
 */
export default function ChatProxyPlugin() {
  return {
    name: 'chat-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        try {
          if (req.method !== 'POST' || !req.url || !req.url.startsWith('/api/chat')) {
            return next();
          }

          // Parse JSON body
          const body = await new Promise((resolve, reject) => {
            let data = '';
            req.on('data', chunk => (data += chunk));
            req.on('end', () => {
              try { resolve(data ? JSON.parse(data) : {}); } catch (e) { reject(e); }
            });
            req.on('error', reject);
          });

          const userText = (body && typeof body.message === 'string') ? body.message.trim() : '';
          const reference = body && body.reference ? body.reference : null;
          const history = Array.isArray(body?.history) ? body.history : [];

          if (!userText) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Missing message' }));
            return;
          }

          const apiKey = process.env.OPENAI_API_KEY;
          if (!apiKey) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Server not configured: OPENAI_API_KEY missing' }));
            return;
          }

          // Prepare messages: include short recent history (last 8 items), user text and optional reference
          const recent = history.slice(-8).map(m => ({
            role: 'user',
            content: (typeof m.text === 'string') ? m.text : ''
          })).filter(m => m.content);

          const refText = reference && reference.label ? `\n\nKontext: ${reference.label}` : '';
          const messages = [
            { role: 'system', content: 'Du bist ein hilfreicher, knapper Assistent. Antworte auf Deutsch, sachlich und direkt.' },
            ...recent,
            { role: 'user', content: userText + refText }
          ];

          // Call OpenAI Chat Completions
          const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model,
              messages,
              temperature: 0.3,
              max_tokens: 300
            })
          });

          if (!response.ok) {
            const errText = await response.text().catch(() => '');
            res.statusCode = 502;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Upstream error', details: errText.slice(0, 500) }));
            return;
          }

          const data = await response.json();
          const reply = data?.choices?.[0]?.message?.content?.trim?.() || '';

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ reply }));
        } catch (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Server error', details: String(err).slice(0, 500) }));
        }
      });
    }
  };
}

