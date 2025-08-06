import * as THREE from "three";
import * as FRAGS from "@thatopen/fragments";
import { FragmentsManager, Raycasters } from "@thatopen/components";

const DEBUG = true;
const dlog = (...args) => DEBUG && console.log('[raycaster]', ...args);

const HIGHLIGHT_STYLE = {
  color: new THREE.Color(0xff0000),
  renderedFaces: FRAGS.RenderedFaces.ONE,
  opacity: 0.8,
  transparent: true,
};

export function initRaycaster(components, world, onSelect) {
  const raycaster = components.get(Raycasters).get(world);
  const canvas = world.renderer.three.domElement;

  // src/raycaster.js
  canvas.addEventListener('click', async (event) => {
    raycaster.mouse.updateMouseInfo(event); 
    dlog('Mouse pos', raycaster.mouse.position);

    const hit = await raycaster.castRay();
    console.assert(hit, 'Raycaster: expected a hit here');

    if (hit) {
      onSelect({
        modelId: hit.fragments.modelId,
        itemId: hit.localId,
        point: hit.point
      });
      console.log(hit);
      onSelect({
        modelId: hit.fragments.modelId,
        itemId: hit.localId
      });
    }
  });

}

export function highlightSelection(components, selection) {
  dlog('Highlighting', selection);
  const items = { [selection.modelId]: [selection.itemId] };
  const frags = components.get(FragmentsManager);
  frags.resetHighlight();
  frags.highlight(HIGHLIGHT_STYLE, items);
}

export function clearHighlight(components) {
  dlog('Highlight reset');
  components.get(FragmentsManager).resetHighlight();
}