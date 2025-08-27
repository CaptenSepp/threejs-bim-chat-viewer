import * as TOC from "@thatopen/components"; // Klassen wie Components, Worlds, SimpleScene etc.
import { setReference } from "./chat.js"; // Kopplung 3D-Selektion ↔ Chat
import { hideObjectMeta, initObjectMeta, showObjectMeta } from "./object-meta.js";
import { highlightSelection, initRaycaster } from "./raycaster.js";
import { getWorkerUrl, loadFragments } from "./utils.js";

const fragmentWorkerUrl = "https://thatopen.github.io/engine_fragment/resources/worker.mjs";
const viewerContainer = document.getElementById("three-canvas");

// Core logic
const engineComponents = new TOC.Components();                               // Zentrales Service-Registry-Objekt der Engine
window.highlightFromChat = sel => highlightSelection(engineComponents, sel); // Re-highlights im 3D

const worlds = engineComponents.get(TOC.Worlds);
const world = worlds.create();
world.scene = new TOC.SimpleScene(engineComponents);
world.scene.setup();
world.scene.three.background = null;
world.renderer = new TOC.SimpleRenderer(engineComponents, viewerContainer);
world.camera = new TOC.OrthoPerspectiveCamera(engineComponents);
await world.camera.controls.setLookAt(78, 20, -2.2, 26, -4, 25);
console.log("[main] world and camera initialized", { world }); // Debug world setup

engineComponents.init();
engineComponents.get(TOC.Grids).create(world);

// Model laden
const fragmentManager = engineComponents.get(TOC.FragmentsManager);
const workerObjectUrl = await getWorkerUrl(fragmentWorkerUrl);
fragmentManager.init(workerObjectUrl);
console.log("[main] fragment manager initialized", { fragmentManager, workerObjectUrl }); // Debug fragment manager

// Event handlers
function handleRaycastSelection(selection) {
  console.log("[main] handleRaycastSelection", selection); // Debug selection from raycaster
  if (!selection) {
    console.log("[main] no selection received"); // Debug empty selection
    hideObjectMeta();
    return;
  }
  highlightSelection(engineComponents, selection);
  setReference({
    label: `Item ${selection.itemId}`,
    modelId: selection.modelId,
    itemId: selection.itemId,
  });
  showObjectMeta(selection);
  console.log("[main] metadata shown for selection"); // Debug after showing metadata
}

initRaycaster(engineComponents, world, handleRaycastSelection);
initObjectMeta(engineComponents, world);

world.camera.controls.addEventListener("change", () => fragmentManager.core.update(true)); // position ändert sich "change"

fragmentManager.list.onItemSet.add(({ value: model }) => { // fragmentManager.list = aller geladenen Fragment-Modelle (Key: modelId, Value: model-Objekt
  model.useCamera(world.camera.three);                     // Verdrahtet  internen Shader/States des Modells mit Kamera‑Instanz
  world.scene.three.add(model.object);                     // Fügt das geladene 3D-Objekt in die Three.js-Szene ein
  fragmentManager.core.update(true);                       // Re-Render
});

// Initialization
await loadFragments(fragmentManager);
let isRendering = true;

function renderFrame() {
  if (isRendering) {
    world.renderer.three.render(world.scene.three, world.camera.three);
  }
}

if (world.renderer.three?.setAnimationLoop) {
  world.renderer.three.setAnimationLoop(renderFrame);
} else {
  // Fallback RAF
  (function loop() {
    renderFrame();
    requestAnimationFrame(loop);
  })();
}

document.addEventListener("visibilitychange", () => {
  isRendering = !document.hidden;
});