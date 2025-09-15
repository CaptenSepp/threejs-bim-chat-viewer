// @ts-check
// Simple dev proxy “middle person” (hides key and forwards message to the real AI server and brings the answer back) and provides /api/assistant-reply during npm run dev (local only)
// Node.js runtime: This code runs inside Vite’s dev server process (this computer), not in the page

/** @returns {{ name: string, configureServer(devServer: { middlewares: { use: (handler: (req: any, res: any, next: Function) => void) => void } }): void }} */
export default function createChatProxyPlugin() {                      // creates the chat proxy Vite plugin, Vite reads this and adds plugin to the dev server
  // “Plugin” here means “extra behavior” added to the dev server
  return {
    name: 'chat-proxy',                                                // plugin name (for Vite debug output)
    
    /** @param {{ middlewares: { use: (handler: (req: any, res: any, next: Function) => void) => void } }} devServer */
    configureServer(devServer) {                                       // hook into Vite dev server (middleware registration), Vite calls this when it starts the dev server.

      devServer.middlewares.use(async (httpRequest, httpResponse, nextMiddleware) => { // add an express-style middleware to intercept requests (registration function), dev server is Vite’s server instance
        if (httpRequest.method !== 'POST' || !httpRequest.url?.startsWith('/api/assistant-reply')) return nextMiddleware(); // only handle POST /api/assistant-reply, pass through others
        try {
          const requestBody = await readRequestJsonBody(httpRequest);  // parse JSON request body from stream, If the browser sent { "message": "Hello" }, then requestBody.message is "Hello"
          
          /** @type {string} */
          const userMessageText = (requestBody?.message ?? '').toString().trim(); // normalize message text (string) from client, Pulls the “message” text from the body.If it’s missing, use an empty string.Make sure it’s a string, then remove extra spaces from start/end.
          const referencePromptSuffix = formatReferenceForPrompt(requestBody?.reference); // include selected model reference details
          const promptText = 'Antworte kurz.\n\n' + userMessageText + referencePromptSuffix; // extend prompt with reference data
          console.log('[Gemini prompt]', promptText); // debug prompt preview
          if (!userMessageText) return sendJsonResponse(httpResponse, 400, { error: 'Missing message' }); // reject when client sends empty input
          const openAiApiKey = process.env.GOOGLE_API_KEY;             // read local dev API key from environment (never exposed to browser), Looks for your OpenAI API key in your dev machine's environment variables
          if (!openAiApiKey) return sendJsonResponse(httpResponse, 500, { error: 'GOOGLE_API_KEY missing' }); // fail fast if key is not set locally
          const googleModels = (process.env.GOOGLE_MODELS || 'gemini-1.5-flash,gemini-1.5-pro').split(',').map(s => s.trim()).filter(Boolean); // model fallback list
          let assistantReplyText = ''; // collect reply on first success
          for (const model of googleModels) { // try each model until one succeeds
            const openAiHttpResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent?key=' + encodeURIComponent(openAiApiKey), { // call OpenAI upstream (Chat Completions), This is the "real" AI server.
              method: 'POST',                                            // HTTP POST to send a JSON body
              headers: {
                'Content-Type': 'application/json',                      //  says "I'm sending JSON"
              },
              body: JSON.stringify({                                     // minimal request model and prompt
                contents: [                                              // conversation messages
                  { role: 'user', parts: [{ text: promptText }] }, // system instruction
                ],
                generationConfig: { temperature: 0.3, maxOutputTokens: 200 }, // cap output length 
              }),
            });
            if (openAiHttpResponse.ok) {
              const openAiResponseJson = await openAiHttpResponse.json();    // parse/read upstream/response JSON
              assistantReplyText = openAiResponseJson?.candidates?.[0]?.content?.parts?.[0]?.text?.toString?.().trim?.() || ''; // extract assistant reply text (empty string for safe fallback)
              break; // success
            }
            if (![429, 403, 503].includes(openAiHttpResponse.status)) break; // non-quota error -> stop
          }
          if (!assistantReplyText) return sendJsonResponse(httpResponse, 502, { error: 'Upstream error' }); // propagate upstream failure (bad gateway) if all models failed
          return sendJsonResponse(httpResponse, 200, { reply: assistantReplyText }); // respond to client with reply payload
        } catch {                                                        // shield internal errors in dev proxy
          return sendJsonResponse(httpResponse, 500, { error: 'Server error' });     // generic error to the client
        }
      });
    },
  };
}

/** @param {any} httpRequest @returns {Promise<any>} */
function readRequestJsonBody(httpRequest) {                            // reads request body stream and parses JSON, (which arrives in chunks)
  return new Promise((resolve, reject) => {                            // accumulate chunks into a string 
    let requestBodyText = '';
    httpRequest.on('data', chunk => (requestBodyText += chunk));       // append chunks
    httpRequest.on('end', () => {                                      // on stream end, parse or default {}
      try { resolve(requestBodyText ? JSON.parse(requestBodyText) : {}); } catch (e) { reject(e); }
    });
    httpRequest.on('error', reject);                                   // bubble stream errors
  });
}

function formatReferenceForPrompt(reference) { // include selection id plus marker attributes
  if (!reference || typeof reference !== 'object') return '';
  const lines = [];
  const toText = value => {
    if (value === undefined || value === null || value === '') return '';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };
  const appendLine = (label, value) => {
    const textValue = toText(value);
    if (textValue) lines.push(label + ': ' + textValue);
  };
  appendLine('Model ID', reference.modelId);
  appendLine('Item ID', reference.itemId);
  const attrs = reference.attributes;
  if (attrs && typeof attrs === 'object') {
    appendLine('Name', attrs.name ?? attrs.Name);
    appendLine('Object Type', attrs.objectType ?? attrs.ObjectType);
    appendLine('Tag', attrs.tag ?? attrs.Tag);
    appendLine('Category', attrs.category ?? attrs._category);
    appendLine('Local ID', attrs.localId ?? attrs._localId);
  }
  if (!lines.length) {
    const fallback = Object.entries(reference)
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .slice(0, 5)
      .map(([key, value]) => key + ': ' + (typeof value === 'object' ? JSON.stringify(value) : String(value)));
    lines.push(...fallback);
  }
  if (!lines.length) return '';
  return '\n\nReferenzdaten:\n' + lines.join('\n');
}

/**
 * @param {{ statusCode: number; setHeader(name: string, value: string): void; end(body?: string): void }} httpResponse
 * @param {number} httpStatusCode
 * @param {any} responseBody
 * @returns {void}
 */
function sendJsonResponse(httpResponse, httpStatusCode, responseBody) {            // tiny helper to send JSON responses
  httpResponse.statusCode = httpStatusCode;                            // set HTTP status code
  httpResponse.setHeader('Content-Type', 'application/json');          // JSON content type
  httpResponse.end(JSON.stringify(responseBody));                      // serialize and finish response
}

