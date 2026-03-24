export type ColorVariant = {
  name: string;        // e.g., "Navy Blue"
  key: string;         // URL-safe color key, e.g., "navy-blue"
  image: string;       // flat lay product image
  modelImage?: string; // model wearing the product (used as hero on detail page)
};

export type Category = 'tops-shirts' | 'outerwear' | 'pants' | 'accessories';

export type StaticProduct = {
  handle: string;
  title: string;
  price: string;
  description: string;
  category: Category;
  colors: ColorVariant[];
  sizeGuide?: string; // path to size guide image, e.g. '/products/size-guides/tee-size-guide.svg'
  sizePhoto?: string; // path to garment illustration from size chart
  sizePhotoMaxHeight?: number; // px height to crop illustration (hides data table portion)
};

export type CollectionItem = {
  id: string;
  parentHandle: string;
  colorKey?: string;
  displayTitle: string;
  image: string;
  price: string;
};

export const STATIC_PRODUCTS: StaticProduct[] = [
  {
    handle: 'bubble-letter-ringer-tee',
    title: 'Bubble Letter Ringer Tee',
    price: '$48',
    description: 'Description coming soon.',
    category: 'tops-shirts',
    sizeGuide: '/products/size-guides/bubble-letter-ringer-tee.svg',
    sizePhoto: '/products/measurements/Ringer%20Short%20Sleeve%20Tee%20Chart%201.png',
    colors: [
      {
        name: 'Navy Blue',
        key: 'navy-blue',
        image: '/products/bubble-letter-ringer-tee-navyblue.jpg',
        modelImage: '/product-details-models/bubble-letter-ringer-tee-navy-model.jpg',
      },
      {
        name: 'Orange',
        key: 'orange',
        image: '/products/bubble-letter-ringer-tee-orange.jpg',
        modelImage: '/product-details-models/bubble-letter-ringer-tee-orange-model.jpg',
      },
      {
        name: 'White',
        key: 'white',
        image: '/products/bubble-letter-ringer-tee-white.jpg',
        modelImage: '/product-details-models/bubble-letter-ringer-tee-white-model.jpg',
      },
    ],
  },
  {
    handle: 'leopard-flared-pants',
    title: 'Leopard Flared Pants',
    price: '$89',
    description: 'Description coming soon.',
    category: 'pants',
    sizeGuide: '/products/size-guides/leopard-flared-pants.svg',
    sizePhoto: '/products/measurements/Leopard%20Flared%20Pants%20Chart%201.png',
    colors: [
      {
        name: 'Pink',
        key: 'pink',
        image: '/products/Leopard-Flared-Pants-Pink.jpg',
      },
      {
        name: 'Blue',
        key: 'blue',
        image: '/products/Leopard-Flared-Pants-blue-.jpg',
      },
    ],
  },
  {
    handle: 'leopard-jacket',
    title: 'Leopard Jacket',
    price: '$125',
    description: 'Description coming soon.',
    category: 'outerwear',
    sizeGuide: '/products/size-guides/leopard-jacket.svg',
    sizePhoto: '/products/measurements/Leopard%20Work%20Jacket%20Chart%201.png',
    colors: [
      {
        name: 'Blue',
        key: 'blue',
        image: '/products/Leopard-Jacket-blue.png',
      },
      {
        name: 'Pink',
        key: 'pink',
        image: '/products/Leopard-Jacket-pink.png',
      },
    ],
  },
  {
    handle: 'leopard-shorts',
    title: 'Leopard Shorts',
    price: '$68',
    description: 'Description coming soon.',
    category: 'pants',
    sizeGuide: '/products/size-guides/leopard-shorts.svg',
    sizePhoto: '/products/measurements/Leopard%20Short%20Pants%20Charts%201.png',
    colors: [
      {
        name: 'Blue',
        key: 'blue',
        image: '/products/Leopard-Shorts-blue.png',
      },
      {
        name: 'Pink',
        key: 'pink',
        image: '/products/Leopard-Shorts-pink.png',
      },
    ],
  },
  {
    handle: 'nhim-long-sleeve-tees',
    title: 'Nhím Long Sleeve Tees',
    price: '$58',
    description: 'Description coming soon.',
    category: 'tops-shirts',
    sizeGuide: '/products/size-guides/nhim-long-sleeve-tees.svg',
    sizePhoto: '/products/measurements/2026%20Nhi%CC%81m%20Long%20Sleeve%20Tee%20Chart%201.png',
    colors: [
      {
        name: 'White',
        key: 'white',
        image: '/products/Nhi%CC%81m-Long-Sleeve%20Tees%20-white.jpg',
      },
      {
        name: 'Green',
        key: 'green',
        image: '/products/Nhi%CC%81m-Long-Sleeve%20Tees-green.jpg',
      },
      {
        name: 'Red',
        key: 'red',
        image: '/products/Nhi%CC%81m-Long-Sleeve%20Tees-red.jpg',
      },
    ],
  },
  {
    handle: 'dog-failure-tee',
    title: 'Dog Failure Tee',
    price: '$42',
    description: 'Description coming soon.',
    category: 'tops-shirts',
    sizeGuide: '/products/size-guides/dog-failure-tee.svg',
    colors: [
      {
        name: 'Grey',
        key: 'grey',
        image: '/products/dog-failure-grey.jpg',
      },
      {
        name: 'Off White',
        key: 'off-white',
        image: '/products/dog-failure-offwhite.jpg',
      },
    ],
  },
  {
    handle: 'dog-screw-hoodie',
    title: 'Dog Screw Hoodie',
    price: '$98',
    description: 'Description coming soon.',
    category: 'outerwear',
    sizeGuide: '/products/size-guides/dog-screw-hoodie.svg',
    sizePhoto: '/products/measurements/Hoodie%20Size%20Chart%201.png',
    colors: [
      {
        name: 'Black',
        key: 'black',
        image: '/products/dog-screw-hoodie-black.jpg',
      },
      {
        name: 'Grey',
        key: 'grey',
        image: '/products/dog-screw-hoodie-grey.jpg',
      },
    ],
  },
  {
    handle: 'dragon-jersey',
    title: 'Dragon Jersey',
    price: '$78',
    description: 'Description coming soon.',
    category: 'tops-shirts',
    sizeGuide: '/products/size-guides/dragon-jersey.svg',
    sizePhoto: '/products/measurements/Jersey%20Size%20Chart%201.png',
    colors: [
      {
        name: 'Pink',
        key: 'pink',
        image: '/products/dragon-jersey-pink.jpg',
      },
      {
        name: 'Red',
        key: 'red',
        image: '/products/dragon-jersey-red.jpg',
      },
      {
        name: 'White',
        key: 'white',
        image: '/products/dragon-jersey-white.jpg',
      },
    ],
  },
  {
    handle: 'hater-baby-tee',
    title: 'Hater Baby Tee',
    price: '$45',
    description: 'Description coming soon.',
    category: 'tops-shirts',
    sizeGuide: '/products/size-guides/hater-baby-tee.svg',
    sizePhoto: '/products/measurements/2025%20Hater%20Baby%20Tee%20Size%20Chart%201.png',
    colors: [
      {
        name: 'Baby Pink',
        key: 'baby-pink',
        image: '/products/hater-baby-tee.jpg',
      },
    ],
  },
  {
    handle: 'hater-tee',
    title: 'Hater Tee',
    price: '$45',
    description: 'Description coming soon.',
    category: 'tops-shirts',
    sizeGuide: '/products/size-guides/hater-tee.svg',
    sizePhoto: '/products/measurements/2025%20Hater%20Oversized%20Short%20Sleeve%20Boxy%20Tee%20Chart%201.png',
    colors: [
      {
        name: 'Black',
        key: 'black',
        image: '/products/hater-tee-black.png',
      },
      {
        name: 'Pink',
        key: 'pink',
        image: '/products/hater-tee-pink.jpg',
      },
    ],
  },
  {
    handle: 'horse-trucker-hat',
    title: 'Horse Trucker Hat',
    price: '$38',
    description: 'Description coming soon.',
    category: 'accessories',
    sizeGuide: '/products/size-guides/horse-trucker-hat.svg',
    colors: [
      {
        name: 'Natural',
        key: 'natural',
        image: '/products/horse-trucker-hat.jpg',
      },
    ],
  },
  {
    handle: 'nhim-tees',
    title: 'Nhîm Tees',
    price: '$52',
    description: 'Description coming soon.',
    category: 'tops-shirts',
    sizeGuide: '/products/size-guides/nhim-tees.svg',
    sizePhoto: '/products/measurements/2026%20Nhi%CC%81m%20Short%20Sleeve%20Tee%20Chart%201.png',
    colors: [
      {
        name: 'Black',
        key: 'black',
        image: '/products/nhi%CC%82m-tees-black.jpg',
      },
      {
        name: 'White',
        key: 'white',
        image: '/products/nhi%CC%82m-tees-white.jpg',
      },
    ],
  },
];

export const STATIC_PRODUCTS_MAP: Record<string, StaticProduct> =
  Object.fromEntries(STATIC_PRODUCTS.map((p) => [p.handle, p]));

export function getCollectionItems(category: Category): CollectionItem[] {
  return STATIC_PRODUCTS.filter((p) => p.category === category).flatMap(
    (product) =>
      product.colors.map((color) => ({
        id: `${product.handle}-${color.key}`,
        parentHandle: product.handle,
        colorKey: product.colors.length > 1 ? color.key : undefined,
        displayTitle: product.title,
        image: color.image,
        price: product.price,
      })),
  );
}

// Flat list of collection grid cards — one per color variant
export const COLLECTION_ITEMS: CollectionItem[] = STATIC_PRODUCTS.flatMap(
  (product) =>
    product.colors.map((color) => ({
      id: `${product.handle}-${color.key}`,
      parentHandle: product.handle,
      colorKey: product.colors.length > 1 ? color.key : undefined,
      displayTitle: product.title,
      image: color.image,
      price: product.price,
    })),
);
