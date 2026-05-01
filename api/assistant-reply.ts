import {
  buildPromptData,
  fetchAssistantReplyText,
  getGoogleModels,
} from "../tools/vite.chat-proxy-helpers.js";

type AssistantReplyRequestBody = {
  message?: unknown;
  history?: unknown;
  reference?: unknown;
};

export async function POST(request: Request) {
  // Only POST is supported here because the chat sends JSON data.
  try {
    // Read the JSON body sent by the browser.
    const requestBody = (await request.json()) as AssistantReplyRequestBody;
    // Build the same prompt text that local dev already uses.
    const { userMessageText, promptText } = buildPromptData(requestBody);

    // Stop early if the message is empty.
    if (!userMessageText) {
      return Response.json({ error: "Missing message" }, { status: 400 });
    }

    // Read the secret key from Vercel environment variables.
    const googleApiKey = process.env.GOOGLE_API_KEY;
    // Return a clear error if the key is missing on the server.
    if (!googleApiKey) {
      return Response.json(
        { error: "GOOGLE_API_KEY missing" },
        { status: 500 },
      );
    }

    // Read the model list from env or fallback defaults.
    const googleModels = getGoogleModels();
    // Ask Google and wait for the first successful reply.
    const assistantReplyText = await fetchAssistantReplyText(
      googleModels,
      promptText,
      googleApiKey,
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
