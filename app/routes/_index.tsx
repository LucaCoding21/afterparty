import {Link, useLoaderData} from 'react-router';
import {useEffect, useRef, useState} from 'react';
import type {Route} from './+types/_index';

export const meta: Route.MetaFunction = () => {
  return [{title: 'afterparty'}];
};

export async function loader({request}: Route.LoaderArgs) {
  const ua = request.headers.get('user-agent') ?? '';
  const isMobile = /Mobi|Android|iPhone|iPad|iPod|webOS|BlackBerry|Windows Phone/i.test(
    ua,
  );
  return {initialIsMobile: isMobile};
}

export default function Homepage() {
  const {initialIsMobile} = useLoaderData<typeof loader>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const blobUrlRef = useRef<string | null>(null);
  const [isMobile, setIsMobile] = useState(initialIsMobile);
  const [replayKey, setReplayKey] = useState(0);
  const [mobileBlobSrc, setMobileBlobSrc] = useState<string | null>(null);

  useEffect(() => {
    document.body.classList.add('home-page');
    // Correct the UA guess if the client viewport disagrees (e.g. narrow
    // desktop window, tablet in landscape). Only swap if the pick is wrong.
    const matches = window.matchMedia('(max-width: 48em)').matches;
    if (matches !== isMobile) setIsMobile(matches);

    // In-app browsers (Instagram, TikTok, FB) ignore CSS scroll-lock and
    // bubble touchmove up to their native chrome. Killing the default on
    // touchmove is the only reliable way to stop it across every WebView.
    const blockTouch = (e: TouchEvent) => e.preventDefault();
    document.addEventListener('touchmove', blockTouch, {passive: false});

    // Bfcache restore — iOS is aggressive about preserving the DOM, so
    // the <img>/<video> come back frozen on their final frame.
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) setReplayKey((k) => k + 1);
    };
    window.addEventListener('pageshow', onPageShow);

    // iOS Safari caches the animated-WebP end-state per URL. On repeat
    // visits (refresh, back-nav, bfcache) a new <img> pointing at the
    // same /Mobile_grey.webp re-shows the last frame instead of replaying.
    // Detecting "this is a repeat visit in this tab" via sessionStorage
    // lets us swap in a blob URL (unique identity, bytes pulled from HTTP
    // cache) which iOS treats as a fresh animation.
    try {
      const wasVisited = sessionStorage.getItem('home_visited') === '1';
      sessionStorage.setItem('home_visited', '1');
      if (wasVisited) setReplayKey((k) => k + 1);
    } catch {
      // sessionStorage may be unavailable (private mode, sandboxed iframe)
    }

    return () => {
      document.body.classList.remove('home-page');
      document.removeEventListener('touchmove', blockTouch);
      window.removeEventListener('pageshow', onPageShow);
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mobile: on every replay (replayKey > 0), fetch the WebP bytes from the
  // browser's HTTP cache and wrap them in a fresh blob URL. The new URL
  // has a unique identity iOS Safari hasn't seen, so it re-decodes and
  // animates from frame 0. No re-download.
  useEffect(() => {
    if (!isMobile || replayKey === 0) return;
    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch('/Mobile_grey.webp');
        if (!res.ok || cancelled) return;
        const blob = await res.blob();
        if (cancelled) return;
        const blobUrl = URL.createObjectURL(blob);
        if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = blobUrl;
        setMobileBlobSrc(blobUrl);
      } catch {
        // Fall back to the static URL (already rendered).
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isMobile, replayKey]);

  useEffect(() => {
    if (isMobile) return;
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;

    const tryPlay = () => {
      video.play().catch(() => {});
    };
    const onGesture = () => {
      if (video.paused) tryPlay();
    };

    tryPlay();
    video.addEventListener('canplay', tryPlay);
    video.addEventListener('loadedmetadata', tryPlay);
    document.addEventListener('click', onGesture);
    document.addEventListener('keydown', onGesture);

    return () => {
      video.removeEventListener('canplay', tryPlay);
      video.removeEventListener('loadedmetadata', tryPlay);
      document.removeEventListener('click', onGesture);
      document.removeEventListener('keydown', onGesture);
    };
  }, [isMobile, replayKey]);

  return (
    <div className="home-hero">
      <Link
        to="/collections/all"
        prefetch="intent"
        aria-label="Shop the catalog"
        className="home-hero-link"
      >
        {isMobile ? (
          <img
            key={replayKey}
            className="home-hero-video"
            src={mobileBlobSrc ?? '/Mobile_grey.webp'}
            alt=""
            decoding="async"
            fetchPriority="high"
            draggable={false}
          />
        ) : (
          <video
            key={replayKey}
            ref={videoRef}
            className="home-hero-video"
            src="/Desktop_grey.mp4"
            autoPlay
            muted
            playsInline
            preload="auto"
            disableRemotePlayback
          />
        )}
      </Link>
    </div>
  );
}
