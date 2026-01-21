import React, { useState, useEffect } from 'react';
import { RefreshCw, Database, CheckCircle, XCircle, Clock, DollarSign } from 'lucide-react';
import { performFullSync, syncAllSets, syncAllCards, checkSyncStatus } from '../services/syncService';
import { updateAllPrices, updateStalePrices } from '../services/priceUpdateService';

const AdminSyncPanel = () => {
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState([]);
  const [lastSyncResult, setLastSyncResult] = useState(null);

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

  const handleUpdatePrices = async () => {
    setSyncing(true);
    setLastSyncResult(null);

    try {
      const result = await updateAllPrices();
      setLastSyncResult(result);
      await loadSyncStatus();
    } catch (error) {
      setLastSyncResult({ success: false, error: error.message });
    } finally {
      setSyncing(false);
    }
  };

  const handleUpdateStalePrices = async () => {
    setSyncing(true);
    setLastSyncResult(null);

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

      {/* Sync Actions */}
      <div className="space-y-3 mb-6">
        <h3 className="text-sm font-semibold text-adaptive-secondary uppercase tracking-wider">
          Data Sync Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={handleFullSync}
            disabled={syncing}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-xl font-semibold transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
            Full Sync
          </button>
          <button
            onClick={handleSyncSets}
            disabled={syncing}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-xl font-semibold transition-colors"
          >
            <Database className="w-5 h-5" />
            Sync Sets
          </button>
          <button
            onClick={handleSyncCards}
            disabled={syncing}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-xl font-semibold transition-colors"
          >
            <Database className="w-5 h-5" />
            Sync Cards
          </button>
        </div>
      </div>

      {/* Price Update Actions */}
      <div className="space-y-3 mb-6">
        <h3 className="text-sm font-semibold text-adaptive-secondary uppercase tracking-wider">
          Price Update Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            onClick={handleUpdatePrices}
            disabled={syncing}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white rounded-xl font-semibold transition-colors"
          >
            <DollarSign className="w-5 h-5" />
            Update All Prices
          </button>
          <button
            onClick={handleUpdateStalePrices}
            disabled={syncing}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white rounded-xl font-semibold transition-colors"
          >
            <DollarSign className="w-5 h-5" />
            Update Stale Prices
          </button>
        </div>
      </div>

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
            <div>
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
                <p className="text-sm text-green-800 dark:text-green-200 mt-1">
                  {lastSyncResult.sets && `${lastSyncResult.sets} sets synced`}
                  {lastSyncResult.cards && `, ${lastSyncResult.cards} cards synced`}
                  {lastSyncResult.count && `${lastSyncResult.count} items synced`}
                  {lastSyncResult.totalSuccess && `${lastSyncResult.totalSuccess}/${lastSyncResult.totalCards} prices updated`}
                </p>
              ) : (
                <p className="text-sm text-red-800 dark:text-red-200 mt-1">
                  {lastSyncResult.error}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-900 dark:text-blue-100">
          <strong>Note:</strong> Full sync will take several minutes as it fetches all sets
          and cards from the Pokemon TCG API. Run this when setting up for the first time or
          when new sets are released.
        </p>
      </div>
    </div>
  );
};

export default AdminSyncPanel;
