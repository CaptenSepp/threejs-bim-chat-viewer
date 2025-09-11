/**
 * Request an assistant reply for a user message
 * @param {{ userMessageText: string, previousChatHistory?: Array<any>, selectedModelReference?: any }} params
 * @returns {Promise<string>} assistant reply plain text answer from AI
 */
export async function requestAssistantReplyForUserMessage({ userMessageText, previousChatHistory = [], selectedModelReference = null }) {
  const response = await fetch('/api/chat', {                           // Send request to our local dev endpoint to avoid exposing API keys client-side
    method: 'POST',                                                     // Use HTTP POST (sending data)
    headers: { 'Content-Type': 'application/json' },                    // Tell server that body is JSON
    body: JSON.stringify({                                              // Convert JS object to JSON string to match API payload schema
      message: userMessageText,                                         // The actual text the user typed
      history: previousChatHistory,                                     // short history of the chat
      reference: selectedModelReference                                 // 3D selection reference to a selected model item
    })
  });

  if (!response.ok) {                                                   // If server not OK (status >= 400) to fail on HTTP errors
    const errorText = await tryReadText(response);                      // read error text
    throw new Error(errorText || `Chat API error: ${response.status}`); // Throw so caller can show an error in UI
  }

  const data = await response.json();                                   // Turn JSON back into JS object to access fields on the API response
  return data?.reply || '';                                             // Return assistant reply text or empty string if missing to keep UI stable when reply is absent
}

async function tryReadText(res) {                                       // Safe helper to read text from a response to avoid throwing when response isn't plain text
  try { return await res.text(); } catch { return ''; }
}
