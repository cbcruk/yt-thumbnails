import { isCancelled } from '../errors'
import { generate, readMetadata } from '../pipeline'
import type { GenerateOptions } from '../types'
import type { JobView } from './gui.types'
import { outputDir, reservePath, toFileStem } from './gui.utils'

/** How many jobs may download and render at the same time */
const CONCURRENCY = 2

/** What the page sends to enqueue work */
export type JobRequest = Omit<GenerateOptions, 'output' | 'duration'>

interface Job extends JobView {
  controller: AbortController
}

/**
 * Runs generation jobs a few at a time and reports their state
 */
export class JobQueue {
  #jobs: Job[] = []
  #reserved = new Set<string>()
  #running = 0
  #nextId = 1
  #onChange: () => void

  /**
   * @param onChange - Called whenever any job's state changes
   */
  constructor(onChange: () => void) {
    this.#onChange = onChange
  }

  /**
   * Adds a job and starts it as soon as a slot frees up
   * @param request - Video URL and grid settings
   * @returns The new job's identifier
   */
  add(request: JobRequest): string {
    const id = String(this.#nextId++)

    this.#jobs.push({
      id,
      url: request.url,
      title: '',
      grid: request.grid,
      mode: request.mode,
      threshold: request.threshold,
      status: 'queued',
      message: '대기 중',
      detail: '',
      output: null,
      error: null,
      controller: new AbortController(),
    })

    this.#onChange()
    this.#pump()

    return id
  }

  /**
   * Stops a job, whether it is running or still waiting
   * @param id - Job identifier
   */
  cancel(id: string): void {
    const job = this.#jobs.find((candidate) => candidate.id === id)

    if (!job || job.status === 'done' || job.status === 'failed') {
      return
    }

    job.controller.abort()

    if (job.status === 'queued') {
      job.status = 'cancelled'
      job.message = '취소됨'
      this.#onChange()
      this.#pump()
    }
  }

  /** Drops every job that is no longer active */
  clearFinished(): void {
    this.#jobs = this.#jobs.filter(
      (job) => job.status === 'queued' || job.status === 'running'
    )

    this.#onChange()
  }

  /**
   * The current job list, without the internals the page cannot use
   * @returns One entry per job, oldest first
   */
  view(): JobView[] {
    return this.#jobs.map(({ controller: _controller, ...job }) => job)
  }

  /**
   * Looks up a finished job's output path
   * @param id - Job identifier
   * @returns The path, or null when the job has not produced one
   */
  outputOf(id: string): string | null {
    return this.#jobs.find((job) => job.id === id)?.output ?? null
  }

  #pump(): void {
    while (this.#running < CONCURRENCY) {
      const next = this.#jobs.find((job) => job.status === 'queued')

      if (!next) {
        return
      }

      this.#running++
      void this.#execute(next).finally(() => {
        this.#running--
        this.#pump()
      })
    }
  }

  async #execute(job: Job): Promise<void> {
    const { signal } = job.controller

    let reserved: string | null = null

    job.status = 'running'
    job.message = '영상 정보 가져오는 중'
    this.#onChange()

    try {
      const meta = await readMetadata(job.url, signal)

      job.title = meta.title
      this.#onChange()

      const stem = `${toFileStem(meta.title)}_${job.grid}x${job.grid}_${job.mode}`

      reserved = reservePath(outputDir(), stem, this.#reserved)

      job.output = await generate(
        {
          url: job.url,
          grid: job.grid,
          mode: job.mode,
          threshold: job.threshold,
          output: reserved,
          duration: meta.duration,
        },
        (message) => {
          job.message = message.trim()
          this.#onChange()
        },
        (chunk) => {
          const line = chunk.split(/[\r\n]/).filter(Boolean).pop()

          if (line) {
            job.detail = line
            this.#onChange()
          }
        },
        signal
      )

      job.status = 'done'
      job.message = '완료'
      job.detail = ''
    } catch (error) {
      if (isCancelled(error) || signal.aborted) {
        job.status = 'cancelled'
        job.message = '취소됨'
      } else {
        job.status = 'failed'
        job.message = '실패'
        job.error = (error as Error).message
      }

      job.detail = ''

      if (reserved) {
        this.#reserved.delete(reserved)
      }
    } finally {
      this.#onChange()
    }
  }
}
