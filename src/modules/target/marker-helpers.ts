import { FragmentsManager as EngineFragmentsManager } from "@thatopen/components";                       // engine service to access fragment data (attributes API)
import type { Components } from "@thatopen/components";
import type {
  MarkerServiceType,
  ModelSelectionType,
  ViewerWorldType,
} from "../../types/app-types.js";
import type { Vector3 } from "three";

// Raw marker values can be plain or wrapped in a value object.
type MarkerAttributeValueType =
  | string
  | number
  | { value?: string | number }
  | MarkerAttributesSourceType[]
  | null
  | undefined;
// Marker attributes are stored by attribute name.
type MarkerAttributesSourceType = Record<string, MarkerAttributeValueType>;
export async function getSelectionAttributes(engineComponents: Components, sel: ModelSelectionType): Promise<MarkerAttributesSourceType> {
  const fragmentsManager = engineComponents.get(EngineFragmentsManager);                                  // access fragment data service

// fetch attributes for the selected item (attributes API -> object of key/value pairs)
  const attributesByModel = await fragmentsManager.getData({ [sel.modelId]: new Set([sel.itemId]) });    // returns { [modelId]: [attrsForItem] }
  const attrs = attributesByModel[sel.modelId][0];                                                       // take first (only) item attributes
  return attrs;
}

export function createMarkerValues(attrs: MarkerAttributesSourceType): {
  markerName: string;
  markerObjectType: string;
  markerTag: string;
  markerCategory: string;
  markerLocalId: string;
} {
  const asPlainValue = (v: MarkerAttributeValueType) => (v && typeof v === "object" && "value" in v ? v.value : v); // unwrap value objects to plain values (some entries are { value: X }) to normalize mixed shapes
  const asTextValue = (v: MarkerAttributeValueType) => String(asPlainValue(v) || 'Not mentioned!');       // convert marker values to display text

// fill overlay fields with attributes
  const markerName = asTextValue(attrs.Name);                                                           // reuse marker data for prompt
  const markerObjectType = asTextValue(attrs.ObjectType);
  const markerTag = asTextValue(attrs.Tag);
  const markerCategory = asTextValue(attrs._category);
  const markerLocalId = asTextValue(attrs._localId);
  return { markerName, markerObjectType, markerTag, markerCategory, markerLocalId };
}

export function applyMarkerLabelValues(markerLabelElemTemp: HTMLElement, markerName: string | number, markerObjectType: string | number, markerTag: string | number, markerCategory: string | number, markerLocalId: string | number) {
  markerLabelElemTemp.querySelector(".val-name")!.textContent = String(markerName);  // chaning values directly into html template node
  markerLabelElemTemp.querySelector(".val-objecttype")!.textContent = String(markerObjectType);
  markerLabelElemTemp.querySelector(".val-tag")!.textContent = String(markerTag);
  markerLabelElemTemp.querySelector(".val-category")!.textContent = String(markerCategory);
  markerLabelElemTemp.querySelector(".val-localid")!.textContent = String(markerLocalId);
}

export function computeMarkerWorldPosition(sel: ModelSelectionType): Vector3 {
  // place marker slightly above the selection (position = Vector3 in world space)
  const markerWorldPosition = sel.center!.clone();                       // clone center (avoid mutating selection.center)
  markerWorldPosition.y += 6;                                            // offset in meters
  return markerWorldPosition;
}

export function updateMarkerInstance(markerServInst: MarkerServiceType, activeMarkerInstId: string | null, world: ViewerWorldType, markerLabelElemTemp: HTMLElement, markerWorldPosition: Vector3): string | null {
  if (activeMarkerInstId) markerServInst.delete(activeMarkerInstId);     // remove previous marker
  const newActiveMarkerInstId = markerServInst.create(                   // create new screen-space marker
    world, markerLabelElemTemp, markerWorldPosition, true
  );
  return newActiveMarkerInstId;
}

