import React, { useState } from 'react';
import { Sun, Moon, LogOut, User, Package, Bell } from 'lucide-react';
import logo from '../imgs/shinypulllogo.png';
import { useAuth } from '../contexts/AuthContext';
import { useAuthModal } from '../contexts/AuthModalContext';
import AuthModal from './AuthModal';

const Header = ({ onLogoClick, onCollectionClick, onAlertsClick }) => {
  const [darkMode, setDarkMode] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, profile, loading, signOut } = useAuth();
  const { isAuthModalOpen, openAuthModal, closeAuthModal } = useAuthModal();

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('light-mode');
  };

  const handleLogoClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (onLogoClick) {
      onLogoClick();
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setShowUserMenu(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleCollectionClick = () => {
    setShowUserMenu(false);
    if (onCollectionClick) {
      onCollectionClick();
    }
  };

  const handleAlertsClick = () => {
    setShowUserMenu(false);
    if (onAlertsClick) {
      onAlertsClick();
    }
  };

  const getUserDisplayName = () => {
    if (profile?.display_name) return profile.display_name;
    if (user?.user_metadata?.display_name) return user.user_metadata.display_name;
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  };

  const getUserAvatar = () => {
    return user?.user_metadata?.avatar_url || null;
  };

  return (
    <>
      <header className="sticky top-0 z-50 glass-effect border-b border-adaptive">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-24">
            {/* Logo - Clickable */}
            <button
              onClick={handleLogoClick}
              className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <img
                src={logo}
                alt="ShinyPull Logo"
                className="w-48 h-auto object-contain"
              />
            </button>

            {/* Spacer for centered layout */}
            <div className="flex-1"></div>

            {/* Right Side - Theme Toggle & Auth */}
            <div className="flex items-center gap-2 md:gap-4">
              {/* My Collection Button - Only shown when logged in */}
              {user && (
                <button
                  onClick={handleCollectionClick}
                  className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 rounded-xl bg-adaptive-card hover:bg-adaptive-hover text-adaptive-primary border border-adaptive transition-colors"
                >
                  <Package className="w-5 h-5 text-blue-500" />
                  <span className="hidden md:inline text-sm font-medium">My Collection</span>
                </button>
              )}

              {/* My Alerts Button - Only shown when logged in */}
              {user && (
                <button
                  onClick={handleAlertsClick}
                  className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-900 border border-amber-600 transition-all shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50"
                >
                  <Bell className="w-5 h-5" />
                  <span className="hidden md:inline text-sm font-bold">My Alerts</span>
                </button>
              )}

              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-lg bg-adaptive-card hover:bg-adaptive-hover text-adaptive-secondary transition-colors border border-adaptive"
                aria-label="Toggle theme"
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {/* Auth Section */}
              {loading ? (
                <div className="w-10 h-10 rounded-full bg-adaptive-card animate-pulse" />
              ) : user ? (
                /* Logged In User */
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 p-1.5 rounded-xl bg-adaptive-card hover:bg-adaptive-hover border border-adaptive transition-colors"
                  >
                    {getUserAvatar() ? (
                      <img
                        src={getUserAvatar()}
                        alt="Avatar"
                        className="w-8 h-8 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <span className="hidden md:block text-sm font-medium text-adaptive-primary pr-2 max-w-[120px] truncate">
                      {getUserDisplayName()}
                    </span>
                  </button>

                  {/* User Dropdown Menu */}
                  {showUserMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowUserMenu(false)}
                      />
                      <div className="absolute right-0 top-full mt-2 w-48 bg-adaptive-card rounded-xl border border-adaptive shadow-xl z-50 py-2">
                        <div className="px-4 py-2 border-b border-adaptive">
                          <p className="text-sm font-medium text-adaptive-primary truncate">
                            {getUserDisplayName()}
                          </p>
                          <p className="text-xs text-adaptive-tertiary truncate">
                            {user.email}
                          </p>
                        </div>
                        {/* Mobile: Show My Collection in dropdown */}
                        <button
                          onClick={handleCollectionClick}
                          className="md:hidden w-full flex items-center gap-2 px-4 py-2 text-sm text-adaptive-primary hover:bg-adaptive-hover transition-colors"
                        >
                          <Package className="w-4 h-4 text-blue-500" />
                          My Collection
                        </button>
                        <button
                          onClick={handleAlertsClick}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-amber-500 hover:bg-amber-500/10 transition-colors font-medium"
                        >
                          <Bell className="w-4 h-4" />
                          My Alerts
                        </button>
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-adaptive-hover transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                /* Sign In Button */
                <>
                  {/* Mobile */}
                  <button
                    onClick={() => openAuthModal()}
                    className="md:hidden p-2 text-adaptive-secondary hover:text-adaptive-primary transition-colors"
                  >
                    <User className="w-6 h-6" />
                  </button>

                  {/* Desktop */}
                  <button
                    onClick={() => openAuthModal()}
                    className="hidden md:block px-5 py-2.5 bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-500 hover:from-yellow-300 hover:via-yellow-400 hover:to-amber-400 text-slate-900 font-bold rounded-xl transition-all shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/50"
                  >
                    Sign In
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
      />
    </>
  );
};

export default Header;
