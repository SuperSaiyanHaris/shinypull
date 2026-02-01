import { Link } from 'react-router-dom';
import { BarChart3, Search, Trophy } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-gray-800 border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-blue-500" />
            <span className="text-xl font-bold">ShinyPull</span>
          </Link>

          <nav className="flex items-center gap-6">
            <Link
              to="/search"
              className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
            >
              <Search className="w-5 h-5" />
              <span>Search</span>
            </Link>
            <Link
              to="/rankings"
              className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
            >
              <Trophy className="w-5 h-5" />
              <span>Rankings</span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
