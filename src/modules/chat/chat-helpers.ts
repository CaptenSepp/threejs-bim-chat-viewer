import { appendMessageToChat } from "./components/chat-ui.js";
import { requestAssistantReplyForUserMessage } from "../../api/request-assistant-reply-api-client.js";
import { displayUserErrorSnackbar } from "../../ui/error-notify.js";
import type { ChatMessageType } from "../../types/app-types.js";

const STORAGE_KEY = "chat-history";

function isChatMessage(value: object): value is ChatMessageType {
  return (
    "time" in value &&
    typeof value.time === "number" &&
    "reference" in value &&
    "text" in value &&
    typeof value.text === "string" &&
    "sender" in value &&
    (value.sender === "user" || value.sender === "assistant" || value.sender === "system")
  );
}

function parseStoredMessageHistory(): ChatMessageType[] {
  try {
    const parsedHistory = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(parsedHistory)) return [];
    return parsedHistory.filter(
      (item): item is ChatMessageType => !!item && typeof item === "object" && isChatMessage(item),
    );
  } catch {
    return [];
  }
}

export const messageHistory = parseStoredMessageHistory();

function pushChatMessage(message: ChatMessageType) {
  messageHistory.push(message); // Save message to in-memory chat history
  const historyIndex = messageHistory.length - 1; // capture index of the newly stored message
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messageHistory)); // Persist chat history after every change
  appendMessageToChat(message, { historyIndex }); // Render message with delete target index
}

export function pushHistoryUserMessage(userMessage: ChatMessageType) {
  pushChatMessage(userMessage);
}

export function removeHistoryMessageByIndex(
  historyIndex: number | null | undefined,
) {
  if (typeof historyIndex !== "number") return false; // stop when the index is missing
  if (!Number.isInteger(historyIndex)) return false; // stop when the index is not a whole number
  if (historyIndex < 0 || historyIndex >= messageHistory.length) return false; // stop when the index is outside the history

  messageHistory.splice(historyIndex, 1); // remove the selected message only
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messageHistory)); // keep storage in sync with the array
  return true; // report that one selected message was removed
}


function pushAssistantMessage(assistantMessage: ChatMessageType) {
  pushChatMessage(assistantMessage); // Save, persist, and render assistant reply
}

function pushErrorMessage(errMsg: ChatMessageType) {
  pushChatMessage(errMsg); // Save, persist, and render the error message
}

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
    await new Promise((resolve) => setTimeout(resolve, 2000));
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
