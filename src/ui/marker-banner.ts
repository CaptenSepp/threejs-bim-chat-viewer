// @ts-check
let OffscreenBannerElem: HTMLDivElement | null = null;              // holds DOM element created once for the banner

function ensureOffscreenBannerElemExist(): HTMLDivElement {                // Ensures banner element exists and returns it
  if (!OffscreenBannerElem) {
    OffscreenBannerElem = document.createElement('div');            // create host element
    OffscreenBannerElem.id = 'app-marker-banner';                   // fixed id
    OffscreenBannerElem.setAttribute('role', 'status');             // accessibility role (non-interactive status)
    document.body.appendChild(OffscreenBannerElem);                 // attach once to body
  }
  return OffscreenBannerElem;
}

// Shows marker metadata HTML in the banner (no auto-hide)
export function displayOffscreenBanner(htmlContent: unknown): void {
  try {
    const el = ensureOffscreenBannerElemExist();                          // create or reuse the banner
    el.innerHTML = String(htmlContent || '');                    // set HTML content (table markup)
    el.classList.add('visible');                                 // make visible (transition)
  } catch (_) { /* never throw from UI helper */ }               // non-critical UI
}

// Hides the banner (used when marker comes back in view or is cleared)
export function hideOffscreenBanner(): void {
  try {
    if (!OffscreenBannerElem) return;                               // nothing to hide
    OffscreenBannerElem.classList.remove('visible');                // hide via CSS class
  } catch (_) { /* do-nothing */ }
}

