import { FragmentsManager, Raycasters } from "@thatopen/components";
import * as FRAGS from "@thatopen/fragments";
import * as THREE from "three";
import { clearMarker } from "./marker.js";


const primaryColor = (typeof document !== "undefined" && typeof getComputedStyle === "function")
  ? getComputedStyle(document.documentElement).getPropertyValue("--primary").trim()
  : "#FF0000";


export const HIGHLIGHT_STYLE = {
  color: new THREE.Color(primaryColor || "#FF0000"),
  renderedFaces: FRAGS.RenderedFaces.ONE,                        // nur eine Seite der Fragmente hervorgehoben wird
  opacity: 0.6,
  transparent: true,
};

export function initRaycaster(engineComponents, world, handleRaycastSelection) { // Raycaster konfigurierung mit Service-Container und World und Treffer 
  const raycaster = engineComponents.get(Raycasters).get(world); // Raycasters.get(world) liefert ein Objekt mit Maus-Helfern und castRay()
  const canvas = world.renderer.three.domElement;                // für registrieren Maus-Events

  canvas.addEventListener('click', async event => {
    raycaster.mouse.updateMouseInfo(event);
    const rayHit = await raycaster.castRay();                    // raycaster.castRay() Wirft den Ray in Szene wartet auf Ergebnis, 'rayHit' enthält getroffene Fragmente/IDs
    
    if (rayHit) {
      const modelId = rayHit.fragments.modelId;
      const itemId = rayHit.localId;

      // Center im Raycaster holen
      const fragMan = engineComponents.get(FragmentsManager);
      const [bBox] = await fragMan.getBBoxes({ [modelId]: [itemId] }); // result Array von Box3 // ThatOpen nutzt hier die three.js-Box3 für 3D-Modelle
      const vector3Center = bBox.getCenter(new THREE.Vector3());   // füllt einen Vector3 mitdem Mittelpunkt der Box // getBBoxes ist ThatOpen-API

      // Center an den Callback übergeben
      handleRaycastSelection({ modelId, itemId, center: vector3Center });
    } else {
      const fragMan = engineComponents.get(FragmentsManager);
      fragMan.resetHighlight(); // Remove Highlight
      fragMan.core?.update(true);
      clearMarker();
    }
  });
}

export function highlightSelection(components, selection) {
  const withMouseSelected = { [selection.modelId]: [selection.itemId] };
  const fragMan = components.get(FragmentsManager);
  fragMan.resetHighlight(); // Remove Highlight
  fragMan.highlight(HIGHLIGHT_STYLE, withMouseSelected);
  fragMan.core?.update(true); // Sofortiges Re-Render anstoßen
} 