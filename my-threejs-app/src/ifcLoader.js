import * as OBC from '@thatopen/components';
import * as THREE from 'three';

export async function loadIfcModel(scene, camera, url = '/small.ifc') {

  const components = new OBC.Components();
  components.scene = scene;
  components.camera = camera;
  components.init();

  const ifcLoader = components.get(OBC.IfcLoader);
  await ifcLoader.setup();

  const buffer = await (await fetch(url)).arrayBuffer();
  const model = await ifcLoader.load(new Uint8Array(buffer));

  model.traverse((o) => {
    if (o.isMesh && !o.name) o.name = `IFC-${o.userData.expressID}`;
  });
  scene.add(model);

  // const cameraUtils = components.get(OBC.CameraUtils);
  // cameraUtils.fitToSelection(model);

  /* Kamera grob einpassen ------------------------- */
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  camera.position.set(
    center.x,
    center.y + size.y,
    center.z + size.z * 2
  );
  camera.lookAt(center);

  return model;
}