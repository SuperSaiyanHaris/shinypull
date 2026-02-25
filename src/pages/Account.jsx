import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Mail, Lock, Calendar, Star, CheckCircle, AlertCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { getFollowedCreators } from '../services/followService';
import SEO from '../components/SEO';

function Toast({ message, type, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium animate-fade-in ${
      type === 'success'
        ? 'bg-emerald-950/90 border-emerald-800 text-emerald-300'
        : 'bg-red-950/90 border-red-800 text-red-300'
    }`}>
      {type === 'success'
        ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
        : <AlertCircle className="w-4 h-4 flex-shrink-0" />
      }
      {message}
    </div>
  );
}

export default function Account() {
  const { user, signOut } = useAuth();

  // Display name
  const [displayName, setDisplayName] = useState('');
  const [savingName, setSavingName] = useState(false);

  // Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);

  // Stats
  const [followCount, setFollowCount] = useState(null);

  useEffect(() => {
    if (!user) return;
    setDisplayName(user.user_metadata?.display_name || '');
    getFollowedCreators(user.id).then(list => setFollowCount(list.length)).catch(() => {});
  }, [user]);

  if (!user) {
    return null;
  }

  const memberSince = new Date(user.created_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const handleSaveName = async (e) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    setSavingName(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { display_name: displayName.trim() },
      });
      if (error) throw error;
      showToast('Display name updated.');
    } catch (err) {
      showToast(err.message || 'Failed to update display name.', 'error');
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      showToast('Password must be at least 8 characters.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }
    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('Password updated successfully.');
    } catch (err) {
      showToast(err.message || 'Failed to update password.', 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <>
      <SEO
        title="Account Settings"
        description="Manage your ShinyPull account, display name, and password."
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}

      <div className="min-h-screen bg-[#0a0a0f] dot-grid">
        {/* Page header */}
        <div className="relative overflow-hidden border-b border-gray-800/60 bg-gradient-to-b from-gray-900/80 to-transparent">
          <div className="max-w-2xl mx-auto px-4 py-8">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 text-sm text-gray-300 hover:text-indigo-400 transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
            <h1 className="text-2xl font-extrabold text-gray-100">Account Settings</h1>
            <p className="text-gray-400 text-sm mt-1">{user.email}</p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

          {/* Account overview */}
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">Overview</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-gray-800/50 rounded-xl p-4">
                <Calendar className="w-4 h-4 text-gray-300 mb-2" />
                <p className="text-xs text-gray-300 mb-0.5">Member since</p>
                <p className="text-sm font-semibold text-gray-100">{memberSince}</p>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-4">
                <Star className="w-4 h-4 text-yellow-500 mb-2" />
                <p className="text-xs text-gray-300 mb-0.5">Following</p>
                <p className="text-sm font-semibold text-gray-100">
                  {followCount === null ? '...' : `${followCount} creator${followCount !== 1 ? 's' : ''}`}
                </p>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-4">
                <Mail className="w-4 h-4 text-gray-300 mb-2" />
                <p className="text-xs text-gray-300 mb-0.5">Email</p>
                <p className="text-sm font-semibold text-gray-100 truncate">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Display name */}
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
            <div className="flex items-center gap-2 mb-1">
              <User className="w-4 h-4 text-indigo-400" />
              <h2 className="text-base font-semibold text-gray-100">Display Name</h2>
            </div>
            <p className="text-sm text-gray-300 mb-5">
              This is how your name appears on your dashboard.
            </p>
            <form onSubmit={handleSaveName} className="flex gap-3">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                maxLength={50}
                className="flex-1 px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              />
              <button
                type="submit"
                disabled={savingName || !displayName.trim()}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors text-sm"
              >
                {savingName ? 'Saving...' : 'Save'}
              </button>
            </form>
          </div>

          {/* Change password */}
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
            <div className="flex items-center gap-2 mb-1">
              <Lock className="w-4 h-4 text-indigo-400" />
              <h2 className="text-base font-semibold text-gray-100">Change Password</h2>
            </div>
            <p className="text-sm text-gray-300 mb-5">
              Pick a strong password, at least 8 characters.
            </p>
            <form onSubmit={handleChangePassword} className="space-y-3">
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password"
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-300"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-300"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button
                type="submit"
                disabled={savingPassword || !newPassword || !confirmPassword}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors text-sm"
              >
                {savingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>

          {/* Sign out */}
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
            <h2 className="text-base font-semibold text-gray-100 mb-1">Sign Out</h2>
            <p className="text-sm text-gray-300 mb-4">Sign out of your account on this device.</p>
            <button
              onClick={signOut}
              className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 hover:text-gray-100 font-medium rounded-xl transition-colors text-sm"
            >
              Sign Out
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
