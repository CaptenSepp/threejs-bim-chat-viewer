// @ts-check
import type { Components } from "@thatopen/components";
import type { IfcLoaderLikeType } from "../types/app-types.js";

// Small fragment-loader shape used by this file.
type FragmentLoaderType = {
  core: {
    load(buffer: ArrayBuffer, options: { modelId: string }): Promise<unknown>; // loader returns a model, but this file does not use it
  };
};

async function fetchOrThrow(resource: string, errorPrefix: string): Promise<Response> { // fetches a resource and throws on HTTP error
  const res = await fetch(resource);
  if (!res.ok) {
    throw new Error(`${errorPrefix} ${resource}: ${res.status} ${res.statusText}`); // include status code and text
  }
  return res;
}

export async function createWorkerObjectUrl(url: string): Promise<string> {
  try {
    const workerResponse = await fetchOrThrow(url, 'Failed to fetch worker at');
    const workerBlob = await workerResponse.blob();
    const workerFile = new File([workerBlob], "worker.mjs", { type: "text/javascript" });
    return URL.createObjectURL(workerFile);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error); // turn unknown errors into readable text
    displayUserErrorSnackbar(`Worker konnte nicht geladen werden: ${url}`);                   // show a short snackbar in UI
    throw new Error(`Error loading worker from ${url}: ${errorMessage}`);
  }
}

export async function loadFragmentsFromPath(fragments: FragmentLoaderType, path = "/fragments/school_str.fragxxx"): Promise<void> { // /fragments/school_str.frag
  try {
    const file = await fetchOrThrow(path, 'Failed to fetch fragments at');
    const buffer = await file.arrayBuffer();
    const normalizedPath = path.replace(/\\/g, '/');        // normalize slashes for consistent model ids
    const trimmedPath = normalizedPath.replace(/^\/+/, ''); // drop leading slashes to align with repo structure
    let modelId = trimmedPath || 'model';                   // derive a stable identifier from the fragment path
    const fileTail = modelId.split('/').pop() || modelId;   // collapse to last path segment for nicer ids
    modelId = fileTail.replace(/\.frag$/i, '') || fileTail; // drop .frag suffix to keep clean name
    await fragments.core.load(buffer, { modelId });         // register model with derived identifier so selections report current file,  parses data internally to real objects
  } catch (error) {
    console.error(`Error loading fragments from ${path}:`, error);
    displayUserErrorSnackbar(`Model konnte nicht geladen werden: ${path}`); // show a short snackbar in UI
  }
}

export async function loadIfcFromPath(components: Components, path = "/model/custom_psets.ifc"): Promise<void> { // default IFC -> FRAG (online wasm)
  try {
    const file = await fetchOrThrow(path, 'Failed to fetch IFC at');
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);                           // convert to bytes for IfcLoader
    const ifcLoader = components.get(IfcLoader) as IfcLoaderLikeType; // get IFC loader from engine
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

export async function loadModelAutoDetect(components: Components, fragments: FragmentLoaderType, path: string): Promise<void> { // choose IFC or FRAG by extension
  const safePath = String(path || '').trim();
  if (!safePath || safePath.toLowerCase().endsWith('.frag')) {
    return loadFragmentsFromPath(fragments, safePath || undefined);
  }
  if (safePath.toLowerCase().endsWith('.ifc')) {
    return loadIfcFromPath(components, safePath);
  }
  displayUserErrorSnackbar(`Unbekannter Dateityp: ${safePath || path}`);
}

export function escapeHTML(str: unknown): string { // replaces special characters with HTML-safe entities (escaping)
  const s = String(str ?? 'undefined!'); // avoid undefined/null issues
  return s.replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }[m] || m));
}
import { IfcLoader } from "@thatopen/components";
import { displayUserErrorSnackbar } from "../ui/error-notify.js";

