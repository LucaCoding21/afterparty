import type {Route} from './+types/pages.about';
import {seoTags} from '~/lib/seo';

// Must build the full tag set here, not just a title: in React Router 7 a
// route's meta REPLACES its parent's, so returning [{title}] alone would strip
// root's Open Graph block and leave this page with no share card at all.
export const meta: Route.MetaFunction = () =>
  seoTags({title: 'afterparty | About Us', url: '/pages/about'});

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
