import {
  createFallbackCorruptedDocumentsPuzzle,
  createCrosswordFromWords,
  createFallbackCrosswordPuzzle,
  createFallbackEmailInvestigationPuzzle,
  createFallbackLogicBoardPuzzle,
} from "../data/fallbackPuzzles.js";
import {
  createStructuredSchemaResponse,
  generateStructuredJson,
} from "./openaiService.js";
import {
  validateCorruptedDocumentsPuzzle,
  validateCrosswordWordSet,
  validateEmailInvestigationPuzzle,
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

export const createCrosswordPuzzle = async ({
  difficulty = "easy",
  theme = "cyber lab",
}) => {
  try {
    const generationSeed = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const parsed = await createStructuredSchemaResponse({
      instructions: `
Create one beginner-friendly crossword word set for Room 1 of an AI escape room.
Theme: ${theme}
Difficulty: ${difficulty}
Generation seed: ${generationSeed}

The frontend will place the words into a simple fixed crossword layout, so you only generate words and clues.
Make it fun, clear, and easy to understand. The player should feel clever, not confused.

Rules:
- Generate exactly 5 words.
- Each answer must be 2 to 6 letters.
- Use common everyday words, light cyber-lab words, or escape-room words.
- Do not use obscure jargon.
- Every clue must point clearly to one answer.
- Avoid vague clues such as "a thing", "something", "might", "maybe", "yummy", or "nice".
- Clues should be short, direct, and natural.
- Answers must be lowercase letters only.
- No duplicate answers.
`,
      schemaName: "crossword_word_set",
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          riddle: { type: "string" },
          hint: { type: "string" },
          explanation: { type: "string" },
          words: {
            type: "array",
            minItems: 5,
            maxItems: 5,
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                answer: { type: "string" },
                clue: { type: "string" },
              },
              required: ["answer", "clue"],
            },
          },
        },
        required: ["title", "riddle", "hint", "explanation", "words"],
      },
    });

    validateCrosswordWordSet(parsed);

    console.log("AI crossword generated:", parsed.words.map((word) => word.answer).join(", "));

    return {
      ...createCrosswordFromWords(parsed),
      generatedBy: "ai",
    };
  } catch (error) {
    console.error("Crossword generation error:", error);
    return {
      ...createFallbackCrosswordPuzzle(),
      generatedBy: "fallback",
    };
  }
};

export const createEmailInvestigationPuzzle = async ({
  difficulty = "medium",
  theme = "suspicious company inbox",
}) => {
  try {
    const parsed = await createStructuredSchemaResponse({
      instructions: `
Create one email investigation puzzle for an AI escape room.
Theme: ${theme}
Difficulty: ${difficulty}

The player sees a suspicious company inbox with a search bar, opens emails, and discovers an override code.
The puzzle must be solvable by reading clues in the emails and employee profile.
Do not make the answer simply a birthday. The final code must require combining 3 or 4 separate clues.
Use one of these patterns, or invent a similar one:
- project prefix + lab number + shift marker
- employee badge suffix + archive shelf + color keyword
- department code + incident number + approval initial
- server name fragment + floor number + backup window

The employee profile may contain one clue, but never the whole answer.
Write 5 to 6 emails. Include 3 clue emails, 1 suspicious misdirection or warning, and 1 harmless noise email.
Every clue email should reveal a different kind of evidence.
The "clues" array should summarize the evidence pieces needed to solve the final code.
Keep the language concise and readable.
`,
      schemaName: "email_investigation_puzzle",
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          riddle: { type: "string" },
          hint: { type: "string" },
          explanation: { type: "string" },
          employeeProfile: {
            type: "object",
            additionalProperties: false,
            properties: {
              name: { type: "string" },
              role: { type: "string" },
              birthday: { type: "string" },
              detailLabel: { type: "string" },
              detailValue: { type: "string" },
              notes: { type: "string" },
            },
            required: ["name", "role", "detailLabel", "detailValue", "notes"],
          },
          clues: {
            type: "array",
            minItems: 4,
            maxItems: 4,
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                label: { type: "string" },
                value: { type: "string" },
                discovered: { type: "boolean" },
              },
              required: ["label", "value", "discovered"],
            },
          },
          emails: {
            type: "array",
            minItems: 5,
            maxItems: 6,
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                id: { type: "string" },
                from: { type: "string" },
                to: { type: "string" },
                subject: { type: "string" },
                preview: { type: "string" },
                body: { type: "string" },
                time: { type: "string" },
                priority: { type: "string", enum: ["normal", "clue", "danger"] },
                clueSummary: { type: "string" },
                attachmentName: { type: "string" },
                tags: {
                  type: "array",
                  minItems: 1,
                  maxItems: 4,
                  items: { type: "string" },
                },
              },
              required: [
                "id",
                "from",
                "to",
                "subject",
                "preview",
                "body",
                "time",
                "priority",
                "clueSummary",
                "attachmentName",
                "tags",
              ],
            },
          },
          answer: { type: "string" },
        },
        required: ["title", "riddle", "hint", "explanation", "employeeProfile", "clues", "emails", "answer"],
      },
    });

    validateEmailInvestigationPuzzle(parsed);

    return {
      ...parsed,
      kind: "email-investigation",
      inputPlaceholder: "Enter override code",
    };
  } catch (error) {
    console.error("Email investigation generation error:", error);
    return createFallbackEmailInvestigationPuzzle();
  }
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

export const createCorruptedDocumentsPuzzle = async ({
  difficulty = "hard",
  theme = "corrupted document archive",
}) => {
  try {
    const parsed = await createStructuredSchemaResponse({
      instructions: `
Create one corrupted-documents puzzle for an AI escape room.
Theme: ${theme}
Difficulty: ${difficulty}

The player opens three damaged documents. Each document contains missing letters, glitch symbols, and one hidden clue fragment.
The final answer must require combining the three fragments in document order.
Keep corrupted text readable enough to solve, but visually glitchy.
Use uppercase fragments in the documents, but the answer should be lowercase.

Make this fun and clear, not frustrating:
- Each hiddenClue must be a full word, never a single letter.
- Each hiddenClue must be 3 to 10 letters.
- The final answer must be exactly the three hiddenClue words in document order, separated by spaces.
- The corruptedText must include enough readable context for the player to understand why that word matters.
- Include one friendly line in each corruptedText like "Readable fragment:" or "Recovered word:" before the clue.
- Avoid vague fragments such as "A", "T", "e", initials, or random letters.
- Avoid requiring outside knowledge.
`,
      schemaName: "corrupted_documents_puzzle",
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          riddle: { type: "string" },
          hint: { type: "string" },
          explanation: { type: "string" },
          documents: {
            type: "array",
            minItems: 3,
            maxItems: 3,
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                id: { type: "string" },
                title: { type: "string" },
                classification: { type: "string" },
                corruptedText: { type: "string", minLength: 80 },
                hiddenClue: { type: "string", minLength: 3, maxLength: 10 },
                clueLabel: { type: "string" },
              },
              required: ["id", "title", "classification", "corruptedText", "hiddenClue", "clueLabel"],
            },
          },
          answer: { type: "string" },
        },
        required: ["title", "riddle", "hint", "explanation", "documents", "answer"],
      },
    });

    validateCorruptedDocumentsPuzzle(parsed);

    return {
      ...parsed,
      kind: "corrupted-documents",
      inputPlaceholder: "Enter recovered phrase",
    };
  } catch (error) {
    console.error("Corrupted documents generation error:", error);
    return createFallbackCorruptedDocumentsPuzzle();
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

  if (room.puzzleType === "crossword") {
    return createCrosswordPuzzle({
      difficulty: room.difficulty,
      theme: room.theme,
    });
  }

  if (room.puzzleType === "email-investigation") {
    return createEmailInvestigationPuzzle({
      difficulty: room.difficulty,
      theme: room.theme,
    });
  }

  if (room.puzzleType === "logic-board") {
    return createLogicBoardPuzzle({
      difficulty: room.difficulty,
      theme: room.theme,
    });
  }

  if (room.puzzleType === "corrupted-documents") {
    return createCorruptedDocumentsPuzzle({
      difficulty: room.difficulty,
      theme: room.theme,
    });
  }

  throw new Error("Unknown puzzle type.");
};
