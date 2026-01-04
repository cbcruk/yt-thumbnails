import type { Options } from './types'

/**
 * Parses command line arguments into Options object
 * @returns Parsed CLI options
 */
export function parseArgs(): Options {
  const args = process.argv.slice(2)
  const options: Options = {
    url: null,
    grid: 4,
    mode: 'uniform',
    threshold: 0.4,
    output: null,
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]

    if (arg === '--scene' || arg === '-s') {
      options.mode = 'scene'
    } else if (arg === '--threshold' || arg === '-t') {
      options.threshold = parseFloat(args[++i])
    } else if (arg === '--grid' || arg === '-g') {
      options.grid = parseInt(args[++i])
    } else if (arg === '--output' || arg === '-o') {
      options.output = args[++i]
    } else if (!arg.startsWith('-')) {
      options.url = arg
    }
  }

  return options
}

/**
 * Prints CLI usage instructions to console
 */
export function printUsage(): void {
  console.log(`
Usage: yt-thumbnails <youtube-url> [options]

Options:
  -g, --grid <n>        Grid size (default: 4 = 4x4)
  -s, --scene           Use scene detection instead of uniform intervals
  -t, --threshold <n>   Scene detection threshold 0-1 (default: 0.4)
  -o, --output <path>   Output file path (default: grid_NxN_mode.jpg)

Examples:
  yt-thumbnails "https://youtube.com/watch?v=xxx"
  yt-thumbnails "https://youtube.com/watch?v=xxx" --grid 6
  yt-thumbnails "https://youtube.com/watch?v=xxx" --scene
  yt-thumbnails "https://youtube.com/watch?v=xxx" -o ~/thumbnails/video.jpg
`)
}
