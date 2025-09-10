// Simple dev chat proxy (hide key, no extras)
export default function SimpleChatProxy() {
  return {
    name: 'chat-proxy-simple',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.method !== 'POST' || !req.url?.startsWith('/api/chat')) return next();
        try {
          const body = await readJson(req);
          const message = (body?.message ?? '').toString().trim();
          if (!message) return send(res, 400, { error: 'Missing message' });
          const key = process.env.OPENAI_API_KEY;
          if (!key) return send(res, 500, { error: 'OPENAI_API_KEY missing' });
          const r = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${key}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [
                { role: 'system', content: 'Antworte kurz auf Deutsch.' },
                { role: 'user', content: message },
              ],
              temperature: 0.3,
              max_tokens: 200,
            }),
          });
          if (!r.ok) return send(res, 502, { error: 'Upstream error' });
          const data = await r.json();
          const reply = data?.choices?.[0]?.message?.content?.trim?.() || '';
          return send(res, 200, { reply });
        } catch {
          return send(res, 500, { error: 'Server error' });
        }
      });
    },
  };
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let s = '';
    req.on('data', c => (s += c));
    req.on('end', () => {
      try { resolve(s ? JSON.parse(s) : {}); } catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

function send(res, code, obj) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(obj));
}
