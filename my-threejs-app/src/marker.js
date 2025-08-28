import { FragmentsManager } from "@thatopen/components";
import * as OBF from "@thatopen/components-front";
import * as BUI from "@thatopen/ui";
import * as THREE from "three";

let marker, label, markerId;

export function initMarkers(engineComponents) {
    BUI.Manager.init();
    marker = engineComponents.get(OBF.Marker);
    marker.threshold = 100;
    label = BUI.Component.create(() => BUI.html`<Marker-Label class="meta-label"></Marker-Label>`);
}

export async function updateMarker(engineComponents, world, sel) {
    const fragMan = engineComponents.get(FragmentsManager);

    const data = await fragMan.getData({ [sel.modelId]: [sel.itemId] });
    const item = (data?.[sel.modelId]?.[sel.itemId]) ?? (data?.[sel.modelId]?.[0]) ?? {};
    const attrs = item?.attributes ?? item ?? {};
    // Hilfsfunktion zuerst definieren
    const val = v => (v && typeof v === "object" && "value" in v ? v.value : v ?? "—");

    // gewünschte Felder extrahieren
    const rows = [
        ["Name", val(attrs.Name)],
        ["ObjectType", val(attrs.ObjectType)],
        ["Tag", val(attrs.Tag)],
        ["Category", val(attrs._category)],
        ["LocalId", val(attrs._localId)]
    ];

    // Label-Inhalt als kleine Tabelle (Styling via CSS-Klassen, keine Inline-Styles)
    label.innerHTML = `
    <div class="meta-wrap">
      <table class="meta-table"><tbody>
        ${rows.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join("")}
      </tbody></table>
    </div>
  `;

    // 2) In die Konsole ausgeben (leicht lesbar)
    console.group(`[Marker] model:${sel.modelId} item:${sel.itemId}`);
    console.log("item:", item);

    const boxes = await fragMan.getBBoxes({ [sel.modelId]: [sel.itemId] });
    const pos = boxes?.[0]?.getCenter(new THREE.Vector3()) ?? new THREE.Vector3();

    if (markerId) marker.delete(markerId);
    markerId = marker.create(world, label, pos, true);
}

