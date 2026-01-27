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
import {
  performCompleteInitialSync,
  syncNewSetsOnly,
  updatePricesOnly,
  getSyncStatus
} from '../services/comprehensiveSyncService';

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

  const handleCompleteSync = async () => {
    if (!confirm(
      '⚠️ COMPLETE INITIAL SYNC\n\n' +
      'This will sync ALL sets and ALL cards with COMPLETE data.\n\n' +
      'This should only be run ONCE to populate the database.\n' +
      'It may take 30-60 minutes and use ~40,000 API calls.\n\n' +
      'Continue?'
    )) {
      return;
    }

    setSyncing(true);
    setSyncType('complete');
    setLastSyncResult(null);
    setSyncProgress(null);

    try {
      const result = await performCompleteInitialSync((progress) => {
        setSyncProgress(progress);
      });
      setLastSyncResult(result);
      await loadSyncStatus();
    } catch (error) {
      setLastSyncResult({ success: false, error: error.message });
    } finally {
      setSyncing(false);
      setSyncType(null);
    }
  };

  const handleSyncNewSets = async () => {
    setSyncing(true);
    setSyncType('new_sets');
    setLastSyncResult(null);
    setSyncProgress(null);

    try {
      const result = await syncNewSetsOnly((progress) => {
        setSyncProgress(progress);
      });
      setLastSyncResult(result);
      await loadSyncStatus();
    } catch (error) {
      setLastSyncResult({ success: false, error: error.message });
    } finally {
      setSyncing(false);
      setSyncType(null);
    }
  };

  const handleUpdatePrices = async () => {
    setSyncing(true);
    setSyncType('prices');
    setLastSyncResult(null);
    setSyncProgress(null);

    try {
      const result = await updatePricesOnly(24, (progress) => {
        setSyncProgress(progress);
      });
      setLastSyncResult(result);
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

        {/* Complete Initial Sync */}
        <div className="p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-xl border border-purple-200 dark:border-purple-800">
          <div className="flex items-start gap-3 mb-3">
            <Zap className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-adaptive-primary">Complete Initial Sync</h4>
              <p className="text-xs text-adaptive-tertiary mt-1">
                One-time sync of ALL sets and ALL cards with complete data (types, supertype, attacks, etc.).
                Run this once to populate your database fully.
              </p>
            </div>
          </div>
          <button
            onClick={handleCompleteSync}
            disabled={syncing}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 text-white rounded-xl font-semibold transition-all"
          >
            {syncing && syncType === 'complete' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Database className="w-5 h-5" />
            )}
            {syncing && syncType === 'complete' ? 'Syncing All Data...' : 'Run Complete Sync'}
          </button>
        </div>

        {/* Sync New Sets */}
        <div className="p-4 bg-gradient-to-r from-cyan-500/10 to-teal-500/10 rounded-xl border border-cyan-200 dark:border-cyan-800">
          <div className="flex items-start gap-3 mb-3">
            <Package className="w-5 h-5 text-cyan-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-adaptive-primary">Sync New Sets</h4>
              <p className="text-xs text-adaptive-tertiary mt-1">
                Check for newly released sets and sync them. Run this when new Pokemon sets are announced (every 3-4 months).
              </p>
            </div>
          </div>
          <button
            onClick={handleSyncNewSets}
            disabled={syncing}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 disabled:opacity-50 text-white rounded-xl font-semibold transition-all"
          >
            {syncing && syncType === 'new_sets' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Package className="w-5 h-5" />
            )}
            {syncing && syncType === 'new_sets' ? 'Checking for New Sets...' : 'Sync New Sets'}
          </button>
        </div>

        {/* Update Prices */}
        <div className="p-4 bg-gradient-to-r from-emerald-500/10 to-green-500/10 rounded-xl border border-emerald-200 dark:border-emerald-800">
          <div className="flex items-start gap-3 mb-3">
            <DollarSign className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-adaptive-primary">Update Prices</h4>
              <p className="text-xs text-adaptive-tertiary mt-1">
                Refresh TCGPlayer prices for cards with stale data (older than 24 hours).
                This is the only sync that needs to run regularly.
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
