import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Database,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Zap,
  Loader2,
  Package,
  Info
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const AdminSyncPanel = () => {
  const [syncing, setSyncing] = useState(false);
  const [syncType, setSyncType] = useState(null);
  const [syncStatus, setSyncStatus] = useState(null);
  const [lastSyncResult, setLastSyncResult] = useState(null);
  const [syncProgress, setSyncProgress] = useState(null);

  useEffect(() => {
    loadSyncStatus();
  }, []);

  const loadSyncStatus = async () => {
    try {
      // Get sync metadata
      const { data: syncMeta } = await supabase
        .from('sync_metadata')
        .select('*');

      // Count sets
      const { count: totalSets } = await supabase
        .from('sets')
        .select('*', { count: 'exact', head: true });

      const { count: syncedSets } = await supabase
        .from('sets')
        .select('*', { count: 'exact', head: true })
        .not('last_full_sync', 'is', null);

      // Count cards
      const { count: totalCards } = await supabase
        .from('cards')
        .select('*', { count: 'exact', head: true });

      const { count: cardsWithPrices } = await supabase
        .from('prices')
        .select('*', { count: 'exact', head: true })
        .not('market_price', 'is', null);

      setSyncStatus({
        syncMetadata: syncMeta,
        sets: { total: totalSets, synced: syncedSets },
        cards: { total: totalCards, withPrices: cardsWithPrices }
      });
    } catch (error) {
      console.error('Error loading sync status:', error);
    }
  };

  const handleUpdatePrices = async () => {
    setSyncing(true);
    setSyncType('prices');
    setLastSyncResult(null);
    setSyncProgress(null);

    try {
      // Call the incremental price update endpoint
      const response = await fetch('/api/incremental-price-update?limit=20');
      const result = await response.json();

      setLastSyncResult({
        success: result.success,
        updated: result.updated || 0,
        failed: result.failed || 0,
        message: result.success
          ? `Updated ${result.updated} card prices`
          : result.error
      });

      await loadSyncStatus();
    } catch (error) {
      setLastSyncResult({ success: false, error: error.message });
    } finally {
      setSyncing(false);
      setSyncType(null);
    }
  };

  const getCompletionPercentage = () => {
    if (!syncStatus?.cards) return 0;
    const withPrices = syncStatus.cards.withPrices || 0;
    const total = syncStatus.cards.total || 1;
    return Math.round((withPrices / total) * 100);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'in_progress':
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="glass-effect rounded-2xl p-6 border border-adaptive">
      <div className="flex items-center gap-3 mb-6">
        <Database className="w-6 h-6 text-blue-500" />
        <h2 className="text-2xl font-display text-adaptive-primary">Database Sync Panel</h2>
      </div>

      {/* Database Status Overview */}
      <div className="mb-6 p-4 bg-adaptive-card rounded-xl border border-adaptive">
        <h3 className="text-sm font-semibold text-adaptive-secondary uppercase tracking-wider mb-3 flex items-center gap-2">
          <Info className="w-4 h-4" />
          Database Status
        </h3>

        {syncStatus ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-adaptive-primary">{syncStatus.sets?.total || 0}</p>
              <p className="text-xs text-adaptive-tertiary">Total Sets</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-500">{syncStatus.sets?.synced || 0}</p>
              <p className="text-xs text-adaptive-tertiary">Synced Sets</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-adaptive-primary">{syncStatus.cards?.total?.toLocaleString() || 0}</p>
              <p className="text-xs text-adaptive-tertiary">Total Cards</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-500">{syncStatus.cards?.withPrices?.toLocaleString() || 0}</p>
              <p className="text-xs text-adaptive-tertiary">With Prices</p>
            </div>
          </div>
        ) : (
          <p className="text-adaptive-tertiary">Loading status...</p>
        )}

        {syncStatus && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-adaptive-tertiary mb-1">
              <span>Price Coverage</span>
              <span>{getCompletionPercentage()}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  getCompletionPercentage() === 100 ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${getCompletionPercentage()}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Last Price Sync */}
      {syncStatus?.syncMetadata && (
        <div className="space-y-3 mb-6">
          {syncStatus.syncMetadata
            .filter((meta) => meta.entity_type === 'prices')
            .map((meta) => (
              <div
                key={meta.entity_type}
                className="flex items-center justify-between p-3 bg-adaptive-card rounded-xl border border-adaptive"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(meta.status)}
                  <div>
                    <p className="font-medium text-adaptive-primary">Last Price Update</p>
                    <p className="text-xs text-adaptive-tertiary">{meta.message || 'Not synced'}</p>
                  </div>
                </div>
                <p className="text-xs text-adaptive-tertiary">
                  {meta.last_sync ? new Date(meta.last_sync).toLocaleString() : 'Never'}
                </p>
              </div>
            ))}
        </div>
      )}

      {/* Sync Actions */}
      <div className="space-y-4 mb-6">
        <h3 className="text-sm font-semibold text-adaptive-secondary uppercase tracking-wider">
          Sync Actions
        </h3>

        {/* Update Prices */}
        <div className="p-4 bg-gradient-to-r from-emerald-500/10 to-green-500/10 rounded-xl border border-emerald-200 dark:border-emerald-800">
          <div className="flex items-start gap-3 mb-3">
            <DollarSign className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-adaptive-primary">Update Prices</h4>
              <p className="text-xs text-adaptive-tertiary mt-1">
                Fetch fresh prices from Pokemon TCG API for cards with stale data.
                Updates 20 cards per batch.
              </p>
            </div>
          </div>
          <button
            onClick={handleUpdatePrices}
            disabled={syncing}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 disabled:opacity-50 text-white rounded-xl font-semibold transition-all"
          >
            {syncing && syncType === 'prices' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <DollarSign className="w-5 h-5" />
            )}
            {syncing && syncType === 'prices' ? 'Updating Prices...' : 'Update Stale Prices'}
          </button>
        </div>
      </div>

      {/* Progress Indicator */}
      {syncProgress && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-3 mb-3">
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
            <div className="flex-1">
              <p className="font-semibold text-blue-900 dark:text-blue-100">
                {syncProgress.phase === 'prices' && 'Updating Prices...'}
              </p>
              {syncProgress.current && syncProgress.total && (
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  {syncProgress.current} of {syncProgress.total}
                  {syncProgress.updated !== undefined && ` • ${syncProgress.updated} prices updated`}
                </p>
              )}
            </div>
          </div>

          {syncProgress.current && syncProgress.total && (
            <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
              <div
                className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(syncProgress.current / syncProgress.total) * 100}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Last Sync Result */}
      {lastSyncResult && (
        <div
          className={`p-4 rounded-xl border ${
            lastSyncResult.success
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          }`}
        >
          <div className="flex items-start gap-3">
            {lastSyncResult.success ? (
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p
                className={`font-semibold ${
                  lastSyncResult.success
                    ? 'text-green-900 dark:text-green-100'
                    : 'text-red-900 dark:text-red-100'
                }`}
              >
                {lastSyncResult.success ? 'Update Successful!' : 'Update Failed'}
              </p>
              {lastSyncResult.success ? (
                <div className="text-sm text-green-800 dark:text-green-200 mt-1 space-y-1">
                  {lastSyncResult.message && <p>{lastSyncResult.message}</p>}
                  {lastSyncResult.updated !== undefined && <p>✓ {lastSyncResult.updated} prices updated</p>}
                  {lastSyncResult.failed !== undefined && lastSyncResult.failed > 0 && (
                    <p className="text-yellow-700 dark:text-yellow-300">⚠ {lastSyncResult.failed} failed</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-red-800 dark:text-red-200 mt-1 font-mono bg-red-100 dark:bg-red-900/30 p-2 rounded">
                  {lastSyncResult.error}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSyncPanel;
