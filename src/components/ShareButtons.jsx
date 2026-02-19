import { Facebook, Linkedin, Link2, Check } from 'lucide-react';

function XIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
import { useState } from 'react';
import logger from '../lib/logger';
import { SOCIAL_SHARE_URLS } from '../lib/config';
import { TIMEOUTS } from '../lib/constants';

/**
 * Social sharing buttons component
 * Allows users to share content on social media
 */
export default function ShareButtons({ url, title }) {
  const [copied, setCopied] = useState(false);

  const shareLinks = {
    twitter: SOCIAL_SHARE_URLS.twitter(url, title),
    facebook: SOCIAL_SHARE_URLS.facebook(url),
    linkedin: SOCIAL_SHARE_URLS.linkedin(url),
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), TIMEOUTS.COPY_FEEDBACK);
    } catch (err) {
      logger.error('Failed to copy:', err);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-gray-500">Share:</span>
      
      <div className="flex items-center gap-2">
        {/* X (formerly Twitter) */}
        <a
          href={shareLinks.twitter}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-500 hover:text-gray-100 transition-colors"
          aria-label="Share on X"
        >
          <XIcon className="w-4 h-4" />
        </a>

        {/* Facebook */}
        <a
          href={shareLinks.facebook}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-lg bg-gray-800 hover:bg-blue-900/30 text-gray-500 hover:text-blue-400 transition-colors"
          aria-label="Share on Facebook"
        >
          <Facebook className="w-4 h-4" />
        </a>

        {/* LinkedIn */}
        <a
          href={shareLinks.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-lg bg-gray-800 hover:bg-blue-900/30 text-gray-500 hover:text-blue-400 transition-colors"
          aria-label="Share on LinkedIn"
        >
          <Linkedin className="w-4 h-4" />
        </a>

        {/* Copy Link */}
        <button
          onClick={handleCopyLink}
          className="p-2 rounded-lg bg-gray-800 hover:bg-indigo-900/50 text-gray-500 hover:text-indigo-400 transition-colors relative"
          aria-label="Copy link"
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-600" />
          ) : (
            <Link2 className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}
