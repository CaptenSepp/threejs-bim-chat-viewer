import * as ThatOpenFront from "@thatopen/components-front";                       // front helpers (Marker overlay system)
import type { Components } from "@thatopen/components";
import { getSelectionAttributes, createMarkerValues, applyMarkerLabelValues, computeMarkerWorldPosition, updateMarkerInstance } from "./marker-helpers.js";
import { updateActiveMarkerContext, clearActiveMarkerContext } from "./marker-visibility.js";
import type { MarkerAttributesType, MarkerServiceType, ModelSelectionType, ViewerWorldType } from "../../types/app-types.js";

let markerServInst: MarkerServiceType;                         // holds the screen-space marker service (creates/updates/deletes markers)
let markerLabelElemTemp: HTMLElement;                          // cloned HTML element used as the marker label (DOM template instance)
let activeMarkerInstId: string | null;                         // id/handle of the currently shown marker (for deletion/replacement)

export function setMarker(engineComponents: Components): void {                                                                  // prepares HTML overlay (initialization)
  const markerTemplateNode = document.getElementById("marker-template");                                                        // find the template in index.html
  if (!(markerTemplateNode instanceof HTMLTemplateElement)) throw new Error("Missing #marker-template");
  const markerTemplateElement = markerTemplateNode;
  const markerTemplateChild = markerTemplateElement.content.firstElementChild;
  if (!(markerTemplateChild instanceof HTMLElement)) throw new Error("Template #marker-template has no HTML child");
  const markerLabelClone = markerTemplateChild.cloneNode(true);
  if (!(markerLabelClone instanceof HTMLElement)) throw new Error("Template #marker-template clone is invalid");
  markerLabelElemTemp = markerLabelClone; // clone label element (detached DOM node)
  markerServInst = engineComponents.get(ThatOpenFront.Marker);                                                                   // get Marker service
}

export async function renderMarkerForSel(engineComponents: Components, world: ViewerWorldType, sel: ModelSelectionType): Promise<MarkerAttributesType> { // shows marker and fills metadata
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

