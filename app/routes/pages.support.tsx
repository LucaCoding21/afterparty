import {useState} from 'react';
import {Link} from 'react-router';
import {seoTags} from '~/lib/seo';

export const meta = () => {
  return seoTags({
    title: 'Support and FAQ, afterparty',
    description:
      'Shipping, returns, and order help for afterparty, streetwear from Ho Chi Minh City, Vietnam. Email minh@afterparty.space.',
    url: '/pages/support',
  });
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
            <p className="support-faq-q">When is my order confirmed?</p>
            <p className="support-faq-a">Placing an order is an offer to purchase. The order is accepted once payment has been processed and a confirmation email is issued.</p>
          </div>
          <div className="support-faq-item">
            <p className="support-faq-q">Can afterparty cancel or reject my order?</p>
            <p className="support-faq-a">Yes. We may decline, cancel, or limit any order at our discretion, including for suspected resale or fraudulent activity, and to correct pricing or stock errors.</p>
          </div>
          <div className="support-faq-item">
            <p className="support-faq-q">Are taxes and duties included in the price?</p>
            <p className="support-faq-a">No. Prices do not include taxes, shipping, duties, or import fees. These charges are the responsibility of the customer.</p>
          </div>
          <div className="support-faq-item">
            <p className="support-faq-q">Are sales final?</p>
            <p className="support-faq-a">All sales are final except as expressly stated in our Refund Policy.</p>
          </div>
          <p className="support-body-text support-body-text--no-mb">For full terms, see our <Link to="/policies/terms-of-service" className="support-link">Terms of Service</Link>.</p>
        </Section>

        {/* ── Shipping ── */}
        <Section title="Shipping">
          <div className="support-faq-item">
            <p className="support-faq-q">Are delivery times guaranteed?</p>
            <p className="support-faq-a">No. Delivery times are estimates only. afterparty is not responsible for delays caused by carriers, customs, or events outside our control.</p>
          </div>
          <div className="support-faq-item">
            <p className="support-faq-q">Who is responsible for the parcel during transit?</p>
            <p className="support-faq-a">Risk of loss transfers to the customer once the order is handed to the carrier.</p>
          </div>
          <div className="support-faq-item">
            <p className="support-faq-q">Are duties and taxes included?</p>
            <p className="support-faq-a">No. Duties, taxes, and import fees are the responsibility of the recipient.</p>
          </div>
          <p className="support-body-text support-body-text--no-mb">For full terms, see our <Link to="/policies/terms-of-service" className="support-link">Terms of Service</Link>.</p>
        </Section>

        {/* ── Returns & Exchanges ── */}
        <Section title="Returns & Exchanges">
          <p className="support-body-text support-body-text--no-mb">All sales are final except as expressly stated in our Refund Policy.</p>
          <div className="support-faq-item">
            <p className="support-faq-q">Can afterparty cancel my order?</p>
            <p className="support-faq-a">Yes. afterparty may cancel any order at its discretion, including for suspected resale or fraudulent activity, and to correct pricing or stock errors.</p>
          </div>
          <div className="support-faq-item">
            <p className="support-faq-q">What if there is a pricing or product error?</p>
            <p className="support-faq-a">We reserve the right to correct errors, update information, or cancel orders at any time without notice.</p>
          </div>
          <p className="support-body-text support-body-text--no-mb">For full details, see our <Link to="/policies/refund-policy" className="support-link">Refund Policy</Link>.</p>
        </Section>

      </div>
    </div>
  );
}
