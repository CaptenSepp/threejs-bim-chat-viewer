import { setComposerReference } from "./chat.js"; // links 3D selection to chat actions
import { renderMarkerForSelection, setupMarkerOverlay } from "./modules/target/marker.js";
import { applySelectionHighlight, setupRaycastSelection } from "./raycaster.js";
import { loadFragmentsFromPath } from "./core/utils.js";
import { createViewerEngine } from "./core/viewer.js";

const viewerContainer = document.getElementById("three-canvas");

// creates viewer engine and scene 
const { engineComponents, world, fragments } = await createViewerEngine(viewerContainer);

window.applyChatSelectionHighlight = sel => applySelectionHighlight(engineComponents, sel); // re-applies selection highlight in 3D scene to reflect chat clicks in 3D

async function fitCameraToSelectionBox(world, selection) { // focuses camera on the selected area
  const controls = world.camera.controls;                  // use camera controls once
  if (selection.box) {                                     // if bounding box exists, frame it (Box3)
    await controls.fitToBox(selection.box, true);          // center and zoom to the box
    return;
  }
}

// handles a resolved selection: highlight, chat, marker, camera
async function applySelectionEffects(selection) {
  applySelectionHighlight(engineComponents, selection);
  setComposerReference({
    label: `Item ${selection.itemId}`, modelId: selection.modelId, itemId: selection.itemId,
  });
  await renderMarkerForSelection(engineComponents, world, selection);
  await fitCameraToSelectionBox(world, selection); // focus camera on selection
}

setupRaycastSelection(engineComponents, world, applySelectionEffects);

// loads fragments and prepares marker overlay (initialization)
await loadFragmentsFromPath(fragments);

setupMarkerOverlay(engineComponents);
