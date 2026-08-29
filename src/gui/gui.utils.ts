import { spawn } from 'child_process'
import { existsSync } from 'fs'
import { homedir } from 'os'
import { dirname, join } from 'path'

const MAX_NAME = 80
const RESERVED = /[<>:"/\\|?*]/g
const LAST_PRINTABLE_CONTROL = 31

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

/**
 * Turns a video title into a file name stem that is safe on disk
 * @param title - Title as reported by yt-dlp
 * @returns A non-empty stem
 */
export function toFileStem(title: string): string {
  const printable = Array.from(title)
    .filter((char) => (char.codePointAt(0) ?? 0) > LAST_PRINTABLE_CONTROL)
    .join('')

  const cleaned = printable
    .replace(RESERVED, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_NAME)
    .replace(/[. ]+$/, '')

  return cleaned || 'grid'
}

/**
 * Builds an output path that collides with neither an existing file nor a
 * path already handed out
 *
 * Concurrent jobs would otherwise all pass the same existsSync check before any
 * of them has written anything, and the last one to finish would win.
 *
 * @param dir - Directory to write into
 * @param stem - File name without extension
 * @param taken - Paths already claimed by jobs still in flight
 * @returns A free path, added to `taken`
 */
export function reservePath(
  dir: string,
  stem: string,
  taken: Set<string>
): string {
  let candidate = join(dir, `${stem}.jpg`)

  for (let n = 2; existsSync(candidate) || taken.has(candidate); n++) {
    candidate = join(dir, `${stem} (${n}).jpg`)
  }

  taken.add(candidate)

  return candidate
}
