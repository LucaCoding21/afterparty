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

        {/* Top: logo + newsletter */}
        <div className="footer-top">
          <Link to="/" className="footer-logo-link">
            <img src="/logo.png" alt="Afterparty" className="footer-logo-img" />
          </Link>

          <div className="footer-newsletter">
            {submitted ? (
              <p className="footer-newsletter-thanks">You're on the list.</p>
            ) : (
              <>
                <p className="footer-newsletter-label">Join the list</p>
                <form className="footer-newsletter-form" onSubmit={handleSubscribe}>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="footer-newsletter-input"
                  />
                  <button type="submit" className="footer-newsletter-btn">
                    Subscribe
                  </button>
                </form>
              </>
            )}
          </div>
        </div>

        {/* Divider */}
        <hr className="footer-divider" />

        {/* Bottom: links left, copyright right */}
        <div className="footer-bottom">
          <nav className="footer-links-row">
            <Link to="/pages/support" className="footer-link">FAQ</Link>
            <Link to="/pages/support" className="footer-link">Shipping</Link>
            <a href="https://www.instagram.com/afterparty.space/" target="_blank" rel="noopener noreferrer" className="footer-link">Instagram</a>
            <a href="https://www.facebook.com/afterparty.space/" target="_blank" rel="noopener noreferrer" className="footer-link">Facebook</a>
          </nav>
          <p className="footer-legal">&copy; {new Date().getFullYear()} Afterparty</p>
        </div>

        {/* Legal */}
        <div className="footer-legal-bar">
          <span className="footer-legal-label">Legal</span>
          <Link to="/policies/terms-of-service" className="footer-legal-link">Terms of Service</Link>
          <Link to="/policies/privacy-policy" className="footer-legal-link">Privacy Policy</Link>
        </div>

      </div>
    </footer>
  );
}
