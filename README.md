# yt-thumbnails

YouTube video thumbnail grid generator. Extract frames from YouTube videos and create a grid image.

## Requirements

- [Bun](https://bun.sh)
- [ffmpeg](https://ffmpeg.org)
- [yt-dlp](https://github.com/yt-dlp/yt-dlp)

```bash
# macOS
brew install ffmpeg yt-dlp
```

## Installation

```bash
git clone <repo-url>
cd yt-thumbnails
bun install
```

## Usage

### Development

```bash
bun start "<youtube-url>"
```

### Build

```bash
bun run build
./dist/yt-thumbnails "<youtube-url>"
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
