import express from "express";
import axios from "axios";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import OpenAI from "openai";
import path from "path";

const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = new URL(".", import.meta.url).pathname;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.post("/api/tts", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL required" });

    const response = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      timeout: 10000
    });

    const dom = new JSDOM(response.data, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article?.textContent) {
      return res.status(400).json({ error: "Could not read article" });
    }

    const text = article.textContent
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 4000);

    const audio = await openai.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "alloy",
      input: text
    });

    const buffer = Buffer.from(await audio.arrayBuffer());

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Disposition", "inline; filename=article.mp3");
    res.send(buffer);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "TTS failed" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Live on port ${PORT}`);
});
