import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, X, Star, Scale, Clock, BarChart3 } from 'lucide-react';

export default function AuthPanel({ isOpen, onClose, message: contextMessage }) {
  const { isAuthenticated } = useAuth();
  const [mode, setMode] = useState('signup'); // signin, signup, or reset (default to signup for new user acquisition)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);

  // Trigger slide-in animation when opening
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure DOM is ready
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
    }
  }, [isOpen]);

  // Auto-close panel when user logs in
  useEffect(() => {
    if (isAuthenticated && isOpen) {
      onClose();
    }
  }, [isAuthenticated, isOpen, onClose]);

  // Close panel on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      
      if (error) throw error;
      // Panel will auto-close when auth state changes
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        // Supabase returns a user with no identities when the email already exists
        // (it doesn't send a confirmation email in this case)
        if (data?.user && data.user.identities?.length === 0) {
          // Switch to sign-in mode with email pre-populated
          setMode('signin');
          setError('');
          setMessage('An account with this email already exists. Sign in below.');
          setPassword('');
        } else {
          setMessage('Check your email for the confirmation link!');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        // Panel will auto-close when auth state changes
        onClose();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset`,
      });

      if (error) throw error;
      setMessage('Check your email for the password reset link!');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 ${
          isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Slide-out Panel */}
      <div className={`fixed right-0 top-0 h-full w-full sm:w-[480px] bg-gray-900 z-50 shadow-2xl overflow-y-auto transform transition-all duration-300 ease-out ${
        isAnimating ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-100">
            {mode === 'signup' ? 'Create Account' : mode === 'reset' ? 'Reset Password' : 'Welcome Back'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-800 hover:text-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-8">
          {contextMessage && (
            <div className="mb-6 bg-indigo-950/50 border border-indigo-800 rounded-lg p-4 flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm text-indigo-800 font-medium">{contextMessage}</p>
              </div>
            </div>
          )}
          
          <p className="text-gray-500 mb-6">
            {mode === 'signup'
              ? 'Sign up to start tracking your favorite creators'
              : mode === 'reset'
              ? 'Enter your email to receive a password reset link'
              : 'Sign in to your Shiny Pull account'}
          </p>

          {/* Benefits Section - Only show on signup */}
          {mode === 'signup' && (
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 p-5 mb-6">
              <h3 className="font-semibold text-gray-100 mb-4 text-sm">Why Create an Account?</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Star className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-100 font-medium">Follow Your Favorite Creators</p>
                    <p className="text-xs text-gray-500">Never miss updates from the creators you love</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <BarChart3 className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-100 font-medium">Track Growth in Your Dashboard</p>
                    <p className="text-xs text-gray-500">See daily stats and growth trends in one place</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Scale className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-100 font-medium">Save and Compare Creators</p>
                    <p className="text-xs text-gray-500">Compare stats side-by-side across platforms</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-100 font-medium">View Your Recently Browsed Profiles</p>
                    <p className="text-xs text-gray-500">Quick access to creators you've checked out</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Google Sign In - hidden for reset mode */}
          {mode !== 'reset' && (
            <>
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full bg-gray-900 text-gray-100 py-3 rounded-lg font-medium border-2 border-gray-700 hover:border-gray-600 hover:bg-gray-800/50 transition-colors flex items-center justify-center gap-2 mb-6 disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </button>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-900 text-gray-500">Or continue with email</span>
                </div>
              </div>
            </>
          )}

          {/* Email/Password Form */}
          <form onSubmit={mode === 'reset' ? handleResetPassword : handleEmailAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg py-3 px-10 text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            {mode !== 'reset' && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg py-3 px-10 text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-950/30 border border-red-800 text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {message && (
              <div className="bg-green-950/30 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : mode === 'signup' ? 'Create Account' : mode === 'reset' ? 'Send Reset Link' : 'Sign In'}
            </button>
          </form>

          {/* Forgot Password Link - only show in signin mode */}
          {mode === 'signin' && (
            <div className="mt-4 text-center">
              <button
                onClick={() => {
                  setMode('reset');
                  setError('');
                  setMessage('');
                }}
                className="text-gray-500 hover:text-gray-500 text-sm"
              >
                Forgot your password?
              </button>
            </div>
          )}

          {/* Toggle Mode */}
          <div className="mt-4 text-center">
            <button
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setError('');
                setMessage('');
              }}
              className="text-indigo-600 hover:text-indigo-300 font-medium text-sm"
            >
              {mode === 'reset'
                ? 'Back to sign in'
                : mode === 'signin'
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
