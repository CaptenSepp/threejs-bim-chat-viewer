import { FragmentsManager, Raycasters } from "@thatopen/components";
import * as FRAGS from "@thatopen/fragments";
import * as THREE from "three";
import { clearMarker } from "./marker.js";


const primaryColor = (typeof document !== "undefined" && typeof getComputedStyle === "function")
  ? getComputedStyle(document.documentElement).getPropertyValue("--primary").trim()
  : "#FF0000";


export const HIGHLIGHT_STYLE = {
  color: new THREE.Color(primaryColor || "#FF0000"),
  renderedFaces: FRAGS.RenderedFaces.ONE,                   // nur eine Seite der Fragmente hervorgehoben wird
  opacity: 0.6,
  transparent: true,
};

async function getSelectionData(engineComponents, rayHit) { // helper to compute selection data
  const modelId = rayHit.fragments.modelId;                 // extract model id
  const itemId = rayHit.localId;                            // extract item id
  const fragMan = engineComponents.get(FragmentsManager);   // Center im Raycaster holen moved comment + access fragment manager
  const [bBox] = await fragMan.getBBoxes({ [modelId]: [itemId] }); // result Array von Box3 ThatOpen nutzt hier die three.js-Box3 für 3D-Modelle and get bounding box
  const vector3Center = bBox.getCenter(new THREE.Vector3());       // füllt einen Vector3 mitdem Mittelpunkt der Box and getBBoxes ist ThatOpen-API and compute center
  return { modelId, itemId, center: vector3Center, box: bBox };    // pack selection data
}

export function initRaycaster(engineComponents, world, handleRaycastSelection) { // Raycaster konfigurierung mit Service-Container und World und Treffer 
  const raycaster = engineComponents.get(Raycasters).get(world); // Raycasters.get(world) liefert ein Objekt mit Maus-Helfern und castRay()
  const canvas = world.renderer.three.domElement;                // für registrieren Maus-Events

  canvas.addEventListener('click', async event => {
    raycaster.mouse.updateMouseInfo(event);
    const rayHit = await raycaster.castRay();   // raycaster.castRay() Wirft den Ray in Szene wartet auf Ergebnis, 'rayHit' enthält getroffene Fragmente/IDs

    if (rayHit) {
      const selection = await getSelectionData(engineComponents, rayHit); // compute selection via helper
      handleRaycastSelection(selection);        // Center an den Callback übergeben moved via helper
      return;
    }
  });
  document.addEventListener('keydown', (e) => { // ESC leert Highlight und Marker
    if (e.key === 'Escape') {
      const fragMan = engineComponents.get(FragmentsManager);
      fragMan.resetHighlight();                 // Remove Highlight
      fragMan.core?.update(true);
      clearMarker();
    }
  });
}

export function highlightSelection(components, selection) {
  const withMouseSelected = { [selection.modelId]: [selection.itemId] };
  const fragMan = components.get(FragmentsManager);
  fragMan.resetHighlight();                     // Remove Highlight
  fragMan.highlight(HIGHLIGHT_STYLE, withMouseSelected);
  fragMan.core?.update(true);                   // Sofortiges Re-Render anstoßen
} 
