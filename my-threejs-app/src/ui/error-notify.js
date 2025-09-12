// @ts-check
// Simple in-app error notifier (tiny snackbar)
let ErrorSnackElem = null;     // holds the DOM element for the snackbar (created once)
let ErrorSnackTimer = null;    // timeout id used to hide the snackbar after a delay

// Shows a short, visible error message to the user via snackbar
export function displayUserErrorSnackbar(messageText = 'Ein Fehler ist aufgetreten', durationMs = 10000) {
  try {
    if (!ErrorSnackElem) {
      ErrorSnackElem = document.createElement('div');         // create snackbar host element
      ErrorSnackElem.id = 'app-error-snackbar';               // fixed id (styled in global CSS)
      ErrorSnackElem.setAttribute('role', 'alert');           // accessibility role for screen readers
      document.body.appendChild(ErrorSnackElem);              // attach to document body once
    }
    ErrorSnackElem.textContent = String(messageText || '');   // set current error text (string)
    ErrorSnackElem.classList.add('visible');                  // make it visible (CSS transition)
    if (ErrorSnackTimer) clearTimeout(ErrorSnackTimer);       // clear any previous hide timer
    ErrorSnackTimer = setTimeout(() => {                         // schedule hide
      if (ErrorSnackElem) ErrorSnackElem.classList.remove('visible');
    }, durationMs);
  } catch (_) { /* no-op: never throw from notifier */ }
}

// @ts-check
