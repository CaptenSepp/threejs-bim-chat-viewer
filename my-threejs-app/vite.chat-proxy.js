// Vite dev-server middleware to proxy /api/chat to Groq
import Groq from 'groq-sdk';

/**
 * Minimal chat proxy plugin for Vite dev server.
 * - Adds POST /api/chat endpoint
 * - Calls Groq Chat Completions
 * - Reads API key from process.env.GROQ_API_KEY (do not expose to client)
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

          const apiKey = process.env.GROQ_API_KEY;
          if (!apiKey) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Server not configured: GROQ_API_KEY missing' }));
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

          // Call Groq Chat Completions via SDK
          const model = process.env.GROQ_MODEL || 'llama-3.1-70b-versatile';
          const groq = new Groq({ apiKey });
          let reply = '';
          try {
            const completion = await groq.chat.completions.create({
              model,
              messages,
              temperature: 0.3,
              max_tokens: 300,
            });
            reply = completion?.choices?.[0]?.message?.content?.trim?.() || '';
          } catch (gerr) {
            res.statusCode = 502;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Upstream error', details: String(gerr).slice(0, 500) }));
            return;
          }

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

