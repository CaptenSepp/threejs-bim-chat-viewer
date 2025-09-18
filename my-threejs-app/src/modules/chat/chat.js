// @ts-check
import { appendMessageToChat, inputForm, inputField, referenceContainer, referenceLabel, clearReferenceBtn } from "./components/chat-ui.js";
// Import clearer-named helper to call /api/chat (easier to understand for beginners)
import { messageHistory, persistUserMessage, handleAssistantResponse } from "./chat-helpers.js";

// state: current selection reference and history (state)
let currentReference = null;

// API
export function setComposerReference(referenceObject) { // sets the current 3D selection as a chat reference to link a message to a picked item
  currentReference = referenceObject;
  referenceLabel.textContent = referenceObject.label;
  referenceContainer.classList.remove('hidden');
}

export function clearComposerReference() {              // clears the current chat reference
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
inputForm.addEventListener('submit', async e => {                                              // collect message and append to UI to render the message
  e.preventDefault();
  const text = (/** @type {HTMLInputElement} */ (inputField)).value.trim();
  if (!text) return;

  const userMessage = { time: Date.now(), reference: currentReference, text, sender: 'user' }; // compose message object (payload) to store what we need for explicit user message object
  persistUserMessage(userMessage);

  (/** @type {HTMLInputElement} */ (inputField)).value = '';
  inputField.focus();
  clearComposerReference();

  // Call local chat API and append assistant reply (What: talk to our /api/chat so AI can answer)
  await handleAssistantResponse(text, userMessage);
});

// render saved chat history
messageHistory.forEach(appendMessageToChat);

