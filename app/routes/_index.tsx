import {useEffect} from 'react';
import type {Route} from './+types/_index';

export const meta: Route.MetaFunction = () => {
  return [{title: 'afterparty'}];
};

export default function Homepage() {
  useEffect(() => {
    document.body.classList.add('home-page');
    return () => {
      document.body.classList.remove('home-page');
    };
  }, []);

  return (
    <div className="home-hero">
      <video
        className="home-hero-video"
        autoPlay
        muted
        playsInline
        preload="auto"
      >
        <source src="/hero-anim-vertical.mp4" media="(max-width: 48em)" type="video/mp4" />
        <source src="/hero-anim.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
