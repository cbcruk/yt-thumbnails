/** Where a job is in its lifecycle */
export type JobStatus = 'queued' | 'running' | 'done' | 'failed' | 'cancelled'

/** A queued generation request, as the page sees it */
export interface JobView {
  /** Identifier used to cancel the job and fetch its result */
  id: string
  /** Requested video URL */
  url: string
  /** Video title once known, otherwise an empty string */
  title: string
  /** Grid size */
  grid: number
  /** Frame extraction mode */
  mode: 'uniform' | 'scene'
  /** Scene detection threshold (0-1) */
  threshold: number
  /** Lifecycle state */
  status: JobStatus
  /** Latest progress message */
  message: string
  /** Latest line of raw yt-dlp or ffmpeg output */
  detail: string
  /** Output file path once finished */
  output: string | null
  /** Failure message when the job failed */
  error: string | null
}

/** Globals the page exposes back to the application */
export interface AppWindow {
  /** Receives the full job list whenever it changes */
  __onJobs(jobs: JobView[]): void
}
