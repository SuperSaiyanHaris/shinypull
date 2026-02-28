import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

export const TIER_LIMITS = {
  lurker: {
    maxFollows: 5,
    maxCompare: 2,
    maxSavedCompares: 3,
    historyDays: 30,
    hasExport: false,
    isAdFree: false,
    hasFeaturedListing: false,
  },
  sub: {
    maxFollows: 100,
    maxCompare: 5,
    maxSavedCompares: 20,
    historyDays: 365,
    hasExport: true,
    isAdFree: true,
    hasFeaturedListing: false,
  },
  mod: {
    maxFollows: Infinity,
    maxCompare: 10,
    maxSavedCompares: Infinity,
    historyDays: Infinity,
    hasExport: true,
    isAdFree: true,
    hasFeaturedListing: true,
  },
};

export const TIER_DISPLAY = {
  lurker: { label: 'Lurker', color: 'text-gray-400', bg: 'bg-gray-800', border: 'border-gray-700' },
  sub:    { label: 'Sub',    color: 'text-indigo-400', bg: 'bg-indigo-950/40', border: 'border-indigo-700' },
  mod:    { label: 'Mod',    color: 'text-amber-400',  bg: 'bg-amber-950/40',  border: 'border-amber-700' },
};

const SubscriptionContext = createContext({});

export function SubscriptionProvider({ children }) {
  const { user } = useAuth();
  const [tier, setTier] = useState('lurker');
  const [status, setStatus] = useState('active');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setTier('lurker');
      setStatus('active');
      setLoading(false);
      return;
    }

    async function loadSubscription() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('users')
          .select('subscription_tier, subscription_status')
          .eq('id', user.id)
          .maybeSingle();

        if (!error && data) {
          setTier(data.subscription_tier || 'lurker');
          setStatus(data.subscription_status || 'active');
        }
      } catch {
        // Fallback to free tier on error
      } finally {
        setLoading(false);
      }
    }

    loadSubscription();
  }, [user]);

  const limits = TIER_LIMITS[tier] || TIER_LIMITS.lurker;

  function openUpgradePanel(feature, context) {
    window.dispatchEvent(new CustomEvent('openUpgradePanel', {
      detail: { feature, context },
    }));
  }

  const value = {
    tier,
    status,
    loading,
    ...limits,
    openUpgradePanel,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}
