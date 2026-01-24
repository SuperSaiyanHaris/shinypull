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
  const [checkFrequency, setCheckFrequency] = useState(4);
  const [startDate, setStartDate] = useState('');

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
    setCheckFrequency(4);
    setStartDate('');
  };

  const handleCreateAlert = async (e) => {
    e.preventDefault();
    if (!targetPrice || parseFloat(targetPrice) <= 0) return;

    setLoading(true);
    const result = await alertService.createAlert(
      user.id,
      card,
      parseFloat(targetPrice),
      alertType,
      checkFrequency,
      startDate || null
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
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowModal(false)}
        >
          <div
            className="relative w-full max-w-lg overflow-hidden rounded-2xl shadow-2xl animate-slide-up modal-container border"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-adaptive modal-header">
              <div>
                <h3 className="text-2xl font-display text-adaptive-primary">Price Alerts</h3>
                <p className="text-sm text-adaptive-secondary mt-1">{card.name}</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 modal-button rounded-lg transition-colors border"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 text-adaptive-secondary" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 modal-content max-h-[70vh] overflow-y-auto">
              {/* Current Price */}
              <div className="mb-6 p-4 modal-price-box rounded-xl border">
                <p className="text-xs text-adaptive-secondary uppercase tracking-wide mb-1">Current Price</p>
                <p className="text-3xl font-bold price-gradient">
                  ${currentPrice.toFixed(2)}
                </p>
              </div>

              {/* Existing Alerts */}
              {existingAlerts.length > 0 && (
                <div className="mb-6 space-y-2">
                  <p className="text-xs font-semibold text-adaptive-secondary uppercase tracking-wide">Active Alerts</p>
                  {existingAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-center justify-between p-4 modal-card rounded-lg border transition-all"
                    >
                      <div>
                        <p className="text-base text-adaptive-primary font-semibold">
                          {alert.alert_type === 'below' ? '↓' : '↑'} ${parseFloat(alert.target_price).toFixed(2)}
                        </p>
                        <p className="text-xs text-adaptive-tertiary mt-1">
                          Alert when price goes {alert.alert_type}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteAlert(alert.id)}
                        disabled={loading}
                        className="p-2 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete alert"
                      >
                        <X className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Create New Alert Form */}
              <form onSubmit={handleCreateAlert} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-adaptive-secondary uppercase tracking-wide mb-3">
                    Alert Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setAlertType('below')}
                      className={`p-4 rounded-xl border-2 transition-all font-medium ${
                        alertType === 'below'
                          ? 'bg-green-500/10 border-green-500 text-green-500 shadow-lg shadow-green-500/20'
                          : 'modal-card border-adaptive text-adaptive-secondary hover:border-green-500/30'
                      }`}
                    >
                      ↓ Below
                    </button>
                    <button
                      type="button"
                      onClick={() => setAlertType('above')}
                      className={`p-4 rounded-xl border-2 transition-all font-medium ${
                        alertType === 'above'
                          ? 'bg-red-500/10 border-red-500 text-red-500 shadow-lg shadow-red-500/20'
                          : 'modal-card border-adaptive text-adaptive-secondary hover:border-red-500/30'
                      }`}
                    >
                      ↑ Above
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-adaptive-secondary uppercase tracking-wide mb-3">
                    Target Price
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-adaptive-tertiary font-semibold">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={targetPrice}
                      onChange={(e) => setTargetPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-10 pr-4 py-3 modal-card border border-adaptive rounded-xl text-adaptive-primary placeholder-adaptive-tertiary font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                      required
                    />
                  </div>
                  <p className="text-xs text-adaptive-tertiary mt-2">
                    You'll be notified when the price goes {alertType} this amount
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-adaptive-secondary uppercase tracking-wide mb-3">
                    Check Frequency
                  </label>
                  <select
                    value={checkFrequency}
                    onChange={(e) => setCheckFrequency(parseInt(e.target.value))}
                    className="w-full px-4 py-3 modal-card border border-adaptive rounded-xl text-adaptive-primary font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                  >
                    <option value={1}>Every hour</option>
                    <option value={4}>Every 4 hours</option>
                    <option value={8}>Every 8 hours</option>
                    <option value={12}>Every 12 hours</option>
                  </select>
                  <p className="text-xs text-adaptive-tertiary mt-2">
                    How often to check for price changes
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-adaptive-secondary uppercase tracking-wide mb-3">
                    Start Date (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full px-4 py-3 modal-card border border-adaptive rounded-xl text-adaptive-primary font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                  />
                  <p className="text-xs text-adaptive-tertiary mt-2">
                    When to start checking (defaults to now)
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || !targetPrice}
                  className="w-full px-6 py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:from-adaptive-hover disabled:to-adaptive-hover disabled:text-adaptive-tertiary text-slate-900 font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg disabled:shadow-none"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                      Creating Alert...
                    </>
                  ) : (
                    <>
                      <Bell className="w-5 h-5" />
                      Create Alert
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PriceAlertButton;
