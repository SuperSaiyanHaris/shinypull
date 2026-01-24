import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Check, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAuthModal } from '../contexts/AuthModalContext';
import { alertService } from '../services/alertService';

const PriceAlertButton = ({ card, className = '' }) => {
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();
  const [showModal, setShowModal] = useState(false);
  const [hasAlert, setHasAlert] = useState(false);
  const [existingAlerts, setExistingAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [targetPrice, setTargetPrice] = useState('');
  const [alertType, setAlertType] = useState('below');

  const currentPrice = card.prices?.tcgplayer?.market || 0;

  useEffect(() => {
    if (user && card?.id) {
      checkExistingAlerts();
    }
  }, [user, card?.id]);

  const checkExistingAlerts = async () => {
    const result = await alertService.getCardAlerts(user.id, card.id);
    if (result.success && result.data) {
      setExistingAlerts(result.data);
      setHasAlert(result.data.length > 0);
    }
  };

  const handleClick = () => {
    if (!user) {
      openAuthModal();
      return;
    }
    setShowModal(true);
    setTargetPrice('');
    setAlertType('below');
  };

  const handleCreateAlert = async (e) => {
    e.preventDefault();
    if (!targetPrice || parseFloat(targetPrice) <= 0) return;

    setLoading(true);
    const result = await alertService.createAlert(
      user.id,
      card,
      parseFloat(targetPrice),
      alertType
    );

    if (result.success) {
      await checkExistingAlerts();
      setShowModal(false);
      setTargetPrice('');
    } else {
      alert('Failed to create alert: ' + result.error);
    }
    setLoading(false);
  };

  const handleDeleteAlert = async (alertId) => {
    setLoading(true);
    const result = await alertService.deleteAlert(alertId);
    if (result.success) {
      await checkExistingAlerts();
    }
    setLoading(false);
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={`flex items-center gap-2 px-4 py-3 modal-button rounded-xl border transition-colors ${className}`}
        title={hasAlert ? 'Manage price alerts' : 'Set price alert'}
      >
        {hasAlert ? (
          <>
            <BellOff className="w-5 h-5 text-amber-500" />
            <span className="text-sm font-medium text-adaptive-secondary">
              {existingAlerts.length} Alert{existingAlerts.length !== 1 ? 's' : ''}
            </span>
          </>
        ) : (
          <>
            <Bell className="w-5 h-5 text-adaptive-secondary" />
            <span className="text-sm font-medium text-adaptive-secondary">Set Alert</span>
          </>
        )}
      </button>

      {/* Alert Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-adaptive-card border border-adaptive rounded-xl p-6 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-display text-adaptive-primary">Price Alerts</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-adaptive-hover rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-adaptive-secondary" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-adaptive-secondary mb-1">{card.name}</p>
              <p className="text-lg font-bold price-gradient">
                Current: ${currentPrice.toFixed(2)}
              </p>
            </div>

            {/* Existing Alerts */}
            {existingAlerts.length > 0 && (
              <div className="mb-4 space-y-2">
                <p className="text-xs font-semibold text-adaptive-tertiary uppercase">Active Alerts</p>
                {existingAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between p-3 bg-adaptive-hover rounded-lg border border-adaptive"
                  >
                    <div>
                      <p className="text-sm text-adaptive-primary font-medium">
                        {alert.alert_type === 'below' ? '↓' : '↑'} ${parseFloat(alert.target_price).toFixed(2)}
                      </p>
                      <p className="text-xs text-adaptive-tertiary">
                        Alert when price goes {alert.alert_type}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteAlert(alert.id)}
                      disabled={loading}
                      className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Create New Alert */}
            <form onSubmit={handleCreateAlert} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-adaptive-secondary mb-2">
                  Alert Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAlertType('below')}
                    className={`p-3 rounded-lg border transition-colors ${
                      alertType === 'below'
                        ? 'bg-green-500/10 border-green-500/30 text-green-500'
                        : 'bg-adaptive-hover border-adaptive text-adaptive-secondary'
                    }`}
                  >
                    <span className="text-sm font-medium">↓ Below</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAlertType('above')}
                    className={`p-3 rounded-lg border transition-colors ${
                      alertType === 'above'
                        ? 'bg-red-500/10 border-red-500/30 text-red-500'
                        : 'bg-adaptive-hover border-adaptive text-adaptive-secondary'
                    }`}
                  >
                    <span className="text-sm font-medium">↑ Above</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-adaptive-secondary mb-2">
                  Target Price
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-adaptive-tertiary">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-3 bg-adaptive-hover border border-adaptive rounded-lg text-adaptive-primary placeholder-adaptive-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    required
                  />
                </div>
                <p className="text-xs text-adaptive-tertiary mt-1">
                  You'll be notified when the price goes {alertType} this amount
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || !targetPrice}
                className="w-full px-4 py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-adaptive-hover disabled:text-adaptive-tertiary text-slate-900 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4" />
                    Create Alert
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default PriceAlertButton;
