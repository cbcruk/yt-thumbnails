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
