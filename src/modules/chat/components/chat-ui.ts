import { escapeHTML } from "../../../core/utils.js";

export const chatMessages = document.getElementById('chat-messages') as HTMLElement;
export const inputForm = document.getElementById('input-form') as HTMLFormElement;
export const inputField = document.getElementById('input-field') as HTMLInputElement;
export const referenceContainer = document.getElementById('chat-reference-container') as HTMLElement;
export const referenceLabel = document.getElementById('chat-reference-label') as HTMLElement;
export const clearReferenceBtn = document.getElementById('clear-reference-btn') as HTMLButtonElement;
export const aiToggle = document.getElementById('ai-toggle') as HTMLInputElement | null;

function createReferenceChip(reference) {                // creates a clickable chip that jumps back to the 3D selection (UI chip)
  const clickableRefTag = document.createElement('div'); // container element for the chip
  clickableRefTag.classList.add('message-reference');
  clickableRefTag.textContent = reference.label;
  clickableRefTag.dataset.modelId = reference.modelId;   // store modelId to target the correct model
  clickableRefTag.dataset.itemId = reference.itemId;     // store itemId to target the specific element
  clickableRefTag.addEventListener('click', () => {      // on click, re-select and highlight in 3D (interaction) to restore the selection from chat
    if (clickableRefTag.dataset.itemId) {                // avoid missing id (guard) to prevent invalid highlighting
      window.applyChatSelHighlight({                     // trigger global highlighter
        modelId: clickableRefTag.dataset.modelId,
        itemId: +clickableRefTag.dataset.itemId,         // convert to number (type cast) to ensure numeric id
      });
    }
  });
  return clickableRefTag;
}

export function appendMessageToChat({ text, time, reference, sender }, { historyIndex = null } = {}) { // renders a message in the chat (DOM update)
  const msgWrapper = document.createElement('div');       // build wrapper and mark as self (message DOM) to style it as the sender
  const isSelf = sender ? sender === 'user' : true;       // decide side based on sender (default user/self for backwards-compat)
  msgWrapper.classList.add('message-wrapper');
  if (isSelf) msgWrapper.classList.add('self');           // only user messages get the 'self' style (orange, right)

  if (reference && reference.label) {                     // if reference exists, show chip (context link) to associate the message with a selection
    const ref = createReferenceChip(reference);           // reuse builder to keep DOM consistent
    msgWrapper.appendChild(ref);                          // place chip above the message (generation a clickable UI element in layout)
  }

  const chatMsgContainer = document.createElement('div');
  chatMsgContainer.classList.add('message');
  chatMsgContainer.innerHTML = escapeHTML(text);          // escape user text before inserting (XSS protection)

  const messageControls = document.createElement('div');                               // top-right controls inside each message bubble
  messageControls.classList.add('message__controls');

  const selectButton = document.createElement('button');                               // circle selection button
  selectButton.classList.add('message__select-btn');
  selectButton.type = 'button';
  selectButton.setAttribute('aria-label', 'Select message');
  selectButton.setAttribute('aria-pressed', 'false');

  const deleteButton = document.createElement('button');                               // trash bin delete button
  deleteButton.classList.add('message__delete-btn');
  deleteButton.type = 'button';
  deleteButton.textContent = '🗑️';
  deleteButton.setAttribute('aria-label', 'Delete message');
  deleteButton.addEventListener('click', () => {                                       // click asks browser confirmation first
    const isDeleteConfirmed = window.confirm('Are you sure you want to delete this message?');
    if (!isDeleteConfirmed || !Number.isInteger(historyIndex)) return;                 // stop when canceled or index is missing
    chatMessages.dispatchEvent(new CustomEvent('chat-message-delete', {
      detail: { historyIndex },                                                         // send exact history index to chat.js
    }));
  });

  selectButton.addEventListener('click', () => {                                       // toggle selected state for this bubble
    const isSelected = chatMsgContainer.classList.toggle('message--selected');
    selectButton.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
  });

  messageControls.appendChild(deleteButton);
  messageControls.appendChild(selectButton);
  chatMsgContainer.appendChild(messageControls);

  const chatMeta = document.createElement('div');
  chatMeta.classList.add('meta');
  chatMeta.textContent = new Date(time).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  msgWrapper.appendChild(chatMsgContainer);
  msgWrapper.appendChild(chatMeta);
  chatMessages.appendChild(msgWrapper);
  chatMessages.scrollTop = chatMessages.scrollHeight;   // auto-scroll to newest message (auto-scroll)
}


