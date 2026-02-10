import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const gamingChairs = [
  {
    slug: 'secretlab-titan-evo',
    name: 'Secretlab Titan Evo',
    price: 549,
    badge: 'BEST OVERALL',
    description: 'The Secretlab Titan Evo is the gold standard in gaming chairs. With its premium build quality, magnetic memory foam head pillow, and industry-leading ergonomic adjustments, it delivers exceptional comfort for marathon gaming sessions. The proprietary cold-cure foam cushioning provides the perfect balance of support and comfort that lasts for years.',
    features: [
      'Magnetic memory foam head pillow',
      'Cold-cure foam seat cushioning',
      'Fully adjustable 4D armrests',
      'Integrated lumbar support system',
      '165-degree recline',
      'Premium leatherette upholstery',
      'Weight capacity up to 397 lbs (XL)',
      '3-year warranty'
    ],
    image: '', // User will add later
    affiliate_link: '', // User will add later
    is_active: true
  },
  {
    slug: 'corsair-tc100-relaxed',
    name: 'Corsair TC100 Relaxed',
    price: 299,
    badge: 'BEST VALUE',
    description: 'The Corsair TC100 Relaxed offers incredible value without compromising on comfort. Its thick cushioning and broad design make it perfect for gamers who want a supportive chair without breaking the bank. The refined styling and quality build make it look and feel more expensive than it is.',
    features: [
      'Thick, plush cushioning',
      'Broad, relaxed seat design',
      'Breathable fabric upholstery',
      'Adjustable armrests',
      'Recline up to 152 degrees',
      'Built-in lumbar support',
      'Weight capacity up to 264 lbs',
      'Excellent price-to-performance ratio'
    ],
    image: '',
    affiliate_link: '',
    is_active: true
  },
  {
    slug: 'razer-iskur-v2',
    name: 'Razer Iskur V2',
    price: 649,
    badge: null,
    description: 'The Razer Iskur V2 takes gaming chair design seriously with its fully adjustable built-in lumbar support system. Unlike traditional chairs that use separate pillows, the Iskur V2 features a recline-tilting lumbar curve that moves with you, providing consistent support no matter your seating position.',
    features: [
      'Fully adjustable built-in lumbar support',
      'Recline-tilting lumbar curve',
      'Premium multi-layered synthetic leather',
      'High-density foam cushions',
      '4D adjustable armrests',
      'Recline up to 139 degrees',
      'Weight capacity up to 299 lbs',
      'Engineered for long gaming sessions'
    ],
    image: '',
    affiliate_link: '',
    is_active: true
  },
  {
    slug: 'herman-miller-embody',
    name: 'Herman Miller Embody Gaming Chair',
    price: 1795,
    badge: 'PREMIUM',
    description: 'The Herman Miller Embody represents the pinnacle of ergonomic seating. Developed with medical professionals, this luxury chair delivers unmatched comfort and support with its patented Backfit adjustment and dynamic pixelated support system. The 12-year warranty reflects its exceptional build quality and longevity.',
    features: [
      'Patented Backfit adjustment technology',
      'Dynamic pixelated support system',
      'Copper-infused cooling foam',
      'Automatically conforms to your body',
      'Promotes healthy circulation',
      'Fully adjustable in every dimension',
      'Weight capacity up to 300 lbs',
      '12-year warranty'
    ],
    image: '',
    affiliate_link: '',
    is_active: true
  },
  {
    slug: 'andaseat-kaiser-4-xl',
    name: 'AndaSeat Kaiser 4 XL',
    price: 599,
    badge: 'BIG & TALL',
    description: 'The AndaSeat Kaiser 4 XL is purpose-built for larger gamers who need extra room without sacrificing comfort. Available in L and XL sizes, this chair features a robust build, adjustable magnetic lumbar support, and premium materials that can handle up to 440 pounds. It\'s big, comfy, and built to last.',
    features: [
      'Extra-large design for big and tall users',
      'Adjustable magnetic lumbar support',
      'Premium PVC leather upholstery',
      '4D adjustable armrests',
      'Recline up to 160 degrees',
      'Memory foam head cushion',
      'Weight capacity up to 440 lbs (XL)',
      'Heavy-duty steel frame'
    ],
    image: '',
    affiliate_link: '',
    is_active: true
  },
  {
    slug: 'respawn-900-recliner',
    name: 'RESPAWN 900 Gaming Recliner',
    price: 499,
    badge: 'UNIQUE',
    description: 'The RESPAWN 900 Gaming Recliner takes a completely different approach to gaming comfort. This recliner-style chair features a built-in footrest, side storage pocket, and the ability to recline to nearly flat. Perfect for console gamers or anyone who wants to kick back and relax while gaming.',
    features: [
      'Full recliner with extendable footrest',
      'Recline up to 135 degrees',
      'Side storage pocket for controllers',
      'Cup holder',
      'Segmented padding for comfort',
      'Bonded leather upholstery',
      'Weight capacity up to 275 lbs',
      'Ideal for console gaming'
    ],
    image: '',
    affiliate_link: '',
    is_active: true
  },
  {
    slug: 'thunderx3-core',
    name: 'ThunderX3 Core',
    price: 329,
    badge: 'BEST BACK SUPPORT',
    description: 'The ThunderX3 Core came out of nowhere to deliver exceptional lumbar support at an affordable price. If your back needs extra attention during long gaming sessions, this chair\'s ergonomic design and adjustable lumbar support will keep you comfortable without emptying your wallet.',
    features: [
      'Excellent ergonomic lumbar support',
      'Adjustable lumbar cushion',
      'Breathable fabric upholstery',
      'High-density foam padding',
      '3D adjustable armrests',
      'Recline up to 180 degrees',
      'Weight capacity up to 220 lbs',
      'Outstanding value for back support'
    ],
    image: '',
    affiliate_link: '',
    is_active: true
  },
  {
    slug: 'razer-iskur-v2-x',
    name: 'Razer Iskur V2 X',
    price: 299,
    badge: 'BUDGET PICK',
    description: 'The Razer Iskur V2 X brings Razer\'s gaming chair expertise to a budget-friendly price point. Don\'t let the lower cost fool you—this chair features a steel frame, aluminum wheelbase, and quality fabric upholstery that\'s built to last years into the future. Exceptional durability for the price.',
    features: [
      'Steel frame construction',
      'Aluminum wheelbase',
      'High-quality fabric upholstery',
      'Integrated lumbar support',
      '2D adjustable armrests',
      'Recline up to 152 degrees',
      'Weight capacity up to 299 lbs',
      'Built for long-term durability'
    ],
    image: '',
    affiliate_link: '',
    is_active: true
  }
];

async function seedGamingChairs() {
  console.log('🪑 Seeding gaming chairs to Supabase...\n');

  try {
    let added = 0;
    let skipped = 0;

    for (const chair of gamingChairs) {
      console.log(`Processing: ${chair.name} (${chair.slug})`);

      // Check if product already exists
      const { data: existing } = await supabase
        .from('products')
        .select('id')
        .eq('slug', chair.slug)
        .single();

      if (existing) {
        console.log(`  ⚠️  Product already exists, skipping...`);
        skipped++;
        continue;
      }

      // Insert product
      const { data, error } = await supabase
        .from('products')
        .insert(chair)
        .select()
        .single();

      if (error) {
        console.error(`  ❌ Error adding product:`, error);
      } else {
        console.log(`  ✅ Added successfully - $${chair.price}`);
        added++;
      }
    }

    console.log(`\n✨ Gaming chair seeding complete!`);
    console.log(`   Added: ${added} chairs`);
    console.log(`   Skipped: ${skipped} existing chairs`);
  } catch (err) {
    console.error('Error seeding gaming chairs:', err);
    process.exit(1);
  }
}

seedGamingChairs();
