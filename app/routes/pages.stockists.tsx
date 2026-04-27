import type {Route} from './+types/pages.stockists';

export const meta: Route.MetaFunction = () => {
  return [{title: 'afterparty | Locations'}];
};

const STOCKISTS = [
  {
    city: 'Ho Chi Minh City, Vietnam',
    stores: [
      {name: 'Rue Miche Boutique', url: 'https://www.google.com/maps/search/?api=1&query=Rue+Miche+Boutique%2C+9B+Ph%C3%B9ng+Kh%E1%BA%AFc+Khoan%2C+%C4%90a+Kao%2C+S%C3%A0i+G%C3%B2n%2C+H%E1%BB%93+Ch%C3%AD+Minh+700000%2C+Vietnam'},
      {name: '11 Garmentory', url: 'https://www.google.com/maps/search/?api=1&query=11%20Garmentory%2C%20117B%20Nguy%E1%BB%85n%20%C4%90%C3%ACnh%20Ch%C3%ADnh%2C%20Ph%C6%B0%E1%BB%9Dng%2015%2C%20C%E1%BA%A7u%20Ki%E1%BB%87u%2C%20H%E1%BB%93%20Ch%C3%AD%20Minh%2070000%2C%20Vietnam'},
      {name: 'Objoff', url: 'https://www.google.com/maps/search/?api=1&query=Objoff%2C%2073%20%C4%90.%20S%E1%BB%91%204%20L%C3%A0ng%20B%C3%A1o%20Ch%C3%AD%2C%20Th%E1%BA%A3o%20%C4%90i%E1%BB%81n%2C%20An%20Kh%C3%A1nh%2C%20H%E1%BB%93%20Ch%C3%AD%20Minh%2070000%2C%20Vietnam'},
      {name: 'Nay Mai', url: 'https://www.google.com/maps/search/?api=1&query=Nay%20Mai%2C%20393/7%20Hai%20B%C3%A0%20Tr%C6%B0ng%2C%20Xu%C3%A2n%20H%C3%B2a%2C%20H%E1%BB%93%20Ch%C3%AD%20Minh%2C%20Vietnam'},
    ],
  },
  {
    city: 'Hanoi, Vietnam',
    stores: [
      {name: 'The Raw Compound', url: 'https://www.google.com/maps/search/?api=1&query=The%20Raw%20Compound%2C%20180%20%C4%90.%20La%20Th%C3%A0nh%2C%20Ch%E1%BB%A3%20D%E1%BB%ABa%2C%20%C3%94%20Ch%E1%BB%A3%20D%E1%BB%ABa%2C%20H%C3%A0%20N%E1%BB%99i%2C%20Vietnam'},
    ],
  },
  {
    city: 'Malaysia',
    stores: [
      {name: '3rd Space', url: 'https://www.google.com/maps/search/?api=1&query=3rd%20Space%2C%2013-1%2C%20Jalan%2052/10%2C%20Pj%20New%20Town%2C%2046200%20Petaling%20Jaya%2C%20Selangor%2C%20Malaysia'},
      {name: 'Snub', url: 'https://www.google.com/maps/search/?api=1&query=Snub%2C%20376%2C%20Beach%20St%2C%20Georgetown%2C%2010300%20George%20Town%2C%20Penang%2C%20Malaysia'},
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
          <div className="locations-section-label">
            Stockists
            {/* Inline SVG instead of `↗` (U+2197) because iOS Safari renders
                that Unicode arrow as an emoji. */}
            <svg
              className="locations-section-arrow"
              aria-hidden="true"
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#999"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="7" y1="17" x2="17" y2="7" />
              <polyline points="9 7 17 7 17 15" />
            </svg>
          </div>
          <div className="locations-stockists-grid">
            {STOCKISTS.map((location) => (
              <div key={location.city} className="locations-city-block">
                <div className="locations-city">{location.city}</div>
                <div className="locations-stores">
                  {location.stores.map((store) => (
                    <a
                      key={store.name}
                      href={store.url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="locations-store-name"
                    >
                      {store.name}
                    </a>
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
