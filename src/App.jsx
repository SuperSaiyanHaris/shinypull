import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, useParams } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import Header from './components/Header';
import Hero from './components/Hero';
import SearchBar from './components/SearchBar';
import CardGrid from './components/CardGrid';
import SetBrowser from './components/SetBrowser';
import SetDetailPage from './components/SetDetailPage';
import MyCollection from './components/MyCollection';
import MyAlerts from './components/MyAlerts';
import AdminSyncPanel from './components/AdminSyncPanel';
import CardPage from './components/CardPage';
import TermsOfUse from './components/TermsOfUse';
import PrivacyPolicy from './components/PrivacyPolicy';
import ScrollToTop from './components/ScrollToTop';
import { useCardSearch } from './hooks/useCardSearch';
import { getAllSets } from './services/dbSetService';
import { useAuth } from './contexts/AuthContext';

function CollectionWrapper() {
  const { setId } = useParams();
  return <MyCollection selectedSetId={setId} />;
}

function SetDetailWrapper({ selectedSet, onSetLoaded }) {
  const { setId } = useParams();
  const [set, setSet] = useState(selectedSet);
  const [loading, setLoading] = useState(!selectedSet);

  useEffect(() => {
    if (!selectedSet && setId) {
      // Fetch set data if not available (e.g., on page refresh)
      const fetchSet = async () => {
        setLoading(true);
        try {
          const allSets = await getAllSets();
          const foundSet = allSets.find(s => s.id === setId);
          if (foundSet) {
            setSet(foundSet);
            if (onSetLoaded) onSetLoaded(foundSet);
          }
        } catch (error) {
          console.error('Error fetching set:', error);
        }
        setLoading(false);
      };
      fetchSet();
    } else if (selectedSet) {
      setSet(selectedSet);
      setLoading(false);
    }
  }, [setId, selectedSet, onSetLoaded]);

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="inline-block w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-adaptive-tertiary">Loading set...</p>
      </div>
    );
  }

  if (!set) {
    return (
      <div className="text-center py-20">
        <p className="text-adaptive-tertiary">Set not found</p>
      </div>
    );
  }

  return <SetDetailPage set={set} />;
}

function AppContent() {
  const { query, setQuery, cards, loading } = useCardSearch();
  const [selectedSet, setSelectedSet] = useState(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Admin emails
  const ADMIN_EMAILS = ['haris.lilic@gmail.com', 'shinypull@proton.me'];
  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);

  // Switch to search view when user types
  useEffect(() => {
    if (query && location.pathname === '/') {
      navigate('/search');
    }
  }, [query, location.pathname, navigate]);

  const handleClear = () => {
    setQuery('');
    navigate('/');
  };

  // Listen for logo click to clear search
  useEffect(() => {
    const handleClearSearch = () => {
      setQuery('');
    };
    window.addEventListener('clearSearch', handleClearSearch);
    return () => window.removeEventListener('clearSearch', handleClearSearch);
  }, [setQuery]);

  const handleSetClick = (set) => {
    setSelectedSet(set);
    navigate(`/sets/${set.id}`);
  };

  const handleSetLoaded = (set) => {
    setSelectedSet(set);
  };

  const handleBackToSets = () => {
    setSelectedSet(null);
    navigate('/');
  };

  // Listen for Ctrl+Shift+A to toggle admin panel (admin users only)
  // Also check URL param ?admin=true for mobile access
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        // Only allow admin users to open the panel
        if (isAdmin) {
          setShowAdmin(prev => !prev);
        } else {
          console.warn('Admin panel access denied: not authorized');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAdmin]);

  // Check URL for ?admin=true (mobile-friendly access)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('admin') === 'true' && isAdmin) {
      setShowAdmin(true);
    }
  }, [location.search, isAdmin]);

  return (
    <div className="min-h-screen">
      <Header />
      <ScrollToTop />

      <main>
        {/* Hero - Only show on home page */}
        {location.pathname === '/' && <Hero />}

        {/* Search Section - Hide on collection, alerts, and set detail pages */}
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {!location.pathname.startsWith('/collection') && 
             !location.pathname.startsWith('/alerts') && 
             !location.pathname.startsWith('/sets/') && (
              <div className="mb-12 animate-slide-up" style={{ animationDelay: '300ms' }}>
                <SearchBar
                  value={query}
                  onChange={setQuery}
                  onClear={handleClear}
                />
              </div>
            )}

            {/* Admin Panel */}
            {showAdmin && (
              <div className="mb-8">
                <AdminSyncPanel />
              </div>
            )}

            {/* Routes */}
            <Routes>
              {/* Home / Sets Browser */}
              <Route path="/" element={
                <div className="mb-8">
                  <div className="mb-6">
                    <h3 className="text-2xl font-display text-adaptive-primary">
                      Browse Pokemon Sets
                    </h3>
                    <p className="text-sm text-adaptive-tertiary mt-2">
                      Explore cards from your favorite Pokemon TCG sets
                    </p>
                  </div>
                  <SetBrowser onSetClick={handleSetClick} />
                </div>
              } />

              {/* Set Detail Page */}
              <Route path="/sets/:setId" element={
                <SetDetailWrapper 
                  selectedSet={selectedSet} 
                  onSetLoaded={handleSetLoaded}
                />
              } />

              {/* Card Detail Page */}
              <Route path="/card/:cardId" element={
                <CardPage />
              } />

              {/* Search Results */}
              <Route path="/search" element={
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-display text-adaptive-primary">
                      Search Results
                    </h3>
                    {!loading && cards.length > 0 && (
                      <span className="text-sm text-adaptive-tertiary font-mono">
                        {cards.length} {cards.length === 1 ? 'card' : 'cards'}
                      </span>
                    )}
                  </div>
                  <CardGrid cards={cards} loading={loading} />
                </div>
              } />

              {/* My Collection */}
              <Route path="/collection" element={
                <MyCollection onBack={handleBackToSets} />
              } />
              
              {/* Collection Set View */}
              <Route path="/collection/sets/:setId" element={
                <CollectionWrapper />
              } />

              {/* My Alerts */}
              <Route path="/alerts" element={
                <MyAlerts onBack={handleBackToSets} />
              } />

              {/* Terms of Use */}
              <Route path="/terms" element={
                <TermsOfUse onBack={handleBackToSets} />
              } />

              {/* Privacy Policy */}
              <Route path="/privacy" element={
                <PrivacyPolicy onBack={handleBackToSets} />
              } />
            </Routes>
          </div>
        </section>

        {/* Footer */}
        <Footer />
      </main>
      <Analytics />
    </div>
  );
}

// Footer Component
function Footer() {
  const navigate = useNavigate();
  
  return (
    <footer className="border-t border-adaptive mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="col-span-1 md:col-span-2">
            <h4 className="text-lg font-display text-adaptive-primary mb-3">
              ShinyPull
            </h4>
            <p className="text-sm text-adaptive-tertiary max-w-md">
              Track your shiny Pokemon card collection with real-time prices.
              Monitor values, discover trends, and never miss a sparkle.
            </p>
          </div>

          <div>
            <h5 className="text-sm font-semibold text-adaptive-secondary mb-3">Legal</h5>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => navigate('/terms')}
                  className="text-sm text-adaptive-tertiary hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Terms of Use
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/privacy')}
                  className="text-sm text-adaptive-tertiary hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Privacy Policy
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Pokemon Disclaimer */}
        <div className="mt-8 pt-6 border-t border-adaptive">
          <p className="text-xs text-adaptive-tertiary text-center max-w-3xl mx-auto">
            ShinyPull is not affiliated with, sponsored or endorsed by, or in any way associated with Pokemon or The Pokemon Company International Inc. All Pokemon images, names, and related marks are trademarks of their respective owners.
          </p>
        </div>

        <div className="mt-6 pt-6 border-t border-adaptive">
          <p className="text-center text-sm text-adaptive-tertiary">
            © {new Date().getFullYear()} ShinyPull. Built with React + Vite.
          </p>
        </div>
      </div>
    </footer>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
