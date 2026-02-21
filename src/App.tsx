import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LobbyPage from './pages/LobbyPage';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#FFFAF0] selection:bg-fun-pink selection:text-white">
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/:code" element={<LobbyPage />} />
          </Routes>
        </AnimatePresence>
        
        {/* Floating Decorative Elements */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 opacity-20">
          <div className="absolute top-10 left-10 w-20 h-20 bg-fun-yellow rounded-full animate-bounce" />
          <div className="absolute bottom-20 right-10 w-32 h-32 bg-fun-pink rounded-full animate-pulse" />
          <div className="absolute top-1/2 right-20 w-16 h-16 bg-fun-blue rotate-45 animate-spin" />
          <div className="absolute bottom-10 left-1/4 w-24 h-24 bg-fun-green rounded-xl rotate-12" />
        </div>
      </div>
    </BrowserRouter>
  );
}
