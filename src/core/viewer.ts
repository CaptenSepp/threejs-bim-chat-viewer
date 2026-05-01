import * as TOC from "@thatopen/components"; // core engine classes (components)
import * as TOF from "@thatopen/components-front";
import type { OrthographicCamera, PerspectiveCamera, Scene } from "three";
import { createWorkerObjectUrl } from "./utils.js";

type CameraControlsLike = {
  addEventListener(type: "change" | "update", listener: (e: unknown) => void): void;
};

// sets up the 3D viewer and engine (initialization)
export async function createViewerEngine(viewerContainer: HTMLElement) {
  const engineComponents = new TOC.Components();                                     // central service registry for the engine

                                                                               
  const worlds = engineComponents.get(TOC.Worlds);                                   // create world and scene
  const world = worlds.create();
  const simpleScene = new TOC.SimpleScene(engineComponents) as TOC.SimpleScene;
  world.scene = simpleScene;
  simpleScene.setup();
  (world.scene.three as Scene).background = null;                                    // transparent background (no color)

                                                                               
  world.renderer = new TOF.PostproductionRenderer(engineComponents, viewerContainer);// renderer and camera setup
  world.camera = new TOC.OrthoPerspectiveCamera(engineComponents);
  await world.camera.controls!.setLookAt(78, 20, -2.2, 26, -4, 25);                  // set initial view position and target

                                                                               
  engineComponents.init();                                                           // initialize components and helpers (engine init)
  engineComponents.get(TOC.Grids).create(world);                                     // show grid helper in the scene

  // prepare fragments manager and worker
  const fragments = engineComponents.get(TOC.FragmentsManager);
  const fragmentWorkerUrl = "https://thatopen.github.io/engine_fragment/resources/worker.mjs";
  const workerObjectUrl = await createWorkerObjectUrl(fragmentWorkerUrl);            // hosted worker URL to parse fragments off the main thread
  fragments.init(workerObjectUrl);                                                   // boot fragments with the worker (init)

  // keep fragments up-to-date with camera/scene changes
  (world.camera.controls as CameraControlsLike).addEventListener("change", () => fragments.core.update(true)); // recompute on camera move
  fragments.list.onItemSet.add(({ value: model }) => {  // when a fragment model loads, attach it
    model.useCamera(world.camera.three as PerspectiveCamera | OrthographicCamera); // link model shaders to camera (camera binding) to ensure correct uniforms
    world.scene.three.add(model.object);                // add model to scene graph to render it
    fragments.core.update(true);                        // force a render update
  });

  // render loop
  let isRendering = true;
  const viewerRenderer = world.renderer;                 // keep renderer non-null for strict TypeScript
  if (viewerRenderer.three?.setAnimationLoop) {
    viewerRenderer.three.setAnimationLoop(() => {        // use rAF-based loop when available via requestAnimationFrame
      if (isRendering) viewerRenderer.update();
    });
  }
  document.addEventListener("visibilitychange", () => {  // pause/resume on tab visibility changes to save resources when hidden
    isRendering = !document.hidden;
  });

  return { engineComponents, world, fragments };
}
