import type {Route} from './+types/pages.about';

export const meta: Route.MetaFunction = () => {
  return [{title: 'afterparty | About Us'}];
};

export default function AboutPage() {
  return (
    <div className="about-layout">
      <div className="about-left">
        <div className="about-title-block">
          <h1 className="about-heading">About Us</h1>
          <div className="about-section">
            <div className="about-body">
              <p>Established in early 2025, afterparty is an independent label based in Saigon, inspired by the energy of nights out, shared stories, music, and the moments that linger after.</p>
              <p>Shaped by the people, places, and creative communities around us, afterparty explores self-expression through clothing and the experiences that bring people together.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="about-right">
        <img
          src="/AboutUs-Afterparty.jpg"
          alt="afterparty"
          className="about-photo"
        />
      </div>
    </div>
  );
}
