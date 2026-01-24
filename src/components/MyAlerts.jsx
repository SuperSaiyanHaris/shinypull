import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Trash2, ToggleLeft, ToggleRight, Loader2, Edit } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { alertService } from '../services/alertService';
import { formatPrice } from '../services/cardService';
import PriceAlertButton from './PriceAlertButton';

const MyAlerts = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'inactive'
  const [editingAlert, setEditingAlert] = useState(null);

  useEffect(() => {
    if (user) {
      loadAlerts();
    }
  }, [user]);

  const loadAlerts = async () => {
    setLoading(true);
    const result = await alertService.getUserAlerts(user.id);
    if (result.success) {
      setAlerts(result.data || []);
    }
    setLoading(false);
  };

  const handleToggleAlert = async (alertId, currentStatus) => {
    const result = await alertService.toggleAlert(alertId, !currentStatus);
    if (result.success) {
      await loadAlerts();
    }
  };

  const handleDeleteAlert = async (alertId) => {
    if (!confirm('Are you sure you want to delete this alert?')) return;
    
    const result = await alertService.deleteAlert(alertId);
    if (result.success) {
      await loadAlerts();
    }
  };

  const handleEditAlert = (alert) => {
    setEditingAlert({
      alert,
      card: {
        id: alert.card_id,
        name: alert.card_name,
        set: { name: alert.card_set },
        images: { small: alert.card_image },
        prices: {
          tcgplayer: {
            market: parseFloat(alert.current_price || 0)
          }
        }
      }
    });
  };

  const handleEditComplete = async () => {
    setEditingAlert(null);
    await loadAlerts();
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'active') return alert.is_active;
    if (filter === 'inactive') return !alert.is_active;
    return true;
  });

  const activeCount = alerts.filter(a => a.is_active).length;

  return (
    <div className="min-h-screen bg-adaptive pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-adaptive-card border-b border-adaptive">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-adaptive-hover rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-adaptive-secondary" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-display text-adaptive-primary">My Price Alerts</h1>
              <p className="text-sm text-adaptive-secondary mt-1">
                {activeCount} active alert{activeCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex gap-2 border-b border-adaptive">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 font-medium transition-colors ${
              filter === 'all'
                ? 'text-amber-500 border-b-2 border-amber-500'
                : 'text-adaptive-tertiary hover:text-adaptive-secondary'
            }`}
          >
            All ({alerts.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 font-medium transition-colors ${
              filter === 'active'
                ? 'text-amber-500 border-b-2 border-amber-500'
                : 'text-adaptive-tertiary hover:text-adaptive-secondary'
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => setFilter('inactive')}
            className={`px-4 py-2 font-medium transition-colors ${
              filter === 'inactive'
                ? 'text-amber-500 border-b-2 border-amber-500'
                : 'text-adaptive-tertiary hover:text-adaptive-secondary'
            }`}
          >
            Inactive ({alerts.length - activeCount})
          </button>
        </div>
      </div>

      {/* Alerts List */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="text-center py-16">
            <Bell className="w-16 h-16 text-adaptive-tertiary mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-display text-adaptive-primary mb-2">
              {filter === 'all' ? 'No alerts yet' : `No ${filter} alerts`}
            </h3>
            <p className="text-adaptive-secondary">
              {filter === 'all' 
                ? 'Create price alerts for cards you want to track'
                : `You don't have any ${filter} alerts`
              }
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`glass-effect rounded-xl border p-4 transition-all ${
                  alert.is_active ? 'border-amber-500/20' : 'border-adaptive opacity-60'
                }`}
              >
                {/* Card Info */}
                <div className="flex gap-3 mb-3">
                  <img
                    src={alert.card_image}
                    alt={alert.card_name}
                    className="w-16 h-22 object-contain rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-adaptive-primary truncate">
                      {alert.card_name}
                    </h3>
                    <p className="text-xs text-adaptive-tertiary truncate">
                      {alert.card_set}
                    </p>
                  </div>
                </div>

                {/* Alert Details */}
                <div className="p-3 bg-adaptive-hover rounded-lg border border-adaptive mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-adaptive-tertiary">Alert Price</span>
                    <span className={`text-lg font-bold ${
                      alert.alert_type === 'below' ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {alert.alert_type === 'below' ? '↓' : '↑'} {formatPrice(parseFloat(alert.target_price))}
                    </span>
                  </div>
                  <p className="text-xs text-adaptive-secondary mb-2">
                    Alert when price goes {alert.alert_type}
                  </p>
                  <div className="flex items-center justify-between text-xs text-adaptive-tertiary pt-2 border-t border-adaptive">
                    <span>Checks every {alert.check_frequency}h</span>
                    {alert.start_date && new Date(alert.start_date) > new Date() && (
                      <span className="text-amber-500">
                        Starts {new Date(alert.start_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {alert.last_triggered_at && (
                    <p className="text-xs text-amber-500 mt-2">
                      Last triggered: {new Date(alert.last_triggered_at).toLocaleDateString()}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleAlert(alert.id, alert.is_active)}
                    className="flex-1 px-3 py-2 bg-adaptive-hover hover:bg-adaptive-card rounded-lg transition-colors flex items-center justify-center gap-2 border border-adaptive"
                    title={alert.is_active ? 'Disable alert' : 'Enable alert'}
                  >
                    {alert.is_active ? (
                      <>
                        <ToggleRight className="w-4 h-4 text-green-500" />
                        <span className="text-xs font-medium text-green-500">Active</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-4 h-4 text-adaptive-tertiary" />
                        <span className="text-xs font-medium text-adaptive-tertiary">Inactive</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleEditAlert(alert)}
                    className="px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg transition-colors border border-amber-500/30"
                    title="Edit alert"
                  >
                    <Edit className="w-4 h-4 text-amber-500" />
                  </button>
                  <button
                    onClick={() => handleDeleteAlert(alert.id)}
                    className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors border border-red-500/30"
                    title="Delete alert"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>

                {/* Created Date */}
                <p className="text-xs text-adaptive-tertiary text-center mt-3">
                  Created {new Date(alert.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingAlert && (
        <PriceAlertButton
          card={editingAlert.card}
          existingAlert={editingAlert.alert}
          onComplete={handleEditComplete}
          autoOpen
        />
      )}
    </div>
  );
};

export default MyAlerts;
