import express from "express";
import {
  createLogicBoardPuzzle,
  createRiddlePuzzle,
  createPuzzleForRoom,
} from "../services/puzzleService.js";

const router = express.Router();

// /api/riddle
// Calls OpenAI and returns a text riddle for Room 1.
router.post("/riddle", async (req, res) => {
  try {
    const { difficulty = "easy", theme = "cyber lab" } = req.body;
    res.json(await createRiddlePuzzle({ difficulty, theme }));
  } catch (error) {
    console.error("Riddle generation error:", error);
    res.status(500).json({
      error: "Failed to generate riddle",
    });
  }
});

// /api/sudoku
// Generates a Sudoku puzzle with code for Room 2.
router.get("/sudoku", async (req, res) => {
  try {
    res.json(await createPuzzleForRoom({ puzzleType: "sudoku" }));
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
    res.json(await createLogicBoardPuzzle({ difficulty, theme }));
  } catch (error) {
    console.error("Logic board generation error:", error);
    res.status(500).json({
      error: "Failed to generate logic board puzzle",
    });
  }
});

export default router;
