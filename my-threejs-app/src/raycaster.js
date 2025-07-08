import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';

/**
 * Verbindet Ray-Picking mit der Chat-API.
 * @param {THREE.Scene}  scene
 * @param {THREE.Camera} camera
 * @param {HTMLCanvasElement} canvas
 */
export function initRaycaster(scene, camera, canvas) {
  const raycaster = new THREE.Raycaster();
  const mouse     = new THREE.Vector2();

  function onPointerDown(e) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera); // 
    const hits = raycaster.intersectObjects(scene.children, true); // 

    if (hits.length) {
      window.chatAPI?.setObjectReferenceForChat(hits[0].object.name);
    } else {
      window.chatAPI?.clearObjectReference();
    }
  }
  canvas.addEventListener('pointerdown', onPointerDown, false);
}
