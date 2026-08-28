#!/usr/bin/env node
import { parseArgs, printUsage } from './args'
import { generate } from './pipeline'
import type { Reporter } from './types'

async function main(): Promise<void> {
  const opts = parseArgs()

  if (!opts.url) {
    printUsage()
    process.exit(1)
  }

  const report: Reporter = (message) => console.log(message)
  const modeLabel = opts.mode === 'scene' ? 'scene' : 'uniform'
  const output =
    opts.output ?? `grid_${opts.grid}x${opts.grid}_${modeLabel}.jpg`

  await generate(
    {
      url: opts.url,
      grid: opts.grid,
      mode: opts.mode,
      threshold: opts.threshold,
      output,
    },
    report
  )
}

main().catch((err) => {
  console.error('❌ 에러:', err.message)
  process.exit(1)
})
