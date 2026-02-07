import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BarChart3, Search, Trophy, Menu, X, Scale, BookOpen, User, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import AuthPanel from './AuthPanel';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [authPanelOpen, setAuthPanelOpen] = useState(false);
  const location = useLocation();
  const { user, signOut, isAuthenticated } = useAuth();

  // Listen for custom event to open auth panel
  useEffect(() => {
    const handleOpenAuthPanel = () => setAuthPanelOpen(true);
    window.addEventListener('openAuthPanel', handleOpenAuthPanel);
    return () => window.removeEventListener('openAuthPanel', handleOpenAuthPanel);
  }, []);

  const isActive = (path) => {
    if (path === '/rankings') {
      return location.pathname.startsWith('/rankings');
    }
    if (path === '/blog') {
      return location.pathname.startsWith('/blog');
    }
    return location.pathname === path;
  };

  const navLinks = [
    { path: '/search', label: 'Search', icon: Search },
    { path: '/rankings', label: 'Rankings', icon: Trophy },
    { path: '/compare', label: 'Compare', icon: Scale },
    { path: '/blog', label: 'Blog', icon: BookOpen },
  ];

  // Close auth panel when user logs in
  const handleAuthStateChange = () => {
    if (isAuthenticated) {
      setAuthPanelOpen(false);
    }
  };

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:shadow-xl group-hover:shadow-indigo-500/30 transition-shadow">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">
              Shiny<span className="text-indigo-600">Pull</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  isActive(link.path)
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <link.icon className="w-4 h-4" />
                <span>{link.label}</span>
              </Link>
            ))}

            {/* Dashboard Link (Desktop Only, When Authenticated) */}
            {isAuthenticated && (
              <Link
                to="/dashboard"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  isActive('/dashboard')
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>
            )}

            {/* Auth Section */}
            <div className="ml-4 pl-4 border-l border-gray-200">
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-indigo-600" />
                    </div>
                  </button>

                  {userMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                        <button
                          onClick={() => {
                            signOut();
                            setUserMenuOpen(false);
                          }}
                          className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50 w-full"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setAuthPanelOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                >
                  <User className="w-4 h-4" />
                  Sign In
                </button>
              )}
            </div>
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-gray-100">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                    isActive(link.path)
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <link.icon className="w-5 h-5" />
                  <span>{link.label}</span>
                </Link>
              ))}

              {/* Mobile Auth Section */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                {isAuthenticated ? (
                  <>
                    <Link
                      to="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-gray-600 hover:bg-gray-50"
                    >
                      <LayoutDashboard className="w-5 h-5" />
                      My Dashboard
                    </Link>
                    <button
                      onClick={() => {
                        signOut();
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-gray-600 hover:bg-gray-50 w-full"
                    >
                      <LogOut className="w-5 h-5" />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setAuthPanelOpen(true);
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center justify-center gap-2 py-3 px-6 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors w-full"
                  >
                    <User className="w-5 h-5" />
                    Sign In
                  </button>
                )}
              </div>
            </div>
          </nav>
        )}
      </div>

      {/* Auth Panel */}
      <AuthPanel isOpen={authPanelOpen} onClose={() => setAuthPanelOpen(false)} />
    </header>
  );
}
