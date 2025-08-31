import { appendMessageToChat, inputForm as chatInputForm, inputField as chatInputField, referenceContainer, referenceLabel, clearReferenceBtn } from "./chat-ui.js";

const STORAGE_KEY = 'chat-history';

// State
let currentReference = null;
const messageHistory = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

// API
export function setComposerReference(referenceObject) { // Connecting 3D to Chat
  currentReference = referenceObject;
  referenceLabel.textContent = referenceObject.label;
  referenceContainer.classList.remove('hidden');
}

export function clearComposerReference() {
  currentReference = null;
  referenceLabel.textContent = '';
  referenceContainer.classList.add('hidden');
}

// Back-compat named exports
export { setComposerReference as setReference };
export { clearComposerReference as clearReference };

// Event listeners
clearReferenceBtn.addEventListener('click', clearComposerReference);

chatInputField.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    chatInputForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  }
});

chatInputForm.addEventListener('submit', e => {
  e.preventDefault();
  const text = chatInputField.value.trim();
  if (!text) return;

  const message = { time: Date.now(), reference: currentReference, text };
  messageHistory.push(message);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messageHistory));
  appendMessageToChat(message);

  chatInputField.value = '';
  chatInputField.focus();
  clearComposerReference();
});

// Initialization
messageHistory.forEach(appendMessageToChat);

