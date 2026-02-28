import { useState, useEffect } from 'react';
import { X, Check, Zap, Crown, Lock } from 'lucide-react';
import { useSubscription, TIER_DISPLAY } from '../contexts/SubscriptionContext';
import { useAuth } from '../contexts/AuthContext';

const FEATURE_MESSAGES = {
  compare: "You've hit the compare limit for your plan.",
  follow:  "You've hit the follow limit for your plan.",
  history: "Unlock more stat history with a paid plan.",
  export:  "CSV export is available on Sub and Mod plans.",
  saves:   "You've hit the saved comparisons limit for your plan.",
  default: "Unlock more features by upgrading your plan.",
};

const TIERS = [
  {
    id: 'lurker',
    name: 'Lurker',
    price: 'Free',
    priceNote: 'forever',
    color: 'gray',
    features: [
      'Follow up to 5 creators',
      'Compare 2 creators',
      '30 days of history',
      '3 saved comparisons',
      'Basic search',
    ],
    cta: "You're on this plan",
    ctaDisabled: true,
  },
  {
    id: 'sub',
    name: 'Sub',
    price: '$6',
    priceNote: '/month',
    color: 'indigo',
    badge: 'Most popular',
    features: [
      'Follow up to 100 creators',
      'Compare up to 5 creators',
      '1 year of history',
      '20 saved comparisons',
      'CSV export',
      'Milestone alerts',
      'No ads',
    ],
    cta: 'Upgrade to Sub',
    priceKey: 'sub',
  },
  {
    id: 'mod',
    name: 'Mod',
    price: '$20',
    priceNote: '/month',
    color: 'amber',
    features: [
      'Unlimited follows',
      'Compare up to 10 creators',
      'Full history',
      'Unlimited saved comparisons',
      'CSV export (bulk)',
      'Milestone alerts',
      'No ads',
      '1 featured listing/month',
      'White-label profile links',
    ],
    cta: 'Upgrade to Mod',
    priceKey: 'mod',
  },
];

const colorMap = {
  gray:   { border: 'border-gray-700',   badge: 'bg-gray-800 text-gray-400',    btn: 'bg-gray-800 text-gray-400 cursor-default', glow: '' },
  indigo: { border: 'border-indigo-600', badge: 'bg-indigo-600 text-white',      btn: 'bg-indigo-600 hover:bg-indigo-500 text-white', glow: 'shadow-indigo-500/20 shadow-lg' },
  amber:  { border: 'border-amber-600',  badge: 'bg-amber-600 text-white',       btn: 'bg-amber-600 hover:bg-amber-500 text-white', glow: 'shadow-amber-500/20 shadow-lg' },
};

export default function UpgradePanel({ isOpen, onClose, feature }) {
  const { tier } = useSubscription();
  const { isAuthenticated } = useAuth();
  const [isAnimating, setIsAnimating] = useState(false);
  const [upgrading, setUpgrading] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
      setError('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  async function handleUpgrade(priceKey) {
    if (!isAuthenticated) {
      onClose();
      window.dispatchEvent(new CustomEvent('openAuthPanel', {
        detail: { message: 'Sign in to upgrade your plan' },
      }));
      return;
    }

    setUpgrading(priceKey);
    setError('');

    try {
      const res = await fetch('/api/stripe-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    } finally {
      setUpgrading(null);
    }
  }

  if (!isOpen) return null;

  const message = FEATURE_MESSAGES[feature] || FEATURE_MESSAGES.default;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 z-50 transition-opacity duration-300 ${
          isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Slide-out Panel */}
      <div className={`fixed right-0 top-0 h-full w-full sm:w-[560px] bg-[#0a0a0f] z-50 shadow-2xl overflow-y-auto transform transition-all duration-300 ease-out ${
        isAnimating ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Header */}
        <div className="sticky top-0 bg-[#0a0a0f] border-b border-gray-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold text-gray-100">Upgrade Your Plan</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {/* Context message */}
          <div className="mb-6 bg-indigo-950/40 border border-indigo-800/60 rounded-xl p-4 flex items-start gap-3">
            <Lock className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-indigo-300">{message}</p>
          </div>

          {/* Current tier badge */}
          <p className="text-sm text-gray-400 mb-4">
            You're on the <span className={`font-semibold ${TIER_DISPLAY[tier]?.color}`}>{TIER_DISPLAY[tier]?.label}</span> plan.
          </p>

          {/* Tier cards */}
          <div className="space-y-4">
            {TIERS.map((t) => {
              const colors = colorMap[t.color];
              const isCurrent = t.id === tier;
              const isRecommended = (tier === 'lurker' && t.id === 'sub') || (tier === 'sub' && t.id === 'mod');

              return (
                <div
                  key={t.id}
                  className={`relative bg-gray-900 border rounded-2xl p-5 transition-all duration-200 ${
                    isCurrent ? 'border-gray-700' : isRecommended ? `${colors.border} ${colors.glow}` : 'border-gray-800'
                  }`}
                >
                  {/* Badge */}
                  {t.badge && !isCurrent && (
                    <span className={`absolute -top-2.5 left-5 px-3 py-0.5 rounded-full text-xs font-bold ${colors.badge}`}>
                      {t.badge}
                    </span>
                  )}
                  {isCurrent && (
                    <span className="absolute -top-2.5 left-5 px-3 py-0.5 rounded-full text-xs font-bold bg-gray-700 text-gray-300">
                      Current plan
                    </span>
                  )}

                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        {t.id === 'mod' && <Crown className="w-4 h-4 text-amber-400" />}
                        <h3 className={`text-lg font-bold ${isCurrent ? 'text-gray-400' : 'text-gray-100'}`}>
                          {t.name}
                        </h3>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-2xl font-black ${isCurrent ? 'text-gray-500' : 'text-gray-100'}`}>
                        {t.price}
                      </span>
                      <span className="text-sm text-gray-400 ml-1">{t.priceNote}</span>
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-1.5 mb-4">
                    {t.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                        <Check className={`w-3.5 h-3.5 flex-shrink-0 ${isCurrent ? 'text-gray-600' : t.id === 'mod' ? 'text-amber-400' : 'text-indigo-400'}`} />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  {isCurrent ? (
                    <button disabled className="w-full py-2.5 rounded-xl text-sm font-semibold bg-gray-800 text-gray-500 cursor-default">
                      You're on this plan
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpgrade(t.priceKey)}
                      disabled={upgrading === t.priceKey}
                      className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed ${colors.btn}`}
                    >
                      {upgrading === t.priceKey ? 'Redirecting...' : t.cta}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {error && (
            <div className="mt-4 bg-red-950/30 border border-red-800 text-red-400 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Assurance */}
          <p className="mt-6 text-center text-xs text-gray-500">
            No ads on paid plans. Cancel anytime. Billed monthly via Stripe.
          </p>
        </div>
      </div>
    </>
  );
}
