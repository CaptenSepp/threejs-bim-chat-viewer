import { FragmentsManager, Raycasters } from "@thatopen/components";
import * as FRAGS from "@thatopen/fragments";
import * as THREE from "three";
import { initMarkers, setMarkerPosition, setMarkerData, showMarker } from './marker.js';


const primaryColor = (typeof document !== "undefined" && typeof getComputedStyle === "function")
  ? getComputedStyle(document.documentElement).getPropertyValue("--primary").trim()
  : "#FF0000";


function buildMetaFromHit(rayHit) {

  const mesh = rayHit?.mesh;
  const materialName = mesh?.material?.name || '';
  const meshName = mesh?.name || '';
  const fragmentId = mesh?.fragment?.id || '';

  return {
    Name: meshName,                         
    GlobalId: '',                           
    type: rayHit?.data?.type || '',      
    ExpressID: rayHit?.localId ?? '',     
    PredefinedType: '',            
    Level: '',                            
    ObjectType: meshName || '',              
    Material: materialName,           
  };
}

function onHitFound(screenPoint, metadataObject) {
  // Marker init
  initMarkers();
  // Position setzen
  setMarkerPosition(screenPoint);
  // Daten setzen
  setMarkerData(metadataObject);
  // anzeigen
  showMarker(true);
}

// Wenn nichts getroffen:
function clearHit() {
  showMarker(false);
}

export const HIGHLIGHT_STYLE = {
  color: new THREE.Color(primaryColor || "#FF0000"),
  color: new THREE.Color(primaryColor),
  renderedFaces: FRAGS.RenderedFaces.ONE,                        // nur eine Seite der Fragmente hervorgehoben wird
  opacity: 0.6,
  transparent: true,
};

export function initRaycaster(engineComponents, world, handleRaycastSelection) { // Raycaster konfigurierung mit Service-Container und World und Treffer 
  const raycaster = engineComponents.get(Raycasters).get(world); // Raycasters.get(world) liefert ein Objekt mit Maus-Helfern und castRay()
  const canvas = world.renderer.three.domElement;                // für registrieren Maus-Events

  canvas.addEventListener('click', async event => {
    raycaster.mouse.updateMouseInfo(event);
    const rayHit = await raycaster.castRay();                    // raycaster.castRay() Wirft den Ray in die Szene und wartet auf das Treffer-Ergebnis und 'rayHit' enthält getroffene Fragmente/IDs
    if (rayHit) {
      // Bildschirmposition vom Event
      const screenPoint = { x: event.clientX, y: event.clientY };

      // 6 Felder für den Marker
      const meta = {
        Name: rayHit?.mesh?.name ?? "",
        type: rayHit?.data?.type ?? rayHit?.mesh?.userData?.ifcType ?? "",
        ExpressID: rayHit.localId,
        Tag: (rayHit?.fragments?.modelId ?? rayHit?.mesh?.fragment?.id ?? ""),
        ObjectType: (rayHit?.mesh?.type ?? ""),
        Material: (rayHit?.mesh?.material?.name ?? "")
      };

      // Marker updaten
      onHitFound(screenPoint, meta);

      handleRaycastSelection({
        modelId: rayHit.fragments.modelId,
        itemId: rayHit.localId,
      });
    } else {
      clearHit(); // Marker ausblenden
    }
  });
}

export function highlightSelection(components, selection) {
  const withMouseSelected = { [selection.modelId]: [selection.itemId] };
  const fragMan = components.get(FragmentsManager);
  fragMan.resetHighlight(); // Remove Highlight
  fragMan.highlight(HIGHLIGHT_STYLE, withMouseSelected);
  fragMan.core?.update(true); // Sofortiges Re-Render anstoßen
}

