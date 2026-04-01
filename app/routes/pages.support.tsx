import {useState} from 'react';

export const meta = () => {
  return [{title: 'afterparty | Support'}];
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
              <a href="mailto:hello@afterparty.com" className="support-link">hello@afterparty.com</a>
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
          <p className="support-body-text">All orders are packed by hand in Ho Chi Minh City and dispatched within 1–3 business days. You'll receive tracking as soon as your parcel is on its way.</p>

          <div className="support-shipping-group">
            <div className="support-table">
              <div className="support-table-row">
                <span className="support-label">Southeast Asia</span>
                <span>5–10 business days &nbsp;·&nbsp; from $8 USD</span>
              </div>
              <div className="support-table-row">
                <span className="support-label">Rest of World</span>
                <span>10–20 business days &nbsp;·&nbsp; from $15 USD</span>
              </div>
              <div className="support-table-row">
                <span className="support-label">Duties & taxes</span>
                <span>Responsibility of the recipient. We are not liable for customs delays.</span>
              </div>
            </div>
          </div>
        </Section>

        {/* ── Returns & Exchanges ── */}
        <Section title="Returns & Exchanges">
          <p className="support-body-text">We accept returns and exchanges on unworn, unwashed, unaltered items with original tags attached within <strong>14 days</strong> of delivery. Sale items and limited drops are final sale.</p>
          <div className="support-faq-item">
            <p className="support-faq-q">Returns</p>
            <p className="support-faq-a">Email hello@afterparty.com with your order number and reason. We'll send you a return authorisation and instructions. Return shipping is the customer's responsibility unless the item is defective.</p>
          </div>
          <div className="support-faq-item">
            <p className="support-faq-q">Exchanges</p>
            <p className="support-faq-a">Exchanges for sizing are available on full-price items, subject to stock. If your size is unavailable, we'll issue store credit. Email us with your order number and the size you need.</p>
          </div>
        </Section>

        {/* ── Warranty ── */}
        <Section title="Warranty">
          <p className="support-body-text">All garments are inspected before dispatch. Normal wear and tear, improper washing, and accidental damage are not covered. Our warranty applies only to the original purchaser and is non-transferable.</p>
          <div className="support-faq-item">
            <p className="support-faq-q">Defective items</p>
            <p className="support-faq-a">If you receive a defective item or experience a manufacturing fault within <strong>30 days</strong> of purchase, we will replace or refund it in full at no cost to you. Faults reported after 30 days are assessed case by case.</p>
          </div>
          <div className="support-faq-item">
            <p className="support-faq-q">How to claim</p>
            <p className="support-faq-a">Email hello@afterparty.com with your order number, a description of the fault, and clear photos.</p>
          </div>
        </Section>

      </div>
    </div>
  );
}
