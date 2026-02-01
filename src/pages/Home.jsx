import { Link } from 'react-router-dom';
import { Search, Youtube, Twitch, Instagram } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';

const platforms = [
  { id: 'youtube', name: 'YouTube', icon: Youtube, color: 'bg-red-600', stats: '72M+ channels', available: true },
  { id: 'twitch', name: 'Twitch', icon: Twitch, color: 'bg-purple-600', stats: '7M+ channels', available: true },
  { id: 'tiktok', name: 'TikTok', icon: null, color: 'bg-pink-500', stats: 'Coming Soon', available: false },
  { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500', stats: 'Coming Soon', available: false },
];

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <>
      <SEO 
        title="Home"
        description="Track YouTube, Twitch, TikTok, Instagram & Twitter statistics. View subscriber counts, earnings estimates, rankings and growth analytics for your favorite creators."
        keywords="youtube statistics, twitch statistics, subscriber count, social blade alternative, creator analytics, earnings calculator"
      />
      <div className="min-h-[calc(100vh-73px)]">
        {/* Hero Section */}
        <section className="py-20 px-4 text-center bg-gradient-to-b from-gray-800 to-gray-900">
        <h1 className="text-5xl font-bold mb-4">
          Social Media <span className="text-blue-500">Statistics</span>
        </h1>
        <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
          Track followers, views, and growth for YouTube, Twitch, TikTok, and Instagram creators.
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for a creator (e.g., MrBeast, Ninja, PewDiePie)"
              className="w-full pl-12 pr-4 py-4 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-lg"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
            >
              Search
            </button>
          </div>
        </form>

        {/* Platform Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {platforms.map((platform) => {
            const content = (
              <>
                <div className={`w-12 h-12 ${platform.color} rounded-lg flex items-center justify-center mx-auto mb-3 ${!platform.available ? 'opacity-50' : ''}`}>
                  {platform.icon ? (
                    <platform.icon className="w-6 h-6 text-white" />
                  ) : (
                    <span className="text-white font-bold text-sm">{platform.name.slice(0, 2)}</span>
                  )}
                </div>
                <h3 className={`font-semibold mb-1 ${platform.available ? 'group-hover:text-blue-400' : ''} transition-colors`}>
                  {platform.name}
                </h3>
                <p className="text-sm text-gray-500">{platform.stats}</p>
              </>
            );

            if (platform.available) {
              return (
                <Link
                  key={platform.id}
                  to={`/rankings/${platform.id}`}
                  className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-colors group"
                >
                  {content}
                </Link>
              );
            }

            return (
              <div
                key={platform.id}
                className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-6 cursor-not-allowed opacity-60"
              >
                {content}
              </div>
            );
          })}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Track Creator Growth</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Search Creators</h3>
              <p className="text-gray-400">
                Find any creator across YouTube, Twitch, TikTok, and Instagram.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Track Growth</h3>
              <p className="text-gray-400">
                See daily, weekly, and monthly follower and view growth statistics.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Compare & Rank</h3>
              <p className="text-gray-400">
                Compare creators and see how they rank against others in their category.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
    </>
  );
}
