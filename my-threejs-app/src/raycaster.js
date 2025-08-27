import { FragmentsManager, Raycasters } from "@thatopen/components";
import * as FRAGS from "@thatopen/fragments";
import * as THREE from "three";

const primaryColor = (typeof document !== "undefined" && typeof getComputedStyle === "function")
  ? getComputedStyle(document.documentElement).getPropertyValue("--primary").trim()
  : "#FF0000";


export const HIGHLIGHT_STYLE = {
  color: new THREE.Color(primaryColor || "#FF0000"),
  color: new THREE.Color(primaryColor),
  renderedFaces: FRAGS.RenderedFaces.ONE,                        // nur eine Seite der Fragmente hervorgehoben wird
  opacity: 0.6,
  transparent: true,
};

export function initRaycaster(engineComponents, world, handleRaycastSelection) { // Raycaster konfigurierung mit Service-Container und World und Treffer
  console.log("[raycaster] initRaycaster", { engineComponents, world }); // Debug init args
  const raycaster = engineComponents.get(Raycasters).get(world); // Raycasters.get(world) liefert ein Objekt mit Maus-Helfern und castRay()
  const canvas = world.renderer.three.domElement;                // für registrieren Maus-Events

  canvas.addEventListener('click', async event => {
    console.log("[raycaster] canvas click", { x: event.clientX, y: event.clientY }); // Debug click coordinates
    raycaster.mouse.updateMouseInfo(event);
    const rayHit = await raycaster.castRay();                    // raycaster.castRay() Wirft den Ray in die Szene und wartet auf das Treffer-Ergebnis und 'rayHit' enthält getroffene Fragmente/IDs
    console.log("[raycaster] rayHit", rayHit); // Debug raycast result
    if (rayHit) {
      handleRaycastSelection({
        modelId: rayHit.fragments.modelId,
        itemId: rayHit.localId,
        point: rayHit.point ? rayHit.point.clone() : undefined,
      });
    } else {
      handleRaycastSelection(null);
    }
  });
}

export function highlightSelection(components, selection) {
  console.log("[raycaster] highlightSelection", selection); // Debug highlight call
  const withMouseSelected = { [selection.modelId]: [selection.itemId] };
  const fragMan = components.get(FragmentsManager);
  fragMan.resetHighlight(); // Remove Highlight
  fragMan.highlight(HIGHLIGHT_STYLE, withMouseSelected);
  fragMan.core?.update(true); // Sofortiges Re-Render anstoßen
} 