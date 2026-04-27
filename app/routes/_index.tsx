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

// Mobile intro is a pair of WebP sprite sheets stepped through with rAF.
// Chose this over <video> because iOS Low Power Mode silently blocks
// autoplay, and we need the intro to play every time — refresh and LPM.
// Split into two sprites so the first frame paints ~3x faster on cold
// loads: sprite A (~34KB) downloads and decodes first, rAF starts, and
// sprite B (~260KB) streams in during A's playback (1.25s at 12fps).
const SPRITE_A_URL = '/Mobile_sprite_a.webp';
const SPRITE_B_URL = '/Mobile_sprite_b.webp';
const SPRITE_A_FRAMES = 15;
const SPRITE_A_COLS = 5;
const SPRITE_A_ROWS = 3;
const SPRITE_B_FRAMES = 30;
const SPRITE_B_COLS = 6;
const SPRITE_B_ROWS = 5;
const SPRITE_TOTAL_FRAMES = SPRITE_A_FRAMES + SPRITE_B_FRAMES;
const SPRITE_FPS = 12;
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

  // Drive the sprites with requestAnimationFrame. Starts at frame 0 on
  // every mount, so refresh and client-side nav back to home both
  // replay the intro.
  //
  // Sizing mimics object-fit: cover — we compute a scaled frame size
  // that fills the container while preserving the source 9:16 aspect,
  // then center it. Plain % positioning stretches each frame to the
  // container, which looks wrong on 9:19.5 phones.
  //
  // Handoff: we start sprite B's download in parallel with A's. When
  // the global frame counter crosses SPRITE_A_FRAMES, we swap the
  // background-image and grid dims to B. If B hasn't decoded yet by
  // then (rare on 4G+), we hold on A's last frame until it's ready —
  // better a brief pause than a blank or wrong-sprite flash.
  useEffect(() => {
    if (!isMobile) return;
    const el = spriteRef.current;
    if (!el) return;

    const interval = 1000 / SPRITE_FPS;
    let frame = 0;
    let last = performance.now();
    let rafId = 0;
    let cancelled = false;
    let onB = false;
    let bReady = false;
    let scaledFrameW = 0;
    let scaledFrameH = 0;
    let offsetX = 0;
    let offsetY = 0;

    const applyFrame = (global: number) => {
      const local = onB ? global - SPRITE_A_FRAMES : global;
      const cols = onB ? SPRITE_B_COLS : SPRITE_A_COLS;
      const col = local % cols;
      const row = Math.floor(local / cols);
      const x = offsetX - col * scaledFrameW;
      const y = offsetY - row * scaledFrameH;
      el.style.backgroundPosition = `${x}px ${y}px`;
    };

    const setBackgroundSize = () => {
      const cols = onB ? SPRITE_B_COLS : SPRITE_A_COLS;
      const rows = onB ? SPRITE_B_ROWS : SPRITE_A_ROWS;
      el.style.backgroundSize = `${scaledFrameW * cols}px ${
        scaledFrameH * rows
      }px`;
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
      setBackgroundSize();
      applyFrame(frame);
    };

    const switchToB = () => {
      onB = true;
      el.style.backgroundImage = `url(${SPRITE_B_URL})`;
      setBackgroundSize();
      applyFrame(frame);
    };

    // Kick off downloads. A starts immediately; B loads in parallel so
    // it's usually decoded well before the handoff point.
    const imgA = new Image();
    imgA.src = SPRITE_A_URL;
    const imgB = new Image();
    imgB.src = SPRITE_B_URL;
    const onBLoaded = () => {
      bReady = true;
    };
    if (imgB.complete) bReady = true;
    else imgB.addEventListener('load', onBLoaded, {once: true});

    el.style.backgroundImage = `url(${SPRITE_A_URL})`;
    measure();
    el.dataset.ready = 'true';

    const ro = new ResizeObserver(measure);
    ro.observe(el);

    const tick = (now: number) => {
      if (cancelled) return;
      if (now - last >= interval) {
        const next = frame + 1;
        if (next >= SPRITE_TOTAL_FRAMES) {
          // Last frame reached — leave the image on screen, stop looping.
          applyFrame(SPRITE_TOTAL_FRAMES - 1);
          return;
        }
        // Need to cross into B? Only advance if B has decoded.
        if (next >= SPRITE_A_FRAMES && !onB) {
          if (!bReady) {
            // Hold on A's last frame. Don't advance `last`, so the loop
            // retries next rAF without accumulating drift.
            rafId = requestAnimationFrame(tick);
            return;
          }
          switchToB();
        }
        frame = next;
        applyFrame(frame);
        last = now;
      }
      rafId = requestAnimationFrame(tick);
    };

    // Wait for sprite A to decode before starting, so the first few
    // frames don't get skipped while the browser is still fetching.
    const startA = () => {
      if (cancelled) return;
      last = performance.now();
      rafId = requestAnimationFrame(tick);
    };
    if (imgA.complete) startA();
    else imgA.addEventListener('load', startA, {once: true});

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
    // Only kick play() if the video has never started yet — otherwise a click on
    // a nav link after the video ended would restart it from frame 0 right
    // before navigation, causing a visible flash.
    const onGesture = () => {
      if (video.paused && video.currentTime === 0) tryPlay();
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
