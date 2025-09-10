import { appendMessageToChat, inputForm, inputField, referenceContainer, referenceLabel, clearReferenceBtn } from "./chat-ui.js";
// Import clearer-named helper to call /api/chat (easier to understand for beginners)
import { requestAssistantReplyForUserMessage } from "./request-assistant-reply-api.js"; // Use descriptive function name

const STORAGE_KEY = 'chat-history';

// state: current selection reference and history (state)
let currentReference = null;
const messageHistory = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

// API
export function setComposerReference(referenceObject) { // sets the current 3D selection as a chat reference to link a message to a picked item
  currentReference = referenceObject;
  referenceLabel.textContent = referenceObject.label;
  referenceContainer.classList.remove('hidden');
}

export function clearComposerReference() { // clears the current chat reference
  currentReference = null;
  referenceLabel.textContent = '';
  referenceContainer.classList.add('hidden');
}

// event listeners for reference chip and input
clearReferenceBtn.addEventListener('click', clearComposerReference);

inputField.addEventListener('keydown', e => { // send on Enter
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    inputForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  }
});

// Make the submit handler async so we can await the server reply (async/await)
inputForm.addEventListener('submit', async e => { // collect message and append to UI to render the message
  e.preventDefault();
  const text = inputField.value.trim();
  if (!text) return;

  const message = { time: Date.now(), reference: currentReference, text }; // compose message object (payload) to store what we need
  messageHistory.push(message);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messageHistory)); // persist to local storage to restore chat after reload
  appendMessageToChat(message);

  inputField.value = '';
  inputField.focus();
  clearComposerReference();

  // Call local chat API and append assistant reply (What: talk to our /api/chat so AI can answer)
  try { // Try block to catch any network or server errors (error handling)
    const assistantReplyText = await requestAssistantReplyForUserMessage({ // Ask server for AI reply using explicit names
      userMessageText: text, // The text the user just typed
      previousChatHistory: messageHistory, // Pass current chat history for context
      selectedModelReference: message.reference // Optional 3D selection reference
    });
    const assistantMessage = { time: Date.now(), reference: null, text: assistantReplyText || '...' }; // Build assistant message (fallback '...')
    messageHistory.push(assistantMessage); // Save assistant message to in-memory array
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messageHistory)); // Persist updated chat with the AI reply
    appendMessageToChat(assistantMessage); // Show the AI answer in the chat UI
  } catch (err) { // If anything fails, show a readable error message (catch)
    const errMsg = { time: Date.now(), reference: null, text: `Fehler: ${(err && err.message) || 'Unbekannt'}` }; // Create an error message to display (UX)
    messageHistory.push(errMsg); // Store the error message in history (state)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messageHistory)); // Persist the error in localStorage (persistence)
    appendMessageToChat(errMsg); // Show the error in the chat so the user knows (feedback)
  }
});

// render saved chat history
messageHistory.forEach(appendMessageToChat);
