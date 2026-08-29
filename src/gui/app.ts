import { existsSync, readFileSync } from 'fs'
import { launch, type App } from 'barlo'
import type { AppWindow } from './gui.types'
import { reveal } from './gui.utils'
import { JobQueue, type JobRequest } from './queue'
import indexHtmlBundle from './www/index.html' with { type: 'text' }

const indexHtml = indexHtmlBundle as unknown as string
const PUSH_INTERVAL = 150

/**
 * Opens the application window and wires the page to the job queue
 * @returns The running application
 */
export async function startGui(): Promise<App> {
  const launched = await launch({
    title: 'yt-thumbnails',
    width: 780,
    height: 900,
  })

  if (launched.isErr()) {
    throw new Error(launched.error.message)
  }

  const app = launched.unwrap()

  let scheduled: ReturnType<typeof setTimeout> | null = null

  const push = (): void => {
    scheduled = null

    app.evaluate(
      (jobs: string) =>
        (window as never as AppWindow).__onJobs(JSON.parse(jobs)),
      JSON.stringify(queue.view())
    )
  }

  const schedulePush = (): void => {
    if (!scheduled) {
      scheduled = setTimeout(push, PUSH_INTERVAL)
    }
  }

  const queue = new JobQueue(schedulePush)

  app.serveEmbedded({ 'index.html': indexHtml })

  app.serveHandler((request) => {
    const { pathname, searchParams } = new URL(request.url)

    if (pathname !== '/result.jpg') {
      return undefined
    }

    const output = queue.outputOf(searchParams.get('id') ?? '')

    if (!output || !existsSync(output)) {
      return undefined
    }

    return new Response(readFileSync(output), {
      headers: {
        'content-type': 'image/jpeg',
        'cache-control': 'no-store',
      },
    })
  })

  await app.exposeFunction('__enqueue', (request: JobRequest): string =>
    queue.add(request)
  )

  await app.exposeFunction('__cancel', (id: string): void => queue.cancel(id))

  await app.exposeFunction('__clearFinished', (): void =>
    queue.clearFinished()
  )

  await app.exposeFunction('__reveal', (id: string): void => {
    const output = queue.outputOf(id)

    if (output) {
      reveal(output)
    }
  })

  app.onExit(() => process.exit(0))

  await app.load('index.html')

  return app
}
