NEW: Purpose — Checklist for securing chat integration (keep secrets server-side and limit abuse)

NEW: Dev vs. Prod
- NEW: Dev: The active proxy is in `vite.chat-proxy.js` and reads `OPENAI_API_KEY` from your shell env. Key is not in frontend.
- NEW: Prod: Use a serverless endpoint like `api/chat.js` (Vercel) so the key remains server-side in production too.

NEW: Secrets Handling
- NEW: Copy `.env.example` to `.env` and set `OPENAI_API_KEY`. Do not commit `.env` (covered by `.gitignore`).
- NEW: Do NOT prefix secrets with `VITE_` (that exposes them to the browser).

NEW: Rate Limiting & Validation
- NEW: The hardened dev proxy variant is `vite.chat-proxy.secure.js` (not wired). It adds:
  - NEW: Per-IP rate limit (30 req / 5 min)
  - NEW: Payload size cap (8KB)
  - NEW: Message length caps and basic input checks
- NEW: The production function `api/chat.js` includes the same safeguards.

NEW: Cost Controls
- NEW: Set usage limits / hard caps in your OpenAI billing dashboard before public access.
- NEW: Keep `max_tokens` modest and prefer economical models.

NEW: Privacy
- NEW: Avoid logging sensitive user content. Current code does not log payloads or keys.
- NEW: Inform users if inputs may be processed by third-party APIs.

