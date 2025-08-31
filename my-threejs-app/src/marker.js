import { FragmentsManager } from "@thatopen/components";
import * as OBF from "@thatopen/components-front";

let marker, label, markerId;

export function initMarker(engineComponents) {
  const tpl = document.getElementById("marker-template");
  label = tpl.content.firstElementChild.cloneNode(true);

  marker = engineComponents.get(OBF.Marker);
}

export async function updateMarker(engineComponents, world, sel) {
  const fragMan = engineComponents.get(FragmentsManager);

  // Array with one argument
  const data = await fragMan.getData({ [sel.modelId]: [sel.itemId] });
  const attrs = data[sel.modelId][0];

  // If { value: ... }, .value
  const val = (v) => (v && typeof v === "object" && "value" in v ? v.value : v);

  // Five fields
  label.querySelector(".val-name").textContent = val(attrs.Name);
  label.querySelector(".val-objecttype").textContent = val(attrs.ObjectType);
  label.querySelector(".val-tag").textContent = val(attrs.Tag);
  label.querySelector(".val-category").textContent = val(attrs._category);
  label.querySelector(".val-localid").textContent = val(attrs._localId);

  // Position middle the box
  const pos = sel.center.clone();                                           // Returns a new Box3 with the same min and max as this one
  pos.y += 12;
  if (markerId) marker.delete(markerId);
  markerId = marker.create(world, label, pos, true);
}

export function clearMarker() {
  if (markerId) {
    marker.delete(markerId);
    markerId = null;
  }
}