import axios from "axios";
import fs from "fs-extra";

export async function createVoiceover(script, outputAudioPath) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID || "pNInz6obpgDQGcFmaJgB";

  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY is missing.");
  }

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
  const response = await axios.post(
    url,
    {
      text: script,
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        stability: 0.3,
        similarity_boost: 0.85,
        style: 0.7,
        use_speaker_boost: true,
      },
    },
    {
      responseType: "arraybuffer",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      timeout: 120000,
    }
  );

  await fs.writeFile(outputAudioPath, response.data);
  return outputAudioPath;
}
