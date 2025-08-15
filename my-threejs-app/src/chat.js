import { addMsgToDOM, inputForm as inputForm, inputField, referenceContainer, referenceLabel, clearReferenceBtn } from "./chat-ui.js";

const STORAGE_KEY = 'chat-history';

// State
let currentReference = null;
const messages = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

// API
export function setReference(ref) { // Kopplung 3D → Chat
  currentReference = ref;
  referenceLabel.textContent = ref.label;
  referenceContainer.classList.remove('hidden');
}

export function clearReference() {
  currentReference = null;
  referenceLabel.textContent = '';
  referenceContainer.classList.add('hidden');
}

// Event listeners
clearReferenceBtn.addEventListener('click', clearReference);

inputField.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    inputForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  }
});

inputForm.addEventListener('submit', e => {
  e.preventDefault();
  const text = inputField.value.trim(); // Verhindert Whitespace
  if (!text) return;

  const msg = {time: Date.now(), reference: currentReference, text};
  messages.push(msg);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  addMsgToDOM(msg);

  inputField.value = '';
  inputField.focus();
  clearReference();
});

// Initialization
messages.forEach(addMsgToDOM);