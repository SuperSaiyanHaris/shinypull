import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink, Award } from 'lucide-react';
import { formatPrice } from '../services/cardService';

const PSA10Dropdown = ({ psa10Data, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!psa10Data) return null;

  const { avg, verified, recentListings = [], searchUrl } = psa10Data;

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Truncate long titles
  const truncateTitle = (title, maxLength = 50) => {
    if (!title) return 'Listing';
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength) + '...';
  };

  return (
    <div className={`relative ${className}`}>
      {/* Main PSA 10 Price Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 modal-card rounded-lg hover:shadow-sm transition-all border group"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-500" />
            <span className="text-adaptive-primary font-semibold">
              {verified ? 'PSA 10 (eBay)' : 'PSA 10 (estimated)'}
            </span>
          </div>
          {verified ? (
            <span className="px-2 py-0.5 bg-green-500/20 text-green-600 dark:text-green-400 text-xs font-bold rounded-full border border-green-500/30">
              ✓ Verified
            </span>
          ) : (
            <span className="px-2 py-0.5 badge-estimated text-xs font-bold rounded-full">
              ~Estimated
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
            {formatPrice(avg)}
          </span>
          {verified && recentListings.length > 0 && (
            isOpen ? (
              <ChevronUp className="w-5 h-5 text-adaptive-tertiary group-hover:text-adaptive-primary transition-colors" />
            ) : (
              <ChevronDown className="w-5 h-5 text-adaptive-tertiary group-hover:text-adaptive-primary transition-colors" />
            )
          )}
        </div>
      </button>

      {/* Dropdown with recent listings */}
      {isOpen && verified && recentListings.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 animate-fade-in">
          <div className="glass-effect rounded-xl border border-adaptive shadow-xl overflow-hidden">
            <div className="p-3 border-b border-adaptive bg-gradient-to-r from-yellow-500/10 to-transparent">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-semibold text-adaptive-primary">
                  Last 3 PSA 10 Cards Sold
                </span>
              </div>
            </div>

            <div className="divide-y divide-adaptive">
              {recentListings.map((listing, index) => (
                <a
                  key={index}
                  href={listing.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 hover:bg-adaptive-hover transition-colors group"
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="text-sm text-adaptive-primary font-medium truncate group-hover:text-blue-500 transition-colors">
                      {truncateTitle(listing.title)}
                    </p>
                    <p className="text-xs text-adaptive-tertiary mt-0.5">
                      Sold {formatDate(listing.date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm font-bold text-green-500">
                      {formatPrice(listing.price)}
                    </span>
                    <ExternalLink className="w-4 h-4 text-adaptive-tertiary group-hover:text-blue-500 transition-colors" />
                  </div>
                </a>
              ))}
            </div>

            {searchUrl && (
              <a
                href={searchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 p-3 bg-blue-500/10 hover:bg-blue-500/20 transition-colors group"
              >
                <span className="text-sm font-medium text-blue-500">
                  View all PSA 10 sold listings on eBay
                </span>
                <ExternalLink className="w-4 h-4 text-blue-500" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default PSA10Dropdown;
