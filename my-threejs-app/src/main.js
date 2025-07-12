import * as THREE from 'three';
import { initRaycaster } from './raycaster.js';
import { loadIfcModel } from './ifcLoader.js';

/* Canvas + Renderer ------------------------------------------------------- */
const canvas = document.getElementById('three-canvas');

const renderer = new THREE.WebGLRenderer({ canvas, antialias:true });
renderer.setClearColor(0x141414);

/* Szene & Kamera ---------------------------------------------------------- */
const scene  = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75,1,0.1,1000);
camera.position.z = 4;
scene.add(camera);

/* Licht --------------------------------------------------------------- */
const light = new THREE.DirectionalLight(0xffffff, 1.5);
light.position.set(5, 5, 5);
scene.add(light);
scene.add(new THREE.AmbientLight(0x404040,3));

/* Beispiel-Würfel --------------------------------------------------------- */
// const cube = new THREE.Mesh(
//   new THREE.BoxGeometry(1,1,1),
//   new THREE.MeshStandardMaterial({ color:0xffa500, roughness:.9, metalness: 1 })
// );
// cube.name = 'Gebäudeteil: Würfel A';
// scene.add(cube);

/* Ray-Picker -------------------------------------------------------------- */

/* Resize-Handling --------------------------------------------------------- */
function onResize(){
  const chatW = window.innerWidth>768
      ? parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--chat-width'))
      : 0;

  const w = window.innerWidth - chatW;
  const h = window.innerHeight - (window.innerWidth<=768
      ? document.getElementById('chat-container').offsetHeight : 0);

  renderer.setSize(w,h);
  camera.aspect = w/h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', onResize);
onResize();

/* Animation-Loop ---------------------------------------------------------- */
// function animate(){
//   requestAnimationFrame(animate);
//   cube.rotation.x += 0.005;
//   cube.rotation.y += 0.005;
//   renderer.render(scene,camera);
// }
// animate();

initRaycaster(scene, camera, canvas);
window.addEventListener('resize', onResize);
onResize();

/* IFC-Modell laden --------------------------------*/
await loadIfcModel(scene, camera);   // <–– Modell ist jetzt da

/* Zeichnen ----------------------------------------*/
renderer.setAnimationLoop(()=>renderer.render(scene, camera));