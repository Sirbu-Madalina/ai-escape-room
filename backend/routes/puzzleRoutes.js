import express from "express";
import { createFallbackLogicBoardPuzzle } from "../data/fallbackPuzzles.js";
import {
  createStructuredSchemaResponse,
  generateStructuredJson,
} from "../services/openaiService.js";
import { createSudokuPuzzle } from "../services/sudokuService.js";
import {
  validateLogicBoardPuzzle,
  validateRiddlePuzzle,
} from "../utils/validators.js";

const router = express.Router();

// /api/riddle
// Calls OpenAI and returns a text riddle for Room 1.
router.post("/riddle", async (req, res) => {
  try {
    const { difficulty = "easy", theme = "cyber lab" } = req.body;

    const parsed = await generateStructuredJson({
      instructions: `
Create one short escape-room puzzle.
Theme: ${theme}
Difficulty: ${difficulty}

Return only JSON:
{
  "title": "Puzzle title",
  "riddle": "Puzzle text",
  "answer": "single lowercase answer",
  "hint": "A useful hint",
  "explanation": "Why the answer is correct"
}

Rules:
- Keep the puzzle concise and solvable
- Keep the answer short
- No markdown
`,
      validate: validateRiddlePuzzle,
    });

    res.json(parsed);
  } catch (error) {
    console.error("Riddle generation error:", error);
    res.status(500).json({
      error: "Failed to generate riddle",
    });
  }
});

// /api/sudoku
// Generates a Sudoku puzzle with code for Room 2.
router.get("/sudoku", (req, res) => {
  try {
    res.json(createSudokuPuzzle());
  } catch (error) {
    console.error("Sudoku generation error:", error);
    res.status(500).json({
      error: "Failed to generate sudoku",
    });
  }
});

// /api/logic-board
// Calls OpenAI and returns a logic puzzle for Room 3.
router.post("/logic-board", async (req, res) => {
  try {
    const { difficulty = "hard", theme = "neon grid" } = req.body;
    const parsed = await createStructuredSchemaResponse({
      instructions: `
Create one logic-board puzzle for a cyber escape room.
Theme: ${theme}
Difficulty: ${difficulty}

Make the puzzle solvable by logic, not guessing.
The player must read exactly 3 short statements and choose the correct terminal.
Use plain, beginner-friendly language.
Avoid abstract technical jargon.
Make the statements feel like clear clues in a game.
`,
      schemaName: "logic_board_puzzle",
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          riddle: { type: "string" },
          hint: { type: "string" },
          explanation: { type: "string" },
          statements: {
            type: "array",
            minItems: 3,
            maxItems: 3,
            items: { type: "string" },
          },
          options: {
            type: "array",
            minItems: 3,
            maxItems: 3,
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                id: {
                  type: "string",
                  enum: ["alpha", "beta", "gamma"],
                },
                label: { type: "string" },
                description: { type: "string" },
              },
              required: ["id", "label", "description"],
            },
          },
          answer: {
            type: "string",
            enum: ["alpha", "beta", "gamma"],
          },
        },
        required: ["title", "riddle", "hint", "explanation", "statements", "options", "answer"],
      },
    });

    validateLogicBoardPuzzle(parsed);

    res.json({
      ...parsed,
      kind: "logic-board",
    });
  } catch (error) {
    console.error("Logic board generation error:", error);
    res.json(createFallbackLogicBoardPuzzle());
  }
});

export default router;
