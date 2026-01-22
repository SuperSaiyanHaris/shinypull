import React, { useState, useEffect } from 'react';
import { Search, Grid, List, SortDesc, Filter } from 'lucide-react';
import { getAllSets } from '../services/dbSetService';
import { useAuth } from '../contexts/AuthContext';

const SetBrowser = ({ onSetClick }) => {
  const { loading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('releaseDate'); // releaseDate, name, totalCards
  const [viewMode, setViewMode] = useState('grid'); // grid, list
  const [filterSeries, setFilterSeries] = useState('all');
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait for auth to settle before loading sets
    if (authLoading) {
      console.log('[SetBrowser] Waiting for auth to settle...');
      return;
    }

    const loadSets = async () => {
      try {
        setLoading(true);
        console.log('[SetBrowser] Loading sets...');
        const allSets = await getAllSets();
        console.log('[SetBrowser] Loaded', allSets?.length || 0, 'sets');
        setSets(allSets || []);
      } catch (error) {
        console.error('[SetBrowser] CRITICAL ERROR loading sets:', error);
        console.error('[SetBrowser] Error stack:', error.stack);
        setSets([]);
      } finally {
        console.log('[SetBrowser] Setting loading to false');
        setLoading(false);
      }
    };
    loadSets();
  }, [authLoading]);

  // Get unique series for filter
  const seriesOptions = ['all', ...new Set(sets.map(s => s.series))].filter(Boolean);

  const filteredSets = sets
    .filter(set => {
      const matchesSearch = set.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSeries = filterSeries === 'all' || set.series === filterSeries;
      return matchesSearch && matchesSeries;
    })
    .sort((a, b) => {
      if (sortBy === 'releaseDate') return new Date(b.releaseDate) - new Date(a.releaseDate);
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'totalCards') return b.totalCards - a.totalCards;
      return 0;
    });

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="glass-effect rounded-2xl p-6 border border-adaptive">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Search */}
          <div className="md:col-span-5">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-adaptive-tertiary" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search sets..."
                className="w-full pl-12 pr-4 py-3 bg-adaptive-card border border-adaptive rounded-xl text-adaptive-primary placeholder-adaptive-tertiary focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
          </div>

          {/* Filter by Series */}
          <div className="md:col-span-3">
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-adaptive-tertiary" />
              <select
                value={filterSeries}
                onChange={(e) => setFilterSeries(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-adaptive-card border border-adaptive rounded-xl text-adaptive-primary focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer"
              >
                {seriesOptions.map(series => (
                  <option key={series} value={series}>
                    {series === 'all' ? 'All Series' : series}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sort By */}
          <div className="md:col-span-2">
            <div className="relative">
              <SortDesc className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-adaptive-tertiary" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-adaptive-card border border-adaptive rounded-xl text-adaptive-primary focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer"
              >
                <option value="releaseDate">Latest</option>
                <option value="name">Name</option>
                <option value="totalCards">Cards</option>
              </select>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="md:col-span-2 flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-adaptive-card text-adaptive-secondary hover:bg-adaptive-hover border border-adaptive'
              }`}
            >
              <Grid className="w-5 h-5 mx-auto" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-adaptive-card text-adaptive-secondary hover:bg-adaptive-hover border border-adaptive'
              }`}
            >
              <List className="w-5 h-5 mx-auto" />
            </button>
          </div>
        </div>

        {/* Results Count */}
        <div className="mt-4 pt-4 border-t border-adaptive">
          <p className="text-sm text-adaptive-tertiary">
            Showing <span className="font-semibold text-adaptive-primary">{filteredSets.length}</span> sets
          </p>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
      {/* Sets Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSets.map((set, index) => (
            <div
              key={set.id}
              onClick={() => onSetClick(set)}
              className="glass-effect rounded-2xl overflow-hidden hover:scale-[1.02] transition-transform duration-300 cursor-pointer animate-slide-up border border-adaptive"
              style={{ animationDelay: `${index * 75}ms` }}
            >
              <div className="relative aspect-[16/9] bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center p-8">
                <img
                  src={set.logo}
                  alt={set.name}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/400x225?text=' + encodeURIComponent(set.name);
                  }}
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-display text-adaptive-primary mb-2">
                  {set.name}
                </h3>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-adaptive-secondary">{set.series}</span>
                  <span className="text-adaptive-tertiary">{set.totalCards} cards</span>
                </div>
                <div className="mt-3 pt-3 border-t border-adaptive">
                  <span className="text-xs text-adaptive-tertiary">
                    Released: {new Date(set.releaseDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSets.map((set, index) => (
            <div
              key={set.id}
              onClick={() => onSetClick(set)}
              className="glass-effect rounded-xl p-6 hover:bg-adaptive-hover transition-all cursor-pointer animate-slide-up border border-adaptive flex items-center gap-6"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex-shrink-0 w-32 h-20 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900 rounded-lg flex items-center justify-center p-3">
                <img
                  src={set.logo}
                  alt={set.name}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/200x100?text=' + encodeURIComponent(set.name);
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-display text-adaptive-primary truncate">
                  {set.name}
                </h3>
                <p className="text-sm text-adaptive-secondary mt-1">{set.series}</p>
              </div>
              <div className="flex-shrink-0 text-right">
                <p className="text-sm font-semibold text-adaptive-primary">{set.totalCards} cards</p>
                <p className="text-xs text-adaptive-tertiary mt-1">
                  {new Date(set.releaseDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
        </>
      )}
    </div>
  );
};

export default SetBrowser;
