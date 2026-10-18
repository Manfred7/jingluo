import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Пока только локально: dev-сервер на компьютере, с телефона — `npm run dev:lan` по Wi-Fi.
// PWA и base для публикации подключим, когда (если) решим выкладывать — конфиг есть в bazi-trainer.
export default defineConfig({
  plugins: [react()],
})
