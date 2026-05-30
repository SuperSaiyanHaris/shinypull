import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

/**
 * Breadcrumb navigation — light theme.
 * Used at the top of blog posts and other deep pages.
 */
export default function Breadcrumbs({ items }) {
  if (!items || items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-7">
      <ol className="flex items-center flex-wrap gap-1.5 text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="flex items-center gap-1.5 min-w-0">
              {index > 0 && (
                <ChevronRight className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" aria-hidden="true" />
              )}
              {isLast ? (
                <span
                  className="font-semibold text-neutral-900 truncate max-w-[180px] sm:max-w-[320px] md:max-w-[480px]"
                  aria-current="page"
                  title={item.label}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.path}
                  className="text-neutral-500 hover:text-indigo-600 font-medium transition-colors"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
