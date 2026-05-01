import { aiToggle, appendMessageToChat, chatMessages, clearReferenceBtn, inputField, inputForm, referenceContainer, referenceLabel } from "./components/chat-ui.js";
import { handleAssistantResponse, messageHistory, pushHistoryUserMessage, removeHistoryMessageByIndex } from "./chat-helpers.js";
import type { ChatMessageType, ModelReferenceType } from "../../types/app-types.js";

let currentReference: ModelReferenceType | null = null;     // current selection reference and history

function isChatDeleteEvent(
  event: Event,
): event is CustomEvent<{ historyIndex?: number }> {
  return event instanceof CustomEvent;
}

// API
export function setComposerReference(referenceObject: ModelReferenceType) { // sets the current 3D selection as a chat reference to link a message to a picked item
  currentReference = referenceObject;
  referenceLabel.textContent = referenceObject.label;
  referenceContainer.classList.remove('hidden');
}

export function clearComposerReference() {              // clears the current chat reference
  currentReference = null;
  referenceLabel.textContent = '';
  referenceContainer.classList.add('hidden');
}

clearReferenceBtn.addEventListener('click', clearComposerReference);// event listeners for reference chip and input

inputField.addEventListener('keydown', e => {           // send on Enter
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();                                 // stop the browser from perfomign a full-page reload
    inputForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  }
});

function renderMessageHistory() {                       // keeps DOM list in sync with messageHistory order
  chatMessages.innerHTML = '';
  messageHistory.forEach((message, historyIndex) => {   // pass current index for per-message delete buttons
    appendMessageToChat(message, { historyIndex });
  });
}

chatMessages.addEventListener('chat-message-delete', e => {             // receives delete requests from the bubble button
  if (!isChatDeleteEvent(e)) return;                                    // stop if event payload is not our custom event
  const historyIndex = Number.isInteger(e.detail?.historyIndex) ? e.detail.historyIndex : null;
  if (!removeHistoryMessageByIndex(historyIndex)) return;              // stop when index is not valid anymore
  renderMessageHistory();                                               // rebuild so all delete indexes stay correct
});

// Make the submit handler async so we can await the server reply
inputForm.addEventListener('submit', async e => {                                              // collect message and append to UI to render the message
  e.preventDefault();
  const text = inputField.value.trim();
  if (!text) return;                                                                           // return empty if no text (do nothing)

  const userMessage: ChatMessageType = { time: Date.now(), reference: currentReference, text, sender: 'user' }; // compose message object (payload) to store what we need for explicit user message object
  pushHistoryUserMessage(userMessage);

  inputField.value = '';
  inputField.focus();
  clearComposerReference();

  if (aiToggle && aiToggle.checked) {                                                          // Call AI only when the toggle is enabled
    await handleAssistantResponse(text, userMessage);
  }

});

renderMessageHistory();                                      // render saved chat history with delete buttons
