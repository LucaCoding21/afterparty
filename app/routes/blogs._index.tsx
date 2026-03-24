import {useState, useEffect, useCallback} from 'react';

export const meta = () => [{title: 'Afterparty | Lookbook'}];

const LOOKBOOK_IMAGES = [
  // Hater Oversized Tee
  '/Lookbook/Hater Oversized Tee/Copy of 1.jpg',
  '/Lookbook/Hater Oversized Tee/Copy of 2.jpg',
  '/Lookbook/Hater Oversized Tee/Copy of 2(1).jpg',
  '/Lookbook/Hater Oversized Tee/Copy of 3.jpg',
  '/Lookbook/Hater Oversized Tee/Copy of 4.jpg',
  // Bubble Letter Ringer Tees
  '/Lookbook/Bubble Letter Ringer Tees/Copy of Artboard 1.jpg',
  '/Lookbook/Bubble Letter Ringer Tees/Copy of Artboard 2.jpg',
  '/Lookbook/Bubble Letter Ringer Tees/Copy of Artboard 3.jpg',
  // Horse Trucker Hat
  '/Lookbook/Horse Trucker Hat/Copy of 1.jpg',
  '/Lookbook/Horse Trucker Hat/Copy of 1(1).jpg',
  '/Lookbook/Horse Trucker Hat/Copy of 2.jpg',
  '/Lookbook/Horse Trucker Hat/Copy of 3.jpg',
  '/Lookbook/Horse Trucker Hat/Copy of 3(1).jpg',
  '/Lookbook/Horse Trucker Hat/Copy of 4.jpg',
  '/Lookbook/Horse Trucker Hat/Copy of 4(1).jpg',
  '/Lookbook/Horse Trucker Hat/Copy of 5.jpg',
  '/Lookbook/Horse Trucker Hat/Copy of 5(1).jpg',
  // Velour Tracksuit
  '/Lookbook/Velour Tracksuit/Copy of Artboard 1.jpg',
  '/Lookbook/Velour Tracksuit/Copy of Artboard 2.jpg',
  '/Lookbook/Velour Tracksuit/Copy of Artboard 4.jpg',
  '/Lookbook/Velour Tracksuit/Copy of Artboard 6.jpg',
  '/Lookbook/Velour Tracksuit/Copy of Artboard 8.jpg',
  '/Lookbook/Velour Tracksuit/Blue Tracksuit (not available for stockists)/Copy of Artboard 3.jpg',
  '/Lookbook/Velour Tracksuit/Blue Tracksuit (not available for stockists)/Copy of Artboard 5.jpg',
  '/Lookbook/Velour Tracksuit/Blue Tracksuit (not available for stockists)/Copy of Artboard 7.jpg',
  '/Lookbook/Velour Tracksuit/Blue Tracksuit (not available for stockists)/Copy of Artboard 9.jpg',
  '/Lookbook/Velour Tracksuit/Blue Tracksuit (not available for stockists)/Copy of Artboard 10.jpg',
  // Dog, Screw Hoodie
  '/Lookbook/Dog, Screw Hoodie/Copy of 1.jpg',
  '/Lookbook/Dog, Screw Hoodie/Copy of 1(1).jpg',
  '/Lookbook/Dog, Screw Hoodie/Copy of 1(2).jpg',
  '/Lookbook/Dog, Screw Hoodie/Copy of 1(3).jpg',
  '/Lookbook/Dog, Screw Hoodie/Copy of 2.jpg',
  '/Lookbook/Dog, Screw Hoodie/Copy of 2(1).jpg',
  '/Lookbook/Dog, Screw Hoodie/Copy of 2(2).jpg',
  '/Lookbook/Dog, Screw Hoodie/Copy of 2(3).jpg',
  '/Lookbook/Dog, Screw Hoodie/Copy of 3.jpg',
  '/Lookbook/Dog, Screw Hoodie/Copy of 3(1).jpg',
  '/Lookbook/Dog, Screw Hoodie/Copy of 3(2).jpg',
  '/Lookbook/Dog, Screw Hoodie/Copy of 3(3).jpg',
  '/Lookbook/Dog, Screw Hoodie/Copy of 4.jpg',
  '/Lookbook/Dog, Screw Hoodie/Copy of 4(1).jpg',
  '/Lookbook/Dog, Screw Hoodie/Copy of 4(2).jpg',
  '/Lookbook/Dog, Screw Hoodie/Copy of 4(3).jpg',
  '/Lookbook/Dog, Screw Hoodie/Copy of 5.jpg',
  '/Lookbook/Dog, Screw Hoodie/Copy of 5(1).jpg',
  '/Lookbook/Dog, Screw Hoodie/Copy of 5(2).jpg',
  '/Lookbook/Dog, Screw Hoodie/Copy of 5(3).jpg',
  // Nhim T-shirts 2025
  '/Lookbook/Nhim T-shirts 2025/Copy of 1.jpg',
  '/Lookbook/Nhim T-shirts 2025/Copy of 1(1).jpg',
  '/Lookbook/Nhim T-shirts 2025/Copy of 1(2).JPG',
  '/Lookbook/Nhim T-shirts 2025/Copy of 2.jpg',
  '/Lookbook/Nhim T-shirts 2025/Copy of 2(1).JPG',
  '/Lookbook/Nhim T-shirts 2025/Copy of 2(2).JPG',
  '/Lookbook/Nhim T-shirts 2025/Copy of 3.jpg',
  '/Lookbook/Nhim T-shirts 2025/Copy of 3(1).jpg',
  '/Lookbook/Nhim T-shirts 2025/Copy of 3(2).JPG',
  '/Lookbook/Nhim T-shirts 2025/Copy of 4.jpg',
  '/Lookbook/Nhim T-shirts 2025/Copy of 4(1).jpg',
  '/Lookbook/Nhim T-shirts 2025/Copy of 4(2).JPG',
  '/Lookbook/Nhim T-shirts 2025/Copy of 5.jpg',
  '/Lookbook/Nhim T-shirts 2025/Copy of 5(1).JPG',
  '/Lookbook/Nhim T-shirts 2025/Copy of 6.JPG',
  '/Lookbook/Nhim T-shirts 2025/Copy of 7.jpg',
  '/Lookbook/Nhim T-shirts 2025/Copy of 8.JPG',
  '/Lookbook/Nhim T-shirts 2025/Copy of 9.JPG',
  // Hater Baby Tee
  '/Lookbook/Hater Baby Tee/Copy of 1st - BEST.jpg',
  '/Lookbook/Hater Baby Tee/Copy of 2.jpg',
  '/Lookbook/Hater Baby Tee/Copy of 3.jpg',
  '/Lookbook/Hater Baby Tee/Copy of 4.jpg',
  '/Lookbook/Hater Baby Tee/Copy of 5.jpg',
  '/Lookbook/Hater Baby Tee/Copy of 6.jpg',
  '/Lookbook/Hater Baby Tee/Copy of 6(1).jpg',
  // Leopard Set
  '/Lookbook/Leopard Set/Copy of 1.JPG',
  '/Lookbook/Leopard Set/Copy of 1(1).JPG',
  '/Lookbook/Leopard Set/Copy of 2.JPG',
  '/Lookbook/Leopard Set/Copy of 2(1).JPG',
  '/Lookbook/Leopard Set/Copy of 5.JPG',
  '/Lookbook/Leopard Set/Copy of 6.JPG',
  '/Lookbook/Leopard Set/Copy of 6(1).JPG',
  '/Lookbook/Leopard Set/Copy of 7.jpg',
  // Leopard Flared Pants
  '/Lookbook/Leopard Flared Pants/Copy of 1 Artboard 2.jpg',
  '/Lookbook/Leopard Flared Pants/Copy of 2 Artboard 4.jpg',
  '/Lookbook/Leopard Flared Pants/Copy of 3 Artboard 1.jpg',
  '/Lookbook/Leopard Flared Pants/Copy of 4 Artboard 3.jpg',
  // Dragon Jersey
  '/Lookbook/Dragon Jersey/Copy of 1.jpg',
  '/Lookbook/Dragon Jersey/Copy of 1(1).jpg',
  '/Lookbook/Dragon Jersey/Copy of 2.jpg',
  '/Lookbook/Dragon Jersey/Copy of 2(1).jpg',
  '/Lookbook/Dragon Jersey/Copy of 3.jpg',
  '/Lookbook/Dragon Jersey/Copy of 3(1).jpg',
  '/Lookbook/Dragon Jersey/Copy of 4.jpg',
  '/Lookbook/Dragon Jersey/Copy of 4(1).jpg',
  '/Lookbook/Dragon Jersey/Copy of 5.jpg',
  '/Lookbook/Dragon Jersey/Copy of 6.jpg',
  '/Lookbook/Dragon Jersey/Copy of 6(1).jpg',
  '/Lookbook/Dragon Jersey/Copy of 7.jpg',
  '/Lookbook/Dragon Jersey/Copy of 8.jpg',
  '/Lookbook/Dragon Jersey/Pink Dragon Jersey 1.jpg',
  '/Lookbook/Dragon Jersey/Pink Dragon Jersey 2.jpg',
];

export default function Lookbook() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const close = useCallback(() => setActiveIndex(null), []);
  const prev = useCallback(() =>
    setActiveIndex((i) => (i! - 1 + LOOKBOOK_IMAGES.length) % LOOKBOOK_IMAGES.length), []);
  const next = useCallback(() =>
    setActiveIndex((i) => (i! + 1) % LOOKBOOK_IMAGES.length), []);

  useEffect(() => {
    if (activeIndex === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeIndex, close, prev, next]);

  return (
    <>
      <div className="lookbook-layout">
        <div className="lookbook-left">
          <div className="lookbook-title-block">
            <h1 className="lookbook-heading">Lookbook</h1>
            <p className="lookbook-description">Every drop, shot in the wild — this is Afterparty in the flesh.</p>
          </div>
        </div>
        <div className="lookbook-gallery">
          {LOOKBOOK_IMAGES.map((src, i) => (
            <img
              key={src}
              src={src}
              alt=""
              className="lookbook-photo"
              loading={i < 8 ? 'eager' : 'lazy'}
              onClick={() => setActiveIndex(i)}
            />
          ))}
        </div>
      </div>

      {activeIndex !== null && (
        <div className="lightbox-overlay" onClick={close}>
          <button className="lightbox-close" onClick={close} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <div className="lightbox-inner" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-prev" onClick={prev} aria-label="Previous">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <img
              className="lightbox-img"
              src={LOOKBOOK_IMAGES[activeIndex]}
              alt=""
            />
            <button className="lightbox-next" onClick={next} aria-label="Next">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
