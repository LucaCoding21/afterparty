import type {Route} from './+types/pages.about';

export const meta: Route.MetaFunction = () => {
  return [{title: 'Afterparty | About Us'}];
};

export default function AboutPage() {
  return (
    <div className="about">
      <section className="about-intro">
        <div className="about-intro-text">
          <h1 className="about-heading">The Story</h1>
          <p className="about-lead">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
            tempor incididunt ut labore et dolore magna aliqua.
          </p>
        </div>
        <div className="about-intro-img">
          <img src="/hero.gif" alt="Afterparty DJ Cat" className="about-img" />
        </div>
      </section>

      <section className="about-values">
        <div className="about-value">
          <span className="about-value-number">01</span>
          <h3 className="about-value-title">The Clothes</h3>
          <p className="about-value-text">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut enim ad
            minim veniam, quis nostrud exercitation ullamco laboris.
          </p>
        </div>
        <div className="about-value">
          <span className="about-value-number">02</span>
          <h3 className="about-value-title">The People</h3>
          <p className="about-value-text">
            Duis aute irure dolor in reprehenderit in voluptate velit esse cillum
            dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat.
          </p>
        </div>
        <div className="about-value">
          <span className="about-value-number">03</span>
          <h3 className="about-value-title">The Space</h3>
          <p className="about-value-text">
            Sed ut perspiciatis unde omnis iste natus error sit voluptatem
            accusantium doloremque laudantium, totam rem aperiam.
          </p>
        </div>
      </section>

      <section className="about-cta">
        <p className="about-cta-text">Come Hang Out</p>
        <a href="/pages/stockists" className="about-cta-btn">Visit Us &rarr;</a>
      </section>
    </div>
  );
}
