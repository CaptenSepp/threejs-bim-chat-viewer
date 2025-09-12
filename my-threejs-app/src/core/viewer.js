import * as TOC from "@thatopen/components"; // core engine classes (components)
import * as TOF from "@thatopen/components-front";
import { createWorkerObjectUrl } from "./utils.js";

// sets up the 3D viewer and engine (initialization)
export async function createViewerEngine(viewerContainer) {
  const engineComponents = new TOC.Components();         // central service registry for the engine

  // create world and scene
  const worlds = engineComponents.get(TOC.Worlds);
  const world = worlds.create();
  world.scene = new TOC.SimpleScene(engineComponents);
  world.scene.setup();
  world.scene.three.background = null;                   // transparent background (no color)

  // renderer and camera setup
  world.renderer = new TOF.PostproductionRenderer(engineComponents, viewerContainer);
  world.camera = new TOC.OrthoPerspectiveCamera(engineComponents);
  await world.camera.controls.setLookAt(78, 20, -2.2, 26, -4, 25); // set initial view position and target

  // initialize components and helpers (engine init)
  engineComponents.init();
  engineComponents.get(TOC.Grids).create(world);        // show grid helper in the scene

  // prepare fragments manager and worker
  const fragments = engineComponents.get(TOC.FragmentsManager);
  const fragmentWorkerUrl = "https://thatopen.github.io/engine_fragment/resources/worker.mjs";
  const workerObjectUrl = await createWorkerObjectUrl(fragmentWorkerUrl); // hosted worker URL to parse fragments off the main thread
  fragments.init(workerObjectUrl);                      // boot fragments with the worker (init)

  // keep fragments up-to-date with camera/scene changes
  world.camera.controls.addEventListener("change", () => fragments.core.update(true)); // recompute on camera move
  fragments.list.onItemSet.add(({ value: model }) => {  // when a fragment model loads, attach it
    model.useCamera(world.camera.three);                // link model shaders to camera (camera binding) to ensure correct uniforms
    world.scene.three.add(model.object);                // add model to scene graph to render it
    fragments.core.update(true);                        // force a render update
  });

  // render loop
  let isRendering = true;
  if (world.renderer.three?.setAnimationLoop) {
    world.renderer.three.setAnimationLoop(() => {        // use rAF-based loop when available via requestAnimationFrame
      if (isRendering) world.renderer.update();
    });
  }
  document.addEventListener("visibilitychange", () => {  // pause/resume on tab visibility changes to save resources when hidden
    isRendering = !document.hidden;
  });

  return { engineComponents, world, fragments };
}
// @ts-check
