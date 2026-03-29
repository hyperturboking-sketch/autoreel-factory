# AutoReel Factory

AutoReel Factory is a full-stack AI web app that creates short-form vertical reels from a topic.

## Stack

- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express
- Video rendering: FFmpeg
- APIs: Google Gemini, ElevenLabs, Pexels

## Features

- Topic input and one-click reel generation
- AI script generation with Gemini (viral reel style)
- Voiceover generation with ElevenLabs Adam voice
- 3-5 relevant stock clips from Pexels
- 9:16 vertical output (1080x1920)
- Burned subtitles and watermark
- Download-ready final MP4

## Project Structure

- `client`: React frontend
- `server`: Express backend and video pipeline

## Setup

1. Install Node.js 18+ and FFmpeg
2. Install dependencies (PowerShell):

   - `cd .\server`
   - `npm install`
   - `cd ..\client`
   - `npm install`

3. Configure environment:

   - Copy `server/.env.example` to `server/.env`
   - Fill all required API keys

4. Run in two terminals (PowerShell):

   - Backend: `cd .\server` then `npm run dev`
   - Frontend: `cd .\client` then `npm run dev`

5. Open the frontend URL from Vite (usually `http://localhost:5173`)

## Notes

- Generated videos are temporarily stored in `server/output`
- Temporary files are written to `server/temp`
- Optional background music: place an MP3 at `server/assets/background-music.mp3` (auto-mixed at 20% volume under voiceover)
- The pipeline is optimized for fast short-video generation with clip trimming and normalized encoding settings
