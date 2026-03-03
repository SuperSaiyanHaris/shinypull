import { Link } from 'react-router-dom';
import { Server, Code, Zap, Coffee, Megaphone, MessageSquare, ArrowRight } from 'lucide-react';
import SEO from '../components/SEO';

const BUYMEACOFFEE_URL = 'https://buymeacoffee.com/shinypull';
const TWITTER_SHARE_URL = 'https://twitter.com/intent/tweet?text=Check%20out%20ShinyPull%20%E2%80%94%20free%20creator%20analytics%20for%20YouTube%2C%20Twitch%2C%20TikTok%2C%20Kick%2C%20and%20Bluesky.&url=https%3A%2F%2Fshinypull.com';

const BMCButton = ({ size = 'lg' }) => (
  <a
    href={BUYMEACOFFEE_URL}
    target="_blank"
    rel="noopener noreferrer"
    className={`inline-flex items-center gap-3 bg-[#FFDD00] text-gray-900 rounded-xl font-bold transition-all duration-200 shadow-lg shadow-yellow-500/20 hover:bg-yellow-300 hover:shadow-xl hover:shadow-yellow-500/30 hover:-translate-y-1 ${
      size === 'lg' ? 'px-8 py-4 text-lg' : 'px-6 py-3 text-base'
    }`}
  >
    <Coffee className={size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'} />
    Buy Me a Coffee
  </a>
);

const supportReasons = [
  {
    icon: Server,
    title: 'Hosting',
    description: 'Servers that stay up 24/7. Fast response times. No downtime during traffic spikes.',
    color: 'from-indigo-500 to-blue-600',
    shadow: 'shadow-indigo-500/30',
  },
  {
    icon: Code,
    title: 'New Features',
    description: 'More platforms, better charts, new tools. Every feature starts with funded dev time.',
    color: 'from-violet-500 to-purple-600',
    shadow: 'shadow-violet-500/30',
  },
  {
    icon: Zap,
    title: 'API Costs',
    description: 'Real data costs real money. YouTube, Twitch, Kick, TikTok, and Bluesky all have API costs.',
    color: 'from-amber-500 to-orange-500',
    shadow: 'shadow-amber-500/30',
  },
];

export default function Support() {
  return (
    <>
      <SEO
        title="Support ShinyPull"
        description="Help keep ShinyPull free and support the development of new features. Buy the developer a coffee!"
      />

      <div className="min-h-screen bg-[#0a0a0f] dot-grid">
        {/* Hero */}
        <div className="relative overflow-hidden border-b border-gray-800/60">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-rose-950/40 to-transparent" />
          <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-[500px] h-72 bg-rose-500/5 rounded-full blur-3xl" />
          <div className="max-w-4xl mx-auto px-4 py-14 sm:py-20 text-center relative">
            {/* Impact stat chip */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-full text-rose-400 text-sm font-semibold mb-6">
              500+ creators tracked &middot; 5 platforms &middot; always free
            </div>

            <div className="w-14 h-14 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-rose-500/30">
              <Coffee className="w-7 h-7 text-white" />
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-100 mb-4">
              Keep ShinyPull Free
            </h1>
            <p className="text-lg sm:text-xl text-gray-400 max-w-xl mx-auto mb-8">
              ShinyPull runs on real API data. Not estimates, not guesses. Someone has to pay for that.
              If the site's saved you time, this is how you give back.
            </p>

            <BMCButton size="lg" />
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">

          {/* Where support goes */}
          <div>
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest text-center mb-5">Where your support goes</p>
            <div className="grid md:grid-cols-3 gap-4">
              {supportReasons.map((reason) => (
                <div key={reason.title} className="group bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-2xl p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl">
                  <div className={`w-12 h-12 bg-gradient-to-br ${reason.color} rounded-xl flex items-center justify-center mb-4 shadow-lg ${reason.shadow}`}>
                    <reason.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-100 mb-1.5">{reason.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{reason.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Other ways — with real linked CTAs */}
          <div className="grid sm:grid-cols-2 gap-4">
            <a
              href={TWITTER_SHARE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start gap-4 bg-gray-900 border border-gray-800 hover:border-sky-600/50 rounded-2xl p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-sky-500/5"
            >
              <div className="w-11 h-11 bg-gradient-to-br from-sky-500 to-cyan-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-sky-500/30 group-hover:scale-105 transition-transform duration-300">
                <Megaphone className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-100 mb-1">Share ShinyPull</h3>
                <p className="text-sm text-gray-400">Post about it on X. Tell a creator friend. Every new user helps justify the server bill.</p>
                <span className="inline-flex items-center gap-1 mt-3 text-sm font-semibold text-sky-400 group-hover:gap-2 transition-all duration-200">
                  Share on X <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </a>

            <Link
              to="/contact"
              className="group flex items-start gap-4 bg-gray-900 border border-gray-800 hover:border-violet-600/50 rounded-2xl p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet-500/5"
            >
              <div className="w-11 h-11 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-violet-500/30 group-hover:scale-105 transition-transform duration-300">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-100 mb-1">Send Feedback</h3>
                <p className="text-sm text-gray-400">Bug report, feature idea, creator request. Good feedback shapes what gets built next.</p>
                <span className="inline-flex items-center gap-1 mt-3 text-sm font-semibold text-violet-400 group-hover:gap-2 transition-all duration-200">
                  Contact us <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          </div>

          {/* Closing CTA — mirrors the hero, circles back to the action */}
          <div className="relative overflow-hidden bg-gray-900 border border-yellow-500/20 rounded-2xl p-8 sm:p-10 text-center">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-yellow-500/5 to-transparent rounded-2xl" />
            <div className="relative">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Still thinking about it?</p>
              <p className="text-lg sm:text-xl font-semibold text-gray-200 mb-2">
                Creator analytics should be free for everyone.
              </p>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                One coffee funds a week of API calls. The data never stops. Your support makes sure neither do we.
              </p>
              <BMCButton size="lg" />
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
