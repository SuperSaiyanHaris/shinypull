import SEO from '../components/SEO';
import { Link } from 'react-router-dom';
import { BarChart3, Users, TrendingUp, Globe } from 'lucide-react';

export default function About() {
  return (
    <>
      <SEO
        title="About Us"
        description="Learn about ShinyPull - the leading social media analytics platform for tracking YouTube, Twitch, and other creator statistics."
      />

      <div className="min-h-screen bg-[#0a0a0f]">
        {/* Hero */}
        <div className="border-b border-gray-800/60 py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-4xl font-extrabold text-gray-100 mb-4">About ShinyPull</h1>
            <p className="text-xl text-gray-400">
              Comprehensive social media analytics for creators and fans
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-sm p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-100 mb-4">Mission</h2>
            <p className="text-gray-300 mb-8 leading-relaxed">
              ShinyPull's mission is to collect and organize public data from as many public social media profiles
              as possible, updating daily, and present it in an accessible and understandable way. By providing
              global analytics for content creators, live streamers, and brands, we empower users with valuable
              insights into social media trends and performance. Whether you're tracking popular YouTube creators
              or aiming to join their ranks, ShinyPull is here to support you.
            </p>
            <p className="text-gray-300 mb-8 leading-relaxed">
              As creators ourselves, we built ShinyPull to meet our own needs, but from the beginning, our goal
              was to share our findings with the community. While we're just getting started, we have many more
              ideas we hope to explore as time goes on to continue helping the community.
            </p>

            <h2 className="text-2xl font-bold text-gray-100 mb-4">Data</h2>
            <p className="text-gray-300 mb-4 leading-relaxed">
              ShinyPull compiles data from YouTube, TikTok, Twitch, Kick, and Bluesky and uses the data to make
              statistical graphs and charts that track progress and growth. We include information such as
              estimated earnings and future projections, providing both numerical data and easy-to-read graphs.
              Statistics as well as top lists in various categories are available to anyone using our website.
            </p>
            <p className="text-gray-300 mb-8 leading-relaxed">
              All data shown on ShinyPull is <strong>publicly available information</strong>. We collect the same
              data anyone could obtain by visiting a creator's profile page and recording their statistics. We do
              not display or collect private information.
            </p>

            <h2 className="text-2xl font-bold text-gray-100 mb-4">What We Offer</h2>
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              {[
                { icon: Users, text: 'Real-time subscriber and follower counts' },
                { icon: TrendingUp, text: 'Historical growth tracking and trends' },
                { icon: BarChart3, text: 'Earnings estimates based on industry standards' },
                { icon: Globe, text: 'Rankings and leaderboards across platforms' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-xl">
                  <div className="w-10 h-10 bg-indigo-900/50 rounded-lg flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-indigo-400" />
                  </div>
                  <span className="text-gray-300">{item.text}</span>
                </div>
              ))}
            </div>

            <h2 className="text-2xl font-bold text-gray-100 mb-4">Data Sources</h2>
            <p className="text-gray-300 mb-8 leading-relaxed">
              In order to keep statistical data updated, ShinyPull utilizes API services of third parties
              including YouTube, TikTok, Twitch, Kick, and Bluesky. We only gather publicly available data from
              each of the API services, not anything private about your account. We collect statistics daily
              to provide accurate historical trends and growth analytics.
            </p>

            <h2 className="text-2xl font-bold text-gray-100 mb-4">Support</h2>
            <p className="text-gray-300 mb-8 leading-relaxed">
              ShinyPull provides support for our users through email. For questions about our service, please
              contact us at{' '}
              <a href="mailto:shinypull@proton.me" className="text-indigo-600 hover:text-indigo-300 font-medium">
                shinypull@proton.me
              </a>
            </p>

            <h2 className="text-2xl font-bold text-gray-100 mb-4">Future Goals</h2>
            <p className="text-gray-300 mb-8 leading-relaxed">
              ShinyPull is constantly looking towards the future, and how we can expand to report on more
              social media sites, provide better services to our users, and make data as accessible as possible.
            </p>

            <h2 className="text-2xl font-bold text-gray-100 mb-4">Contact Us</h2>
            <p className="text-gray-300">
              Have questions or feedback?{' '}
              <Link to="/contact" className="text-indigo-600 hover:text-indigo-300 font-medium">
                Get in touch
              </Link>{' '}
              with our team or email us at{' '}
              <a href="mailto:shinypull@proton.me" className="text-indigo-600 hover:text-indigo-300 font-medium">
                shinypull@proton.me
              </a>
            </p>
          </div>

          <div className="text-center text-sm text-gray-300 mt-8">
            <p>Copyright ©2026 ShinyPull</p>
          </div>
        </div>
      </div>
    </>
  );
}
