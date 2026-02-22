import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

console.log('main.tsx is running');
console.log('Root element:', document.getElementById('root'));

const rootElement = document.getElementById('root');
if (rootElement) {
  console.log('Root element found, creating React root');
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
} else {
  console.error('Root element not found!');
}
