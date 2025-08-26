export async function getWorkerUrl(url) {
  try {
    const workerResponse = await fetch(url);
    if (!workerResponse.ok) {
      throw new Error(`Failed to fetch worker at ${url}: ${workerResponse.status} ${workerResponse.statusText}`);
    }
    const workerBlob = await workerResponse.blob();
    const workerFile = new File([workerBlob], "worker.mjs", { type: "text/javascript" });
    return URL.createObjectURL(workerFile);
  } catch (error) {
    throw new Error(`Error loading worker from ${url}: ${error.message}`);
  }
}

export async function loadFragments(fragments, path = "/frags/school_str.frag") {
  try {
    const file = await fetch(path);
    if (!file.ok) {
      throw new Error(`Failed to fetch fragments at ${path}: ${file.status} ${file.statusText}`);
    }
    const buffer = await file.arrayBuffer();
    await fragments.core.load(buffer, { modelId: "school_str" });
  } catch (error) {
    console.error(`Error loading fragments from ${path}:`, error);
  }
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