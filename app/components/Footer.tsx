import {Link, useFetcher} from 'react-router';

export function Footer() {
  const fetcher = useFetcher<{ok?: boolean; error?: string}>();
  const submitted = fetcher.data?.ok === true;
  const error = fetcher.data?.error;
  const submitting = fetcher.state !== 'idle';

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="footer-row">
          {/* Newsletter */}
          <div className="footer-newsletter">
            {submitted ? (
              <p className="footer-newsletter-thanks">You're on the list.</p>
            ) : (
              <>
                <p className="footer-newsletter-label">Join our newsletter for releases and updates</p>
                <fetcher.Form method="post" action="/newsletter" className="footer-newsletter-form">
                  <input
                    name="email"
                    type="email"
                    placeholder="E-MAIL"
                    required
                    disabled={submitting}
                    className="footer-newsletter-input"
                  />
                  <button type="submit" disabled={submitting} className="footer-newsletter-btn" aria-label="Subscribe">
                    <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 7h12M8 2l5 5-5 5" />
                    </svg>
                  </button>
                </fetcher.Form>
                {error && <p className="footer-newsletter-thanks" role="alert">{error}</p>}
              </>
            )}
          </div>

          {/* Links + Legal */}
          <div className="footer-right">
            <nav className="footer-links-row">
              <Link to="/pages/support" className="footer-link">FAQ</Link>
              <a href="https://www.instagram.com/afterparty.space/" target="_blank" rel="noopener noreferrer" className="footer-link">Instagram</a>
              <a href="https://www.facebook.com/afterparty.space/" target="_blank" rel="noopener noreferrer" className="footer-link">Facebook</a>
            </nav>
            <div className="footer-legal-bar">
              <Link to="/policies/terms-of-service" className="footer-legal-link">Terms of Service</Link>
              <Link to="/policies/privacy-policy" className="footer-legal-link">Privacy Policy</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
