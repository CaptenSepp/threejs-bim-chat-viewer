/* ------------------------------------------
 *  Sehr einfaches Chat-Frontend
 *  – keine Server-Calls, rein lokal
 * ------------------------------------------ */
const log   = document.getElementById('chat-messages');
const form  = document.getElementById('input-elements');
const input = document.getElementById('input-field');

// elements for optional message references
const referenceContainer = document.getElementById('chat-reference-container');
const referenceText = document.getElementById('chat-reference-text');
const clearReferenceBtn = document.getElementById('clear-reference-btn');

let currentReference = null;

export function setReference(ref){
  currentReference = ref;
  referenceText.textContent = ref.label;
  referenceContainer.classList.remove('hidden');
}

export function clearReference(){
  currentReference = null;
  referenceText.textContent = '';
  referenceContainer.classList.add('hidden');
}

clearReferenceBtn.addEventListener('click', clearReference);

input.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    form.dispatchEvent(new Event('submit', {bubbles: true, cancelable: true}));
  }
});

/* 1. Vorhandene Nachrichten aus localStorage laden */
const STORAGE_KEY = 'chat-history';
const messages = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
messages.forEach(addMsgToDOM);

/* 2. Formular-Submit */
form.addEventListener('submit', e => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;

  /* Speichern & anzeigen */
  const msg = { text, time: Date.now(), reference: currentReference };
  messages.push(msg);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  addMsgToDOM(msg);

  input.value = '';
  input.focus();
  clearReference();
});

/* 3. Helfer: Nachricht in DOM einsetzen */
function addMsgToDOM({ text, time, reference }){
  const wrapper = document.createElement('div');
  wrapper.classList.add('message-wrapper','self');
  if(reference && reference.label){
    const ref = document.createElement('div');
    ref.classList.add('message-reference');
    ref.textContent = reference.label;
    wrapper.appendChild(ref);
  }

  const message = document.createElement('div');
  message.classList.add('message');
  message.innerHTML = escapeHTML(text);

  const meta = document.createElement('div');
  meta.classList.add('meta');
  meta.textContent = new Date(time).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });

  wrapper.appendChild(message);
  wrapper.appendChild(meta);
  log.appendChild(wrapper);
  log.scrollTop = log.scrollHeight; // automatisch nach unten scrollen
}

/* 4. Kleiner XSS-Schutz */
function escapeHTML(str){
  return str.replace(/[&<>"']/g, m => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  }[m]));
}