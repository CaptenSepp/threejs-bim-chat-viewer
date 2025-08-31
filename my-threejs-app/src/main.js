import * as THREE from "three";
import { setReference as setChatReference } from "./chat.js"; // Kopplung 3D-Selektion ��' Chat
import { setupMarkerOverlay, renderMarkerForSelection } from "./marker.js";
import { applySelectionHighlight, setupRaycastSelection } from "./raycaster.js";
import { loadFragmentsFromPath } from "./utils.js";
import { createViewerEngine } from "./viewer.js";

const viewerContainer = document.getElementById("three-canvas");

// Core logic
const { engineComponents, world, fragments } = await createViewerEngine(viewerContainer);

window.applyChatSelectionHighlight = sel => applySelectionHighlight(engineComponents, sel); // Re-highlights im 3D

async function fitCameraToSelectionBox(world, selection) { // extract camera focusing logic
  const controls = world.camera.controls;              // access controls once
  if (selection.box) {                                 // use box to center/zoom when available
    await controls.fitToBox(selection.box, true);      // Objekt per Box3 zentrieren/zoomen delegate to controls
    return;                                            // done when box is available
  }
}

// Event handlers
async function applySelectionEffects(selection) {
  applySelectionHighlight(engineComponents, selection);
  setChatReference({
    label: `Item ${selection.itemId}`, modelId: selection.modelId, itemId: selection.itemId,
  });
  await renderMarkerForSelection(engineComponents, world, selection);
  await fitCameraToSelectionBox(world, selection); // delegate camera focusing
}

setupRaycastSelection(engineComponents, world, applySelectionEffects);

// Initialization
await loadFragmentsFromPath(fragments);

setupMarkerOverlay(engineComponents);
