import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BarChart3, Search, Trophy, Menu, X, Scale, BookOpen, User, LogOut, LayoutDashboard, Calculator, ShoppingBag, Heart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import AuthPanel from './AuthPanel';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [authPanelOpen, setAuthPanelOpen] = useState(false);
  const [authPanelMessage, setAuthPanelMessage] = useState('');
  const location = useLocation();
  const { user, signOut, isAuthenticated } = useAuth();
  const mobileMenuRef = useRef(null);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    if (!mobileMenuOpen) return;
    function handleClick(e) {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) {
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('touchstart', handleClick);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('touchstart', handleClick);
    };
  }, [mobileMenuOpen]);

  // Listen for custom event to open auth panel
  useEffect(() => {
    const handleOpenAuthPanel = (e) => {
      setAuthPanelMessage(e.detail?.message || '');
      setAuthPanelOpen(true);
    };
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
    { path: '/youtube/money-calculator', label: 'Money Calculator', icon: Calculator },
    { path: '/gear', label: 'Gear', icon: ShoppingBag },
    { path: '/blog', label: 'Blog', icon: BookOpen },
    { path: '/support', label: 'Support', icon: Heart },
  ];

  // Close auth panel when user logs in
  const handleAuthStateChange = () => {
    if (isAuthenticated) {
      setAuthPanelOpen(false);
    }
  };

  return (
    <header ref={mobileMenuRef} className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-2 group">
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
                    ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                    : 'text-gray-700 hover:bg-indigo-200 hover:text-indigo-700 border border-transparent'
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
                    ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                    : 'text-gray-700 hover:bg-indigo-200 hover:text-indigo-700 border border-transparent'
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
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-indigo-200 transition-colors"
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
                          className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-indigo-200 hover:text-indigo-700 w-full transition-colors"
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
                  Sign Up / Sign In
                </button>
              )}
            </div>
          </nav>

          {/* Mobile action buttons */}
          <div className="md:hidden flex items-center gap-1">
            <Link
              to="/search"
              className="p-2 rounded-lg text-gray-600 hover:bg-indigo-200 hover:text-indigo-600 transition-colors"
              aria-label="Search"
            >
              <Search className="w-6 h-6" />
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:bg-indigo-200 hover:text-indigo-600 transition-colors"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
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
                      ? 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                      : 'text-gray-600 hover:bg-indigo-200 hover:text-indigo-700 border border-transparent'
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
                      className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-gray-600 hover:bg-indigo-200 hover:text-indigo-700 transition-colors"
                    >
                      <LayoutDashboard className="w-5 h-5" />
                      My Dashboard
                    </Link>
                    <button
                      onClick={() => {
                        signOut();
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-gray-600 hover:bg-indigo-200 hover:text-indigo-700 transition-colors w-full"
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
                    Sign Up / Sign In
                  </button>
                )}
              </div>
            </div>
          </nav>
        )}
      </div>

      {/* Auth Panel */}
      <AuthPanel 
        isOpen={authPanelOpen} 
        onClose={() => {
          setAuthPanelOpen(false);
          setAuthPanelMessage('');
        }} 
        message={authPanelMessage}
      />
    </header>
  );
}
