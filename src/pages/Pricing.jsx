import { useState } from 'react';
import { Check, Zap, Crown, ArrowRight, Star } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription, TIER_DISPLAY } from '../contexts/SubscriptionContext';
import { supabase } from '../lib/supabase';

const TIERS = [
  {
    id: 'lurker',
    name: 'Lurker',
    price: 'Free',
    priceNote: 'forever',
    description: 'Get started tracking creators without spending a dime.',
    color: 'gray',
    features: [
      'Follow up to 5 creators',
      'Compare 2 creators at once',
      '30 days of stat history',
      '3 saved comparisons',
      'Basic search across all platforms',
      'Rankings pages',
    ],
    notIncluded: ['No ads removed', 'No CSV export'],
  },
  {
    id: 'sub',
    name: 'Sub',
    price: '$6',
    priceNote: '/month',
    description: 'For the analytics nerd who actually tracks growth.',
    color: 'indigo',
    badge: 'Most popular',
    features: [
      'Follow up to 100 creators',
      'Compare up to 5 creators',
      '1 year of stat history',
      '20 saved comparisons',
      'CSV export for any creator',
      'No ads',
      'Personal dashboard',
    ],
    priceKey: 'sub',
  },
  {
    id: 'mod',
    name: 'Mod',
    price: '$20',
    priceNote: '/month',
    description: 'For creator managers, MCNs, and brand teams.',
    color: 'amber',
    features: [
      'Unlimited follows',
      'Compare up to 10 creators',
      'Full history (everything we have)',
      'Unlimited saved comparisons',
      'Bulk CSV export',
      'No ads',
      '1 featured listing slot per month',
      'White-label shareable profile links',
      'Priority data refresh',
    ],
    priceKey: 'mod',
  },
];

const colorMap = {
  gray:   { ring: 'ring-gray-700',   btn: 'bg-gray-800 text-gray-300 hover:bg-gray-700', badge: 'bg-gray-700 text-gray-300', icon: 'text-gray-400', check: 'text-gray-500', glow: '', blob: 'bg-gray-500/5' },
  indigo: { ring: 'ring-indigo-600', btn: 'bg-indigo-600 hover:bg-indigo-500 text-white', badge: 'bg-indigo-600 text-white', icon: 'text-indigo-400', check: 'text-indigo-400', glow: 'shadow-2xl shadow-indigo-500/10', blob: 'bg-indigo-500/10 group-hover:bg-indigo-500/20' },
  amber:  { ring: 'ring-amber-600',  btn: 'bg-amber-600 hover:bg-amber-500 text-white',  badge: 'bg-amber-600 text-white',  icon: 'text-amber-400',  check: 'text-amber-400',  glow: 'shadow-2xl shadow-amber-500/10',  blob: 'bg-amber-500/10 group-hover:bg-amber-500/20' },
};

const FAQS = [
  {
    q: "What happens when I hit the Lurker follow limit?",
    a: "You'll see an upgrade prompt when you try to follow a 6th creator. Your existing follows stay put. Upgrade to Sub for 100 follows or Mod for unlimited.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel from your Account page and you keep access until the end of your billing period. No hidden fees, no questions.",
  },
  {
    q: "What is a featured listing?",
    a: "A sponsored spot in the rankings. Basic listings appear starting at position 11, then every 5 rows after that (11, 16, 21...). Premium listings appear between ranks 4-5 and 9-10 for maximum visibility. Slots are first come, first served. Cancel and the next advertiser moves up automatically.",
  },
  {
    q: "How many premium spots are there?",
    a: "Two per platform. Once they're filled, the next available slot opens when an existing advertiser cancels. You can see live slot availability on your Account page before purchasing.",
  },
  {
    q: "What counts as 'full history' on Mod?",
    a: "Every stat we've ever collected for that creator. We've been collecting daily snapshots since launch, so it grows over time.",
  },
];

export default function Pricing() {
  const { isAuthenticated } = useAuth();
  const { tier } = useSubscription();
  const [upgrading, setUpgrading] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  function handleFeaturedClick() {
    if (!isAuthenticated) {
      window.dispatchEvent(new CustomEvent('openAuthPanel', {
        detail: { message: 'Sign in to purchase a featured listing.', returnTo: '/account' },
      }));
      return;
    }
    navigate('/account');
  }

  async function handleUpgradeClick(priceKey) {
    if (!isAuthenticated) {
      window.dispatchEvent(new CustomEvent('openAuthPanel', {
        detail: { message: 'Create a free account first, then upgrade.', returnTo: '/pricing' },
      }));
      return;
    }

    setUpgrading(priceKey);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const res = await fetch('/api/stripe-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          priceKey,
          returnUrl: `${window.location.origin}/account?upgrade=success`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Checkout failed');
      window.location.href = data.url;
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
      setUpgrading(null);
    }
  }

  return (
    <>
      <SEO
        title="Pricing - ShinyPull"
        description="Free, Sub ($6/mo), and Mod ($20/mo) plans for tracking creator stats across YouTube, TikTok, Twitch, Kick, and Bluesky."
      />

      <div className="min-h-screen bg-[#0a0a0f]">
        {/* Hero */}
        <div className="text-center pt-20 pb-12 px-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-sm font-semibold mb-6">
            <Zap className="w-3.5 h-3.5" />
            Simple pricing
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-100 mb-4">
            Pick your plan
          </h1>
          <p className="text-lg text-gray-400 max-w-xl mx-auto">
            Start free. Upgrade when you need more. Cancel whenever you want.
          </p>
          {isAuthenticated && tier !== 'lurker' && (
            <p className="mt-4 text-sm text-gray-500">
              You're on the{' '}
              <span className={`font-semibold ${TIER_DISPLAY[tier]?.color}`}>
                {TIER_DISPLAY[tier]?.label}
              </span>{' '}
              plan.{' '}
              <Link to="/account" className="text-indigo-400 hover:text-indigo-300 underline">
                Manage subscription
              </Link>
            </p>
          )}
        </div>

        {/* Tier cards */}
        <div className="max-w-5xl mx-auto px-4 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TIERS.map((t) => {
              const colors = colorMap[t.color];
              const isCurrent = t.id === tier;

              return (
                <div
                  key={t.id}
                  className={`group relative bg-gray-900 border border-gray-800 rounded-2xl p-7 flex flex-col transition-all duration-300 hover:-translate-y-1.5 ${colors.glow} ${isCurrent ? `ring-2 ${colors.ring}` : ''}`}
                >
                  {/* Glow blob */}
                  <div className={`pointer-events-none absolute -top-12 -right-12 w-40 h-40 ${colors.blob} rounded-full blur-3xl transition-colors duration-500`} />

                  {/* Badge */}
                  {t.badge && !isCurrent && (
                    <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold ${colors.badge}`}>
                      {t.badge}
                    </div>
                  )}
                  {isCurrent && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold bg-gray-700 text-gray-300 whitespace-nowrap">
                      Your current plan
                    </div>
                  )}

                  {/* Header */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      {t.id === 'mod' && <Crown className={`w-5 h-5 ${colors.icon}`} />}
                      {t.id === 'sub' && <Zap className={`w-5 h-5 ${colors.icon}`} />}
                      <h2 className="text-xl font-extrabold text-gray-100">{t.name}</h2>
                    </div>
                    <div className="flex items-baseline gap-1 mb-3">
                      <span className="text-4xl font-black text-gray-100">{t.price}</span>
                      <span className="text-gray-400 text-sm">{t.priceNote}</span>
                    </div>
                    <p className="text-sm text-gray-400">{t.description}</p>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2.5 flex-1 mb-8">
                    {t.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-gray-300">
                        <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${colors.check}`} />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  {isCurrent ? (
                    <button
                      disabled
                      className="w-full py-3 rounded-xl text-sm font-semibold bg-gray-800 text-gray-500 cursor-default"
                    >
                      You're on this plan
                    </button>
                  ) : t.id === 'lurker' ? (
                    <Link
                      to="/search"
                      className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${colors.btn}`}
                    >
                      Get started free
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  ) : (
                    <button
                      onClick={() => handleUpgradeClick(t.priceKey)}
                      disabled={upgrading === t.priceKey}
                      className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed ${colors.btn}`}
                    >
                      {upgrading === t.priceKey ? 'Redirecting...' : `Upgrade to ${t.name}`}
                      {upgrading !== t.priceKey && <ArrowRight className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Error */}
          {error && (
            <div className="mt-6 max-w-md mx-auto bg-red-950/30 border border-red-800 text-red-400 px-4 py-3 rounded-xl text-sm text-center">
              {error}
            </div>
          )}

          {/* Comparison note */}
          <p className="text-center text-sm text-gray-500 mt-8">
            All plans include access to YouTube, TikTok, Twitch, Kick, and Bluesky stats. Billed monthly, cancel anytime.
          </p>
        </div>

        {/* Featured Listings B2B */}
        <div className="max-w-5xl mx-auto px-4 pb-24">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-sm font-semibold mb-6">
              <Star className="w-3.5 h-3.5" />
              Advertise on ShinyPull
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-100 mb-3">
              Featured Listings
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto text-base">
              Get a creator in front of people actively searching for talent. Sponsored placements in rankings, clearly labeled, first come first served.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Basic listing */}
            <div className="group relative bg-gray-900 border border-gray-800 rounded-2xl p-7 flex flex-col transition-all duration-300 hover:-translate-y-1.5 hover:border-indigo-500/60 hover:shadow-2xl hover:shadow-indigo-500/10">
              <div className="pointer-events-none absolute -top-12 -right-12 w-40 h-40 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/15 transition-colors duration-500" />
              <div className="absolute top-6 right-7 text-3xl font-black text-gray-800 select-none">$$$</div>

              <div className="mb-5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold rounded-full mb-4">
                  Featured Listing
                </span>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-black text-gray-100">$49</span>
                  <span className="text-gray-400 text-sm">/month</span>
                </div>
                <p className="text-sm text-gray-400">Your creator in sponsored rows throughout rankings. Position 11 and beyond, unlimited platforms.</p>
              </div>

              <ul className="space-y-2.5 flex-1 mb-8">
                {[
                  'Appears starting at rank 11, every 5 rows',
                  'Works across Top 50, 100, and 500',
                  'All platforms supported',
                  'Clearly labeled as sponsored',
                  'Cancel anytime',
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-gray-300">
                    <Check className="w-4 h-4 flex-shrink-0 mt-0.5 text-indigo-400" />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={handleFeaturedClick}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 bg-indigo-600 hover:bg-indigo-500 text-white"
              >
                Get a listing
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Premium listing */}
            <div className="group relative bg-amber-950/20 border border-amber-700/40 rounded-2xl p-7 flex flex-col transition-all duration-300 hover:-translate-y-1.5 hover:border-amber-500/60 hover:shadow-2xl hover:shadow-amber-500/10">
              <div className="pointer-events-none absolute -top-12 -right-12 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-colors duration-500" />
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold bg-amber-600 text-white whitespace-nowrap">
                Top 10 placement
              </div>
              <div className="absolute top-6 right-7 text-3xl font-black text-amber-900/40 select-none">$$$</div>

              <div className="mb-5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold rounded-full mb-4">
                  Premium Featured Listing
                </span>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-black text-gray-100">$149</span>
                  <span className="text-gray-400 text-sm">/month</span>
                </div>
                <p className="text-sm text-gray-400">Your creator between the top 10. Only 2 slots exist per platform, so availability is limited.</p>
              </div>

              <ul className="space-y-2.5 flex-1 mb-8">
                {[
                  'Appears between ranks 4-5 and 9-10',
                  'Only 2 slots available per platform',
                  'Highest visibility placement on the page',
                  'Clearly labeled as sponsored',
                  'Cancel anytime',
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-gray-300">
                    <Check className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={handleFeaturedClick}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 bg-amber-600 hover:bg-amber-500 text-white"
              >
                Get a premium listing
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <p className="text-center text-sm text-gray-500 mt-8">
            Featured listings are managed from your Account page. Check live slot availability before purchasing.
          </p>
        </div>

        {/* FAQ */}
        <div className="bg-gray-900 border-t border-gray-800">
          <div className="max-w-3xl mx-auto px-4 py-20">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-100 text-center mb-12">
              Questions
            </h2>
            <div className="space-y-6">
              {FAQS.map((faq) => (
                <div key={faq.q} className="border-b border-gray-800 pb-6">
                  <h3 className="text-base font-semibold text-gray-100 mb-2">{faq.q}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
