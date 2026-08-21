// Simple dev proxy "middle person" (hides key and forwards message to the real AI server and brings the answer back) and provides /api/assistant-reply during npm run dev (local only)
// Node.js runtime: This code runs inside Vite's dev server process (this computer), not in the page

import { parseHttpRequestJsonBody, sendHttpJsonResponse } from './vite.chat-proxy-data.js';
import { shouldHandleAssistantReplyRequest, buildPromptData, getGoogleModels, fetchAssistantReplyText } from './vite.chat-proxy-helpers.js';
import type { Plugin, ViteDevServer } from 'vite';
import { AiUpstreamError } from './ai-upstream-error.js';

export default function createChatProxyPlugin(): Plugin {                                                                   // creates the chat proxy Vite plugin, Vite reads this and adds plugin to the dev server
  // "Plugin" here means "extra behavior" added to the dev server
  return {
    name: 'chat-proxy',                                                                                                     // plugin name (for Vite debug output)

    configureServer(devServer: ViteDevServer) {                                                                             // hook into Vite dev server (middleware registration), Vite calls this when it starts the dev server.

      devServer.middlewares.use(async (httpRequest, httpResponse, nextMiddleware) => {                                      // add an express-style middleware to intercept requests (registration function), dev server is Vite's server instance
        if (!shouldHandleAssistantReplyRequest(httpRequest)) return nextMiddleware();                                       // only handle POST /api/assistant-reply, pass through others
        try {
          const requestBody = await parseHttpRequestJsonBody(httpRequest);                                                  // parse JSON request body from stream, If the browser sent { "message": "Hello" }, then requestBody.message is "Hello"
          const { userMessageText, promptText } = buildPromptData(requestBody);
          if (!userMessageText) return sendHttpJsonResponse(httpResponse, 400, { error: 'Missing message' });      // reject when client sends empty input
          const groqApiKey = process.env.GROQ_API_KEY;                                                             // read local server-only keys from .env.local
          const googleApiKey = process.env.GOOGLE_API_KEY;
          if (!groqApiKey && !googleApiKey) return sendHttpJsonResponse(httpResponse, 500, { error: 'GROQ_API_KEY and GOOGLE_API_KEY missing' });
          const assistantReplyText = await fetchAssistantReplyText(getGoogleModels(), promptText, googleApiKey, groqApiKey); // try Groq first, then Google
          if (!assistantReplyText) return sendHttpJsonResponse(httpResponse, 502, { error: 'Upstream error' });    // propagate upstream failure (bad gateway) if all models failed
          return sendHttpJsonResponse(httpResponse, 200, { reply: assistantReplyText });                           // respond to client with reply payload
        } catch (error) {                                                                                           // shield internal errors in dev proxy
          if (error instanceof AiUpstreamError) return sendHttpJsonResponse(httpResponse, 502, { error: error.message });
          return sendHttpJsonResponse(httpResponse, 500, { error: 'Server error' });                               // generic error to the client
        }
      });
    },
  };
}
