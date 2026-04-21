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

// Mobile intro is a WebP sprite sheet stepped through with rAF. Chose
// this over <video> because iOS Low Power Mode silently blocks autoplay,
// and we need the intro to play every time — including refresh and LPM.
const SPRITE_URL = '/Mobile_sprite.webp';
const SPRITE_FRAMES = 45;
const SPRITE_FPS = 12;
const SPRITE_COLS = 9;
const SPRITE_ROWS = 5;
const SPRITE_FRAME_W = 540;
const SPRITE_FRAME_H = 960;

export default function Homepage() {
  const {initialIsMobile} = useLoaderData<typeof loader>();
  const desktopVideoRef = useRef<HTMLVideoElement>(null);
  const spriteRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(initialIsMobile);

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

  // Drive the sprite with requestAnimationFrame. Starts at frame 0 on
  // every mount, so refresh and client-side nav back to home both
  // replay the intro. The poster stays visible underneath until the
  // sprite image has decoded, avoiding a flash of empty background.
  //
  // Sizing mimics object-fit: cover — we compute a scaled frame size
  // that fills the container while preserving the source 9:16 aspect,
  // then center it. Plain % positioning stretches each frame to the
  // container, which looks wrong on 9:19.5 phones.
  useEffect(() => {
    if (!isMobile) return;
    const el = spriteRef.current;
    if (!el) return;

    const interval = 1000 / SPRITE_FPS;
    let frame = 0;
    let last = performance.now();
    let rafId = 0;
    let cancelled = false;
    let scaledFrameW = 0;
    let scaledFrameH = 0;
    let offsetX = 0;
    let offsetY = 0;

    const applyFrame = (i: number) => {
      const col = i % SPRITE_COLS;
      const row = Math.floor(i / SPRITE_COLS);
      const x = offsetX - col * scaledFrameW;
      const y = offsetY - row * scaledFrameH;
      el.style.backgroundPosition = `${x}px ${y}px`;
    };

    const measure = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (!w || !h) return;
      const scale = Math.max(w / SPRITE_FRAME_W, h / SPRITE_FRAME_H);
      scaledFrameW = SPRITE_FRAME_W * scale;
      scaledFrameH = SPRITE_FRAME_H * scale;
      offsetX = (w - scaledFrameW) / 2;
      offsetY = (h - scaledFrameH) / 2;
      el.style.backgroundSize = `${scaledFrameW * SPRITE_COLS}px ${
        scaledFrameH * SPRITE_ROWS
      }px`;
      applyFrame(frame);
    };

    measure();
    el.dataset.ready = 'true';

    const ro = new ResizeObserver(measure);
    ro.observe(el);

    const tick = (now: number) => {
      if (cancelled) return;
      if (now - last >= interval) {
        frame++;
        if (frame >= SPRITE_FRAMES) {
          applyFrame(SPRITE_FRAMES - 1);
          return;
        }
        applyFrame(frame);
        last = now;
      }
      rafId = requestAnimationFrame(tick);
    };

    // Wait for the sprite to decode before starting, so the first few
    // frames don't get skipped while the browser is still fetching.
    const img = new Image();
    img.src = SPRITE_URL;
    const start = () => {
      if (cancelled) return;
      last = performance.now();
      rafId = requestAnimationFrame(tick);
    };
    if (img.complete) start();
    else img.addEventListener('load', start, {once: true});

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      ro.disconnect();
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
          <div
            ref={spriteRef}
            className="home-hero-media home-hero-sprite"
            role="img"
            aria-hidden="true"
          />
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
