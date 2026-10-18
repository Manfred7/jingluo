import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

type Overrides = Record<string, Record<string, [number, number]>>

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)

function normalizeOverrides(value: unknown): Overrides {
  if (!isObject(value)) throw new Error('Правки должны быть объектом')
  const normalized: Overrides = {}
  for (const viewId of Object.keys(value).sort()) {
    const points = value[viewId]
    if (!isObject(points)) throw new Error(`Точки вида «${viewId}» должны быть объектом`)
    const normalizedPoints: Record<string, [number, number]> = {}
    for (const pointId of Object.keys(points).sort()) {
      const position = points[pointId]
      if (!Array.isArray(position) || position.length !== 2) {
        throw new Error(`Координаты ${viewId}/${pointId} должны быть массивом из двух чисел`)
      }
      const x: unknown = position[0]
      const y: unknown = position[1]
      if (!isFiniteNumber(x) || !isFiniteNumber(y)) {
        throw new Error(`Координаты ${viewId}/${pointId} должны быть конечными числами`)
      }
      normalizedPoints[pointId] = [Math.round(x * 10) / 10, Math.round(y * 10) / 10]
    }
    normalized[viewId] = normalizedPoints
  }
  return normalized
}

const placementsPlugin: Plugin = {
  name: 'jingluo-placements',
  apply: 'serve',
  configureServer(server) {
    server.middlewares.use('/__jingluo/placements', (req, res, next) => {
      if (req.method !== 'POST') {
        next()
        return
      }
      let body = ''
      req.setEncoding('utf8')
      req.on('data', (chunk: string) => {
        body += chunk
      })
      req.on('end', () => {
        try {
          const overrides = normalizeOverrides(JSON.parse(body) as unknown)
          const file = resolve('src', 'data', 'placements.json')
          writeFileSync(file, `${JSON.stringify(overrides, null, 2)}\n`, 'utf8')
          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({ ok: true }))
        } catch (error) {
          res.statusCode = 400
          res.setHeader('Content-Type', 'text/plain; charset=utf-8')
          res.end(error instanceof Error ? error.message : 'Не удалось сохранить правки')
        }
      })
    })
  },
}

// Пока только локально: dev-сервер на компьютере, с телефона — `npm run dev:lan` по Wi-Fi.
// PWA и base для публикации подключим, когда (если) решим выкладывать — конфиг есть в bazi-trainer.
export default defineConfig({
  plugins: [react(), placementsPlugin],
})
