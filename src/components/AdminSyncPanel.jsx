import React, { useState, useEffect } from 'react';
import { RefreshCw, Database, CheckCircle, XCircle, Clock, DollarSign, Zap, Loader2 } from 'lucide-react';
import { syncAllSets, syncAllCards, checkSyncStatus, performFullSync } from '../services/syncService';
import { syncAllCardMetadata } from '../services/metadataSync';
import { updateStalePrices } from '../services/priceUpdateService';

const AdminSyncPanel = () => {
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState([]);
  const [lastSyncResult, setLastSyncResult] = useState(null);
  const [syncProgress, setSyncProgress] = useState(null);

  useEffect(() => {
    loadSyncStatus();
  }, []);

  const loadSyncStatus = async () => {
    const status = await checkSyncStatus();
    setSyncStatus(status);
  };

  const handleFullSync = async () => {
    setSyncing(true);
    setLastSyncResult(null);
    setSyncProgress(null);

    try {
      const result = await performFullSync();
      setLastSyncResult(result);
      await loadSyncStatus();
    } catch (error) {
      setLastSyncResult({ success: false, error: error.message });
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncSets = async () => {
    setSyncing(true);
    setLastSyncResult(null);
    setSyncProgress(null);

    try {
      const result = await syncAllSets();
      setLastSyncResult(result);
      await loadSyncStatus();
    } catch (error) {
      setLastSyncResult({ success: false, error: error.message });
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncCards = async () => {
    setSyncing(true);
    setLastSyncResult(null);
    setSyncProgress(null);

    try {
      const result = await syncAllCards();
      setLastSyncResult(result);
      await loadSyncStatus();
    } catch (error) {
      setLastSyncResult({ success: false, error: error.message });
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncMetadata = async () => {
    setSyncing(true);
    setLastSyncResult(null);
    setSyncProgress(null);

    try {
      console.log('🎴 Starting complete metadata sync (no timeout!)...');
      const result = await syncAllCardMetadata((progress) => {
        setSyncProgress(progress);
      });
      setLastSyncResult(result);
      await loadSyncStatus();
    } catch (error) {
      console.error('💥 Metadata sync failed:', error);
      setLastSyncResult({ success: false, error: error.message });
    } finally {
      setSyncing(false);
      setSyncProgress(null);
    }
  };

  const handleUpdatePrices = async () => {
    setSyncing(true);
    setLastSyncResult(null);
    setSyncProgress(null);

    try {
      const result = await updateStalePrices(24); // Update prices older than 24 hours
      setLastSyncResult(result);
      await loadSyncStatus();
    } catch (error) {
      setLastSyncResult({ success: false, error: error.message });
    } finally {
      setSyncing(false);
    }
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

      {/* Sync Status */}
      <div className="space-y-3 mb-6">
        <h3 className="text-sm font-semibold text-adaptive-secondary uppercase tracking-wider">
          Sync Status
        </h3>
        {syncStatus.map((status) => (
          <div
            key={status.entity_type}
            className="flex items-center justify-between p-4 bg-adaptive-card rounded-xl border border-adaptive"
          >
            <div className="flex items-center gap-3">
              {getStatusIcon(status.status)}
              <div>
                <p className="font-medium text-adaptive-primary capitalize">
                  {status.entity_type}
                </p>
                <p className="text-xs text-adaptive-tertiary mt-1">
                  {status.message || 'No sync performed yet'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-adaptive-tertiary">
                {status.last_sync
                  ? new Date(status.last_sync).toLocaleString()
                  : 'Never'}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Primary Sync Actions - Direct API calls (NO TIMEOUT!) */}
      <div className="space-y-3 mb-6">
        <h3 className="text-sm font-semibold text-adaptive-secondary uppercase tracking-wider flex items-center gap-2">
          <Zap className="w-4 h-4 text-green-500" />
          Direct Sync (No Timeout)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={handleFullSync}
            disabled={syncing}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:bg-gray-400 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
          >
            <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
            Full Sync
          </button>
          <button
            onClick={handleSyncSets}
            disabled={syncing}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 disabled:bg-gray-400 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
          >
            <Database className="w-5 h-5" />
            Sync Sets
          </button>
          <button
            onClick={handleSyncMetadata}
            disabled={syncing}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 disabled:bg-gray-400 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
          >
            <Zap className="w-5 h-5" />
            Sync Metadata
          </button>
          <button
            onClick={handleUpdatePrices}
            disabled={syncing}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:bg-gray-400 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
          >
            <DollarSign className="w-5 h-5" />
            Update Prices
          </button>
        </div>
        <p className="text-xs text-adaptive-tertiary italic">
          ✨ <strong>Direct API calls</strong> run in your browser with NO timeout limits! Click once and let it finish.
        </p>
      </div>

      {/* Progress Indicator */}
      {syncProgress && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-3 mb-3">
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
            <div className="flex-1">
              <p className="font-semibold text-blue-900 dark:text-blue-100">
                {syncProgress.setName}
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Set {syncProgress.current} of {syncProgress.total} • {syncProgress.cardsUpdated} cards total
              </p>
            </div>
          </div>
          
          {/* Card-level progress bar (if available) */}
          {syncProgress.currentTotal && (
            <div className="mb-2">
              <div className="flex justify-between text-xs text-blue-700 dark:text-blue-300 mb-1">
                <span>Current Set Progress</span>
                <span>{syncProgress.currentProgress || 0}/{syncProgress.currentTotal} cards</span>
              </div>
              <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                <div
                  className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((syncProgress.currentProgress || 0) / syncProgress.currentTotal) * 100}%` }}
                />
              </div>
            </div>
          )}
          
          {/* Overall set progress bar */}
          <div>
            <div className="flex justify-between text-xs text-blue-700 dark:text-blue-300 mb-1">
              <span>Overall Progress</span>
              <span>{syncProgress.current}/{syncProgress.total} sets</span>
            </div>
            <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
              <div
                className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(syncProgress.current / syncProgress.total) * 100}%` }}
              />
            </div>
          </div>
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
                  {lastSyncResult.message && (
                    <p className="text-lg font-bold">
                      {lastSyncResult.message}
                    </p>
                  )}
                  {lastSyncResult.sets && <p>✓ {lastSyncResult.sets} sets synced</p>}
                  {lastSyncResult.cards && <p>✓ {lastSyncResult.cards} cards synced</p>}
                  {lastSyncResult.count && <p>✓ {lastSyncResult.count} items synced</p>}
                  {lastSyncResult.cardsUpdated !== undefined && lastSyncResult.cardsUpdated > 0 && <p>✓ {lastSyncResult.cardsUpdated} cards updated</p>}
                  {lastSyncResult.setsProcessed !== undefined && lastSyncResult.totalSets && <p>✓ Processed {lastSyncResult.setsProcessed}/{lastSyncResult.totalSets} sets</p>}
                  {lastSyncResult.totalSuccess && <p>✓ {lastSyncResult.totalSuccess}/{lastSyncResult.totalCards} prices updated</p>}
                </div>
              ) : (
                <div className="text-sm text-red-800 dark:text-red-200 mt-1">
                  <p className="font-mono text-xs bg-red-100 dark:bg-red-900/30 p-2 rounded mt-1">
                    {lastSyncResult.error}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-900 dark:text-blue-100 mb-2">
          <strong>✨ Card-Level Chunking:</strong> All syncs now process 50 cards at a time with NO timeouts!
        </p>
        <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1 ml-4 list-disc">
          <li><strong>Full Sync:</strong> Complete database initialization (sets + all cards)</li>
          <li><strong>Sync Sets:</strong> Updates list of Pokemon TCG sets</li>
          <li><strong>Sync Metadata:</strong> Updates card types/supertype - 50 cards per call (click once, done!)</li>
          <li><strong>Update Prices:</strong> Refreshes pricing data - 50 cards per call</li>
        </ul>
        <p className="text-xs text-blue-700 dark:text-blue-300 mt-2 italic">
          💡 Large sets (like sv4 with 266 cards) now complete in 6 calls instead of timing out!
        </p>
      </div>
    </div>
  );
};

export default AdminSyncPanel;
