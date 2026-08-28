import { execSync } from 'child_process'
import { readdirSync } from 'fs'
import { join } from 'path'
import { TEMP_DIR, THUMB_SIZE } from './constants'

/**
 * Creates a thumbnail grid from extracted frames
 * @param grid - Grid size (e.g., 4 for 4x4)
 * @param outputName - Output file path
 * @returns Output file path
 */
export function createGrid(grid: number, outputName: string): string {
  const frames = readdirSync(TEMP_DIR).filter(
    (f) => f.startsWith('frame_') && f.endsWith('.jpg')
  )

  console.log(
    `📷 ${Math.min(frames.length, grid * grid)}개 프레임으로 그리드 생성`
  )

  if (frames.length === 0) {
    throw new Error('프레임 추출 실패')
  }

  const scale = `scale=${THUMB_SIZE}:${THUMB_SIZE}:force_original_aspect_ratio=increase`
  const crop = `crop=${THUMB_SIZE}:${THUMB_SIZE}`
  const tile = `tile=${grid}x${grid}:color=black`

  execSync(
    `ffmpeg -i "${join(TEMP_DIR, 'frame_%03d.jpg')}" -vf "${scale},${crop},${tile}" -frames:v 1 -update 1 -q:v 2 "${outputName}" -y -loglevel warning`,
    { stdio: 'inherit' }
  )

  return outputName
}
