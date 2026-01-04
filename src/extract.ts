import { exec, execSync } from 'child_process'
import { promisify } from 'util'
import { readFileSync } from 'fs'
import { join } from 'path'
import type { SceneFrame } from './types'
import { TEMP_DIR } from './constants'

const execAsync = promisify(exec)

/**
 * Extracts frames from video at uniform intervals
 * @param videoPath - Path to the video file
 * @param totalFrames - Number of frames to extract
 * @param duration - Video duration in seconds
 */
export function extractUniform(
  videoPath: string,
  totalFrames: number,
  duration: number
): void {
  const interval = Math.max(1, Math.floor(duration / totalFrames))

  console.log(`   프레임 간격: ${interval}초`)

  execSync(
    `ffmpeg -i "${videoPath}" -vf "fps=1/${interval}" -frames:v ${totalFrames} "${TEMP_DIR}/frame_%03d.jpg" -y -loglevel warning`,
    { stdio: 'inherit' }
  )
}

/**
 * Extracts frames from video based on scene detection
 * @param videoPath - Path to the video file
 * @param totalFrames - Number of frames to extract
 * @param threshold - Scene detection threshold (0-1)
 * @returns Whether scene detection was successful
 */
export async function extractScenes(
  videoPath: string,
  totalFrames: number,
  threshold: number
): Promise<boolean> {
  console.log(`   장면 감지 중 (threshold: ${threshold})...`)

  const sceneFile = join(TEMP_DIR, 'scenes.txt')

  execSync(
    `ffmpeg -i "${videoPath}" -vf "select='gte(scene,0)',metadata=print:file=${sceneFile}" -vsync vfr -f null - 2>/dev/null`,
    { encoding: 'utf-8' }
  )

  const sceneData = readFileSync(sceneFile, 'utf-8')
  const scenes: SceneFrame[] = []

  let currentFrame: Partial<SceneFrame> = {}

  for (const line of sceneData.split('\n')) {
    if (line.startsWith('frame:')) {
      const pts = line.match(/pts_time:([\d.]+)/)

      if (pts) {
        currentFrame.time = parseFloat(pts[1])
      }
    } else if (line.includes('scene_score=')) {
      const score = line.match(/scene_score=([\d.]+)/)

      if (score) {
        currentFrame.score = parseFloat(score[1])

        if (
          currentFrame.score >= threshold &&
          currentFrame.time !== undefined
        ) {
          scenes.push(currentFrame as SceneFrame)
        }

        currentFrame = {}
      }
    }
  }

  console.log(`   ${scenes.length}개 장면 전환 감지됨`)

  if (scenes.length === 0) {
    console.log('   ⚠️  장면 전환 없음, threshold 낮춰보세요')
    console.log('   → 균등 간격으로 대체합니다')
    return false
  }

  const selectedTimes: number[] = []

  if (scenes.length <= totalFrames) {
    selectedTimes.push(...scenes.map((s) => s.time))
  } else {
    const step = scenes.length / totalFrames

    for (let i = 0; i < totalFrames; i++) {
      const idx = Math.floor(i * step)

      selectedTimes.push(scenes[idx].time)
    }
  }

  console.log(`   ${selectedTimes.length}개 프레임 병렬 추출 중...`)

  await Promise.all(
    selectedTimes.map((time, i) => {
      const outFile = join(
        TEMP_DIR,
        `frame_${String(i + 1).padStart(3, '0')}.jpg`
      )

      return execAsync(
        `ffmpeg -ss ${time} -i "${videoPath}" -frames:v 1 "${outFile}" -y -loglevel warning`
      )
    })
  )

  return true
}
