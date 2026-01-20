import React, { useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import SearchBar from './components/SearchBar';
import CardGrid from './components/CardGrid';
import { useCardSearch } from './hooks/useCardSearch';
import { preloadPopularSearches } from './services/cardService';

function App() {
  const { query, setQuery, cards, loading } = useCardSearch();

  // Preload popular searches on app startup for better performance
  useEffect(() => {
    preloadPopularSearches();
  }, []);

  const handleClear = () => {
    setQuery('');
  };

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

            {/* Results Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-display text-adaptive-primary">
                  {query ? 'Search Results' : 'Popular Cards'}
                </h3>
                {!loading && cards.length > 0 && (
                  <span className="text-sm text-adaptive-tertiary font-mono">
                    {cards.length} {cards.length === 1 ? 'card' : 'cards'}
                  </span>
                )}
              </div>
              
              <CardGrid cards={cards} loading={loading} />
            </div>
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
