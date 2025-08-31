import * as THREE from "three";
import { setReference as setChatReference } from "./chat.js"; // Kopplung 3D-Selektion ��' Chat
import { initMarker, updateMarker } from "./marker.js";
import { highlightSelection, initRaycaster } from "./raycaster.js";
import { loadFragments } from "./utils.js";
import { initViewer } from "./viewer.js";

const viewerContainer = document.getElementById("three-canvas");

// Core logic
const { engineComponents, world, fragmentManager } = await initViewer(viewerContainer);

window.highlightFromChat = sel => highlightSelection(engineComponents, sel); // Re-highlights im 3D

async function focusCameraOnSelection(world, selection) { // extract camera focusing logic
  const controls = world.camera.controls;              // access controls once
  if (selection.box) {                                 // use box to center/zoom when available
    await controls.fitToBox(selection.box, true);      // Objekt per Box3 zentrieren/zoomen delegate to controls
    return;                                            // done when box is available
  }
}

// Event handlers
async function handleRaycastSelection(selection) {
  highlightSelection(engineComponents, selection);
  setChatReference({
    label: `Item ${selection.itemId}`,
    modelId: selection.modelId,
    itemId: selection.itemId,
  });
  await updateMarker(engineComponents, world, selection);
  await focusCameraOnSelection(world, selection); // delegate camera focusing
}

initRaycaster(engineComponents, world, handleRaycastSelection);

// Initialization
await loadFragments(fragmentManager);

initMarker(engineComponents, world);
