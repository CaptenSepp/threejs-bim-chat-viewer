// @ts-check
// Simple dev proxy ??omiddle person??? (hides key and forwards message to the real AI server and brings the answer back) and provides /api/assistant-reply during npm run dev (local only)
// Node.js runtime: This code runs inside Vite??Ts dev server process (this computer), not in the page

import { parseHttpRequestJsonBody, buildReferenceSummaryForPrompt, sendHttpJsonResponse } from './vite.chat-proxy-data.js';

/** @returns {{ name: string, configureServer(devServer: { middlewares: { use: (handler: (req: any, res: any, next: Function) => void) => void } }): void }} */
export default function createChatProxyPlugin() {                                                                           // creates the chat proxy Vite plugin, Vite reads this and adds plugin to the dev server
  // “Plugin” here means “extra behavior” added to the dev server
  return {
    name: 'chat-proxy',                                                                                                     // plugin name (for Vite debug output)

    /** @param {{ middlewares: { use: (handler: (req: any, res: any, next: Function) => void) => void } }} devServer */
    configureServer(devServer) {                                                                                            // hook into Vite dev server (middleware registration), Vite calls this when it starts the dev server.

      devServer.middlewares.use(async (httpRequest, httpResponse, nextMiddleware) => {                                      // add an express-style middleware to intercept requests (registration function), dev server is Vite's server instance
        if (httpRequest.method !== 'POST' || !httpRequest.url?.startsWith('/api/assistant-reply')) return nextMiddleware(); // only handle POST /api/assistant-reply, pass through others
        try {
          const requestBody = await parseHttpRequestJsonBody(httpRequest);                                                  // parse JSON request body from stream, If the browser sent { "message": "Hello" }, then requestBody.message is "Hello"

          /** @type {string} */
          const userMessageText = (requestBody?.message ?? '').toString().trim();                                           // normalize message text (string) from client, Pulls the â€œmessageâ€ text from the body.If itâ€™s missing, use an empty string.Make sure itâ€™s a string, then remove extra spaces from start/end.
          const referencePromptSuffix = buildReferenceSummaryForPrompt(requestBody?.reference);                             // include selected model reference details
          const contextIntro = referencePromptSuffix 
          ? 'Referenzinfo: Dieses Element stammt aus einem Architekturmodell und wurde von mir ausgewaehlt. Nutze meine Daten und beantworte dazu passend. ' 
          : 'Referenzinfo: Wir sprechen ueber ein Architekturmodell. ';                                                                        // give the assistant concise scene context
          const historyJson = JSON.stringify(requestBody?.history ?? []);                                                   // stringify full chat history so the prompt includes prior questions and answers for context
          const promptText = 'Prompt: ' + contextIntro + referencePromptSuffix + '\nChatverlauf: ' + historyJson + '\nAntworte kurz dazu.\nText: ' + userMessageText;            // extend prompt with reference data
          console.log('[Gemini prompt]', promptText);                                                                                          // debug prompt preview
          if (!userMessageText) return sendHttpJsonResponse(httpResponse, 400, { error: 'Missing message' });                                  // reject when client sends empty input
          const openAiApiKey = process.env.GOOGLE_API_KEY;  // read local dev API key from environment (never exposed to browser), Looks for your OpenAI API key in your dev machine's environment variables  if (!openAiApiKey) return sendHttpJsonResponse(httpResponse, 500, { error: 'GOOGLE_API_KEY missing' });  fail fast if key is not set locally
          const googleModels = (process.env.GOOGLE_MODELS || 'gemini-1.5-flash,gemini-1.5-pro').split(',').map(s => s.trim()).filter(Boolean); // model fallback list
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
          if (!assistantReplyText) return sendHttpJsonResponse(httpResponse, 502, { error: 'Upstream error' }); // propagate upstream failure (bad gateway) if all models failed
          return sendHttpJsonResponse(httpResponse, 200, { reply: assistantReplyText }); // respond to client with reply payload
        } catch {                                                        // shield internal errors in dev proxy
          return sendHttpJsonResponse(httpResponse, 500, { error: 'Server error' });     // generic error to the client
        }
      });
    },
  };
}

