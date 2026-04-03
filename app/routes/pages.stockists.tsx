import type {Route} from './+types/pages.stockists';

export const meta: Route.MetaFunction = () => {
  return [{title: 'afterparty | Locations'}];
};

const STOCKISTS = [
  {
    city: 'Ho Chi Minh City, Vietnam',
    stores: [
      {name: 'Rue Miche Boutique'},
      {name: '11 Garmentory'},
      {name: 'Objoff'},
      {name: 'Nay Mai'},
    ],
  },
  {
    city: 'Hanoi, Vietnam',
    stores: [
      {name: 'The Raw Compound'},
    ],
  },
  {
    city: 'Malaysia',
    stores: [
      {name: '3rd Space'},
      {name: 'Snub'},
    ],
  },
];

export default function LocationsPage() {
  return (
    <div className="locations-page">
      <h1 className="locations-heading">Locations</h1>

      <div className="locations-layout">
        <div className="locations-left">
          <div className="locations-section-label">Private Showroom</div>
          <div className="locations-showroom">
            <div className="locations-showroom-name">afterparty</div>
            <div className="locations-showroom-detail">District 1, Ho Chi Minh City, Vietnam</div>
            <div className="locations-showroom-note">
              DM @afterparty.space on Instagram to book
            </div>
            <a
              href="https://ig.me/m/afterparty.space"
              target="_blank"
              rel="noopener noreferrer"
              className="locations-showroom-cta"
            >
              Book an Appointment &rarr;
            </a>
          </div>
        </div>

        <div className="locations-right">
          <div className="locations-section-label">Stockists</div>
          <div className="locations-stockists-grid">
            {STOCKISTS.map((location) => (
              <div key={location.city} className="locations-city-block">
                <div className="locations-city">{location.city}</div>
                <div className="locations-stores">
                  {location.stores.map((store) => (
                    <span key={store.name} className="locations-store-name">
                      {store.name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
