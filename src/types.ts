/** CLI options for thumbnail generation */
export interface Options {
  /** YouTube video URL */
  url: string | null
  /** Grid size (e.g., 4 for 4x4) */
  grid: number
  /** Frame extraction mode */
  mode: 'uniform' | 'scene'
  /** Scene detection threshold (0-1) */
  threshold: number
  /** Output file path */
  output: string | null
}

/** Detected scene frame data */
export interface SceneFrame {
  /** Timestamp in seconds */
  time: number
  /** Scene change score (0-1) */
  score: number
}

/** Receives human-readable progress messages */
export type Reporter = (message: string) => void

/** Output handling for a spawned command */
export interface RunOptions {
  /** Collect stdout and return it instead of forwarding to the parent */
  capture?: boolean
  /** Receive stdout and stderr chunks as they arrive */
  onOutput?: (chunk: string) => void
  /** Discard all output */
  silent?: boolean
}
