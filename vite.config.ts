import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

type Overrides = Record<string, Record<string, [number, number]>>

const LOCAL_ADDRESSES = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1'])

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)

const versionOf = (content: string) => createHash('sha1').update(content).digest('hex')

function normalizeOverrides(value: unknown): Overrides {
  if (!isObject(value)) throw new Error('Правки должны быть объектом')
  const normalized: Overrides = {}
  for (const viewId of Object.keys(value).sort()) {
    if (!/^[a-z]+(-[a-z]+)*$/.test(viewId)) throw new Error(`Некорректный идентификатор вида «${viewId}»`)
    const points = value[viewId]
    if (!isObject(points)) throw new Error(`Точки вида «${viewId}» должны быть объектом`)
    const normalizedPoints: Record<string, [number, number]> = {}
    for (const pointId of Object.keys(points).sort()) {
      if (!/^[A-Z]+-\d+$/.test(pointId)) throw new Error(`Некорректный идентификатор точки «${pointId}»`)
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

function readPlacements(file: string) {
  const content = readFileSync(file, 'utf8')
  return {
    version: versionOf(content),
    overrides: JSON.parse(content) as Overrides,
  }
}

const placementsPlugin: Plugin = {
  name: 'jingluo-placements',
  apply: 'serve',
  configureServer(server) {
    const file = resolve(server.config.root, 'src', 'data', 'placements.json')
    server.middlewares.use('/__jingluo/placements', (req, res, next) => {
      if (req.method === 'GET') {
        try {
          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify(readPlacements(file)))
        } catch (error) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'text/plain; charset=utf-8')
          res.end(error instanceof Error ? error.message : 'Не удалось загрузить правки')
        }
        return
      }
      if (req.method !== 'POST') {
        next()
        return
      }
      if (!LOCAL_ADDRESSES.has(req.socket.remoteAddress ?? '')) {
        res.statusCode = 403
        res.setHeader('Content-Type', 'text/plain; charset=utf-8')
        res.end('Сохранение доступно только с локальной машины')
        return
      }
      let body = ''
      req.setEncoding('utf8')
      req.on('data', (chunk: string) => {
        body += chunk
      })
      req.on('end', () => {
        try {
          const payload: unknown = JSON.parse(body)
          if (!isObject(payload) || typeof payload.baseVersion !== 'string') {
            throw new Error('Ожидаются baseVersion и overrides')
          }
          const overrides = normalizeOverrides(payload.overrides)
          if (readPlacements(file).version !== payload.baseVersion) {
            res.statusCode = 409
            res.setHeader('Content-Type', 'text/plain; charset=utf-8')
            res.end('Файл правок изменился в другой вкладке — перезагрузите редактор')
            return
          }
          const content = `${JSON.stringify(overrides, null, 2)}\n`
          writeFileSync(file, content, 'utf8')
          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({ ok: true, version: versionOf(content) }))
        } catch (error) {
          res.statusCode = 400
          res.setHeader('Content-Type', 'text/plain; charset=utf-8')
          res.end(error instanceof Error ? error.message : 'Не удалось сохранить правки')
        }
      })
    })
  },
}

const YEAR = 60 * 60 * 24 * 365

// Публикация — GitHub Pages из подпапки /jingluo/ (и vite preview тоже); dev-сервер остаётся в корне.
// Редактор ?edit и плагин записи — только в dev-сервере, в сборку не попадают.
export default defineConfig(({ command, isPreview }) => ({
  plugins: [
    react(),
    placementsPlugin,
    VitePWA({
      // Новая версия ставится сама при следующем открытии
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon.ico', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Каналы — тренажёр точек акупунктуры',
        short_name: 'Каналы',
        description: 'Тренажёр каналов и точек акупунктуры: найти точку на фигуре, узнать канал и название',
        lang: 'ru',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#F5F0E6',
        theme_color: '#F5F0E6',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Всё приложение кладётся в кэш при установке — дальше работает без сети
        globPatterns: ['**/*.{js,css,html,svg,png,ico,json}'],
        runtimeCaching: [
          {
            // Шрифты Google: стили и файлы кэшируются при первом показе
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-css' },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-files',
              expiration: { maxEntries: 200, maxAgeSeconds: YEAR },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  base: command === 'build' || isPreview ? '/jingluo/' : '/',
}))
