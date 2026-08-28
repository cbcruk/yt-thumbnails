import { spawn } from 'child_process'
import type { RunOptions } from './types'

/**
 * Runs a command to completion without blocking the event loop
 * @param command - Executable name
 * @param args - Arguments, passed without shell interpretation
 * @param options - Output handling
 * @returns Collected stdout when capturing, otherwise an empty string
 */
export function run(
  command: string,
  args: string[],
  options: RunOptions = {}
): Promise<string> {
  const { capture = false, onOutput, silent = false } = options
  const forward = !capture && !onOutput && !silent
  const stream = silent ? 'ignore' : forward ? 'inherit' : 'pipe'

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', stream, stream] })

    let output = ''
    let errorOutput = ''

    child.stdout?.setEncoding('utf-8')
    child.stdout?.on('data', (chunk: string) => {
      if (capture) {
        output += chunk
      }

      onOutput?.(chunk)
    })

    child.stderr?.setEncoding('utf-8')
    child.stderr?.on('data', (chunk: string) => {
      errorOutput += chunk
      onOutput?.(chunk)
    })

    child.on('error', reject)

    child.on('close', (code) => {
      if (code === 0) {
        resolve(output.trim())
        return
      }

      const detail = errorOutput.trim()

      reject(
        new Error(
          `${command} 실패 (exit ${code})${detail ? `\n${detail}` : ''}`
        )
      )
    })
  })
}
