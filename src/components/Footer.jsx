import { Link } from 'react-router-dom';
import { BarChart3, Youtube, Twitch } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-100 mt-auto">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">
                Shiny<span className="text-indigo-600">Pull</span>
              </span>
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed">
              Social media analytics and statistics for YouTube, Twitch, and more.
            </p>
          </div>

          {/* Features */}
          <div>
            <h3 className="font-semibold mb-4 text-gray-900">Features</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/rankings" className="text-gray-500 hover:text-indigo-600 transition-colors">
                  Top Rankings
                </Link>
              </li>
              <li>
                <Link to="/search" className="text-gray-500 hover:text-indigo-600 transition-colors">
                  Creator Search
                </Link>
              </li>
            </ul>
          </div>

          {/* Platforms */}
          <div>
            <h3 className="font-semibold mb-4 text-gray-900">Platforms</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/rankings/youtube" className="text-gray-500 hover:text-indigo-600 transition-colors flex items-center gap-2">
                  <Youtube className="w-4 h-4" />
                  YouTube Stats
                </Link>
              </li>
              <li>
                <Link to="/rankings/twitch" className="text-gray-500 hover:text-indigo-600 transition-colors flex items-center gap-2">
                  <Twitch className="w-4 h-4" />
                  Twitch Stats
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold mb-4 text-gray-900">Company</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/blog" className="text-gray-500 hover:text-indigo-600 transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-500 hover:text-indigo-600 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-500 hover:text-indigo-600 transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-gray-500 hover:text-indigo-600 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-gray-500 hover:text-indigo-600 transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-8 text-center text-sm text-gray-400">
          <p>&copy; {currentYear} ShinyPull. All rights reserved.</p>
          <p className="mt-2">
            Statistics are provided for informational purposes only.
          </p>
        </div>
      </div>
    </footer>
  );
}
