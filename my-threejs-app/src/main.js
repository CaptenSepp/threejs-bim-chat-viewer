// @ts-check
import { loadFragmentsFromPath } from "./core/utils.js";
import { createViewerEngine } from "./core/viewer.js";
import { setComposerReference } from "./modules/chat/chat.js"; // links 3D selection to chat actions
import { renderMarkerForSel, setupMarker } from "./modules/target/marker.js";
import { applySelHighlight, setupRaycastSel } from "./modules/target/raycaster.js";
import { displayUserErrorSnackbar } from "./ui/error-notify.js";

const viewerContainer = document.getElementById("three-canvas");

// wrap startup in async init to avoid top-level await parse issues
async function init() {
  // creates viewer engine and scene 
  const { engineComponents, world, fragments } = await createViewerEngine(viewerContainer);

  window.applyChatSelectionHighlight = sel => applySelHighlight(engineComponents, sel); // re-applies selection highlight in 3D scene to reflect chat clicks in 3D

  async function fitCameraToSelectionBox(world, selection) {    // focuses camera on the selected area
    const camControls = world.camera.controls;                  // use camera controls once
    if (selection.box) {                                        // if bounding box exists, frame it (Box3)
      await camControls.fitToBox(selection.box, true);          // center and zoom to the box
      return;
    }
  }

  // handles a resolved selection: highlight, chat, marker, camera
  async function applySelEffects(sel) {
    applySelHighlight(engineComponents, sel);
    const markerAttributes = await renderMarkerForSel(engineComponents, world, sel); // reuse marker data
    setComposerReference({
      label: `Item ${sel.itemId}`,
      modelId: sel.modelId,
      itemId: sel.itemId,
      attributes: markerAttributes || null, // forward marker fields for chat
    });
    // await fitCameraToSelectionBox(world, selection); // focus camera on selection for commented for later uses
  }

  setupRaycastSel(engineComponents, world, applySelEffects);

  // loads fragments and prepares marker overlay (initialization)
  await loadFragmentsFromPath(fragments);

  setupMarker(engineComponents);
}

// catch startup errors and show to user
init().catch(err => {
  const msg = (err && err.message) ? err.message : String(err || 'Fehler');
  displayUserErrorSnackbar(msg);
});

// global wiring for runtime errors
window.addEventListener('error', (e) => {
  if (!e) return;
  const m = (e.error && e.error.message) || e.message || 'Fehler';
  displayUserErrorSnackbar(m);
});
window.addEventListener('unhandledrejection', (e) => {
  if (!e) return;
  const r = e.reason;
  const m = (r && r.message) ? r.message : String(r || 'Fehler');
  displayUserErrorSnackbar(m);
});
