
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Create a proper root with React as the top-level import
createRoot(document.getElementById("root")!).render(
  // Not using StrictMode here as it can cause intentional double-rendering
  // which might exacerbate any existing rendering issues
  <App />
);
