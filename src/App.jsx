import { lazy, Suspense, useEffect, useRef } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import BackToTop from './components/BackToTop';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider } from './contexts/AuthContext';

// Eagerly load the homepage (critical path)
import Home from './pages/Home';

// Auto-reload on chunk load failure (happens after new deployments)
function lazyWithRetry(importFn) {
  return lazy(() =>
    importFn().catch(() => {
      // Chunk not found — new deploy invalidated old filenames. Reload once.
      if (!sessionStorage.getItem('chunk_reload')) {
        sessionStorage.setItem('chunk_reload', '1');
        window.location.reload();
      }
      // If already reloaded once and still failing, let error boundary handle it
      sessionStorage.removeItem('chunk_reload');
      return importFn();
    })
  );
}

// Clear the reload flag on successful page loads
if (sessionStorage.getItem('chunk_reload')) {
  sessionStorage.removeItem('chunk_reload');
}

// Lazy load everything else — only downloaded when the route is visited
const CreatorProfile = lazyWithRetry(() => import('./pages/CreatorProfile'));
const Search = lazyWithRetry(() => import('./pages/Search'));
const Rankings = lazyWithRetry(() => import('./pages/Rankings'));
const Compare = lazyWithRetry(() => import('./pages/Compare'));
const LiveCount = lazyWithRetry(() => import('./pages/LiveCount'));
const Dashboard = lazyWithRetry(() => import('./pages/Dashboard'));
const About = lazyWithRetry(() => import('./pages/About'));
const Contact = lazyWithRetry(() => import('./pages/Contact'));
const Privacy = lazyWithRetry(() => import('./pages/Privacy'));
const Terms = lazyWithRetry(() => import('./pages/Terms'));
const Blog = lazyWithRetry(() => import('./pages/Blog'));
const BlogPost = lazyWithRetry(() => import('./pages/BlogPost'));
const BlogAdmin = lazyWithRetry(() => import('./pages/BlogAdmin'));
const ResetPassword = lazyWithRetry(() => import('./pages/ResetPassword'));
const Calculator = lazyWithRetry(() => import('./pages/Calculator'));
const Gear = lazyWithRetry(() => import('./pages/Gear'));
const Support = lazyWithRetry(() => import('./pages/Support'));
const Account = lazyWithRetry(() => import('./pages/Account'));

// Minimal loading fallback
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// Fires a GA4 page_view on every client-side navigation.
// index.html already fires one on initial load, so we skip the first render.
function RouteChangeTracker() {
  const location = useLocation();
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    if (window.gtag) {
      window.gtag('config', 'G-1KWMEM41YG', {
        page_path: location.pathname + location.search,
      });
    }
  }, [location]);

  return null;
}

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-900 text-white flex flex-col">
        <RouteChangeTracker />
        <ScrollToTop />
        <BackToTop />
        <Header />
        <main className="flex-1">
          <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/rankings" element={<Rankings />} />
            <Route path="/rankings/:platform" element={<Rankings />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/youtube/money-calculator" element={<Calculator />} />
            <Route path="/gear" element={<Gear />} />
            <Route path="/live/:platform/:username" element={<LiveCount />} />
            <Route path="/:platform/:username" element={<CreatorProfile />} />
            <Route path="/auth/reset" element={<ResetPassword />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/account" element={<Account />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/support" element={<Support />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/admin" element={<BlogAdmin />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
          </Routes>
          </Suspense>
          </ErrorBoundary>
        </main>
        <Footer />
      </div>
    </AuthProvider>
  );
}

export default App;
