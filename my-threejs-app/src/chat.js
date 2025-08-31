import { addMsgToDOM, inputForm as chatInputForm, inputField as chatInputField, referenceContainer, referenceLabel, clearReferenceBtn } from "./chat-ui.js";

const STORAGE_KEY = 'chat-history';

// State
let currentReference = null;
const messageHistory = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

// API
export function setReference(referenceObject) { // Connecting 3D → Chat
  currentReference = referenceObject;
  referenceLabel.textContent = referenceObject.label;
  referenceContainer.classList.remove('hidden');
}

export function clearReference() {
  currentReference = null;
  referenceLabel.textContent = '';
  referenceContainer.classList.add('hidden');
}

// Event listeners
clearReferenceBtn.addEventListener('click', clearReference);

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

  const msg = {time: Date.now(), reference: currentReference, text};
  messageHistory.push(msg);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messageHistory));
  addMsgToDOM(msg);

  chatInputField.value = '';
  chatInputField.focus();
  clearReference();
});

// Initialization
messageHistory.forEach(addMsgToDOM);