import React, { useEffect, useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import SearchBar from './components/SearchBar';
import CardGrid from './components/CardGrid';
import SetBrowser from './components/SetBrowser';
import SetDetailPage from './components/SetDetailPage';
import AdminSyncPanel from './components/AdminSyncPanel';
import { useCardSearch } from './hooks/useCardSearch';
import { preloadPopularSearches } from './services/cardService';

function App() {
  const { query, setQuery, cards, loading } = useCardSearch();
  const [currentView, setCurrentView] = useState('sets'); // 'sets', 'setDetail', 'search', 'admin'
  const [selectedSet, setSelectedSet] = useState(null);
  const [showAdmin, setShowAdmin] = useState(false);

  // Preload popular searches on app startup for better performance
  useEffect(() => {
    preloadPopularSearches();
  }, []);

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
                <h5 className="text-sm font-semibold text-adaptive-secondary mb-3">Resources</h5>
                <ul className="space-y-2">
                  <li><a href="#" className="text-sm text-adaptive-tertiary hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Pokemon TCG API</a></li>
                  <li><a href="#" className="text-sm text-adaptive-tertiary hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Help Center</a></li>
                  <li><a href="#" className="text-sm text-adaptive-tertiary hover:text-blue-600 dark:hover:text-blue-400 transition-colors">About</a></li>
                </ul>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-adaptive">
              <p className="text-center text-sm text-adaptive-tertiary">
                © 2024 ShinyPull. Built with React + Vite.
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default App;
