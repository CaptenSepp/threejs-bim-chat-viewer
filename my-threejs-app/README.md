IFC Chat Viewer

A browser-based Three.js prototype that lets you inspect IFC models and start chat threads that target specific building elements. It uses @thatopen components and web-ifc fragments to stream BIM data efficiently.

#Features
- Loads IFC fragment data and renders it with a Three.js scene configured for BIM navigation.
- Raycasts model geometry to highlight the selected element and drop a marker overlay.
- Sends selection context (model ID, local ID, attributes) to the chat composer for follow-up discussions.
- Shows inline error notifications when viewer or data loading fails.

#Prerequisites
- Node.js 18 or newer (ships with npm). Check with `node -v`.

#Getting Started
1. Install dependencies: `npm install`
2. Start the Vite dev server: `npm run dev`
   - The app defaults to http://localhost:5173
   - Sample IFC and fragment files live under `public/model` and `public/fragments`

#Useful Scripts
- `npm run dev` � hot-reload development server.
- `npm run test` � run the Vitest unit suite once.
- `npm run test:watch` � re-run tests on file changes.
- `npm run typecheck` � verify TypeScript types without emitting JS.

#Project Layout
- `src/core` � viewer bootstrap, Three.js engine setup, and loading helpers.
- `src/modules` � feature modules (chat integration, selection markers, raycasting).
- `src/ui` � small UI utilities such as snackbars for error feedback.
- `public/` � static assets, including the sample IFC models and fragment caches.

#Next Steps
- Replace the sample IFC files with project-specific data by dropping new files into `public/model`.
- Extend the chat module to hit your backend API for persistent discussions.