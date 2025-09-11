import { escapeHTML } from "../../../core/utils.js";

export const chatMessages = document.getElementById('chat-messages');
export const inputForm = document.getElementById('input-form');
export const inputField = document.getElementById('input-field');
export const referenceContainer = document.getElementById('chat-reference-container');
export const referenceLabel = document.getElementById('chat-reference-label');
export const clearReferenceBtn = document.getElementById('clear-reference-btn');

function createReferenceChip(reference) {    // creates a clickable chip that jumps back to the 3D selection (UI chip)
  const clickableRefTag = document.createElement('div'); // container element for the chip
  clickableRefTag.classList.add('message-reference');
  clickableRefTag.textContent = reference.label;
  clickableRefTag.dataset.modelId = reference.modelId;   // store modelId to target the correct model
  clickableRefTag.dataset.itemId = reference.itemId;     // store itemId to target the specific element
  clickableRefTag.addEventListener('click', () => {      // on click, re-select and highlight in 3D (interaction) to restore the selection from chat
    if (clickableRefTag.dataset.itemId) {                // avoid missing id (guard) to prevent invalid highlighting
      window.applyChatSelectionHighlight({   // trigger global highlighter
        modelId: clickableRefTag.dataset.modelId,
        itemId: +clickableRefTag.dataset.itemId,         // convert to number (type cast) to ensure numeric id
      });
    }
  });
  return clickableRefTag;
}

export function appendMessageToChat({ text, time, reference }) { // renders a message in the chat (DOM update)
  const msgWrapper = document.createElement('div');       // build wrapper and mark as self (message DOM) to style it as the sender
  msgWrapper.classList.add('message-wrapper', 'self');

  if (reference && reference.label) {                     // if reference exists, show chip (context link) to associate the message with a selection
    const ref = createReferenceChip(reference);           // reuse builder to keep DOM consistent
    msgWrapper.appendChild(ref);                          // place chip above the message (layout)
  }

  const chatMsgContainer = document.createElement('div');
  chatMsgContainer.classList.add('message');
  chatMsgContainer.innerHTML = escapeHTML(text);          // escape user text before inserting (XSS protection)

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
