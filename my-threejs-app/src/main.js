import * as OBC from "@thatopen/components";
import { setReference } from "./chat.js";
import { highlightSelection, initRaycaster } from "./raycaster.js";
import { getWorkerUrl, loadFragments } from "./utils.js";

const GITHUB_WORKER_URL = "https://thatopen.github.io/engine_fragment/resources/worker.mjs";
const container = document.getElementById("three-canvas");

// Core logic
const components = new OBC.Components();
window.highlightFromChat = sel => highlightSelection(components, sel);

const worlds = components.get(OBC.Worlds);
const world = worlds.create();
world.scene = new OBC.SimpleScene(components);
world.scene.setup();
world.scene.three.background = null;
world.renderer = new OBC.SimpleRenderer(components, container);
world.camera = new OBC.OrthoPerspectiveCamera(components);
await world.camera.controls.setLookAt(78, 20, -2.2, 26, -4, 25);

components.init();
components.get(OBC.Grids).create(world);

const fragments = components.get(OBC.FragmentsManager);
const workerUrl = await getWorkerUrl(GITHUB_WORKER_URL);
fragments.init(workerUrl);

// Event handlers
function handleSelect(selection) {
  highlightSelection(components, selection);
  setReference({
    label: `Item ${selection.itemId}`,
    modelId: selection.modelId,
    itemId: selection.itemId,
  });
}

initRaycaster(components, world, handleSelect);

world.camera.controls.addEventListener("rest", () => fragments.core.update(true));

fragments.list.onItemSet.add(({ value: model }) => {
  model.useCamera(world.camera.three);
  world.scene.three.add(model.object);
  fragments.core.update(true);
});

// Initialization
await loadFragments(fragments);

world.renderer.setAnimationLoop(() => world.renderer.render());