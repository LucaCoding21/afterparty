import {useEffect, useLayoutEffect, useRef, useState} from 'react';

// Shown once per page load: a refresh or a new visit loads fresh JS and shows
// it again, but coming back to Shop All through the site's own links
// (client-side navigation) keeps this flag and skips it.
let shownThisPageLoad = false;

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * Rendered in <head> on pages that show the popup, so its fonts and artwork
 * download first instead of waiting behind the product grid at the end of
 * the HTML. Only the artwork for the current screen size is fetched.
 */
export function BlackFridayPopupPreloads() {
  return (
    <>
      <link
        rel="preload"
        href="/fonts/biortec-bold.woff2"
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
      />
      <link
        rel="preload"
        href="/fonts/inter-tight-medium.woff2"
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
      />
      <link
        rel="preload"
        href="/popup/blackfriday-art-desktop.webp"
        as="image"
        type="image/webp"
        media="(min-width: 48em)"
        fetchPriority="high"
      />
      <link
        rel="preload"
        href="/popup/blackfriday-art-mobile.webp"
        as="image"
        type="image/webp"
        media="(max-width: 47.99em)"
        fetchPriority="high"
      />
    </>
  );
}

/** The popup shows on Shop All while the sale is on (or previewed). */
export function showsBlackFridayPopup(
  blackFriday: {on: boolean} | undefined,
  pathname: string,
) {
  return Boolean(blackFriday?.on) && pathname === '/collections/all';
}

export function BlackFridayPopup() {
  // Open in the server render so the popup is in the first paint.
  const [open, setOpen] = useState(true);
  // Lets StrictMode's double effect run recognise this same instance.
  const isOwner = useRef(false);

  // Runs before paint, so a repeat visit to Shop All never flashes it.
  useIsomorphicLayoutEffect(() => {
    if (isOwner.current) return;
    if (shownThisPageLoad) {
      setOpen(false);
      return;
    }
    shownThisPageLoad = true;
    isOwner.current = true;
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  function close() {
    setOpen(false);
  }

  if (!open) return null;

  return (
    <>
      <div
        className="bf-popup"
        role="presentation"
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
      >
        <div
          className="bf-popup-card"
          role="dialog"
          aria-modal="true"
          aria-label="Black Friday"
        >
          <button
            type="button"
            className="bf-popup-close"
            aria-label="Close"
            onClick={close}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 5l14 14M19 5L5 19" />
            </svg>
          </button>

          <picture>
            <source
              media="(min-width: 48em)"
              srcSet="/popup/blackfriday-art-desktop.webp"
              width={1100}
              height={889}
            />
            <img
              className="bf-popup-art"
              src="/popup/blackfriday-art-mobile.webp"
              alt=""
              width={1080}
              height={1095}
              fetchPriority="high"
            />
          </picture>

          <div className="bf-popup-head">
            <h2 className="bf-popup-title">BLACK FRIDAY</h2>
            <p className="bf-popup-subtitle">FREE SHIPPING + FREE GIFT</p>
            <p className="bf-popup-dates">27/11—30/11</p>
          </div>

          <div className="bf-popup-body">
            <h3
              className="bf-popup-heading"
              aria-label="FREE GIFT: NHÍM KEYCAP CLICKER"
            >
              {/* Biortec draws its semicolon as a colon (and vice versa),
                  so this is typed as ";" exactly like the design file. */}
              FREE GIFT; NHÍM KEYCAP CLICKER
            </h3>
            <p className="bf-popup-text">
              Free with every order • No minimum spend
            </p>

            <h3 className="bf-popup-heading bf-popup-heading--spaced">
              FREE SHIPPING
            </h3>
            <p className="bf-popup-text">
              Vietnam: On all orders • No minimum spend
              <br />
              South Korea: ₩100,000 or more
              <br />
              Japan: ¥10,000 or more
              <br />
              Australia: $100 AUD or more
              <br />
              All other countries: $100 USD or more
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
