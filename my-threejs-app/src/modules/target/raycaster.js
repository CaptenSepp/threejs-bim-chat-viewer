// @ts-check
import { FragmentsManager, Raycasters } from "@thatopen/components";
import * as FRAGS from "@thatopen/fragments";
import * as THREE from "three";
import { handleCanvasClick, handleEscapeKey } from "./raycaster-helpers.js";


const cssPrimaryColor = (typeof document !== "undefined" && typeof getComputedStyle === "function")
  ? getComputedStyle(document.documentElement).getPropertyValue("--primary").trim()
  : "#FF0000";


export const SELECTION_HIGHLIGHT_STYLE = {
  color: new THREE.Color(cssPrimaryColor || "#FF0000"),
  renderedFaces: FRAGS.RenderedFaces.ONE,                     // ???: render only front faces (Doku empfohlen)
  opacity: 0.6,
  transparent: true,
};

export function setRaycastEvents(engineComponents, world, applySelEffects) { // sets up click raycasting and selection handling
  const raycaster = engineComponents.get(Raycasters).get(world);                  // get raycaster for this spesific world to connect to the mouse
  const canvas = world.renderer.three.domElement;                                 // canvas we attach events to (canvas element) to receive mouse events

  canvas.addEventListener('click', async event => handleCanvasClick(event, engineComponents, raycaster, applySelEffects)); // WAIT and LISTEN for CLICK in CANVAS :)
  document.addEventListener('keydown', e => handleEscapeKey(e, engineComponents));                             // ESC clears highlight and active marker
}

export function applySelHighlight(components, sel) {
  const withMouseSelected = { [sel.modelId]: [sel.itemId] };
  const fragMan = components.get(FragmentsManager);
  fragMan.resetHighlight();                                                 // clear previous highlight
  fragMan.highlight(SELECTION_HIGHLIGHT_STYLE, withMouseSelected);
  fragMan.core?.update(true);                                               // force an immediate render update
}

