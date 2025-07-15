import * as THREE from 'three';
import * as OBC  from '@thatopen/components';

const canvas = document.getElementById('three-canvas');

// ─────────── Welt einrichten ───────────
const components = new OBC.Components();

const worlds = components.get(OBC.Worlds);
const world  = worlds.create();
world.scene    = new OBC.SimpleScene(components);
world.scene.setup();
world.scene.three.background = null;
world.renderer = new OBC.SimpleRenderer(components, canvas);

world.camera   = new OBC.OrthoPerspectiveCamera(components);
await world.camera.controls.setLookAt(78, 20, -2.2, 26, -4, 25);

components.init();
components.get(OBC.Grids).create(world);

// ─────────── Fragments-Manager ───────────
const githubUrl  = 'https://thatopen.github.io/engine_fragment/resources/worker.mjs';
const fetchedUrl = await fetch(githubUrl);
const workerBlob = await fetchedUrl.blob();
const workerFile = new File([workerBlob], 'worker.mjs', { type: 'text/javascript' });
const workerUrl  = URL.createObjectURL(workerFile);

const fragments = components.get(OBC.FragmentsManager);
fragments.init(workerUrl);

world.camera.controls.addEventListener('rest', () => fragments.core.update(true));

fragments.list.onItemSet.add(({ value: model }) => {
  model.useCamera(world.camera.three);
  world.scene.three.add(model.object);
  fragments.core.update(true);
});

// ─────────── Fragments-Datei laden ───────────
const loadFrag = async (path = '/frags/school_str.frag') => {
  const file   = await fetch(path);
  const buffer = await file.arrayBuffer();
  await fragments.core.load(buffer, { modelId: 'school_str' });
};
await loadFrag();

// ─────────── Render-Loop ───────────
world.renderer.setAnimationLoop(() => world.renderer.render());