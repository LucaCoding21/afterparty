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
  const [isMobile, setIsMobile] = useState(initialIsMobile);
  const [replayKey, setReplayKey] = useState(0);

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

    // Back/forward cache (aggressive on iOS) restores the DOM — including
    // the <img>/<video> — in its final-frame paused state. Bumping the key
    // forces React to remount the element so the browser replays it from
    // frame 0, matching the behavior of a fresh page load.
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) setReplayKey((k) => k + 1);
    };
    window.addEventListener('pageshow', onPageShow);

    return () => {
      document.body.classList.remove('home-page');
      document.removeEventListener('touchmove', blockTouch);
      window.removeEventListener('pageshow', onPageShow);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Mobile uses an animated WebP (<img>) — browsers play it automatically
    // and iOS Low Power Mode / in-app browsers can't block it.
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
            src="/Mobile_grey.webp"
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
