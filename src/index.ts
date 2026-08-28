#!/usr/bin/env node
import { execSync } from 'child_process'
import { existsSync, mkdirSync, rmSync } from 'fs'
import { join } from 'path'
import { parseArgs, printUsage } from './args'
import { TEMP_DIR } from './constants'
import { extractUniform, extractScenes } from './extract'
import { createGrid } from './grid'

async function main(): Promise<void> {
  const opts = parseArgs()

  if (!opts.url) {
    printUsage()
    process.exit(1)
  }

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
    console.log('📹 영상 정보 가져오는 중...')

    const duration = parseFloat(
      execSync(`yt-dlp --print duration "${opts.url}"`, {
        encoding: 'utf-8',
      }).trim()
    )

    console.log(
      `   길이: ${Math.floor(duration / 60)}분 ${Math.floor(duration % 60)}초`
    )

    console.log('⬇️  영상 다운로드 중...')

    execSync(
      `yt-dlp -f "best[height<=720]" -o "${TEMP_DIR}/video.mp4" "${opts.url}"`,
      {
        stdio: 'inherit',
      }
    )

    const videoPath = join(TEMP_DIR, 'video.mp4')

    console.log(`🎞️  프레임 추출 중 (${opts.mode} 모드)...`)

    if (opts.mode === 'scene') {
      const success = await extractScenes(
        videoPath,
        totalFrames,
        opts.threshold
      )

      if (!success) {
        extractUniform(videoPath, totalFrames, duration)
      }
    } else {
      extractUniform(videoPath, totalFrames, duration)
    }

    console.log('🔲 그리드 생성 중...')

    createGrid(opts.grid, outputName)

    console.log(`✅ 완료: ${outputName}`)
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
