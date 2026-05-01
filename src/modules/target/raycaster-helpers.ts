import { FragmentsManager } from "@thatopen/components";
import type { Components } from "@thatopen/components";
import * as THREE from "three";
import { removeActiveMarker } from "./marker.js";
import type { ModelSelectionType } from "../../types/app-types.js";

type RayHit = {
  fragments: { modelId: string };
  localId: number;
};

export type RaycasterLike = {
  mouse: { updateMouseInfo: (event: MouseEvent) => void };
  castRay: () => Promise<RayHit | null>;
};

async function buildSelFromRayHit(
  engineComponents: Components,
  rayHit: RayHit,
): Promise<ModelSelectionType> {
  // builds selection info from a ray hit
  const modelId = rayHit.fragments.modelId; // read model identifier (model id)
  const itemId = rayHit.localId; // item identifier (local id)
  let sel: ModelSelectionType = { modelId, itemId }; // minimal selection payload(data package) (fallback(backup/default)) to keep working when fragments API is unavailable, when there is no more data coming
  try {
    const fragMan = engineComponents.get(FragmentsManager); // get fragment manager if available
    if (fragMan && typeof fragMan.getBBoxes === "function") {
      const [bBox] = await fragMan.getBBoxes({ [modelId]: new Set([itemId]) }); // fetch bounding box (Box3) to compute framing and marker position
      const vector3Center = bBox.getCenter(new THREE.Vector3()); // compute center (Vector3)
      sel = { modelId, itemId, center: vector3Center, box: bBox }; // enriched selection (with box) to enable camera/marker updates
    }
  } catch (_) {
    // ignore if fragments manager is not present
  }
  return sel; // return minimal or enriched selection
}

export async function handleCanvasClick(
  event: MouseEvent,
  engineComponents: Components,
  raycaster: RaycasterLike,
  applySelEffects: (sel: ModelSelectionType) => void | Promise<void>,
) {
  raycaster.mouse.updateMouseInfo(event); // lines up the laser with the mouse point
  const rayHit = await raycaster.castRay(); // cast a ray and wait for a hit (Important: internally a lot of things happen which result in paring each hit to exact locaId of the selected element)

  if (rayHit) {
    const sel = await buildSelFromRayHit(engineComponents, rayHit); // build selection data from the hit to include ids and bBox
    applySelEffects(sel); // hand selection to caller for effects (callback)
    return;
  }
}

export function handleEscapeKey(
  e: KeyboardEvent,
  engineComponents: Components,
) {
  if (e.key === "Escape") {
    const fragMan = engineComponents.get(FragmentsManager);
    fragMan.resetHighlight(); // clear current highlight
    fragMan.core?.update(true);
    removeActiveMarker();
  }
}
