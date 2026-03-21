import type {Route} from './+types/pages.stockists';

export const meta: Route.MetaFunction = () => {
  return [{title: 'Afterparty | Locations'}];
};

const LOCATIONS = [
  {
    city: 'Ho Chi Minh City, Vietnam',
    stores: [
      {
        name: 'Rue Miche Boutique',
        address: '98 Phùng Khắc Khoan, Ho Chi Minh City, Vietnam',
        hours: '10 AM – 6 PM',
        days: 'Monday – Sunday',
        query: 'Rue+Miche+Boutique+98+Phung+Khac+Khoan+Ho+Chi+Minh+City',
      },
      {
        name: '11 Garmentory',
        address: '98 Phùng Khắc Khoan, Ho Chi Minh City, Vietnam',
        hours: '10 AM – 6 PM',
        days: 'Monday – Sunday',
        query: '11+Garmentory+98+Phung+Khac+Khoan+Ho+Chi+Minh+City',
      },
      {
        name: 'Objoff',
        address: '98 Phùng Khắc Khoan, Ho Chi Minh City, Vietnam',
        hours: '10 AM – 6 PM',
        days: 'Monday – Sunday',
        query: 'Objoff+98+Phung+Khac+Khoan+Ho+Chi+Minh+City',
      },
      {
        name: 'Nay Mai',
        address: '98 Phùng Khắc Khoan, Ho Chi Minh City, Vietnam',
        hours: '10 AM – 6 PM',
        days: 'Monday – Sunday',
        query: 'Nay+Mai+98+Phung+Khac+Khoan+Ho+Chi+Minh+City',
      },
    ],
  },
  {
    city: 'Hanoi, Vietnam',
    stores: [
      {
        name: 'The Raw Compound',
        address: '98 Phùng Khắc Khoan, Ho Chi Minh City, Vietnam',
        hours: '10 AM – 6 PM',
        days: 'Monday – Sunday',
        query: 'The+Raw+Compound+Hanoi+Vietnam',
      },
    ],
  },
  {
    city: 'Malaysia',
    stores: [
      {
        name: '3rd Space',
        address: '98 Phùng Khắc Khoan, Ho Chi Minh City, Vietnam',
        hours: '10 AM – 6 PM',
        days: 'Monday – Sunday',
        query: '3rd+Space+Malaysia',
      },
      {
        name: 'Snub',
        address: '98 Phùng Khắc Khoan, Ho Chi Minh City, Vietnam',
        hours: '10 AM – 6 PM',
        days: 'Monday – Sunday',
        query: 'Snub+Malaysia',
      },
    ],
  },
];

export default function LocationsPage() {
  return (
    <div className="locations">
      <h1 className="locations-title">Locations</h1>
      <p className="locations-subtitle">
        Find Us In The Wild
      </p>

      <div className="locations-flagship">
        <div className="locations-flagship-label">Our Space</div>
        <h2 className="locations-flagship-name">Afterparty HQ</h2>
        <div className="locations-flagship-address">98 Phùng Khắc Khoan, Ho Chi Minh City, Vietnam</div>
        <div className="locations-flagship-meta">Monday – Sunday &nbsp;·&nbsp; 10 AM – 6 PM</div>
        <a
          href="https://www.google.com/maps/search/?api=1&query=98+Phung+Khac+Khoan+Ho+Chi+Minh+City"
          target="_blank"
          rel="noopener noreferrer"
          className="locations-flagship-btn"
        >
          Book a Visit &rarr;
        </a>
      </div>

      <div className="locations-grid">
        {LOCATIONS.map((location) => (
          <div key={location.city} className="locations-city-block">
            <h2 className="locations-city">{location.city}</h2>
            {location.stores.map((store) => (
              <div key={store.name} className="locations-store">
                <div className="locations-store-name">{store.name}</div>
                <div className="locations-store-address">{store.address}</div>
                <div className="locations-store-meta">{store.days} &nbsp;·&nbsp; {store.hours}</div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${store.query}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="locations-directions"
                >
                  See Location &rarr;
                </a>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
