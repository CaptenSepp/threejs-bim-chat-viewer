# Teaching Map: Debug-Style Chains (Full Project)

This document is for teaching the code flow in debug order.
It keeps the same chain style you liked, but with more detail.

## 0) Quick Scope
What this block gives you: a fast map of what runs in browser runtime, what runs only in dev server, and what is a separate tool script.

- Runtime browser app starts from `index.html` -> `/src/main.js`.
- AI route during `npm run dev` is handled by Vite plugin files in `tools/`.
- `tools/ifc-to-frag.js` is a separate CLI conversion chain (not browser runtime).

## 1) App Startup Chain (`src/main.js`)
What this block gives you: exact startup order from first script load until app is interactive, including error hooks.

1. `index.html` loads `/src/main.js` and has required DOM ids (`three-canvas`, `chat-*`, templates).
2. `viewerContainer = document.getElementById("three-canvas")` is resolved first.
3. `init()` starts (async).
4. `createViewerEngine(viewerContainer)` is called.
5. Return is destructured to `engineComponents`, `world`, `fragments`.
6. `window.applyChatSelHighlight = sel => applySelHighlight(engineComponents, sel)` is assigned.
- Data passed later through this bridge: `sel = { modelId, itemId }`.
- Purpose: chat reference chip can trigger 3D highlight.
7. Inner helper `fitCameraToSelBox(world, sel)` exists, uses `camControls`, checks `sel.box`, and can call `camControls.fitToBox(sel.box, true)`.
- Purpose: prepared camera focus step (currently not called).
8. Inner helper `applySelEffects(sel)` is created as the main click result pipeline.
9. Inside `applySelEffects(sel)`:
- `applySelHighlight(engineComponents, sel)` updates 3D highlight.
- `markerAttributes = await renderMarkerForSel(engineComponents, world, sel)`.
- `localIdLabel` is chosen from `markerAttributes.localId` fallback to `sel.itemId`.
- `setComposerReference({ label, modelId, itemId, attributes })` stores chat reference.
10. `setRaycastEvents(engineComponents, world, applySelEffects)` wires click + Escape key behavior.
11. `await loadModelAutoDetect(engineComponents, fragments, "/fragments/school_str.frag")` starts model load.
12. `setMarker(engineComponents)` prepares marker service and template clone.
13. `initMarkerVisibilityWatcher(world)` starts offscreen banner watcher.
14. `init().catch(err => ...)` catches startup errors, builds `msg`, calls `displayUserErrorSnackbar(msg)`.
15. Global handlers:
- `window.addEventListener("error", (e) => { const m = ...; displayUserErrorSnackbar(m); })`.
- `window.addEventListener("unhandledrejection", (e) => { const r = e.reason; const m = ...; displayUserErrorSnackbar(m); })`.

## 2) Viewer Engine Build Chain (`src/core/viewer.js`)
What this block gives you: how engine objects are created and connected (scene, camera, renderer, fragments worker, render loop).

1. `createViewerEngine(viewerContainer)` starts.
2. `engineComponents = new TOC.Components()` is created.
3. `worlds = engineComponents.get(TOC.Worlds)` and `world = worlds.create()`.
4. `simpleScene = new TOC.SimpleScene(engineComponents)`; then `world.scene = simpleScene`; `simpleScene.setup()`.
5. Scene background is set to transparent with `(world.scene.three).background = null`.
6. `world.renderer = new TOF.PostproductionRenderer(engineComponents, viewerContainer)`.
7. `world.camera = new TOC.OrthoPerspectiveCamera(engineComponents)`.
8. `await world.camera.controls.setLookAt(78, 20, -2.2, 26, -4, 25)` sets initial camera position.
9. `engineComponents.init()` starts ThatOpen services.
10. `engineComponents.get(TOC.Grids).create(world)` adds grid helper.
11. `fragments = engineComponents.get(TOC.FragmentsManager)`.
12. `fragmentWorkerUrl` is set to hosted worker URL.
13. `workerObjectUrl = await createWorkerObjectUrl(fragmentWorkerUrl)`.
14. `fragments.init(workerObjectUrl)` starts fragments worker.
15. Camera change listener: `world.camera.controls.addEventListener("change", () => fragments.core.update(true))`.
16. Model-added listener: `fragments.list.onItemSet.add(({ value: model }) => { ... })`.
- `model.useCamera(world.camera.three)` binds camera.
- `world.scene.three.add(model.object)` adds drawable object.
- `fragments.core.update(true)` refreshes.
17. Render loop:
- `isRendering = true`.
- `world.renderer.three.setAnimationLoop(() => { if (isRendering) world.renderer.update(); })`.
- `document.visibilitychange` toggles `isRendering = !document.hidden`.
18. Return `{ engineComponents, world, fragments }`.

## 3) Model Load Chain (`src/core/utils.js`)
What this block gives you: how files are fetched, how type is detected (`.frag`/`.ifc`), and what data is returned/passed next.

### 3.1 Shared fetch helper
1. `fetchOrThrow(resource, errorPrefix)` calls `fetch(resource)`.
2. Uses local `res`.
3. If `!res.ok`, throws `new Error(...)` with HTTP details.
4. Returns `res` otherwise.

### 3.2 Worker URL creation
1. `createWorkerObjectUrl(url)` calls `fetchOrThrow(url, "Failed to fetch worker at")`.
2. Gets `workerResponse`, then `workerBlob = await workerResponse.blob()`.
3. Creates `workerFile = new File([workerBlob], "worker.mjs", { type: "text/javascript" })`.
4. Returns `URL.createObjectURL(workerFile)`.
5. On `error`, calls `displayUserErrorSnackbar(...)` and throws new Error.

### 3.3 `.frag` load path
1. `loadFragmentsFromPath(fragments, path)` calls `fetchOrThrow(path, ...)` -> `file`.
2. `buffer = await file.arrayBuffer()`.
3. Path normalization vars:
- `normalizedPath`
- `trimmedPath`
- `modelId`
- `fileTail`
4. Final call: `await fragments.core.load(buffer, { modelId })`.
5. Catch block logs and shows snackbar.

### 3.4 `.ifc` load path
1. `loadIfcFromPath(components, path)` calls `fetchOrThrow(path, ...)` -> `file`.
2. `buffer = await file.arrayBuffer()`; `bytes = new Uint8Array(buffer)`.
3. `ifcLoader = components.get(IfcLoader)`.
4. `await ifcLoader.setup({ autoSetWasm: false, wasm: { path, absolute: true } })`.
5. Same normalization vars (`normalizedPath`, `trimmedPath`, `modelId`, `fileTail`).
6. `await ifcLoader.load(bytes, true, modelId)`.
7. Catch logs and snackbar.

### 3.5 Auto detect and text escape
1. `loadModelAutoDetect(components, fragments, path)` sets `safePath = String(path || "").trim()`.
2. If `safePath` empty or ends with `.frag` -> `return loadFragmentsFromPath(...)`.
3. If ends with `.ifc` -> `return loadIfcFromPath(...)`.
4. Else shows snackbar `Unbekannter Dateityp`.
5. `escapeHTML(str)` sets `s = String(str ?? "undefined!")`, then replaces special chars with HTML entities.

## 4) Raycast + Selection + Highlight Chain
What this block gives you: click-to-selection runtime path, including what `sel` contains and when highlight updates happen.

### 4.1 Event wiring (`src/modules/target/raycaster.js`)
1. `cssPrimaryColor` reads CSS var `--primary` or falls back to `#FF0000`.
2. `SELECTION_HIGHLIGHT_STYLE` contains:
- `color: new THREE.Color(cssPrimaryColor || "#FF0000")`
- `renderedFaces: FRAGS.RenderedFaces.ONE`
- `opacity: 0.6`
- `transparent: true`
3. `setRaycastEvents(engineComponents, world, applySelEffects)` creates:
- `raycaster = engineComponents.get(Raycasters).get(world)`
- `canvas = world.renderer.three.domElement`
4. Canvas click calls `handleCanvasClick(event, engineComponents, raycaster, applySelEffects)`.
5. Document keydown calls `handleEscapeKey(e, engineComponents)`.
6. `applySelHighlight(components, sel)` builds `withMouseSelected = { [sel.modelId]: [sel.itemId] }`.
7. `fragMan = components.get(FragmentsManager)`.
8. `fragMan.resetHighlight()` -> `fragMan.highlight(SELECTION_HIGHLIGHT_STYLE, withMouseSelected)` -> `fragMan.core?.update(true)`.

### 4.2 Click handling (`src/modules/target/raycaster-helpers.js`)
1. `handleCanvasClick(event, engineComponents, raycaster, applySelEffects)` starts.
2. `raycaster.mouse.updateMouseInfo(event)` aligns mouse.
3. `rayHit = await raycaster.castRay()`.
4. If hit exists:
- `sel = await buildSelFromRayHit(engineComponents, rayHit)`
- `applySelEffects(sel)` called.
5. `buildSelFromRayHit(engineComponents, rayHit)`:
- Reads `modelId = rayHit.fragments.modelId`
- Reads `itemId = rayHit.localId`
- Starts `sel = { modelId, itemId }`
- Gets `fragMan = engineComponents.get(FragmentsManager)`
- If `fragMan.getBBoxes` exists: `[bBox] = await fragMan.getBBoxes({ [modelId]: [itemId] })`
- `vector3Center = bBox.getCenter(new THREE.Vector3())`
- Enriches `sel = { modelId, itemId, center: vector3Center, box: bBox }`
- Returns `sel`
6. `handleEscapeKey(e, engineComponents)`:
- If `e.key === "Escape"`
- Gets `fragMan`
- `fragMan.resetHighlight()`
- `fragMan.core?.update(true)`
- `removeActiveMarker()`.

## 5) Marker Creation + Attribute Chain
What this block gives you: how selected element metadata is read, transformed, and shown as marker + chat reference data.

### 5.1 Marker service (`src/modules/target/marker.js`)
1. Module state vars:
- `markerServInst`
- `markerLabelElemTemp`
- `activeMarkerInstId`
2. `setMarker(engineComponents)`:
- `markerTemplateElement = document.getElementById("marker-template")`
- clones template into `markerLabelElemTemp`
- `markerServInst = engineComponents.get(ThatOpenFront.Marker)`
3. `renderMarkerForSel(engineComponents, world, sel)`:
- `attrs = await getSelectionAttributes(engineComponents, sel)`
- `createMarkerValues(attrs)` returns `markerName`, `markerObjectType`, `markerTag`, `markerCategory`, `markerLocalId`
- `applyMarkerLabelValues(markerLabelElemTemp, ...)`
- `markerWorldPosition = computeMarkerWorldPosition(sel)`
- `activeMarkerInstId = updateMarkerInstance(markerServInst, activeMarkerInstId, world, markerLabelElemTemp, markerWorldPosition)`
- `updateActiveMarkerContext(markerWorldPosition, { name, objectType, tag, category, localId })`
- returns `{ name, objectType, tag, category, localId }`
4. `removeActiveMarker()`:
- If `activeMarkerInstId`, call `markerServInst.delete(activeMarkerInstId)` then set `activeMarkerInstId = null`
- Always calls `clearActiveMarkerContext()`.

### 5.2 Marker helpers (`src/modules/target/marker-helpers.js`)
1. `getSelectionAttributes(engineComponents, sel)`:
- `fragmentsManager = engineComponents.get(EngineFragmentsManager)`
- `attributesByModel = await fragmentsManager.getData({ [sel.modelId]: [sel.itemId] })`
- `attrs = attributesByModel[sel.modelId][0]`
- returns `attrs`
2. `createMarkerValues(attrs)`:
- local helper `asPlainValue(v)` unwraps `{ value: ... }`
- creates `markerName`, `markerObjectType`, `markerTag`, `markerCategory`, `markerLocalId`
- fallback text is `"Not mentioned!"`
- returns object with these 5 values
3. `applyMarkerLabelValues(markerLabelElemTemp, markerName, markerObjectType, markerTag, markerCategory, markerLocalId)` writes values into `.val-*` elements.
4. `computeMarkerWorldPosition(sel)`:
- `markerWorldPosition = sel.center.clone()`
- `markerWorldPosition.y += 6`
- returns position
5. `updateMarkerInstance(markerServInst, activeMarkerInstId, world, markerLabelElemTemp, markerWorldPosition)`:
- deletes old marker if present
- creates new one with `markerServInst.create(world, markerLabelElemTemp, markerWorldPosition, true)`
- returns `newActiveMarkerInstId`.

## 6) Offscreen Marker Banner Chain (`src/modules/target/marker-visibility.js`)
What this block gives you: the camera-driven visibility logic that decides show/hide of the top-right marker banner.

1. Module state vars:
- `activeMarkerWorldPos`
- `activeMarkerAttrs`
- `cameraThree`
- `camControls`
2. `initMarkerVisibilityWatcher(world)`:
- `cameraThree = world.camera.three`
- `camControls = world.camera.controls`
- subscribes `camControls.addEventListener("change", onCameraChange)`
- subscribes `camControls.addEventListener("update", onCameraChange)`
3. `updateActiveMarkerContext(markerWorldPos, markerAttrs)`:
- stores `activeMarkerWorldPos` (clone)
- stores `activeMarkerAttrs`
- calls `recalcAndToggleBanner()` immediately
4. `clearActiveMarkerContext()`:
- nulls marker state vars
- calls `hideOffscreenBanner()`
5. `onCameraChange()` calls `recalcAndToggleBanner()`.
6. `recalcAndToggleBanner()`:
- if missing marker/camera -> hide and return
- `visible = isWorldPosInView(activeMarkerWorldPos, cameraThree)`
- if `!visible && activeMarkerAttrs`:
  - `html = buildBannerHtml(activeMarkerAttrs)`
  - `displayOffscreenBanner(html)`
- else hide banner
7. `isWorldPosInView(worldPos, camera)`:
- `ndc = worldPos.clone().project(camera)`
- returns bounds check for `ndc.x`, `ndc.y`, `ndc.z` in `[-1, 1]`
8. `buildBannerHtml(attrs)`:
- gets `tpl = document.getElementById("marker-banner-template")`
- clones template element
- fills values via `applyMarkerLabelValues(...)`
- returns `element.outerHTML`
- fallback returns `""`.

## 7) Chat UI + State + AI Request Chain
What this block gives you: full message path from keyboard submit to localStorage render and optional AI response.

### 7.1 DOM refs and message render (`src/modules/chat/components/chat-ui.js`)
1. Exported DOM variables:
- `chatMessages`
- `inputForm`
- `inputField`
- `referenceContainer`
- `referenceLabel`
- `clearReferenceBtn`
- `aiToggle`
2. `createReferenceChip(reference)`:
- creates `clickableRefTag`
- writes `textContent = reference.label`
- stores `dataset.modelId`, `dataset.itemId`
- on click, if item id exists, calls `window.applyChatSelHighlight({ modelId, itemId: +dataset.itemId })`
- returns chip element
3. `appendMessageToChat({ text, time, reference, sender })`:
- `msgWrapper`, `isSelf`, optional `ref` chip
- `chatMsgContainer.innerHTML = escapeHTML(text)`
- `chatMeta` time from `new Date(time).toLocaleTimeString(...)`
- appends to `chatMessages`
- scrolls with `chatMessages.scrollTop = chatMessages.scrollHeight`.

### 7.2 Chat memory and AI side (`src/modules/chat/chat-helpers.js`)
1. `STORAGE_KEY = "chat-history"`.
2. `messageHistory = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")`.
3. `pushHistoryUserMessage(userMessage)`:
- pushes to array
- writes localStorage
- calls `appendMessageToChat(userMessage)`
4. `pushAssistantMessage(assistantMessage)` same 3 actions for assistant text.
5. `pushErrorMessage(errMsg)` same 3 actions for system error text.
6. `handleAssistantResponse(text, userMessage)`:
- calls `requestAssistantReplyForUserMessage({ userMessageText: text, previousChatHistory: messageHistory, selectedModelReference: userMessage.reference })`
- result stored in `assistantReplyText`
- creates `assistantMessage = { time, reference: null, text: assistantReplyText || "...", sender: "assistant" }`
- pushes assistant message
- on `err`, creates `errMsg = { time, reference: null, text: "Fehler: ...", sender: "system" }`
- pushes error and calls `displayUserErrorSnackbar(errMsg.text)`.

### 7.3 Chat orchestration (`src/modules/chat/chat.js`)
1. Module state: `currentReference = null`.
2. `setComposerReference(referenceObject)`:
- sets `currentReference`
- updates `referenceLabel.textContent`
- removes hidden class from `referenceContainer`
3. `clearComposerReference()`:
- nulls `currentReference`
- clears label
- adds hidden class
4. `clearReferenceBtn.addEventListener("click", clearComposerReference)`.
5. `inputField.keydown`:
- if Enter and not Shift, prevent default
- dispatches form submit event
6. `inputForm.submit` handler:
- prevents default
- reads `text = inputField.value.trim()`
- if empty return
- builds `userMessage = { time, reference: currentReference, text, sender: "user" }`
- calls `pushHistoryUserMessage(userMessage)`
- clears input and focuses field
- calls `clearComposerReference()`
- if `aiToggle && aiToggle.checked`, awaits `handleAssistantResponse(text, userMessage)`
7. Initial render: `messageHistory.forEach(appendMessageToChat)`.

## 8) Browser HTTP Chain (`src/services/http-client.js` + `src/api/request-assistant-reply-api.js`)
What this block gives you: exact browser request layer behavior, including success parsing and error propagation/snackbar behavior.

1. `requestAssistantReplyForUserMessage({ userMessageText, previousChatHistory = [], selectedModelReference = null })` uses dynamic import:
- `const { postReqWithJson: postJson } = await import("../services/http-client.js")`
2. Calls:
- `data = await postJson("/api/assistant-reply", { message: userMessageText, history: previousChatHistory, reference: selectedModelReference })`
3. Returns `data?.reply || ""`.
4. HTTP helper internals:
- `readTextSafely(res)` returns `await res.text()` or `""`.
- `parseJson(res, onErrorPrefix)` checks `res.ok`.
- on error builds `msg`, calls `displayUserErrorSnackbar(msg)`, throws.
- success returns `res.json()`.
5. `getReqWithJson(url, { headers = {}, signal } = {})` calls `fetch(...GET...)` then `parseJson`.
6. `postReqWithJson(url, body, { headers = {}, signal } = {})` calls `fetch(...POST JSON...)` then `parseJson`.

## 9) Dev AI Proxy Chain (`tools/vite.chat-proxy*.js`)
What this block gives you: server-side dev middleware flow for `/api/assistant-reply`, prompt building, and upstream Gemini call order.

### 9.1 Plugin entry (`tools/vite.chat-proxy.js`)
1. `createChatProxyPlugin()` returns plugin object `{ name, configureServer }`.
2. `name = "chat-proxy"`.
3. `configureServer(devServer)` registers middleware with `devServer.middlewares.use(...)`.
4. Middleware args: `httpRequest`, `httpResponse`, `nextMiddleware`.
5. First gate: `shouldHandleAssistantReplyRequest(httpRequest)`.
- If false -> `nextMiddleware()`.
6. Body read: `requestBody = await parseHttpRequestJsonBody(httpRequest)`.
7. Prompt prep: `{ userMessageText, promptText } = buildPromptData(requestBody)`.
8. Empty text -> `sendHttpJsonResponse(httpResponse, 400, { error: "Missing message" })`.
9. Env key read: `openAiApiKey = process.env.GOOGLE_API_KEY`.
10. Missing key -> 500 JSON error.
11. `googleModels = getGoogleModels()`.
12. `assistantReplyText = await fetchAssistantReplyText(googleModels, promptText, openAiApiKey)`.
13. Empty assistant reply -> 502 JSON error.
14. Success -> `sendHttpJsonResponse(httpResponse, 200, { reply: assistantReplyText })`.
15. Catch -> 500 JSON `Server error`.

### 9.2 Prompt and upstream request (`tools/vite.chat-proxy-helpers.js`)
1. `shouldHandleAssistantReplyRequest(httpRequest)` checks:
- `httpRequest.method === "POST"`
- `httpRequest.url?.startsWith("/api/assistant-reply")`
2. `buildPromptData(requestBody)`:
- `userMessageText = (requestBody?.message ?? "").toString().trim()`
- `referencePromptSuffix = buildReferenceSummaryForPrompt(requestBody?.reference)`
- `contextIntro` depends on presence of reference
- `historyJson = stringifyChatHistoryForPrompt(requestBody?.history)`
- `promptText` combines intro + reference + history + message
- returns `{ userMessageText, promptText }`
3. `getGoogleModels()` parses `process.env.GOOGLE_MODELS` or default list, then `.split(",").map(...).filter(Boolean)`.
4. `fetchAssistantReplyText(googleModels, promptText, openAiApiKey)`:
- sets `assistantReplyText = ""`
- loops `for (const model of googleModels)`
- sends fetch POST to Google endpoint URL built with `encodeURIComponent(model)` and API key
- request body includes `contents` and `generationConfig`
- if response ok:
  - `openAiResponseJson = await openAiHttpResponse.json()`
  - extracts candidate text into `assistantReplyText`
  - `break`
- if not ok:
  - logs status and body
  - breaks on non retryable status
- returns `assistantReplyText`

### 9.3 Proxy data helpers (`tools/vite.chat-proxy-data.js`)
1. `parseHttpRequestJsonBody(incomingHttpRequest)`:
- creates Promise
- local `accumulatedRequestBodyText = ""`
- `data` event appends chunk
- `end` event parses JSON or `{}`
- parse error rejects with `requestBodyParseError`
- `error` event rejects
2. `buildReferenceSummaryForPrompt(referencePayload)`:
- validates object
- local helper `stringifyReferenceValue(value)`
- `referenceSummarySegments = []`
- pushes `Model ID` and `Item ID`
- extracts `referenceAttributesSource` and safe object `referenceAttributes`
- creates `referenceAttributePairs` list with Name/Object Type/Tag/Category/Local ID
- builds `referenceSummaryText`
- pushes to segments
- returns final multiline string starting with `Referenzdaten:`
3. `sendHttpJsonResponse(outgoingHttpResponse, responseStatusCode, responseBodyPayload)`:
- sets `statusCode`
- sets `Content-Type`
- ends with `JSON.stringify(responseBodyPayload)`
4. `stringifyChatHistoryForPrompt(historyPayload)`:
- returns `"[]"` if not array
- tries `JSON.stringify(historyPayload)`
- catch fallback `"[]"`.

## 10) UI Utility Chains
What this block gives you: isolated UI helper behavior for error snackbar and offscreen banner host element lifecycle.

### 10.1 Snackbar (`src/ui/error-notify.js`)
1. Module state vars: `ErrorSnackElem`, `ErrorSnackTimer`.
2. `displayUserErrorSnackbar(messageText = "Ein Fehler ist aufgetreten", durationMs = 10000)`:
- creates snackbar element once if missing
- sets id `app-error-snackbar`
- sets ARIA role `alert`
- appends to body
- updates `textContent`
- adds class `visible`
- clears existing timer
- schedules hide with `setTimeout` and stores timer id in `ErrorSnackTimer`.

### 10.2 Offscreen banner host (`src/ui/marker-banner.js`)
1. Module var: `OffscreenBannerElem`.
2. `ensureOffscreenBannerElemExist()` creates one element with id `app-marker-banner`, role `status`, appends body, returns it.
3. `displayOffscreenBanner(htmlContent)` gets element via ensure function, writes `innerHTML`, adds `visible`.
4. `hideOffscreenBanner()` removes `visible` if element exists.

## 11) Type contract (`src/types/global.d.ts`)
What this block gives you: the global type guarantee that lets chat chips call the 3D highlight bridge safely.

1. Extends `Window` with `applyChatSelHighlight(sel)` where `sel` has `modelId: string` and `itemId: number`.
2. Purpose: TypeScript/JSDoc knows that global function exists.

## 12) Config + HTML Glue
What this block gives you: startup glue files that wire runtime pieces together (plugin registration, DOM/template availability).

### 12.1 Vite config (`vite.config.js`)
1. `ChatProxyPlugin` imported from `./tools/vite.chat-proxy.js`.
2. `export default` config object has:
- `assetsInclude: ["**/*.ifc", "**/*.wasm"]`
- `test.environment = "jsdom"`
- `test.include = ["tests/**/*.test.js"]`
- `test.globals = true`
- `plugins = [ChatProxyPlugin()]`

### 12.2 HTML (`index.html`)
1. Provides containers used by JS:
- `#three-canvas`
- `#chat-messages`
- `#input-form`
- `#input-field`
- `#chat-reference-container`
- `#chat-reference-label`
- `#clear-reference-btn`
- `#ai-toggle`
2. Provides templates used by marker modules:
- `#marker-template`
- `#marker-banner-template`
3. Starts app via `<script type="module" src="/src/main.js"></script>`.

## 13) Separate Tool Script Chain (`tools/ifc-to-frag.js`)
What this block gives you: standalone conversion pipeline order (IFC bytes -> FRAG bytes) outside browser runtime.

1. Top-level path vars:
- `__filename`
- `__dirname`
- `projectRootAbsPath`
- `inputIfcModelPath`
- `outputFragModelPath`
- `webIfcWasmDirectory`
2. `convertIfcToFrag()`:
- reads input IFC bytes as `inputIfcFileBytes`
- creates `ifcImporter = new IfcImporter()`
- sets `ifcImporter.wasm.path` and `ifcImporter.wasm.absolute = true`
- converts via `outputFragFileBytes = await ifcImporter.process({ bytes: inputIfcFileBytes })`
- ensures output folder exists with `fs.mkdirSync(..., { recursive: true })`
- writes output via `fs.writeFileSync(outputFragModelPath, Buffer.from(outputFragFileBytes))`
- logs success
3. `convertIfcToFrag().catch((err) => { ... process.exit(1); })` handles CLI errors.

## 14) Full Symbol Coverage Checklist (functions + key variables)
What this block gives you: quick verification list so you can check that every file symbol is represented in your teaching material.

### `src/main.js`
- Functions: `init`, `fitCameraToSelBox`, `applySelEffects`.
- Variables: `viewerContainer`, `engineComponents`, `world`, `fragments`, `camControls`, `markerAttributes`, `localIdLabel`, `msg`, `m`, `r`.

### `src/api/request-assistant-reply-api.js`
- Function: `requestAssistantReplyForUserMessage`.
- Variables: `postJson`, `data`, `userMessageText`, `previousChatHistory`, `selectedModelReference`.

### `src/core/utils.js`
- Functions: `fetchOrThrow`, `createWorkerObjectUrl`, `loadFragmentsFromPath`, `loadIfcFromPath`, `loadModelAutoDetect`, `escapeHTML`.
- Variables: `res`, `workerResponse`, `workerBlob`, `workerFile`, `file`, `buffer`, `normalizedPath`, `trimmedPath`, `modelId`, `fileTail`, `bytes`, `ifcLoader`, `safePath`, `s`.

### `src/core/viewer.js`
- Function: `createViewerEngine`.
- Variables: `TOC`, `TOF`, `engineComponents`, `worlds`, `world`, `simpleScene`, `fragments`, `fragmentWorkerUrl`, `workerObjectUrl`, `model`, `isRendering`.

### `src/modules/chat/components/chat-ui.js`
- Functions: `createReferenceChip`, `appendMessageToChat`.
- Variables: `chatMessages`, `inputForm`, `inputField`, `referenceContainer`, `referenceLabel`, `clearReferenceBtn`, `aiToggle`, `clickableRefTag`, `msgWrapper`, `isSelf`, `ref`, `chatMsgContainer`, `chatMeta`.

### `src/modules/chat/chat-helpers.js`
- Functions: `pushHistoryUserMessage`, `pushAssistantMessage`, `pushErrorMessage`, `handleAssistantResponse`.
- Variables: `STORAGE_KEY`, `messageHistory`, `assistantReplyText`, `assistantMessage`, `errMsg`, `text`, `userMessage`, `err`.

### `src/modules/chat/chat.js`
- Functions: `setComposerReference`, `clearComposerReference`.
- Event callbacks: keydown callback, submit callback.
- Variables: `currentReference`, `e`, `text`, `userMessage`.

### `src/modules/target/marker-helpers.js`
- Functions: `getSelectionAttributes`, `createMarkerValues`, `applyMarkerLabelValues`, `computeMarkerWorldPosition`, `updateMarkerInstance`.
- Variables: `fragmentsManager`, `attributesByModel`, `attrs`, `asPlainValue`, `markerName`, `markerObjectType`, `markerTag`, `markerCategory`, `markerLocalId`, `markerWorldPosition`, `newActiveMarkerInstId`.

### `src/modules/target/marker-visibility.js`
- Functions: `initMarkerVisibilityWatcher`, `updateActiveMarkerContext`, `clearActiveMarkerContext`, `onCameraChange`, `recalcAndToggleBanner`, `isWorldPosInView`, `buildBannerHtml`.
- Variables: `activeMarkerWorldPos`, `activeMarkerAttrs`, `cameraThree`, `camControls`, `visible`, `html`, `ndc`, `tpl`, `element`, `attrs`.

### `src/modules/target/marker.js`
- Functions: `setMarker`, `renderMarkerForSel`, `removeActiveMarker`.
- Variables: `markerServInst`, `markerLabelElemTemp`, `activeMarkerInstId`, `markerTemplateElement`, `attrs`, `markerName`, `markerObjectType`, `markerTag`, `markerCategory`, `markerLocalId`, `markerWorldPosition`.

### `src/modules/target/raycaster-helpers.js`
- Functions: `buildSelFromRayHit`, `handleCanvasClick`, `handleEscapeKey`.
- Variables: `modelId`, `itemId`, `sel`, `fragMan`, `bBox`, `vector3Center`, `rayHit`, `event`, `e`.

### `src/modules/target/raycaster.js`
- Functions: `setRaycastEvents`, `applySelHighlight`.
- Constants/variables: `cssPrimaryColor`, `SELECTION_HIGHLIGHT_STYLE`, `raycaster`, `canvas`, `withMouseSelected`, `fragMan`.

### `src/services/http-client.js`
- Functions: `readTextSafely`, `parseJson`, `getReqWithJson`, `postReqWithJson`.
- Variables: `res`, `text`, `msg`, `url`, `body`, `headers`, `signal`.

### `src/types/global.d.ts`
- Type member: `Window.applyChatSelHighlight`.
- Variables inside type: `sel.modelId`, `sel.itemId`.

### `src/ui/error-notify.js`
- Function: `displayUserErrorSnackbar`.
- Variables: `ErrorSnackElem`, `ErrorSnackTimer`, `messageText`, `durationMs`.

### `src/ui/marker-banner.js`
- Functions: `ensureOffscreenBannerElemExist`, `displayOffscreenBanner`, `hideOffscreenBanner`.
- Variables: `OffscreenBannerElem`, `el`, `htmlContent`.

### `tools/vite.chat-proxy.js`
- Function: `createChatProxyPlugin` (default export), method `configureServer`.
- Middleware variables: `httpRequest`, `httpResponse`, `nextMiddleware`, `requestBody`, `userMessageText`, `promptText`, `openAiApiKey`, `googleModels`, `assistantReplyText`.

### `tools/vite.chat-proxy-helpers.js`
- Functions: `shouldHandleAssistantReplyRequest`, `buildPromptData`, `getGoogleModels`, `fetchAssistantReplyText`.
- Variables: `userMessageText`, `referencePromptSuffix`, `contextIntro`, `historyJson`, `promptText`, `assistantReplyText`, `model`, `openAiHttpResponse`, `openAiResponseJson`.

### `tools/vite.chat-proxy-data.js`
- Functions: `parseHttpRequestJsonBody`, `buildReferenceSummaryForPrompt`, `sendHttpJsonResponse`, `stringifyChatHistoryForPrompt`.
- Variables: `accumulatedRequestBodyText`, `resolveRequestBody`, `rejectRequestBody`, `requestBodyParseError`, `stringifyReferenceValue`, `referenceSummarySegments`, `referenceAttributesSource`, `referenceAttributes`, `referenceAttributePairs`, `referenceSummaryText`, `outgoingHttpResponse`, `responseStatusCode`, `responseBodyPayload`, `historyPayload`.

### `tools/ifc-to-frag.js`
- Function: `convertIfcToFrag`.
- Variables: `__filename`, `__dirname`, `projectRootAbsPath`, `inputIfcModelPath`, `outputFragModelPath`, `webIfcWasmDirectory`, `inputIfcFileBytes`, `ifcImporter`, `outputFragFileBytes`, `err`.

## 15) Notes on Non-runtime Files
What this block gives you: files that are intentionally outside the main runtime chains, and why they are separate.

- `src/all-code.txt`: merged reference copy of source snippets; not the executed module entry graph.
- `tests/*`: test execution flow, not browser runtime flow.
- `package.json`: scripts/dependency metadata.
