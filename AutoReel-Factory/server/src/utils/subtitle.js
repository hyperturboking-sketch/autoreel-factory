import fs from "fs-extra";

function toSrtTime(seconds) {
  const msTotal = Math.max(0, Math.floor(seconds * 1000));
  const ms = msTotal % 1000;
  const totalSec = Math.floor(msTotal / 1000);
  const sec = totalSec % 60;
  const totalMin = Math.floor(totalSec / 60);
  const min = totalMin % 60;
  const hour = Math.floor(totalMin / 60);

  const pad = (n, size = 2) => String(n).padStart(size, "0");
  return `${pad(hour)}:${pad(min)}:${pad(sec)},${pad(ms, 3)}`;
}

export async function createSubtitlesFromScript(script, durationSec, srtPath) {
  const entries = buildSubtitleEntries(script, durationSec);
  const srt = [];

  for (let i = 0; i < entries.length; i += 1) {
    const entry = entries[i];
    srt.push(`${i + 1}`);
    srt.push(`${toSrtTime(entry.start)} --> ${toSrtTime(entry.end)}`);
    srt.push(entry.text);
    srt.push("");
  }

  await fs.writeFile(srtPath, srt.join("\n"), "utf8");
  return srtPath;
}

export function buildSubtitleEntries(script, durationSec) {
  const lines = script
    .split("\n")
    .map((l) => l.replace(/^(HOOK|BODY|CTA):\s*/i, "").trim())
    .filter(Boolean);

  if (!lines.length) {
    throw new Error("Script is empty, cannot create subtitle entries.");
  }

  const splitToCards = (line, wordsPerLine = 4, maxLines = 2) => {
    const words = line.split(" ").filter(Boolean);
    if (!words.length) return [];

    const cards = [];
    const wordsPerCard = wordsPerLine * maxLines;

    for (let i = 0; i < words.length; i += wordsPerCard) {
      const slice = words.slice(i, i + wordsPerCard);
      const visualLines = [];
      for (let j = 0; j < slice.length; j += wordsPerLine) {
        visualLines.push(slice.slice(j, j + wordsPerLine).join(" "));
      }
      cards.push(visualLines.join("\n"));
    }
    return cards;
  };

  const cards = lines.flatMap((line) => splitToCards(line, 4, 2));
  const chunkDuration = durationSec / cards.length;
  const entries = [];

  for (let i = 0; i < cards.length; i += 1) {
    const start = i * chunkDuration;
    const end = i === cards.length - 1 ? durationSec : (i + 1) * chunkDuration;
    entries.push({
      start,
      end,
      text: cards[i],
    });
  }

  return entries;
}
