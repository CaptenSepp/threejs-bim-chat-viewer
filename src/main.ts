import { loadModelAutoDetect } from "./core/utils.js";              // load IFC or FRAG on startup
import { createViewerEngine } from "./core/viewer.js";
import { setComposerReference } from "./modules/chat/chat.js";
import { renderMarkerForSel, setMarker } from "./modules/target/marker.js";
import { initMarkerVisibilityWatcher } from "./modules/target/marker-visibility.js";
import { applySelHighlight, setRaycastEvents } from "./modules/target/raycaster.js";
import { displayUserErrorSnackbar } from "./ui/error-notify.js";
import type { ModelSelectionType, ViewerWorldType } from "./types/app-types.js";

const viewerContainer = document.getElementById("three-canvas") as HTMLElement; // canvas host exists in index.html


async function init() { // wrap startup in async init to avoid top-level await parse issues

  const { engineComponents, world, fragments } = await createViewerEngine(viewerContainer);// creates viewer engine and scene

  window.applyChatSelHighlight = (sel: { modelId: string; itemId: number }) => applySelHighlight(engineComponents, sel); // re-applies highlight in 3D scene - chat clicks in 3D

  async function fitCameraToSelBox(world: ViewerWorldType, sel: ModelSelectionType) { // focuses camera on the selected area
    const camControls = world.camera.controls;                  // use camera controls once
    if (sel.box) {                                              // if bounding box exists, frame it (Box3)
      await camControls!.fitToBox(sel.box, true);               // center and zoom to the box
      return;
    }
  }

  // handles a resolved selection: highlight, chat, marker, camera
  async function applySelEffects(sel: ModelSelectionType) {
    applySelHighlight(engineComponents, sel);
    const markerAttributes = await renderMarkerForSel(engineComponents, world, sel); // reuse marker data
    const localIdLabel = (markerAttributes && markerAttributes.localId) ? markerAttributes.localId : sel.itemId;
    setComposerReference({
      label: `Local ID ${localIdLabel}`,
      modelId: sel.modelId, 
      itemId: sel.itemId,
      attributes: markerAttributes || null,       // ???: forward marker fields for chat
    });
    // await fitCameraToSelBox(world, selection); // focus camera on selection for commented for later uses
  }

  setRaycastEvents(engineComponents, world as ViewerWorldType, applySelEffects);

  // loads IFC or FRAG and prepares marker overlay (initialization)
  // await loadModelAutoDetect(engineComponents, fragments, "/model/custom_psets.ifc");
  await loadModelAutoDetect(engineComponents, fragments, "/fragments/school_str.frag");

  setMarker(engineComponents);
  initMarkerVisibilityWatcher(world as ViewerWorldType); // start camera listener for banner visibility
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

