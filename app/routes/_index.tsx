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
  const desktopVideoRef = useRef<HTMLVideoElement>(null);
  const mobileVideoRef = useRef<HTMLVideoElement>(null);
  const [isMobile, setIsMobile] = useState(initialIsMobile);
  // Mobile uses a stacked poster + video. The poster is always visible;
  // the video lives on top at opacity 0 and crossfades in once it
  // actually starts playing. iOS Low Power Mode silently blocks
  // autoplay — those users never see the video fade in, so the poster
  // stays visible. No detection logic needed.
  const [videoPlaying, setVideoPlaying] = useState(false);

  useEffect(() => {
    document.body.classList.add('home-page');
    const matches = window.matchMedia('(max-width: 48em)').matches;
    if (matches !== isMobile) setIsMobile(matches);

    // In-app browsers (Instagram, TikTok, FB) ignore CSS scroll-lock and
    // bubble touchmove up to their native chrome. Killing the default on
    // touchmove is the only reliable way to stop it across every WebView.
    const blockTouch = (e: TouchEvent) => e.preventDefault();
    document.addEventListener('touchmove', blockTouch, {passive: false});

    return () => {
      document.body.classList.remove('home-page');
      document.removeEventListener('touchmove', blockTouch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mobile video: the autoPlay attribute alone isn't reliable on iOS,
  // especially after client-side navigation (product → home). Calling
  // play() explicitly on mount and again on canplay/loadedmetadata
  // covers the cases where the attribute didn't fire. In Low Power
  // Mode the call rejects silently and the poster stays visible — no
  // detection needed because playback simply never starts.
  //
  // Visibility is driven by native event listeners (not React's
  // synthetic onPlaying) because React can attach its handler after
  // the 'playing' event has already fired on fast devices, leaving us
  // stuck on the poster forever. We also check the video's current
  // state on mount to catch the case where playback started before
  // this effect ran.
  useEffect(() => {
    if (!isMobile) return;
    const video = mobileVideoRef.current;
    if (!video) return;

    const markPlaying = () => {
      if (!video.paused && video.currentTime > 0) setVideoPlaying(true);
    };

    // If the video is already advancing by the time we mount, flip on.
    markPlaying();

    const onPlaying = () => setVideoPlaying(true);
    const tryPlay = () => {
      video.play().catch(() => {});
    };

    tryPlay();
    video.addEventListener('playing', onPlaying);
    video.addEventListener('timeupdate', markPlaying);
    video.addEventListener('canplay', tryPlay);
    video.addEventListener('loadedmetadata', tryPlay);

    return () => {
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('timeupdate', markPlaying);
      video.removeEventListener('canplay', tryPlay);
      video.removeEventListener('loadedmetadata', tryPlay);
    };
  }, [isMobile]);

  // Desktop video: autoplay with gesture fallback (some browsers block
  // autoplay until the user has interacted with the page).
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
            <img
              className="home-hero-media"
              src="/Mobile_poster.webp"
              alt=""
              decoding="async"
              fetchPriority="high"
              draggable={false}
            />
            <video
              ref={mobileVideoRef}
              className="home-hero-media home-hero-media--fade"
              src="/Mobile_grey.mp4"
              autoPlay
              muted
              playsInline
              preload="auto"
              disableRemotePlayback
              data-playing={videoPlaying ? 'true' : 'false'}
            />
          </>
        ) : (
          <video
            ref={desktopVideoRef}
            className="home-hero-media"
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
