// Simple prod serverless endpoint (Vercel-style)
export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  try {
    const body = await readJson(req);
    const message = (body?.message ?? '').toString().trim();
    if (!message) return json(res, 400, { error: 'Missing message' });
    const key = process.env.OPENAI_API_KEY;
    if (!key) return json(res, 500, { error: 'OPENAI_API_KEY missing' });
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
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
    if (!r.ok) return json(res, 502, { error: 'Upstream error' });
    const data = await r.json();
    return json(res, 200, { reply: data?.choices?.[0]?.message?.content?.trim?.() || '' });
  } catch {
    return json(res, 500, { error: 'Server error' });
  }
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let s = '';
    req.on('data', c => (s += c));
    req.on('end', () => { try { resolve(s ? JSON.parse(s) : {}); } catch (e) { reject(e); } });
    req.on('error', reject);
  });
}

function json(res, code, obj) {
  res.status(code).json(obj);
}

