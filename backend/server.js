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

const extractJsonText = (text) => {
  const trimmed = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .replace(/[“”]/g, "\"")
    .replace(/[‘’]/g, "'")
    .trim();

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return trimmed;
  }

  return trimmed.slice(firstBrace, lastBrace + 1);
};

const createJsonResponse = async (instructions) => {
  const response = await client.responses.create({
    model: "gpt-5-nano",
    reasoning: {
      effort: "minimal",
    },
    max_output_tokens: 260,
    input: instructions,
  });

  return extractJsonText(response.output_text);
};

const createStructuredSchemaResponse = async ({ instructions, schemaName, schema }) => {
  const response = await client.responses.create({
    model: "gpt-4o-mini",
    input: instructions,
    text: {
      format: {
        type: "json_schema",
        name: schemaName,
        strict: true,
        schema,
      },
    },
  });

  return JSON.parse(response.output_text);
};

const parseGeneratedJson = (rawText) => {
  return JSON.parse(rawText);
};

const generateStructuredJson = async ({ instructions, validate, retries = 2 }) => {
  let lastError = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const rawText = await createJsonResponse(instructions);
      const parsed = parseGeneratedJson(rawText);

      validate(parsed);

      return parsed;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
};

const validateRiddlePuzzle = (value) => {
  const requiredKeys = ["title", "riddle", "answer", "hint", "explanation"];

  for (const key of requiredKeys) {
    if (typeof value?.[key] !== "string" || value[key].trim() === "") {
      throw new Error(`Invalid riddle payload: missing ${key}`);
    }
  }
};

const validateLogicBoardPuzzle = (value) => {
  const requiredTextKeys = ["title", "riddle", "hint", "explanation", "answer"];

  for (const key of requiredTextKeys) {
    if (typeof value?.[key] !== "string" || value[key].trim() === "") {
      throw new Error(`Invalid logic board payload: missing ${key}`);
    }
  }

  if (!Array.isArray(value.statements) || value.statements.length !== 3) {
    throw new Error("Invalid logic board payload: statements must have length 3");
  }

  if (!value.statements.every((statement) => typeof statement === "string" && statement.trim() !== "")) {
    throw new Error("Invalid logic board payload: statements must be strings");
  }

  if (!Array.isArray(value.options) || value.options.length !== 3) {
    throw new Error("Invalid logic board payload: options must have length 3");
  }

  if (!value.options.every((option) =>
    typeof option?.id === "string" &&
    typeof option?.label === "string" &&
    typeof option?.description === "string" &&
    option.id.trim() !== "" &&
    option.label.trim() !== "" &&
    option.description.trim() !== ""
  )) {
    throw new Error("Invalid logic board payload: malformed option");
  }

  if (!value.options.some((option) => option.id === value.answer)) {
    throw new Error("Invalid logic board payload: answer does not match any option");
  }
};

const createFallbackLogicBoardPuzzle = () => {
  return {
    title: "Neon Switchboard",
    riddle: "Three terminals each make one claim about the safe switch. Only one terminal is telling the truth. Choose the truthful terminal.",
    hint: "Test each statement one by one. The correct choice is the one that makes the puzzle consistent.",
    explanation: "Gamma is correct because Alpha and Beta cannot both fit the situation, but Gamma's statement stays consistent with the full set.",
    kind: "logic-board",
    statements: [
      "Terminal Alpha says: 'Beta is the safe switch.'",
      "Terminal Beta says: 'Alpha is lying.'",
      "Terminal Gamma says: 'Beta is not the safe switch.'",
    ],
    options: [
      { id: "alpha", label: "Terminal Alpha", description: "Blue panel on the left wall." },
      { id: "beta", label: "Terminal Beta", description: "Amber panel in the center." },
      { id: "gamma", label: "Terminal Gamma", description: "Pink panel on the right wall." },
    ],
    answer: "gamma",
  };
};

const baseSudokuSolution = [
  [1, 2, 3, 4],
  [3, 4, 1, 2],
  [2, 1, 4, 3],
  [4, 3, 2, 1],
];

const shuffle = (items) => {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }

  return copy;
};

const cloneGrid = (grid) => grid.map((row) => [...row]);

const remapDigits = (grid) => {
  const digits = shuffle([1, 2, 3, 4]);
  const mapping = new Map([
    [1, digits[0]],
    [2, digits[1]],
    [3, digits[2]],
    [4, digits[3]],
  ]);

  return grid.map((row) => row.map((cell) => mapping.get(cell)));
};

const reorderRows = (grid, order) => order.map((rowIndex) => [...grid[rowIndex]]);

const reorderColumns = (grid, order) => grid.map((row) => order.map((columnIndex) => row[columnIndex]));

const createSudokuPuzzle = () => {
  const rowOrder = [...shuffle([0, 1]), ...shuffle([2, 3])];
  const columnOrder = [...shuffle([0, 1]), ...shuffle([2, 3])];
  const reorderedRows = reorderRows(baseSudokuSolution, rowOrder);
  const reorderedGrid = reorderColumns(reorderedRows, columnOrder);
  const randomizedSolution = remapDigits(reorderedGrid);
  const givens = cloneGrid(randomizedSolution);
  const removableCells = shuffle([
    [0, 1],
    [1, 0],
    [1, 3],
    [2, 2],
    [3, 1],
    [0, 3],
    [2, 0],
    [3, 2],
  ]);

  const cellsToHide = removableCells.slice(0, 6);

  for (const [rowIndex, columnIndex] of cellsToHide) {
    givens[rowIndex][columnIndex] = 0;
  }

  return {
    title: "Vault Matrix 4x4",
    riddle: "Fill the 4x4 vault grid so every row and every column contains the numbers 1 to 4 exactly once.",
    hint: "Start with any row or column that already has three visible numbers.",
    explanation: "A valid grid uses 1, 2, 3, and 4 exactly once in every row and every column.",
    kind: "sudoku",
    givens,
    solution: randomizedSolution,
  };
};

app.get("/", (req, res) => {
  res.send("Backend is running");
});

app.post("/api/riddle", async (req, res) => {
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
      error: "Failed to generate riddle"
    });
  }
});

app.get("/api/sudoku", (req, res) => {
  try {
    res.json(createSudokuPuzzle());
  } catch (error) {
    console.error("Sudoku generation error:", error);
    res.status(500).json({
      error: "Failed to generate sudoku"
    });
  }
});

app.post("/api/logic-board", async (req, res) => {
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

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
