// @ts-check
// Simple always-on-top banner
let MarkerBannerElem = null;                                     // holds DOM element created once for the banner

function ensureBannerElemExist() {                               // Ensures banner element exists and returns it
  if (!MarkerBannerElem) {
    MarkerBannerElem = document.createElement('div');            // create host element
    MarkerBannerElem.id = 'app-marker-banner';                   // fixed id
    MarkerBannerElem.setAttribute('role', 'status');             // accessibility role (non-interactive status)
    document.body.appendChild(MarkerBannerElem);                 // attach once to body
  }
  return MarkerBannerElem;
}

// Shows marker metadata HTML in the banner (no auto-hide)
export function displayMarkerOverflowBanner(htmlContent) {
  try {
    const el = ensureBannerElemExist();                          // create or reuse the banner
    el.innerHTML = String(htmlContent || '');                    // set HTML content (table markup)
    el.classList.add('visible');                                 // make visible (transition)
  } catch (_) { /* never throw from UI helper */ }               // non-critical UI
}

// Hides the banner (used when marker comes back in view or is cleared)
export function hideMarkerOverflowBanner() {
  try {
    if (!MarkerBannerElem) return;                               // nothing to hide
    MarkerBannerElem.classList.remove('visible');                // hide via CSS class
  } catch (_) { /* do-nothing */ }
}

