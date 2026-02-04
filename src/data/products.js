/**
 * Products Database
 *
 * Add products here to use them in blog posts with the {{product:slug}} syntax.
 *
 * For images, you can:
 * 1. Use manufacturer press kit images
 * 2. Use stock photos from Unsplash/Pexels
 * 3. Copy the image URL directly from Amazon product page
 * 4. Host images in /public/products/ folder
 *
 * Example Amazon image URL:
 * https://m.media-amazon.com/images/I/[IMAGE_ID]._AC_SL1500_.jpg
 */

export const products = {
  'fifine-k669b': {
    name: 'Fifine K669B USB Microphone',
    price: '~$30',
    badge: 'Budget Pick',
    description: 'Perfect USB condenser mic for beginners. Plug-and-play setup with surprisingly good audio quality for the price.',
    features: [
      'USB plug-and-play (no drivers needed)',
      'Cardioid pickup pattern',
      'Volume knob on mic',
      'Metal construction',
    ],
    image: 'https://m.media-amazon.com/images/I/61pKLvpeGSL._AC_SL1500_.jpg',
    affiliateLink: 'https://amzn.to/4ryPDUb',
  },

  // Add more products as you get affiliate links:

  // 'blue-yeti': {
  //   name: 'Blue Yeti USB Microphone',
  //   price: '~$100',
  //   badge: 'Most Popular',
  //   description: 'The industry standard for content creators. Multiple pickup patterns and exceptional sound quality.',
  //   features: [
  //     'Four pickup patterns',
  //     'Built-in gain control',
  //     'Headphone monitoring',
  //     'Plug and play USB',
  //   ],
  //   image: 'https://m.media-amazon.com/images/I/71+-6SxVKPL._AC_SL1500_.jpg',
  //   affiliateLink: 'https://amzn.to/YOUR_LINK',
  // },

  // 'logitech-c920': {
  //   name: 'Logitech C920 HD Webcam',
  //   price: '~$70',
  //   badge: 'Best Value',
  //   description: 'Still one of the best value webcams. 1080p at 30fps with good low-light performance.',
  //   features: [
  //     '1080p Full HD',
  //     'Dual microphones',
  //     'Autofocus',
  //     'Works with all platforms',
  //   ],
  //   image: 'https://m.media-amazon.com/images/I/71iNwni9TsL._AC_SL1500_.jpg',
  //   affiliateLink: 'https://amzn.to/YOUR_LINK',
  // },

  // 'shure-sm7b': {
  //   name: 'Shure SM7B Microphone',
  //   price: '~$400',
  //   badge: 'Professional',
  //   description: 'The microphone you see in every professional studio. Broadcast-quality audio.',
  //   features: [
  //     'Dynamic cardioid',
  //     'Flat frequency response',
  //     'Built-in pop filter',
  //     'Electromagnetic shielding',
  //   ],
  //   image: 'https://m.media-amazon.com/images/I/71RVJD0lYCL._AC_SL1500_.jpg',
  //   affiliateLink: 'https://amzn.to/YOUR_LINK',
  // },

  // 'elgato-stream-deck': {
  //   name: 'Elgato Stream Deck MK.2',
  //   price: '~$150',
  //   badge: 'Game Changer',
  //   description: 'Physical buttons for scene switching, sound effects, and more. Transform your stream workflow.',
  //   features: [
  //     '15 customizable LCD keys',
  //     'Detachable USB-C cable',
  //     'Adjustable stand',
  //     'Plugin ecosystem',
  //   ],
  //   image: 'https://m.media-amazon.com/images/I/714Yl8nERjL._AC_SL1500_.jpg',
  //   affiliateLink: 'https://amzn.to/YOUR_LINK',
  // },
};

/**
 * Get a product by its slug
 */
export function getProduct(slug) {
  return products[slug] || null;
}

/**
 * Get all products
 */
export function getAllProducts() {
  return Object.entries(products).map(([slug, product]) => ({
    slug,
    ...product,
  }));
}
