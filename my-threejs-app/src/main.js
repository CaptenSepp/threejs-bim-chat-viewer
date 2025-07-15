import * as THREE from "three";
import * as OBC  from "@thatopen/components"; //Open Boundary Conditions

const container = document.getElementById("viewer");

// ─────────── Welt einrichten ───────────
const components = new OBC.Components(); //Component-Manager

const worlds = components.get(OBC.Worlds); //Worlds-Komponente – sie kann mehrere 3D-Welten erzeugen
const world  = worlds.create();
world.scene    = new OBC.SimpleScene(components); //Erstellt ein neues Scene-Objekt (3D-Welt) - Licht, Hintergrundfarbe, THREE.Scene-Objekt
//three = new THREE.Scene() und three.background = new THREE.Color(...)

world.scene.setup(); //Alles vorbereiten für erste Darstellung.
world.scene.three.background = null;
world.renderer = new OBC.SimpleRenderer(components, viewer); //Erstellt einen simplen THREE.WebGLRenderer

world.camera   = new OBC.OrthoPerspectiveCamera(components); //automatischer Wechsel zwischen Orthographic und Perspective.
await world.camera.controls.setLookAt(78, 20, -2.2, 26, -4, 25); //setLookAt(fromX, fromY, fromZ, toX, toY, toZ)

components.init(); //Startet intern alle Komponenten
components.get(OBC.Grids).create(world); //Fügt ein Bodenraster hinzu 

// ─────────── Fragments-Manager ───────────
const githubUrl  = "https://thatopen.github.io/engine_fragment/resources/worker.mjs";
const fetchedUrl = await fetch(githubUrl);
const workerBlob = await fetchedUrl.blob();
const workerFile = new File([workerBlob], "worker.mjs", { type: "text/javascript" });
const workerUrl  = URL.createObjectURL(workerFile);

const fragments = components.get(OBC.FragmentsManager); //FragmentsManager: Teilt das IFC-Modell in kleine Teile ("Fragments") auf, damit du z. B. Dinge ausblenden, hervorheben, selektieren kannst.
fragments.init(workerUrl);

world.camera.controls.addEventListener("rest", () => fragments.core.update(true)); //aktualisiert nach Maussteuerung

fragments.list.onItemSet.add(({ value: model }) => {
  model.useCamera(world.camera.three);
  world.scene.three.add(model.object); //add() fügt eine Listener-Funktion hinzu - Fügt das 3D-Modell zur THREE.Scene hinzu /sichtbar machen.

  fragments.core.update(true);
});

// ─────────── Fragments-Datei laden ───────────
const loadFrag = async (path = "/frags/school_str.frag") => {
  const file   = await fetch(path);
  const buffer = await file.arrayBuffer(); //Binärdaten umwandeln
  await fragments.core.load(buffer, { modelId: "school_str" }); 
};
loadFrag();

// ─────────── Render-Loop ───────────
world.renderer.setAnimationLoop(() => world.renderer.render());
