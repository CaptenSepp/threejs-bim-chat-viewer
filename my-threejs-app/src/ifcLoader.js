/* ------------------------------------------------- *
 *  Lädt ein IFC-Modell und übergibt es der World
 * ------------------------------------------------- */
import * as OBC from '@thatopen/components';

const WASM_CDN = 'https://unpkg.com/web-ifc@0.0.68/';
const WORKER = 'https://cdn.jsdelivr.net/npm/@thatopen/components@2.4.11/dist/fragment.worker.js';

export async function loadIfcModel(components, url = '/small.ifc') {
  /* Fragments-Manager gemäss Doku */
  const fragments = components.get(OBC.FragmentsManager);
  fragments.init(WORKER);

  /* IfcLoader konfigurieren */
  const ifcLoader = components.get(OBC.IfcLoader);
  await ifcLoader.setup({
    autoSetWasm: false,
    wasm: { path: WASM_CDN, absolute: true }
  });


  /* Model nach Laden in Szene einhängen */
  // fragments.list.onItemSet.add(({ value: model }) => {
  //   const world = components.get(OBC.Worlds).current;
  //   model.useCamera(world.camera.three);
  //   world.scene.three.add(model.object);
  //   fragments.core.update(true);
  // });

  const world = components.get(OBC.Worlds).current;

  /* nur eine einzige Zeile zum Laden + Rückgabe nutzen */
  const model = await ifcLoader.load(new Uint8Array(buffer));

  model.useCamera(world.camera.three);
  world.scene.three.add(model.object);
  components.get(OBC.FragmentsManager).core.update(true);

  /* IFC laden */
  const buffer = await (await fetch(url)).arrayBuffer();
  await ifcLoader.load(new Uint8Array(buffer));
}
