import {Link} from 'react-router';
import {useEffect, useRef, useState} from 'react';
import type {Route} from './+types/_index';

export const meta: Route.MetaFunction = () => {
  return [{title: 'afterparty'}];
};

export default function Homepage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoSrc, setVideoSrc] = useState('/hero-anim.mp4');

  useEffect(() => {
    document.body.classList.add('home-page');
    const isMobile = window.matchMedia('(max-width: 48em)').matches;
    setVideoSrc(isMobile ? '/hero-anim-vertical.mp4' : '/hero-anim.mp4');
    return () => {
      document.body.classList.remove('home-page');
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    const tryPlay = () => video.play().catch(() => {});
    tryPlay();
    video.addEventListener('loadedmetadata', tryPlay, {once: true});
    return () => video.removeEventListener('loadedmetadata', tryPlay);
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
