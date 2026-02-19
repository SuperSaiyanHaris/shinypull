import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calculator as CalcIcon, DollarSign, TrendingUp, Youtube, Search, Loader2, Info, ArrowRight, ExternalLink } from 'lucide-react';
import { searchChannels } from '../services/youtubeService';
import SEO from '../components/SEO';
import { formatNumber } from '../lib/utils';

const currencies = [
  { code: 'USD', symbol: '$', rate: 1 },
  { code: 'EUR', symbol: '€', rate: 0.92 },
  { code: 'GBP', symbol: '£', rate: 0.79 },
  { code: 'AUD', symbol: 'A$', rate: 1.53 },
  { code: 'CAD', symbol: 'C$', rate: 1.36 },
  { code: 'INR', symbol: '₹', rate: 83.12 },
  { code: 'JPY', symbol: '¥', rate: 149.50 },
  { code: 'BRL', symbol: 'R$', rate: 4.97 },
  { code: 'MXN', symbol: 'MX$', rate: 17.15 },
  { code: 'KRW', symbol: '₩', rate: 1320.50 },
  { code: 'PHP', symbol: '₱', rate: 55.80 },
  { code: 'IDR', symbol: 'Rp', rate: 15650 },
  { code: 'SGD', symbol: 'S$', rate: 1.34 },
  { code: 'NZD', symbol: 'NZ$', rate: 1.64 },
  { code: 'SEK', symbol: 'kr', rate: 10.42 },
  { code: 'CHF', symbol: 'CHF', rate: 0.88 },
];

// Default RPM range used by Social Blade
const DEFAULT_RPM_LOW = 0.25;
const DEFAULT_RPM_HIGH = 4.00;

export default function Calculator() {
  const [mode, setMode] = useState('creator'); // 'creator' or 'personal'
  const [dailyViews, setDailyViews] = useState(10000);
  const [rpmLow, setRpmLow] = useState(DEFAULT_RPM_LOW);
  const [rpmHigh, setRpmHigh] = useState(DEFAULT_RPM_HIGH);
  const [currency, setCurrency] = useState(currencies[0]);

  // Creator search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState(null);
  const [showResults, setShowResults] = useState(false);

  // Calculate earnings
  const calculateEarnings = (views, rpm) => {
    return (views / 1000) * rpm * currency.rate;
  };

  const dailyLow = calculateEarnings(dailyViews, rpmLow);
  const dailyHigh = calculateEarnings(dailyViews, rpmHigh);
  const monthlyLow = dailyLow * 30;
  const monthlyHigh = dailyHigh * 30;
  const yearlyLow = dailyLow * 365;
  const yearlyHigh = dailyHigh * 365;

  const formatCurrency = (amount) => {
    if (amount >= 1000000) {
      return `${currency.symbol}${(amount / 1000000).toFixed(2)}M`;
    } else if (amount >= 1000) {
      return `${currency.symbol}${(amount / 1000).toFixed(2)}K`;
    }
    return `${currency.symbol}${amount.toFixed(2)}`;
  };

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const results = await searchChannels(searchQuery, 5);
      setSearchResults(results);
      setShowResults(true);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  };

  const selectCreator = (creator) => {
    setSelectedCreator(creator);
    setShowResults(false);
    setSearchQuery('');

    // Calculate estimated daily views from total views / channel age
    if (creator.totalViews && creator.totalPosts > 0) {
      // Rough estimate: total views / (videos * 30 days average)
      const estimatedDailyViews = Math.round(creator.totalViews / (creator.totalPosts * 30));
      setDailyViews(Math.max(1000, Math.min(10000000, estimatedDailyViews)));
    }

    // Set RPM based on category/niche (estimated ranges)
    const category = creator.category?.toLowerCase() || '';
    if (category.includes('gaming') || category.includes('entertainment')) {
      setRpmLow(0.25);
      setRpmHigh(2.00);
    } else if (category.includes('finance') || category.includes('tech') || category.includes('business')) {
      setRpmLow(3.00);
      setRpmHigh(7.00);
    } else if (category.includes('education') || category.includes('how-to')) {
      setRpmLow(1.50);
      setRpmHigh(5.00);
    } else {
      // Default/general content
      setRpmLow(1.00);
      setRpmHigh(4.00);
    }
  };

  const clearCreator = () => {
    setSelectedCreator(null);
    setDailyViews(10000);
    setRpmLow(DEFAULT_RPM_LOW);
    setRpmHigh(DEFAULT_RPM_HIGH);
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    if (newMode === 'personal') {
      // Clear creator when switching to personal mode
      clearCreator();
    }
  };

  return (
    <>
      <SEO
        title="YouTube Money Calculator - Estimate Creator Earnings & Project Your Own"
        description="Estimate YouTube creator earnings from real data or project your own potential income. Calculate how much YouTubers make from ad revenue. Free YouTube income calculator with 16 currencies."
        keywords="youtube money calculator, youtube earnings calculator, how much do youtubers make, youtube income estimator, youtube revenue calculator, youtuber salary, youtube ad revenue, RPM calculator"
      />

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-100">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            <div className="max-w-4xl mx-auto text-center">
              <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2">
                <CalcIcon className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600" />
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">YouTube Money Calculator</h1>
              </div>
              <p className="text-base sm:text-lg text-gray-500 mb-6">
                {mode === 'creator'
                  ? 'Estimate a creator\'s earnings based on real data'
                  : 'Estimate your own potential earnings'}
              </p>

              {/* Mode Toggle */}
              <div className="inline-flex items-center gap-2 p-1 bg-gray-100 border border-gray-200 rounded-xl">
                <button
                  onClick={() => switchMode('creator')}
                  className={`px-4 sm:px-6 py-2 rounded-lg font-medium transition-all ${
                    mode === 'creator'
                      ? 'bg-gray-900 text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <span className="hidden sm:inline">Estimate a Creator</span>
                  <span className="sm:hidden">Creator</span>
                </button>
                <button
                  onClick={() => switchMode('personal')}
                  className={`px-4 sm:px-6 py-2 rounded-lg font-medium transition-all ${
                    mode === 'personal'
                      ? 'bg-gray-900 text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <span className="hidden sm:inline">Estimate My Earnings</span>
                  <span className="sm:hidden">Personal</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Creator Mode Helper - Shows at top on both mobile and desktop */}
            {mode === 'creator' && !selectedCreator && (
              <div className="order-1 lg:col-span-2">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-6">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-900 mb-1">Search for a Creator</h4>
                      <p className="text-sm text-blue-700">
                        Select a YouTube creator to see earnings estimates based on their real channel data.
                        We'll auto-populate daily views and RPM ranges based on their category and performance.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Input Section */}
            <div className="space-y-6 order-2 lg:col-start-1">
              {/* Creator Search - Only in Creator Mode */}
              {mode === 'creator' && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select YouTube Creator {selectedCreator && <span className="text-emerald-600 text-xs">(Data auto-populated)</span>}
                  </label>

                  {selectedCreator ? (
                  <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-xl">
                    <img
                      src={selectedCreator.profileImage}
                      alt={selectedCreator.displayName}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{selectedCreator.displayName}</p>
                      <p className="text-xs text-gray-500">{formatNumber(selectedCreator.subscribers)} subscribers</p>
                    </div>
                    <Link
                      to={`/youtube/${selectedCreator.username}`}
                      className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                    >
                      View Profile
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                    <button
                      onClick={clearCreator}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <span className="text-sm">Clear</span>
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <form onSubmit={handleSearch}>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onFocus={() => searchResults.length > 0 && setShowResults(true)}
                          placeholder="Search for a YouTube creator..."
                          className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                        {searching ? (
                          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                        ) : searchQuery.trim() && (
                          <button
                            type="submit"
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-emerald-500 hover:bg-emerald-600 rounded-lg flex items-center justify-center transition-colors"
                          >
                            <ArrowRight className="w-4 h-4 text-white" />
                          </button>
                        )}
                      </div>
                    </form>

                    {showResults && searchResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-64 overflow-y-auto">
                        {searchResults.map((result) => (
                          <button
                            key={result.platformId}
                            onClick={() => selectCreator(result)}
                            className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left"
                          >
                            <img
                              src={result.profileImage}
                              alt={result.displayName}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">{result.displayName}</p>
                              <p className="text-xs text-gray-500">{formatNumber(result.subscribers)} subs</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                </div>
              )}

              {/* Daily Views */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Daily Views
                  {mode === 'creator' && selectedCreator && (
                    <span className="ml-2 text-xs text-emerald-600">(Estimated from channel data)</span>
                  )}
                </label>
                <input
                  type="number"
                  value={dailyViews}
                  onChange={(e) => setDailyViews(Math.max(0, parseInt(e.target.value) || 0))}
                  disabled={mode === 'creator' && selectedCreator}
                  className={`w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 font-semibold text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent mb-3 ${
                    mode === 'creator' && selectedCreator ? 'bg-gray-100 cursor-not-allowed' : 'bg-gray-50'
                  }`}
                />
                <input
                  type="range"
                  min="1000"
                  max="10000000"
                  step="1000"
                  value={dailyViews}
                  onChange={(e) => setDailyViews(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1K</span>
                  <span className="font-semibold text-emerald-600">{formatNumber(dailyViews)}</span>
                  <span>10M</span>
                </div>
              </div>

              {/* RPM Range */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Estimated RPM (Revenue per 1000 views)
                  {mode === 'creator' && selectedCreator && (
                    <span className="ml-2 text-xs text-emerald-600">(Based on category)</span>
                  )}
                </label>
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Low</label>
                    <input
                      type="number"
                      step="0.01"
                      value={rpmLow}
                      onChange={(e) => setRpmLow(Math.max(0, parseFloat(e.target.value) || 0))}
                      disabled={mode === 'creator' && selectedCreator}
                      className={`w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        mode === 'creator' && selectedCreator ? 'bg-gray-100 cursor-not-allowed' : 'bg-gray-50'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">High</label>
                    <input
                      type="number"
                      step="0.01"
                      value={rpmHigh}
                      onChange={(e) => setRpmHigh(Math.max(rpmLow, parseFloat(e.target.value) || 0))}
                      disabled={mode === 'creator' && selectedCreator}
                      className={`w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        mode === 'creator' && selectedCreator ? 'bg-gray-100 cursor-not-allowed' : 'bg-gray-50'
                      }`}
                    />
                  </div>
                </div>
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                  <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">
                    {mode === 'creator' && selectedCreator
                      ? 'RPM estimated based on content category. Actual earnings vary by audience location and ad engagement.'
                      : 'RPM varies by niche, country, and ad engagement. The default range ($0.25 - $4.00) covers most creators. Gaming/entertainment tend to be lower, finance/tech higher.'}
                  </p>
                </div>
              </div>

              {/* Currency */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Currency
                </label>
                <select
                  value={currency.code}
                  onChange={(e) => setCurrency(currencies.find(c => c.code === e.target.value))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  {currencies.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} - {c.symbol}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Results Section */}
            <div className="space-y-4 order-3 lg:col-start-2">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-500" />
                  Estimated Earnings
                </h3>

                <div className="space-y-6">
                  {/* Daily */}
                  <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
                    <p className="text-sm text-gray-600 mb-1">Estimated Daily Earnings</p>
                    <p className="text-2xl font-bold text-emerald-600">
                      {formatCurrency(dailyLow)} - {formatCurrency(dailyHigh)}
                    </p>
                  </div>

                  {/* Monthly */}
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                    <p className="text-sm text-gray-600 mb-1">Estimated Monthly Earnings</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(monthlyLow)} - {formatCurrency(monthlyHigh)}
                    </p>
                  </div>

                  {/* Yearly */}
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                    <p className="text-sm text-gray-600 mb-1">Estimated Yearly Earnings</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {formatCurrency(yearlyLow)} - {formatCurrency(yearlyHigh)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Info Card */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h4 className="font-semibold text-gray-900 mb-3">How This Works</h4>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-1">•</span>
                    <span>Earnings = (Daily Views ÷ 1000) × RPM</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-1">•</span>
                    <span>RPM (Revenue Per Mille) varies based on content type, audience location, and ad rates</span>
                  </li>
                  {mode === 'creator' && (
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500 mt-1">•</span>
                      <span>Daily views estimated from channel's total views divided by video count and average video lifespan</span>
                    </li>
                  )}
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-1">•</span>
                    <span>These are estimates only. Actual earnings depend on many factors including watch time and ad engagement</span>
                  </li>
                  {mode === 'personal' && (
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500 mt-1">•</span>
                      <span className="font-medium">Adjust daily views and RPM to match your niche and expected performance</span>
                    </li>
                  )}
                </ul>
              </div>

              {/* Selected Creator Stats */}
              {selectedCreator && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Youtube className="w-5 h-5 text-red-500" />
                    {selectedCreator.displayName}'s Stats
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-500">Subscribers</p>
                      <p className="font-bold text-gray-900">{formatNumber(selectedCreator.subscribers)}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-500">Total Views</p>
                      <p className="font-bold text-gray-900">{formatNumber(selectedCreator.totalViews)}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-500">Videos</p>
                      <p className="font-bold text-gray-900">{formatNumber(selectedCreator.totalPosts)}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-500">Avg Views/Video</p>
                      <p className="font-bold text-gray-900">
                        {selectedCreator.totalPosts > 0
                          ? formatNumber(Math.round(selectedCreator.totalViews / selectedCreator.totalPosts))
                          : '-'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
