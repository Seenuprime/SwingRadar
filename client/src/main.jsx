import './index.css'
import App from './App.jsx'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from './context/AuthContext.jsx'

createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <App />
  </AuthProvider>
)
