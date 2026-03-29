import fs from "fs-extra";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { generateScript } from "./geminiService.js";
import { createVoiceover } from "./elevenLabsService.js";
import { fetchAndDownloadClips } from "./pexelsService.js";
import {
  buildConcatFile,
  normalizeClip,
  probeDuration,
  renderFinalVideo,
} from "../utils/ffmpegHelpers.js";
import { buildSubtitleEntries } from "../utils/subtitle.js";

function sanitizeName(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function cleanupOldOutputs(outputDir, maxAgeMs = 1000 * 60 * 60 * 6) {
  const files = await fs.readdir(outputDir);
  const now = Date.now();
  await Promise.all(
    files.map(async (name) => {
      const filePath = path.join(outputDir, name);
      const stat = await fs.stat(filePath);
      if (now - stat.mtimeMs > maxAgeMs) {
        await fs.remove(filePath);
      }
    })
  );
}

export async function generateReel(topic, { tempDir, outputDir }) {
  const jobId = uuidv4();
  const jobDir = path.join(tempDir, jobId);
  await fs.ensureDir(jobDir);
  await cleanupOldOutputs(outputDir);

  try {
    const { script, title } = await generateScript(topic);

    const audioPath = path.join(jobDir, "voiceover.mp3");
    await createVoiceover(script, audioPath);

    const clips = await fetchAndDownloadClips(topic, jobDir, 5);
    const audioDuration = await probeDuration(audioPath);
    const perClipDuration = Math.max(2.5, audioDuration / clips.length);
    const normalizedClips = [];

    for (let i = 0; i < clips.length; i += 1) {
      const normalizedPath = path.join(jobDir, `normalized_${i + 1}.mp4`);
      await normalizeClip({
        inputPath: clips[i],
        outputPath: normalizedPath,
        targetDurationSec: perClipDuration,
      });
      normalizedClips.push(normalizedPath);
    }

    const concatFilePath = path.join(jobDir, "clips.txt");
    await buildConcatFile(normalizedClips, concatFilePath);

    const subtitleEntries = buildSubtitleEntries(script, audioDuration);
    const configuredMusicPath =
      process.env.BACKGROUND_MUSIC_PATH ||
      path.join(path.resolve(tempDir, ".."), "assets", "background-music.mp3");
    const backgroundMusicPath = (await fs.pathExists(configuredMusicPath))
      ? configuredMusicPath
      : null;

    const baseName = `${sanitizeName(title)}-${Date.now()}`;
    const outputPath = path.join(outputDir, `${baseName}.mp4`);

    await renderFinalVideo({
      concatFilePath,
      audioPath,
      backgroundMusicPath,
      subtitleEntries,
      outputPath,
    });

    return { outputPath, script, title };
  } catch (error) {
    throw new Error(error?.message || "Pipeline failed.");
  } finally {
    await fs.remove(jobDir);
  }
}
