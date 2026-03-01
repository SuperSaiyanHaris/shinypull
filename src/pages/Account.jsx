import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  User, Mail, Lock, Calendar, Star, CheckCircle, AlertCircle,
  Eye, EyeOff, ArrowLeft, Zap, Crown, ExternalLink, Megaphone,
  X, Search, Loader, LogOut, Shield, ChevronRight,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription, TIER_DISPLAY, TIER_LIMITS } from '../contexts/SubscriptionContext';
import { getFollowedCreators } from '../services/followService';
import { validateFeaturedCreatorUrl } from '../services/creatorService';
import SEO from '../components/SEO';

function Toast({ message, type, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium animate-fade-in ${
      type === 'success'
        ? 'bg-emerald-950/90 border-emerald-800 text-emerald-300'
        : 'bg-red-950/90 border-red-800 text-red-300'
    }`}>
      {type === 'success'
        ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
        : <AlertCircle className="w-4 h-4 flex-shrink-0" />
      }
      {message}
    </div>
  );
}

const TABS = [
  { id: 'subscription', label: 'Subscription', icon: Zap },
  { id: 'listings', label: 'Listings', icon: Megaphone },
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'security', label: 'Security', icon: Shield },
];

export default function Account() {
  const { user, signOut } = useAuth();
  const { tier, status: subStatus } = useSubscription();
  const [activeTab, setActiveTab] = useState('subscription');
  const [managingBilling, setManagingBilling] = useState(false);

  // Display name
  const [displayName, setDisplayName] = useState('');
  const [savingName, setSavingName] = useState(false);

  // Password
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);

  // Stats
  const [followCount, setFollowCount] = useState(null);

  // Featured listings
  const [featuredListings, setFeaturedListings] = useState([]);
  const [featuredUrl, setFeaturedUrl] = useState('');
  const [validatingUrl, setValidatingUrl] = useState(false);
  const [pendingCreator, setPendingCreator] = useState(null);
  const [urlError, setUrlError] = useState('');
  const [purchasingListing, setPurchasingListing] = useState(false);
  const [activatingFree, setActivatingFree] = useState(false);

  const loadFeaturedListings = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('featured_listings')
      .select('id, platform, status, active_from, active_until, is_mod_free, creators(display_name, username, profile_image, platform)')
      .eq('purchased_by_user_id', user.id)
      .neq('status', 'pending')
      .order('created_at', { ascending: false });
    setFeaturedListings(data || []);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setDisplayName(user.user_metadata?.display_name || '');
    getFollowedCreators(user.id).then(list => setFollowCount(list.length)).catch(() => {});
    loadFeaturedListings();
  }, [user, loadFeaturedListings]);

  const modFreeUsedThisMonth = featuredListings.some(l => {
    if (!l.is_mod_free) return false;
    const d = new Date(l.active_from || '');
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const handleValidateUrl = async () => {
    setUrlError('');
    setPendingCreator(null);
    if (!featuredUrl.trim()) return;
    setValidatingUrl(true);
    try {
      const creator = await validateFeaturedCreatorUrl(featuredUrl.trim());
      if (!creator) {
        setUrlError('Creator not found. Make sure the URL is a valid ShinyPull profile (e.g. https://shinypull.com/youtube/mrbeast).');
      } else {
        setPendingCreator(creator);
      }
    } catch {
      setUrlError('Could not validate that URL. Try again.');
    } finally {
      setValidatingUrl(false);
    }
  };

  const handleActivateModFree = async () => {
    if (!pendingCreator) return;
    setActivatingFree(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch('/api/stripe-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          priceKey: 'featured-free',
          creatorId: pendingCreator.id,
          platform: pendingCreator.platform,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to activate listing');
      showToast('Featured listing activated. Your profile will appear in rankings within a few minutes.');
      setFeaturedUrl('');
      setPendingCreator(null);
      loadFeaturedListings();
    } catch (err) {
      showToast(err.message || 'Failed to activate listing.', 'error');
    } finally {
      setActivatingFree(false);
    }
  };

  const handlePurchaseListing = async () => {
    if (!pendingCreator) return;
    setPurchasingListing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch('/api/stripe-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          priceKey: 'featured',
          creatorId: pendingCreator.id,
          platform: pendingCreator.platform,
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
      showToast('Listing canceled.');
      loadFeaturedListings();
    } catch (err) {
      showToast(err.message || 'Could not cancel listing.', 'error');
    }
  };

  if (!user) return null;

  const memberSince = new Date(user.created_at).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });

  const showToast = (message, type = 'success') => setToast({ message, type });

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

  const handleManageBilling = async () => {
    setManagingBilling(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch('/api/stripe-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ returnUrl: window.location.href }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to open billing portal');
      window.location.href = data.url;
    } catch (err) {
      showToast(err.message || 'Could not open billing portal.', 'error');
      setManagingBilling(false);
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

      {toast && (
        <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />
      )}

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
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-base font-extrabold text-white flex-shrink-0 bg-gradient-to-br ${
              tier === 'mod' ? 'from-amber-500 to-orange-600' : tier === 'sub' ? 'from-indigo-500 to-purple-600' : 'from-gray-600 to-gray-700'
            }`}>
              {initials}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <span className="font-semibold text-gray-100 truncate">{nameForDisplay}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${TIER_DISPLAY[tier]?.bg} ${TIER_DISPLAY[tier]?.color} border ${TIER_DISPLAY[tier]?.border}`}>
                  {TIER_DISPLAY[tier]?.label}
                </span>
                {subStatus === 'past_due' && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-950/40 text-red-400 border border-red-800">
                    Payment past due
                  </span>
                )}
              </div>
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

              {/* ── Subscription tab ── */}
              {activeTab === 'subscription' && (
                <div className={`bg-gray-900 rounded-2xl border p-6 ${
                  tier === 'mod' ? 'border-amber-800/50' : tier === 'sub' ? 'border-indigo-800/50' : 'border-gray-800'
                }`}>
                  <div className="flex items-center gap-2 mb-5">
                    {tier === 'mod'
                      ? <Crown className="w-5 h-5 text-amber-400" />
                      : tier === 'sub'
                      ? <Zap className="w-5 h-5 text-indigo-400" />
                      : <Zap className="w-5 h-5 text-gray-500" />
                    }
                    <h2 className="text-base font-semibold text-gray-100">Your Plan</h2>
                  </div>

                  {tier === 'lurker' ? (
                    <>
                      <p className="text-sm text-gray-400 mb-6">
                        You're on the free plan. Upgrade to unlock more follows, longer history, and an ad-free experience.
                      </p>
                      <div className="grid sm:grid-cols-2 gap-3 mb-6">
                        {[
                          ['Follow creators', '5 max'],
                          ['Compare creators', '2 at a time'],
                          ['Stat history', '30 days'],
                          ['Ads', 'Shown'],
                        ].map(([feature, value]) => (
                          <div key={feature} className="flex items-center justify-between px-4 py-3 bg-gray-800/50 rounded-xl">
                            <span className="text-sm text-gray-400">{feature}</span>
                            <span className="text-sm font-medium text-gray-300">{value}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-3 flex-wrap">
                        <button
                          onClick={() => window.dispatchEvent(new CustomEvent('openUpgradePanel', { detail: { feature: 'pricing' } }))}
                          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-colors"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          Upgrade to Sub
                        </button>
                        <Link
                          to="/pricing"
                          className="flex items-center gap-2 px-5 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 text-sm font-medium rounded-xl transition-colors"
                        >
                          Compare plans
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="grid sm:grid-cols-2 gap-3 mb-6">
                        {[
                          ['Follow creators', TIER_LIMITS[tier].maxFollows === Infinity ? 'Unlimited' : `Up to ${TIER_LIMITS[tier].maxFollows}`],
                          ['Compare creators', `Up to ${TIER_LIMITS[tier].maxCompare}`],
                          ['Stat history', TIER_LIMITS[tier].historyDays === Infinity ? 'Full history' : `${TIER_LIMITS[tier].historyDays} days`],
                          ['Ads', 'None'],
                          ...(tier === 'mod' ? [['Featured listings', '1 free/month']] : []),
                        ].map(([feature, value]) => (
                          <div key={feature} className="flex items-center justify-between px-4 py-3 bg-gray-800/50 rounded-xl">
                            <span className="text-sm text-gray-400">{feature}</span>
                            <span className="text-sm font-medium text-gray-200">{value}</span>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={handleManageBilling}
                        disabled={managingBilling}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
                      >
                        {managingBilling ? 'Opening...' : 'Manage Subscription'}
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* ── Listings tab ── */}
              {activeTab === 'listings' && (
                <div className="space-y-4">
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-1">
                      <Megaphone className="w-4 h-4 text-amber-400" />
                      <h2 className="text-base font-semibold text-gray-100">Featured Listings</h2>
                      <span className="ml-auto px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">$49/mo</span>
                    </div>
                    <p className="text-sm text-gray-400 mt-1 mb-5">
                      Your creator profile appears as a sponsored row in rankings pages, ahead of the organic list.
                      {tier === 'mod' && !modFreeUsedThisMonth && (
                        <span className="ml-2 text-amber-400 font-medium">You have 1 free listing available this month.</span>
                      )}
                    </p>

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
                              {c?.profile_image && (
                                <img src={c.profile_image} alt={c.display_name} className="w-10 h-10 rounded-lg object-cover bg-gray-700 flex-shrink-0" onError={e => { e.target.style.display = 'none'; }} />
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-gray-100 truncate">{c?.display_name || 'Unknown creator'}</p>
                                <p className="text-xs text-gray-400">
                                  {listing.platform}
                                  {until && isActive ? ` · Until ${until}` : ''}
                                  {listing.is_mod_free ? ' · Free with Mod' : ''}
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
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={featuredUrl}
                          onChange={e => { setFeaturedUrl(e.target.value); setPendingCreator(null); setUrlError(''); }}
                          onKeyDown={e => e.key === 'Enter' && handleValidateUrl()}
                          placeholder="https://shinypull.com/youtube/mrbeast"
                          className="flex-1 px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-transparent text-sm"
                        />
                        <button
                          onClick={handleValidateUrl}
                          disabled={validatingUrl || !featuredUrl.trim()}
                          className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-gray-100 font-medium rounded-xl transition-colors text-sm flex items-center gap-2"
                        >
                          {validatingUrl ? <Loader className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                          Check
                        </button>
                      </div>

                      {urlError && <p className="text-xs text-red-400">{urlError}</p>}

                      {pendingCreator && (
                        <div className="flex items-center gap-3 p-3.5 bg-amber-950/20 border border-amber-800/40 rounded-xl">
                          {pendingCreator.profile_image && (
                            <img src={pendingCreator.profile_image} alt={pendingCreator.display_name} className="w-10 h-10 rounded-lg object-cover bg-gray-700 flex-shrink-0" onError={e => { e.target.style.display = 'none'; }} />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-gray-100 truncate">{pendingCreator.display_name}</p>
                            <p className="text-xs text-gray-400">@{pendingCreator.username} · {pendingCreator.platform}</p>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            {tier === 'mod' && !modFreeUsedThisMonth && (
                              <button
                                onClick={handleActivateModFree}
                                disabled={activatingFree}
                                className="px-3 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-colors"
                              >
                                {activatingFree ? 'Activating...' : 'Use Free Listing'}
                              </button>
                            )}
                            <button
                              onClick={handlePurchaseListing}
                              disabled={purchasingListing}
                              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-colors"
                            >
                              {purchasingListing ? 'Redirecting...' : tier === 'mod' && !modFreeUsedThisMonth ? 'Pay $49/mo' : 'Add for $49/mo'}
                            </button>
                          </div>
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
