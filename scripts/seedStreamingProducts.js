import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const products = [
  {
    slug: 'blue-yeti',
    name: 'Blue Yeti USB Microphone',
    price: '~$100',
    badge: 'Most Popular',
    description: 'The industry standard for content creators. Multiple pickup patterns, built-in gain control, and exceptional sound quality.',
    features: [
      'Four pickup pattern modes',
      'Built-in gain control and mute button',
      'Zero-latency headphone monitoring',
      '24-bit/48kHz recording quality',
      'Heavy base prevents vibrations'
    ],
    image: '',
    affiliate_link: 'https://amzn.to/PLACEHOLDER',
    is_active: true
  },
  {
    slug: 'shure-sm7b',
    name: 'Shure SM7B Microphone',
    price: '~$400',
    badge: 'Professional',
    description: 'Broadcast-quality dynamic microphone used in professional studios worldwide. Requires audio interface and preamp.',
    features: [
      'Broadcast-quality dynamic cardioid',
      'Excellent background noise rejection',
      'Built-in pop filter',
      'Switchable bass roll-off and presence boost',
      'Requires XLR interface and preamp'
    ],
    image: '',
    affiliate_link: 'https://amzn.to/PLACEHOLDER',
    is_active: true
  },
  {
    slug: 'logitech-c920',
    name: 'Logitech C920 HD Webcam',
    price: '~$70',
    badge: 'Budget Pick',
    description: 'The legendary webcam that launched a thousand streaming careers. Still one of the best value options over a decade later.',
    features: [
      'Full HD 1080p at 30fps',
      'Dual microphones',
      'Autofocus and automatic light correction',
      'Works with all streaming platforms',
      'Clips onto monitors or tripod mount'
    ],
    image: '',
    affiliate_link: 'https://amzn.to/PLACEHOLDER',
    is_active: true
  },
  {
    slug: 'logitech-c922',
    name: 'Logitech C922 Pro Webcam',
    price: '~$100',
    badge: 'Better Value',
    description: 'Upgraded version of the C920 with 60fps option and improved low-light performance.',
    features: [
      '1080p at 30fps OR 720p at 60fps',
      'Improved low-light performance',
      'Better background removal',
      'Automatic HD light correction',
      'Tripod included'
    ],
    image: '',
    affiliate_link: 'https://amzn.to/PLACEHOLDER',
    is_active: true
  },
  {
    slug: 'sony-zv1',
    name: 'Sony ZV-1 Digital Camera',
    price: '~$700',
    badge: 'Professional',
    description: 'Purpose-built for content creators with excellent autofocus, background blur mode, and flip-out screen.',
    features: [
      'Purpose-built for content creators',
      'Excellent autofocus tracking',
      'Background blur mode',
      'Flip-out screen for framing',
      'Great in low light with ND filters'
    ],
    image: '',
    affiliate_link: 'https://amzn.to/PLACEHOLDER',
    is_active: true
  },
  {
    slug: 'canon-m50',
    name: 'Canon EOS M50 Mirrorless Camera',
    price: '~$800',
    badge: 'Professional',
    description: 'Interchangeable lens mirrorless camera perfect for streaming and content creation.',
    features: [
      'Interchangeable lens system',
      '4K video recording',
      'Dual Pixel autofocus',
      'Vari-angle touchscreen',
      'Great for streaming and photography'
    ],
    image: '',
    affiliate_link: 'https://amzn.to/PLACEHOLDER',
    is_active: true
  },
  {
    slug: 'ring-light',
    name: 'Ring Light with Stand',
    price: '~$40',
    badge: 'Essential',
    description: 'Simple, effective, and flattering lighting that immediately improves your image quality.',
    features: [
      'Circular LED creates even illumination',
      'Eliminates harsh shadows',
      'Adjustable brightness and color temp',
      'Distinctive catchlight in eyes',
      'Phone holder included'
    ],
    image: '',
    affiliate_link: 'https://amzn.to/PLACEHOLDER',
    is_active: true
  },
  {
    slug: 'elgato-key-light',
    name: 'Elgato Key Light',
    price: '~$200',
    badge: 'Pro Choice',
    description: 'Professional edge-lit LED panel with app control, designed specifically for streamers.',
    features: [
      '2800 lumens of brightness',
      'App control via WiFi',
      'Adjustable color temperature (2900K-7000K)',
      'Stream Deck integration',
      'Multi-light sync'
    ],
    image: '',
    affiliate_link: 'https://amzn.to/PLACEHOLDER',
    is_active: true
  },
  {
    slug: 'softbox-lights',
    name: 'Photography Softbox Light Kit',
    price: '~$50',
    badge: 'DIY Option',
    description: 'Professional photography lighting at a budget price. Perfect for three-point lighting setup.',
    features: [
      'Two light stands with soft box diffusers',
      'Daylight balanced LED bulbs (5500K)',
      'Adjustable height and angle',
      'Carrying case included',
      'Great for photography too'
    ],
    image: '',
    affiliate_link: 'https://amzn.to/PLACEHOLDER',
    is_active: true
  },
  {
    slug: 'elgato-hd60-splus',
    name: 'Elgato HD60 S+ Capture Card',
    price: '~$180',
    badge: 'Gold Standard',
    description: 'The capture card used by professional console streamers worldwide.',
    features: [
      '4K60 HDR passthrough',
      'Zero lag passthrough',
      'Instant Gameview low latency',
      'USB 3.0 connection',
      'Works with all consoles'
    ],
    image: '',
    affiliate_link: 'https://amzn.to/PLACEHOLDER',
    is_active: true
  },
  {
    slug: 'avermedia-live-gamer-mini',
    name: 'AVerMedia Live Gamer Mini',
    price: '~$100',
    badge: 'Budget Pick',
    description: 'Solid 1080p60 capture at nearly half the price of premium options.',
    features: [
      '1080p60 capture and passthrough',
      'USB 2.0 connection',
      'Compact portable design',
      'Zero latency passthrough',
      'Party Chat Link cable included'
    ],
    image: '',
    affiliate_link: 'https://amzn.to/PLACEHOLDER',
    is_active: true
  },
  {
    slug: 'elgato-stream-deck',
    name: 'Elgato Stream Deck MK.2',
    price: '~$150',
    badge: 'Game Changer',
    description: 'Physical buttons for complete stream control. Once you have one, you\'ll never stream without it.',
    features: [
      '15 customizable LCD keys',
      'Touch controls for quick access',
      'Detachable USB-C cable',
      'Adjustable stand',
      'Massive plugin ecosystem'
    ],
    image: '',
    affiliate_link: 'https://amzn.to/PLACEHOLDER',
    is_active: true
  },
  {
    slug: 'elgato-cam-link-4k',
    name: 'Elgato Cam Link 4K',
    price: '~$130',
    badge: 'Required for Cameras',
    description: 'Turns any HDMI camera into a high-quality webcam for streaming.',
    features: [
      '4K capture at 30fps',
      '1080p at 60fps',
      'Ultra-low latency',
      'Works with any HDMI camera',
      'Plug and play USB connection'
    ],
    image: '',
    affiliate_link: 'https://amzn.to/PLACEHOLDER',
    is_active: true
  }
];

async function seedStreamingProducts() {
  console.log('🌱 Seeding streaming setup products...\n');

  for (const product of products) {
    console.log(`Adding: ${product.name} (${product.slug})`);

    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('slug', product.slug)
      .single();

    if (existing) {
      console.log(`  ⚠️  Already exists, skipping...`);
      continue;
    }

    const { error } = await supabase
      .from('products')
      .insert(product);

    if (error) {
      console.error(`  ❌ Error:`, error.message);
    } else {
      console.log(`  ✅ Added successfully`);
    }
  }

  console.log('\n✨ All products seeded! Now update the blog post with embeds.');
}

seedStreamingProducts();
