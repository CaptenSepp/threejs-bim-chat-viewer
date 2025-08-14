import * as THREE from "three";
import * as FRAGS from "@thatopen/fragments";
import { FragmentsManager, Raycasters } from "@thatopen/components";

const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();

const HIGHLIGHT_STYLE = {
  color: new THREE.Color(primaryColor),
  renderedFaces: FRAGS.RenderedFaces.ONE, // nur eine Seite der Fragmente hervorgehoben wird
  opacity: 0.6,
  transparent: true,
};

export function initRaycaster(components, world, onSelect) { // Raycaster konfigurierung mit Service-Container und World und Treffer 
  const raycaster = components.get(Raycasters).get(world); // Raycasters.get(world) liefert ein Objekt mit Maus-Helfern und castRay()
  const canvas = world.renderer.three.domElement; // für registrieren Maus-Events

  canvas.addEventListener('click', async event => {
    raycaster.mouse.updateMouseInfo(event);
    const rayHit = await raycaster.castRay();

    if (rayHit) {
      onSelect({
        modelId: rayHit.fragments.modelId,
        itemId: rayHit.localId,
      });
    }
  });
}

export function highlightSelection(components, selection) {
  const selected = { [selection.modelId]: [selection.itemId] };
  const frags = components.get(FragmentsManager);
  frags.resetHighlight(); // Remove Highlight
  frags.highlight(HIGHLIGHT_STYLE, selected);
  frags.core?.update(true);
}