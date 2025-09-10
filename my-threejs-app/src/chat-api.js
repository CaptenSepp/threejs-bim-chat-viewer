// NEW: Minimal client helper to call the local /api/chat endpoint

/**
 * Sends a chat message to the dev-server proxy.
 * @param {{ text: string, history?: Array<any>, reference?: any }} params
 * @returns {Promise<string>} reply text from assistant
 */
export async function sendChat({ text, history = [], reference = null }) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: text, history, reference })
  });
  if (!res.ok) {
    const err = await safeText(res);
    throw new Error(err || `Chat API error: ${res.status}`);
  }
  const data = await res.json();
  return data?.reply || '';
}

async function safeText(res) {
  try { return await res.text(); } catch { return ''; }
}

