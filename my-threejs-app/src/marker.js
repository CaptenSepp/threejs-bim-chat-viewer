
// src/marker.js
import * as THREE from "three";
import * as OBF from "@thatopen/components-front";
import * as BUI from "@thatopen/ui";

export function initMarkers(engineComponents, world) {

    // --- UI init (BUI) ---
    BUI.Manager.init(); // NEW: UI erst initialisieren

    // --- marker demo ---
    const marker = engineComponents.get(OBF.Marker); // NEW
    marker.threshold = 100;                           // NEW

    const x = Math.random() * 100 - 50;
    const y = Math.random() * 10;
    const z = Math.random() * 100 - 50;

    const element = BUI.Component.create(() =>        // NEW
        BUI.html`<bim-label style="font-size:20px">🚀</bim-label>`
    );

    marker.create(world, element, new THREE.Vector3(x, y, z)); // NEW

    // --- optional: kleines Panel + Button (ohne TS-Generics) ---
    const panel = BUI.Component.create(() =>          // NEW
        BUI.html`
    <bim-panel active label="Marker Tutorial" class="options-menu"></bim-panel>
  `
    );
    document.body.append(panel);                      // NEW

    const button = BUI.Component.create(() =>         // NEW
        BUI.html`
    <bim-button
      class="phone-menu-toggler"
      icon="solar:settings-bold"
      @click="${() => {
                panel.classList.toggle("options-menu-visible");
            }}"
    ></bim-button>
  `
    );
    document.body.append(button);                     // NEW
}