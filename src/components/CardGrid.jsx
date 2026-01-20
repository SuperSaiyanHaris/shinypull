import React from 'react';
import CardItem from './CardItem';
import { Package } from 'lucide-react';

const CardGrid = ({ cards, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div 
            key={i} 
            className="glass-effect rounded-2xl p-6 animate-pulse"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="aspect-[3/4] bg-slate-800 rounded-xl mb-4" />
            <div className="h-6 bg-slate-800 rounded mb-3" />
            <div className="h-4 bg-slate-800 rounded w-2/3 mb-4" />
            <div className="h-8 bg-slate-800 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="text-center py-20 animate-fade-in">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-800/50 mb-6">
          <Package className="w-10 h-10 text-slate-600" />
        </div>
        <h3 className="text-2xl font-display text-slate-300 mb-2">
          No cards found
        </h3>
        <p className="text-slate-500">
          Try adjusting your search terms
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map((card, index) => (
        <CardItem 
          key={card.id} 
          card={card} 
          index={index}
        />
      ))}
    </div>
  );
};

export default CardGrid;
