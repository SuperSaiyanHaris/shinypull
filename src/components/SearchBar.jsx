import React from 'react';
import { Search, X } from 'lucide-react';

const SearchBar = ({ value, onChange, onClear }) => {
  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="relative search-glow rounded-2xl transition-all duration-300">
        <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
          <Search className="h-6 w-6 text-blue-600 dark:text-blue-400" strokeWidth={2.5} />
        </div>

        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search by card name or number..."
          className="w-full pl-16 pr-14 py-5 bg-white dark:bg-slate-800
                     border-2 border-slate-300 dark:border-slate-700 rounded-2xl
                     text-lg text-slate-900 dark:text-slate-100
                     placeholder-slate-500 dark:placeholder-slate-400
                     focus:outline-none focus:border-blue-500 dark:focus:border-blue-500
                     focus:bg-white dark:focus:bg-slate-800
                     transition-all duration-300"
        />

        {value && (
          <button
            onClick={onClear}
            className="absolute inset-y-0 right-0 pr-6 flex items-center
                       text-slate-500 dark:text-slate-400
                       hover:text-slate-700 dark:hover:text-slate-200
                       transition-colors"
            aria-label="Clear search"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Decorative underline */}
      <div className="mt-2 h-1 w-full max-w-md mx-auto rounded-full bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
    </div>
  );
};

export default SearchBar;
