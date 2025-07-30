import { FragmentsManager, Raycasters } from "@thatopen/components";

export function initRaycaster(components, world, onSelect) {
  const raycaster = components.get(Raycasters).get(world);
  const canvas = world.renderer.three.domElement;

  canvas.addEventListener("click", async () => {
    const result = await components.get(FragmentsManager).raycast({
      camera: world.camera.three,
      mouse: raycaster.mouse.position,
      dom: canvas,
    });

    if (result) {
      onSelect({
        modelId: result.fragments.modelId,
        itemId: result.itemId,
      });
    }
  });

}