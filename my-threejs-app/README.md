# 🧱 Three.js + IFC Chat Prototype

A modular 3D chat interface built with Three.js and web-ifc for object-based interaction with BIM models directly in the browser.

---

## 📦 Tech Stack

- [Three.js](https://threejs.org)
- [@thatopen/components](https://www.npmjs.com/package/@thatopen/components)
- web-ifc
- Vanilla JS + HTML/CSS
- Vite

---

## Chat Backend (Groq)

The chat panel sends messages to a local dev endpoint (`POST /api/chat`) provided by a Vite middleware. The middleware calls Groq Chat Completions using your server-side API key (never exposed to the browser).

Setup:

- Install dependencies: `npm install`
- Provide your Groq API key as an env var when starting Vite:
  - Windows PowerShell:
    - `$env:GROQ_API_KEY="<your_key>"; npm run dev`
  - macOS/Linux:
    - `GROQ_API_KEY="<your_key>" npm run dev`
- Optional model override: set `GROQ_MODEL` (default `llama-3.1-70b-versatile`).

Notes:

- Do not put API keys in client code. The proxy runs only in the dev server and reads keys from `process.env`.
- For production, deploy a small server (Express/serverless) that exposes `/api/chat` and uses the same Groq call pattern from `vite.chat-proxy.js`.

Links:

- groq-sdk: https://www.npmjs.com/package/groq-sdk
- Docs: https://console.groq.com/docs/overview
