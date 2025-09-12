// NEW: Minimal browser-side HTTP helper for JSON requests               // centralizes fetch behavior (headers, JSON, error UI)
import { displayUserVisibleErrorSnackbar } from '../ui/error-notify.js'; // shows a small snackbar on request errors (UI feedback)

async function readTextSafely(res) {                                     // safely read text from a Response without throwing
  try { return await res.text(); } catch { return ''; }                   // fallback to empty string if body cannot be read
}

async function handleJson(res, onErrorPrefix = 'Fehler bei Anfrage') {   // parse JSON and surface HTTP errors consistently
  if (!res.ok) {                                                         // non-2xx → treat as error
    const text = await readTextSafely(res);                              // try to get error text from server
    const msg = text || `${onErrorPrefix}: HTTP ${res.status}`;          // build readable message (fallback to status)
    displayUserVisibleErrorSnackbar(msg);                                // inform user in-app (snackbar)
    throw new Error(msg);                                                // propagate to caller for additional handling
  }
  return res.json();                                                     // success path: decode JSON payload
}

export async function getJson(url, { headers = {}, signal } = {}) {      // perform a GET request expecting a JSON response
  const res = await fetch(url, { method: 'GET', headers, signal });      // fire GET with optional headers/AbortSignal
  return handleJson(res, 'GET fehlgeschlagen');                          // parse or show snackbar on error
}

export async function postJson(url, body, { headers = {}, signal } = {}) { // perform a POST request with JSON body
  const res = await fetch(url, {                                         // send request using Fetch API (browser)
    method: 'POST',                                                      // HTTP verb
    headers: { 'Content-Type': 'application/json', ...headers },         // ensure JSON content type; allow extra headers
    body: JSON.stringify(body),                                          // serialize JS object to JSON string
    signal,                                                              // optional AbortSignal for cancellation
  });
  return handleJson(res, 'POST fehlgeschlagen');                         // parse or show snackbar on error
}
