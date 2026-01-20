import React from 'react';
import { Sparkles, Menu } from 'lucide-react';

const Header = () => {
  return (
    <header className="sticky top-0 z-50 glass-effect border-b border-slate-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-400 blur-xl opacity-50 rounded-full animate-pulse-slow" />
              <div className="relative w-12 h-12 bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/50">
                <Sparkles className="w-6 h-6 text-slate-900" strokeWidth={2.5} />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-display text-slate-100 tracking-tight">
                <span className="shiny-text">ShinyPull</span>
              </h1>
              <p className="text-xs text-amber-400 font-mono">
                ✨ Track your shiny cards
              </p>
            </div>
          </div>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center gap-6">
            <a 
              href="#" 
              className="text-sm font-medium text-primary-400 hover:text-primary-300 transition-colors"
            >
              Pokémon
            </a>
            <a 
              href="#" 
              className="text-sm font-medium text-slate-400 hover:text-slate-300 transition-colors"
            >
              Magic: The Gathering
            </a>
            <a 
              href="#" 
              className="text-sm font-medium text-slate-400 hover:text-slate-300 transition-colors"
            >
              Yu-Gi-Oh!
            </a>
          </nav>

          {/* Menu Button - Mobile */}
          <button className="md:hidden p-2 text-slate-400 hover:text-slate-200 transition-colors">
            <Menu className="w-6 h-6" />
          </button>

          {/* CTA Button - Desktop */}
          <button className="hidden md:block px-5 py-2.5 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-900 font-semibold rounded-xl transition-all shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50">
            Sign In
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
