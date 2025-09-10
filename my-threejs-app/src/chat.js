import { appendMessageToChat, inputForm, inputField, referenceContainer, referenceLabel, clearReferenceBtn } from "./chat-ui.js";
// Client helper to call local /api/chat
import { sendChat } from "./chat-api.js";

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

  // Call local chat API and append assistant reply
  try {
    const reply = await sendChat({ text, history: messageHistory, reference: message.reference });
    const aiMessage = { time: Date.now(), reference: null, text: reply || '...' };
    messageHistory.push(aiMessage);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messageHistory));
    appendMessageToChat(aiMessage);
  } catch (err) {
    const errMsg = { time: Date.now(), reference: null, text: `Fehler: ${(err && err.message) || 'Unbekannt'}` };
    messageHistory.push(errMsg);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messageHistory));
    appendMessageToChat(errMsg);
  }
});

// render saved chat history
messageHistory.forEach(appendMessageToChat);
