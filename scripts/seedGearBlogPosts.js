import { config } from 'dotenv';
config();
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY,
  { auth: { persistSession: false } }
);

const posts = [
  {
    slug: 'best-budget-streaming-setup-under-300',
    title: 'Best Budget Streaming Setup Under $300 in 2026',
    description: 'Build a complete streaming setup for under $300 that looks and sounds professional. We break down the best mic, camera, lighting, and accessories for new streamers on a budget.',
    category: 'Streaming Gear',
    author: 'ShinyPull Team',
    read_time: '10 min read',
    image: 'https://images.unsplash.com/photo-1598550476439-6847785fcea6?w=800',
    is_published: true,
    published_at: '2026-02-10',
    content: `Starting a streaming career shouldn't require a massive investment. With the right gear choices, you can build a setup that looks and sounds professional for under $300 — and we've done the research to prove it.

## Why Budget Gear Matters

Most viewers can't tell the difference between a $30 mic and a $400 one when the room acoustics are decent. What matters is clear audio, a stable video feed, and good lighting. Let's build that setup.

## The Microphone: Fifine K669B (~$30)

The Fifine K669B is the best value USB microphone on the market. It's plug-and-play, sounds surprisingly clear for the price, and doesn't require any additional equipment like an audio interface.

{{product:fifine-k669b}}

For streaming, this mic punches well above its weight. It won't win awards against a Shure SM7B, but your viewers will hear you clearly — and that's what counts when you're starting out.

## The Camera: Logitech C920 (~$70)

The Logitech C920 has been the go-to budget webcam for years, and for good reason. It delivers solid 1080p video, has decent autofocus, and just works out of the box.

{{product:logitech-c920}}

If you can stretch your budget by $30, the C922 adds 720p/60fps mode which is smoother for fast-paced gaming streams.

## Lighting: Ring Light (~$40)

Lighting makes the biggest visual difference in your stream. A ring light provides even, flattering illumination and eliminates harsh shadows.

{{product:ring-light}}

Mount it behind your monitor pointing at your face. This single addition will make your webcam footage look dramatically better than relying on room lighting alone.

## Boom Arm: TONOR Boom Arm (~$38)

Getting your microphone off the desk and closer to your mouth reduces background noise and keyboard sounds. A boom arm is one of the most underrated upgrades.

{{product:boom-arm}}

## The Complete Budget Setup

Here's everything together:

{{product-grid}}
{{product-mini:fifine-k669b}}
{{product-mini:logitech-c920}}
{{product-mini:ring-light}}
{{product-mini:boom-arm}}
{{/product-grid}}

**Total: ~$178** — well under our $300 budget, leaving room for a capture card or better webcam down the road.

## Optional Upgrades (Still Under $300)

If you have budget remaining, here are the best upgrades in order of impact:

1. **Logitech C922 webcam** (~$100) instead of the C920 for smoother video
2. **Softbox lights** (~$50) for even more professional lighting
3. **Stream Deck Mini** (~$55) for quick scene switching

{{product-grid}}
{{product-mini:logitech-c922}}
{{product-mini:softbox-lights}}
{{product-mini:stream-deck-mini}}
{{/product-grid}}

## Final Thoughts

You don't need expensive gear to start streaming. Focus on clear audio and good lighting — those two things make the biggest difference for viewer retention. Once you're consistently streaming and growing, you can upgrade individual pieces over time.

Check out our [full gear recommendations](/gear) for more options at every price point.`,
  },
  {
    slug: 'top-5-microphones-for-streaming-2026',
    title: 'Top 5 Microphones for Streaming in 2026',
    description: 'From budget USB mics to professional XLR setups, we compare the 5 best streaming microphones at every price point. Find the perfect mic for your Twitch, YouTube, or Kick stream.',
    category: 'Streaming Gear',
    author: 'ShinyPull Team',
    read_time: '12 min read',
    image: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800',
    is_published: true,
    published_at: '2026-02-10',
    content: `Choosing the right microphone is the single most important gear decision for any streamer. Audio quality has a bigger impact on viewer retention than video quality — people will watch a 720p stream with great audio, but they'll leave a 4K stream with bad sound.

## How We Ranked These Mics

We evaluated each microphone on sound quality, ease of setup, background noise rejection, and value for money. Whether you're just starting out or ready to go pro, there's a mic here for you.

## 1. Best Budget: Fifine K669B (~$30)

The Fifine K669B proves you don't need to spend a fortune to sound good on stream. This USB condenser mic delivers clear, warm audio that's more than adequate for streaming.

{{product:fifine-k669b}}

**Best for:** New streamers who want to get started without a big investment. It's plug-and-play with no drivers or audio interface needed.

**Pros:** Unbeatable price, USB plug-and-play, solid audio quality
**Cons:** Picks up more background noise than pricier mics, no mute button

## 2. Most Popular: Blue Yeti (~$100)

The Blue Yeti is the most recognizable streaming microphone for a reason. With four pickup patterns, a built-in gain knob, and a mute button, it gives you flexibility that cheaper mics can't match.

{{product:blue-yeti}}

**Best for:** Streamers who want a reliable all-rounder. The cardioid mode is great for solo streaming, and the stereo mode works well for ASMR or music content.

**Pros:** Multiple pickup patterns, built-in controls, proven track record
**Cons:** Heavy and large, can pick up desk vibrations without a boom arm

## 3. Best Premium USB: Blue Yeti X (~$169)

The Yeti X improves on the classic with a higher sample rate, LED metering, and Blue's VO!CE software for real-time voice effects and noise reduction.

{{product:blue-yeti-x}}

**Best for:** Streamers who want the best USB mic experience without dealing with XLR equipment. The software integration adds real value.

**Pros:** Excellent audio quality, LED metering, software effects
**Cons:** Still large and heavy, premium price for USB

## 4. Best XLR Entry: Audio-Technica AT2020 (~$99)

The AT2020 is where you step into the XLR world. You'll need an audio interface (like the Focusrite Scarlett Solo), but the audio quality leap is noticeable — tighter low end, less noise, more detail.

{{product:audio-technica-at2020}}

**Best for:** Streamers ready to invest in a long-term audio setup. Pair it with a Scarlett Solo and you have a semi-pro rig.

**Pros:** Professional sound quality, durable build, industry standard
**Cons:** Requires audio interface (additional ~$120 cost)

## 5. Professional: Shure SM7B (~$400)

The Shure SM7B is the gold standard. Used by podcasters, radio hosts, and top streamers worldwide, it delivers broadcast-quality audio with exceptional background noise rejection.

{{product:shure-sm7b}}

**Best for:** Serious streamers and content creators who want the best. It's a dynamic mic, meaning it naturally rejects room noise and keyboard sounds.

**Pros:** Broadcast quality, excellent noise rejection, built to last decades
**Cons:** Expensive, requires audio interface + Cloudlifter for most setups

## Quick Comparison

| Mic | Price | Type | Best For |
|-----|-------|------|----------|
| Fifine K669B | ~$30 | USB | Budget / Getting Started |
| Blue Yeti | ~$100 | USB | Most Streamers |
| Blue Yeti X | ~$169 | USB | Premium USB |
| AT2020 | ~$99 | XLR | Stepping Up |
| Shure SM7B | ~$400 | XLR | Professional |

## All Mics at a Glance

{{product-grid}}
{{product-mini:fifine-k669b}}
{{product-mini:blue-yeti}}
{{product-mini:blue-yeti-x}}
{{product-mini:audio-technica-at2020}}
{{product-mini:shure-sm7b}}
{{/product-grid}}

## Our Recommendation

For most streamers, the **Blue Yeti** at ~$100 is the sweet spot. If you're on a tight budget, the Fifine K669B is an incredible value. And if you're ready to go pro, the Shure SM7B paired with a [Focusrite Scarlett Solo](/gear) and [Cloudlifter](/gear) is the endgame setup.

Browse our [complete gear collection](/gear) for audio interfaces, boom arms, and other accessories to complete your setup.`,
  },
  {
    slug: 'best-cameras-for-streaming-youtube-2026',
    title: 'Best Cameras for Streaming and YouTube in 2026',
    description: 'Compare the best webcams and cameras for streaming on Twitch, YouTube, and Kick. From the budget Logitech C920 to the professional Sony ZV-E10, find the right camera for your setup.',
    category: 'Streaming Gear',
    author: 'ShinyPull Team',
    read_time: '11 min read',
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800',
    is_published: true,
    published_at: '2026-02-10',
    content: `Your camera is the first thing viewers notice when they click on your stream. While audio keeps them watching, a good camera makes them click in the first place. Here's our breakdown of the best cameras for streamers at every price point.

## Webcams vs. Mirrorless Cameras

**Webcams** (C920, C922, StreamCam) are plug-and-play. Connect via USB, open your streaming software, and you're live. They're affordable and hassle-free.

**Mirrorless cameras** (Sony ZV-E10, Canon M50) deliver cinema-quality video with beautiful background blur (bokeh). But they require a capture card (like the Elgato Cam Link 4K) and cost significantly more.

For most streamers, **start with a webcam and upgrade later** once you know streaming is for you.

## 1. Best Budget: Logitech C920 (~$70)

The C920 has been the default streaming webcam for years. It records in 1080p/30fps with decent autofocus and automatic light correction.

{{product:logitech-c920}}

**Best for:** New streamers who need a reliable, affordable webcam. It works with every streaming platform and software out of the box.

## 2. Better Value: Logitech C922 (~$100)

The C922 improves on the C920 with 720p/60fps mode (smoother for gaming), better low-light performance, and a free XSplit license.

{{product:logitech-c922}}

**Best for:** Gamers who want smoother facecam footage. The 60fps mode at 720p looks noticeably better for fast movements.

## 3. Content Creator Pick: Logitech StreamCam (~$169)

The StreamCam was built specifically for streamers and content creators. It supports 1080p/60fps, has smart autofocus that tracks your face, and can rotate to portrait mode for vertical content.

{{product:logitech-streamcam}}

**Best for:** Multi-platform creators who stream on Twitch and also create vertical content for TikTok or YouTube Shorts.

## 4. Built-in Ring Light: Razer Kiyo (~$99)

The Razer Kiyo has a built-in ring light that solves the lighting problem in one device. If you don't want to buy a separate light, this is a clever all-in-one solution.

{{product:razer-kiyo}}

**Best for:** Streamers who want a simple one-device solution. The ring light isn't as good as a dedicated light, but it's much better than no light at all.

## 5. Creator Camera: Sony ZV-E10 (~$699)

When you're ready to step up to mirrorless, the Sony ZV-E10 is purpose-built for content creators. It has a flip-out screen, excellent autofocus, and produces the kind of cinematic footage that makes your stream look professional.

{{product:sony-zv-e10}}

**Note:** You'll also need a capture card to connect it to your PC:

{{product:elgato-cam-link-4k}}

**Best for:** Established streamers ready to invest in professional-quality video. The background blur alone makes a huge difference.

## Quick Comparison

| Camera | Price | Resolution | Type |
|--------|-------|-----------|------|
| Logitech C920 | ~$70 | 1080p/30fps | Webcam |
| Logitech C922 | ~$100 | 1080p/30fps, 720p/60fps | Webcam |
| Razer Kiyo | ~$99 | 1080p/30fps | Webcam + Light |
| Logitech StreamCam | ~$169 | 1080p/60fps | Webcam |
| Sony ZV-E10 | ~$699 | 4K/30fps, 1080p/120fps | Mirrorless |

## All Cameras at a Glance

{{product-grid}}
{{product-mini:logitech-c920}}
{{product-mini:logitech-c922}}
{{product-mini:razer-kiyo}}
{{product-mini:logitech-streamcam}}
{{product-mini:sony-zv-e10}}
{{/product-grid}}

## Don't Forget Lighting

No matter which camera you choose, **lighting is more important than the camera itself**. A $70 webcam with good lighting will look better than a $700 camera in a dark room.

{{product-grid}}
{{product-mini:ring-light}}
{{product-mini:softbox-lights}}
{{product-mini:elgato-key-light}}
{{/product-grid}}

## Our Recommendation

Start with the **Logitech C922** (~$100) — it's the best balance of price and quality. Add a ring light and you'll have a great-looking stream. When you're ready to go cinematic, the Sony ZV-E10 with an Elgato Cam Link is the upgrade path.

Check out our [full gear collection](/gear) for the complete streaming setup.`,
  },
];

async function seedGearBlogPosts() {
  console.log('🌱 Seeding gear comparison blog posts...\n');

  for (const post of posts) {
    // Check if post already exists
    const { data: existing } = await supabase
      .from('blog_posts')
      .select('id')
      .eq('slug', post.slug)
      .single();

    if (existing) {
      console.log(`  ⚠️  "${post.title}" already exists, skipping`);
      continue;
    }

    const { error } = await supabase
      .from('blog_posts')
      .insert(post);

    if (error) {
      console.error(`  ❌ Error seeding "${post.title}":`, error.message);
    } else {
      console.log(`  ✅ "${post.title}"`);
    }
  }

  console.log('\n✨ Done!');
}

seedGearBlogPosts().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
