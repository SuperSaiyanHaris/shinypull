import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import BackToTop from './components/BackToTop';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider } from './contexts/AuthContext';
import Home from './pages/Home';
import CreatorProfile from './pages/CreatorProfile';
import Search from './pages/Search';
import Rankings from './pages/Rankings';
import Compare from './pages/Compare';
import LiveCount from './pages/LiveCount';
import Dashboard from './pages/Dashboard';
import About from './pages/About';
import Contact from './pages/Contact';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import BlogAdmin from './pages/BlogAdmin';
import ResetPassword from './pages/ResetPassword';
import Calculator from './pages/Calculator';
import Gear from './pages/Gear';
import Support from './pages/Support';

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-900 text-white flex flex-col">
        <ScrollToTop />
        <BackToTop />
        <Header />
        <main className="flex-1">
          <ErrorBoundary>
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
          </ErrorBoundary>
        </main>
        <Footer />
      </div>
    </AuthProvider>
  );
}

export default App;
