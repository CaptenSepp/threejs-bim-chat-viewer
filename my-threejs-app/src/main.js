import * as TOC from "@thatopen/components";
import { setReference } from "./chat.js";
import { highlightSelection, initRaycaster } from "./raycaster.js";
import { getWorkerUrl, loadFragments } from "./utils.js";

const fragmentWorkerUrl = "https://thatopen.github.io/engine_fragment/resources/worker.mjs";
const viewerContainer = document.getElementById("three-canvas");

// Core logic
const engineComponents = new TOC.Components();
window.highlightFromChat = sel => highlightSelection(engineComponents, sel);

const worlds = engineComponents.get(TOC.Worlds);
const world = worlds.create();
world.scene = new TOC.SimpleScene(engineComponents);
world.scene.setup();
world.scene.three.background = null;
world.renderer = new TOC.SimpleRenderer(engineComponents, viewerContainer);
world.camera = new TOC.OrthoPerspectiveCamera(engineComponents);
await world.camera.controls.setLookAt(78, 20, -2.2, 26, -4, 25);

engineComponents.init();
engineComponents.get(TOC.Grids).create(world);

// Model laden
const fragmentManager = engineComponents.get(TOC.FragmentsManager);
const workerObjectUrl = await getWorkerUrl(fragmentWorkerUrl);
fragmentManager.init(workerObjectUrl);

// Event handlers
function handleSelect(selection) {
  highlightSelection(engineComponents, selection);
  setReference({
    label: `Item ${selection.itemId}`,
    modelId: selection.modelId,
    itemId: selection.itemId,
  });
}

initRaycaster(engineComponents, world, handleSelect);

world.camera.controls.addEventListener("change", () => fragmentManager.core.update(true));

fragmentManager.list.onItemSet.add(({ value: model }) => {
  model.useCamera(world.camera.three);
  world.scene.three.add(model.object);
  fragmentManager.core.update(true);
});

// Initialization
await loadFragments(fragmentManager);
let isRendering = true;

function animate() {
  if (isRendering) {
    world.renderer.render();
  }
}

world.renderer.setAnimationLoop(animate);

document.addEventListener("visibilitychange", () => {
  isRendering = !document.hidden;
});

world.renderer.setAnimationLoop(() => world.renderer.render());