import React, { useState } from 'react';
import { Menu, Sun, Moon } from 'lucide-react';
import logo from '../imgs/shinypulllogo.png';

const Header = () => {
  const [darkMode, setDarkMode] = useState(true);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('light-mode');
  };

  return (
    <header className="sticky top-0 z-50 glass-effect border-b border-slate-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-24">
          {/* Logo - Made Bigger */}
          <div className="flex items-center gap-4">
            <img
              src={logo}
              alt="ShinyPull Logo"
              className="w-48 h-auto object-contain"
            />
          </div>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center gap-6">
            <a
              href="#"
              className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
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

          {/* Right Side - Theme Toggle & Buttons */}
          <div className="flex items-center gap-4">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 transition-colors"
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Menu Button - Mobile */}
            <button className="md:hidden p-2 text-slate-400 hover:text-slate-200 transition-colors">
              <Menu className="w-6 h-6" />
            </button>

            {/* CTA Button - Desktop */}
            <button className="hidden md:block px-5 py-2.5 bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-500 hover:from-yellow-300 hover:via-yellow-400 hover:to-amber-400 text-slate-900 font-semibold rounded-xl transition-all shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/50">
              Sign In
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
