import {Link} from 'react-router';
import {useState} from 'react';

export function Footer() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (email) setSubmitted(true);
  }

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">

        {/* Newsletter */}
        <div className="footer-newsletter">
          {submitted ? (
            <p className="footer-newsletter-thanks">You're on the list.</p>
          ) : (
            <>
              <p className="footer-newsletter-label">Join our newsletter for releases and updates</p>
              <form className="footer-newsletter-form" onSubmit={handleSubscribe}>
                <input
                  type="email"
                  placeholder="E-MAIL"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="footer-newsletter-input"
                />
                <button type="submit" className="footer-newsletter-btn" aria-label="Subscribe">
                  <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 7h12M8 2l5 5-5 5" />
                  </svg>
                </button>
              </form>
            </>
          )}
        </div>

        {/* Bottom: links */}
        <div className="footer-bottom">
          <nav className="footer-links-row">
            <Link to="/pages/support" className="footer-link">FAQ</Link>
            <Link to="/pages/support" className="footer-link">Shipping</Link>
            <a href="https://www.instagram.com/afterparty.space/" target="_blank" rel="noopener noreferrer" className="footer-link">Instagram</a>
            <a href="https://www.facebook.com/afterparty.space/" target="_blank" rel="noopener noreferrer" className="footer-link">Facebook</a>
          </nav>
        </div>

        {/* Legal */}
        <div className="footer-legal-bar">
          <Link to="/policies/terms-of-service" className="footer-legal-link">Terms of Service</Link>
          <Link to="/policies/privacy-policy" className="footer-legal-link">Privacy Policy</Link>
        </div>

      </div>
    </footer>
  );
}
