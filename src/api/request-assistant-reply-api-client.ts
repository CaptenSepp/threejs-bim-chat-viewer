//Request an assistant reply for a user message
//Input: object with userMessageText (string), previousChatHistory (array, optional), selectedModelReference (ModelReference|null, optional)
//Output: Promise that resolves to assistant reply text (string)

import type {
  ApiReplyType,
  ChatMessageType,
  ModelReferenceType,
} from "../types/app-types";
import { postReqWithJson } from "../services/http-client.js";

type AssistantReplyRequestBody = {
  message: string;
  history: ChatMessageType[];
  reference: ModelReferenceType | null;
};

type RequestAssistantReplyParams = {
  userMessageText: string;
  previousChatHistory?: ChatMessageType[];
  selectedModelReference?: ModelReferenceType | null;
};

export async function requestAssistantReplyForUserMessage({
  userMessageText,
  previousChatHistory = [],
  selectedModelReference = null,
}: RequestAssistantReplyParams): Promise<string> {
  const requestBody: AssistantReplyRequestBody = {
    // Send request to our API endpoint (dev proxy (or prod function)); insdie: fetch('/api/assistant-reply', { method: 'POST', … })
    message: userMessageText, // The actual text the user typed
    history: previousChatHistory, // short history of the chat
    reference: selectedModelReference, // 3D selection reference to a selected model item
  };

  const data = await postReqWithJson<ApiReplyType, AssistantReplyRequestBody>(
    "/api/assistant-reply",
    requestBody,
  );

  return data.reply || ""; // Return assistant reply text or empty string if missing to keep UI stable when reply is absent
}
