import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import CreatorProfile from './pages/CreatorProfile';
import Search from './pages/Search';
import Rankings from './pages/Rankings';
import Compare from './pages/Compare';
import LiveCount from './pages/LiveCount';
import Auth from './pages/Auth';
import About from './pages/About';
import Contact from './pages/Contact';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';

function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/rankings" element={<Rankings />} />
          <Route path="/rankings/:platform" element={<Rankings />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/live/:platform/:username" element={<LiveCount />} />
          <Route path="/:platform/:username" element={<CreatorProfile />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/signin" element={<Auth />} />
          <Route path="/signup" element={<Auth />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
