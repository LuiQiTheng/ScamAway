import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './member2.css'
import './calm-ui.css'
import App from './App.jsx'
import { AppProvider } from './context/AppContext.jsx'
import { LanguageProvider } from './context/LanguageContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppProvider>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </AppProvider>
  </StrictMode>,
)
