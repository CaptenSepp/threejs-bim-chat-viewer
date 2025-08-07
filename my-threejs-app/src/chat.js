import { addMsgToDOM, form, input, referenceContainer, referenceText, clearReferenceBtn } from "./chat-ui.js";

const STORAGE_KEY = 'chat-history';

// State
let currentReference = null;
const messages = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

// API
export function setReference(ref) {
  currentReference = ref;
  referenceText.textContent = ref.label;
  referenceContainer.classList.remove('hidden');
}

export function clearReference() {
  currentReference = null;
  referenceText.textContent = '';
  referenceContainer.classList.add('hidden');
}

// Event listeners
clearReferenceBtn.addEventListener('click', clearReference);

input.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  }
});

form.addEventListener('submit', e => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;

  const msg = { text, time: Date.now(), reference: currentReference };
  messages.push(msg);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  addMsgToDOM(msg);

  input.value = '';
  input.focus();
  clearReference();
});

// Initialization
messages.forEach(addMsgToDOM);