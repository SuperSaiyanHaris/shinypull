import { useState } from 'react';
import { Check, X, Zap, Crown, ArrowRight, Star, Info } from 'lucide-react';
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
    ],
    notIncluded: [
      'Ads displayed',
      'No CSV export',
      'No shareable links',
    ],
  },
  {
    id: 'sub',
    name: 'Sub',
    description: 'For the analytics nerd who actually tracks growth.',
    color: 'indigo',
    badge: 'Most popular',
    features: [
      'Follow up to 100 creators',
      'Compare up to 5 creators',
      { text: '1 year of stat history', tip: 'See charts and data going back 365 days for any creator you view on ShinyPull.' },
      { text: '20 saved comparisons', tip: 'Save any side-by-side creator comparison and pull it back up from your dashboard anytime.' },
      { text: 'CSV export for any creator', tip: "Download a creator's full stat history as a spreadsheet. Includes dates, follower counts, views, and more." },
      'No ads',
    ],
    monthly: { price: '$6',  note: '/month', key: 'sub' },
    annual:  { price: '$60', note: '/year',  equiv: '$5/mo billed annually', savings: 'Save $12', key: 'sub_annual' },
    cta: 'Upgrade to Sub',
  },
  {
    id: 'mod',
    name: 'Mod',
    description: 'When analytics is your job, not just your hobby.',
    color: 'amber',
    features: [
      'Unlimited follows',
      'Compare up to 10 creators',
      { text: 'Full history (everything we have)', tip: 'Every data point ever collected for that creator, going back to when we first started tracking them.' },
      'Unlimited saved comparisons',
      { text: 'Custom reports & bulk export', tip: 'Build reports for any creators in our database. Pick date ranges, metrics, preview data, and export as CSV. Save report templates for one-click re-runs.' },
      'No ads',
      { text: '1 free featured listing/month', tip: 'Feature one creator in our rankings each month at no extra cost. Same $49/mo placement, included in your plan.' },
      { text: 'Shareable profile links', tip: 'A clean, ad-free stats page for any creator. Copy the link or embed it as an iframe in Notion, client decks, or anywhere.' },
    ],
    monthly: { price: '$20',  note: '/month', key: 'mod' },
    annual:  { price: '$200', note: '/year',  equiv: '$17/mo billed annually', savings: 'Save $40', key: 'mod_annual' },
    cta: 'Upgrade to Mod',
  },
];

const colorMap = {
  gray:   { ring: 'ring-gray-700',   btn: 'bg-gray-800 text-gray-300 hover:bg-gray-700', badge: 'bg-gray-700 text-gray-300', icon: 'text-gray-400', check: 'text-gray-500', glow: '', blob: 'bg-gray-500/5' },
  indigo: { ring: 'ring-indigo-600', btn: 'bg-indigo-600 hover:bg-indigo-500 text-white', badge: 'bg-indigo-600 text-white', icon: 'text-indigo-400', check: 'text-indigo-400', glow: 'shadow-2xl shadow-indigo-500/10', blob: 'bg-indigo-500/10 group-hover:bg-indigo-500/20' },
  amber:  { ring: 'ring-amber-600',  btn: 'bg-amber-600 hover:bg-amber-500 text-white',  badge: 'bg-amber-600 text-white',  icon: 'text-amber-400',  check: 'text-amber-400',  glow: 'shadow-2xl shadow-amber-500/10',  blob: 'bg-amber-500/10 group-hover:bg-amber-500/20' },
};

const COMPARISON = [
  { feature: 'Follows',            lurker: '5',       sub: '100',    mod: 'Unlimited' },
  { feature: 'Compare creators',   lurker: '2',       sub: '5',      mod: '10' },
  { feature: 'Stat history',       lurker: '30 days', sub: '1 year', mod: 'Full' },
  { feature: 'Saved comparisons',  lurker: '3',       sub: '20',     mod: 'Unlimited' },
  { feature: 'CSV export',         lurker: false,     sub: true,     mod: 'Reports + Bulk' },
  { feature: 'No ads',             lurker: false,     sub: true,     mod: true },
  { feature: 'Shareable links',    lurker: false,     sub: false,    mod: true },
  { feature: 'Featured listing',   lurker: false,     sub: false,    mod: '1 free/month' },
];

const FAQS = [
  {
    q: "What are saved comparisons?",
    a: "When you compare creators side by side, you can save that comparison to revisit later. Each saved comparison is one slot. Lurker gets 3, Sub gets 20, Mod gets unlimited.",
  },
  {
    q: "How does CSV export work?",
    a: "Sub: hit the Export button on any creator's profile to download their stat history as a .csv file. Mod: you also get a dedicated Reports page where you can pull stats for any creators in our database, pick date ranges and metrics, preview the data, and export everything as a summary or detailed day-by-day CSV.",
  },
  {
    q: "What are shareable profile links?",
    a: "A stripped-down version of any creator's stats page. No header, no ads, no nav. Mod users get a clean link and an iframe embed code. Drop it in a client deck, a Notion page, or anywhere that accepts iframes.",
  },
  {
    q: "What's the free featured listing on Mod?",
    a: "Each month, Mod subscribers can feature one creator in our rankings at no extra cost. It's the same basic listing slot ($49/mo value), included in your plan. Manage it from your Account page under the Listings tab.",
  },
  {
    q: "Do annual plans auto-renew?",
    a: "Yes. Annual plans renew each year. Cancel anytime from your Account page and you keep access until the end of your paid period.",
  },
  {
    q: "What happens when I hit the Lurker follow limit?",
    a: "You'll see an upgrade prompt when you try to follow a 6th creator. Your existing follows stay put. Upgrade to Sub for 100 follows or Mod for unlimited.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel from your Account page and you keep access until the end of your billing period. No hidden fees.",
  },
  {
    q: "What counts as 'full history' on Mod?",
    a: "Every stat we've ever collected for that creator. We collect daily snapshots so the range grows over time.",
  },
];

export default function Pricing() {
  const { isAuthenticated } = useAuth();
  const { tier } = useSubscription();
  const [upgrading, setUpgrading] = useState(null);
  const [error, setError] = useState('');
  const [annual, setAnnual] = useState(true);
  const navigate = useNavigate();

  function handleFeaturedClick() {
    if (!isAuthenticated) {
      window.dispatchEvent(new CustomEvent('openAuthPanel', {
        detail: { message: 'Sign in to purchase a featured listing.', returnTo: '/account' },
      }));
      return;
    }
    navigate('/account?tab=listings');
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

  function renderCell(val) {
    if (val === true) return <Check className="w-4 h-4 text-emerald-400 mx-auto" />;
    if (val === false) return <span className="block text-center text-gray-700">—</span>;
    return <span className="text-gray-300 text-sm">{val}</span>;
  }

  return (
    <>
      <SEO
        title="Pricing - ShinyPull"
        description="Free, Sub ($6/mo), and Mod ($20/mo) plans for tracking creator stats across YouTube, TikTok, Twitch, Kick, and Bluesky."
      />

      <div className="min-h-screen bg-[#0a0a0f]">
        {/* Hero */}
        <div className="text-center pt-20 pb-10 px-4">
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

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-4 mb-10">
          <span className={`text-sm font-medium transition-colors ${!annual ? 'text-gray-100' : 'text-gray-500'}`}>
            Monthly
          </span>
          <button
            onClick={() => setAnnual(a => !a)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${annual ? 'bg-indigo-600' : 'bg-gray-700'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${annual ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
          <span className={`text-sm font-medium transition-colors ${annual ? 'text-gray-100' : 'text-gray-500'}`}>
            Annual
          </span>
          {annual && (
            <span className="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-full">
              2 months free
            </span>
          )}
        </div>

        {/* Tier cards */}
        <div className="max-w-5xl mx-auto px-4 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TIERS.map((t) => {
              const colors = colorMap[t.color];
              const isCurrent = t.id === tier;
              const pricing = annual ? t.annual : t.monthly;
              const priceKey = pricing?.key;
              const displayPrice = t.id === 'lurker' ? t.price : pricing.price;
              const displayNote = t.id === 'lurker' ? t.priceNote : pricing.note;

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
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="text-4xl font-black text-gray-100">{displayPrice}</span>
                      <span className="text-gray-400 text-sm">{displayNote}</span>
                    </div>
                    <div className="h-5 mb-2">
                      {t.id !== 'lurker' && annual && pricing?.equiv && (
                        <p className="text-xs text-emerald-400">{pricing.equiv} · {pricing.savings}</p>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">{t.description}</p>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2.5 flex-1 mb-8">
                    {t.features.map((f) => {
                      const text = typeof f === 'string' ? f : f.text;
                      const tip = typeof f === 'object' ? f.tip : null;
                      return (
                        <li key={text} className="relative flex items-center gap-2.5 text-sm text-gray-300 group/tip">
                          <Check className={`w-4 h-4 flex-shrink-0 ${colors.check}`} />
                          <span className="flex-1">{text}</span>
                          {tip && (
                            <span className="relative flex-shrink-0">
                              <Info className="w-3 h-3 text-gray-600 cursor-help" />
                              <span className="pointer-events-none absolute right-0 bottom-6 w-56 rounded-xl bg-gray-800 border border-gray-700 px-3 py-2.5 text-xs text-gray-300 shadow-xl opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150 z-30 leading-relaxed">
                                {tip}
                              </span>
                            </span>
                          )}
                        </li>
                      );
                    })}
                    {t.notIncluded?.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-gray-600">
                        <X className="w-4 h-4 flex-shrink-0 mt-0.5 text-gray-700" />
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
                      onClick={() => handleUpgradeClick(priceKey)}
                      disabled={upgrading === priceKey}
                      className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed ${colors.btn}`}
                    >
                      {upgrading === priceKey ? 'Redirecting...' : t.cta}
                      {upgrading !== priceKey && <ArrowRight className="w-4 h-4" />}
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

          {/* Note */}
          <p className="text-center text-xs text-gray-500 mt-6">
            All plans include YouTube, TikTok, Twitch, Kick, and Bluesky. Cancel anytime.
          </p>

          {/* Comparison table */}
          <div className="mt-16">
            <h2 className="text-xl font-extrabold text-gray-100 text-center mb-8">Compare plans</h2>
            <div className="overflow-x-auto rounded-2xl border border-gray-800">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-800 bg-gray-900/60">
                    <th className="text-left py-3 px-5 text-gray-400 font-semibold w-1/2">Feature</th>
                    <th className="text-center py-3 px-4 text-gray-300 font-bold">Lurker</th>
                    <th className="text-center py-3 px-4 text-indigo-400 font-bold">Sub</th>
                    <th className="text-center py-3 px-4 text-amber-400 font-bold">Mod</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map((row, i) => (
                    <tr key={row.feature} className={`border-b border-gray-800/50 ${i % 2 === 0 ? 'bg-gray-900/20' : ''}`}>
                      <td className="py-3 px-5 text-gray-400">{row.feature}</td>
                      <td className="py-3 px-4 text-center">{renderCell(row.lurker)}</td>
                      <td className="py-3 px-4 text-center">{renderCell(row.sub)}</td>
                      <td className="py-3 px-4 text-center">{renderCell(row.mod)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Featured Listings B2B */}
        <div className="border-t border-gray-800 mt-20">
          <div className="max-w-5xl mx-auto px-4 py-24">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-sm font-semibold mb-6">
                <Star className="w-3.5 h-3.5" />
                Get noticed
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
                <div className="mb-5">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold rounded-full mb-4">
                    Featured Listing
                  </span>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-4xl font-black text-gray-100">$49</span>
                    <span className="text-gray-400 text-sm">/month</span>
                  </div>
                  <p className="text-sm text-gray-400">Your creator in sponsored rows throughout rankings. Position 15 and beyond, unlimited platforms.</p>
                </div>
                <ul className="space-y-2.5 flex-1 mb-8">
                  {[
                    'Appears starting at rank 15, every 5 rows',
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