// Simple in-app error notifier (tiny snackbar)
let ErrorSnackbarElement = null;  // holds the DOM element for the snackbar (created once)
let ErrorSnackbarTimer = null;    // timeout id used to hide the snackbar after a delay

// Shows a short, visible error message to the user via snackbar
export function displayUserVisibleErrorSnackbar(messageText = 'Ein Fehler ist aufgetreten', visibleDurationMs = 10000) {
  try {
    if (!ErrorSnackbarElement) {
      ErrorSnackbarElement = document.createElement('div');         // create snackbar host element
      ErrorSnackbarElement.id = 'app-error-snackbar';               // fixed id (styled in global CSS)
      ErrorSnackbarElement.setAttribute('role', 'alert');           // accessibility role for screen readers
      document.body.appendChild(ErrorSnackbarElement);              // attach to document body once
    }
    ErrorSnackbarElement.textContent = String(messageText || '');   // set current error text (string)
    ErrorSnackbarElement.classList.add('visible');                  // make it visible (CSS transition)
    if (ErrorSnackbarTimer) clearTimeout(ErrorSnackbarTimer);       // clear any previous hide timer
    ErrorSnackbarTimer = setTimeout(() => {                         // schedule hide
      if (ErrorSnackbarElement) ErrorSnackbarElement.classList.remove('visible');
    }, visibleDurationMs);
  } catch (_) { /* no-op: never throw from notifier */ }
}

// Back-compat named export (older call sites)
export { displayUserVisibleErrorSnackbar as displayUserErrorSnackbar };
