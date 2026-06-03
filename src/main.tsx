import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, HashRouter } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { ToastProvider } from './components/Toast'
import { ErrorBoundary } from './components/ErrorBoundary'
import App from './App'
import './index.css'

const isNative = Capacitor.isNativePlatform()
const Router = isNative ? HashRouter : BrowserRouter

const root = document.getElementById('root')
if (!root) {
  console.error('#root element not found')
} else {
  createRoot(root).render(
    <StrictMode>
      <Router>
        <ToastProvider>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </ToastProvider>
      </Router>
    </StrictMode>,
  )
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch(() => {})
  })
}
