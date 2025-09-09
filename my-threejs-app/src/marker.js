import { FragmentsManager } from "@thatopen/components";
import * as OBF from "@thatopen/components-front";

let marker, markerLabelEl, activeMarkerId;

export function setupMarkerOverlay(engineComponents) { // prepares HTML overlay and marker service
  const tpl = document.getElementById("marker-template");
  markerLabelEl = tpl.content.firstElementChild.cloneNode(true);

  marker = engineComponents.get(OBF.Marker);
}

export async function renderMarkerForSelection(engineComponents, world, selection) { // shows a marker and metadata
  const fragMan = engineComponents.get(FragmentsManager);

  // fetches attributes for this item (attributes API)
  const data = await fragMan.getData({ [selection.modelId]: [selection.itemId] });
  const attrs = data[selection.modelId][0];

  // unwraps value objects to plain values to normalize mixed attribute shapes
  const val = (v) => (v && typeof v === "object" && "value" in v ? v.value : v);

  // fills overlay fields with attributes
  markerLabelEl.querySelector(".val-name").textContent = val(attrs.Name);
  markerLabelEl.querySelector(".val-objecttype").textContent = val(attrs.ObjectType);
  markerLabelEl.querySelector(".val-tag").textContent = val(attrs.Tag);
  markerLabelEl.querySelector(".val-category").textContent = val(attrs._category);
  markerLabelEl.querySelector(".val-localid").textContent = val(attrs._localId);

  // place marker slightly above the selection
  const pos = selection.center.clone();                              // clones center position (Vector3) to avoid mutating the original
  pos.y += 12;                                                       // lift marker above object (offset) 
  if (activeMarkerId) marker.delete(activeMarkerId);                 // remove previous marker
  activeMarkerId = marker.create(world, markerLabelEl, pos, true);   // create new screen-space marker to attach the label at the position
}

export function removeActiveMarker() {                               // removes marker if one exists
  if (activeMarkerId) {
    marker.delete(activeMarkerId);
    activeMarkerId = null;
  }
}
