import { readdirSync } from 'fs'
import { join } from 'path'
import type { Reporter } from './types'
import { run } from './run'
import { THUMB_SIZE } from './constants'

/**
 * Creates a thumbnail grid from extracted frames
 * @param workspace - Directory holding the extracted frames
 * @param grid - Grid size (e.g., 4 for 4x4)
 * @param outputName - Output file path
 * @param report - Receives progress messages
 * @param signal - Stops rendering when aborted
 * @returns Output file path
 */
export async function createGrid(
  workspace: string,
  grid: number,
  outputName: string,
  report: Reporter,
  signal?: AbortSignal
): Promise<string> {
  const frames = readdirSync(workspace).filter(
    (f) => f.startsWith('frame_') && f.endsWith('.jpg')
  )

  report(`📷 ${Math.min(frames.length, grid * grid)}개 프레임으로 그리드 생성`)

  if (frames.length === 0) {
    throw new Error('프레임 추출 실패')
  }

  const scale = `scale=${THUMB_SIZE}:${THUMB_SIZE}:force_original_aspect_ratio=increase`
  const crop = `crop=${THUMB_SIZE}:${THUMB_SIZE}`
  const tile = `tile=${grid}x${grid}:color=black`

  await run('ffmpeg', [
    '-i',
    join(workspace, 'frame_%03d.jpg'),
    '-vf',
    `${scale},${crop},${tile}`,
    '-frames:v',
    '1',
    '-update',
    '1',
    '-q:v',
    '2',
    outputName,
    '-y',
    '-loglevel',
    'warning',
  ], { signal })

  return outputName
}
