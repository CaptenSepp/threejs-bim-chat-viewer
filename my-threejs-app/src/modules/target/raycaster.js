import { FragmentsManager, Raycasters } from "@thatopen/components";
import * as FRAGS from "@thatopen/fragments";
import * as THREE from "three";
import { removeActiveMarker } from "./marker.js";


const cssPrimaryColor = (typeof document !== "undefined" && typeof getComputedStyle === "function")
  ? getComputedStyle(document.documentElement).getPropertyValue("--primary").trim()
  : "#FF0000";


export const SELECTION_HIGHLIGHT_STYLE = {
  color: new THREE.Color(cssPrimaryColor || "#FF0000"),
  renderedFaces: FRAGS.RenderedFaces.ONE,                   // ???: render only front faces (Doku empfohlen)
  opacity: 0.6,
  transparent: true,
};

async function buildSelFromRayHit(engineComponents, rayHit) { // builds selection info from a ray hit
  const modelId = rayHit.fragments.modelId;                 // read model identifier (model id)
  const itemId = rayHit.localId;                            // item identifier (local id)
  let selection = { modelId, itemId };                      // minimal selection payload(data package) (fallback(backup/default)) to keep working when fragments API is unavailable, when there is no more data coming
  try {
    const fragMan = engineComponents.get(FragmentsManager); // get fragment manager if available
    if (fragMan && typeof fragMan.getBBoxes === 'function') {
      const [bBox] = await fragMan.getBBoxes({ [modelId]: [itemId] }); // fetch bounding box (Box3) to compute framing and marker position
      const vector3Center = bBox.getCenter(new THREE.Vector3());       // compute center (Vector3)
      selection = { modelId, itemId, center: vector3Center, box: bBox }; // enriched selection (with box) to enable camera/marker updates
    }
  } catch (_) {
    // ignore if fragments manager is not present
  }
  return selection;                                         // return minimal or enriched selection
}

export function setupRaycastSel(engineComponents, world, applySelectionEffects) { // sets up click raycasting and selection handling
  const raycaster = engineComponents.get(Raycasters).get(world); // get raycaster for this spesific world to connect to the mouse
  const canvas = world.renderer.three.domElement;                // canvas we attach events to (canvas element) to receive mouse events (listener)

  canvas.addEventListener('click', async event => {              // WAIT and LISTEN for CLICK in CANVAS :)
    raycaster.mouse.updateMouseInfo(event);
    const rayHit = await raycaster.castRay();   // cast a ray and wait for a hit

    if (rayHit) {
      const selection = await buildSelFromRayHit(engineComponents, rayHit); // build selection data from the hit to include ids and bBox
      applySelectionEffects(selection);      // hand selection to caller for effects (callback)
      return;
    }
  });
  document.addEventListener('keydown', (e) => { // ESC clears highlight and active marker
    if (e.key === 'Escape') {
      const fragMan = engineComponents.get(FragmentsManager);
      fragMan.resetHighlight();                 // clear current highlight
      fragMan.core?.update(true);
      removeActiveMarker();
    }
  });
}

export function applySelHighlight(components, selection) {
  const withMouseSelected = { [selection.modelId]: [selection.itemId] };
  const fragMan = components.get(FragmentsManager);
  fragMan.resetHighlight();                     // clear previous highlight
  fragMan.highlight(SELECTION_HIGHLIGHT_STYLE, withMouseSelected);
  fragMan.core?.update(true);                   // force an immediate render update
} 
