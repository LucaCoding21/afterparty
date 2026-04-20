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
  return {initialVideoSrc: isMobile ? '/Mobile_grey.mp4' : '/Desktop_grey.mp4'};
}

export default function Homepage() {
  const {initialVideoSrc} = useLoaderData<typeof loader>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoSrc, setVideoSrc] = useState(initialVideoSrc);

  useEffect(() => {
    document.body.classList.add('home-page');
    // Correct the UA guess if the client viewport disagrees (e.g. narrow
    // desktop window, tablet in landscape). Only swap if the pick is wrong.
    const isMobile = window.matchMedia('(max-width: 48em)').matches;
    const correct = isMobile ? '/Mobile_grey.mp4' : '/Desktop_grey.mp4';
    if (correct !== videoSrc) setVideoSrc(correct);

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

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;

    // iOS Low Power Mode can block autoplay even with the muted/inline
    // contract. If play() rejects, resume on the first user gesture so the
    // hero starts playing the moment the visitor interacts with the page.
    let gestureHandler: (() => void) | null = null;
    const removeGesture = () => {
      if (!gestureHandler) return;
      document.removeEventListener('touchstart', gestureHandler);
      document.removeEventListener('click', gestureHandler);
      document.removeEventListener('scroll', gestureHandler);
      document.removeEventListener('keydown', gestureHandler);
      gestureHandler = null;
    };

    const tryPlay = () => {
      const p = video.play();
      if (p && typeof p.catch === 'function') {
        p.catch(() => {
          if (gestureHandler) return;
          gestureHandler = () => {
            video.play().catch(() => {});
            removeGesture();
          };
          document.addEventListener('touchstart', gestureHandler, {passive: true});
          document.addEventListener('click', gestureHandler);
          document.addEventListener('scroll', gestureHandler, {passive: true});
          document.addEventListener('keydown', gestureHandler);
        });
      }
    };

    tryPlay();
    video.addEventListener('loadedmetadata', tryPlay, {once: true});
    return () => {
      video.removeEventListener('loadedmetadata', tryPlay);
      removeGesture();
    };
  }, [videoSrc]);

  return (
    <div className="home-hero">
      <Link
        to="/collections/all"
        prefetch="intent"
        aria-label="Shop the catalog"
        className="home-hero-link"
      >
        <video
          ref={videoRef}
          className="home-hero-video"
          src={videoSrc}
          autoPlay
          muted
          playsInline
          preload="auto"
        />
      </Link>
    </div>
  );
}
