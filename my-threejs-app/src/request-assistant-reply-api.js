// Assistant API helper with beginner-friendly names (Purpose: send your message to our local dev API and get AI answer)

/**
 * Request an assistant reply for a user message (What: talk to '/api/chat')
 * @param {{ userMessageText: string, previousChatHistory?: Array<any>, selectedModelReference?: any }} params (Why: provide your text and optional context)
 * @returns {Promise<string>} assistant reply text (Result: plain text answer from AI)
 */
export async function requestAssistantReplyForUserMessage({ userMessageText, previousChatHistory = [], selectedModelReference = null }) { // Verbose function name for clarity
  const response = await fetch('/api/chat', { // Send request to our local dev endpoint (server hides secret key)
    method: 'POST', // Use HTTP POST (we are sending data)
    headers: { 'Content-Type': 'application/json' }, // Tell server that body is JSON
    body: JSON.stringify({ // Convert JS object to JSON string for transport
      message: userMessageText, // The actual text the user typed
      history: previousChatHistory, // Optional short history of the chat
      reference: selectedModelReference // Optional 3D selection reference
    })
  });

  if (!response.ok) { // If server says not OK (status >= 400)
    const errorText = await tryReadText(response); // Try to read error text for a helpful message
    throw new Error(errorText || `Chat API error: ${response.status}`); // Throw so caller can show an error in UI
  }

  const data = await response.json(); // Turn JSON back into JS object
  return data?.reply || ''; // Return assistant reply text or empty string if missing
}

async function tryReadText(res) { // Safe helper to read text from a response
  try { return await res.text(); } catch { return ''; }
}

