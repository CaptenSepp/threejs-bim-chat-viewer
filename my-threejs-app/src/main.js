import * as THREE from "three";
import { setReference } from "./chat.js"; // Kopplung 3D-Selektion ��' Chat
import { initMarker, updateMarker } from "./marker.js";
import { highlightSelection, initRaycaster } from "./raycaster.js";
import { loadFragments } from "./utils.js";
import { initViewer } from "./viewer.js";

const viewerContainer = document.getElementById("three-canvas");

// Core logic
const { engineComponents, world, fragmentManager } = await initViewer(viewerContainer);

window.highlightFromChat = sel => highlightSelection(engineComponents, sel); // Re-highlights im 3D

// Event handlers
async function handleRaycastSelection(selection) {
  highlightSelection(engineComponents, selection);
  setReference({
    label: `Item ${selection.itemId}`,
    modelId: selection.modelId,
    itemId: selection.itemId,
  });
  await updateMarker(engineComponents, world, selection);

  const controls = world.camera.controls;
  const eye = new THREE.Vector3();
  const target = new THREE.Vector3();
  controls.getPosition(eye);                   // Aktuelle Kamera-Position (Eye)
  controls.getTarget(target);                  // Aktuelles Ziel

  const offset = eye.sub(target);              // Offset = Eye - Target
  const newEye = selection.center.clone().add(offset); // neuer Fokus + gleicher Offset

  await controls.setLookAt(
    newEye.x, newEye.y, newEye.z,              // gleich weit entfernt
    selection.center.x, selection.center.y, selection.center.z, // der Objekt-Center
    true                                       // smooth transition
  );
}

initRaycaster(engineComponents, world, handleRaycastSelection);

// Initialization
await loadFragments(fragmentManager);

initMarker(engineComponents, world);

