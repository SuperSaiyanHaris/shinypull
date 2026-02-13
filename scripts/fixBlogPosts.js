/**
 * Fix Iron Lung blog post (remove AI patterns) and set gaming chairs published_at
 * Usage: node scripts/fixBlogPosts.js
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const ironLungContent = `A YouTuber just outperformed most of Hollywood at the box office. Mark "Markiplier" Fischbach put up $3 million of his own money to make a horror movie, didn't bother with the studio system, and pulled in $37 million worldwide in under two weeks. This wasn't a lucky break. The way movies get made and sold to audiences is changing, and Iron Lung is the proof.

## From Let's Plays to the Big Screen

If you've been on YouTube at all in the last decade, you already know who Markiplier is. With [over 38 million subscribers](/youtube/markiplier) and more than 5,000 videos uploaded since 2012, Mark Fischbach is one of the most recognizable creators on the platform. He made his name doing horror game playthroughs with over-the-top reactions and funny commentary, and his audience stuck around because the guy is just likable.

But Markiplier has always wanted to do more than YouTube videos. He co-founded the clothing brand Cloak, produced interactive YouTube specials like *A Heist with Markiplier* and *In Space with Markiplier*, and kept pushing into new creative territory. Iron Lung was the big one though. A real, full-length movie with actual money behind it, playing in actual theaters.

And he pulled it off.

## What Is Iron Lung?

Iron Lung is based on David Szymanski's 2022 PC horror game of the same name. The setup is grim: sometime in the far future, a cosmic event called **"The Quiet Rapture"** causes every star and habitable planet to just vanish. No explanation. Humanity is barely hanging on.

A convict named Simon (played by Markiplier) gets thrown into a beat-up mini-submarine called the Iron Lung and told to pilot it through an ocean of blood on some desolate moon. His job is to photograph the ocean floor and find clues about what happened. Do that and he goes free.

The original game is about a 45-minute experience, but Markiplier stretches the story into a full two-hour feature. Almost the entire film takes place inside the sub. It's tight, it's uncomfortable, and you're watching Simon deal with failing equipment, limited oxygen, and the slow, creeping realization that something is moving around down there in the blood.

## The Numbers Speak for Themselves

Let's just look at the raw stats:

- **Production budget:** $3 million (Markiplier paid for it himself)
- **Worldwide box office:** $37 million (still going)
- **Return on investment:** Over 11x the budget
- **Theater count:** Started as a limited release, expanded to 4,000+ screens
- **Release date:** January 30, 2026
- **Rating:** R

Iron Lung has already made more money than dozens of studio films that cost ten times as much. The original plan was a small theatrical run, maybe a few screens for a weekend before heading to streaming. But fans showed up in such huge numbers that distributors rushed to get it into more theaters.

Late January and early February is basically a dead zone for movies. The fact that Iron Lung pulled $37 million during that stretch is wild. This isn't some small indie success story. This is real box office money.

## Why It Worked: The Creator Advantage

Hollywood studios spend tens of millions just on marketing. Press tours, billboards, TV spots, social media campaigns. All of that to try to get people excited about a movie. Markiplier didn't need any of it.

Think about what he already had going in:

- 38 million YouTube subscribers
- Millions of followers across TikTok, Instagram, and Twitter
- A fanbase that has been watching him for over a decade
- A direct line to his audience with no middleman

When he announced Iron Lung, he didn't buy a Super Bowl ad or rent out a billboard in Times Square. He posted a video. His fans shared it. The internet took it from there. His marketing budget was basically zero.

This is what scares Hollywood. You don't need a $200 million budget and a deal with Disney to put butts in theater seats. You just need people who actually care about what you're making.

## The Film Itself: Gritty, Claustrophobic, and Unapologetically Indie

Critics have been split on Iron Lung, but audiences are loving it. The film has that same gritty, low-budget energy as '90s sci-fi horror like Richard Stanley's *Hardware* (1990), Vincenzo Natali's *Cube* (1997), and Terry Gilliam's *12 Monkeys* (1995).

Markiplier wore basically every hat on this project: writer, director, star, editor, and executive producer. That's a lot for anyone, let alone someone making their first feature film. Cinematographer Philip Roy and composer Andrew Hulshult deserve a ton of credit too. Roy's camerawork inside the sub makes you feel every creak and rattle of the hull, and Hulshult's score just gets under your skin in the best way.

Is it a perfect movie? Nah. The middle section drags a bit, which is kind of inevitable when you're turning a 45-minute game into a two-hour film. But the atmosphere is incredible, the concept is original, and you can feel how much Markiplier cared about the source material. This wasn't some cynical cash grab. He made the movie he wanted to make.

## What This Means for Other Creators

Iron Lung didn't just do well for Markiplier. It opened a door for every creator who's ever thought about making the jump to film.

### 1. Your Audience Is Your Superpower
Markiplier didn't borrow an audience from a studio or rely on an algorithm to find viewers. He spent 14 years building a community. That loyalty converted directly into opening weekend ticket sales, and no amount of traditional advertising can replicate that kind of trust.

### 2. Small Budgets Can Win Big
$3 million in, $37 million out. That's the kind of return that makes every investor in Hollywood sit up straight. As cameras and editing tools keep getting cheaper, more creators are going to take this route.

### 3. People Still Want to Go to Theaters
Everyone keeps saying streaming killed the movie theater. Then a YouTuber proves that young people will absolutely buy tickets if you give them something worth seeing. It was never about theaters dying. It was about the movies being boring.

### 4. YouTube Is Legitimate Training
Markiplier learned editing, pacing, and how to hold an audience's attention through thousands of YouTube videos over more than a decade. That's not a lesser path than film school. If anything, it's better because he got real-time feedback from millions of people the entire way.

## The Bigger Picture

The timing here is hard to ignore. Netflix just bought Warner Bros. and is already talking about cutting theatrical windows in half. Studio execs keep saying young people don't want to go to the movies anymore.

Markiplier and the millions of fans who showed up for Iron Lung just blew that argument apart.

Young people aren't avoiding theaters. They're avoiding $15 tickets to the same reheated franchise sequel they've already seen five versions of. Give them something original with real creative energy behind it and they'll show up. Iron Lung proved that.

## What's Next for Markiplier?

With a $37 million hit under his belt and every entertainment exec suddenly paying attention, the real question is what Markiplier does next. He could take a big studio deal, but if he's smart about it (and he usually is), he'll stick with what got him here: keep it independent, keep it creative, keep the audience close.

If you're a Markiplier fan, a horror fan, or you just like watching the old Hollywood playbook get torn up, Iron Lung is the most interesting movie of 2026 so far. Not because it's flawless, but because it showed everyone what's possible when a creator bets on themselves and their community backs them up.

Hollywood got put on notice. And honestly? This is probably just the start.

---

*Track Markiplier's growth and stats across YouTube and TikTok on [ShinyPull](/youtube/markiplier).*`;

async function fix() {
  // 1. Update Iron Lung post content
  const { error: ironLungError } = await supabase
    .from('blog_posts')
    .update({ content: ironLungContent })
    .eq('slug', 'markiplier-iron-lung-box-office-youtube-to-hollywood');

  if (ironLungError) {
    console.error('Error updating Iron Lung post:', ironLungError);
  } else {
    console.log('✅ Iron Lung post updated (removed AI patterns)');
  }

  // 2. Fix gaming chairs published_at (was null, should be ~Feb 10)
  const { error: chairError } = await supabase
    .from('blog_posts')
    .update({ published_at: '2026-02-10' })
    .eq('slug', 'best-gaming-chairs-2026');

  if (chairError) {
    console.error('Error updating gaming chairs post:', chairError);
  } else {
    console.log('✅ Gaming chairs post published_at set to 2026-02-10');
  }
}

fix();
