import React from 'react';
import { Bell, Sparkles, Package } from 'lucide-react';

const Hero = () => {
  return (
    <section className="relative py-16 overflow-hidden">
      {/* Animated background elements - Sparkle theme */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-amber-400/15 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-yellow-300/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
        <div className="absolute top-40 right-20 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl animate-pulse-slow" style={{ animationDelay: '0.5s' }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto mb-12 animate-fade-in">
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-display text-adaptive-primary mb-6 leading-tight text-balance">
            Pull the best <span className="shiny-gradient">prices.</span>
          </h2>
        </div>

        {/* Feature Pills */}
        <div className="flex flex-wrap justify-center gap-4 mb-12 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <FeaturePill
            icon={<Sparkles className="w-4 h-4" />}
            text="Live shiny prices"
          />
          <FeaturePill
            icon={<Package className="w-4 h-4" />}
            text="Collection tracking"
          />
          <FeaturePill
            icon={<Bell className="w-4 h-4" />}
            text="Price alerts"
          />
        </div>
      </div>
    </section>
  );
};

const FeaturePill = ({ icon, text }) => (
  <div className="flex items-center gap-2 px-4 py-2 glass-effect rounded-full border border-amber-500/20 hover:border-amber-400/40 transition-colors">
    <div className="text-amber-500 dark:text-amber-400">
      {icon}
    </div>
    <span className="text-sm font-medium text-adaptive-secondary">
      {text}
    </span>
  </div>
);

export default Hero;
