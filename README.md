# yt-thumbnails

YouTube video thumbnail grid generator. Extract frames from YouTube videos and create a grid image.

## Requirements

- [Node.js](https://nodejs.org) >= 18 (or [Bun](https://bun.sh))
- [ffmpeg](https://ffmpeg.org)
- [yt-dlp](https://github.com/yt-dlp/yt-dlp)

```bash
# macOS
brew install ffmpeg yt-dlp
```

## Installation

```bash
npm install -g yt-thumbnails
```

## Usage

```bash
yt-thumbnails "<youtube-url>"
```

## GUI

A desktop front end built with [barlo](https://github.com/cbcruk/barlo), which
runs the page in the Chrome already installed on the machine. It shares the
extraction pipeline with the CLI.

Queue several videos and it works through them two at a time, showing each
job's progress and letting you cancel one mid-download. Finished grids go to
your Downloads folder, named after the video.

Requires [Bun](https://bun.sh) and Chrome, Chromium, Edge, or Brave — it is not
part of the npm package.

```bash
bun install
bun run gui
```

Build a standalone binary (~61 MB, no runtime dependencies beyond the browser):

```bash
bun run gui:build
./build/yt-thumbnails-gui
```

## Options

| Option            | Short | Description                     | Default             |
| ----------------- | ----- | ------------------------------- | ------------------- |
| `--grid <n>`      | `-g`  | Grid size (NxN)                 | 4                   |
| `--scene`         | `-s`  | Use scene detection mode        | uniform             |
| `--threshold <n>` | `-t`  | Scene detection threshold (0-1) | 0.4                 |
| `--output <path>` | `-o`  | Output file path                | `grid_NxN_mode.jpg` |

## Examples

```bash
# Basic 4x4 grid with uniform intervals
yt-thumbnails "https://youtube.com/watch?v=xxx"

# 6x6 grid
yt-thumbnails "https://youtube.com/watch?v=xxx" --grid 6

# Scene detection mode (better for music videos)
yt-thumbnails "https://youtube.com/watch?v=xxx" --scene

# Scene detection with lower threshold
yt-thumbnails "https://youtube.com/watch?v=xxx" --scene --threshold 0.3

# Custom output path
yt-thumbnails "https://youtube.com/watch?v=xxx" -o ~/thumbnails/video.jpg
```

## Modes

### Uniform Mode (default)

Extracts frames at equal time intervals throughout the video.

### Scene Mode (`--scene`)

Detects scene changes and extracts frames at transition points. Better for videos with distinct scenes like music videos or trailers.

If no scene changes are detected, falls back to uniform mode automatically.

## License

MIT
