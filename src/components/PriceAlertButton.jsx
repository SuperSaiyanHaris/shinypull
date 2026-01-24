import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Bell, BellOff, Check, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAuthModal } from '../contexts/AuthModalContext';
import { alertService } from '../services/alertService';

const PriceAlertButton = ({ card, className = '', existingAlert = null, onComplete = null, autoOpen = false }) => {
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();
  const [showModal, setShowModal] = useState(autoOpen);
  const [hasAlert, setHasAlert] = useState(false);
  const [existingAlerts, setExistingAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [targetPrice, setTargetPrice] = useState(existingAlert?.target_price || '');
  const [alertType, setAlertType] = useState(existingAlert?.alert_type || 'below');
  const [checkFrequency, setCheckFrequency] = useState(existingAlert?.check_frequency || 4);
  const [startDate, setStartDate] = useState(existingAlert?.start_date || '');
  const [editingAlertId, setEditingAlertId] = useState(existingAlert?.id || null);

  const currentPrice = existingAlert?.current_price || card.prices?.tcgplayer?.market || 0;
  const isEditMode = !!existingAlert;

  useEffect(() => {
    if (user && card?.id) {
      checkExistingAlerts();
    }
  }, [user, card?.id]);

  useEffect(() => {
    if (autoOpen && existingAlert) {
      setShowModal(true);
      setTargetPrice(existingAlert.target_price);
      setAlertType(existingAlert.alert_type);
      setCheckFrequency(existingAlert.check_frequency);
      setStartDate(existingAlert.start_date || '');
      setEditingAlertId(existingAlert.id);
    }
  }, [autoOpen, existingAlert]);

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
    
    let result;
    if (editingAlertId) {
      // Update existing alert
      result = await alertService.updateAlert(editingAlertId, {
        target_price: parseFloat(targetPrice),
        alert_type: alertType,
        check_frequency: checkFrequency,
        start_date: startDate || null
      });
    } else {
      // Create new alert
      result = await alertService.createAlert(
        user.id,
        card,
        parseFloat(targetPrice),
        alertType,
        checkFrequency,
        startDate || null
      );
    }

    if (result.success) {
      await checkExistingAlerts();
      setShowModal(false);
      setTargetPrice('');
      setEditingAlertId(null);
      if (onComplete) onComplete();
    } else {
      alert(`Failed to ${editingAlertId ? 'update' : 'create'} alert: ` + result.error);
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
        className={`flex items-center gap-2 px-4 py-3 bg-amber-500 hover:bg-amber-600 text-black rounded-xl border border-amber-600 transition-colors font-semibold ${className}`}
        title={hasAlert ? 'Manage price alerts' : 'Set price alert'}
      >
        {hasAlert ? (
          <>
            <Bell className="w-5 h-5" />
            <span className="text-sm font-semibold">
              {existingAlerts.length} Alert{existingAlerts.length !== 1 ? 's' : ''}
            </span>
          </>
        ) : (
          <>
            <Bell className="w-5 h-5" />
            <span className="text-sm font-semibold">Set Alert</span>
          </>
        )}
      </button>

      {/* Alert Modal */}
      {showModal && ReactDOM.createPortal(
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[10000] flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowModal(false)}
        >
          <div
            className="relative w-full max-w-lg overflow-hidden rounded-2xl shadow-2xl animate-slide-up modal-container border"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-adaptive modal-header">
              <div>
                <h3 className="text-2xl font-display text-adaptive-primary">
                  {editingAlertId ? 'Update Alert' : 'Price Alerts'}
                </h3>
                <p className="text-sm text-adaptive-secondary mt-1">{card.name}</p>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  if (onComplete) onComplete();
                }}
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
                <p className="text-xs text-adaptive-secondary uppercase tracking-wide mb-1">
                  {isEditMode ? 'Last Known Price' : 'Current Price'}
                </p>
                <p className="text-3xl font-bold price-gradient">
                  ${currentPrice.toFixed(2)}
                </p>
              </div>

              {/* Existing Alerts */}
              {!editingAlertId && existingAlerts.length > 0 && (
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
                  className="w-full px-6 py-4 bg-amber-500 hover:bg-amber-600 disabled:bg-adaptive-hover disabled:text-adaptive-tertiary text-black font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      {editingAlertId ? 'Updating Alert...' : 'Creating Alert...'}
                    </>
                  ) : (
                    <>
                      <Bell className="w-5 h-5" />
                      {editingAlertId ? 'Update Alert' : 'Create Alert'}
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default PriceAlertButton;
