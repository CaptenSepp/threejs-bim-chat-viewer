// @ts-check
import { displayMarkerOverflowBanner, hideMarkerOverflowBanner } from "../../ui/marker-banner.js";
import { applyMarkerLabelValues } from "./marker-helpers.js";

let activeMarkerWorldPos = null;                                              // current marker world position to project and test visibility
let activeMarkerAttrs = null;                                                 // current marker attributes
let cameraThree = null;                                                       // cached THREE camera instance for fast access (avoids re-reading world each time)
let camControls = null;                                                       // cached camera controls to listen for user-driven camera moves


export function initMarkerVisibilityWatcher(world) {                          // Initialize once: listen to camera changes
  try {
    cameraThree = /** @type {import('three').Camera} */ (world.camera.three); // grab the underlying THREE camera
    camControls = world.camera.controls;                                      // controls fire 'change' whenever the user pans/zooms/rotates
    if (camControls && typeof camControls.addEventListener === 'function') {
      camControls.addEventListener('change', onCameraChange);                 // subscribe once to keep banner in sync with camera
      camControls.addEventListener('update', onCameraChange);                 // some controls fire only 'update' events
    }
  } catch (_) { /* no-op: avoid breaking the app */ }
}


export function updateActiveMarkerContext(markerWorldPos, markerAttrs) {   // Update when a marker is created/updated
  activeMarkerWorldPos = markerWorldPos ? markerWorldPos.clone() : null;   // clone to avoid accidental external mutations
  activeMarkerAttrs = markerAttrs || null;                                 // keep the latest 5 fields to show in the banner
  recalcAndToggleBanner();                                                 // reflect immediately so UI updates without waiting for movement
}

export function clearActiveMarkerContext() {                               // Clear when marker is removed (e.g., ESC)
  activeMarkerWorldPos = null;                                             // no target = nothing to track
  activeMarkerAttrs = null;                                                // clear cached data so banner won’t show stale info
  hideMarkerOverflowBanner();                                              // proactively hide the banner
}

function onCameraChange() {
  recalcAndToggleBanner();
}

function recalcAndToggleBanner() {                                            // central place: compute visibility and toggle UI
  if (!activeMarkerWorldPos || !cameraThree) {                                // nothing to check or no camera available
    hideMarkerOverflowBanner();                                               // hide to avoid showing an empty banner
    return;                                                                   // and exit
  }
  const visible = isWorldPosInView(activeMarkerWorldPos, cameraThree);        // true if world position projects inside the screen
  if (!visible && activeMarkerAttrs) {                                        // only show when not visible and we have data to show
    const html = buildBannerHtml(activeMarkerAttrs);                          // build a small table from the template
    displayMarkerOverflowBanner(html);                                        // show top-right banner
  } else {
    hideMarkerOverflowBanner();                                               // otherwise hide
  }
}


function isWorldPosInView(worldPos, camera) {
  const ndc = worldPos.clone().project(camera);                               // project 3D point into Normalized Device Coordinates (-1..1)
  return (
    ndc.x >= -1 && ndc.x <= 1 &&                                              // inside horizontal screen bounds
    ndc.y >= -1 && ndc.y <= 1 &&                                              // inside vertical screen bounds
    ndc.z >= -1 && ndc.z <= 1                                                 // inside depth range (in front of camera)
  );
}


function buildBannerHtml(attrs) {                                              // Clone template and fill text values for the banner
  const tpl = /** @type {HTMLTemplateElement|null} */ (document.getElementById('marker-banner-template')); // find the template in index.html
  if (tpl && tpl.content && tpl.content.firstElementChild) {                   // ensure template exists and has an element inside
    const element = tpl.content.firstElementChild.cloneNode(true);             // deep-clone the template content (detached DOM)
    applyMarkerLabelValues(                                                    // fill the 5 cells via textContent (safe, no HTML injection)
      /** @type {HTMLElement} */(element),
      attrs.name || '', attrs.objectType || '', attrs.tag || '', attrs.category || '', attrs.localId || ''
    );
    return /** @type {HTMLElement} */ (element).outerHTML;                     // return as HTML string for the banner container
  }
  return '';                                                                   // If the template is missing, render nothing (avoid errors)
}
