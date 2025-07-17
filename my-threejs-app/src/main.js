import * as THREE from "three";
import * as OBC  from "@thatopen/components"; //Open Boundary Conditions
import { loadFragments } from './loadFrag.js';
import workerURL from "@thatopen/fragments/dist/Worker/worker.mjs?url";

const viewer = document.getElementById('viewer');

// ─────────── Welt einrichten ───────────
const components = new OBC.Components(); //Component-Manager

const worlds = components.get(OBC.Worlds); //Worlds-Komponente – sie kann mehrere 3D-Welten erzeugen
const world  = worlds.create();
world.scene    = new OBC.SimpleScene(components); //Erstellt ein neues Scene-Objekt (3D-Welt) - Licht, Hintergrundfarbe, THREE.Scene-Objekt
//three = new THREE.Scene() und three.background = new THREE.Color(...)

world.scene.setup(); //Alles vorbereiten für erste Darstellung.
world.scene.three.background = null;
world.renderer = new OBC.SimpleRenderer(components, viewer); //Erstellt einen simplen THREE.WebGLRenderer

// Füge einen Test-Würfel hinzu, um sicherzustellen, dass die Szene korrekt gerendert wird
const testBox = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshStandardMaterial({ color: 0xff0000 })
);
testBox.position.set(0, 0.5, 0);
world.scene.three.add(testBox);

world.camera   = new OBC.OrthoPerspectiveCamera(components); //automatischer Wechsel zwischen Orthographic und Perspective.
await world.camera.controls.setLookAt(78, 20, -2.2, 26, -4, 25); //setLookAt(fromX, fromY, fromZ, toX, toY, toZ)

components.init(); //Startet intern alle Komponenten
components.get(OBC.Grids).create(world); //Fügt ein Bodenraster hinzu 

// ─────────── Fragments-Manager ───────────
// Use local worker from the fragments package to avoid network errors
const fragments = components.get(OBC.FragmentsManager); //FragmentsManager: Teilt das IFC-Modell in kleine Teile ("Fragments") auf, damit du z. B. Dinge ausblenden, hervorheben, selektieren kannst.
fragments.init(workerURL);

world.camera.controls.addEventListener("rest", () => fragments.core.update(true)); //aktualisiert nach Maussteuerung

fragments.list.onItemSet.add(({ value: model }) => {
  model.useCamera(world.camera.three);
  world.scene.three.add(model.object); //add() fügt eine Listener-Funktion hinzu - Fügt das 3D-Modell zur THREE.Scene hinzu /sichtbar machen.

  fragments.core.update(true);
  console.log('Modell zur Szene hinzugefügt');
});

// ─────────── Fragments-Datei laden ───────────
const loadFrag = (path = '/frags/school_str.frag') => loadFragments(fragments, path);
loadFrag();

// ─────────── Render-Loop ───────────
world.renderer.setAnimationLoop(() => world.renderer.render());

export { components, world, fragments, loadFrag };
