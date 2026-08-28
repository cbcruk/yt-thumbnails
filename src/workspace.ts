import { mkdtempSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

/**
 * Creates an empty directory for one run's intermediate files
 * @returns Absolute path to the new directory
 */
export function createWorkspace(): string {
  return mkdtempSync(join(tmpdir(), 'yt-thumbnails-'))
}

/**
 * Removes a workspace and everything inside it
 * @param workspace - Path returned by createWorkspace
 */
export function removeWorkspace(workspace: string): void {
  rmSync(workspace, { recursive: true, force: true })
}
