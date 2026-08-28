import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { launch, type App } from 'barlo'
import { generate } from '../pipeline'
import type { GenerateOptions } from '../types'
import type { AppWindow } from './gui.types'
import { outputDir, reveal } from './gui.utils'
import indexHtmlBundle from './www/index.html' with { type: 'text' }

const indexHtml = indexHtmlBundle as unknown as string
const FLUSH_INTERVAL = 100

/**
 * Opens the application window and wires the page to the pipeline
 * @returns The running application
 */
export async function startGui(): Promise<App> {
  const launched = await launch({
    title: 'yt-thumbnails',
    width: 720,
    height: 900,
  })

  if (launched.isErr()) {
    throw new Error(launched.error.message)
  }

  const app = launched.unwrap()

  let resultPath: string | null = null
  let running = false

  app.serveEmbedded({ 'index.html': indexHtml })

  app.serveHandler((request) => {
    const { pathname } = new URL(request.url)

    if (pathname !== '/result.jpg' || !resultPath || !existsSync(resultPath)) {
      return undefined
    }

    return new Response(readFileSync(resultPath), {
      headers: {
        'content-type': 'image/jpeg',
        'cache-control': 'no-store',
      },
    })
  })

  await app.exposeFunction(
    '__generate',
    async (request: Omit<GenerateOptions, 'output'>): Promise<string> => {
      if (running) {
        throw new Error('이미 생성 중입니다')
      }

      running = true

      let pending: string[] = []
      let scheduled: ReturnType<typeof setTimeout> | null = null

      const flush = (): void => {
        scheduled = null

        if (pending.length === 0) {
          return
        }

        const chunk = pending.join('')

        pending = []

        app.evaluate(
          (text: string) => (window as never as AppWindow).__onProgress(text),
          chunk
        )
      }

      const push = (chunk: string): void => {
        pending.push(chunk)

        if (!scheduled) {
          scheduled = setTimeout(flush, FLUSH_INTERVAL)
        }
      }

      try {
        const modeLabel = request.mode === 'scene' ? 'scene' : 'uniform'
        const name = `grid_${request.grid}x${request.grid}_${modeLabel}.jpg`

        resultPath = await generate(
          { ...request, output: join(outputDir(), name) },
          (message) => push(`${message}\n`),
          push
        )

        return resultPath
      } finally {
        running = false

        if (scheduled) {
          clearTimeout(scheduled)
        }

        flush()
      }
    }
  )

  await app.exposeFunction('__reveal', (): void => {
    if (resultPath) {
      reveal(resultPath)
    }
  })

  app.onExit(() => process.exit(0))

  await app.load('index.html')

  return app
}
