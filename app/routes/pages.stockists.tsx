import type {Route} from './+types/pages.stockists';

export const meta: Route.MetaFunction = () => {
  return [{title: 'afterparty | Locations'}];
};

const LOCATIONS = [
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
      <div className="locations-page-header">
        <h1 className="locations-heading">Locations</h1>
      </div>

      <div className="locations-body">
        <div className="locations-flagship">
          <div className="locations-flagship-label">Private Showroom</div>
          <h2 className="locations-flagship-name">afterparty</h2>
          <div className="locations-flagship-address">District 1, Ho Chi Minh City</div>
          <a
            href="https://ig.me/m/afterparty.space"
            target="_blank"
            rel="noopener noreferrer"
            className="locations-flagship-btn"
          >
            Book an Appointment &rarr;
          </a>
        </div>

        <div className="locations-stockists">
          <div className="locations-stockists-label">Stockists</div>
          <div className="locations-grid">
            {LOCATIONS.map((location) => (
              <div key={location.city} className="locations-city-block">
                <h2 className="locations-city">{location.city}</h2>
                {location.stores.map((store) => (
                  <div key={store.name} className="locations-store-name">
                    {store.name}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
