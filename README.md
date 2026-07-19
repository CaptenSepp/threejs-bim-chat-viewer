# 3DNest App (Prototyp)

Dies ist ein kleines Uni-Projekt, mit dem sich IFC-Modelle im Browser mit Three.js betrachten lassen.  
Man kann Bauteile anklicken und im Viewer hervorheben sowie den Chat mit Bezug auf das ausgewählte Element nutzen.

## Was das Projekt kann

- Rendert BIM-Daten mit `@thatopen/components` und Fragment-Support.
- Lädt sowohl `.ifc` als auch `.frag` Dateien (automatische Erkennung über die Dateiendung).
- Ermöglicht Auswahl per Raycasting und hebt das gewählte Element in der Szene hervor.
- Zeigt einen Marker/Banner für ausgewählte Elemente.
- Übergibt die Selektionsdaten (`modelId`, `itemId`, Attribute) an den Chat-Composer.
- Speichert den Chatverlauf im `localStorage`.
- Zeigt Snackbar-Fehlermeldungen bei Ladefehlern oder Laufzeitfehlern.

## Voraussetzungen

- Node.js 18+

Version prüfen:
node -v

## Setup und Start

npm install
npm run dev
Vite startet normalerweise unter `http://localhost:5173`.

## Skripte

- `npm run dev` - startet den Vite-Dev-Server.
- `npm run test` - führt die Vitest-Tests aus.
- `npm run test:watch` - startet Tests im Watch-Modus.
- `npm run typecheck` - führt den TypeScript-Typecheck aus (`tsc --noEmit`).

## Projektstruktur

- `src/main.js` - App-Start und Verbindung von Viewer, Selektion, Marker und Chat.
- `src/core` - Setup der Viewer-Engine und Model-Loading-Helfer.
- `src/modules/chat` - Chat-UI, Nachrichtenverlauf, Assistant-Request-Ablauf.
- `src/modules/target` - Raycasting, Highlighting und Marker-Verhalten.
- `src/api` und `src/services` - API-Aufruf und gemeinsamer HTTP-Helper.
- `src/ui` - UI-Helfer (Error-Snackbar, Marker-Banner).
- `public/model` - Beispiel-IFC-Dateien.
- `public/fragments` - Beispiel-Fragment-Dateien.
- `tests` - Unit-Tests (chat, raycaster, utils).

## Hinweise zum AI-Chat

Der Dev-API-Endpunkt ist `/api/assistant-reply` (über das Vite-Plugin in `tools/vite.chat-proxy.js`).
Damit Assistant-Antworten in der Entwicklung funktionieren, muss API-Key manuell gesetzt werden.

## Schnell anpassen

- Um ein anderes Modell standardmässig zu laden, den Pfad in `loadModelAutoDetect(...)` in `src/main.js` ändern.
- Eigene IFC-/Fragment-Dateien in `public/model` oder `public/fragments` ablegen und in `src/main.js` referenzieren.
