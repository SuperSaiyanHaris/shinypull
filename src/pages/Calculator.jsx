import { useState, useEffect, useRef } from 'react';
import { Link, useNavigationType, useNavigate, useSearchParams } from 'react-router-dom';
import { Calculator as CalcIcon, DollarSign, Youtube, Search, Loader2, Info, ArrowRight, ExternalLink, Pencil, X, Check, Link2, Database, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { searchChannels } from '../services/youtubeService';
import { supabase } from '../lib/supabase';
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

const DEFAULT_RPM_LOW = 0.25;
const DEFAULT_RPM_HIGH = 4.00;

// Logarithmic slider: internal range 0–1000 maps to 1K–10M
const LOG_MIN = 3;   // log10(1,000)
const LOG_MAX = 7;   // log10(10,000,000)
const SLIDER_STEPS = 1000;
const viewsToSlider = (v) =>
  Math.round((Math.log10(Math.max(1000, v)) - LOG_MIN) / (LOG_MAX - LOG_MIN) * SLIDER_STEPS);
const sliderToViews = (pos) =>
  Math.round(Math.pow(10, LOG_MIN + (pos / SLIDER_STEPS) * (LOG_MAX - LOG_MIN)));

const TIER_THRESHOLDS = [
  { label: 'Small Channel',    range: '< $500/mo',          min: 0,      max: 500,    color: 'text-gray-400',    bg: 'bg-gray-800/50',    border: 'border-gray-700' },
  { label: 'Growing',          range: '$500 \u2013 $2K/mo',      min: 500,    max: 2000,   color: 'text-blue-400',    bg: 'bg-blue-950/30',    border: 'border-blue-700/40' },
  { label: 'Full-Time Viable', range: '$2K \u2013 $10K/mo',      min: 2000,   max: 10000,  color: 'text-emerald-400', bg: 'bg-emerald-950/30', border: 'border-emerald-700/40' },
  { label: 'Established',      range: '$10K \u2013 $100K/mo',    min: 10000,  max: 100000, color: 'text-purple-400',  bg: 'bg-purple-950/30',  border: 'border-purple-700/40' },
  { label: 'Top 1%',           range: '$100K+/mo',          min: 100000, max: Infinity, color: 'text-yellow-400', bg: 'bg-yellow-950/30',  border: 'border-yellow-700/40' },
];

const getEarningsTier = (monthlyUSD) =>
  TIER_THRESHOLDS.find(t => monthlyUSD >= t.min && monthlyUSD < t.max) || TIER_THRESHOLDS[0];

export default function Calculator() {
  const navigationType = useNavigationType();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Initialize state from URL params if present
  const [mode, setMode] = useState(
    searchParams.get('mode') === 'personal' ? 'personal' : 'creator'
  );
  const [dailyViews, setDailyViews] = useState(
    Math.max(1000, Math.min(10000000, parseInt(searchParams.get('views')) || 10000))
  );
  const [rpmLow, setRpmLow] = useState(
    parseFloat(searchParams.get('rpm_low')) || DEFAULT_RPM_LOW
  );
  const [rpmHigh, setRpmHigh] = useState(
    parseFloat(searchParams.get('rpm_high')) || DEFAULT_RPM_HIGH
  );
  const [currency, setCurrency] = useState(
    currencies.find(c => c.code === searchParams.get('currency')) || currencies[0]
  );
  const [overrideEnabled, setOverrideEnabled] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [showTierTooltip, setShowTierTooltip] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Creator search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState(null);
  const [showResults, setShowResults] = useState(false);

  // Skip first URL sync (state was already seeded from URL)
  const isFirstRender = useRef(true);

  // Restore state when user hits Back
  useEffect(() => {
    if (navigationType === 'POP') {
      try {
        const saved = sessionStorage.getItem('calc_state');
        if (saved) {
          const state = JSON.parse(saved);
          if (state.selectedCreator) setSelectedCreator(state.selectedCreator);
          if (state.dailyViews) setDailyViews(state.dailyViews);
          if (state.rpmLow) setRpmLow(state.rpmLow);
          if (state.rpmHigh) setRpmHigh(state.rpmHigh);
        }
      } catch {}
    }
  }, []);

  // Sync state to URL (debounced, skip first render)
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      params.set('mode', mode);
      params.set('views', dailyViews);
      params.set('rpm_low', rpmLow);
      params.set('rpm_high', rpmHigh);
      if (currency.code !== 'USD') params.set('currency', currency.code);
      navigate(`?${params.toString()}`, { replace: true });
    }, 400);
    return () => clearTimeout(timer);
  }, [mode, dailyViews, rpmLow, rpmHigh, currency]);

  // Persist creator state to sessionStorage
  useEffect(() => {
    if (selectedCreator) {
      sessionStorage.setItem('calc_state', JSON.stringify({ selectedCreator, dailyViews, rpmLow, rpmHigh }));
    } else {
      sessionStorage.removeItem('calc_state');
    }
  }, [selectedCreator, dailyViews, rpmLow, rpmHigh]);

  // Reset override when creator changes
  useEffect(() => { setOverrideEnabled(false); }, [selectedCreator]);

  // Earnings math
  const calc = (views, rpm) => (views / 1000) * rpm * currency.rate;
  const dailyLow = calc(dailyViews, rpmLow);
  const dailyHigh = calc(dailyViews, rpmHigh);
  const monthlyLow = dailyLow * 30;
  const monthlyHigh = dailyHigh * 30;
  const yearlyLow = dailyLow * 365;
  const yearlyHigh = dailyHigh * 365;

  // Tier: always in USD regardless of selected currency
  const monthlyMidUSD = ((dailyViews / 1000) * ((rpmLow + rpmHigh) / 2)) * 30;
  const tier = getEarningsTier(monthlyMidUSD);

  const formatCurrency = (amount) => {
    if (amount >= 1000000) return `${currency.symbol}${(amount / 1000000).toFixed(2)}M`;
    if (amount >= 1000)    return `${currency.symbol}${(amount / 1000).toFixed(1)}K`;
    return `${currency.symbol}${amount.toFixed(2)}`;
  };

  // Stacked bar chart: base = low, range = high-low (shows the uncertainty band)
  const chartData = [
    { period: 'Daily',   base: Math.round(dailyLow),   range: Math.round(dailyHigh - dailyLow),   low: dailyLow,   high: dailyHigh,   color: '#10b981' },
    { period: 'Monthly', base: Math.round(monthlyLow), range: Math.round(monthlyHigh - monthlyLow), low: monthlyLow, high: monthlyHigh, color: '#60a5fa' },
    { period: 'Yearly',  base: Math.round(yearlyLow),  range: Math.round(yearlyHigh - yearlyLow),  low: yearlyLow,  high: yearlyHigh,  color: '#c084fc' },
  ];

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

  const selectCreator = async (creator) => {
    setSelectedCreator(creator);
    setShowResults(false);
    setSearchQuery('');
    setOverrideEnabled(false);

    const category = creator.category?.toLowerCase() || '';
    let newRpmLow, newRpmHigh;
    if (category.includes('finance') || category.includes('tech') || category.includes('business')) {
      newRpmLow = 3.00; newRpmHigh = 7.00;
    } else if (category.includes('education') || category.includes('how-to')) {
      newRpmLow = 1.50; newRpmHigh = 5.00;
    } else {
      newRpmLow = 2.00; newRpmHigh = 7.00;
    }
    setRpmLow(newRpmLow);
    setRpmHigh(newRpmHigh);

    let gotRealViews = false;
    if (creator.platformId) {
      try {
        const { data: dbCreator } = await supabase
          .from('creators').select('id')
          .eq('platform', 'youtube').eq('platform_id', creator.platformId).single();

        if (dbCreator) {
          const { data: recentStats } = await supabase
            .from('creator_stats').select('total_views, recorded_at')
            .eq('creator_id', dbCreator.id)
            .order('recorded_at', { ascending: false }).limit(14);

          if (recentStats && recentStats.length >= 2) {
            const latest = recentStats[0];
            const oldest = recentStats[recentStats.length - 1];
            const days = Math.max(1, Math.round(
              (new Date(latest.recorded_at) - new Date(oldest.recorded_at)) / (1000 * 60 * 60 * 24)
            ));
            const realDailyViews = Math.round((latest.total_views - oldest.total_views) / days);
            if (realDailyViews > 0) {
              setDailyViews(Math.max(1000, Math.min(10000000, realDailyViews)));
              gotRealViews = true;
            }
          }
        }
      } catch (err) {
        console.error('DB lookup failed:', err);
      }
    }

    if (!gotRealViews && creator.totalViews && creator.totalPosts > 0) {
      const estimatedDailyViews = Math.round(creator.totalViews / (creator.totalPosts * 365));
      setDailyViews(Math.max(1000, Math.min(10000000, estimatedDailyViews)));
    }
  };

  const clearCreator = () => {
    setSelectedCreator(null);
    setDailyViews(10000);
    setRpmLow(DEFAULT_RPM_LOW);
    setRpmHigh(DEFAULT_RPM_HIGH);
    setOverrideEnabled(false);
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    if (newMode === 'personal') clearCreator();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const isLocked = mode === 'creator' && !!selectedCreator && !overrideEnabled;
  const sliderPct = (viewsToSlider(dailyViews) / SLIDER_STEPS) * 100;

  return (
    <>
      <SEO
        title="YouTube Money Calculator - Estimate Creator Earnings & Project Your Own"
        description="Estimate YouTube creator earnings from real data or project your own potential income. Calculate how much YouTubers make from ad revenue. Free YouTube income calculator with 16 currencies."
        keywords="youtube money calculator, youtube earnings calculator, how much do youtubers make, youtube income estimator, youtube revenue calculator, youtuber salary, youtube ad revenue, RPM calculator"
      />

      {/* Custom slider styles — cross-browser dark theme */}
      <style>{`
        .calc-slider { -webkit-appearance: none; appearance: none; height: 6px; border-radius: 3px; outline: none; cursor: pointer; width: 100%; }
        .calc-slider:disabled { cursor: not-allowed; opacity: 0.35; }
        .calc-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 20px; height: 20px; border-radius: 50%; background: #10b981; cursor: pointer; box-shadow: 0 0 0 3px rgba(16,185,129,0.2); border: 2px solid #064e3b; transition: box-shadow 0.15s; }
        .calc-slider:not(:disabled)::-webkit-slider-thumb:hover { box-shadow: 0 0 0 6px rgba(16,185,129,0.25); }
        .calc-slider::-moz-range-thumb { width: 20px; height: 20px; border-radius: 50%; background: #10b981; cursor: pointer; box-shadow: 0 0 0 3px rgba(16,185,129,0.2); border: 2px solid #064e3b; }
        .calc-slider::-moz-range-track { height: 6px; background: #374151; border-radius: 3px; }
        .calc-slider::-moz-range-progress { height: 6px; background: #10b981; border-radius: 3px; }
      `}</style>

      <div className="min-h-screen bg-[#0a0a0f] dot-grid">
        {/* Header */}
        <div className="relative overflow-hidden border-b border-gray-800/60">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-emerald-950/20 to-transparent" />
          <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-[400px] h-64 bg-emerald-500/5 rounded-full blur-3xl" />
          <div className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative">
            <div className="max-w-4xl mx-auto text-center">
              <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2">
                <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30 flex-shrink-0">
                  <CalcIcon className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-100">YouTube Money Calculator</h1>
              </div>
              <p className="text-base sm:text-lg text-gray-400 mb-6">
                {mode === 'creator' ? "Estimate a creator's earnings using real channel data" : 'Project your own potential YouTube income'}
              </p>

              {/* Mode Toggle */}
              <div className="inline-flex items-center gap-2 p-1 bg-gray-800 border border-gray-700 rounded-xl">
                <button
                  onClick={() => switchMode('creator')}
                  className={`px-4 sm:px-6 py-2 rounded-lg font-medium transition-all text-sm sm:text-base ${mode === 'creator' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-300 hover:text-gray-100'}`}
                >
                  <span className="hidden sm:inline">Estimate a Creator</span>
                  <span className="sm:hidden">Creator</span>
                </button>
                <button
                  onClick={() => switchMode('personal')}
                  className={`px-4 sm:px-6 py-2 rounded-lg font-medium transition-all text-sm sm:text-base ${mode === 'personal' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-300 hover:text-gray-100'}`}
                >
                  <span className="hidden sm:inline">Estimate My Earnings</span>
                  <span className="sm:hidden">My Earnings</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8 pb-28 lg:pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Dismissible info banner */}
            {mode === 'creator' && !selectedCreator && !bannerDismissed && (
              <div className="order-1 lg:col-span-2">
                <div className="flex items-center gap-3 bg-indigo-950/40 rounded-xl border border-indigo-700/40 px-4 py-3">
                  <Info className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <p className="text-sm text-gray-300 flex-1">
                    Search for a creator to auto-populate their real daily views and category RPM.
                  </p>
                  <button onClick={() => setBannerDismissed(true)} className="p-1 text-gray-500 hover:text-gray-300 transition-colors flex-shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ── INPUT COLUMN ── */}
            <div className="space-y-5 order-2 lg:col-start-1">

              {/* Creator Search */}
              {mode === 'creator' && (
                <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-sm p-6">
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Select YouTube Creator
                    {selectedCreator && <span className="ml-2 text-xs text-emerald-400">(data auto-populated)</span>}
                  </label>

                  {selectedCreator ? (
                    <div className="flex items-center gap-3 p-3 bg-gray-800/50 border border-gray-700 rounded-xl">
                      <img src={selectedCreator.profileImage} alt={selectedCreator.displayName} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-100 truncate">{selectedCreator.displayName}</p>
                        <p className="text-xs text-gray-400">{formatNumber(selectedCreator.subscribers)} subscribers</p>
                      </div>
                      <Link
                        to={`/youtube/${selectedCreator.username}`}
                        className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors px-2 py-1 rounded-lg hover:bg-emerald-950/30 flex-shrink-0"
                      >
                        Profile <ExternalLink className="w-3 h-3" />
                      </Link>
                      <button onClick={clearCreator} className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-950/30 transition-colors flex-shrink-0" title="Clear creator">
                        <X className="w-4 h-4" />
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
                            className="w-full pl-10 pr-10 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          />
                          {searching ? (
                            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                          ) : searchQuery.trim() && (
                            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-emerald-500 hover:bg-emerald-600 rounded-lg flex items-center justify-center transition-colors">
                              <ArrowRight className="w-4 h-4 text-white" />
                            </button>
                          )}
                        </div>
                      </form>

                      {showResults && searchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-gray-700 rounded-xl shadow-xl z-10 max-h-64 overflow-y-auto">
                          {searchResults.map((result) => (
                            <button key={result.platformId} onClick={() => selectCreator(result)} className="w-full flex items-center gap-3 p-3 hover:bg-gray-800/50 transition-colors text-left">
                              <img src={result.profileImage} alt={result.displayName} className="w-10 h-10 rounded-lg object-cover" />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-100 truncate">{result.displayName}</p>
                                <p className="text-xs text-gray-400">{formatNumber(result.subscribers)} subs</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Creator stats — INPUT CONTEXT, lives in left column */}
              {selectedCreator && (
                <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-sm p-6">
                  <h4 className="font-semibold text-gray-100 mb-3 flex items-center gap-2">
                    <Youtube className="w-4 h-4 text-red-500" />
                    {selectedCreator.displayName}'s Stats
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-gray-800/50 rounded-xl">
                      <p className="text-xs text-gray-400">Subscribers</p>
                      <p className="font-bold text-gray-100">{formatNumber(selectedCreator.subscribers)}</p>
                    </div>
                    <div className="p-3 bg-gray-800/50 rounded-xl">
                      <p className="text-xs text-gray-400">Total Views</p>
                      <p className="font-bold text-gray-100">{formatNumber(selectedCreator.totalViews)}</p>
                    </div>
                    <div className="p-3 bg-gray-800/50 rounded-xl">
                      <p className="text-xs text-gray-400">Videos</p>
                      <p className="font-bold text-gray-100">{formatNumber(selectedCreator.totalPosts)}</p>
                    </div>
                    <div className="p-3 bg-gray-800/50 rounded-xl">
                      <p className="text-xs text-gray-400">Avg Views / Video</p>
                      <p className="font-bold text-gray-100">
                        {selectedCreator.totalPosts > 0
                          ? formatNumber(Math.round(selectedCreator.totalViews / selectedCreator.totalPosts))
                          : '—'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Daily Views */}
              <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-sm p-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-300">
                    Daily Views
                    {isLocked && <span className="ml-2 text-xs text-emerald-400">(from channel data)</span>}
                    {overrideEnabled && <span className="ml-2 text-xs text-amber-400">(custom)</span>}
                  </label>
                  {mode === 'creator' && selectedCreator && (
                    <button
                      onClick={() => setOverrideEnabled(!overrideEnabled)}
                      className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                        overrideEnabled
                          ? 'bg-amber-950/40 text-amber-400 border border-amber-700/50 hover:bg-amber-950/60'
                          : 'bg-gray-800 text-gray-400 hover:text-gray-200 border border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <Pencil className="w-3 h-3" />
                      {overrideEnabled ? 'Custom values' : 'Edit'}
                    </button>
                  )}
                </div>
                <input
                  type="number"
                  value={dailyViews}
                  onChange={(e) => setDailyViews(Math.max(1000, parseInt(e.target.value) || 1000))}
                  disabled={isLocked}
                  className={`w-full px-4 py-3 border border-gray-700 rounded-xl text-gray-100 font-semibold text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent mb-4 transition-colors ${
                    isLocked ? 'bg-gray-800 cursor-not-allowed text-gray-400' : 'bg-gray-800/50'
                  }`}
                />
                <input
                  type="range"
                  min="0"
                  max={SLIDER_STEPS}
                  step="1"
                  value={viewsToSlider(dailyViews)}
                  onChange={(e) => !isLocked && setDailyViews(sliderToViews(parseInt(e.target.value)))}
                  disabled={isLocked}
                  className="calc-slider"
                  style={{
                    background: isLocked
                      ? '#374151'
                      : `linear-gradient(to right, #10b981 0%, #10b981 ${sliderPct}%, #374151 ${sliderPct}%, #374151 100%)`
                  }}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>1K</span>
                  <span className="font-semibold text-emerald-400">{formatNumber(dailyViews)} views/day</span>
                  <span>10M</span>
                </div>
              </div>

              {/* RPM + Currency (combined) */}
              <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-sm p-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-300">
                    RPM (Revenue per 1,000 views)
                    {isLocked && <span className="ml-2 text-xs text-emerald-400">(by category)</span>}
                    {overrideEnabled && <span className="ml-2 text-xs text-amber-400">(custom)</span>}
                  </label>
                  <div className="flex flex-col items-end gap-0.5">
                    <select
                      value={currency.code}
                      onChange={(e) => setCurrency(currencies.find(c => c.code === e.target.value))}
                      className="text-xs px-2 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                    >
                      {currencies.map((c) => (
                        <option key={c.code} value={c.code}>{c.code} {c.symbol}</option>
                      ))}
                    </select>
                    {currency.code !== 'USD' && (
                      <span className="text-[10px] text-gray-600">rates approx. 2026</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Low (USD $)</label>
                    <input
                      type="number" step="0.01" value={rpmLow}
                      onChange={(e) => setRpmLow(Math.max(0, parseFloat(e.target.value) || 0))}
                      disabled={isLocked}
                      className={`w-full px-3 py-2.5 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors ${
                        isLocked ? 'bg-gray-800 cursor-not-allowed text-gray-400' : 'bg-gray-800/50'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">High (USD $)</label>
                    <input
                      type="number" step="0.01" value={rpmHigh}
                      onChange={(e) => setRpmHigh(Math.max(rpmLow, parseFloat(e.target.value) || 0))}
                      disabled={isLocked}
                      className={`w-full px-3 py-2.5 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors ${
                        isLocked ? 'bg-gray-800 cursor-not-allowed text-gray-400' : 'bg-gray-800/50'
                      }`}
                    />
                  </div>
                </div>

                <p className="text-xs text-gray-500">
                  {mode === 'creator' && selectedCreator
                    ? 'Estimated by content category. Varies by audience location and ad engagement.'
                    : 'Varies by niche and audience. Gaming = lower ($1-3), finance/tech = higher ($4-8).'}
                </p>
              </div>
            </div>

            {/* ── RESULTS COLUMN ── */}
            <div className="space-y-5 order-3 lg:col-start-2">

              {/* Earnings cards */}
              <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-sm p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-500" />
                    Estimated Earnings
                  </h3>
                  <div className="flex items-center gap-2">
                    {/* Tier badge with tooltip */}
                    <div className="relative">
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full border cursor-help ${tier.bg} ${tier.border} ${tier.color}`}
                        onMouseEnter={() => setShowTierTooltip(true)}
                        onMouseLeave={() => setShowTierTooltip(false)}
                      >
                        {tier.label}
                      </span>
                      {showTierTooltip && (
                        <div className="absolute right-0 top-full mt-2 z-20 w-60 bg-gray-900 border border-gray-700 rounded-xl p-3 shadow-2xl">
                          <p className="text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wide">Monthly USD tiers</p>
                          {TIER_THRESHOLDS.map((t) => (
                            <div key={t.label} className={`flex items-center justify-between py-1 text-xs ${t.label === tier.label ? `font-semibold ${t.color}` : 'text-gray-500'}`}>
                              <span>{t.label}</span>
                              <span>{t.range}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* Copy link */}
                    <button
                      onClick={handleCopyLink}
                      className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800 border border-transparent hover:border-gray-700 transition-all"
                      title="Copy shareable link"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Link2 className="w-3.5 h-3.5" />}
                      {copiedLink ? 'Copied!' : 'Share'}
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="p-4 bg-emerald-950/30 rounded-xl border border-emerald-800/50">
                    <p className="text-xs text-gray-400 mb-1">Daily</p>
                    <p className="text-2xl font-bold text-emerald-400">{formatCurrency(dailyLow)} &ndash; {formatCurrency(dailyHigh)}</p>
                  </div>
                  <div className="p-4 bg-blue-950/30 rounded-xl border border-blue-800/50">
                    <p className="text-xs text-gray-400 mb-1">Monthly</p>
                    <p className="text-2xl font-bold text-blue-400">{formatCurrency(monthlyLow)} &ndash; {formatCurrency(monthlyHigh)}</p>
                  </div>
                  <div className="p-4 bg-purple-950/30 rounded-xl border border-purple-800/50">
                    <p className="text-xs text-gray-400 mb-1">Yearly</p>
                    <p className="text-2xl font-bold text-purple-400">{formatCurrency(yearlyLow)} &ndash; {formatCurrency(yearlyHigh)}</p>
                  </div>
                </div>
              </div>

              {/* Bar chart — stacked low + range band */}
              <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-sm p-6">
                <h4 className="text-sm font-semibold text-gray-300 mb-0.5">Earnings Breakdown</h4>
                <p className="text-xs text-gray-500 mb-4">Solid = low estimate &nbsp;&middot;&nbsp; Faded = upside range</p>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData} margin={{ top: 8, right: 4, left: 0, bottom: 0 }} barCategoryGap="35%">
                    <XAxis dataKey="period" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis
                      tick={{ fill: '#6b7280', fontSize: 11 }}
                      axisLine={false} tickLine={false} width={60}
                      tickFormatter={(v) => {
                        if (v >= 1000000) return `${currency.symbol}${(v / 1000000).toFixed(1)}M`;
                        if (v >= 1000)    return `${currency.symbol}${(v / 1000).toFixed(0)}K`;
                        return `${currency.symbol}${v}`;
                      }}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null;
                        const entry = chartData.find(d => d.period === label);
                        if (!entry) return null;
                        return (
                          <div style={{ background: '#111827', border: '1px solid #374151', borderRadius: '12px', padding: '10px 14px' }}>
                            <p style={{ color: '#f3f4f6', fontWeight: 600, marginBottom: 4, fontSize: 13 }}>{label}</p>
                            <p style={{ color: '#9ca3af', fontSize: 12 }}>{formatCurrency(entry.low)} &ndash; {formatCurrency(entry.high)}</p>
                          </div>
                        );
                      }}
                    />
                    {/* Base bar (low estimate) — full opacity */}
                    <Bar dataKey="base" stackId="earn" radius={[0, 0, 6, 6]} maxBarSize={72}>
                      {chartData.map((entry, i) => (
                        <Cell key={`base-${i}`} fill={entry.color} fillOpacity={0.9} />
                      ))}
                    </Bar>
                    {/* Range bar (low→high delta) — faded upside */}
                    <Bar dataKey="range" stackId="earn" radius={[6, 6, 0, 0]} maxBarSize={72}>
                      {chartData.map((entry, i) => (
                        <Cell key={`range-${i}`} fill={entry.color} fillOpacity={0.25} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* ── HOW IT WORKS — full width below both columns ── */}
            <div className="order-4 lg:col-span-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-start gap-3 bg-gray-900 border border-gray-800 rounded-2xl p-5">
                  <div className="w-9 h-9 bg-emerald-950/60 border border-emerald-800/50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <CalcIcon className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-200 mb-1">The Formula</p>
                    <p className="text-xs text-gray-400 leading-relaxed">(Daily Views &divide; 1,000) &times; RPM. RPM is your revenue per thousand views, before YouTube's 45% cut.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-gray-900 border border-gray-800 rounded-2xl p-5">
                  <div className="w-9 h-9 bg-blue-950/60 border border-blue-800/50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-200 mb-1">RPM by Niche</p>
                    <p className="text-xs text-gray-400 leading-relaxed">Gaming &amp; entertainment: $1&ndash;3. Education: $2&ndash;5. Finance &amp; tech: $4&ndash;8. Audience location matters too.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-gray-900 border border-gray-800 rounded-2xl p-5">
                  <div className="w-9 h-9 bg-purple-950/60 border border-purple-800/50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Database className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-200 mb-1">
                      {mode === 'creator' ? 'Real Channel Data' : 'Your Estimates'}
                    </p>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      {mode === 'creator'
                        ? 'Daily views come from 14 days of view deltas in our database, not a naive total-divided-by-videos guess.'
                        : 'Set your expected daily views and RPM range. Actual earnings vary by watch time, ad engagement, and geography.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Sticky mobile results bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-gray-950/95 backdrop-blur-sm border-t border-gray-800 px-4 py-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold">Monthly estimate</p>
          <p className="text-base font-bold text-blue-400 truncate">{formatCurrency(monthlyLow)} &ndash; {formatCurrency(monthlyHigh)}</p>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border flex-shrink-0 ${tier.bg} ${tier.border} ${tier.color}`}>
          {tier.label}
        </span>
      </div>
    </>
  );
}
