import {Link} from 'react-router';
import {getCollectionItems} from '~/lib/staticProducts';

export const meta = () => [{title: 'afterparty | Pants'}];

const items = getCollectionItems('pants');

export default function Pants() {
  return (
    <div className="collection">
      <h1 className="collection-title">Pants</h1>
      <div className="products-grid">
        {items.map((item) => (
          <Link
            key={item.id}
            className="product-item"
            prefetch="intent"
            to={item.colorKey ? `/products/${item.parentHandle}?color=${item.colorKey}` : `/products/${item.parentHandle}`}
            data-handle={item.parentHandle}
          >
            <div className="product-item-img">
              <img src={item.image} alt={item.displayTitle} loading="lazy" />
            </div>
            <h4>{item.displayTitle}</h4>
            <small>{item.price}</small>
          </Link>
        ))}
      </div>
    </div>
  );
}
