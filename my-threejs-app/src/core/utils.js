// @ts-check
async function fetchOrThrow(resource, errorPrefix) {                                // fetches a resource and throws on HTTP error
  const res = await fetch(resource);
  if (!res.ok) {
    throw new Error(`${errorPrefix} ${resource}: ${res.status} ${res.statusText}`); // include status code and text
  }
  return res;
}

export async function createWorkerObjectUrl(url) {
  try {
    const workerResponse = await fetchOrThrow(url, 'Failed to fetch worker at');
    const workerBlob = await workerResponse.blob();
    const workerFile = new File([workerBlob], "worker.mjs", { type: "text/javascript" });
    return URL.createObjectURL(workerFile);
  } catch (error) {
    displayUserErrorSnackbar(`Worker konnte nicht geladen werden: ${url}`);                   // show a short snackbar in UI
    throw new Error(`Error loading worker from ${url}: ${error.message}`);
  }
}

export async function loadFragmentsFromPath(fragments, path = "/fragments/school_str.frag") { // /fragments/school_str.frag
  try {
    const file = await fetchOrThrow(path, 'Failed to fetch fragments at');
    const buffer = await file.arrayBuffer();
    const normalizedPath = path.replace(/\\/g, '/');        // normalize slashes for consistent model ids
    const trimmedPath = normalizedPath.replace(/^\/+/, ''); // drop leading slashes to align with repo structure
    let modelId = trimmedPath || 'model';                   // derive a stable identifier from the fragment path
    const fileTail = modelId.split('/').pop() || modelId;   // collapse to last path segment for nicer ids
    modelId = fileTail.replace(/\.frag$/i, '') || fileTail; // drop .frag suffix to keep clean name
    await fragments.core.load(buffer, { modelId });         // register model with derived identifier so selections report current file
  } catch (error) {
    console.error(`Error loading fragments from ${path}:`, error);
    displayUserErrorSnackbar(`Model konnte nicht geladen werden: ${path}`); // show a short snackbar in UI
  }
}

export async function loadIfcFromPath(components, path = "/model/custom_psets.ifc") { // default IFC -> FRAG (online wasm)
  try {
    const file = await fetchOrThrow(path, 'Failed to fetch IFC at');
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);                           // convert to bytes for IfcLoader
    const ifcLoader = components.get(IfcLoader);                    // get IFC loader from engine
    await ifcLoader.setup({                                         // pin wasm CDN to avoid autoSetWasm fetch
      autoSetWasm: false,
      wasm: { path: "https://unpkg.com/web-ifc@0.0.70/", absolute: true },
    });
    const normalizedPath = path.replace(/\\/g, '/');                // normalize slashes for model id
    const trimmedPath = normalizedPath.replace(/^\/+/, '');         // drop leading slashes
    let modelId = trimmedPath || 'model';                           // stable id from path
    const fileTail = modelId.split('/').pop() || modelId;           // last segment
    modelId = fileTail.replace(/\.ifc$/i, '') || fileTail;          // drop .ifc extension
    await ifcLoader.load(bytes, true, modelId);                     // convert IFC -> FRAG and load
  } catch (error) {
    console.error(`Error loading IFC from ${path}:`, error);
    displayUserErrorSnackbar(`IFC konnte nicht geladen werden: ${path}`);
  }
}

export async function loadModelAutoDetect(components, fragments, path) {            // choose IFC or FRAG by extension
  const safePath = String(path || '').trim();
  if (!safePath || safePath.toLowerCase().endsWith('.frag')) {
    return loadFragmentsFromPath(fragments, safePath || undefined);
  }
  if (safePath.toLowerCase().endsWith('.ifc')) {
    return loadIfcFromPath(components, safePath);
  }
  displayUserErrorSnackbar(`Unbekannter Dateityp: ${safePath || path}`);
}

export function escapeHTML(str) {        // replaces special characters with HTML-safe entities (escaping)
  const s = String(str ?? 'undefined!'); // avoid undefined/null issues
  return s.replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }[m]));
}
import { IfcLoader } from "@thatopen/components";
import { displayUserErrorSnackbar } from "../ui/error-notify.js";

