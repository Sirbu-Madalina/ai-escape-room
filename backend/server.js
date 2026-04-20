import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
const port = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.get("/", (req, res) => {
  res.send("Backend is running");
});

app.post("/api/riddle", async (req, res) => {
  try {
    const { difficulty = "easy", theme = "cyber lab" } = req.body;

    const response = await client.responses.create({
      model: "gpt-5-nano",
      input: `
You are an escape room puzzle generator.

Generate exactly one short puzzle for a web-based escape room.
Theme: ${theme}
Difficulty: ${difficulty}

Return ONLY valid JSON in this format:
{
  "title": "Puzzle title",
  "riddle": "The puzzle text",
  "answer": "single lowercase answer",
  "hint": "A useful hint",
  "explanation": "Why this answer is correct"
}

Rules:
- Answer must be short and clear
- Make it solvable
- No extra text outside JSON
`
    });

    const rawText = response.output_text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const parsed = JSON.parse(rawText);

    res.json(parsed);
  } catch (error) {
    console.error("Riddle generation error:", error);
    res.status(500).json({
      error: "Failed to generate riddle"
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});