import { FragmentsManager } from "@thatopen/components";
import * as OBF from "@thatopen/components-front";

let marker, markerLabelEl, activeMarkerId;

export function setupMarkerOverlay(engineComponents) {
  const tpl = document.getElementById("marker-template");
  markerLabelEl = tpl.content.firstElementChild.cloneNode(true);

  marker = engineComponents.get(OBF.Marker);
}

export async function renderMarkerForSelection(engineComponents, world, selection) {
  const fragMan = engineComponents.get(FragmentsManager);

  // Array with one argument
  const data = await fragMan.getData({ [selection.modelId]: [selection.itemId] });
  const attrs = data[selection.modelId][0];

  // If { value: ... }, .value
  const val = (v) => (v && typeof v === "object" && "value" in v ? v.value : v);

  // Five fields
  markerLabelEl.querySelector(".val-name").textContent = val(attrs.Name);
  markerLabelEl.querySelector(".val-objecttype").textContent = val(attrs.ObjectType);
  markerLabelEl.querySelector(".val-tag").textContent = val(attrs.Tag);
  markerLabelEl.querySelector(".val-category").textContent = val(attrs._category);
  markerLabelEl.querySelector(".val-localid").textContent = val(attrs._localId);

  // Position middle the box
  const pos = selection.center.clone();                                           // Returns a new Box3 with the same min and max as this one
  pos.y += 12;
  if (activeMarkerId) marker.delete(activeMarkerId);
  activeMarkerId = marker.create(world, markerLabelEl, pos, true);
}

export function removeActiveMarker() {
  if (activeMarkerId) {
    marker.delete(activeMarkerId);
    activeMarkerId = null;
  }
}
