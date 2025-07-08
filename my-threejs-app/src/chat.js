/* Chat-DOM-Elemente ------------------------------------------------------- */
const chatMessages  = document.getElementById('chat-messages');
const inputField    = document.getElementById('input-field');
const sendBtn       = document.getElementById('send-btn');
const refBox        = document.getElementById('chat-reference-container');
const refText       = document.getElementById('chat-reference-text');
const clearRefBtn   = document.getElementById('clear-reference-btn');

let currentRef = null;

/* Hilfsfunktionen --------------------------------------------------------- */
function adjustTextareaHeight() {
  inputField.style.height = 'auto';
  inputField.style.height = `${inputField.scrollHeight}px`;

  const minH = parseFloat(getComputedStyle(document.documentElement)
                .getPropertyValue('--input-min-height'));
  sendBtn.style.height = `${Math.max(minH, inputField.clientHeight)}px`;
}
function updateSendButton() {
  sendBtn.disabled = inputField.value.trim() === '';
  adjustTextareaHeight();
}
function addMessage(text, author='Du', objectRef=null) {
  const wrap  = document.createElement('div');
  wrap.className = `message-wrapper${author==='Du' ? ' self' : ''}`;

  const bubble = document.createElement('div');
  bubble.className = 'message';

  if (objectRef) {
    const span = document.createElement('span');
    span.className = 'message-reference';
    span.textContent = `Referenz: ${objectRef}`;
    bubble.append(span);
  }
  bubble.append(text);

  const meta = document.createElement('div');
  meta.className = 'meta';
  meta.textContent = `${author} • ${new Date().toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})}`;

  wrap.append(bubble, meta);
  chatMessages.append(wrap);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}
function send() {
  const msg = inputField.value.trim();
  if (!msg) return;
  addMessage(msg, 'Du', currentRef);
  inputField.value = '';
  clearRef();
  updateSendButton();
}

/* Objekt-Referenz-API ----------------------------------------------------- */
function setRef(name) {
  currentRef = name;
  refText.textContent = `Referenz: ${name}`;
  refBox.classList.remove('hidden');
  inputField.focus();
  adjustTextareaHeight();
}
function clearRef() {
  currentRef = null;
  refBox.classList.add('hidden');
  refText.textContent = '';
  adjustTextareaHeight();
}

/* Event-Listener ---------------------------------------------------------- */
inputField.addEventListener('input', updateSendButton);
inputField.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    send();
  }
});
sendBtn.addEventListener('click', send);
clearRefBtn.addEventListener('click', clearRef);

/* Initialisierung --------------------------------------------------------- */
updateSendButton();
addMessage('Hallo Martin.', 'System');
addMessage('Hallo Jakob, wie kann ich dir helfen?', 'Du');
addMessage('Ich habe eine Frage bezüglich dieses Teils des Models.', 'System');
addMessage('Ja, natürlich, schieß los. Du kannst gerne darauf klicken und kommentieren.', 'Du');

/* Globale API für Three.js ----------------------------------------------- */
window.chatAPI = { setObjectReferenceForChat: setRef, clearObjectReference: clearRef };
