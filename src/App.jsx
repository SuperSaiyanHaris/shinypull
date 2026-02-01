import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import CreatorProfile from './pages/CreatorProfile';
import Search from './pages/Search';
import Rankings from './pages/Rankings';

function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/rankings" element={<Rankings />} />
          <Route path="/rankings/:platform" element={<Rankings />} />
          <Route path="/:platform/:username" element={<CreatorProfile />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
