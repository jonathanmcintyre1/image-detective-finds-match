
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Create root without strict mode to prevent double renders
createRoot(document.getElementById("root")!).render(<App />);
