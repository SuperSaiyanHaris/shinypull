/**
 * Skeleton loading components for better UX
 */

// Row skeleton for creator lists
export function CreatorRowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-2xl animate-pulse">
      {/* Avatar */}
      <div className="w-16 h-16 bg-gray-200 rounded-xl flex-shrink-0"></div>

      {/* Content */}
      <div className="flex-1">
        <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-24"></div>
      </div>

      {/* Stats */}
      <div className="hidden sm:flex flex-col items-end gap-2">
        <div className="h-4 bg-gray-200 rounded w-20"></div>
        <div className="h-4 bg-gray-200 rounded w-16"></div>
      </div>
    </div>
  );
}

// Grid skeleton for ranking cards
export function RankingCardSkeleton() {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 animate-pulse">
      <div className="flex items-start gap-4 mb-4">
        {/* Rank */}
        <div className="w-8 h-8 bg-gray-200 rounded-lg flex-shrink-0"></div>

        {/* Avatar */}
        <div className="w-16 h-16 bg-gray-200 rounded-xl flex-shrink-0"></div>

        {/* Name */}
        <div className="flex-1">
          <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-24"></div>
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
    </div>
  );
}

// Table skeleton
export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
        <div className="flex gap-4">
          <div className="h-4 bg-gray-200 rounded w-12 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-24 ml-auto animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
        </div>
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="px-6 py-4 border-b border-gray-50 last:border-0">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
              <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Compare card skeleton
export function CompareCardSkeleton() {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-20 h-20 bg-gray-200 rounded-xl flex-shrink-0"></div>
        <div className="flex-1">
          <div className="h-6 bg-gray-200 rounded w-40 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-24"></div>
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded w-20"></div>
          <div className="h-5 bg-gray-200 rounded w-32"></div>
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded w-20"></div>
          <div className="h-5 bg-gray-200 rounded w-32"></div>
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded w-24"></div>
          <div className="h-5 bg-gray-200 rounded w-28"></div>
        </div>
      </div>
    </div>
  );
}
