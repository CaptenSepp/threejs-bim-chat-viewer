export async function getWorkerUrl(url) {
  const workerResponse = await fetch(url);
  const workerBlob = await workerResponse.blob();
  const workerFile = new File([workerBlob], "worker.mjs", { type: "text/javascript" });
  return URL.createObjectURL(workerFile);
}

export async function loadFragments(fragments, path = "/frags/school_str.frag") {
  const file = await fetch(path);
  const buffer = await file.arrayBuffer();
  await fragments.core.load(buffer, { modelId: "school_str" });
}

export function escapeHTML(str) {
  const s = String(str ?? 'undefined!'); // Fehler im chat verhindern
  return s.replace(/[&<>"']/g, m => ({
    '&': '&amp;',   // Ampersand  maskieren
    '<': '&lt;',    // Tag-Start
    '>': '&gt;',    // Tag-Ende
    '"': '&quot;',  // Attributwerte in Anführungszeichen
    "'": '&#039;',  // Anführungszeichen escapen
  }[m]));
}