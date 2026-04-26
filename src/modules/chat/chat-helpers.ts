import { appendMessageToChat } from "./components/chat-ui.js";
import { requestAssistantReplyForUserMessage } from "../../api/request-assistant-reply-api.js";
import { displayUserErrorSnackbar } from "../../ui/error-notify.js";
import type { ChatMessageType } from "../../types/app-types.js";

const STORAGE_KEY = "chat-history";

export const messageHistory = JSON.parse(
  localStorage.getItem(STORAGE_KEY) || "[]",
) as ChatMessageType[];

export function pushHistoryUserMessage(userMessage: ChatMessageType) {
  messageHistory.push(userMessage);
  const historyIndex = messageHistory.length - 1; // capture index of the newly stored message
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messageHistory)); // Push (Persist) to local storage to restore chat after reload
  appendMessageToChat(userMessage, { historyIndex }); // Render user message with delete target index
}

export function removeHistoryMessageByIndex(
  historyIndex: number | null | undefined,
) {
  const isIndexValid =
    Number.isInteger(historyIndex) &&
    historyIndex >= 0 &&
    historyIndex < messageHistory.length;
  if (!isIndexValid) return false; // stop when the selected index does not exist

  messageHistory.splice(historyIndex, 1); // remove the selected message only
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messageHistory)); // keep storage in sync with the array
  return true; // report that one selected message was removed
}

function pushAssistantMessage(assistantMessage: ChatMessageType) {
  messageHistory.push(assistantMessage); // Save assistant message to in-memory array
  const historyIndex = messageHistory.length - 1; // capture index to enable per-message deletion
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messageHistory)); // Persist updated chat with the AI reply
  appendMessageToChat(assistantMessage, { historyIndex }); // Show the AI answer in the chat UI
}

function pushErrorMessage(errMsg: ChatMessageType) {
  messageHistory.push(errMsg); // Store the error message in history (state)
  const historyIndex = messageHistory.length - 1; // capture index to enable per-message deletion
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messageHistory)); // Persist the error in localStorage (persistence)
  appendMessageToChat(errMsg, { historyIndex }); // Show the error in the chat so the user knows (feedback)
}

/**
 * @param {string} text
 * @param {{ time: number; reference: import("../../types/app-types.js").ModelReference | null; text: string; sender: "user" | "assistant" | "system"; }} userMessage
 */
export async function handleAssistantResponse(
  text: string,
  userMessage: ChatMessageType,
) {
  try {
    // Network or server errors (error handling)
    const assistantReplyText = await requestAssistantReplyForUserMessage({
      // Ask server for AI reply
      userMessageText: text, // The text the user types
      previousChatHistory: messageHistory, // Pass current chat history
      selectedModelReference: userMessage.reference, // Optional 3D selection pass the user message reference
    });
    const assistantMessage: ChatMessageType = {
      time: Date.now(),
      reference: null,
      text: assistantReplyText || "...",
      sender: "assistant",
    }; // Build assistant message, mark as assistant/system side
    pushAssistantMessage(assistantMessage);
  } catch (err) {
    // Show a readable error message
    const errorMessage = err instanceof Error ? err.message : "Unbekannt";
    const errMsg: ChatMessageType = {
      time: Date.now(),
      reference: null,
      text: `Fehler: ${errorMessage}`,
      sender: "system",
    }; // Create an error message to display, mark as system
    pushErrorMessage(errMsg);
    displayUserErrorSnackbar(errMsg.text);
  }
}
