/* ------------------------------------------------- *
 *  Haupt-Bootstrap: erstellt World + lädt IFC
 * ------------------------------------------------- */
import * as THREE from 'three';
import * as OBC   from '@thatopen/components';
import { loadIfcModel } from './ifcLoader.js';
import { initRaycaster } from './raycaster.js';

const canvas = document.getElementById('three-canvas');

/* 1. Komponenten-Container */
const components = new OBC.Components();

/* 2. Neue World (Scene / Camera / Renderer) */
const worlds = components.get(OBC.Worlds);
const world  = worlds.create();         // SimpleScene, SimpleCamera, SimpleRenderer

world.scene    = new OBC.SimpleScene(components);
world.camera   = new OBC.SimpleCamera(components);
world.renderer = new OBC.SimpleRenderer(components, canvas);

/* 3. Licht */
const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
dirLight.position.set(5, 5, 5);
world.scene.three.add(dirLight, new THREE.AmbientLight(0x404040, 2));

/* 4. Grid (optional aus Doku) */
components.get(OBC.Grids).create(world);

/* 5. Komponenten initialisieren */
components.init();

/* 6. IFC-Modell laden */
await loadIfcModel(components, '../small.ifc');

/* 7. Ray-Picking verbinden */
initRaycaster(world.scene.three, world.camera.three, canvas);

/* 8. Render-Loop */
world.renderer.setAnimationLoop(() => world.renderer.render());
