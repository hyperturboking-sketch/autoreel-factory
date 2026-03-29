import axios from "axios";

async function callGemini(prompt, apiKey) {
  const preferred = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const models = [
    preferred,
    "gemini-2.5-flash",
    "gemini-flash-latest",
    "gemini-2.0-flash",
    "gemini-2.0-flash-001",
  ];

  let lastError;
  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await axios.post(
        url,
        {
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 300,
          },
          contents: [{ parts: [{ text: prompt }] }],
        },
        { timeout: 60000 }
      );

      const text =
        response.data?.candidates?.[0]?.content?.parts
          ?.map((p) => p.text || "")
          .join("\n")
          .trim() || "";

      if (text) return text;
    } catch (error) {
      lastError = error;
    }
  }

  const detail =
    lastError?.response?.data?.error?.message || lastError?.message || "unknown";
  throw new Error(`Gemini request failed: ${detail}`);
}

function normalizeLine(line) {
  return line
    .replace(/\s+/g, " ")
    .replace(/\s+([,.!?])/g, "$1")
    .trim();
}

function isWeakLine(line) {
  const weakPatterns = [
    /^this is about/i,
    /^in this (video|reel)/i,
    /^let us/i,
    /^let's talk/i,
    /^today we/i,
    /^basically/i,
    /^you know/i,
  ];

  if (line.length < 8) return true;
  return weakPatterns.some((pattern) => pattern.test(line));
}

function limitWords(line, maxWords = 10) {
  const words = line.split(" ").filter(Boolean);
  if (words.length <= maxWords) return line;

  const limited = words.slice(0, maxWords).join(" ");
  return /[.!?]$/.test(limited) ? limited : `${limited}...`;
}

function cleanScript(raw) {
  const baseLines = raw
    .replace(/```[\s\S]*?```/g, "")
    .replace(/[*_#>`~-]/g, "")
    .split("\n")
    .map(normalizeLine)
    .filter(Boolean);

  const strongLines = baseLines
    .filter((line) => !isWeakLine(line))
    .map((line) => limitWords(line, 10));

  const finalLines = strongLines.length >= 5
    ? strongLines
    : baseLines.map((line) => limitWords(line, 10)).slice(0, 8);

  // Double line breaks create stronger spoken pauses in TTS.
  return finalLines.join("\n\n");
}

export async function generateScript(topic) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing.");
  }

  const prompt = `Create a viral Instagram Reel script about: ${topic}

Rules:
- Hook the viewer in the first 2 lines
- Use very short lines (1 sentence per line)
- Add emotional or motivational tone
- Create curiosity and tension
- Use simple words
- Make it sound powerful when spoken
- End with a strong call to action

Format:
- Each sentence on a new line
- No paragraphs
- No emojis
- No hashtags
- Return clean plain text only
- No markdown
- No bullets
- No numbering

Style example:

Stop scrolling.

This might be the sign you needed.

You keep waiting...
for the perfect moment.

But it never comes.

While you hesitate,
someone else is already winning.

Start now.

Or stay stuck forever.`;

  const raw = await callGemini(prompt, apiKey);
  const script = cleanScript(raw);

  if (!script) {
    throw new Error("Gemini returned an empty script.");
  }

  const title = topic
    .split(" ")
    .slice(0, 5)
    .join(" ")
    .replace(/[^\w\s-]/g, "")
    .trim();

  return { script, title: title || "auto-reel" };
}
