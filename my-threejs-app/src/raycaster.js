import * as THREE from "three";
import * as FRAGS from "@thatopen/fragments";
import { FragmentsManager, Raycasters } from "@thatopen/components";

const HIGHLIGHT_STYLE = {
  color: new THREE.Color(0xff0000),
  renderedFaces: FRAGS.RenderedFaces.ONE,
  opacity: 0.8,
  transparent: true,
};

export function initRaycaster(components, world, onSelect) {
  const raycaster = components.get(Raycasters).get(world);
  const canvas = world.renderer.three.domElement;

  // canvas.addEventListener("click", async (event) => {
  //   raycaster.mouse.updateMouseInfo(event);
  //   const result = await components.get(FragmentsManager).raycast({
  //     camera: world.camera.three,
  //     mouse: raycaster.mouse.position,
  //     dom: canvas,
  //   });

  //   if (result) {
  //     onSelect({
  //       modelId: result.fragments.modelId,
  //       itemId: result.localId, //itemId to localId
  //     });
  //   }
  // });


  canvas.addEventListener('click', async (event) => {
    raycaster.mouse.updateMouseInfo(event);        
    const hit = await raycaster.castRay();         

    if (hit) {
      onSelect({
        modelId: hit.fragments.modelId,
        itemId: hit.localId
      });
      console.log(hit);
    }
  });

}

export function highlightSelection(components, selection) {
  const items = { [selection.modelId]: [selection.itemId] };
  const frags = components.get(FragmentsManager);
  frags.resetHighlight();
  frags.highlight(HIGHLIGHT_STYLE, items);
}

export function clearHighlight(components) {
  components.get(FragmentsManager).resetHighlight();
}