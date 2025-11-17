// @ts-check
import * as ThatOpenFront from "@thatopen/components-front";                       // front helpers (Marker overlay system)
import { getSelectionAttributes, createMarkerValues, applyMarkerLabelValues, computeMarkerWorldPosition, updateMarkerInstance } from "./marker-helpers.js";
import { updateActiveMarkerContext, clearActiveMarkerContext } from "./marker-visibility.js";

let markerServInst;                 // holds the screen-space marker service (creates/updates/deletes markers)
let markerLabelElemTemp;            // cloned HTML element used as the marker label (DOM template instance)
let activeMarkerInstId;             // id/handle of the currently shown marker (for deletion/replacement)

export function setMarker(engineComponents) {                                                                                   // prepares HTML overlay (initialization)
  const markerTemplateElement = document.getElementById("marker-template");                                                     // find the template in index.html
  markerLabelElemTemp = (/** @type {HTMLTemplateElement} */ (markerTemplateElement)).content.firstElementChild.cloneNode(true); // clone label element (detached DOM node)
  markerServInst = engineComponents.get(ThatOpenFront.Marker);                                                                  // get Marker service
}

export async function renderMarkerForSel(engineComponents, world, sel) {                                                        // shows marker and fills metadata
  const attrs = await getSelectionAttributes(engineComponents, sel);
  const { markerName, markerObjectType, markerTag, markerCategory, markerLocalId } = createMarkerValues(attrs);
  applyMarkerLabelValues(markerLabelElemTemp, markerName, markerObjectType, markerTag, markerCategory, markerLocalId);
  const markerWorldPosition = computeMarkerWorldPosition(sel);
  activeMarkerInstId = updateMarkerInstance(markerServInst, activeMarkerInstId, world, markerLabelElemTemp, markerWorldPosition);
  updateActiveMarkerContext(markerWorldPosition, {                                                                              // forward world position + attributes to watcher
    name: markerName,
    objectType: markerObjectType,
    tag: markerTag,
    category: markerCategory,
    localId: markerLocalId,
  });
  return {
    name: markerName, objectType: markerObjectType, tag: markerTag, category: markerCategory, localId: markerLocalId, // pass marker fields back for chat reference
  }
};

export function removeActiveMarker() {                                   // removes marker if one exists (cleanup)
  if (activeMarkerInstId) {
    markerServInst.delete(activeMarkerInstId);                           // delete marker by its id/handle
    activeMarkerInstId = null;                                           // clear the handle
  }
  clearActiveMarkerContext();                                            // reset visibility state and hide banner
}

