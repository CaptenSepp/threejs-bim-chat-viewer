// @ts-check
import { appendMessageToChat } from "./components/chat-ui.js";
import { requestAssistantReplyForUserMessage } from "../../api/request-assistant-reply-api.js"; // Use descriptive function name
import { displayUserErrorSnackbar } from "../../ui/error-notify.js";

const STORAGE_KEY = 'chat-history';

export const messageHistory = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

export function persistUserMessage(userMessage) {
  messageHistory.push(userMessage);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messageHistory));       // persist to local storage to restore chat after reload
  appendMessageToChat(userMessage);                                        // render user message
}

export async function handleAssistantResponse(text, userMessage) {
  try {                                                                    // Try block to catch any network or server errors (error handling)
    const assistantReplyText = await requestAssistantReplyForUserMessage({ // Ask server for AI reply using explicit names
      userMessageText: text,                                               // The text the user just typed
      previousChatHistory: messageHistory,                                 // Pass current chat history for context
      selectedModelReference: userMessage.reference                        // Optional 3D selection pass the user message reference
    });
    const assistantMessage = { time: Date.now(), reference: null, text: assistantReplyText || '...', sender: 'assistant' }; // Build assistant message (fallback '...') mark as assistant/system side
    persistAssistantMessage(assistantMessage);
  } catch (err) {                                                          // If anything fails, show a readable error message (catch)
    const errMsg = { time: Date.now(), reference: null, text: `Fehler: ${(err && err.message) || 'Unbekannt'}`, sender: 'system' }; // Create an error message to display (UX) mark as system error message (left, grey)
    persistErrorMessage(errMsg);
    displayUserErrorSnackbar(errMsg.text);
  }
}

function persistAssistantMessage(assistantMessage) {
  messageHistory.push(assistantMessage);                             // Save assistant message to in-memory array
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messageHistory)); // Persist updated chat with the AI reply
  appendMessageToChat(assistantMessage);                             // Show the AI answer in the chat UI
}

function persistErrorMessage(errMsg) {
  messageHistory.push(errMsg);                                       // Store the error message in history (state)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messageHistory)); // Persist the error in localStorage (persistence)
  appendMessageToChat(errMsg);                                       // Show the error in the chat so the user knows (feedback)
}

