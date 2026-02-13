import { RefreshCw, Wifi, WifiOff } from 'lucide-react';

/**
 * Fun error state component for service outages and failures
 * Shows animated illustrations and humorous messages instead of boring error text
 *
 * @param {string} type - Error type: 'loading', 'network', 'server', 'notfound'
 * @param {string} message - Optional custom error message
 * @param {function} onRetry - Optional retry callback function
 * @param {string} retryText - Optional custom retry button text
 */
export default function FunErrorState({
  type = 'server',
  message,
  onRetry,
  retryText = 'Try Again'
}) {
  const errorTypes = {
    server: {
      title: "We're having a moment...",
      message: message || "Our servers are taking a coffee break ☕ They'll be back shortly!",
      emoji: '🔧',
      animation: 'bounce'
    },
    network: {
      title: "Houston, we have a problem",
      message: message || "Can't reach our servers. Check your internet connection! 🚀",
      emoji: '📡',
      animation: 'pulse'
    },
    loading: {
      title: "Taking longer than usual...",
      message: message || "Our hamsters are working overtime to fetch your data 🐹",
      emoji: '⏳',
      animation: 'spin'
    },
    notfound: {
      title: "Nothing to see here",
      message: message || "This page is playing hide and seek... and winning! 🙈",
      emoji: '🔍',
      animation: 'shake'
    }
  };

  const config = errorTypes[type] || errorTypes.server;

  return (
    <div className="min-h-[400px] flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        {/* Animated emoji */}
        <div className={`text-8xl mb-6 inline-block ${
          config.animation === 'bounce' ? 'animate-bounce' :
          config.animation === 'pulse' ? 'animate-pulse' :
          config.animation === 'spin' ? 'animate-spin-slow' :
          'animate-shake'
        }`}>
          {config.emoji}
        </div>

        {/* Title */}
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
          {config.title}
        </h2>

        {/* Message */}
        <p className="text-gray-600 text-lg mb-8 leading-relaxed">
          {config.message}
        </p>

        {/* Retry button */}
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 group"
          >
            <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
            {retryText}
          </button>
        )}

        {/* Connection status indicator */}
        {type === 'network' && (
          <div className="mt-8 flex items-center justify-center gap-2 text-sm text-gray-500">
            <WifiOff className="w-4 h-4 text-red-500 animate-pulse" />
            <span>Waiting for connection...</span>
          </div>
        )}

        {/* Server status indicator */}
        {type === 'server' && (
          <div className="mt-8 flex items-center justify-center gap-2 text-sm text-gray-500">
            <div className="flex gap-1.5">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse delay-75"></div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse delay-150"></div>
            </div>
            <span>Service temporarily unavailable</span>
          </div>
        )}

        {/* Loading indicator */}
        {type === 'loading' && (
          <div className="mt-8 flex items-center justify-center gap-2 text-sm text-gray-500">
            <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <span>Still loading...</span>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }

        .animate-shake {
          animation: shake 0.5s ease-in-out infinite;
        }

        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .delay-75 {
          animation-delay: 75ms;
        }

        .delay-150 {
          animation-delay: 150ms;
        }
      `}</style>
    </div>
  );
}
