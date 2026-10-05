import {redirect} from 'react-router';

// The Pants collection was renamed to Bottoms. Keep old links and search
// results working.
export function loader() {
  return redirect('/collections/bottoms', 301);
}
