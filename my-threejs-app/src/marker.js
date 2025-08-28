import { FragmentsManager } from "@thatopen/components";
import * as OBF from "@thatopen/components-front";
import * as THREE from "three";

let marker, label, markerId;

export function initMarkers(engineComponents) {
  const tpl = document.getElementById("marker-template");
  label = tpl.content.firstElementChild.cloneNode(true);

  marker = engineComponents.get(OBF.Marker);
}

export async function updateMarker(engineComponents, world, sel) {
  const fragMan = engineComponents.get(FragmentsManager);

  // Array mit genau einem Eintrag, Attribute auf Top-Level
  const data = await fragMan.getData({ [sel.modelId]: [sel.itemId] });
  const attrs = data[sel.modelId][0];

  // falls { value: ... }, .value
  const val = (v) => (v && typeof v === "object" && "value" in v ? v.value : v);

  // Fünf Felder
  label.querySelector(".val-name").textContent = val(attrs.Name);
  label.querySelector(".val-objecttype").textContent = val(attrs.ObjectType);
  label.querySelector(".val-tag").textContent = val(attrs.Tag);
  label.querySelector(".val-category").textContent = val(attrs._category);
  label.querySelector(".val-localid").textContent = val(attrs._localId);

  // Position Mitte der BBox
  const boxes = await fragMan.getBBoxes({ [sel.modelId]: [sel.itemId] });
  const pos = boxes[0].getCenter(new THREE.Vector3());

  if (markerId) marker.delete(markerId);
  markerId = marker.create(world, label, pos, true);
}
