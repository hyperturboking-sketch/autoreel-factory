import ffmpeg from "fluent-ffmpeg";
import fs from "fs-extra";

if (process.env.FFMPEG_PATH) {
  ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH);
}

if (process.env.FFPROBE_PATH) {
  ffmpeg.setFfprobePath(process.env.FFPROBE_PATH);
}

export function probeDuration(inputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (err, data) => {
      if (err) {
        return reject(err);
      }
      return resolve(data.format?.duration || 20);
    });
  });
}

export async function buildConcatFile(clips, concatFilePath) {
  const lines = clips.map((clip) => {
    const normalized = clip.replace(/\\/g, "/").replace(/'/g, "'\\''");
    return `file '${normalized}'`;
  });
  await fs.writeFile(concatFilePath, lines.join("\n"), "utf8");
}

export function normalizeClip({
  inputPath,
  outputPath,
  targetDurationSec,
  width = 1080,
  height = 1920,
}) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .noAudio()
      .videoFilters([
        `scale=${width}:${height}:force_original_aspect_ratio=increase`,
        `crop=${width}:${height}`,
        "setsar=1",
        "fps=30",
        "format=yuv420p",
      ])
      .outputOptions([
        "-t",
        String(targetDurationSec),
        "-an",
        "-c:v libx264",
        "-preset veryfast",
        "-crf 24",
        "-pix_fmt yuv420p",
        "-movflags +faststart",
      ])
      .output(outputPath)
      .on("end", () => resolve(outputPath))
      .on("error", (err) => reject(err))
      .run();
  });
}

export function renderFinalVideo({
  concatFilePath,
  audioPath,
  backgroundMusicPath,
  subtitleEntries,
  outputPath,
}) {
  return new Promise((resolve, reject) => {
    const fontPath = "C\\:/Windows/Fonts/arial.ttf";
    const escapeText = (text) =>
      text
        .replace(/\\/g, "\\\\")
        .replace(/:/g, "\\:")
        .replace(/'/g, "\\'")
        .replace(/,/g, "\\,")
        .replace(/\[/g, "\\[")
        .replace(/\]/g, "\\]")
        .replace(/\n/g, "\\n");

    const subtitleFilters = (subtitleEntries || []).map((entry) => {
      const text = escapeText(entry.text);
      const start = entry.start.toFixed(2);
      const end = entry.end.toFixed(2);
      return `drawtext=fontfile='${fontPath}':text='${text}':fontcolor=white:fontsize=70:line_spacing=10:borderw=5:bordercolor=black:x=(w-text_w)/2:y=(h-text_h)/2+4*sin(8*t):enable='between(t\\,${start}\\,${end})'`;
    });

    const filters = [
      "scale=1080:1920:force_original_aspect_ratio=increase",
      "crop=1080:1920",
      "setsar=1",
      "fps=30",
      "format=yuv420p",
      `drawtext=fontfile='${fontPath}':text='AutoReel Factory':fontcolor=white@0.5:fontsize=42:x=(w-text_w)/2:y=h-120`,
      ...subtitleFilters,
    ].join(",");

    const command = ffmpeg()
      .input(concatFilePath)
      .inputOptions(["-f concat", "-safe 0"])
      .input(audioPath)
      .videoFilters(filters);

    if (backgroundMusicPath) {
      command.input(backgroundMusicPath).inputOptions(["-stream_loop -1"]);
      command.complexFilter([
        "[1:a]volume=1.0[voice]",
        "[2:a]volume=0.2[bgm]",
        "[voice][bgm]amix=inputs=2:duration=first:dropout_transition=0[mixout]",
      ]);

      command.outputOptions([
        "-map 0:v:0",
        "-map [mixout]",
        "-c:v libx264",
        "-preset veryfast",
        "-crf 23",
        "-pix_fmt yuv420p",
        "-c:a aac",
        "-b:a 192k",
        "-ar 48000",
        "-shortest",
        "-movflags +faststart",
      ]);
    } else {
      command.outputOptions([
        "-map 0:v:0",
        "-map 1:a:0",
        "-c:v libx264",
        "-preset veryfast",
        "-crf 23",
        "-pix_fmt yuv420p",
        "-c:a aac",
        "-b:a 192k",
        "-ar 48000",
        "-shortest",
        "-movflags +faststart",
      ]);
    }

    command
      .output(outputPath)
      .on("end", () => resolve(outputPath))
      .on("error", (err) => reject(err))
      .run();
  });
}
