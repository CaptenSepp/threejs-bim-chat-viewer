import * as THREE from 'three';

const canvas = document.getElementById('three-canvas');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
scene.add(camera);
camera.position.z = 4;

const cube = new THREE.Mesh(
  new THREE.BoxGeometry(),
  new THREE.MeshStandardMaterial({ color: 0xffa500 })
);
scene.add(cube);

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 5, 5);
scene.add(light);

const chatPanelSize = 300;
function onResize() {
  const width = window.innerWidth-chatPanelSize;
  const height = window.innerHeight;
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', onResize);
onResize(); // initial

function animate() {
  requestAnimationFrame(animate);
  cube.rotation.x += 0.03;
  cube.rotation.y += 0.03;
  renderer.render(scene, camera);
}
animate();