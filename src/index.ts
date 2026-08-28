#!/usr/bin/env node
import { existsSync, mkdirSync, rmSync } from 'fs'
import { join } from 'path'
import { parseArgs, printUsage } from './args'
import { TEMP_DIR } from './constants'
import { extractUniform, extractScenes } from './extract'
import { createGrid } from './grid'
import { run } from './run'
import type { Reporter } from './types'

async function main(): Promise<void> {
  const opts = parseArgs()

  if (!opts.url) {
    printUsage()
    process.exit(1)
  }

  const report: Reporter = (message) => console.log(message)
  const totalFrames = opts.grid * opts.grid
  const modeLabel = opts.mode === 'scene' ? 'scene' : 'uniform'
  const defaultName = `grid_${opts.grid}x${opts.grid}_${modeLabel}.jpg`
  const outputName = opts.output ?? defaultName

  if (existsSync(TEMP_DIR)) {
    rmSync(TEMP_DIR, {
      recursive: true,
    })
  }

  mkdirSync(TEMP_DIR)

  try {
    report('📹 영상 정보 가져오는 중...')

    const duration = parseFloat(
      await run('yt-dlp', ['--print', 'duration', opts.url], { capture: true })
    )

    report(
      `   길이: ${Math.floor(duration / 60)}분 ${Math.floor(duration % 60)}초`
    )

    report('⬇️  영상 다운로드 중...')

    const videoPath = join(TEMP_DIR, 'video.mp4')

    await run('yt-dlp', [
      '-f',
      'best[height<=720]',
      '-o',
      videoPath,
      opts.url,
    ])

    report(`🎞️  프레임 추출 중 (${opts.mode} 모드)...`)

    if (opts.mode === 'scene') {
      const success = await extractScenes(
        videoPath,
        totalFrames,
        opts.threshold,
        report
      )

      if (!success) {
        await extractUniform(videoPath, totalFrames, duration, report)
      }
    } else {
      await extractUniform(videoPath, totalFrames, duration, report)
    }

    report('🔲 그리드 생성 중...')

    await createGrid(opts.grid, outputName, report)

    report(`✅ 완료: ${outputName}`)
  } finally {
    if (existsSync(TEMP_DIR)) {
      rmSync(TEMP_DIR, { recursive: true })
    }
  }
}

main().catch((err) => {
  console.error('❌ 에러:', err.message)
  process.exit(1)
})
