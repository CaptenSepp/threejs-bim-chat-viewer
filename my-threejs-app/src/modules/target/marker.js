// @ts-check
import { FragmentsManager as EngineFragmentsManager } from "@thatopen/components"; // engine service to access fragment data (attributes API)
import * as ThatOpenFront from "@thatopen/components-front";                       // front helpers (Marker overlay system)

let markerServInst;                 // holds the screen-space marker service (creates/updates/deletes markers)
let markerLabelElemTemp;            // cloned HTML element used as the marker label (DOM template instance)
let activeMarkerInstId;             // id/handle of the currently shown marker (for deletion/replacement)

export function setupMarker(engineComponents) {                                   // prepares HTML overlay (initialization)
  const markerTemplateElement = document.getElementById("marker-template");              // find the template in index.html
  markerLabelElemTemp = (/** @type {HTMLTemplateElement} */ (markerTemplateElement)).content.firstElementChild.cloneNode(true); // clone label element (detached DOM node)
  markerServInst = engineComponents.get(ThatOpenFront.Marker);                           // get Marker service
}

export async function renderMarkerForSel(engineComponents, world, selection) {     // shows marker and fills metadata
  const fragmentsManager = engineComponents.get(EngineFragmentsManager);                 // access fragment data service

  // fetch attributes for the selected item (attributes API → object of key/value pairs)
  const attributesByModel = await fragmentsManager.getData({ [selection.modelId]: [selection.itemId] }); // returns { [modelId]: [attrsForItem] }
  const attrs = attributesByModel[selection.modelId][0];                                 // take first (only) item attributes

  // unwrap value objects to plain values (some entries are { value: X }) to normalize mixed shapes
  const asPlainValue = (v) => (v && typeof v === "object" && "value" in v ? v.value : v);

  // fill overlay fields with attributes (debug-friendly names)
  markerLabelElemTemp.querySelector(".val-name").textContent = asPlainValue(attrs.Name);
  markerLabelElemTemp.querySelector(".val-objecttype").textContent = asPlainValue(attrs.ObjectType);
  markerLabelElemTemp.querySelector(".val-tag").textContent = asPlainValue(attrs.Tag);
  markerLabelElemTemp.querySelector(".val-category").textContent = asPlainValue(attrs._category);
  markerLabelElemTemp.querySelector(".val-localid").textContent = asPlainValue(attrs._localId);

  // place marker slightly above the selection (position = Vector3 in world space)
  const markerWorldPosition = selection.center.clone();                  // clone center (avoid mutating selection.center)
  markerWorldPosition.y += 6;                                            // offset in meters

  if (activeMarkerInstId) markerServInst.delete(activeMarkerInstId);     // remove previous marker
  activeMarkerInstId = markerServInst.create(                            // create new screen-space marker
    world,
    markerLabelElemTemp,
    markerWorldPosition,
    true
  );
}

export function removeActiveMarker() {                                   // removes marker if one exists (cleanup)
  if (activeMarkerInstId) {
    markerServInst.delete(activeMarkerInstId);                           // delete marker by its id/handle
    activeMarkerInstId = null;                                           // clear the handle
  }
}
