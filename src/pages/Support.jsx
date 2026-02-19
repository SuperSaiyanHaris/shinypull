import SEO from '../components/SEO';
import { Heart, Server, Code, Zap, Coffee, Target, Database, RefreshCw } from 'lucide-react';

const BUYMEACOFFEE_URL = 'https://buymeacoffee.com/shinypull';

const supportReasons = [
  {
    icon: Server,
    title: 'Hosting & Infrastructure',
    description: 'Keep the servers running 24/7 with fast, reliable performance for everyone.',
  },
  {
    icon: Code,
    title: 'New Features',
    description: 'Fund development of new tools, platforms, and analytics features.',
  },
  {
    icon: Zap,
    title: 'API Costs',
    description: 'Cover the costs of pulling real-time data across all supported platforms.',
  },
];

export default function Support() {
  return (
    <>
      <SEO
        title="Support ShinyPull"
        description="Help keep ShinyPull free and support the development of new features. Buy the developer a coffee!"
      />

      <div className="min-h-screen bg-gray-800/50">
        {/* Hero */}
        <div className="bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900 border-b border-gray-800 text-white py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <div className="w-16 h-16 bg-indigo-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-indigo-500/30">
              <Heart className="w-8 h-8 text-indigo-400" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Support ShinyPull</h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              ShinyPull is free to use for everyone. Your support helps keep it that way and funds new features.
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* Buy Me a Coffee CTA */}
          <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-sm p-8 mb-8 text-center">
            <h2 className="text-2xl font-bold text-gray-100 mb-3">Buy Me a Coffee</h2>
            <p className="text-gray-300 mb-6 max-w-lg mx-auto">
              If you find ShinyPull useful, consider buying the developer a coffee. Every contribution helps keep the site running and growing.
            </p>
            <a
              href={BUYMEACOFFEE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-8 py-4 bg-[#FFDD00] text-gray-900 rounded-xl font-bold text-lg hover:bg-yellow-300 transition-colors shadow-lg shadow-yellow-500/20 hover:shadow-xl hover:shadow-yellow-500/30"
            >
              <Coffee className="w-6 h-6" />
              Buy Me a Coffee
            </a>
          </div>

          {/* What your support goes toward */}
          <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-sm p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-100 mb-6 text-center">Where Your Support Goes</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {supportReasons.map((reason) => (
                <div key={reason.title} className="text-center p-6 bg-gray-800/50 rounded-xl">
                  <div className="w-12 h-12 bg-indigo-900/50 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <reason.icon className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h3 className="font-semibold text-gray-100 mb-2">{reason.title}</h3>
                  <p className="text-sm text-gray-300">{reason.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Other ways to support */}
          <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-sm p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-100 mb-4 text-center">Other Ways to Help</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 bg-gray-800/50 rounded-xl">
                <span className="text-2xl">📣</span>
                <div>
                  <h3 className="font-semibold text-gray-100">Spread the Word</h3>
                  <p className="text-sm text-gray-300">Share ShinyPull with friends, creators, or on social media.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-gray-800/50 rounded-xl">
                <span className="text-2xl">💡</span>
                <div>
                  <h3 className="font-semibold text-gray-100">Send Feedback</h3>
                  <p className="text-sm text-gray-300">Suggest features or report bugs to help us improve.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Mission Statement & Data Transparency */}
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Target className="w-6 h-6 text-indigo-600" />
              <h2 className="text-2xl font-bold text-gray-100">Our Mission</h2>
            </div>
            <p className="text-gray-400 text-center max-w-2xl mx-auto mb-8">
              Creator analytics should be open, honest, and accessible to everyone. We built ShinyPull because that wasn't always the case.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-800/60 rounded-xl p-6 border border-gray-700/50">
                <div className="flex items-start gap-3">
                  <Database className="w-6 h-6 text-indigo-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-100 mb-2">Accurate Data</h3>
                    <p className="text-sm text-gray-400">
                      Every number on ShinyPull comes from the source. We don't estimate, interpolate, or fill gaps with guesses. If the data isn't reliable, we don't show it.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/60 rounded-xl p-6 border border-gray-700/50">
                <div className="flex items-start gap-3">
                  <RefreshCw className="w-6 h-6 text-indigo-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-100 mb-2">Always Current</h3>
                    <p className="text-sm text-gray-400">
                      Stats are refreshed continuously so the growth trends you're seeing reflect what's actually happening, not a stale snapshot from last week.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
