import { escapeHTML } from "./utils.js";

export const chatMessages = document.getElementById('chat-messages');
export const inputForm = document.getElementById('input-form');
export const inputField = document.getElementById('input-field');
export const referenceContainer = document.getElementById('chat-reference-container');
export const referenceLabel = document.getElementById('chat-reference-label');
export const clearReferenceBtn = document.getElementById('clear-reference-btn');

function createReferenceChip(reference) {     // builds the clickable reference element
  const ref = document.createElement('div'); //???: Dieses Tag dient als klickbarer Verweis zurǬck ins 3D-Modell? moved comment + container element
  ref.classList.add('message-reference');    // style class
  ref.textContent = reference.label;         // display label
  ref.dataset.modelId = reference.modelId;   // store modelId
  ref.dataset.itemId = reference.itemId;     // store itemId
  ref.addEventListener('click', () => {      //!!!: Klick auf das Referenz-Tag ��' 3D-Highlight  moved comment + click handler

    if (ref.dataset.itemId) {                // guard against missing id
      window.applyChatSelectionHighlight({   // invoke global highlighter
        modelId: ref.dataset.modelId,        // pass modelId
        itemId: +ref.dataset.itemId,         // ensure numeric id
      });
    }
  });
  return ref;                                // return built element
}

export function appendMessageToChat({ text, time, reference }) { // neue Nachricht in den Chat mit optionale Reference
  const msgWrapper = document.createElement('div');      // Erzeugt einen div pro Nachricht
  msgWrapper.classList.add('message-wrapper', 'self');   // self ist der Sender von Message

  if (reference && reference.label) {                    // gultige Referenz
    const ref = createReferenceChip(reference);           //???: Dieses Tag dient als klickbarer Verweis zuruck ins 3D-Modell?
    msgWrapper.appendChild(ref);                         // Referenz-Tag oberhalb der Nachricht
  }

  const chatMsgContainer = document.createElement('div');
  chatMsgContainer.classList.add('message');
  chatMsgContainer.innerHTML = escapeHTML(text);         // Benutzertext sicher als HTML (maskiert Sonderzeichen)

  const chatMeta = document.createElement('div');
  chatMeta.classList.add('meta');
  chatMeta.textContent = new Date(time).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  msgWrapper.appendChild(chatMsgContainer);
  msgWrapper.appendChild(chatMeta);
  chatMessages.appendChild(msgWrapper);
  chatMessages.scrollTop = chatMessages.scrollHeight;   // Scrollt die Chatliste ans Ende
}
