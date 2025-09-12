
//Request an assistant reply for a user message
//Input: object with userMessageText (string), previousChatHistory (array, optional), selectedModelReference (any, optional)
//Output: Promise that resolves to assistant reply text (string)

export async function requestAssistantReplyForUserMessage({ userMessageText, previousChatHistory = [], selectedModelReference = null }) {
  // use shared client helper for JSON POST (standard headers, error handling, snackbar)
  const { postJson } = await import('../services/http-client.js');
  const data = await postJson('/api/assistant-reply', {                 // Send request to our API endpoint (dev proxy or prod function)
    message: userMessageText,                                           // The actual text the user typed
    history: previousChatHistory,                                       // short history of the chat
    reference: selectedModelReference                                   // 3D selection reference to a selected model item
  });
  return data?.reply || '';                                             // Return assistant reply text or empty string if missing to keep UI stable when reply is absent
}
// @ts-check
