// @ts-check
async function fetchOrThrow(resource, errorPrefix) {  // fetches a resource and throws on HTTP error
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
    displayUserErrorSnackbar(`Worker konnte nicht geladen werden: ${url}`); // show a short snackbar in UI
    throw new Error(`Error loading worker from ${url}: ${error.message}`);
  }
}

export async function loadFragmentsFromPath(fragments, path = "/fragments/custom_psets.frag") { // /fragments/school_str.frag
  try {
    const file = await fetchOrThrow(path, 'Failed to fetch fragments at');
    const buffer = await file.arrayBuffer();
    const normalizedPath = path.replace(/\\/g, '/'); // NEW: normalize slashes for consistent model ids
    const trimmedPath = normalizedPath.replace(/^\/+/, ''); // NEW: drop leading slashes to align with repo structure
    let modelId = trimmedPath || 'model'; // NEW: derive a stable identifier from the fragment path
    if (!modelId.startsWith('public/')) modelId = 'public/' + modelId; // NEW: ensure public/ prefix so chat sees actual asset path
    await fragments.core.load(buffer, { modelId }); // register model with derived identifier so selections report current file
  } catch (error) {
    console.error(`Error loading fragments from ${path}:`, error);
    displayUserErrorSnackbar(`Model konnte nicht geladen werden: ${path}`); // show a short snackbar in UI
  }
}

export function escapeHTML(str) { // replaces special characters with HTML-safe entities (escaping)
  const s = String(str ?? 'undefined!'); // avoid undefined/null issues
  return s.replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }[m]));
}
import { displayUserErrorSnackbar } from "../ui/error-notify.js";

