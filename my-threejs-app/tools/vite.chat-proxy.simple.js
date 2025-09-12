// Simple dev chat proxy (hide key, no extras)                         // provides /api/chat during npm run dev (local only)
export default function SimpleChatProxy() {                            // exports a Vite plugin factory (function)
  return {
    name: 'chat-proxy-simple',                                         // plugin name (for Vite debug output)
    configureServer(server) {                                          // hook into Vite dev server (middleware registration)
      server.middlewares.use(async (req, res, next) => {               // add an express-style middleware to intercept requests
        if (req.method !== 'POST' || !req.url?.startsWith('/api/chat')) return next(); // only handle POST /api/chat, pass through others
        try {
          const body = await readJson(req);                            // parse JSON request body from stream (utility below)
          const message = (body?.message ?? '').toString().trim();     // normalize message text (string) from client
          if (!message) return send(res, 400, { error: 'Missing message' }); // reject when client sends empty input
          const key = process.env.OPENAI_API_KEY;                      // read local dev API key from environment (never exposed to browser)
          if (!key) return send(res, 500, { error: 'OPENAI_API_KEY missing' }); // fail fast if key is not set locally
          const r = await fetch('https://api.openai.com/v1/chat/completions', { // call OpenAI upstream (Chat Completions)
            method: 'POST',                                            // HTTP POST to send a JSON body
            headers: {
              Authorization: `Bearer ${key}`,                          // bearer token with local env key
              'Content-Type': 'application/json',                      // send JSON
            },
            body: JSON.stringify({                                     // minimal request model and prompt
              model: 'gpt-4o-mini',                                    // selected model
              messages: [                                              // conversation messages
                { role: 'system', content: 'Antworte kurz auf Deutsch.' }, // system instruction (short German answers)
                { role: 'user', content: message },                    // user message (from client)
              ],
              temperature: 0.3,                                        // low randomness for consistent replies
              max_tokens: 200,                                         // cap output length
            }),
          });
          if (!r.ok) return send(res, 502, { error: 'Upstream error' }); // propagate upstream failure (bad gateway)
          const data = await r.json();                                   // parse upstream JSON
          const reply = data?.choices?.[0]?.message?.content?.trim?.() || ''; // extract assistant reply text (safe fallback)
          return send(res, 200, { reply });                             // respond to client with reply payload
        } catch {                                                       // shield internal errors in dev proxy
          return send(res, 500, { error: 'Server error' });             // generic error to the client
        }
      });
    },
  };
}

function readJson(req) {                                               // reads request body stream and parses JSON
  return new Promise((resolve, reject) => {
    let s = '';                                                        // accumulate chunks into a string
    req.on('data', c => (s += c));                                     // append chunk
    req.on('end', () => {                                              // on stream end, parse or default {}
      try { resolve(s ? JSON.parse(s) : {}); } catch (e) { reject(e); }
    });
    req.on('error', reject);                                           // bubble stream errors
  });
}

function send(res, code, obj) {                                        // tiny helper to send JSON responses
  res.statusCode = code;                                               // set HTTP status code
  res.setHeader('Content-Type', 'application/json');                   // JSON content type
  res.end(JSON.stringify(obj));                                        // serialize and finish response
}

