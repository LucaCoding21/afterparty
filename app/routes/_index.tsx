import {Link} from 'react-router';
import {useState, useEffect} from 'react';
import type {Route} from './+types/_index';

export const meta: Route.MetaFunction = () => {
  return [{title: 'afterparty'}];
};

const HERO_IMAGES = [
  '/blue.png',
  '/orange.png',
  '/green.png',
  '/red.png',
  '/Illustration14.png',
];

export default function Homepage() {
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 250);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{position: 'fixed', inset: 0, overflow: 'hidden', background: '#fff'}}>
      {/* Cycling hero images — centered and big */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-48%, -50%)',
          width: '180vmin',
          height: '180vmin',
        }}
      >
        {HERO_IMAGES.map((src, i) => (
          <img
            key={src}
            src={src}
            alt="afterparty"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              opacity: i === currentImage ? 1 : 0,
            }}
          />
        ))}
      </div>
    </div>
  );
}
