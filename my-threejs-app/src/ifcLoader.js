
const WORKER = 'https://cdn.jsdelivr.net/npm/@thatopen/components@2.4.11/dist/fragment.worker.js';

export async function loadIfcModel(components, url = '/small.ifc') {
  /* Fragments-Manager gemäss Doku */
  const fragments = components.get(OBC.FragmentsManager);
  fragments.init(WORKER);
  
  const WASM_CDN = 'https://cdn.jsdelivr.net/npm/web-ifc@0.0.68/';

  /* IfcLoader konfigurieren */
  const ifcLoader = components.get(OBC.IfcLoader);
  await ifcLoader.setup({
    autoSetWasm: false,
    wasm: { path: WASM_CDN, absolute: true }
  });

  const world = components.get(OBC.Worlds).current;

  /* IFC laden */
  const buffer = await (await fetch(url)).arrayBuffer();
  const model = await ifcLoader.load(new Uint8Array(buffer));

  model.useCamera(world.camera.three);
  world.scene.three.add(model.object);
  fragments.core.update(true);

  return model;
}