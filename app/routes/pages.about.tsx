import type {Route} from './+types/pages.about';

export const meta: Route.MetaFunction = () => {
  return [{title: 'afterparty | About Us'}];
};

export default function AboutPage() {
  return (
    <div className="about-layout">
      <div className="about-left">
        <div className="about-title-block">
          <h1 className="about-heading">About</h1>
          <div className="about-section">
            <div className="about-section-label">Brand Story</div>
            <div className="about-body">
              <p>Established in early 2025 and based in Saigon, afterparty has built a following by crafting pieces that speak to the rhythm of nights out, shared stories and music, and the mood that lingers after.</p>
              <p>Designed for those who identify with Vietnam's evolving subcultural scenes, afterparty draws from underground music, art collectives, and creative communities that value authenticity and individuality.</p>
              <p>For them, these spaces are more than social outlets; they are platforms for self-expression and a temporary escape from the boundaries of daily life.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="about-right">
        <img
          src="/location-pic.PNG"
          alt="afterparty"
          className="about-photo"
        />
      </div>
    </div>
  );
}
