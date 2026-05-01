import {useState} from 'react';
import {Link} from 'react-router';
import {seoTags} from '~/lib/seo';

export const meta = () => {
  return seoTags({
    title: 'afterparty | Support',
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
            <p className="support-faq-a">Your order is confirmed once payment is processed and you receive a confirmation email.</p>
          </div>
          <div className="support-faq-item">
            <p className="support-faq-q">Can afterparty cancel or reject my order?</p>
            <p className="support-faq-a">Yes. We may cancel, decline, or limit orders at our discretion, including for suspected resale, fraudulent activity, or pricing and inventory errors.</p>
          </div>
          <div className="support-faq-item">
            <p className="support-faq-q">Are taxes and duties included in the price?</p>
            <p className="support-faq-a">No. Prices do not include shipping, taxes, duties, or import fees. These are the customer’s responsibility.</p>
          </div>
          <div className="support-faq-item">
            <p className="support-faq-q">Are sales final?</p>
            <p className="support-faq-a">All sales are final, except as outlined in our Refund Policy.</p>
          </div>
          <p className="support-body-text support-body-text--no-mb">For full terms, see our <Link to="/policies/terms-of-service" className="support-link">Terms of Service</Link>.</p>
        </Section>

        {/* ── Shipping ── */}
        <Section title="Shipping">
          <div className="support-faq-item">
            <p className="support-faq-q">Are delivery times guaranteed?</p>
            <p className="support-faq-a">No. Delivery times are estimates and may vary. We are not responsible for delays caused by carriers, customs, or other factors outside our control.</p>
          </div>
          <div className="support-faq-item">
            <p className="support-faq-q">Who is responsible for the parcel during transit?</p>
            <p className="support-faq-a">Responsibility transfers to the customer once the order has been handed to the carrier.</p>
          </div>
          <div className="support-faq-item">
            <p className="support-faq-q">Are duties and taxes included?</p>
            <p className="support-faq-a">No. Any applicable duties, taxes, or import fees are the recipient’s responsibility.</p>
          </div>
          <p className="support-body-text support-body-text--no-mb">For full terms, see our <Link to="/policies/terms-of-service" className="support-link">Terms of Service</Link>.</p>
        </Section>

        {/* ── Returns & Exchanges ── */}
        <Section title="Returns & Exchanges">
          <p className="support-body-text support-body-text--no-mb">All sales are final, except as outlined in our Refund Policy.</p>
          <div className="support-faq-item">
            <p className="support-faq-q">How do I report an issue with my order?</p>
            <p className="support-faq-a">Please email <a href="mailto:minh@afterparty.space" className="support-link">minh@afterparty.space</a> within 7 days of receiving your item. Include your order number, along with clear, unedited photos and a video of the issue. We do not accept edited or AI-generated images, and returns sent without prior approval will not be accepted.</p>
          </div>
          <div className="support-faq-item">
            <p className="support-faq-q">What items are eligible for return?</p>
            <p className="support-faq-a">Items are only eligible if they arrive damaged, defective, or incorrect. We do not accept returns for sizing issues, change of mind, or incorrect shipping information.</p>
          </div>
          <div className="support-faq-item">
            <p className="support-faq-q">Do you offer exchanges?</p>
            <p className="support-faq-a">Exchanges are only available for incorrect or defective items. Once approved, we’ll provide a return label and ship the replacement after receiving the original item. We do not offer exchanges for sizing or preference.</p>
          </div>
          <div className="support-faq-item">
            <p className="support-faq-q">When are refunds issued?</p>
            <p className="support-faq-a">Refunds are only issued if your order is canceled before shipment, or if your item arrives damaged, defective, or incorrect and cannot be replaced. Approved refunds are processed to your original payment method within 10 business days. If you haven’t received your refund after 15 business days, please contact <a href="mailto:minh@afterparty.space" className="support-link">minh@afterparty.space</a>.</p>
          </div>
        </Section>

      </div>
    </div>
  );
}
