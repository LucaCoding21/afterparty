import type {Route} from './+types/pages.about';

export const meta: Route.MetaFunction = () => {
  return [{title: 'Afterparty | About Us'}];
};

export default function AboutPage() {
  return (
    <div className="about-layout">
      <div className="about-left">
        <div className="about-title-block">
          <div>
            <h1 className="about-heading">About Us</h1>
            <p className="about-description">A brand built after hours, for the ones who stay.</p>
          </div>
          <div className="about-body">
            <p>Afterparty started in a small room in Ho Chi Minh City with one idea — make clothes that feel like the moment after the show ends and everyone finally relaxes.</p>
            <p>We design for the in-between. The late nights, the slow mornings, the fits you reach for when you actually want to feel something.</p>
            <p>Every piece is made in limited runs, close to home, with people we trust. No filler, no fuss — just the stuff that lasts.</p>
          </div>
        </div>
      </div>

      <div className="about-right">
        <img
          src="/location-pic.PNG"
          alt="Afterparty"
          className="about-photo"
        />
      </div>
    </div>
  );
}
