import SEO from '../components/SEO';
import { Link } from 'react-router-dom';
import { BarChart3, Users, TrendingUp, Globe, Database, RefreshCw } from 'lucide-react';

export default function About() {
  return (
    <>
      <SEO
        title="About Us"
        description="Learn about ShinyPull - the leading social media analytics platform for tracking YouTube, TikTok, Twitch, Kick, Bluesky, and Music artist statistics."
      />

      <div className="min-h-screen bg-[#0a0a0f] dot-grid">
        {/* Hero */}
        <div className="relative overflow-hidden border-b border-gray-800/60 py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-4xl font-extrabold text-gray-100 mb-4">About ShinyPull</h1>
            <p className="text-xl text-gray-400">
              Comprehensive social media analytics for creators and fans
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-sm p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-100 mb-4">What We Do</h2>
            <p className="text-gray-300 mb-4 leading-relaxed">
              ShinyPull tracks public statistics for content creators and music artists across YouTube, TikTok, Twitch, Kick, Bluesky, and Music (via Last.fm).
              We collect stats every day and store them as historical snapshots, so you can see exactly how channels and artists have grown over time.
            </p>
            <p className="text-gray-300 mb-4 leading-relaxed">
              Every chart on ShinyPull is built from real data collected at a real point in time. No estimates, no synthetic fills, no smoothing. If we missed a day, the chart shows a gap. We think that's more honest than showing made-up continuity.
            </p>
            <p className="text-gray-300 leading-relaxed">
              Everything on ShinyPull is free to browse. No account required to search creators, view charts, or check rankings.
            </p>
          </div>

          <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-sm p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-100 mb-4">Why We Built This</h2>
            <p className="text-gray-300 mb-4 leading-relaxed">
              The creator economy moves fast. Sponsorship deals, channel acquisitions, platform migrations, audience shifts. The people making decisions in this space need accurate data, not estimates from tools that haven't been updated in years.
            </p>
            <p className="text-gray-300 mb-4 leading-relaxed">
              We started building ShinyPull because we kept running into the same problem: existing analytics tools were either too expensive, too slow to update, or showing data that clearly didn't match what the platforms themselves were displaying. We figured we could do better.
            </p>
            <p className="text-gray-300 leading-relaxed">
              The result is a site that collects data multiple times per day, stores every snapshot, and presents it without editorializing. Subscriber counts are shown exactly as the platform provides them. We note known limitations (like YouTube's rounding policy) but we don't hide them or pretend they don't exist. The goal is transparency, not flattery.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {[
              { icon: Users, title: 'Live counts', text: 'Subscriber and follower counts updated multiple times per day.' },
              { icon: TrendingUp, title: 'Growth charts', text: 'Historical trends going back to when we first started tracking a creator.' },
              { icon: BarChart3, title: 'Rankings', text: 'Top creators by platform, updated daily with real numbers.' },
              { icon: Globe, title: 'Cross-platform', text: 'YouTube, TikTok, Twitch, Kick, Bluesky, and Music all in one place.' },
              { icon: Database, title: 'Stream tracking', text: 'Hours watched, peak viewers, and stream history for Twitch and Kick.' },
              { icon: RefreshCw, title: 'Always current', text: 'Automated collection runs around the clock. No stale data.' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-4 bg-gray-800/50 rounded-xl">
                <div className="w-10 h-10 bg-indigo-900/50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <item.icon className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <p className="font-semibold text-gray-100 mb-0.5">{item.title}</p>
                  <p className="text-sm text-gray-400">{item.text}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-sm p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-100 mb-4">Our Data</h2>
            <p className="text-gray-300 mb-4 leading-relaxed">
              All data shown on ShinyPull is publicly available. We collect stats using official platform APIs where
              they exist, and publicly available profile data for platforms that don't offer one. We never access
              private account information.
            </p>
            <p className="text-gray-300 leading-relaxed">
              Want to know exactly how collection works for each platform?{' '}
              <Link to="/methodology" className="text-indigo-400 hover:text-indigo-300 font-medium">
                Read our data methodology.
              </Link>
            </p>
          </div>

          <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-sm p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-100 mb-4">Contact</h2>
            <p className="text-gray-300 mb-4 leading-relaxed">
              Questions, feedback, or something looks wrong? We'd love to hear from you.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/contact"
                className="inline-flex items-center justify-center px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-colors text-sm"
              >
                Contact form
              </Link>
              <a
                href="mailto:shinypull@proton.me"
                className="inline-flex items-center justify-center px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-100 font-semibold rounded-xl transition-colors text-sm"
              >
                shinypull@proton.me
              </a>
            </div>
          </div>

          <div className="text-center text-sm text-gray-300 mt-8">
            <p>Copyright ©2026 ShinyPull</p>
          </div>
        </div>
      </div>
    </>
  );
}
