import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Loader2,
  Info
} from 'lucide-react';
import { getSyncStatus } from '../services/comprehensiveSyncService';

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
    const status = await getSyncStatus();
    setSyncStatus(status);
  };

  const handleUpdatePrices = async () => {
    setSyncing(true);
    setSyncType('prices');
    setLastSyncResult(null);
    setSyncProgress(null);

    try {
      // Call new eBay-based incremental price update endpoint
      const response = await fetch('/api/incremental-price-update?limit=10');
      const result = await response.json();
      
      setLastSyncResult({
        success: result.success,
        updated: result.updated || 0,
        message: result.success 
          ? `Updated ${result.updated} cards with eBay prices` 
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
    if (!syncStatus?.sets) return 0;
    return Math.round((syncStatus.sets.synced / syncStatus.sets.total) * 100);
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
              <p className="text-xs text-adaptive-tertiary">Fully Synced</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-adaptive-primary">{syncStatus.cards?.total?.toLocaleString() || 0}</p>
              <p className="text-xs text-adaptive-tertiary">Total Cards</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-500">{syncStatus.cards?.withCompleteData?.toLocaleString() || 0}</p>
              <p className="text-xs text-adaptive-tertiary">Complete Data</p>
            </div>
          </div>
        ) : (
          <p className="text-adaptive-tertiary">Loading status...</p>
        )}

        {syncStatus && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-adaptive-tertiary mb-1">
              <span>Sync Completion</span>
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
              <h4 className="font-semibold text-adaptive-primary">Update eBay Prices</h4>
              <p className="text-xs text-adaptive-tertiary mt-1">
                Refresh market prices from eBay sold listings for cards with stale data (oldest first).
                Updates 5-10 cards per run. Run regularly to keep prices current.
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
                {syncProgress.phase === 'sets' && 'Syncing Sets...'}
                {syncProgress.phase === 'cards' && `Syncing: ${syncProgress.setName}`}
                {syncProgress.phase === 'new_sets' && `New Set: ${syncProgress.setName}`}
                {syncProgress.phase === 'prices' && 'Updating Prices...'}
              </p>
              {syncProgress.current && syncProgress.total && (
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  {syncProgress.current} of {syncProgress.total}
                  {syncProgress.totalCards !== undefined && ` • ${syncProgress.totalCards.toLocaleString()} cards synced`}
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
                {lastSyncResult.success ? 'Sync Successful!' : 'Sync Failed'}
              </p>
              {lastSyncResult.success ? (
                <div className="text-sm text-green-800 dark:text-green-200 mt-1 space-y-1">
                  {lastSyncResult.message && <p>{lastSyncResult.message}</p>}
                  {lastSyncResult.sets !== undefined && <p>✓ {lastSyncResult.sets} sets</p>}
                  {lastSyncResult.cards !== undefined && <p>✓ {lastSyncResult.cards.toLocaleString()} cards</p>}
                  {lastSyncResult.updated !== undefined && <p>✓ {lastSyncResult.updated} prices updated</p>}
                  {lastSyncResult.skipped !== undefined && lastSyncResult.skipped > 0 && (
                    <p className="text-yellow-700 dark:text-yellow-300">⚠ {lastSyncResult.skipped} cards not in Pokemon API (skipped for 7 days)</p>
                  )}
                  {lastSyncResult.setNames && (
                    <p>✓ New sets: {lastSyncResult.setNames.join(', ')}</p>
                  )}
                  {lastSyncResult.elapsed && <p className="text-xs opacity-75">Time: {lastSyncResult.elapsed}</p>}
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
