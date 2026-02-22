import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LobbyPage from './pages/LobbyPage';

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        fontFamily: 'Arial, sans-serif'
      }}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/:code" element={<LobbyPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
