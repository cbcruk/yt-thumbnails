import { spawn } from 'child_process'
import { existsSync } from 'fs'
import { homedir } from 'os'
import { dirname, join } from 'path'

/**
 * Picks the directory generated grids are written to
 * @returns The user's Downloads folder, or their home directory
 */
export function outputDir(): string {
  const downloads = join(homedir(), 'Downloads')

  return existsSync(downloads) ? downloads : homedir()
}

/**
 * Opens the platform file manager with the given file selected
 * @param target - Path to reveal
 */
export function reveal(target: string): void {
  const [command, args]: [string, string[]] =
    process.platform === 'darwin'
      ? ['open', ['-R', target]]
      : process.platform === 'win32'
        ? ['explorer', [`/select,${target}`]]
        : ['xdg-open', [dirname(target)]]

  spawn(command, args, { stdio: 'ignore', detached: true }).unref()
}
