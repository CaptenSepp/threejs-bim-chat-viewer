// @ts-check
import { aiToggle, appendMessageToChat, chatMessages, clearReferenceBtn, inputField, inputForm, referenceContainer, referenceLabel } from "./components/chat-ui.js";
import { handleAssistantResponse, messageHistory, pushHistoryUserMessage, removeHistoryMessageByIndex } from "./chat-helpers.js";

let currentReference = null;                            // current selection reference and history

// API
export function setComposerReference(referenceObject) { // sets the current 3D selection as a chat reference to link a message to a picked item
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

chatMessages.addEventListener('chat-message-delete', e => {            // receives delete requests from the bubble button
  const customEvent = /** @type {CustomEvent<{ historyIndex?: number }>} */ (e); // read custom payload safely in JS + @ts-check
  const historyIndex = Number.isInteger(customEvent.detail?.historyIndex) ? customEvent.detail.historyIndex : null;
  if (!removeHistoryMessageByIndex(historyIndex)) return;              // stop when index is not valid anymore
  renderMessageHistory();                                               // rebuild so all delete indexes stay correct
});

// Make the submit handler async so we can await the server reply
inputForm.addEventListener('submit', async e => {                                              // collect message and append to UI to render the message
  e.preventDefault();
  const text = (/** @type {HTMLInputElement} */ (inputField)).value.trim();
  if (!text) return;                                                                           // return empty if no text (do nothing)

  const userMessage = { time: Date.now(), reference: currentReference, text, sender: 'user' }; // compose message object (payload) to store what we need for explicit user message object
  pushHistoryUserMessage(userMessage);

  (/** @type {HTMLInputElement} */ (inputField)).value = '';
  inputField.focus();
  clearComposerReference();

  if (aiToggle && aiToggle.checked) {                                                          // Call AI only when the toggle is enabled
    await handleAssistantResponse(text, userMessage);
  }

});

renderMessageHistory();                                      // render saved chat history with delete buttons
