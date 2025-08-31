import { FragmentsManager, Raycasters } from "@thatopen/components";
import * as FRAGS from "@thatopen/fragments";
import * as THREE from "three";
import { clearMarker } from "./marker.js";


const primaryColor = (typeof document !== "undefined" && typeof getComputedStyle === "function")
  ? getComputedStyle(document.documentElement).getPropertyValue("--primary").trim()
  : "#FF0000";


export const HIGHLIGHT_STYLE = {
  color: new THREE.Color(primaryColor || "#FF0000"),
  renderedFaces: FRAGS.RenderedFaces.ONE,                   // Only one side of the fragments is highlighted
  opacity: 0.6,
  transparent: true,
};

async function getSelectionData(engineComponents, rayHit) { // helper to compute selection data
  const modelId = rayHit.fragments.modelId;                 // extract model id
  const itemId = rayHit.localId;                            // extract item id
  const fragMan = engineComponents.get(FragmentsManager);   // Get center via raycaster; access fragment manager
  const [bBox] = await fragMan.getBBoxes({ [modelId]: [itemId] }); // Result array of Box3; ThatOpen uses Three.js Box3 for 3D models; get bounding box
  const vector3Center = bBox.getCenter(new THREE.Vector3());       // Fills a Vector3 with the center of the box; getBBoxes is ThatOpen API; compute center
  return { modelId, itemId, center: vector3Center, box: bBox };    // pack selection data
}

export function initRaycaster(engineComponents, world, handleRaycastSelection) { // Raycaster configuration with service container and world; handle hits
  const raycaster = engineComponents.get(Raycasters).get(world); // Raycasters.get(world) returns an object with mouse helpers and castRay()
  const canvas = world.renderer.three.domElement;                // For registering mouse events

  canvas.addEventListener('click', async event => {
    raycaster.mouse.updateMouseInfo(event);
    const rayHit = await raycaster.castRay();   // Casts the ray into the scene and waits for a result; 'rayHit' contains hit fragments/IDs

    if (rayHit) {
      const selection = await getSelectionData(engineComponents, rayHit); // compute selection via helper
      handleRaycastSelection(selection);        // Pass selection (with center) to the callback; moved via helper
      return;
    }
  });
  document.addEventListener('keydown', (e) => { // ESC clears highlight and marker
    if (e.key === 'Escape') {
      const fragMan = engineComponents.get(FragmentsManager);
      fragMan.resetHighlight();                 // Remove Highlight
      fragMan.core?.update(true);
      clearMarker();
    }
  });
}

export function highlightSelection(components, selection) {
  const withMouseSelected = { [selection.modelId]: [selection.itemId] };
  const fragMan = components.get(FragmentsManager);
  fragMan.resetHighlight();                     // Remove Highlight
  fragMan.highlight(HIGHLIGHT_STYLE, withMouseSelected);
  fragMan.core?.update(true);                   // Sofortiges Re-Render anstoßen
} 
