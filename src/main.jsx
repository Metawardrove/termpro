import React from 'react';
import ReactDOM from 'react-dom/client';
import '@xterm/xterm/css/xterm.css';
import './index.css';
import App from './App.jsx';

// Bloquea el default de Electron de navegar al archivo droppeado fuera de zonas manejadas
window.addEventListener('dragover', (e) => e.preventDefault());
window.addEventListener('drop', (e) => e.preventDefault());

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
