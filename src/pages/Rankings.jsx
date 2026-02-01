import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Youtube, Twitch, Instagram, Twitter, TrendingUp, Users, Eye } from 'lucide-react';

const platforms = [
  { id: 'youtube', name: 'YouTube', icon: Youtube, color: 'bg-red-600' },
  { id: 'twitch', name: 'Twitch', icon: Twitch, color: 'bg-purple-600' },
  { id: 'tiktok', name: 'TikTok', icon: null, color: 'bg-pink-500' },
  { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500' },
  { id: 'twitter', name: 'Twitter/X', icon: Twitter, color: 'bg-sky-500' },
];

const rankTypes = [
  { id: 'subscribers', name: 'Top by Subscribers', icon: Users },
  { id: 'views', name: 'Top by Views', icon: Eye },
  { id: 'growth', name: 'Fastest Growing', icon: TrendingUp },
];

export default function Rankings() {
  const { platform: urlPlatform } = useParams();
  const [selectedPlatform, setSelectedPlatform] = useState(urlPlatform || 'youtube');
  const [selectedRankType, setSelectedRankType] = useState('subscribers');

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Creator Rankings</h1>

      {/* Platform Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {platforms.map((platform) => {
          const Icon = platform.icon;
          return (
            <button
              key={platform.id}
              onClick={() => setSelectedPlatform(platform.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedPlatform === platform.id
                  ? platform.color + ' text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {Icon && <Icon className="w-5 h-5" />}
              {platform.name}
            </button>
          );
        })}
      </div>

      {/* Rank Type Tabs */}
      <div className="flex gap-4 mb-8 border-b border-gray-700">
        {rankTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => setSelectedRankType(type.id)}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              selectedRankType === type.id
                ? 'border-blue-500 text-white'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            <type.icon className="w-5 h-5" />
            {type.name}
          </button>
        ))}
      </div>

      {/* Rankings Table */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700 text-left text-gray-400 text-sm">
              <th className="px-4 py-3 w-16">Rank</th>
              <th className="px-4 py-3">Creator</th>
              <th className="px-4 py-3 text-right">Subscribers</th>
              <th className="px-4 py-3 text-right">Views</th>
              <th className="px-4 py-3 text-right">30-Day Growth</th>
            </tr>
          </thead>
          <tbody>
            {/* Placeholder rows - will be populated from Supabase */}
            <tr>
              <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                <p className="mb-2">No ranking data available yet</p>
                <p className="text-sm">
                  Rankings will appear here once creators are tracked
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
