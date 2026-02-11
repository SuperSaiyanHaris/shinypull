import SEO from '../components/SEO';
import { Heart, Server, Code, Zap, Coffee } from 'lucide-react';

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
    description: 'Cover the costs of pulling real-time data from YouTube, Twitch, and Kick.',
  },
];

export default function Support() {
  return (
    <>
      <SEO
        title="Support ShinyPull"
        description="Help keep ShinyPull free and support the development of new features. Buy the developer a coffee!"
      />

      <div className="min-h-screen bg-gray-50">
        {/* Hero */}
        <div className="bg-gradient-to-br from-pink-500 to-orange-400 text-white py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Support ShinyPull</h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              ShinyPull is free to use for everyone. Your support helps keep it that way and funds new features.
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* Buy Me a Coffee CTA */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Buy Me a Coffee</h2>
            <p className="text-gray-600 mb-6 max-w-lg mx-auto">
              If you find ShinyPull useful, consider buying the developer a coffee. Every contribution helps keep the site running and growing.
            </p>
            <a
              href={BUYMEACOFFEE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-8 py-4 bg-[#FFDD00] text-gray-900 rounded-xl font-bold text-lg hover:bg-[#FFDD00]/90 transition-colors shadow-lg shadow-yellow-200/50 hover:shadow-xl hover:shadow-yellow-200/60"
            >
              <Coffee className="w-6 h-6" />
              Buy Me a Coffee
            </a>
          </div>

          {/* What your support goes toward */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Where Your Support Goes</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {supportReasons.map((reason) => (
                <div key={reason.title} className="text-center p-6 bg-gray-50 rounded-xl">
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <reason.icon className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{reason.title}</h3>
                  <p className="text-sm text-gray-600">{reason.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Other ways to support */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Other Ways to Help</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                <span className="text-2xl">📣</span>
                <div>
                  <h3 className="font-semibold text-gray-900">Spread the Word</h3>
                  <p className="text-sm text-gray-600">Share ShinyPull with friends, creators, or on social media.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                <span className="text-2xl">💡</span>
                <div>
                  <h3 className="font-semibold text-gray-900">Send Feedback</h3>
                  <p className="text-sm text-gray-600">Suggest features or report bugs to help us improve.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
