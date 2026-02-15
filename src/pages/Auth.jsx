import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import SEO from '../components/SEO';
import { Mail, Lock, User, Star, Scale, Clock, BarChart3 } from 'lucide-react';

export default function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [mode, setMode] = useState(searchParams.get('mode') || 'signin'); // signin or signup
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

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
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: name,
            },
          },
        });
        
        if (error) throw error;
        setMessage('Check your email for the confirmation link!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        navigate('/');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO 
        title={mode === 'signup' ? 'Sign Up' : 'Sign In'}
        description="Sign in to Shiny Pull to track your favorite creators and access personalized analytics."
      />
      
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">
              {mode === 'signup' ? 'Create Account' : 'Welcome Back'}
            </h1>
            <p className="text-gray-400">
              {mode === 'signup'
                ? 'Sign up to start tracking your favorite creators'
                : 'Sign in to your Shiny Pull account'}
            </p>
          </div>

          {/* Benefits Section - Only show on signup */}
          {mode === 'signup' && (
            <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-xl border border-indigo-500/20 p-6 mb-6">
              <h3 className="font-semibold text-white mb-4">Why Create an Account?</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Star className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-white font-medium">Follow Your Favorite Creators</p>
                    <p className="text-xs text-gray-400">Never miss updates from the creators you love</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <BarChart3 className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-white font-medium">Track Growth in Your Dashboard</p>
                    <p className="text-xs text-gray-400">See daily stats and growth trends in one place</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Scale className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-white font-medium">Save and Compare Creators</p>
                    <p className="text-xs text-gray-400">Compare stats side-by-side across platforms</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-white font-medium">View Your Recently Browsed Profiles</p>
                    <p className="text-xs text-gray-400">Quick access to creators you've checked out</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
            {/* Google Sign In */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full bg-white text-gray-900 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 mb-6 disabled:opacity-50"
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
                <span className="px-2 bg-gray-800 text-gray-400">Or continue with email</span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleEmailAuth} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg py-3 px-10 focus:outline-none focus:border-blue-500"
                      placeholder="Your name"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg py-3 px-10 focus:outline-none focus:border-blue-500"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg py-3 px-10 focus:outline-none focus:border-blue-500"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500 text-red-500 rounded-lg p-3 text-sm">
                  {error}
                </div>
              )}

              {message && (
                <div className="bg-green-500/10 border border-green-500 text-green-500 rounded-lg p-3 text-sm">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {loading ? 'Loading...' : mode === 'signup' ? 'Create Account' : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 text-center text-sm">
              <button
                onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                className="text-blue-500 hover:text-blue-400"
              >
                {mode === 'signin' 
                  ? "Don't have an account? Sign up" 
                  : 'Already have an account? Sign in'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
