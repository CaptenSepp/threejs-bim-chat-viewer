import {
  buildPromptData,
  fetchAssistantReplyText,
  getGoogleModels,
} from "../tools/vite.chat-proxy-helpers.js";
import type { AssistantReplyRequestBody } from "../tools/vite.chat-proxy-helpers.js";

export async function POST(request: Request) {
  // Only POST is supported here because the chat sends JSON data.
  try {
    // Read the JSON body sent by the browser.
    const requestBody: AssistantReplyRequestBody = await request.json();
    // Build the same prompt text that local dev already uses.
    const { userMessageText, promptText } = buildPromptData(requestBody);

    // Stop early if the message is empty.
    if (!userMessageText) {
      return Response.json({ error: "Missing message" }, { status: 400 });
    }

    // Read both secret keys from Vercel environment variables.
    const groqApiKey = process.env.GROQ_API_KEY;
    const googleApiKey = process.env.GOOGLE_API_KEY;
    // At least one provider must be configured on the server.
    if (!groqApiKey && !googleApiKey) {
      return Response.json(
        { error: "GROQ_API_KEY and GOOGLE_API_KEY missing" },
        { status: 500 },
      );
    }

    // Ask Groq first, then use Google if Groq fails.
    const assistantReplyText = await fetchAssistantReplyText(
      getGoogleModels(),
      promptText,
      googleApiKey,
      groqApiKey,
    );

    // Return a gateway-style error if upstream fails.
    if (!assistantReplyText) {
      return Response.json({ error: "Upstream error" }, { status: 502 });
    }

    // Send the assistant reply back to the browser.
    return Response.json({ reply: assistantReplyText }, { status: 200 });
  } catch {
    // Hide internal details and return one simple server error.
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
