import { buildReferenceSummaryForPrompt, stringifyChatHistoryForPrompt } from './vite.chat-proxy-data.js';

export function shouldHandleAssistantReplyRequest(httpRequest) {
  return httpRequest.method === 'POST' && httpRequest.url?.startsWith('/api/assistant-reply');
}

export function buildPromptData(requestBody) {
  /** @type {string} */
  const userMessageText = (requestBody?.message ?? '').toString().trim();                                           // normalize message text (string) from client, Pulls the "message" text from the body. If it's missing, use an empty string. Make sure it's a string, then remove extra spaces from start/end.
  const referencePromptSuffix = buildReferenceSummaryForPrompt(requestBody?.reference);                             // include selected model reference details
  const contextIntro = referencePromptSuffix
    ? 'Referenzinfo: Dieses Element stammt aus einem Architekturmodell und wurde von mir ausgewaehlt. Nutze meine Daten und beantworte dazu passend.'
    : 'Referenzinfo: Wir sprechen ueber ein Architekturmodell';                                                                        // give the assistant concise scene context
  const historyJson = stringifyChatHistoryForPrompt(requestBody?.history);                         // stringify full chat history so the prompt includes prior questions and answers for context
  const promptText = 'Prompt: ' + contextIntro + referencePromptSuffix + '\nChatverlauf: ' + historyJson + '\nAntworte kurz dazu.\nText: ' + userMessageText;            // extend prompt with reference data
  return { userMessageText, promptText };
}

export function getGoogleModels() {
  return (process.env.GOOGLE_MODELS || 'gemini-1.5-flash,gemini-1.5-pro').split(',').map(s => s.trim()).filter(Boolean);
}

export async function fetchAssistantReplyText(googleModels, promptText, openAiApiKey) {
  let assistantReplyText = '';                                                                                                         // collect reply on first success
  for (const model of googleModels) {                                                                                                  // try each model until one succeeds
    const openAiHttpResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent?key=' + encodeURIComponent(openAiApiKey), { // call OpenAI upstream (Chat Completions), This is the "real" AI server.
      method: 'POST',                                            // HTTP POST to send a JSON body
      headers: {
        'Content-Type': 'application/json',                      //  says "I'm sending JSON"
      },
      body: JSON.stringify({                                     // minimal request model and prompt
        contents: [                                              // conversation messages
          { role: 'user', parts: [{ text: promptText }] }, // system instruction
        ],
        generationConfig: { temperature: 0.3, maxOutputTokens: 100 }, // cap output length 
      }),
    });
    if (openAiHttpResponse.ok) {
      const openAiResponseJson = await openAiHttpResponse.json();    // parse/read upstream/response JSON
      assistantReplyText = openAiResponseJson?.candidates?.[0]?.content?.parts?.[0]?.text?.toString?.().trim?.() || ''; // extract assistant reply text (empty string for safe fallback)
      break; // success
    }
    if (![429, 403, 503].includes(openAiHttpResponse.status)) break; // non-quota error -> stop
  }
  return assistantReplyText;
}

