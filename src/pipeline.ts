import { existsSync } from 'fs'
import { join } from 'path'
import { CancelledError } from './errors'
import { extractUniform, extractScenes } from './extract'
import { createGrid } from './grid'
import { run } from './run'
import { createWorkspace, removeWorkspace } from './workspace'
import type { GenerateOptions, Reporter, VideoMetadata } from './types'

const FORMAT = 'bv*[height<=720]+ba/b[height<=720]/b'

/**
 * Reads a video's title and duration without downloading it
 * @param url - Video URL
 * @param signal - Stops the lookup when aborted
 * @returns The reported metadata
 */
export async function readMetadata(
  url: string,
  signal?: AbortSignal
): Promise<VideoMetadata> {
  const output = await run(
    'yt-dlp',
    ['--print', 'title', '--print', 'duration', url],
    { capture: true, signal }
  )

  const [title = '', duration = ''] = output.split('\n')

  return {
    title: title.trim(),
    duration: parseFloat(duration),
  }
}

/**
 * Downloads a video and renders a thumbnail grid from it
 * @param options - Resolved generation settings
 * @param report - Receives progress messages
 * @param onOutput - Receives raw yt-dlp output; when omitted it goes to the terminal
 * @param signal - Stops the run when aborted
 * @returns Output file path
 */
export async function generate(
  options: GenerateOptions,
  report: Reporter,
  onOutput?: (chunk: string) => void,
  signal?: AbortSignal
): Promise<string> {
  const { url, grid, mode, threshold, output } = options
  const totalFrames = grid * grid
  const workspace = createWorkspace()

  const ensureLive = (): void => {
    if (signal?.aborted) {
      throw new CancelledError()
    }
  }

  try {
    let duration = options.duration

    if (duration === undefined) {
      report('📹 영상 정보 가져오는 중...')
      duration = (await readMetadata(url, signal)).duration
    }

    report(
      `   길이: ${Math.floor(duration / 60)}분 ${Math.floor(duration % 60)}초`
    )

    ensureLive()
    report('⬇️  영상 다운로드 중...')

    const videoPath = join(workspace, 'video.mp4')

    await run(
      'yt-dlp',
      ['-f', FORMAT, '--merge-output-format', 'mp4', '-o', videoPath, url],
      { signal, ...(onOutput ? { onOutput } : {}) }
    )

    if (!existsSync(videoPath)) {
      throw new Error(`영상 다운로드 실패: ${videoPath}`)
    }

    ensureLive()
    report(`🎞️  프레임 추출 중 (${mode} 모드)...`)

    if (mode === 'scene') {
      const success = await extractScenes(
        workspace,
        videoPath,
        totalFrames,
        threshold,
        report,
        signal
      )

      if (!success) {
        await extractUniform(
          workspace,
          videoPath,
          totalFrames,
          duration,
          report,
          signal
        )
      }
    } else {
      await extractUniform(
        workspace,
        videoPath,
        totalFrames,
        duration,
        report,
        signal
      )
    }

    ensureLive()
    report('🔲 그리드 생성 중...')

    await createGrid(workspace, grid, output, report, signal)

    report(`✅ 완료: ${output}`)

    return output
  } finally {
    removeWorkspace(workspace)
  }
}
