// @ts-check
import { FragmentsManager as EngineFragmentsManager } from "@thatopen/components";                       // engine service to access fragment data (attributes API)

export async function getSelectionAttributes(engineComponents, selection) {
  const fragmentsManager = engineComponents.get(EngineFragmentsManager);                                 // access fragment data service

// fetch attributes for the selected item (attributes API -> object of key/value pairs)
  const attributesByModel = await fragmentsManager.getData({ [selection.modelId]: [selection.itemId] }); // returns { [modelId]: [attrsForItem] }
  const attrs = attributesByModel[selection.modelId][0];                                                 // take first (only) item attributes
  return attrs;
}

export function createMarkerValues(attrs) {
  const asPlainValue = (v) => (v && typeof v === "object" && "value" in v ? v.value : v);                // unwrap value objects to plain values (some entries are { value: X }) to normalize mixed shapes

  // fill overlay fields with attributes (debug-friendly names)
  const markerName = asPlainValue(attrs.Name) || 'Not mentioned!';                                       // reuse marker data for prompt
  const markerObjectType = asPlainValue(attrs.ObjectType) || 'Not mentioned!';
  const markerTag = asPlainValue(attrs.Tag) || 'Not mentioned!';
  const markerCategory = asPlainValue(attrs._category) || 'Not mentioned!';
  const markerLocalId = asPlainValue(attrs._localId) || 'Not mentioned!';
  return { markerName, markerObjectType, markerTag, markerCategory, markerLocalId };
}

export function applyMarkerLabelValues(markerLabelElemTemp, markerName, markerObjectType, markerTag, markerCategory, markerLocalId) {
  markerLabelElemTemp.querySelector(".val-name").textContent = markerName;
  markerLabelElemTemp.querySelector(".val-objecttype").textContent = markerObjectType;
  markerLabelElemTemp.querySelector(".val-tag").textContent = markerTag;
  markerLabelElemTemp.querySelector(".val-category").textContent = markerCategory;
  markerLabelElemTemp.querySelector(".val-localid").textContent = markerLocalId;
}

export function computeMarkerWorldPosition(selection) {
  // place marker slightly above the selection (position = Vector3 in world space)
  const markerWorldPosition = selection.center.clone();                  // clone center (avoid mutating selection.center)
  markerWorldPosition.y += 6;                                            // offset in meters
  return markerWorldPosition;
}

export function updateMarkerInstance(markerServInst, activeMarkerInstId, world, markerLabelElemTemp, markerWorldPosition) {
  if (activeMarkerInstId) markerServInst.delete(activeMarkerInstId);     // remove previous marker
  const newActiveMarkerInstId = markerServInst.create(                   // create new screen-space marker
    world, markerLabelElemTemp, markerWorldPosition, true
  );
  return newActiveMarkerInstId;
}

