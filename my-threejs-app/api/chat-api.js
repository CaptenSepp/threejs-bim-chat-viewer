// Simple prod serverless endpoint (Vercel-style) to handle chat requests on the server (endpoint)
export default async function handler(req, res) {                                    // handles POST chat requests (HTTP) to process user messages
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' }); // enforce POST-only (method check) to avoid accidental GETs
  try {
    const body = await readJson(req);                                     // read JSON request body (payload) to access incoming fields
    const message = (body?.message ?? '').toString().trim();              // normalize message text to ensure a clean string
    if (!message) return json(res, 400, { error: 'Missing message' });    // require message to reject empty input
    const key = process.env.OPENAI_API_KEY;                               // read API key from environment (secret) to avoid hardcoding credentials
    if (!key) return json(res, 500, { error: 'OPENAI_API_KEY missing' }); // fail when missing to prevent unauthorized upstream calls
    const r = await fetch('https://api.openai.com/v1/chat/completions', { // call OpenAI Chat Completions API (upstream request) to get assistant reply
      method: 'POST',                                                     // HTTP POST (method) to send a JSON body
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, // auth and content type (headers) to authenticate and send JSON
      body: JSON.stringify({                                         // request payload (body) to specify model and prompt
        model: 'gpt-4o-mini',                                        // model identifier (model) to control quality/cost/latency
        messages: [                                                  // conversation messages (prompt) to provide system/user roles
          { role: 'system', content: 'Antworte kurz auf Deutsch.' }, // instruction for behavior (system prompt) to enforce short German replies
          { role: 'user', content: message },                        // user message (prompt content) to pass the actual question
        ],
        temperature: 0.3,                                            // randomness control (temperature) to keep answers consistent
        max_tokens: 200,                                             // output length limit (token limit) to cap response size
      }),
    });
    if (!r.ok) return json(res, 502, { error: 'Upstream error' });   // propagate provider failure (bad gateway) to signal upstream issues
    const data = await r.json();                                     // parse provider response (JSON) to read the reply content
    return json(res, 200, { reply: data?.choices?.[0]?.message?.content?.trim?.() || '' }); // send reply text (response payload) to keep client API stable
  } catch {                        // generic catch (error handling) to avoid leaking internal errors
    return json(res, 500, { error: 'Server error' });
  }
}

function readJson(req) {           // reads and parses request body (utility) to handle raw stream input
  return new Promise((resolve, reject) => {
    let s = '';                    // accumulator buffer (string) to collect incoming chunks
    req.on('data', c => (s += c)); // append chunk (stream) to build the full body
    req.on('end', () => { try { resolve(s ? JSON.parse(s) : {}); } catch (e) { reject(e); } }); // parse JSON or default {} (parse) to handle empty body
    req.on('error', reject);       // bubble stream errors (error) to fail the promise
  });
}

function json(res, code, obj) {    // sends a JSON response (helper) to standardize responses
  res.status(code).json(obj);      // set status and send JSON (response) to return structured data
}
