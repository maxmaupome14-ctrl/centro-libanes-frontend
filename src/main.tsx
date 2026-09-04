import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'

// Tras cada publicación cambian los nombres de los chunks; si un usuario tenía la app abierta,
// la siguiente pantalla (import dinámico) falla. Recargamos una sola vez para tomar la versión nueva.
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault()
  const key = 'cl-reloaded-for-update'
  if (sessionStorage.getItem(key) !== '1') {
    sessionStorage.setItem(key, '1')
    window.location.reload()
  }
})
window.addEventListener('load', () => { setTimeout(() => sessionStorage.removeItem('cl-reloaded-for-update'), 15000) })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
