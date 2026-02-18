import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import BackToTop from './components/BackToTop';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider } from './contexts/AuthContext';

// Eagerly load the homepage (critical path)
import Home from './pages/Home';

// Lazy load everything else — only downloaded when the route is visited
const CreatorProfile = lazy(() => import('./pages/CreatorProfile'));
const Search = lazy(() => import('./pages/Search'));
const Rankings = lazy(() => import('./pages/Rankings'));
const Compare = lazy(() => import('./pages/Compare'));
const LiveCount = lazy(() => import('./pages/LiveCount'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));
const Blog = lazy(() => import('./pages/Blog'));
const BlogPost = lazy(() => import('./pages/BlogPost'));
const BlogAdmin = lazy(() => import('./pages/BlogAdmin'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Calculator = lazy(() => import('./pages/Calculator'));
const Gear = lazy(() => import('./pages/Gear'));
const Support = lazy(() => import('./pages/Support'));

// Minimal loading fallback
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-900 text-white flex flex-col">
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
