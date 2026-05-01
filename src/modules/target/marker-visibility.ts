import {
  displayOffscreenBanner,
  hideOffscreenBanner,
} from "../../ui/marker-banner.js";
import { applyMarkerLabelValues } from "./marker-helpers.js";
import type { Camera, Vector3 } from "three";
import type { MarkerAttributesType, ViewerWorldType } from "../../types/app-types.js";

type CameraControlsLike = {
  addEventListener(type: string, listener: () => void): void;
};

type MarkerVisibilityWorldType = {
  camera: {
    three: Camera;
    controls?: CameraControlsLike | null;
  };
};

let activeMarkerWorldPos: Vector3 | null = null; // current marker world position to project and test visibility
let activeMarkerAttrs: MarkerAttributesType | null = null; // current marker attributes
let cameraThree: Camera | null = null; // cached THREE camera instance for fast access (avoids re-reading world each time)
let camControls: CameraControlsLike | null = null; // cached camera controls to listen for user-driven camera moves

export function initMarkerVisibilityWatcher(world: MarkerVisibilityWorldType): void {
  // Initialize once: listen to camera changes
  try {
    cameraThree = world.camera.three; // grab the underlying THREE camera
    camControls = world.camera.controls ?? null; // controls fire 'change' whenever the user pans/zooms/rotates
    if (camControls && typeof camControls.addEventListener === "function") {
      camControls.addEventListener("change", onCameraChange); // subscribe once to keep banner in sync with camera
      camControls.addEventListener("update", onCameraChange); // some controls fire only 'update' events
    }
  } catch (_) {
    /* no-op: avoid breaking the app */
  }
}

export function updateActiveMarkerContext(
  markerWorldPos: Vector3 | null,
  markerAttrs: MarkerAttributesType | null,
) {
  // Update when a marker is created/updated
  activeMarkerWorldPos = markerWorldPos ? markerWorldPos.clone() : null; // clone to avoid accidental external mutations
  activeMarkerAttrs = markerAttrs || null; // keep the latest 5 fields to show in the banner
  recalcAndToggleBanner(); // reflect immediately so UI updates without waiting for movement
}

export function clearActiveMarkerContext() {
  // Clear when marker is removed (e.g., ESC)
  activeMarkerWorldPos = null; // no target = nothing to track
  activeMarkerAttrs = null; // clear cached data so banner won’t show stale info
  hideOffscreenBanner(); // proactively hide the banner
}

function onCameraChange() {
  recalcAndToggleBanner();
}

function recalcAndToggleBanner() {
  // central place: compute visibility and toggle UI
  if (!activeMarkerWorldPos || !cameraThree) {
    // nothing to check or no camera available
    hideOffscreenBanner(); // hide to avoid showing an empty banner
    return; // and exit
  }
  const visible = isWorldPosInView(activeMarkerWorldPos, cameraThree); // true if world position projects inside the screen
  if (!visible && activeMarkerAttrs) {
    // only show when not visible and we have data to show
    const html = buildBannerHtml(activeMarkerAttrs); // build a small table from the template
    displayOffscreenBanner(html); // show top-right banner
  } else {
    hideOffscreenBanner(); // otherwise hide
  }
}

function isWorldPosInView(worldPos: Vector3, camera: Camera) {
  const ndc = worldPos.clone().project(camera); // project 3D point into Normalized Device Coordinates (-1..1)
  return (
    ndc.x >= -1 &&
    ndc.x <= 1 && // inside horizontal screen bounds
    ndc.y >= -1 &&
    ndc.y <= 1 && // inside vertical screen bounds
    ndc.z >= -1 &&
    ndc.z <= 1 // inside depth range (in front of camera)
  );
}

function buildBannerHtml(attrs: MarkerAttributesType) {
  // Clone template and fill text values for the banner
  const tplElement = document.getElementById("marker-banner-template"); // find the template in index.html
  const tpl = tplElement instanceof HTMLTemplateElement ? tplElement : null;
  if (tpl && tpl.content && tpl.content.firstElementChild) {
    // ensure template exists and has an element inside
    const clonedElement = tpl.content.firstElementChild.cloneNode(true);
    if (!(clonedElement instanceof HTMLElement)) return "";
    const element = clonedElement; // deep-clone the template content (detached DOM)
    applyMarkerLabelValues(
      // fill the 5 cells via textContent (safe, no HTML injection)
      element,
      attrs.name || "",
      attrs.objectType || "",
      attrs.tag || "",
      attrs.category || "",
      attrs.localId || "",
    );
    return element.outerHTML; // return as HTML string for the banner container
  }
  return ""; // If the template is missing, render nothing (avoid errors)
}
