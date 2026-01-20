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
                <h3 className="text-2xl font-display text-slate-200">
                  {query ? 'Search Results' : 'Popular Cards'}
                </h3>
                {!loading && cards.length > 0 && (
                  <span className="text-sm text-slate-500 font-mono">
                    {cards.length} {cards.length === 1 ? 'card' : 'cards'}
                  </span>
                )}
              </div>
              
              <CardGrid cards={cards} loading={loading} />
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-800/50 mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="col-span-1 md:col-span-2">
                <h4 className="text-lg font-display text-slate-200 mb-3">
                  TCG Tracker
                </h4>
                <p className="text-sm text-slate-500 max-w-md">
                  The most comprehensive trading card game price tracking platform. 
                  Monitor prices, set alerts, and make informed trading decisions.
                </p>
              </div>
              
              <div>
                <h5 className="text-sm font-semibold text-slate-300 mb-3">Games</h5>
                <ul className="space-y-2">
                  <li><a href="#" className="text-sm text-slate-500 hover:text-primary-400 transition-colors">Pokémon</a></li>
                  <li><a href="#" className="text-sm text-slate-500 hover:text-primary-400 transition-colors">Magic: The Gathering</a></li>
                  <li><a href="#" className="text-sm text-slate-500 hover:text-primary-400 transition-colors">Yu-Gi-Oh!</a></li>
                </ul>
              </div>
              
              <div>
                <h5 className="text-sm font-semibold text-slate-300 mb-3">Resources</h5>
                <ul className="space-y-2">
                  <li><a href="#" className="text-sm text-slate-500 hover:text-primary-400 transition-colors">API Documentation</a></li>
                  <li><a href="#" className="text-sm text-slate-500 hover:text-primary-400 transition-colors">Help Center</a></li>
                  <li><a href="#" className="text-sm text-slate-500 hover:text-primary-400 transition-colors">Blog</a></li>
                </ul>
              </div>
            </div>
            
            <div className="mt-12 pt-8 border-t border-slate-800/50">
              <p className="text-center text-sm text-slate-600">
                © 2024 TCG Tracker. Built with React + Vite. MVP v0.1
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default App;
