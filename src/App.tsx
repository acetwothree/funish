import { BrowserRouter, Routes, Route } from 'react-router-dom';

console.log('App component with routing is loading');

function TestComponent() {
  return (
    <div style={{padding: '40px', textAlign: 'center', color: 'white'}}>
      <h1 style={{fontSize: '48px', marginBottom: '20px'}}>TEST COMPONENT</h1>
      <p>This should build larger than 711 bytes</p>
    </div>
  );
}

export default function App() {
  console.log('App function called - should show routing');
  
  return (
    <BrowserRouter>
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        fontFamily: 'Arial, sans-serif'
      }}>
        <Routes>
          <Route path="/" element={<TestComponent />} />
          <Route path="/:code" element={<div style={{padding: '40px', textAlign: 'center', color: 'white'}}>Lobby Code: Coming Soon</div>} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
