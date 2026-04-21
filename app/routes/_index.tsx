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
  // Every blob URL we mint stays alive until the component unmounts —
  // revoking one while iOS Safari is mid-decode kills the animation and
  // leaves the <img> blank or stuck on the first few frames.
  const blobUrlsRef = useRef<string[]>([]);
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

    // Bfcache restore (iOS restores the DOM frozen on the final frame).
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) setReplayKey((k) => k + 1);
    };
    window.addEventListener('pageshow', onPageShow);

    // iOS Safari caches the animated-WebP end-state per URL, so repeat
    // visits to /Mobile_grey.webp show the last frame. sessionStorage
    // tells us "this tab has seen the homepage before" so we know to
    // swap in a blob URL (fresh identity) instead of rendering the
    // static URL again.
    try {
      const wasVisited = sessionStorage.getItem('home_visited') === '1';
      sessionStorage.setItem('home_visited', '1');
      if (wasVisited) setReplayKey((k) => k + 1);
    } catch {
      // sessionStorage unavailable (private mode, sandboxed iframe).
    }

    return () => {
      document.body.classList.remove('home-page');
      document.removeEventListener('touchmove', blockTouch);
      window.removeEventListener('pageshow', onPageShow);
      blobUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
      blobUrlsRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mobile replay: fetch WebP bytes (HTTP cache hit, no re-download),
  // mint a fresh blob URL, and render a <img> that has never carried
  // that URL before. iOS treats it as a new animation and plays from
  // frame 0. The placeholder <div> in render keeps the img out of the
  // tree until the blob URL is ready — no src swap mid-decode, which
  // is what was causing the blank / first-three-frames behavior.
  useEffect(() => {
    if (!isMobile || replayKey === 0) return;
    setMobileBlobSrc(null);
    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch('/Mobile_grey.webp');
        if (!res.ok || cancelled) return;
        const blob = await res.blob();
        if (cancelled) return;
        const blobUrl = URL.createObjectURL(blob);
        blobUrlsRef.current.push(blobUrl);
        setMobileBlobSrc(blobUrl);
      } catch {
        // Network/fetch failure — leave placeholder up; at least not worse
        // than a broken image.
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
          replayKey === 0 ? (
            // First visit in this tab — SSR-rendered <img> animates
            // cleanly from frame 0, no JS intervention.
            <img
              className="home-hero-video"
              src="/Mobile_grey.webp"
              alt=""
              decoding="async"
              fetchPriority="high"
              draggable={false}
            />
          ) : mobileBlobSrc ? (
            // Repeat visit — fresh blob URL identity. Keyed on the URL
            // so a new blob always mounts a brand-new <img>, never
            // swaps src on a live element.
            <img
              key={mobileBlobSrc}
              className="home-hero-video"
              src={mobileBlobSrc}
              alt=""
              decoding="async"
              fetchPriority="high"
              draggable={false}
            />
          ) : (
            // Blob fetch in flight. Keep the static URL visible so iOS
            // shows the cached last frame instead of a blank gap; the
            // blob-keyed <img> above replaces this within ~50ms and
            // restarts the animation from frame 0.
            <img
              className="home-hero-video"
              src="/Mobile_grey.webp"
              alt=""
              decoding="async"
              fetchPriority="high"
              draggable={false}
            />
          )
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
