import * as TOC from "@thatopen/components"; // Klassen wie Components, Worlds, SimpleScene etc.
import * as TOF from "@thatopen/components-front";
import { getWorkerUrl } from "./utils.js";

// Sets up the viewer
// initialize
// Returns the core objects 
export async function initViewer(viewerContainer) {
  const engineComponents = new TOC.Components();                               // Zentrales Service-Registry-Objekt der Engine

  // World and scene setup
  const worlds = engineComponents.get(TOC.Worlds);
  const world = worlds.create();
  world.scene = new TOC.SimpleScene(engineComponents);
  world.scene.setup();
  world.scene.three.background = null;

  // Renderer and camera
  world.renderer = new TOF.PostproductionRenderer(engineComponents, viewerContainer);
  world.camera = new TOC.OrthoPerspectiveCamera(engineComponents);
  await world.camera.controls.setLookAt(78, 20, -2.2, 26, -4, 25);

  // Components init and helpers
  engineComponents.init();
  engineComponents.get(TOC.Grids).create(world);

  // Model laden
  const fragmentManager = engineComponents.get(TOC.FragmentsManager);
  const fragmentWorkerUrl = "https://thatopen.github.io/engine_fragment/resources/worker.mjs";
  const workerObjectUrl = await getWorkerUrl(fragmentWorkerUrl);
  fragmentManager.init(workerObjectUrl);

  // Keep fragments in sync with camera/scene changes
  world.camera.controls.addEventListener("change", () => fragmentManager.core.update(true)); // position ��ndert sich "change"
  fragmentManager.list.onItemSet.add(({ value: model }) => { // fragmentManager.list = aller geladenen Fragment-Modelle (Key: modelId, Value: model-Objekt
    model.useCamera(world.camera.three);                     // Verdrahtet  internen Shader/States des Modells mit Kamera�?'Instanz
    world.scene.three.add(model.object);                     // FǬgt das geladene 3D-Objekt in die Three.js-Szene ein
    fragmentManager.core.update(true);                       // Re-Render
  });

  // Render loop
  let isRendering = true;
  if (world.renderer.three?.setAnimationLoop) {
    world.renderer.three.setAnimationLoop(() => {
      if (isRendering) world.renderer.update(); // NEW
    });
  } else {
    // NEW: Fallback für alte Umgebungen
    (function loop() {
      if (isRendering) world.renderer.update();
      requestAnimationFrame(loop);
    })();
  }
  document.addEventListener("visibilitychange", () => {
    isRendering = !document.hidden;
  });

  return { engineComponents, world, fragmentManager };
}
