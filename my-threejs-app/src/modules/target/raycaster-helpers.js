// @ts-check
import { FragmentsManager } from "@thatopen/components";
import * as THREE from "three";
import { removeActiveMarker } from "./marker.js";

async function buildSelFromRayHit(engineComponents, rayHit) { // builds selection info from a ray hit
  const modelId = rayHit.fragments.modelId;                   // read model identifier (model id)
  const itemId = rayHit.localId;                              // item identifier (local id)
  let selection = { modelId, itemId };                        // minimal selection payload(data package) (fallback(backup/default)) to keep working when fragments API is unavailable, when there is no more data coming
  try {
    const fragMan = engineComponents.get(FragmentsManager);   // get fragment manager if available
    if (fragMan && typeof fragMan.getBBoxes === 'function') {
      const [bBox] = await fragMan.getBBoxes({ [modelId]: [itemId] });   // fetch bounding box (Box3) to compute framing and marker position
      const vector3Center = bBox.getCenter(new THREE.Vector3());         // compute center (Vector3)
      selection = { modelId, itemId, center: vector3Center, box: bBox }; // enriched selection (with box) to enable camera/marker updates
    }
  } catch (_) {                                                                 // ignore if fragments manager is not present
                                                                         
  }
  return selection;                                                             // return minimal or enriched selection
}

export async function handleCanvasClick(event, engineComponents, raycaster, applySelectionEffects) {
  raycaster.mouse.updateMouseInfo(event);
  const rayHit = await raycaster.castRay();                                     // cast a ray and wait for a hit

  if (rayHit) {
    const selection = await buildSelFromRayHit(engineComponents, rayHit);       // build selection data from the hit to include ids and bBox
    applySelectionEffects(selection);                                           // hand selection to caller for effects (callback)
    return;
  }
}

export function handleEscapeKey(e, engineComponents) {
  if (e.key === 'Escape') {
    const fragMan = engineComponents.get(FragmentsManager);
    fragMan.resetHighlight();                                             // clear current highlight
    fragMan.core?.update(true);
    removeActiveMarker();
  }
}

