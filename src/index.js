import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/variables.css';
import './index.css';
import App from './App';

// Disable right-click
document.addEventListener('contextmenu', e => e.preventDefault());

// Disable common inspect shortcuts
document.addEventListener('keydown', (e) => {
    // Block F12
    if (e.key === 'F12') {
        e.preventDefault();
    }

    // Block Ctrl+Shift+I or Ctrl+Shift+C or Ctrl+Shift+J
    if (e.ctrlKey && e.shiftKey && ['I', 'C', 'J'].includes(e.key.toUpperCase())) {
        e.preventDefault();
    }

    // Block Ctrl+U (View Source)
    if (e.ctrlKey && e.key.toUpperCase() === 'U') {
        e.preventDefault();
    }

    // Block Shift+F10 (context menu keyboard)
    if (e.shiftKey && e.key === 'F10') {
        e.preventDefault();
    }

    // Block Context Menu key
    if (e.key === 'ContextMenu') {
        e.preventDefault();
    }
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
