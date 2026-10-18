import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { checkData } from './data/check.ts'

if (import.meta.env.DEV) {
  const { errors, warnings } = checkData()
  errors.forEach((e) => console.error('[данные]', e))
  warnings.forEach((w) => console.warn('[данные]', w))
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
