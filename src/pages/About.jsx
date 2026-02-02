import SEO from '../components/SEO';
import { Link } from 'react-router-dom';
import { BarChart3, Users, TrendingUp, Globe } from 'lucide-react';

export default function About() {
  return (
    <>
      <SEO
        title="About Us"
        description="Learn about Shiny Pull - the leading social media analytics platform for tracking YouTube, Twitch, and other creator statistics."
      />

      <div className="min-h-screen bg-gray-50">
        {/* Hero */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-4xl font-bold mb-4">About ShinyPull</h1>
            <p className="text-xl text-indigo-100">
              Real-time social media analytics for creators and fans
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-8">
            <p className="text-lg text-gray-600 leading-relaxed mb-8">
              ShinyPull is a comprehensive social media analytics platform that provides real-time statistics
              and insights for content creators across multiple platforms including YouTube, Twitch, TikTok,
              Instagram, and Twitter.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
            <p className="text-gray-600 mb-8 leading-relaxed">
              We believe in transparency and accessibility of social media data. Our mission is to empower
              creators, marketers, and fans with accurate, up-to-date analytics to make informed decisions
              and track growth across platforms.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">What We Offer</h2>
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              {[
                { icon: Users, text: 'Real-time subscriber and follower counts' },
                { icon: TrendingUp, text: 'Historical growth tracking and trends' },
                { icon: BarChart3, text: 'Earnings estimates based on industry standards' },
                { icon: Globe, text: 'Rankings and leaderboards across platforms' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-indigo-600" />
                  </div>
                  <span className="text-gray-700">{item.text}</span>
                </div>
              ))}
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Sources</h2>
            <p className="text-gray-600 mb-8 leading-relaxed">
              All data is collected directly from official platform APIs including YouTube Data API v3
              and Twitch Helix API. We collect statistics daily to provide accurate historical trends
              and growth analytics.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-gray-600">
              Have questions or feedback?{' '}
              <Link to="/contact" className="text-indigo-600 hover:text-indigo-700 font-medium">
                Get in touch
              </Link>{' '}
              with our team.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
