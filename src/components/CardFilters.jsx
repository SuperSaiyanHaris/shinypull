import React from 'react';
import { Search, X, ChevronDown, ChevronUp } from 'lucide-react';

const CardFilters = ({ filters, onFiltersChange, showOwnershipFilter = false, onClose }) => {
  const [expandedSections, setExpandedSections] = React.useState({
    sort: true,
    ownership: true,
    type: true,
    supertype: true,
    rarity: true
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleFilterChange = (category, value) => {
    const currentValues = filters[category] || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    
    onFiltersChange({ ...filters, [category]: newValues });
  };

  const handleSortChange = (value) => {
    onFiltersChange({ ...filters, sortBy: value });
  };

  const handleOwnershipChange = (value) => {
    onFiltersChange({ ...filters, ownership: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      sortBy: 'number',
      ownership: 'all',
      types: [],
      supertypes: [],
      rarities: []
    });
  };

  const activeFilterCount = () => {
    let count = 0;
    if (filters.types?.length) count += filters.types.length;
    if (filters.supertypes?.length) count += filters.supertypes.length;
    if (filters.rarities?.length) count += filters.rarities.length;
    if (showOwnershipFilter && filters.ownership !== 'all') count += 1;
    return count;
  };

  const FilterSection = ({ title, section, children }) => (
    <div className="border-b border-adaptive last:border-b-0">
      <button
        onClick={() => toggleSection(section)}
        className="w-full flex items-center justify-between p-4 hover:bg-adaptive-hover transition-colors"
      >
        <span className="font-semibold text-adaptive-primary text-sm">{title}</span>
        {expandedSections[section] ? (
          <ChevronUp className="w-4 h-4 text-adaptive-tertiary" />
        ) : (
          <ChevronDown className="w-4 h-4 text-adaptive-tertiary" />
        )}
      </button>
      {expandedSections[section] && (
        <div className="px-4 pb-4">
          {children}
        </div>
      )}
    </div>
  );

  const FilterButton = ({ active, onClick, children, icon }) => (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
        active
          ? 'bg-blue-600 text-white font-medium'
          : 'bg-adaptive-card hover:bg-adaptive-hover text-adaptive-secondary border border-adaptive'
      }`}
    >
      <div className="flex items-center gap-2">
        {icon && <span className="text-xs">{icon}</span>}
        {children}
      </div>
    </button>
  );

  return (
    <div className="h-full flex flex-col bg-adaptive">
      {/* Header with Close Button */}
      <div className="p-6 border-b border-adaptive bg-adaptive-card sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-display text-adaptive-primary">Filters</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-adaptive-hover rounded-lg transition-colors"
            aria-label="Close filters"
          >
            <X className="w-6 h-6 text-adaptive-secondary" />
          </button>
        </div>
        {activeFilterCount() > 0 && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            <X className="w-4 h-4" />
            Clear all filters ({activeFilterCount()})
          </button>
        )}
      </div>

      {/* Scrollable Filter Content */}
      <div className="flex-1 overflow-y-auto">

      {/* Sort By */}
      <FilterSection title="Sort By" section="sort">
        <div className="space-y-2">
          <FilterButton
            active={filters.sortBy === 'name'}
            onClick={() => handleSortChange('name')}
          >
            Name (A-Z)
          </FilterButton>
          <FilterButton
            active={filters.sortBy === 'number'}
            onClick={() => handleSortChange('number')}
          >
            Number
          </FilterButton>
        </div>
      </FilterSection>

      {/* Ownership Filter (Collection page only) */}
      {showOwnershipFilter && (
        <FilterSection title="Card State" section="ownership">
          <div className="space-y-2">
            <FilterButton
              active={filters.ownership === 'all'}
              onClick={() => handleOwnershipChange('all')}
            >
              All Cards
            </FilterButton>
            <FilterButton
              active={filters.ownership === 'owned'}
              onClick={() => handleOwnershipChange('owned')}
            >
              Owned
            </FilterButton>
            <FilterButton
              active={filters.ownership === 'not-owned'}
              onClick={() => handleOwnershipChange('not-owned')}
            >
              Not Owned
            </FilterButton>
          </div>
        </FilterSection>
      )}

      {/* Card Supertype */}
      <FilterSection title="Card Type" section="supertype">
        <div className="space-y-2">
          <FilterButton
            active={filters.supertypes?.includes('Pokémon')}
            onClick={() => handleFilterChange('supertypes', 'Pokémon')}
            icon="🎴"
          >
            Pokémon
          </FilterButton>
          <FilterButton
            active={filters.supertypes?.includes('Trainer')}
            onClick={() => handleFilterChange('supertypes', 'Trainer')}
            icon="👤"
          >
            Trainer
          </FilterButton>
          <FilterButton
            active={filters.supertypes?.includes('Energy')}
            onClick={() => handleFilterChange('supertypes', 'Energy')}
            icon="⚡"
          >
            Energy
          </FilterButton>
        </div>
      </FilterSection>

      {/* Pokemon Types */}
      <FilterSection title="Pokémon Type" section="type">
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: 'Colorless', icon: '⚪', color: 'bg-gray-500' },
            { value: 'Darkness', icon: '🌑', color: 'bg-gray-800' },
            { value: 'Dragon', icon: '🐉', color: 'bg-purple-600' },
            { value: 'Fairy', icon: '🧚', color: 'bg-pink-400' },
            { value: 'Fighting', icon: '👊', color: 'bg-orange-600' },
            { value: 'Fire', icon: '🔥', color: 'bg-red-600' },
            { value: 'Grass', icon: '🌿', color: 'bg-green-600' },
            { value: 'Lightning', icon: '⚡', color: 'bg-yellow-500' },
            { value: 'Metal', icon: '⚙️', color: 'bg-gray-400' },
            { value: 'Psychic', icon: '🔮', color: 'bg-purple-500' },
            { value: 'Water', icon: '💧', color: 'bg-blue-600' }
          ].map(type => (
            <FilterButton
              key={type.value}
              active={filters.types?.includes(type.value)}
              onClick={() => handleFilterChange('types', type.value)}
              icon={type.icon}
            >
              {type.value}
            </FilterButton>
          ))}
        </div>
      </FilterSection>

      {/* Rarity */}
      <FilterSection title="Rarity" section="rarity">
        <div className="space-y-2">
          {[
            'Common',
            'Uncommon',
            'Rare',
            'Rare Holo',
            'Rare Holo EX',
            'Rare Holo GX',
            'Rare Holo V',
            'Rare Holo VMAX',
            'Rare Holo VSTAR',
            'Rare Ultra',
            'Rare Secret',
            'Rare Rainbow',
            'Rare Shiny',
            'Amazing Rare',
            'Radiant Rare',
            'Illustration Rare',
            'Special Illustration Rare',
            'Hyper Rare',
            'Double Rare',
            'Ultra Rare',
            'Promo'
          ].map(rarity => (
            <FilterButton
              key={rarity}
              active={filters.rarities?.includes(rarity)}
              onClick={() => handleFilterChange('rarities', rarity)}
            >
              {rarity}
            </FilterButton>
          ))}
        </div>
      </FilterSection>
      </div>
    </div>
  );
};

export default CardFilters;
