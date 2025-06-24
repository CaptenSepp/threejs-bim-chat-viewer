/* Chat-Elemente abgreifen */
const chatMessages = document.getElementById('chat-messages');
const inputField   = document.getElementById('input-field');
const sendBtn      = document.getElementById('send-btn');

/* ---------- Hilfsfunktionen ---------- */
function updateSendButton() {
  sendBtn.disabled = inputField.value.trim().length === 0;
}

function addMessage(text, author = 'Du') {
  const wrapper = document.createElement('div');
  wrapper.classList.add('message-wrapper');
  if (author === 'Du') wrapper.classList.add('self');

  const bubble = document.createElement('div');
  bubble.classList.add('message');
  bubble.textContent = text;

  const meta = document.createElement('div');
  meta.classList.add('meta');
  const timestamp = new Date().toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
  });
  meta.textContent = `${author} • ${timestamp}`;

  wrapper.append(bubble, meta);
  chatMessages.appendChild(wrapper);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function handleSend() {
  const msg = inputField.value.trim();
  if (!msg) return;
  addMessage(msg, 'Du');
  inputField.value = '';
  updateSendButton();
}

/* ---------- Event-Listener ---------- */
inputField.addEventListener('input', updateSendButton);
sendBtn.addEventListener('click', handleSend);

inputField.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
});

/* ---------- Initial ---------- */
updateSendButton();
addMessage('Hallo Martin.', 'System');
addMessage('Hallo Jakob, wie kann ich dir helfen?', 'Du');
addMessage('Ich habe eine Frage bezüglich dieses Teils des Models.', 'System');
addMessage('Ja, natürlich, schieß los. Du kannst gerne darauf klicken und kommentieren.', 'Du');
