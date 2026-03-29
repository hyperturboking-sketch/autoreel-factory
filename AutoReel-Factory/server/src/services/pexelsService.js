import axios from "axios";
import fs from "fs-extra";
import path from "path";

export async function fetchAndDownloadClips(topic, tempDir, maxClips = 5) {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    throw new Error("PEXELS_API_KEY is missing.");
  }

  const clipsToUse = Math.min(Math.max(maxClips, 3), 5);
  const query = encodeURIComponent(`${topic} vertical cinematic`);
  const searchUrl = `https://api.pexels.com/videos/search?query=${query}&per_page=15&orientation=portrait`;

  const searchResponse = await axios.get(searchUrl, {
    headers: { Authorization: apiKey },
    timeout: 45000,
  });

  const videos = searchResponse.data?.videos || [];
  if (!videos.length) {
    throw new Error("No relevant clips found on Pexels.");
  }

  const selected = videos.slice(0, clipsToUse);
  const downloaded = [];

  for (let i = 0; i < selected.length; i += 1) {
    const video = selected[i];
    const files = video.video_files || [];
    const best =
      files.find((f) => f.width >= 720 && f.height >= 1280) ||
      files.find((f) => f.width >= 540 && f.height >= 960) ||
      files[0];

    if (!best?.link) {
      continue;
    }

    const clipPath = path.join(tempDir, `clip_${i + 1}.mp4`);
    const clipData = await axios.get(best.link, {
      responseType: "arraybuffer",
      timeout: 120000,
    });
    await fs.writeFile(clipPath, clipData.data);
    downloaded.push(clipPath);
  }

  if (downloaded.length < 3) {
    throw new Error("Failed to download enough clips from Pexels.");
  }

  return downloaded;
}
