import {useState} from 'react';
import {seoTags} from '~/lib/seo';

const SUPPORT_FAQS: Array<{q: string; a: string}> = [
  {
    q: 'How do I track my order?',
    a: "Once your order ships you'll receive a confirmation email with a tracking link. Allow 24 to 48 hours for tracking to update.",
  },
  {
    q: 'Can I change or cancel my order?',
    a: 'Orders can be amended within 2 hours of being placed. After that, they move into fulfilment and can no longer be changed.',
  },
  {
    q: 'My item arrived damaged, what do I do?',
    a: "Email minh@afterparty.space with your order number and photos of the damage. We'll sort it out immediately.",
  },
  {
    q: 'Where do you ship from?',
    a: 'All orders are packed by hand in Ho Chi Minh City, Vietnam, and dispatched within 1 to 3 business days.',
  },
  {
    q: 'How long does shipping take to Southeast Asia?',
    a: '5 to 10 business days, starting from 8 USD.',
  },
  {
    q: 'How long does shipping take to the rest of the world?',
    a: '10 to 20 business days, starting from 15 USD.',
  },
  {
    q: 'Are duties and taxes included?',
    a: 'No. Duties and taxes are the responsibility of the recipient and afterparty is not liable for customs delays.',
  },
  {
    q: 'What is your return policy?',
    a: "We don't offer refunds or exchanges once an order has shipped. If your order has not shipped yet, contact us as soon as possible to cancel.",
  },
  {
    q: 'How do I contact afterparty?',
    a: 'Email minh@afterparty.space (response within 48 hours) or DM @afterparty.space on Instagram.',
  },
];

export const meta = () => {
  const tags: any[] = seoTags({
    title: 'Support and FAQ, afterparty',
    description:
      'Shipping, returns, and order help for afterparty, streetwear from Ho Chi Minh City, Vietnam. Email minh@afterparty.space.',
    url: '/pages/support',
  });
  tags.push({
    'script:ld+json': {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: SUPPORT_FAQS.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: {'@type': 'Answer', text: f.a},
      })),
    },
  });
  return tags;
};

function Section({title, children}: {title: string; children: React.ReactNode}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="support-section">
      <button className="support-section-toggle" onClick={() => setOpen((v) => !v)}>
        <span>{title}</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s'}}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && <div className="support-section-body">{children}</div>}
    </div>
  );
}

export default function SupportPage() {
  return (
    <div className="support-layout">
      <div className="support-left">
        <h1 className="support-heading">Support</h1>

        <div className="support-section-block">
          <div className="support-section-label">Contact</div>
          <div className="support-contact-block">
            <div className="support-contact-row">
              <span className="support-contact-key">Email</span>
              <a href="mailto:minh@afterparty.space" className="support-link">minh@afterparty.space</a>
            </div>
            <div className="support-contact-row">
              <span className="support-contact-key">Response</span>
              <span>Within 48 hours</span>
            </div>
            <div className="support-contact-row">
              <span className="support-contact-key">Instagram</span>
              <a href="https://www.instagram.com/afterparty.space/" target="_blank" rel="noopener noreferrer" className="support-link">@afterparty.space</a>
            </div>
          </div>
        </div>
      </div>

      <div className="support-content">

        {/* ── Orders ── */}
        <Section title="Orders">
          <div className="support-faq-item">
            <p className="support-faq-q">How do I track my order?</p>
            <p className="support-faq-a">Once your order ships you'll receive a confirmation email with a tracking link. Allow 24–48 hours for tracking to update.</p>
          </div>
          <div className="support-faq-item">
            <p className="support-faq-q">Can I change or cancel my order?</p>
            <p className="support-faq-a">Orders can be amended within 2 hours of being placed. After that, they move into fulfilment and can no longer be changed.</p>
          </div>
          <div className="support-faq-item">
            <p className="support-faq-q">My item arrived damaged — what do I do?</p>
            <p className="support-faq-a">Email us with your order number and photos of the damage. We'll sort it out immediately.</p>
          </div>
        </Section>

        {/* ── Shipping ── */}
        <Section title="Shipping">
          <p className="support-body-text support-body-text--no-mb">All orders are packed by hand in Ho Chi Minh City and dispatched within 1–3 business days. You'll receive tracking as soon as your parcel is on its way.</p>

          <div className="support-faq-item">
            <p className="support-faq-q">Southeast Asia</p>
            <p className="support-faq-a">5–10 business days · from $8 USD</p>
          </div>
          <div className="support-faq-item">
            <p className="support-faq-q">Rest of World</p>
            <p className="support-faq-a">10–20 business days · from $15 USD</p>
          </div>
          <div className="support-faq-item">
            <p className="support-faq-q">Duties &amp; taxes</p>
            <p className="support-faq-a">Responsibility of the recipient. We are not liable for customs delays.</p>
          </div>
        </Section>

        {/* ── Returns & Exchanges ── */}
        <Section title="Returns & Exchanges">
          <p className="support-body-text support-body-text--no-mb">Please make sure you're happy with your order before purchasing! Once your order ships, we're unable to offer refunds or exchanges. If it hasn't shipped yet, message us as soon as possible and we'll take care of the cancellation and refund for you.</p>
          <div className="support-faq-item">
            <p className="support-faq-q">Damaged or incorrect orders</p>
            <p className="support-faq-a">If your order shows up messed up or we sent the wrong thing, email minh@afterparty.space with your order number and some clear photos and we'll sort it out.</p>
          </div>
          <div className="support-faq-item">
            <p className="support-faq-q">Cancellations</p>
            <p className="support-faq-a">If your order hasn't shipped yet, reach out to us as soon as possible and we'll get it cancelled and refunded. Once it's on its way, we're unable to make any changes!</p>
          </div>
        </Section>

      </div>
    </div>
  );
}
