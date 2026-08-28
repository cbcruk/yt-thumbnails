import { existsSync } from 'fs'
import { join } from 'path'
import { extractUniform, extractScenes } from './extract'
import { createGrid } from './grid'
import { run } from './run'
import { createWorkspace, removeWorkspace } from './workspace'
import type { GenerateOptions, Reporter } from './types'

const FORMAT = 'bv*[height<=720]+ba/b[height<=720]/b'

/**
 * Downloads a video and renders a thumbnail grid from it
 * @param options - Resolved generation settings
 * @param report - Receives progress messages
 * @param onOutput - Receives raw yt-dlp output; when omitted it goes to the terminal
 * @returns Output file path
 */
export async function generate(
  options: GenerateOptions,
  report: Reporter,
  onOutput?: (chunk: string) => void
): Promise<string> {
  const { url, grid, mode, threshold, output } = options
  const totalFrames = grid * grid
  const workspace = createWorkspace()

  try {
    report('📹 영상 정보 가져오는 중...')

    const duration = parseFloat(
      await run('yt-dlp', ['--print', 'duration', url], { capture: true })
    )

    report(
      `   길이: ${Math.floor(duration / 60)}분 ${Math.floor(duration % 60)}초`
    )

    report('⬇️  영상 다운로드 중...')

    const videoPath = join(workspace, 'video.mp4')

    await run(
      'yt-dlp',
      ['-f', FORMAT, '--merge-output-format', 'mp4', '-o', videoPath, url],
      onOutput ? { onOutput } : {}
    )

    if (!existsSync(videoPath)) {
      throw new Error(`영상 다운로드 실패: ${videoPath}`)
    }

    report(`🎞️  프레임 추출 중 (${mode} 모드)...`)

    if (mode === 'scene') {
      const success = await extractScenes(
        workspace,
        videoPath,
        totalFrames,
        threshold,
        report
      )

      if (!success) {
        await extractUniform(
          workspace,
          videoPath,
          totalFrames,
          duration,
          report
        )
      }
    } else {
      await extractUniform(workspace, videoPath, totalFrames, duration, report)
    }

    report('🔲 그리드 생성 중...')

    await createGrid(workspace, grid, output, report)

    report(`✅ 완료: ${output}`)

    return output
  } finally {
    removeWorkspace(workspace)
  }
}
