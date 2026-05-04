import { Link } from 'react-router-dom';
import { Youtube, Twitch, Clock, Database, RefreshCw, ShieldCheck, Music } from 'lucide-react';
import KickIcon from '../components/KickIcon';
import TikTokIcon from '../components/TikTokIcon';
import BlueskyIcon from '../components/BlueskyIcon';
import SEO from '../components/SEO';

const platforms = [
  {
    icon: Youtube,
    name: 'YouTube',
    color: 'text-red-400',
    borderColor: 'border-red-800',
    bgColor: 'bg-red-950/20',
    iconBg: 'from-red-500 to-red-600',
    shadow: 'shadow-red-500/20',
    metrics: ['Subscriber count', 'Total video views', 'Video count'],
    source: 'YouTube Data API v3 (official)',
    frequency: '3x daily',
    notes: [
      'YouTube rounds subscriber counts to 3 significant figures for all channels. A channel with 4,230,000 subs displays as 4,230,000 but one with 4,237,591 also shows 4,230,000. This has been YouTube policy since 2019.',
      'Because of rounding, daily subscriber changes on large channels are often 0. We default to showing view growth on YouTube profiles since views are precise.',
    ],
  },
  {
    icon: TikTokIcon,
    name: 'TikTok',
    color: 'text-pink-400',
    borderColor: 'border-pink-800',
    bgColor: 'bg-pink-950/20',
    iconBg: 'from-pink-500 to-pink-600',
    shadow: 'shadow-pink-500/20',
    metrics: ['Follower count', 'Total likes', 'Video count'],
    source: 'Publicly available profile data',
    frequency: '4x daily',
    notes: [
      'We collect publicly available profile statistics for TikTok creators. All data shown is visible to anyone who visits a creator\'s public profile.',
      'Total likes are stored in our system as the "views" metric since TikTok has no profile-level view count.',
    ],
  },
  {
    icon: Twitch,
    name: 'Twitch',
    color: 'text-purple-400',
    borderColor: 'border-purple-800',
    bgColor: 'bg-purple-950/20',
    iconBg: 'from-purple-500 to-purple-600',
    shadow: 'shadow-purple-500/20',
    metrics: ['Follower count', 'Hours watched (daily, weekly, monthly)', 'Stream count', 'Peak and average viewers per stream'],
    source: 'Twitch Helix API (official)',
    frequency: 'Followers 3x daily. Streams monitored every 3 hours.',
    notes: [
      "Twitch deprecated their total view count in 2022. Hours watched is now the standard industry metric and is what we track.",
      'Hours watched is calculated from live viewer samples taken every few minutes during active streams, multiplied by time elapsed. We aggregate these into daily, weekly, and monthly totals.',
    ],
  },
  {
    icon: KickIcon,
    name: 'Kick',
    color: 'text-green-400',
    borderColor: 'border-green-800',
    bgColor: 'bg-green-950/20',
    iconBg: 'from-green-500 to-green-600',
    shadow: 'shadow-green-500/20',
    metrics: ['Paid subscriber count', 'Hours watched (daily, weekly, monthly)', 'Stream count', 'Peak and average viewers per stream'],
    source: "Kick API v1 (official)",
    frequency: 'Subscribers 3x daily. Streams monitored every 3 hours.',
    notes: [
      "Kick's public API does not expose free follower counts. The subscriber number shown on Kick profiles is paid subscribers only, which is a smaller number than total followers.",
      'Hours watched is calculated the same way as Twitch, from viewer samples taken during live streams.',
    ],
  },
  {
    icon: BlueskyIcon,
    name: 'Bluesky',
    color: 'text-sky-400',
    borderColor: 'border-sky-800',
    bgColor: 'bg-sky-950/20',
    iconBg: 'from-sky-400 to-sky-600',
    shadow: 'shadow-sky-500/20',
    metrics: ['Follower count', 'Post count'],
    source: 'AT Protocol public API (no authentication required)',
    frequency: '3x daily',
    notes: [
      'Bluesky uses a decentralized protocol (AT Protocol) with a fully public API. No API key or approval needed.',
      'Bluesky has no profile-level view counts, so we only track followers and posts.',
    ],
  },
  {
    icon: Music,
    name: 'Music',
    color: 'text-amber-400',
    borderColor: 'border-amber-800',
    bgColor: 'bg-amber-950/20',
    iconBg: 'from-amber-500 to-orange-500',
    shadow: 'shadow-amber-500/20',
    metrics: ['Monthly listeners', 'Total play count', 'Genre tags'],
    source: 'Last.fm API (public, API key only, no user auth)',
    frequency: '3x daily',
    notes: [
      'Monthly listeners reflects unique listeners over the last 30 days. Total plays is the cumulative scrobble count across all Last.fm users who have listened to an artist.',
      'Last.fm deprecated artist profile images in May 2019. All artist image URLs now return a placeholder star graphic, so ShinyPull displays a fallback icon on music profiles instead.',
    ],
  },
];

const principles = [
  {
    icon: ShieldCheck,
    color: 'from-indigo-500 to-indigo-600',
    shadow: 'shadow-indigo-500/30',
    title: 'No synthetic data',
    body: 'Every number in our database comes from a real API call or data collection at a specific point in time. We never estimate, interpolate, or generate historical data. If we missed a day, that day just has no data.',
  },
  {
    icon: Database,
    color: 'from-emerald-500 to-teal-500',
    shadow: 'shadow-emerald-500/30',
    title: 'Daily snapshots',
    body: 'Stats are stored as daily snapshots. Charts reflect the actual numbers at collection time. Missing days show as gaps in the chart, not zeroed-out values.',
  },
  {
    icon: RefreshCw,
    color: 'from-amber-500 to-orange-500',
    shadow: 'shadow-amber-500/30',
    title: 'Failed calls are skipped',
    body: 'If an API call fails or returns unexpected data, we skip the write entirely. A missing row is always better than a corrupt one with 0 values that would trash a chart.',
  },
  {
    icon: Clock,
    color: 'from-purple-500 to-purple-600',
    shadow: 'shadow-purple-500/30',
    title: 'Public data only',
    body: "All data shown on ShinyPull is publicly available. We collect the same information anyone could see by visiting a creator's profile page. We do not access private account data.",
  },
];

export default function Methodology() {
  return (
    <>
      <SEO
        title="Data Methodology"
        description="Learn how ShinyPull collects and maintains creator statistics across YouTube, TikTok, Twitch, Kick, Bluesky, and Music (Last.fm)."
      />

      <div className="min-h-screen bg-[#0a0a0f] dot-grid">
        {/* Hero */}
        <div className="relative overflow-hidden border-b border-gray-800/60 py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-4xl font-extrabold text-gray-100 mb-4">Data Methodology</h1>
            <p className="text-xl text-gray-400">
              How we collect, store, and maintain creator statistics.
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-12 space-y-14">

          {/* Core principles */}
          <section>
            <h2 className="text-2xl font-bold text-gray-100 mb-2">Our Principles</h2>
            <p className="text-gray-400 mb-8">
              Accurate data is the whole point of this site. These are the rules we follow to keep it that way.
            </p>
            <div className="grid sm:grid-cols-2 gap-5">
              {principles.map((p) => (
                <div key={p.title} className="group bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-colors">
                  <div className={`w-12 h-12 bg-gradient-to-br ${p.color} rounded-xl flex items-center justify-center shadow-lg ${p.shadow} mb-4`}>
                    <p.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-100 mb-2">{p.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{p.body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Per-platform */}
          <section>
            <h2 className="text-2xl font-bold text-gray-100 mb-2">Platform Details</h2>
            <p className="text-gray-400 mb-8">
              Every platform has its own API, quirks, and limitations. Here's exactly what we track and how.
            </p>
            <div className="space-y-6">
              {platforms.map((p) => (
                <div key={p.name} className={`bg-gray-900 border ${p.borderColor} rounded-2xl p-6`}>
                  <div className="flex items-center gap-3 mb-5">
                    <div className={`w-10 h-10 bg-gradient-to-br ${p.iconBg} rounded-xl flex items-center justify-center shadow-lg ${p.shadow}`}>
                      <p.icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-100">{p.name}</h3>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-4 mb-5 text-sm">
                    <div>
                      <p className="text-gray-500 uppercase text-xs font-semibold tracking-wider mb-1">Data Source</p>
                      <p className="text-gray-300">{p.source}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 uppercase text-xs font-semibold tracking-wider mb-1">Update Frequency</p>
                      <p className="text-gray-300">{p.frequency}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 uppercase text-xs font-semibold tracking-wider mb-1">Metrics Tracked</p>
                      <ul className="text-gray-300 space-y-0.5">
                        {p.metrics.map((m) => <li key={m}>{m}</li>)}
                      </ul>
                    </div>
                  </div>

                  {p.notes.length > 0 && (
                    <div className={`${p.bgColor} rounded-xl p-4 space-y-2`}>
                      {p.notes.map((note, i) => (
                        <p key={i} className="text-sm text-gray-300 leading-relaxed">{note}</p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Footer CTA */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
            <h2 className="text-xl font-bold text-gray-100 mb-2">Questions about the data?</h2>
            <p className="text-gray-400 mb-6">
              If something looks off or you want to know more, reach out.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/faq"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-100 font-semibold rounded-xl transition-colors"
              >
                Browse FAQ
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-colors"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
