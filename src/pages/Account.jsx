import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  User, Mail, Lock, Calendar, Star, CheckCircle, AlertCircle,
  Eye, EyeOff, ArrowLeft, ExternalLink, Megaphone,
  X, Search, Loader, LogOut, Shield, ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { getFollowedCreators } from '../services/followService';
import SEO from '../components/SEO';
import CreatorAvatar from '../components/CreatorAvatar';

const TABS = [
  { id: 'listings', label: 'Listings', icon: Megaphone },
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'security', label: 'Security', icon: Shield },
];

const LISTING_PLATFORMS = ['youtube', 'tiktok', 'twitch', 'kick', 'bluesky'];
const PLATFORM_LABELS = { youtube: 'YouTube', tiktok: 'TikTok', twitch: 'Twitch', kick: 'Kick', bluesky: 'Bluesky' };
const PLATFORM_PILL_ACTIVE = { youtube: 'bg-red-600', tiktok: 'bg-pink-600', twitch: 'bg-purple-600', kick: 'bg-green-600', bluesky: 'bg-sky-500' };

export default function Account() {
  const { user, signOut } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => {
    const tab = searchParams.get('tab');
    return TABS.some(t => t.id === tab) ? tab : 'listings';
  });

  // Display name
  const [displayName, setDisplayName] = useState('');
  const [savingName, setSavingName] = useState(false);

  // Password
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);


  // Stats
  const [followCount, setFollowCount] = useState(null);

  // Featured listings
  const [featuredListings, setFeaturedListings] = useState([]);
  const [listingPlatform, setListingPlatform] = useState('youtube');
  const [listingQuery, setListingQuery] = useState('');
  const [listingResults, setListingResults] = useState([]);
  const [listingSearching, setListingSearching] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState(null);
  const [alreadyListed, setAlreadyListed] = useState(false);
  const [purchasingListing, setPurchasingListing] = useState(false);
  const [purchasingPremiumListing, setPurchasingPremiumListing] = useState(false);
  const [premiumSlotsLeft, setPremiumSlotsLeft] = useState(2);
  const [tikTokAdding, setTikTokAdding] = useState(false);
  const [tikTokAddError, setTikTokAddError] = useState('');

  const loadFeaturedListings = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('featured_listings')
      .select('id, platform, status, active_from, active_until, is_mod_free, created_at, creators(display_name, username, profile_image, platform)')
      .eq('purchased_by_user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    setFeaturedListings(data || []);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setDisplayName(user.user_metadata?.display_name || '');
    getFollowedCreators(user.id).then(list => setFollowCount(list.length)).catch(() => {});
    loadFeaturedListings();
  }, [user, loadFeaturedListings]);

  // Post-payment: refresh listings after Stripe redirects back from featured listing checkout
  useEffect(() => {
    const isFeatured = searchParams.get('featured') === 'success';
    if (!isFeatured) return;

    window.history.replaceState({}, '', '/account');
    setTimeout(() => {
      loadFeaturedListings();
      setActiveTab('listings');
      toast.success('Featured listing activated', { description: 'Your creator will appear in rankings shortly.' });
    }, 2000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced creator search for listings
  useEffect(() => {
    if (!listingQuery.trim() || listingQuery.length < 2 || selectedCreator) {
      if (!selectedCreator) setListingResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setListingSearching(true);
      try {
        const q = listingQuery.trim();
        const { data } = await supabase
          .from('creators')
          .select('id, username, display_name, profile_image, platform')
          .eq('platform', listingPlatform)
          .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
          .limit(6);
        setListingResults(data || []);
      } catch {
        setListingResults([]);
      } finally {
        setListingSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [listingQuery, listingPlatform, selectedCreator]);

  const handleSelectCreator = async (creator) => {
    setSelectedCreator(creator);
    setListingQuery(creator.display_name || creator.username);
    setListingResults([]);
    setAlreadyListed(false);
    setPremiumSlotsLeft(2);
    const now = new Date().toISOString();
    const [{ data: existing }, { count: premiumCount }] = await Promise.all([
      supabase.from('featured_listings').select('id')
        .eq('creator_id', creator.id).eq('status', 'active').gt('active_until', now).limit(1),
      supabase.from('featured_listings').select('id', { count: 'exact', head: true })
        .eq('platform', creator.platform).eq('placement_tier', 'premium')
        .eq('status', 'active').gt('active_until', now),
    ]);
    setAlreadyListed(!!(existing && existing.length > 0));
    setPremiumSlotsLeft(Math.max(0, 2 - (premiumCount || 0)));
  };

  const handleTikTokInstantAdd = async () => {
    if (!listingQuery.trim()) return;
    setTikTokAdding(true);
    setTikTokAddError('');
    try {
      const res = await fetch('/api/request-creator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: 'tiktok', username: listingQuery.trim(), instant: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not find that TikTok account.');
      if (data.creator) await handleSelectCreator(data.creator);
    } catch (err) {
      setTikTokAddError(err.message || 'Could not find that TikTok account.');
    } finally {
      setTikTokAdding(false);
    }
  };

  const handlePurchaseListing = async () => {
    if (!selectedCreator) return;
    setPurchasingListing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch('/api/stripe-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          priceKey: 'featured',
          creatorId: selectedCreator.id,
          platform: selectedCreator.platform,
          returnUrl: window.location.href,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start checkout');
      window.location.href = data.url;
    } catch (err) {
      showToast(err.message || 'Could not start checkout.', 'error');
      setPurchasingListing(false);
    }
  };

  const handlePurchasePremiumListing = async () => {
    if (!selectedCreator) return;
    setPurchasingPremiumListing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch('/api/stripe-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          priceKey: 'featured-premium',
          creatorId: selectedCreator.id,
          platform: selectedCreator.platform,
          returnUrl: window.location.href,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start checkout');
      window.location.href = data.url;
    } catch (err) {
      showToast(err.message || 'Could not start checkout.', 'error');
      setPurchasingPremiumListing(false);
    }
  };

  const handleCancelListing = async (listingId) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch('/api/stripe-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ priceKey: 'cancel-listing', listingId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not cancel listing');
      toast.success('Listing canceled', { description: 'Your placement will remain active until the end of the current billing period.' });
      loadFeaturedListings();
    } catch (err) {
      showToast(err.message || 'Could not cancel listing.', 'error');
    }
  };

  if (!user) return null;

  const memberSince = new Date(user.created_at).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });

  // Toast helper — delegates to Sonner (replaces the old local Toast state)
  const showToast = (message, type = 'success') => {
    if (type === 'error') toast.error(message);
    else toast.success(message);
  };

  const handleSaveName = async (e) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    setSavingName(true);
    try {
      const { error } = await supabase.auth.updateUser({ data: { display_name: displayName.trim() } });
      if (error) throw error;
      showToast('Display name updated.');
    } catch (err) {
      showToast(err.message || 'Failed to update display name.', 'error');
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) { showToast('Password must be at least 8 characters.', 'error'); return; }
    if (newPassword !== confirmPassword) { showToast('Passwords do not match.', 'error'); return; }
    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setNewPassword('');
      setConfirmPassword('');
      showToast('Password updated successfully.');
    } catch (err) {
      showToast(err.message || 'Failed to update password.', 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  // Profile initials
  const nameForDisplay = user?.user_metadata?.display_name || user?.email?.split('@')[0] || '?';
  const initials = nameForDisplay.slice(0, 2).toUpperCase();

  return (
    <>
      <SEO
        title="Account Settings"
        description="Manage your ShinyPull account, display name, and password."
      />

      <div className="min-h-screen bg-[#0a0a0f] dot-grid">
        {/* Page header */}
        <div className="border-b border-gray-800/60">
          <div className="max-w-5xl mx-auto px-4 py-6">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-indigo-400 transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
            <h1 className="text-2xl font-extrabold text-gray-100">Account Settings</h1>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-8">

          {/* Profile summary card */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-8 flex items-center gap-4">
            {/* Avatar */}
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-base font-extrabold text-white flex-shrink-0 bg-gradient-to-br from-indigo-500 to-purple-600">
              {initials}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-100 truncate mb-0.5">{nameForDisplay}</p>
              <p className="text-sm text-gray-400 truncate">{user.email}</p>
            </div>

            <div className="hidden sm:flex items-center gap-8 flex-shrink-0 pr-2">
              <div className="text-center">
                <p className="text-xl font-bold text-gray-100">{followCount ?? '—'}</p>
                <p className="text-xs text-gray-500 mt-0.5">Following</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-100">{memberSince}</p>
                <p className="text-xs text-gray-500 mt-0.5">Member since</p>
              </div>
            </div>
          </div>

          {/* Sidebar + content */}
          <div className="flex gap-8 items-start">

            {/* Sidebar nav (desktop) */}
            <aside className="hidden md:flex flex-col w-48 flex-shrink-0">
              <nav className="space-y-0.5">
                {TABS.map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-left transition-all ${
                        isActive
                          ? 'bg-gray-800 text-gray-100'
                          : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
                      }`}
                    >
                      <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-indigo-400' : ''}`} />
                      {tab.label}
                      {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto text-gray-600" />}
                    </button>
                  );
                })}
              </nav>
              <div className="mt-6 pt-5 border-t border-gray-800">
                <button
                  onClick={signOut}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-950/20 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 min-w-0">

              {/* Mobile tabs — fixed 4-column segmented control, no scroll */}
              <div className="flex md:hidden mb-6 bg-gray-900 border border-gray-800 rounded-xl p-1 gap-1">
                {TABS.map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-lg text-[10px] font-semibold transition-all ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* ── Listings tab ── */}
              {activeTab === 'listings' && (
                <div className="space-y-4">
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Megaphone className="w-4 h-4 text-amber-400" />
                        <h2 className="text-base font-semibold text-gray-100">Featured Listings</h2>
                      </div>
                      <Link to="/promote" className="text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1">
                        Learn more <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                    <p className="text-sm text-gray-400 mt-1 mb-5">Promote any creator across our rankings. Cancel anytime.</p>

                    {/* Existing listings */}
                    {featuredListings.length > 0 && (
                      <div className="mb-6 space-y-2">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Active Listings</p>
                        {featuredListings.map(listing => {
                          const c = listing.creators;
                          const isActive = listing.status === 'active';
                          const isPending = listing.status === 'pending';
                          const until = listing.active_until
                            ? new Date(listing.active_until).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                            : null;
                          return (
                            <div key={listing.id} className="flex items-center gap-3 p-3.5 bg-gray-800/50 rounded-xl border border-gray-700/50">
                              <CreatorAvatar src={c?.profile_image} name={c?.display_name} size="md" rounded="rounded-lg" />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-gray-100 truncate">{c?.display_name || 'Unknown creator'}</p>
                                <p className="text-xs text-gray-400">
                                  {listing.platform}
                                  {until && isActive ? ` · Until ${until}` : ''}
                                  {listing.is_mod_free ? ' · Promotional' : ''}
                                </p>
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${
                                isActive ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-800' :
                                isPending ? 'bg-amber-950/50 text-amber-400 border border-amber-800' :
                                'bg-gray-800 text-gray-500 border border-gray-700'
                              }`}>
                                {listing.status}
                              </span>
                              {isActive && !isPending && (
                                <button
                                  onClick={() => handleCancelListing(listing.id)}
                                  className="p-1.5 text-gray-500 hover:text-red-400 transition-colors flex-shrink-0"
                                  title="Cancel listing"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Add new listing */}
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Add a listing</p>

                      {/* Platform selector */}
                      <div className="flex flex-wrap gap-2">
                        {LISTING_PLATFORMS.map(p => (
                          <button
                            key={p}
                            onClick={() => {
                              setListingPlatform(p);
                              setSelectedCreator(null);
                              setListingQuery('');
                              setListingResults([]);
                              setAlreadyListed(false);
                              setTikTokAddError('');
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                              listingPlatform === p
                                ? `${PLATFORM_PILL_ACTIVE[p]} text-white`
                                : 'bg-gray-800 text-gray-400 hover:text-gray-200 border border-gray-700'
                            }`}
                          >
                            {PLATFORM_LABELS[p]}
                          </button>
                        ))}
                      </div>

                      {/* Search input with dropdown */}
                      <div className="relative">
                        <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl focus-within:ring-2 focus-within:ring-amber-500/50 focus-within:border-transparent">
                          {listingSearching
                            ? <Loader className="w-4 h-4 text-gray-500 animate-spin flex-shrink-0" />
                            : <Search className="w-4 h-4 text-gray-500 flex-shrink-0" />
                          }
                          <input
                            type="text"
                            value={listingQuery}
                            onChange={e => {
                              setListingQuery(e.target.value);
                              setSelectedCreator(null);
                              setAlreadyListed(false);
                            }}
                            placeholder={`Search ${PLATFORM_LABELS[listingPlatform]} creators...`}
                            className="flex-1 bg-transparent text-gray-100 placeholder-gray-500 text-[16px] sm:text-sm focus:outline-none"
                          />
                          {listingQuery && (
                            <button
                              onClick={() => { setListingQuery(''); setSelectedCreator(null); setListingResults([]); setAlreadyListed(false); setTikTokAddError(''); }}
                              className="text-gray-500 hover:text-gray-300"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Dropdown results */}
                        {listingResults.length > 0 && !selectedCreator && (
                          <div className="absolute top-full mt-1 left-0 right-0 z-10 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
                            {listingResults.map(c => (
                              <button
                                key={c.id}
                                onClick={() => handleSelectCreator(c)}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800 transition-colors text-left"
                              >
                                <CreatorAvatar src={c.profile_image} name={c.display_name} size="sm" rounded="rounded-lg" />
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-gray-100 truncate">{c.display_name}</p>
                                  <p className="text-xs text-gray-400">@{c.username}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* TikTok: not in DB — offer instant lookup */}
                      {listingPlatform === 'tiktok' && listingQuery.trim().length >= 2 && !listingSearching && listingResults.length === 0 && !selectedCreator && (
                        <div className="flex items-center gap-3 px-1">
                          <p className="text-xs text-gray-500 flex-1 min-w-0">
                            Not in our database. Add <span className="text-gray-300 font-medium">@{listingQuery.trim()}</span> directly.
                          </p>
                          <button
                            onClick={handleTikTokInstantAdd}
                            disabled={tikTokAdding}
                            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
                          >
                            {tikTokAdding && <Loader className="w-3 h-3 animate-spin" />}
                            {tikTokAdding ? 'Looking up...' : 'Add'}
                          </button>
                        </div>
                      )}
                      {tikTokAddError && <p className="text-xs text-red-400 px-1">{tikTokAddError}</p>}

                      {/* Selected creator card + purchase options */}
                      {selectedCreator && (
                        <div className="space-y-2">
                          {/* Creator info */}
                          <div className="flex items-center gap-3 p-3.5 bg-gray-800/60 border border-gray-700/60 rounded-xl">
                            <CreatorAvatar src={selectedCreator.profile_image} name={selectedCreator.display_name} size="md" rounded="rounded-lg" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-gray-100 truncate">{selectedCreator.display_name}</p>
                              <p className="text-xs text-gray-400">@{selectedCreator.username} · {selectedCreator.platform}</p>
                            </div>
                            {alreadyListed && (
                              <span className="px-3 py-1.5 bg-gray-700 text-gray-400 text-xs font-semibold rounded-lg flex-shrink-0">
                                Already listed
                              </span>
                            )}
                          </div>

                          {/* Tier selection — proper visual cards with clear value */}
                          {!alreadyListed && (
                            <div className="space-y-2.5">
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider pt-1">Choose your slot</p>
                              <div className="grid sm:grid-cols-2 gap-3">
                                {/* Basic */}
                                <button
                                  onClick={handlePurchaseListing}
                                  disabled={purchasingListing}
                                  className="group relative overflow-hidden text-left bg-gray-900 hover:bg-gray-800 border border-gray-700 hover:border-indigo-500/60 disabled:opacity-50 rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/10"
                                >
                                  <div className="pointer-events-none absolute -top-8 -right-8 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-colors" />
                                  <div className="relative">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="px-1.5 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold rounded uppercase tracking-wider">Basic</span>
                                      <span className="text-[10px] text-gray-500">Cancel anytime</span>
                                    </div>
                                    <p className="text-2xl font-extrabold text-gray-100">$49<span className="text-sm font-normal text-gray-500">/mo</span></p>
                                    <p className="text-xs text-gray-400 mt-2">Placed at rank 15, 20, 25... on the {PLATFORM_LABELS[listingPlatform]} rankings.</p>
                                    <span className="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-indigo-400 group-hover:gap-2 transition-all">
                                      {purchasingListing ? 'Redirecting…' : <>Get this slot <ChevronRight className="w-3 h-3" /></>}
                                    </span>
                                  </div>
                                </button>

                                {/* Premium */}
                                <button
                                  onClick={premiumSlotsLeft > 0 ? handlePurchasePremiumListing : undefined}
                                  disabled={premiumSlotsLeft === 0 || purchasingPremiumListing}
                                  className={`group relative overflow-hidden text-left rounded-2xl p-4 border transition-all duration-200 ${
                                    premiumSlotsLeft > 0
                                      ? 'bg-gradient-to-br from-amber-950/40 to-gray-900 hover:from-amber-950/60 border-amber-700/40 hover:border-amber-500/60 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-500/15'
                                      : 'bg-gray-900/60 border-gray-800 opacity-60 cursor-not-allowed'
                                  }`}
                                >
                                  {premiumSlotsLeft > 0 && (
                                    <div className="pointer-events-none absolute -top-8 -right-8 w-24 h-24 bg-amber-500/15 rounded-full blur-2xl group-hover:bg-amber-500/25 transition-colors" />
                                  )}
                                  <div className="relative">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="px-1.5 py-0.5 bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-bold rounded uppercase tracking-wider">⭐ Premium</span>
                                      <span className={`text-[10px] font-semibold ${premiumSlotsLeft > 0 ? 'text-amber-400' : 'text-gray-500'}`}>
                                        {premiumSlotsLeft > 0 ? `${premiumSlotsLeft} of 2 left` : 'Sold out'}
                                      </span>
                                    </div>
                                    <p className={`text-2xl font-extrabold ${premiumSlotsLeft > 0 ? 'text-gray-100' : 'text-gray-500'}`}>
                                      $149<span className="text-sm font-normal text-gray-500">/mo</span>
                                    </p>
                                    <p className="text-xs text-gray-400 mt-2">Top-10 placement between rank 4-5 and 9-10. Maximum visibility.</p>
                                    <span className={`inline-flex items-center gap-1 mt-3 text-xs font-semibold transition-all ${
                                      premiumSlotsLeft > 0 ? 'text-amber-400 group-hover:gap-2' : 'text-gray-500'
                                    }`}>
                                      {purchasingPremiumListing ? 'Redirecting…' : premiumSlotsLeft > 0
                                        ? <>Get this slot <ChevronRight className="w-3 h-3" /></>
                                        : 'Waitlist coming soon'}
                                    </span>
                                  </div>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Profile tab ── */}
              {activeTab === 'profile' && (
                <div className="space-y-4">
                  {/* Stats */}
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Account Info</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="flex items-center gap-3 px-4 py-3.5 bg-gray-800/50 rounded-xl">
                        <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-gray-500 mb-0.5">Member since</p>
                          <p className="text-sm font-semibold text-gray-100 truncate">{memberSince}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 px-4 py-3.5 bg-gray-800/50 rounded-xl">
                        <Star className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500 mb-0.5">Following</p>
                          <p className="text-sm font-semibold text-gray-100">
                            {followCount === null ? '...' : `${followCount} creator${followCount !== 1 ? 's' : ''}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 px-4 py-3.5 bg-gray-800/50 rounded-xl col-span-2 sm:col-span-1">
                        <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-gray-500 mb-0.5">Email</p>
                          <p className="text-sm font-semibold text-gray-100 truncate">{user.email}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Display name */}
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-4 h-4 text-indigo-400" />
                      <h2 className="text-base font-semibold text-gray-100">Display Name</h2>
                    </div>
                    <p className="text-sm text-gray-400 mb-5">This is how your name appears on your dashboard.</p>
                    <form onSubmit={handleSaveName} className="flex gap-3">
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Your name"
                        maxLength={50}
                        className="flex-1 px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                      />
                      <button
                        type="submit"
                        disabled={savingName || !displayName.trim()}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors text-sm"
                      >
                        {savingName ? 'Saving...' : 'Save'}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* ── Security tab ── */}
              {activeTab === 'security' && (
                <div className="space-y-4">
                  {/* Change password */}
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-1">
                      <Lock className="w-4 h-4 text-indigo-400" />
                      <h2 className="text-base font-semibold text-gray-100">Change Password</h2>
                    </div>
                    <p className="text-sm text-gray-400 mb-5">Pick a strong password, at least 8 characters.</p>
                    <form onSubmit={handleChangePassword} className="space-y-3">
                      <div className="relative">
                        <input
                          type={showNew ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="New password"
                          className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm pr-11"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNew(v => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                        >
                          {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type={showConfirm ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm new password"
                          className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm pr-11"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm(v => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                        >
                          {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <button
                        type="submit"
                        disabled={savingPassword || !newPassword || !confirmPassword}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors text-sm"
                      >
                        {savingPassword ? 'Updating...' : 'Update Password'}
                      </button>
                    </form>
                  </div>

                  {/* Sign out */}
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                    <h2 className="text-base font-semibold text-gray-100 mb-1">Sign Out</h2>
                    <p className="text-sm text-gray-400 mb-4">Sign out of your account on this device.</p>
                    <button
                      onClick={signOut}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gray-800 hover:bg-red-950/40 border border-gray-700 hover:border-red-900 text-gray-300 hover:text-red-400 font-medium rounded-xl transition-all text-sm"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
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
