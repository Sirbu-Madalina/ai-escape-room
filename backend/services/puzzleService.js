import { createFallbackLogicBoardPuzzle } from "../data/fallbackPuzzles.js";
import {
  createStructuredSchemaResponse,
  generateStructuredJson,
} from "./openaiService.js";
import { createSudokuPuzzle } from "./sudokuService.js";
import {
  validateLogicBoardPuzzle,
  validateRiddlePuzzle,
} from "../utils/validators.js";

export const createRiddlePuzzle = async ({
  difficulty = "easy",
  theme = "cyber lab",
}) => {
  return generateStructuredJson({
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
};

export const createLogicBoardPuzzle = async ({
  difficulty = "hard",
  theme = "neon grid",
}) => {
  try {
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

    return {
      ...parsed,
      kind: "logic-board",
    };
  } catch (error) {
    console.error("Logic board generation error:", error);
    return createFallbackLogicBoardPuzzle();
  }
};

export const createPuzzleForRoom = async (room) => {
  if (room.puzzleType === "ai-riddle") {
    const puzzle = await createRiddlePuzzle({
      difficulty: room.difficulty,
      theme: room.theme,
    });

    return {
      ...puzzle,
      kind: "text",
      inputPlaceholder: "Type the answer",
    };
  }

  if (room.puzzleType === "sudoku") {
    return createSudokuPuzzle();
  }

  if (room.puzzleType === "logic-board") {
    return createLogicBoardPuzzle({
      difficulty: room.difficulty,
      theme: room.theme,
    });
  }

  throw new Error("Unknown puzzle type.");
};
