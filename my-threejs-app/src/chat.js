/* ------------------------------------------
 *  Sehr einfaches Chat-Frontend
 *  – keine Server-Calls, rein lokal
 * ------------------------------------------ */
const log   = document.getElementById('chat-messages');
const form  = document.getElementById('input-elements');
const input = document.getElementById('input-field');

input.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    form.dispatchEvent(new Event('submit', {bubbles: true, cancelable: true}));
  }
});

/* 1. Vorhandene Nachrichten aus localStorage laden */
const STORAGE_KEY = 'ifc-chat';
const messages = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
messages.forEach(addMsgToDOM);

/* 2. Formular-Submit */
form.addEventListener('submit', e => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;

  /* Speichern & anzeigen */
  const msg = { text, time: Date.now() };
  messages.push(msg);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  addMsgToDOM(msg);

  input.value = '';
  input.focus();
});

/* 3. Helfer: Nachricht in DOM einsetzen */
function addMsgToDOM({ text, time }){
  const wrapper = document.createElement('div');
  wrapper.classList.add('message-wrapper','self');

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