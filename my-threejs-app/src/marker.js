
let markerEl;

//erstellt das DOM-Element
export function initMarkers() {
    if (markerEl) return markerEl;
    markerEl = document.createElement('div');
    markerEl.id = 'ifc-marker';
    markerEl.style.position = 'absolute';
    markerEl.style.pointerEvents = 'none';
    markerEl.style.font = '12px/1.3 system-ui, sans-serif';
    markerEl.style.background = 'rgba(0,0,0,0.7)';
    markerEl.style.color = '#fff';
    markerEl.style.padding = '6px 8px';
    markerEl.style.borderRadius = '6px';
    markerEl.style.whiteSpace = 'pre-line';
    markerEl.style.maxWidth = '240px';
    markerEl.style.zIndex = '9999';
    markerEl.style.display = 'none';
    document.body.appendChild(markerEl);
    return markerEl;
}

/**
 * Position auf dem Bildschirm updaten 
 * @param {{x:number,y:number}} screen
 */

export function setMarkerPosition(screen) {
    if (!markerEl) initMarkers();
    markerEl.style.left = `${Math.round(screen.x)}px`;
    markerEl.style.top = `${Math.round(screen.y)}px`;
}

/**
 * Metadaten in den Marker schreiben
 * Erwartet ein Objekt mit beliebigen Properties 
 * @param {object} meta
 */
export function setMarkerData(meta = {}) {
    if (!markerEl) initMarkers();

    // Reihenfolge wichtiger Felder 
    const preferredKeys = [
        'Name', 'GlobalId', 'type', 'ExpressID', 'PredefinedType', 'Tag',
        'Level', 'Storey', 'ObjectType', 'Material'
    ];

    const lines = [];
    for (const key of preferredKeys) {
        if (key in meta && meta[key] != null && `${meta[key]}` !== '') {
            lines.push(`${key}: ${meta[key]}`);
            if (lines.length === 6) break;
        }
    }

    // Fallback:
    if (lines.length === 0) {
        const entries = Object.entries(meta).slice(0, 6);
        for (const [k, v] of entries) lines.push(`${k}: ${v}`);
    }

    markerEl.textContent = lines.join('\n');
    markerEl.style.display = lines.length ? 'block' : 'none';
}

/**
 * Marker anzeigen/ausblenden.
 */
export function showMarker(show) {
    if (!markerEl) initMarkers();
    markerEl.style.display = show ? 'block' : 'none';
}
