import {useState, useEffect, useCallback} from 'react';
import {seoTags} from '~/lib/seo';

export const meta = () =>
  seoTags({
    title: 'Lookbook — afterparty',
    description:
      'The afterparty lookbook — see how our streetwear from Vietnam fits and is styled.',
    url: '/blogs',
  });

const LOOKBOOK_SECTIONS = [
  {
    title: 'Hater Oversized Tee',
    images: [
      '/Lookbook/Hater Oversized Tee/Copy of 1.jpg',
      '/Lookbook/Hater Oversized Tee/Copy of 2.jpg',
      '/Lookbook/Hater Oversized Tee/Copy of 2(1).jpg',
      '/Lookbook/Hater Oversized Tee/Copy of 3.jpg',
      '/Lookbook/Hater Oversized Tee/Copy of 4.jpg',
    ],
  },
  {
    title: 'Bubble Letter Ringer Tees',
    images: [
      '/Lookbook/Bubble Letter Ringer Tees/Copy of Artboard 1.jpg',
      '/Lookbook/Bubble Letter Ringer Tees/Copy of Artboard 2.jpg',
      '/Lookbook/Bubble Letter Ringer Tees/Copy of Artboard 3.jpg',
    ],
  },
  {
    title: 'Horse Trucker Hat',
    images: [
      '/Lookbook/Horse Trucker Hat/Copy of 1.jpg',
      '/Lookbook/Horse Trucker Hat/Copy of 1(1).jpg',
      '/Lookbook/Horse Trucker Hat/Copy of 2.jpg',
      '/Lookbook/Horse Trucker Hat/Copy of 3.jpg',
      '/Lookbook/Horse Trucker Hat/Copy of 3(1).jpg',
      '/Lookbook/Horse Trucker Hat/Copy of 4.jpg',
      '/Lookbook/Horse Trucker Hat/Copy of 4(1).jpg',
      '/Lookbook/Horse Trucker Hat/Copy of 5.jpg',
      '/Lookbook/Horse Trucker Hat/Copy of 5(1).jpg',
    ],
  },
  {
    title: 'Velour Tracksuit',
    images: [
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
    ],
  },
  {
    title: 'Dog, Screw Hoodie',
    images: [
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
    ],
  },
  {
    title: 'Nhim T-Shirts 2025',
    images: [
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
    ],
  },
  {
    title: 'Hater Baby Tee',
    images: [
      '/Lookbook/Hater Baby Tee/Copy of 1st - BEST.jpg',
      '/Lookbook/Hater Baby Tee/Copy of 2.jpg',
      '/Lookbook/Hater Baby Tee/Copy of 3.jpg',
      '/Lookbook/Hater Baby Tee/Copy of 4.jpg',
      '/Lookbook/Hater Baby Tee/Copy of 5.jpg',
      '/Lookbook/Hater Baby Tee/Copy of 6.jpg',
      '/Lookbook/Hater Baby Tee/Copy of 6(1).jpg',
    ],
  },
  {
    title: 'Leopard Set',
    images: [
      '/Lookbook/Leopard Set/Copy of 1.JPG',
      '/Lookbook/Leopard Set/Copy of 1(1).JPG',
      '/Lookbook/Leopard Set/Copy of 2.JPG',
      '/Lookbook/Leopard Set/Copy of 2(1).JPG',
      '/Lookbook/Leopard Set/Copy of 5.JPG',
      '/Lookbook/Leopard Set/Copy of 6.JPG',
      '/Lookbook/Leopard Set/Copy of 6(1).JPG',
      '/Lookbook/Leopard Set/Copy of 7.jpg',
    ],
  },
  {
    title: 'Leopard Flared Pants',
    images: [
      '/Lookbook/Leopard Flared Pants/Copy of 1 Artboard 2.jpg',
      '/Lookbook/Leopard Flared Pants/Copy of 2 Artboard 4.jpg',
      '/Lookbook/Leopard Flared Pants/Copy of 3 Artboard 1.jpg',
      '/Lookbook/Leopard Flared Pants/Copy of 4 Artboard 3.jpg',
    ],
  },
  {
    title: 'Dragon Jersey',
    images: [
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
    ],
  },
];

const ALL_IMAGES = LOOKBOOK_SECTIONS.flatMap((s) => s.images);

// Precompute global start index per section for lightbox
const SECTION_OFFSETS = LOOKBOOK_SECTIONS.map((_, i) =>
  LOOKBOOK_SECTIONS.slice(0, i).reduce((acc, s) => acc + s.images.length, 0),
);

export default function Lookbook() {
  const [activeTab, setActiveTab] = useState(0);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const section = LOOKBOOK_SECTIONS[activeTab];
  const sectionOffset = SECTION_OFFSETS[activeTab];

  const close = useCallback(() => setActiveIndex(null), []);
  const prev = useCallback(
    () => setActiveIndex((i) => (i! - 1 + ALL_IMAGES.length) % ALL_IMAGES.length),
    [],
  );
  const next = useCallback(
    () => setActiveIndex((i) => (i! + 1) % ALL_IMAGES.length),
    [],
  );

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
      <div className="lookbook-page">
        <div className="lookbook-page-header">
          <span className="lookbook-page-label">Lookbook</span>
        </div>

        <div className="lookbook-tabs-wrap">
          <div className="lookbook-tabs">
            {LOOKBOOK_SECTIONS.map((s, i) => (
              <button
                key={s.title}
                className={`lookbook-tab${activeTab === i ? ' active' : ''}`}
                onClick={() => setActiveTab(i)}
              >
                {s.title}
              </button>
            ))}
          </div>
        </div>

        <div className="lookbook-section-grid">
          {section.images.map((src, i) => (
            <img
              key={src}
              src={src}
              alt=""
              className="lookbook-photo"
              loading={i < 6 ? 'eager' : 'lazy'}
              onClick={() => setActiveIndex(sectionOffset + i)}
            />
          ))}
        </div>
      </div>

      {activeIndex !== null && (
        <div className="lightbox-overlay" onClick={close}>
          <button className="lightbox-close" onClick={close} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <div className="lightbox-inner" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-prev" onClick={prev} aria-label="Previous">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <img className="lightbox-img" src={ALL_IMAGES[activeIndex]} alt="" />
            <button className="lightbox-next" onClick={next} aria-label="Next">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
