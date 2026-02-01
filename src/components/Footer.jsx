import { Link } from 'react-router-dom';
import { BarChart3, Youtube, Twitch } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-900 border-t border-gray-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-6 h-6 text-blue-500" />
              <span className="text-lg">
                <span className="font-bold">Shiny</span> Pull
              </span>
            </Link>
            <p className="text-sm text-gray-400">
              Social media analytics and statistics for YouTube, Twitch, TikTok, Instagram, and Twitter creators.
            </p>
          </div>
          
          {/* Products */}
          <div>
            <h3 className="font-semibold mb-4 text-white">Products</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/rankings" className="text-gray-400 hover:text-white transition-colors">
                  Top Rankings
                </Link>
              </li>
              <li>
                <Link to="/search" className="text-gray-400 hover:text-white transition-colors">
                  Creator Search
                </Link>
              </li>
              <li>
                <Link to="/compare" className="text-gray-400 hover:text-white transition-colors">
                  Compare Channels
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Platforms */}
          <div>
            <h3 className="font-semibold mb-4 text-white">Platforms</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/rankings/youtube" className="text-gray-400 hover:text-white transition-colors flex items-center gap-2">
                  <Youtube className="w-4 h-4" />
                  YouTube Stats
                </Link>
              </li>
              <li>
                <Link to="/rankings/twitch" className="text-gray-400 hover:text-white transition-colors flex items-center gap-2">
                  <Twitch className="w-4 h-4" />
                  Twitch Stats
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Company */}
          <div>
            <h3 className="font-semibold mb-4 text-white">Company</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/about" className="text-gray-400 hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-400 hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-gray-400 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-gray-400 hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
          <p>&copy; {currentYear} Shiny Pull. All rights reserved.</p>
          <p className="mt-2">
            Statistics are provided for informational purposes only. Earnings estimates are approximate.
          </p>
        </div>
      </div>
    </footer>
  );
}
