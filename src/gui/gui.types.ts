/** Globals the page exposes back to the application */
export interface AppWindow {
  /** Appends a chunk of pipeline output to the page log */
  __onProgress(chunk: string): void
}
