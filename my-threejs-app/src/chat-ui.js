import { escapeHTML } from "./utils.js";

export const chatMessages = document.getElementById('chat-messages');
export const inputForm = document.getElementById('input-form');
export const inputField = document.getElementById('input-field');
export const referenceContainer = document.getElementById('chat-reference-container');
export const referenceLabel = document.getElementById('chat-reference-label');
export const clearReferenceBtn = document.getElementById('clear-reference-btn');

function createReferenceTag(reference) { // NEW: builds the clickable reference element
  const ref = document.createElement('div'); //???: Dieses Tag dient als klickbarer Verweis zurǬck ins 3D-Modell? // NEW: moved comment + container element
  ref.classList.add('message-reference'); // NEW: style class
  ref.textContent = reference.label; // NEW: display label
  ref.dataset.modelId = reference.modelId; // NEW: store modelId
  ref.dataset.itemId = reference.itemId; // NEW: store itemId
  ref.addEventListener('click', () => { //!!!: Klick auf das Referenz-Tag ��' 3D-Highlight  // NEW: moved comment + click handler
    if (ref.dataset.itemId) { // NEW: guard against missing id
      window.highlightFromChat({ // NEW: invoke global highlighter
        modelId: ref.dataset.modelId, // NEW: pass modelId
        itemId: +ref.dataset.itemId, // NEW: ensure numeric id
      });
    }
  });
  return ref; // NEW: return built element
}

export function addMsgToDOM({ text, time, reference }) { // neue Nachricht in den Chat mit optionale Reference
  const msgWrapper = document.createElement('div');      // Erzeugt einen div pro Nachricht
  msgWrapper.classList.add('message-wrapper', 'self');   // self ist der Sender von Message

  if (reference && reference.label) {                    // gültige Referenz
    const ref = document.createElement('div');           //???: Dieses Tag dient als klickbarer Verweis zurück ins 3D-Modell?
    ref.classList.add('message-reference');
    ref.textContent = reference.label;                   // z.B. "Item 123"
    ref.dataset.modelId = reference.modelId;             // Speichert die modelId
    ref.dataset.itemId = reference.itemId;               // Speichert die itemId
    ref.addEventListener('click', () => {                //!!!: Klick auf das Referenz-Tag → 3D-Highlight 
      if (ref.dataset.itemId) {
        window.highlightFromChat({                       // Ruft die GLOBALE Funktion auf
          modelId: ref.dataset.modelId,
          itemId: +ref.dataset.itemId,
        });
      }
    });
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
