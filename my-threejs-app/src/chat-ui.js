import { escapeHTML } from "./utils.js";

export const chatMessages = document.getElementById('chat-messages');
export const inputForm = document.getElementById('input-form');
export const inputField = document.getElementById('input-field');
export const referenceContainer = document.getElementById('chat-reference-container');
export const referenceLabel = document.getElementById('chat-reference-label');
export const clearReferenceBtn = document.getElementById('clear-reference-btn');

export function addMsgToDOM({ text, time, reference }) {
  const wrapper = document.createElement('div');
  wrapper.classList.add('message-wrapper', 'self');

  if (reference && reference.label) {
    const ref = document.createElement('div');
    ref.classList.add('message-reference');
    ref.textContent = reference.label;
    ref.dataset.modelId = reference.modelId;
    ref.dataset.itemId = reference.itemId;
    ref.addEventListener('click', () => {
      if (ref.dataset.itemId) {
        window.highlightFromChat({
          modelId: ref.dataset.modelId,
          itemId: +ref.dataset.itemId,
        });
      }
    });
    wrapper.appendChild(ref);
  }

  const message = document.createElement('div');
  message.classList.add('message');
  message.innerHTML = escapeHTML(text);

  const meta = document.createElement('div');
  meta.classList.add('meta');
  meta.textContent = new Date(time).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  wrapper.appendChild(message);
  wrapper.appendChild(meta);
  chatMessages.appendChild(wrapper);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}
