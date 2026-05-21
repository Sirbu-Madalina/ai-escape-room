import express from "express";
import {
  createCorruptedDocumentsPuzzle,
  createCrosswordPuzzle,
  createEmailInvestigationPuzzle,
  createLogicBoardPuzzle,
  createRiddlePuzzle,
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

// /api/email-investigation
// Calls OpenAI and returns an inbox investigation puzzle for Room 2.
router.post("/email-investigation", async (req, res) => {
  try {
    const { difficulty = "medium", theme = "suspicious company inbox" } = req.body;
    res.json(await createEmailInvestigationPuzzle({ difficulty, theme }));
  } catch (error) {
    console.error("Email investigation generation error:", error);
    res.status(500).json({
      error: "Failed to generate email investigation puzzle",
    });
  }
});

// /api/crossword
// Calls OpenAI and returns a compact AI crossword puzzle for Room 1.
router.post("/crossword", async (req, res) => {
  try {
    const { difficulty = "easy", theme = "cyber lab" } = req.body;
    res.json(await createCrosswordPuzzle({ difficulty, theme }));
  } catch (error) {
    console.error("Crossword generation error:", error);
    res.status(500).json({
      error: "Failed to generate crossword puzzle",
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

// /api/corrupted-documents
// Calls OpenAI and returns a corrupted document recovery puzzle for Room 3.
router.post("/corrupted-documents", async (req, res) => {
  try {
    const { difficulty = "hard", theme = "corrupted document archive" } = req.body;
    res.json(await createCorruptedDocumentsPuzzle({ difficulty, theme }));
  } catch (error) {
    console.error("Corrupted documents generation error:", error);
    res.status(500).json({
      error: "Failed to generate corrupted documents puzzle",
    });
  }
});

export default router;
