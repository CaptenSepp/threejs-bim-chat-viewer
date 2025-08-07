import * as OBC from "@thatopen/components";
import { setReference } from "./chat.js";
import { highlightSelection, initRaycaster } from "./raycaster.js";

const GITHUB_WORKER_URL = "https://thatopen.github.io/engine_fragment/resources/worker.mjs";
const DEFAULT_FRAG_PATH = "/frags/school_str.frag";
const container = document.getElementById("three-canvas");

// Utils
async function getWorkerUrl(url) {
  const fetchedUrl = await fetch(url);
  const workerBlob = await fetchedUrl.blob();
  const workerFile = new File([workerBlob], "worker.mjs", { type: "text/javascript" });
  return URL.createObjectURL(workerFile);
}

async function loadFragments(fragments, path = DEFAULT_FRAG_PATH) {
  const file = await fetch(path);
  const buffer = await file.arrayBuffer();
  await fragments.core.load(buffer, { modelId: "school_str" });
}

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

