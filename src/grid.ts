import sharp from 'sharp'
import { readdirSync } from 'fs'
import { join } from 'path'
import { TEMP_DIR, THUMB_SIZE } from './constants'

/**
 * Creates a thumbnail grid from extracted frames
 * @param grid - Grid size (e.g., 4 for 4x4)
 * @param outputName - Output file path
 * @returns Output file path
 */
export async function createGrid(
  grid: number,
  outputName: string
): Promise<string> {
  const frames = readdirSync(TEMP_DIR)
    .filter((f) => f.startsWith('frame_') && f.endsWith('.jpg'))
    .sort()
    .slice(0, grid * grid)

  console.log(`📷 ${frames.length}개 프레임으로 그리드 생성`)

  if (frames.length === 0) {
    throw new Error('프레임 추출 실패')
  }

  const composites = await Promise.all(
    frames.map(async (f, i) => ({
      input: await sharp(join(TEMP_DIR, f))
        .resize(THUMB_SIZE, THUMB_SIZE, { fit: 'cover' })
        .toBuffer(),
      left: (i % grid) * THUMB_SIZE,
      top: Math.floor(i / grid) * THUMB_SIZE,
    }))
  )

  await sharp({
    create: {
      width: THUMB_SIZE * grid,
      height: THUMB_SIZE * grid,
      channels: 3,
      background: { r: 0, g: 0, b: 0 },
    },
  })
    .composite(composites)
    .jpeg({ quality: 90 })
    .toFile(outputName)

  return outputName
}
