/**
 * Update blog post to remove duplicate title and fix intro
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const content = `Starting your streaming journey doesn't have to break the bank. Here's our curated guide to the essential gear that top creators recommend.

## Microphones

Audio quality is arguably more important than video. Viewers will tolerate average video, but poor audio drives them away instantly.

### Budget Pick

{{product:fifine-k669b}}

### Mid-Range

{{product:blue-yeti}}

The Blue Yeti's plug-and-play USB connection means no audio interface needed. Four pickup patterns give you flexibility for different recording scenarios - cardioid for streaming, omnidirectional for group discussions, bidirectional for interviews, and stereo for music.

### Professional Choice

{{product:shure-sm7b}}

The SM7B is the microphone you see in every professional podcast and streaming setup. Used by Joe Rogan, Corpse Husband, and countless others. It requires an audio interface or preamp (like the Cloudlifter), but the broadcast-quality sound is worth it.

## Cameras

Your camera is your window to your audience. A good camera makes you look professional and helps viewers connect with you.

### Webcam - Budget

{{product:logitech-c920}}

The C920 has been the streaming standard for years. 1080p at 30fps, reliable autofocus, and excellent low-light performance. It just works.

### Webcam - Premium

{{product:logitech-brio}}

The Brio offers 4K, HDR, and better low-light performance. Windows Hello support is a nice bonus. Overkill for most streamers, but if you want the best webcam available, this is it.

### DSLR/Mirrorless

{{product:sony-a6400}}

Want that crispy, professional look? A mirrorless camera like the Sony a6400 delivers. Unlimited recording time (no 30-minute limit), excellent autofocus, and the ability to use different lenses. You'll need a capture card to get it into your streaming software.

## Lighting

Good lighting transforms your stream quality more than an expensive camera. Even a budget webcam looks amazing with proper lighting.

### Key Light

{{product:elgato-key-light}}

Adjustable color temperature (2900-7000K), app-controlled brightness, and clean aesthetic. Two of these create a professional two-point lighting setup.

### Ring Light

{{product:neewer-ring-light}}

The classic ring light provides soft, flattering illumination. Great for face cams, eliminates shadows, and that signature ring-shaped catchlight in your eyes looks professional.

### Budget Option

{{product:lume-cube-panel-mini}}

Small, affordable, and shockingly bright. Not the most adjustable, but gets the job done. Great as a fill light or hair light.

## Capture Cards

If you're streaming console games or using a DSLR camera, you need a capture card.

### Internal Card

{{product:elgato-4k60-pro}}

Internal PCIe card means no USB bandwidth worries. 4K60 HDR passthrough, zero latency, rock solid. The pro choice.

### External Card

{{product:elgato-hd60-s}}

Portable, USB-powered, 1080p60. Perfect for laptop streamers or if you don't want to open your PC. Instant Gameview technology delivers ultra-low latency.

## Stream Deck

{{product:elgato-stream-deck}}

The Stream Deck isn't essential, but it's a game-changer. Programmable LCD buttons let you switch scenes, trigger sound effects, adjust audio, tweet, and control your entire stream without touching your keyboard. Once you have one, you'll wonder how you streamed without it.

## Getting Started

Start with the essentials: a decent microphone (Fifine K669B or Blue Yeti) and good lighting (two desk lamps with daylight bulbs work in a pinch). Your existing webcam or phone camera is fine initially.

As your stream grows and you start making money, upgrade piece by piece. Audio first, then lighting, then camera. This gear will last you years - top streamers still use the same Shure SM7B they started with.

Remember: your personality and content matter infinitely more than your equipment. The best streaming setup is the one that doesn't get in the way of you connecting with your audience.

*As an Amazon Associate I earn from qualifying purchases. Prices and availability subject to change.*`;

async function updateBlogPost() {
  console.log('🔄 Updating blog post...');

  const { error } = await supabase
    .from('blog_posts')
    .update({ content })
    .eq('slug', 'best-streaming-setup-2026');

  if (error) {
    console.error('❌ Error:', error);
  } else {
    console.log('✅ Blog post updated successfully!');
    console.log('   - Removed duplicate title');
    console.log('   - Fixed intro paragraph');
  }
}

updateBlogPost().catch(console.error);
