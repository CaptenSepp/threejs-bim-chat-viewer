import { FragmentsManager, Raycasters } from "@thatopen/components";
import type { Components, SimpleRaycaster } from "@thatopen/components";
import * as FRAGS from "@thatopen/fragments";
import * as THREE from "three";
import { handleCanvasClick, handleEscapeKey } from "./raycaster-helpers.js";
import type { ModelSelectionType, ViewerWorldType } from "../../types/app-types.js";

type RaycastersServiceType = {
  get(world: ViewerWorldType): SimpleRaycaster;
};

const cssPrimaryColor = (typeof document !== "undefined" && typeof getComputedStyle === "function")
  ? getComputedStyle(document.documentElement).getPropertyValue("--primary").trim()
  : "#FF0000";


export const SELECTION_HIGHLIGHT_STYLE: {
  color: THREE.Color;
  renderedFaces: typeof FRAGS.RenderedFaces.ONE;
  opacity: number;
  transparent: boolean;
} = {
  color: new THREE.Color(cssPrimaryColor || "#FF0000"),
  renderedFaces: FRAGS.RenderedFaces.ONE,                     // ???: render only front faces (Doku empfohlen)
  opacity: 0.6,
  transparent: true,
};

export function setRaycastEvents(engineComponents: Components, world: ViewerWorldType, applySelEffects: (sel: ModelSelectionType) => void | Promise<void>): void { // sets up click raycasting and selection handling
  const raycastersService = engineComponents.get(Raycasters) as unknown as RaycastersServiceType; // get raycaster service from the engine
  const raycaster = raycastersService.get(world);                                 // get raycaster for this spesific world to connect to the mouse
  const canvas = world.renderer!.three.domElement;                                // canvas we attach events to (canvas element) to receive mouse events

  canvas.addEventListener('click', async (event: MouseEvent) => handleCanvasClick(event, engineComponents, raycaster, applySelEffects)); // WAIT and LISTEN for CLICK in CANVAS :)
  document.addEventListener('keydown', e => handleEscapeKey(e, engineComponents));                             // ESC clears highlight and active marker
}

export function applySelHighlight(components: Components, sel: ModelSelectionType): void {
  const withMouseSelected = { [sel.modelId]: new Set([sel.itemId]) };
  const fragMan = components.get(FragmentsManager);
  fragMan.resetHighlight();                                                 // clear previous highlight
  fragMan.highlight(SELECTION_HIGHLIGHT_STYLE, withMouseSelected);
  fragMan.core?.update(true);                                               // force an immediate render update
}

