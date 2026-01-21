import React, { useEffect, useState } from 'react';
import { Analytics } from '@vercel/analytics/react';
import Header from './components/Header';
import Hero from './components/Hero';
import SearchBar from './components/SearchBar';
import CardGrid from './components/CardGrid';
import SetBrowser from './components/SetBrowser';
import SetDetailPage from './components/SetDetailPage';
import AdminSyncPanel from './components/AdminSyncPanel';
import TermsOfUse from './components/TermsOfUse';
import PrivacyPolicy from './components/PrivacyPolicy';
import { useCardSearch } from './hooks/useCardSearch';

function App() {
  const { query, setQuery, cards, loading } = useCardSearch();
  const [currentView, setCurrentView] = useState('sets'); // 'sets', 'setDetail', 'search', 'terms', 'privacy'
  const [selectedSet, setSelectedSet] = useState(null);
  const [showAdmin, setShowAdmin] = useState(false);

  // Switch to search view when user types
  useEffect(() => {
    if (query) {
      setCurrentView('search');
    } else {
      setCurrentView('sets');
    }
  }, [query]);

  const handleClear = () => {
    setQuery('');
    setCurrentView('sets');
  };

  const handleSetClick = (set) => {
    setSelectedSet(set);
    setCurrentView('setDetail');
  };

  const handleBackToSets = () => {
    setSelectedSet(null);
    setCurrentView('sets');
  };

  // Listen for Ctrl+Shift+A to toggle admin panel
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        setShowAdmin(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen">
      <Header />

      <main>
        <Hero />

        {/* Search Section */}
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-12 animate-slide-up" style={{ animationDelay: '300ms' }}>
              <SearchBar
                value={query}
                onChange={setQuery}
                onClear={handleClear}
              />
            </div>

            {/* Admin Panel */}
            {showAdmin && (
              <div className="mb-8">
                <AdminSyncPanel />
              </div>
            )}

            {/* Content Section */}
            {currentView === 'sets' && (
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
            )}

            {currentView === 'setDetail' && selectedSet && (
              <SetDetailPage set={selectedSet} onBack={handleBackToSets} />
            )}

            {currentView === 'search' && (
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
            )}

            {currentView === 'terms' && (
              <TermsOfUse onBack={() => setCurrentView('sets')} />
            )}

            {currentView === 'privacy' && (
              <PrivacyPolicy onBack={() => setCurrentView('sets')} />
            )}
          </div>
        </section>

        {/* Footer */}
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
                      onClick={() => setCurrentView('terms')}
                      className="text-sm text-adaptive-tertiary hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      Terms of Use
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setCurrentView('privacy')}
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
      </main>
      <Analytics />
    </div>
  );
}

export default App;
