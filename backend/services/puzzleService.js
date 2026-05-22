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

const crosswordThemes = [
  "space station tools",
  "kitchen objects",
  "weather and nature",
  "school supplies",
  "music and sounds",
  "travel and maps",
  "simple mystery objects",
  "friendly robots",
  "game night objects",
  "office desk items",
  "lab safety objects",
  "everyday city places",
];

const overusedCrosswordWords = [
  "code",
  "hack",
  "data",
  "exit",
  "link",
  "file",
  "user",
  "login",
  "key",
  "node",
  "byte",
];

let recentCrosswordAnswers = [];

const rememberCrosswordAnswers = (words) => {
  recentCrosswordAnswers = [
    ...recentCrosswordAnswers,
    ...words.map((word) => word.answer.toLowerCase()),
  ].slice(-40);
};

const hasRepeatedCrosswordAnswers = (words) => {
  const answers = words.map((word) => word.answer.toLowerCase());
  const blockedWords = new Set([...overusedCrosswordWords, ...recentCrosswordAnswers]);

  return answers.some((answer) => blockedWords.has(answer));
};

export const createCrosswordPuzzle = async ({
  difficulty = "easy",
  theme = "cyber lab",
}) => {
  let lastError = null;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
    const generationSeed = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const selectedTheme = crosswordThemes[Math.floor(Math.random() * crosswordThemes.length)];
    const forbiddenWords = [...overusedCrosswordWords, ...recentCrosswordAnswers]
      .slice(-28)
      .join(", ");
    const parsed = await createStructuredSchemaResponse({
      instructions: `
Create one beginner-friendly crossword word set for Room 1 of an AI escape room.
Main room theme: ${theme}
Puzzle mini-theme for this generation: ${selectedTheme}
Difficulty: ${difficulty}
Generation seed: ${generationSeed}
Attempt: ${attempt}
Forbidden answers for this generation: ${forbiddenWords || "none"}

The frontend will place the words into a simple fixed crossword layout, so you only generate words and clues.
Make it fun, clear, and easy to understand. The player should feel clever, not confused.

Rules:
- Generate exactly 5 words.
- Each answer must be 2 to 6 letters.
- Use the puzzle mini-theme strongly, so each new game feels different.
- Mix everyday words with light escape-room flavor.
- Do not use obscure jargon.
- Do not use any forbidden answer.
- Avoid the obvious repeated cyber set: code, hack, data, exit, link.
- Avoid using several words from the same previous puzzle pattern.
- Every clue must point clearly to one answer.
- Avoid vague clues such as "a thing", "something", "might", "maybe", "yummy", or "nice".
- Clues should be short, direct, and natural.
- Answers must be lowercase letters only.
- No duplicate answers.
- Prefer concrete nouns or simple actions players can picture.
- Good clue style: "Tool used to eat soup." -> spoon.
- Bad clue style: "Program instructions." -> code.
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

    if (hasRepeatedCrosswordAnswers(parsed.words)) {
      throw new Error(`Crossword generation repeated blocked words: ${parsed.words.map((word) => word.answer).join(", ")}`);
    }

    rememberCrosswordAnswers(parsed.words);

    console.log("AI crossword generated:", parsed.words.map((word) => word.answer).join(", "));

    return {
      ...createCrosswordFromWords(parsed),
      generatedBy: "ai",
    };
  } catch (error) {
      lastError = error;
      console.error(`Crossword generation attempt ${attempt} failed:`, error);
    }
  }

  console.error("Crossword generation error:", lastError);

  return {
    ...createFallbackCrosswordPuzzle(),
    generatedBy: "fallback",
  };
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
Do not write the full answer in any email, clue summary, placeholder, title, or explanation until the final explanation.
The answer must be 4 to 7 characters using only letters and numbers. No spaces, no hyphens, no punctuation.

Core game logic:
- The final code is built only from useful code pieces.
- If an email says "Potential clue: X", then X MUST appear somewhere in the final answer.
- Never mark an unused value as a potential clue.
- Decoy emails are allowed, but their clueSummary must be "No useful code clue." and they must not contain code-like values that look important.
- The employee profile can support a useful clue, but it must not show a tempting unused code such as a badge suffix unless that exact value is part of the answer.

Use clear positional clues, not obvious full-code clues.
The player should collect pieces and placement rules from different emails.
Make the placement feel like workplace instructions, not abstract riddles.

Good clue style:
- "Potential clue: A" in clueSummary, while the email body says: "After the document review, add signature A at the end."
- "Potential clue: 5" in clueSummary, while the email body says: "The incident number goes in the middle slot."
- "Potential clue: DC" in clueSummary, while the email body says: "Department codes always start emergency override codes."
- "Potential clue: B7" in clueSummary, while the profile says it is a badge suffix and another email says suffixes close the code.

Bad clue style:
- "Shift Marker" without saying which letter/number it gives.
- "Could hint at a numerical position."
- "ADV-4-A" with separators in the answer.
- "Potential clue: X123" when the final answer is "ENG37B".

Every clue email must reveal one useful piece AND explain where that piece belongs:
- first/start/opening/prefix
- middle/second/after the prefix
- final/end/closing/signature/suffix
Do not split a piece and its placement rule into different clue emails.
For example, do not write only "department code goes first" in one email and reveal "DC" somewhere else.
Instead write: "The department code is DC. Department codes always start emergency override codes."
Every clue email body must contain at least one concrete code piece such as "DC", "7", "B7", or "A".
Use one of these patterns, or invent a similar one:
- project prefix + lab number + shift marker
- employee badge suffix + archive shelf + color keyword
- department code + incident number + approval initial
- server name fragment + floor number + backup window

The employee profile may contain one clue, but never the whole answer.
Write 5 to 6 emails. Include 3 clue emails, 1 suspicious misdirection or warning, and 1 harmless noise email.
Every clue email should reveal a different kind of evidence.
The "clues" array should summarize evidence pieces only, not the whole answer.
Each item in the "clues" array with label "Potential clue" must have a value that appears in the answer.
Keep the language concise and readable.
The inputPlaceholder must not contain an example code.
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

    console.log("AI email investigation generated:", parsed.title);

    return {
      ...parsed,
      kind: "email-investigation",
      inputPlaceholder: "Enter override code",
      generatedBy: "ai",
    };
  } catch (error) {
    console.error("Email investigation generation error:", error);
    return {
      ...createFallbackEmailInvestigationPuzzle(),
      generatedBy: "fallback",
    };
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

const corruptedCommandPhrases = [
  "open the vault",
  "trace the source",
  "reset main lock",
  "find safe code",
  "unlock red door",
  "light the core",
  "close the gate",
  "start main power",
];

const addSymbolsBetweenLetters = (word) => {
  const symbols = ["@@", "##", "!!", "%%", "^^", "**"];
  return word
    .toUpperCase()
    .split("")
    .map((letter, index) => `${letter}${index < word.length - 1 ? symbols[index % symbols.length] : ""}`)
    .join("");
};

const hideOneLetter = (word) => {
  const letters = word.toUpperCase().split("");
  const vowelIndex = letters.findIndex((letter) => "AEIOU".includes(letter));
  const hiddenIndex = vowelIndex >= 0 ? vowelIndex : Math.min(1, letters.length - 1);
  letters[hiddenIndex] = "_";
  return letters.join("");
};

const createCorruptedDocumentsFromCommand = ({ title, riddle, hint, explanation, answer }) => {
  const words = answer.trim().toLowerCase().split(/\s+/);
  const [firstWord, secondWord, thirdWord] = words;

  return {
    title,
    riddle,
    hint,
    explanation,
    kind: "corrupted-documents",
    documents: [
      {
        id: "doc-1",
        title: "Access_Directive.tmp",
        classification: "DAMAGED / 42%",
        puzzleType: "missing-letters",
        corruptedText: `TASK: Recover word 1.\nCORRUPTED LINE: The first command word is ${hideOneLetter(firstWord)}.\nNOTE: One letter is missing. Repair the word before moving on.`,
        clue: "Fill the missing letter to recover the first command word.",
        hiddenClue: firstWord.toUpperCase(),
        clueLabel: "Word 1",
        orderHint: "Word 1 starts the command.",
      },
      {
        id: "doc-2",
        title: "Middle_Key.redacted",
        classification: "CONFIDENTIAL / 35%",
        puzzleType: "hidden-word",
        corruptedText: `TASK: Recover word 2.\nCORRUPTED LINE: System note says repair ${secondWord.toUpperCase()} corrupted command before midnight.\nNOTE: Only one full uppercase word is useful.`,
        clue: "Find the complete uppercase word hidden in the sentence.",
        hiddenClue: secondWord.toUpperCase(),
        clueLabel: "Word 2",
        orderHint: "Word 2 is the middle word.",
      },
      {
        id: "doc-3",
        title: "Final_Target.glitch",
        classification: "RESTRICTED / 28%",
        puzzleType: "remove-symbols",
        corruptedText: `TASK: Recover word 3.\nCORRUPTED LINE: Final target reads ${addSymbolsBetweenLetters(thirdWord)}.\nNOTE: Symbols were injected between the real letters.`,
        clue: "Remove every symbol. Keep only the letters.",
        hiddenClue: thirdWord.toUpperCase(),
        clueLabel: "Word 3",
        orderHint: "Word 3 closes the command.",
      },
    ],
    answer,
    inputPlaceholder: "Enter recovered phrase",
  };
};

export const createCorruptedDocumentsPuzzle = async ({
  difficulty = "hard",
  theme = "corrupted document archive",
}) => {
  let lastError = null;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
    const parsed = await createStructuredSchemaResponse({
      instructions: `
Create the story wrapper for one corrupted-documents puzzle in an AI escape room.
Theme: ${theme}
Difficulty: ${difficulty}
Generation seed: ${Date.now()}-${Math.random().toString(16).slice(2)}
Attempt: ${attempt}

The backend will build the actual corrupted documents from your command phrase.
You only choose the command phrase and write short story text.

The final answer must be one clear three-word command phrase.
Choose exactly one command phrase from this list:
- OPEN THE VAULT
- TRACE THE SOURCE
- RESET MAIN LOCK
- FIND SAFE CODE
- UNLOCK RED DOOR
- LIGHT THE CORE
- CLOSE THE GATE
- START MAIN POWER

Rules:
- Return the answer in lowercase.
- Keep title, riddle, hint, and explanation short and player-friendly.
- Do not include document data. The backend creates the documents.
- The explanation should explain that the three repaired words form the command phrase.
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
          answer: { type: "string" },
        },
        required: ["title", "riddle", "hint", "explanation", "answer"],
      },
    });

    const puzzle = createCorruptedDocumentsFromCommand({
      ...parsed,
      answer: parsed.answer.trim().toLowerCase(),
    });

    validateCorruptedDocumentsPuzzle(puzzle);

    return puzzle;
  } catch (error) {
      lastError = error;
      console.error(`Corrupted documents generation attempt ${attempt} failed:`, error);
    }
  }

  console.error("Corrupted documents generation error:", lastError);
  return createFallbackCorruptedDocumentsPuzzle();
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
