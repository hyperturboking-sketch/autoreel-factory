import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs-extra";
import { generateReel } from "./services/reelPipeline.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const outputDir = path.join(rootDir, "output");
const tempDir = path.join(rootDir, "temp");

await fs.ensureDir(outputDir);
await fs.ensureDir(tempDir);

const app = express();
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "*",
  })
);
app.use(express.json({ limit: "2mb" }));
app.use("/videos", express.static(outputDir));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/generate", async (req, res) => {
  try {
    const topic = String(req.body?.topic || "").trim();
    if (!topic) {
      return res.status(400).json({ error: "Topic is required." });
    }

    const result = await generateReel(topic, { tempDir, outputDir });
    return res.json({
      videoUrl: `/videos/${path.basename(result.outputPath)}`,
      script: result.script,
      title: result.title,
    });
  } catch (error) {
    const message = error?.message || "Failed to generate reel.";
    console.error("Generate error:", error);
    return res.status(500).json({ error: message });
  }
});

const port = Number(process.env.PORT || 5000);
app.listen(port, () => {
  console.log(`AutoReel Factory API running on http://localhost:${port}`);
});
