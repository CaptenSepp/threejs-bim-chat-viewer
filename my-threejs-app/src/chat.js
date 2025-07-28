/* ------------------------------------------
 *  Sehr einfaches Chat-Frontend
 *  – keine Server-Calls, rein lokal
 * ------------------------------------------ */
const log   = document.getElementById('chat-log');
const form  = document.getElementById('chat-form');
const input = document.getElementById('chat-input');

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
  const div     = document.createElement('div');
  const date    = new Date(time).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
  div.innerHTML = `<span style="opacity:.6;font-size:.75rem">${date}</span><br>${escapeHTML(text)}`;
  div.style.marginBottom = '1rem';
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;         // automatisch nach unten scrollen
}

/* 4. Kleiner XSS-Schutz */
function escapeHTML(str){
  return str.replace(/[&<>"']/g, m => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  }[m]));
}
