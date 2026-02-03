import express from "express";
import axios from "axios";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import path from "path";

const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = new URL(".", import.meta.url).pathname;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.post("/api/tts", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL required" });

    /* 1️⃣ Fetch article */
    const page = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      timeout: 10000
    });

    /* 2️⃣ Extract readable text */
    const dom = new JSDOM(page.data, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article?.textContent) {
      return res.status(400).json({ error: "Could not extract text" });
    }

    const text = article.textContent
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 2500); // ElevenLabs-safe

    /* 3️⃣ ElevenLabs TTS */
    const voiceId = "21m00Tcm4TlvDq8ikWAM"; // Rachel (default)
    const elevenRes = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": process.env.ELEVENLABS_API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.45,
            similarity_boost: 0.75
          }
        })
      }
    );

    if (!elevenRes.ok) {
      const err = await elevenRes.text();
      console.error(err);
      return res.status(500).json({ error: "TTS failed" });
    }

    const audioBuffer = Buffer.from(await elevenRes.arrayBuffer());

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Disposition", "inline; filename=article.mp3");
    res.send(audioBuffer);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Running on port ${PORT}`);
});
