import { buildReferenceSummaryForPrompt, stringifyChatHistoryForPrompt } from './vite.chat-proxy-data.js';
import type { JsonValue } from './vite.chat-proxy-data.js';
import type { IncomingMessage } from 'node:http';
import { AiUpstreamError, trackAiRequestError, trackAiResponseError } from './ai-upstream-error.js';

export type AssistantReplyRequestBody = {
  message?: JsonValue;
  reference?: JsonValue;
  history?: JsonValue;
};

type GoogleResponseJson = {
  candidates?: { content?: { parts?: { text?: JsonValue }[] } }[];
};

export function shouldHandleAssistantReplyRequest(httpRequest: IncomingMessage): boolean {
  return httpRequest.method === 'POST' && (httpRequest.url?.startsWith('/api/assistant-reply') ?? false);
}

export function buildPromptData(requestBody: AssistantReplyRequestBody): { userMessageText: string; promptText: string } {
  const userMessageText = (requestBody?.message ?? '').toString().trim();               // normalize message text (string) from client, Pulls the "message" text from the body. If it's missing, use an empty string. Make sure it's a string, then remove extra spaces from start/end.
  const referencePromptSuffix = buildReferenceSummaryForPrompt(requestBody?.reference); // include selected model reference details
  
  const contextIntro = referencePromptSuffix
    ? 'Referenzinfo: Dieses Element stammt aus einem Architekturmodell und wurde von mir ausgewaehlt. Nutze meine Daten und beantworte dazu passend.'
    : 'Referenzinfo: Wir sprechen ueber ein Architekturmodell';                         // give the assistant concise scene context
  const historyJson = stringifyChatHistoryForPrompt(requestBody?.history);              // stringify full chat history so the prompt includes prior questions and answers for context
  
  const promptText = 'Prompt: ' + contextIntro + referencePromptSuffix + '\nChatverlauf: ' + historyJson + '\nAntworte kurz dazu.\nText: ' + userMessageText; // extend prompt with reference data
  
  return { userMessageText, promptText };
}

export function getGoogleModels(): string[] {
  return (process.env.GOOGLE_MODELS
    || 'gemini-3.7-flash,gemini-3.6-flash,gemini-3.5-flash-lite')
    .split(',')
    .map((s: string) => s.trim())
    .filter(Boolean);
}

export async function fetchAssistantReplyText(googleModels: string[], promptText: string, googleApiKey?: string, groqApiKey?: string): Promise<string> {
  let lastUpstreamError = new AiUpstreamError('unavailable');
  if (groqApiKey) {                                                    // try Groq before the Google fallback
    try {
      const groqHttpResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${groqApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'openai/gpt-oss-120b',                                // Groq's production replacement for retired Llama 3.3
          messages: [{ role: 'user', content: promptText }],
          temperature: 0.3,
          max_completion_tokens: 600,
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (!groqHttpResponse.ok) lastUpstreamError = trackAiResponseError('Groq', groqHttpResponse.status);
      const groqResponseJson = groqHttpResponse.ok
        ? await groqHttpResponse.json() as { choices?: { message?: { content?: JsonValue } }[] }
        : undefined;
      const groqReplyText = groqResponseJson?.choices?.[0]?.message?.content?.toString().trim() || '';
      if (groqReplyText) return groqReplyText;
    } catch (error) {
      lastUpstreamError = trackAiRequestError('Groq', error);
    }
  }

  if (!googleApiKey) throw lastUpstreamError;                          // Google is only the fallback
  let assistantReplyText = '';                                        // collect reply on first success
  for (const model of googleModels) {                                 // try each model until one succeeds
    let openAiHttpResponse: Response;
    try {
      openAiHttpResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/'
        + encodeURIComponent(model)
        + ':generateContent?key='
        + encodeURIComponent(googleApiKey), {                         // call Google's Gemini API without exposing the key
        method: 'POST',                                               // HTTP POST to send a JSON body
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: promptText }] }],
          generationConfig: { maxOutputTokens: 600 },
        }),
        signal: AbortSignal.timeout(15000),
      });
    } catch (error) {
      lastUpstreamError = trackAiRequestError('Google', error);
      continue;
    }

    if (openAiHttpResponse.ok) {
      const openAiResponseJson: GoogleResponseJson = await openAiHttpResponse.json();   // parse/read upstream/response JSON
      assistantReplyText = openAiResponseJson?.candidates?.[0]?.content?.parts?.[0]?.text?.toString?.().trim?.() || ''; // extract assistant reply text (empty string for safe fallback)
      break; // success
    }

    lastUpstreamError = trackAiResponseError('Google', openAiHttpResponse.status);
    if (![404, 429, 503].includes(openAiHttpResponse.status)) break; // try the next model when this one is unavailable or limited
  }

  if (!assistantReplyText) throw lastUpstreamError;
  return assistantReplyText;
}
