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

// localStorage key for the cached autoplay-capability result. iOS in Low
// Power Mode rejects video.play() — we test once per device and remember,
// so subsequent visits render the right element on first paint with no
// detection flash.
const AUTOPLAY_CACHE_KEY = 'mobile_autoplay_ok';

type AutoplayState = 'unknown' | 'ok' | 'blocked';

function readCachedAutoplay(): AutoplayState {
  if (typeof window === 'undefined') return 'unknown';
  try {
    const v = window.localStorage.getItem(AUTOPLAY_CACHE_KEY);
    if (v === '1') return 'ok';
    if (v === '0') return 'blocked';
  } catch {
    // localStorage unavailable
  }
  return 'unknown';
}

export default function Homepage() {
  const {initialIsMobile} = useLoaderData<typeof loader>();
  const desktopVideoRef = useRef<HTMLVideoElement>(null);
  const mobileVideoRef = useRef<HTMLVideoElement>(null);
  const [isMobile, setIsMobile] = useState(initialIsMobile);
  const [autoplay, setAutoplay] = useState<AutoplayState>('unknown');

  useEffect(() => {
    document.body.classList.add('home-page');
    const matches = window.matchMedia('(max-width: 48em)').matches;
    if (matches !== isMobile) setIsMobile(matches);

    // In-app browsers (Instagram, TikTok, FB) ignore CSS scroll-lock and
    // bubble touchmove up to their native chrome. Killing the default on
    // touchmove is the only reliable way to stop it across every WebView.
    const blockTouch = (e: TouchEvent) => e.preventDefault();
    document.addEventListener('touchmove', blockTouch, {passive: false});

    setAutoplay(readCachedAutoplay());

    return () => {
      document.body.classList.remove('home-page');
      document.removeEventListener('touchmove', blockTouch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mobile autoplay detection. Try to play the video; if it rejects, the
  // device is in Low Power Mode (or otherwise blocking autoplay) and we
  // fall back to the last-frame poster. Result is memoized in
  // localStorage so future visits skip the detection.
  useEffect(() => {
    if (!isMobile || autoplay !== 'unknown') return;
    const video = mobileVideoRef.current;
    if (!video) return;

    let cancelled = false;
    const commit = (state: 'ok' | 'blocked') => {
      if (cancelled) return;
      setAutoplay(state);
      try {
        window.localStorage.setItem(AUTOPLAY_CACHE_KEY, state === 'ok' ? '1' : '0');
      } catch {
        // localStorage unavailable
      }
    };

    void Promise.resolve(video.play())
      .then(() => commit('ok'))
      .catch(() => commit('blocked'));

    return () => {
      cancelled = true;
    };
  }, [isMobile, autoplay]);

  // Desktop video: same autoplay-with-gesture-fallback pattern as before.
  useEffect(() => {
    if (isMobile) return;
    const video = desktopVideoRef.current;
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
  }, [isMobile]);

  return (
    <div className="home-hero">
      <Link
        to="/collections/all"
        prefetch="intent"
        aria-label="Shop the catalog"
        className="home-hero-link"
      >
        {isMobile ? (
          <>
            {/* Always mounted so we can run the autoplay test. Hidden until
                we know it works — Low Power Mode users never see it. */}
            <video
              ref={mobileVideoRef}
              className="home-hero-video"
              src="/Mobile_grey.mp4"
              autoPlay
              muted
              playsInline
              preload="auto"
              disableRemotePlayback
              style={{
                opacity: autoplay === 'ok' ? 1 : 0,
                pointerEvents: autoplay === 'ok' ? 'auto' : 'none',
              }}
            />
            {autoplay === 'blocked' && (
              <img
                className="home-hero-video"
                src="/Mobile_poster.webp"
                alt=""
                decoding="async"
                fetchPriority="high"
                draggable={false}
              />
            )}
          </>
        ) : (
          <video
            ref={desktopVideoRef}
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
