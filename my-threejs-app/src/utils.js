async function fetchOrThrow(resource, errorPrefix) {                                // Fetch check
  const res = await fetch(resource);                                                // Perform fetch
  if (!res.ok) {                                                                    // Throw
    throw new Error(`${errorPrefix} ${resource}: ${res.status} ${res.statusText}`); // Error message
  }
  return res;                                                                       // Successful response
}

export async function getWorkerUrl(url) {
  try {
    const workerResponse = await fetchOrThrow(url, 'Failed to fetch worker at');
    const workerBlob = await workerResponse.blob();
    const workerFile = new File([workerBlob], "worker.mjs", { type: "text/javascript" });
    return URL.createObjectURL(workerFile);
  } catch (error) {
    throw new Error(`Error loading worker from ${url}: ${error.message}`);
  }
}

export async function loadFragments(fragments, path = "/frags/school_str.frag") {
  try {
    const file = await fetchOrThrow(path, 'Failed to fetch fragments at');
    const buffer = await file.arrayBuffer();
    await fragments.core.load(buffer, { modelId: "school_str" });
  } catch (error) {
    console.error(`Error loading fragments from ${path}:`, error);
  }
}

export function escapeHTML(str) {
  const s = String(str ?? 'undefined!'); // Prevent errors in chat 
  return s.replace(/[&<>"']/g, m => ({
    '&': '&amp;',   // Escape ampersand 
    '<': '&lt;',    // Tag start 
    '>': '&gt;',    // Tag end 
    '"': '&quot;',  // Attribute values in double quotes 
    "'": '&#039;',  // Escape single quotes 
  }[m]));
} 
