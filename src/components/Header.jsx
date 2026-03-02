import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, Search, Trophy, Menu, X, Scale, BookOpen, User, LogOut, LayoutDashboard, Calculator, Heart, Settings, FileSpreadsheet, ChevronDown, LayoutGrid } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import AuthPanel from './AuthPanel';
import UpgradePanel from './UpgradePanel';

const moreLinks = [
  {
    path: '/compare',
    label: 'Compare',
    description: 'Side-by-side creator stats',
    icon: Scale,
    gradient: 'from-violet-600 to-purple-700',
    hoverBorder: 'hover:border-violet-500/40',
    hoverBg: 'hover:bg-violet-950/20',
  },
  {
    path: '/youtube/money-calculator',
    label: 'Earnings Calc',
    description: 'Estimate YouTube revenue',
    icon: Calculator,
    gradient: 'from-emerald-500 to-teal-600',
    hoverBorder: 'hover:border-emerald-500/40',
    hoverBg: 'hover:bg-emerald-950/20',
  },
  {
    path: '/dashboard',
    label: 'Dashboard',
    description: 'Your followed creators',
    icon: LayoutDashboard,
    gradient: 'from-indigo-500 to-blue-600',
    hoverBorder: 'hover:border-indigo-500/40',
    hoverBg: 'hover:bg-indigo-950/20',
  },
  {
    path: '/reports',
    label: 'Reports',
    description: 'Bulk exports and analytics',
    icon: FileSpreadsheet,
    gradient: 'from-amber-500 to-orange-500',
    hoverBorder: 'hover:border-amber-500/40',
    hoverBg: 'hover:bg-amber-950/20',
    badge: 'Mod',
  },
  {
    path: '/blog',
    label: 'Blog',
    description: 'Creator economy insights',
    icon: BookOpen,
    gradient: 'from-sky-500 to-cyan-600',
    hoverBorder: 'hover:border-sky-500/40',
    hoverBg: 'hover:bg-sky-950/20',
  },
  {
    path: '/support',
    label: 'Support',
    description: 'Get help from our team',
    icon: Heart,
    gradient: 'from-rose-500 to-pink-600',
    hoverBorder: 'hover:border-rose-500/40',
    hoverBg: 'hover:bg-rose-950/20',
  },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [authPanelOpen, setAuthPanelOpen] = useState(false);
  const [authPanelMessage, setAuthPanelMessage] = useState('');
  const [authPanelReturnTo, setAuthPanelReturnTo] = useState(null);
  const [upgradePanelOpen, setUpgradePanelOpen] = useState(false);
  const [upgradePanelFeature, setUpgradePanelFeature] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, isAuthenticated } = useAuth();
  const { tier } = useSubscription();
  const mobileMenuRef = useRef(null);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setMoreMenuOpen(false);
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

  // Close more menu on Escape
  useEffect(() => {
    if (!moreMenuOpen) return;
    const handleKey = (e) => { if (e.key === 'Escape') setMoreMenuOpen(false); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [moreMenuOpen]);

  // Listen for custom event to open auth panel
  useEffect(() => {
    const handleOpenAuthPanel = (e) => {
      setAuthPanelMessage(e.detail?.message || '');
      setAuthPanelReturnTo(e.detail?.returnTo || null);
      setAuthPanelOpen(true);
    };
    window.addEventListener('openAuthPanel', handleOpenAuthPanel);
    return () => window.removeEventListener('openAuthPanel', handleOpenAuthPanel);
  }, []);

  // Navigate to returnTo after successful login
  useEffect(() => {
    if (isAuthenticated && authPanelReturnTo) {
      navigate(authPanelReturnTo);
      setAuthPanelReturnTo(null);
    }
  }, [isAuthenticated, authPanelReturnTo, navigate]);

  // Listen for custom event to open upgrade panel
  useEffect(() => {
    const handleOpenUpgradePanel = (e) => {
      setUpgradePanelFeature(e.detail?.feature || null);
      setUpgradePanelOpen(true);
    };
    window.addEventListener('openUpgradePanel', handleOpenUpgradePanel);
    return () => window.removeEventListener('openUpgradePanel', handleOpenUpgradePanel);
  }, []);

  const isActive = (path) => {
    if (path === '/rankings') return location.pathname.startsWith('/rankings');
    if (path === '/blog') return location.pathname.startsWith('/blog');
    return location.pathname === path;
  };

  const isMoreActive = moreLinks.some(link => isActive(link.path));

  return (
    <header ref={mobileMenuRef} className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-2 group flex-shrink-0">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:shadow-xl group-hover:shadow-indigo-500/30 transition-shadow">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-100">
              Shiny<span className="text-indigo-600">Pull</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">

            {/* Search */}
            <Link
              to="/search"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                isActive('/search')
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-300 hover:bg-indigo-950/50 hover:text-indigo-400 border border-transparent'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Search</span>
            </Link>

            {/* Rankings */}
            <Link
              to="/rankings"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                isActive('/rankings')
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-300 hover:bg-indigo-950/50 hover:text-indigo-400 border border-transparent'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>Rankings</span>
            </Link>

            {/* More launcher */}
            <div className="relative">
              <button
                onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  moreMenuOpen || isMoreActive
                    ? 'bg-gray-800 text-gray-100 border border-gray-700'
                    : 'text-gray-300 hover:bg-gray-800/70 hover:text-gray-100 border border-transparent'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                <span>More</span>
                <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${moreMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {moreMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMoreMenuOpen(false)} />
                  <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[400px] bg-[#0d0d14] border border-gray-800 rounded-2xl shadow-2xl shadow-black/70 z-50 p-3">
                    <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest px-1 mb-2.5">Features</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {moreLinks.map(link => {
                        const Icon = link.icon;
                        const active = isActive(link.path);
                        return (
                          <Link
                            key={link.path}
                            to={link.path}
                            onClick={() => setMoreMenuOpen(false)}
                            className={`group flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 ${
                              active
                                ? 'bg-gray-800 border-gray-600'
                                : `bg-gray-900/60 border-gray-800/60 ${link.hoverBorder} ${link.hoverBg}`
                            }`}
                          >
                            <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${link.gradient} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                              <Icon className="w-[18px] h-[18px] text-white" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="font-semibold text-gray-100 text-sm leading-tight">{link.label}</p>
                                {link.badge && (
                                  <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 leading-none flex-shrink-0">
                                    {link.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 leading-tight mt-0.5 truncate">{link.description}</p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Auth section */}
            <div className="ml-4 pl-4 border-l border-gray-700">
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  </button>

                  {userMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                      <div className="absolute right-0 mt-2 w-48 bg-gray-900 rounded-xl shadow-lg border border-gray-800 py-2 z-50">
                        <div className="px-4 py-2 border-b border-gray-800 mb-1">
                          <p className="text-xs text-gray-300 truncate">{user?.email}</p>
                        </div>
                        <Link
                          to="/account"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-gray-100 w-full transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                          Account Settings
                        </Link>
                        <div className="border-t border-gray-800 mt-1 pt-1">
                          <button
                            onClick={() => {
                              signOut();
                              setUserMenuOpen(false);
                            }}
                            className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-red-400 w-full transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setAuthPanelOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-500 transition-colors"
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
              className="p-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-gray-100 transition-colors"
              aria-label="Search"
            >
              <Search className="w-6 h-6" />
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-gray-100 transition-colors"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-gray-800">
            <div className="flex flex-col gap-1">

              {/* Primary links */}
              <Link
                to="/search"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                  isActive('/search')
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-300 hover:bg-indigo-950/50 hover:text-indigo-400'
                }`}
              >
                <Search className="w-5 h-5" />
                <span>Search</span>
              </Link>
              <Link
                to="/rankings"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                  isActive('/rankings')
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-300 hover:bg-indigo-950/50 hover:text-indigo-400'
                }`}
              >
                <Trophy className="w-5 h-5" />
                <span>Rankings</span>
              </Link>

              {/* Features grid */}
              <div className="mt-3 pt-3 border-t border-gray-800">
                <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest px-1 mb-2">Features</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {moreLinks.map(link => {
                    const Icon = link.icon;
                    const active = isActive(link.path);
                    return (
                      <Link
                        key={link.path}
                        to={link.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all duration-200 ${
                          active
                            ? 'bg-gray-800 border-gray-600'
                            : 'bg-gray-800/40 border-gray-800'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${link.gradient} flex items-center justify-center flex-shrink-0`}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-100 text-sm leading-tight truncate">{link.label}</p>
                          {link.badge && (
                            <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 leading-none">
                              {link.badge}
                            </span>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Mobile Auth */}
              <div className="mt-4 pt-4 border-t border-gray-800">
                {isAuthenticated ? (
                  <>
                    <div className="px-4 py-2">
                      <p className="text-xs text-gray-300 truncate">{user?.email}</p>
                    </div>
                    <Link
                      to="/account"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-gray-300 hover:bg-gray-800 hover:text-gray-100 transition-colors"
                    >
                      <Settings className="w-5 h-5" />
                      Account Settings
                    </Link>
                    <button
                      onClick={() => {
                        signOut();
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-gray-300 hover:bg-gray-800 hover:text-red-400 transition-colors w-full"
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
                    className="flex items-center justify-center gap-2 py-3 px-6 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-500 transition-colors w-full"
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

      {/* Upgrade Panel */}
      <UpgradePanel
        isOpen={upgradePanelOpen}
        onClose={() => {
          setUpgradePanelOpen(false);
          setUpgradePanelFeature(null);
        }}
        feature={upgradePanelFeature}
      />
    </header>
  );
}
