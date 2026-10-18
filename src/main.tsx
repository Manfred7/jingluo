import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { checkData } from './data/check.ts'

const Editor = import.meta.env.DEV ? lazy(() => import('./editor/Editor.tsx')) : undefined
const showEditor = import.meta.env.DEV && new URLSearchParams(window.location.search).has('edit')

if (import.meta.env.DEV) {
  const { errors, warnings } = checkData()
  errors.forEach((e) => console.error('[данные]', e))
  warnings.forEach((w) => console.warn('[данные]', w))
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {showEditor && Editor ? (
      <Suspense fallback={null}>
        <Editor />
      </Suspense>
    ) : (
      <App />
    )}
  </StrictMode>,
)
