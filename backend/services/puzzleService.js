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

const riddleScenarios = [
  "a clumsy robot who keeps dropping the keys",
  "a time-traveling librarian stuck in the wrong century",
  "a haunted vending machine that dispenses riddles instead of snacks",
  "a very forgetful wizard who lost his spell book",
  "a space pirate who hid treasure in the wrong galaxy",
  "a detective cat who solves crimes by napping on clues",
  "a sentient toaster that became self-aware and now asks questions",
  "a confused scientist who mixed up the labels on everything",
  "a ghost that only speaks in bad puns",
  "a penguin working as a secret agent in the Arctic",
  "a dragon who is terrible at riddles but keeps trying",
  "a bakery where the bread is actually encrypted messages",
  "a submarine crew that communicates only through emoji",
  "a museum where all the exhibits escaped overnight",
  "a chef who accidentally cooked a forbidden recipe",
];

const difficultyGuide = {
  easy: "EASY means: the answer is almost obvious from the clue. A 10-year-old should solve it in under 30 seconds. No wordplay required — the answer is a common everyday word and the clue points directly at it.",
  medium: "MEDIUM means: the player needs to think for a moment but the answer is fair. One small twist or wordplay is allowed, but the answer should feel satisfying, not frustrating.",
  hard: "HARD means: the player must think laterally. A clever twist or double meaning is expected, but the answer must still be logically reachable — no guessing required.",
};

export const createRiddlePuzzle = async ({
  difficulty = "easy",
  theme = "cyber lab",
}) => {
  const scenario = riddleScenarios[Math.floor(Math.random() * riddleScenarios.length)];

  return generateStructuredJson({
    instructions: `
Create one short, funny escape-room riddle puzzle.
Setting: ${scenario}
Room theme: ${theme}
Difficulty: ${difficulty}
${difficultyGuide[difficulty] || difficultyGuide.easy}

Tone: Be playful and funny. Use the absurd setting to make the player smile. A light pun or silly twist is encouraged.
The riddle should feel like it belongs in this specific scenario — not a generic puzzle with the scenario bolted on.

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
- Keep the answer short (1–2 words max)
- The answer must be a common word
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
  "circus performer gear",
  "beach objects",
  "camping trip supplies",
  "bakery items",
  "pirate gear",
  "zoo animal features",
  "detective coat items",
  "sports equipment",
  "cozy cabin objects",
  "playground equipment",
  "wizard bag items",
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

const normalizeCrosswordWordSet = (wordSet) => ({
  ...wordSet,
  words: Array.isArray(wordSet?.words)
    ? wordSet.words.map((word) => ({
        ...word,
        answer: typeof word?.answer === "string"
          ? word.answer.trim().toLowerCase().replace(/[^a-z]/g, "")
          : word?.answer,
        clue: typeof word?.clue === "string"
          ? word.clue.trim().replace(/\s+/g, " ")
          : word?.clue,
      }))
    : wordSet?.words,
});

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
    const parsed = normalizeCrosswordWordSet(await createStructuredSchemaResponse({
      instructions: `
Create one beginner-friendly crossword word set for Room 1 of an AI escape room.
Main room theme: ${theme}
Puzzle mini-theme for this generation: ${selectedTheme}
Difficulty: ${difficulty}
${difficultyGuide[difficulty] || difficultyGuide.easy}
Generation seed: ${generationSeed}
Attempt: ${attempt}
Forbidden answers for this generation: ${forbiddenWords || "none"}

The frontend will place the words into a simple fixed crossword layout, so you only generate words and clues.
Tone: Be playful and a little funny. Write clues with personality — a light pun, a silly scenario, or an unexpected angle is welcome. Make the player smile when they figure it out.

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
- Clues can be playful or funny, but must still clearly lead to one answer.
- Answers must be lowercase letters only.
- No duplicate answers.
- Prefer concrete nouns or simple actions players can picture.
- Good clue style: "What a cat knocks off the table at 3am." -> cup.
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
    }));

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

const emailScenarios = [
  { company: "Galactic Snacks Inc.", context: "a space-age junk food company whose vending machine AI has gone rogue" },
  { company: "Haunted Realty LLC", context: "a real estate agency that accidentally listed a haunted house and is now covering it up" },
  { company: "Pets & Plots Detective Agency", context: "a detective agency run entirely by cats who are trying to look professional" },
  { company: "Dungeon Deliveries Co.", context: "a medieval delivery service that somehow survived into the modern era" },
  { company: "Atlantis Aquatics Ltd.", context: "an underwater research lab where something very unusual was discovered last Tuesday" },
  { company: "Robots R Us HR Dept", context: "an HR department staffed by robots who are terrible at pretending to be human" },
  { company: "Penguin Logistics AB", context: "a logistics company where all the employees are penguins trying to unionize" },
  { company: "Wizard's Tech Support", context: "a help desk that handles both software bugs and accidental curse activations" },
  { company: "Neon Bakery Labs", context: "a futuristic bakery that secretly doubles as a data encryption facility" },
  { company: "Moonbase Catering", context: "a catering company on a lunar base where someone ate the wrong labeled container" },
  { company: "Time Capsule Couriers", context: "a courier service that delivers packages through time and has mixed up some orders" },
  { company: "Professor Chaos Research Inc.", context: "a research lab where the lead scientist accidentally turned the printer into a portal" },
];

const emailCodeStyles = [
  "two-letter project tag + two-digit incident number + one final approval letter, such as QN42R",
  "one color initial + three-digit locker number + one shift marker, such as V318K",
  "three-letter device fragment + one floor digit + one checksum letter, such as ROV6M",
  "one approval letter + two-digit shelf number + two-letter archive tag, such as H27ZX",
  "two-letter department tag + one batch digit + two-letter courier mark, such as PX8LM",
  "one server letter + two-letter window code + two-digit ticket number, such as NQA73",
];

const overusedEmailCodePieces = [
  "dc",
  "d7",
  "7b",
  "b7",
  "gl",
  "ar",
  "nx",
  "au",
];

let recentEmailAnswers = [];

const rememberEmailAnswer = (answer) => {
  recentEmailAnswers = [...recentEmailAnswers, answer.toLowerCase()].slice(-12);
};

const hasRepeatedEmailCode = (answer) => {
  const normalizedAnswer = answer.toLowerCase();

  return recentEmailAnswers.includes(normalizedAnswer) ||
    overusedEmailCodePieces.some((piece) => normalizedAnswer.includes(piece));
};

const normalizeEmailPuzzle = (puzzle) => ({
  ...puzzle,
  answer: typeof puzzle?.answer === "string"
    ? puzzle.answer.trim().replace(/[^a-z0-9]/gi, "").toLowerCase()
    : puzzle?.answer,
});

export const createEmailInvestigationPuzzle = async ({
  difficulty = "medium",
  theme = "suspicious company inbox",
}) => {
  const scenario = emailScenarios[Math.floor(Math.random() * emailScenarios.length)];
  let lastError = null;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
    const codeStyle = emailCodeStyles[Math.floor(Math.random() * emailCodeStyles.length)];
    const parsed = normalizeEmailPuzzle(await createStructuredSchemaResponse({
      instructions: `
Create one email investigation puzzle for an AI escape room.
Company: ${scenario.company}
Scenario: ${scenario.context}
Base theme: ${theme}
Difficulty: ${difficulty}
${difficultyGuide[difficulty] || difficultyGuide.medium}
Generation seed: ${Date.now()}-${Math.random().toString(16).slice(2)}
Attempt: ${attempt}
Required code style for this generation: ${codeStyle}
Recently used final codes, do not repeat: ${recentEmailAnswers.join(", ") || "none"}

Tone: Be playful and funny. Lean into the absurd scenario. Employee names, email subjects, and company policies should feel like they belong in a comedy. The puzzle logic must still be fair and solvable, but it should make the player laugh while they work it out.

The player sees a suspicious company inbox with a search bar, opens emails, and discovers an override code.
The puzzle must be solvable by reading clues in the emails and employee profile.
Do not make the answer simply a birthday. The final code must require combining 3 or 4 separate clues.
Do not write the full answer in any email, clue summary, placeholder, title, or explanation until the final explanation.
The answer must be 4 to 7 characters using only letters and numbers. No spaces, no hyphens, no punctuation.
The answer must contain at least one letter and at least one number.
Do not use or include these tired code pieces: DC, D7, 7B, B7, GL, AR, NX, AU.
Do not use the same code pattern as the recently used final codes.

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
- "Potential clue: QN" in clueSummary, while the email body says: "The Quasar-Nova project tag QN starts this emergency code."
- "Potential clue: 42" in clueSummary, while the email body says: "Incident 42 is typed after the project tag."
- "Potential clue: R" in clueSummary, while the email body says: "Supervisor Rook signs temporary codes with R at the end."
- "Potential clue: V318" in clueSummary, while the body says: "Violet locker 318 is copied as V318 before the final marker."

Bad clue style:
- "Shift Marker" without saying which letter/number it gives.
- "Could hint at a numerical position."
- "ADV-4-A" with separators in the answer.
- "Potential clue: X123" when the final answer is "ENG37B".
- Any answer beginning with DC or ending with 7B.

Every clue email must reveal one useful piece AND explain where that piece belongs:
- first/start/opening/prefix
- middle/second/after the prefix
- final/end/closing/signature/suffix
Do not split a piece and its placement rule into different clue emails.
For example, do not write only "department code goes first" in one email and reveal "DC" somewhere else.
Instead write: "The project tag is QN. Project tags always start emergency override codes."
Every clue email body must contain at least one concrete code piece such as "QN", "42", "R", "V318", or "ZX".
Use one of these patterns, or invent a similar one:
- project tag + incident number + approval initial
- color initial + locker number + shift marker
- device fragment + floor digit + checksum letter
- approval initial + shelf number + archive tag
- server letter + backup-window code + ticket number

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
    }));

    validateEmailInvestigationPuzzle(parsed);

    if (hasRepeatedEmailCode(parsed.answer)) {
      throw new Error(`Email investigation repeated an overused code: ${parsed.answer}`);
    }

    rememberEmailAnswer(parsed.answer);

    console.log("AI email investigation generated:", parsed.title, parsed.answer);

    return {
      ...parsed,
      kind: "email-investigation",
      inputPlaceholder: "Enter override code",
      generatedBy: "ai",
    };
  } catch (error) {
      lastError = error;
      console.error(`Email investigation generation attempt ${attempt} failed:`, error);
    }
  }

  console.error("Email investigation generation error:", lastError);
  return {
    ...createFallbackEmailInvestigationPuzzle(),
    generatedBy: "fallback",
  };
};

const logicBoardScenarios = [
  "three malfunctioning robots, only one is telling the truth",
  "three vending machines, only one still has snacks",
  "three suspicious office interns, only one actually did their work",
  "three doors labeled by aliens who barely speak English",
  "three escaped lab experiments trying to look innocent",
  "three time travelers who all claim to be from the right era",
  "three pirate ships, only one has the real treasure map",
  "three haunted laptops, only one is safe to open",
  "three chefs who all claim they didn't burn the evidence",
  "three portals, only one leads somewhere useful",
  "three clones of the same scientist, only one remembers the password",
  "three cats at a crime scene, only one is the witness",
];

export const createLogicBoardPuzzle = async ({
  difficulty = "hard",
  theme = "neon grid",
}) => {
  const scenario = logicBoardScenarios[Math.floor(Math.random() * logicBoardScenarios.length)];

  try {
    const parsed = await createStructuredSchemaResponse({
      instructions: `
Create one logic-board puzzle for a cyber escape room.
Scenario: ${scenario}
Room theme: ${theme}
Difficulty: ${difficulty}
${difficultyGuide[difficulty] || difficultyGuide.hard}

Tone: Be playful and funny. The scenario should feel silly and fun, not dry. The 3 statements should have personality — they can reference the absurd scenario. But the logic must be airtight: after reading all 3 statements, only one option can be correct.

Make the puzzle solvable by logic alone — not guessing.
The player reads exactly 3 short statements and chooses the correct terminal (alpha, beta, or gamma).
Use plain, beginner-friendly language. No abstract jargon.
Each statement should eliminate at least one wrong option or confirm the right one.
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

const corruptedCommandWords = {
  actions: [
    "align", "archive", "bypass", "calibrate", "charge", "decode", "divert", "eject",
    "encrypt", "filter", "freeze", "ignite", "isolate", "launch", "locate", "mirror",
    "override", "purge", "reroute", "restore", "rotate", "seal", "stabilize", "summon",
    "sync", "translate", "unmask", "vent",
  ],
  middle: [
    "amber", "archive", "backup", "broken", "central", "cipher", "crimson", "delta",
    "eclipse", "frozen", "hidden", "inner", "lunar", "mirror", "neon", "north",
    "outer", "prime", "quiet", "rogue", "second", "silent", "solar", "static",
    "violet", "zero",
  ],
  targets: [
    "antenna", "beacon", "console", "engine", "filter", "gateway", "ledger", "lens",
    "magnet", "memory", "mirror", "orbit", "portal", "reactor", "receiver", "satellite",
    "scanner", "sequence", "signal", "stabilizer", "switch", "terminal", "transmitter",
    "turbine",
  ],
};

let recentCorruptedAnswers = [];

const rememberCorruptedAnswer = (answer) => {
  recentCorruptedAnswers = [...recentCorruptedAnswers, answer.toLowerCase()].slice(-10);
};

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

const reverseWord = (word) => word.toLowerCase().split("").reverse().join("");

const hideWordInCapitals = (word) => {
  const filler = ["damp", "late", "minor", "odd", "static", "thin", "weird"];

  return word
    .toUpperCase()
    .split("")
    .map((letter, index) => `${filler[index % filler.length]}${letter}`)
    .join(" ");
};

const documentPuzzleTypes = [
  {
    puzzleType: "missing-letters",
    buildToken: hideOneLetter,
    trace: "One character was erased from a critical token.",
    clue: "The damaged token still has its outline. Restore the missing character.",
  },
  {
    puzzleType: "hidden-word",
    buildToken: (word) => word.toUpperCase(),
    trace: "A complete uppercase token survived inside the noise.",
    clue: "One clean uppercase word does not belong to the sentence around it.",
  },
  {
    puzzleType: "reverse-word",
    buildToken: reverseWord,
    trace: "A token was written backwards during the archive crash.",
    clue: "The suspicious fragment reads correctly only from the other direction.",
  },
  {
    puzzleType: "remove-symbols",
    buildToken: addSymbolsBetweenLetters,
    trace: "Noise symbols were injected between the real letters.",
    clue: "Ignore the symbols and keep the letters in the order they appear.",
  },
  {
    puzzleType: "capital-letters",
    buildToken: hideWordInCapitals,
    trace: "The token leaked through a chain of capital letters.",
    clue: "The loud letters are carrying the useful message.",
  },
];

const pickDocumentPuzzleTypes = () => {
  const shuffled = [...documentPuzzleTypes];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled.slice(0, 3);
};

const applyTokenToStoryLine = (storyLine, token) => {
  if (storyLine.includes("{TOKEN}")) {
    return storyLine.replace("{TOKEN}", token);
  }

  return `${storyLine} ${token}`;
};

const cleanDocumentTitle = (title, fallbackTitle) => {
  const cleanedTitle = title?.replace(/\{TOKEN\}/g, "").replace(/\s+/g, " ").trim();
  return cleanedTitle || fallbackTitle;
};

const createCorruptedDocumentsFromCommand = ({ title, riddle, hint, explanation, answer, documents = [] }) => {
  const words = answer.trim().toLowerCase().split(/\s+/);
  const selectedPuzzleTypes = pickDocumentPuzzleTypes();
  const fallbackTitles = ["Access_Directive.tmp", "Middle_Key.redacted", "Final_Target.glitch"];
  const fallbackClassifications = ["DAMAGED / 42%", "CONFIDENTIAL / 35%", "RESTRICTED / 28%"];
  const fallbackStoryLines = [
    "Door control rejected token {TOKEN} during the night reset.",
    "Archive memo says reroute {TOKEN} through the broken checkpoint.",
    "Final target was logged as {TOKEN} after the archive surge.",
  ];
  const clueLabels = ["Fragment A", "Fragment B", "Fragment C"];
  const orderHints = [
    "Earliest timestamp in the incident chain.",
    "Routing fragment from the middle log.",
    "Final authorization fragment.",
  ];

  return {
    title,
    riddle,
    hint,
    explanation,
    kind: "corrupted-documents",
    documents: words.map((word, index) => {
      const document = documents[index] ?? {};
      const puzzleType = selectedPuzzleTypes[index];
      const token = puzzleType.buildToken(word);

      return {
        id: `doc-${index + 1}`,
        title: cleanDocumentTitle(document.title, fallbackTitles[index]),
        classification: document.classification || fallbackClassifications[index],
        puzzleType: puzzleType.puzzleType,
        corruptedText: `OBJECTIVE: Recover fragment ${String.fromCharCode(65 + index)} from the damaged record.\nCORRUPTED LINE: ${applyTokenToStoryLine(document.storyLine || fallbackStoryLines[index], token)}\nTRACE: ${puzzleType.trace}`,
        clue: puzzleType.clue,
        hiddenClue: word.toUpperCase(),
        clueLabel: clueLabels[index],
        orderHint: orderHints[index],
      };
    }),
    answer,
    inputPlaceholder: "Enter recovered phrase",
  };
};

const corruptedDocumentScenarios = [
  "a space station's disaster recovery log from a coffee-related incident",
  "a medieval wizard's guild that switched to computers last week",
  "a time-travel agency's incident report from a very confused Tuesday",
  "a robot uprising that was called off due to a scheduling conflict",
  "a haunted office building where the ghost keeps editing the files",
  "an AI escape room that accidentally locked itself in",
  "a pirate crew's attempt to digitize their treasure map archive",
  "a penguin research base whose lead scientist has gone rogue",
  "a bakery whose sourdough starter gained sentience and sent threatening emails",
  "a museum after all the exhibits decided to switch places overnight",
  "a secret spy agency that forgot to renew their secret-keeping subscription",
  "a quantum physics lab where someone sneezed during an experiment",
];

export const createCorruptedDocumentsPuzzle = async ({
  difficulty = "hard",
  theme = "corrupted document archive",
}) => {
  const scenario = corruptedDocumentScenarios[Math.floor(Math.random() * corruptedDocumentScenarios.length)];
  let lastError = null;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
    const parsed = await createStructuredSchemaResponse({
      instructions: `
Create the story wrapper for one corrupted-documents puzzle in an AI escape room.
Archive scenario: ${scenario}
Base theme: ${theme}
Difficulty: ${difficulty}
${difficultyGuide[difficulty] || difficultyGuide.hard}
Generation seed: ${Date.now()}-${Math.random().toString(16).slice(2)}
Attempt: ${attempt}
Recently used commands, do not repeat them: ${recentCorruptedAnswers.join(", ") || "none"}

Tone: Be playful and funny. The archive documents should feel like they belong in the scenario — include funny author names, absurd classification labels, and dramatic-but-silly log entries. The player should chuckle while they decode.

You choose a three-word command phrase and write short document flavor text.
The backend will corrupt the command words and keep the puzzle rules fair.

Build the answer from exactly one word from each list:
- First word/action: ${corruptedCommandWords.actions.join(", ")}
- Middle word: ${corruptedCommandWords.middle.join(", ")}
- Third word/target: ${corruptedCommandWords.targets.join(", ")}

Rules:
- Return the answer in lowercase.
- The answer must have exactly 3 words.
- Prefer unusual, specific combinations over generic lock words.
- Do not use tired targets like vault, door, code, or lock.
- Do not repeat a recently used command.
- Keep title, riddle, hint, and explanation short, atmospheric, and player-friendly.
- The hint should nudge players toward comparing the traces, not explain the solution order directly.
- The explanation should mention the recovered fragments without sounding like a tutorial.
- Create exactly 3 document story lines.
- Each document storyLine must include the literal placeholder {TOKEN} exactly once.
- Document titles must never include {TOKEN}.
- Do not reveal the solved word in title, storyLine, hint, riddle, or explanation.
- Make storyLine atmospheric and funny — like a damaged archive log written by someone who is stressed and slightly unhinged.
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
          documents: {
            type: "array",
            minItems: 3,
            maxItems: 3,
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                title: { type: "string" },
                classification: { type: "string" },
                storyLine: { type: "string" },
              },
              required: ["title", "classification", "storyLine"],
            },
          },
        },
        required: ["title", "riddle", "hint", "explanation", "answer", "documents"],
      },
    });

    const puzzle = createCorruptedDocumentsFromCommand({
      ...parsed,
      answer: parsed.answer.trim().toLowerCase(),
    });

    if (recentCorruptedAnswers.includes(puzzle.answer)) {
      throw new Error(`Corrupted documents repeated recent command: ${puzzle.answer}`);
    }

    validateCorruptedDocumentsPuzzle(puzzle);
    rememberCorruptedAnswer(puzzle.answer);

    console.log("AI corrupted documents generated:", puzzle.answer);

    return {
      ...puzzle,
      generatedBy: "ai",
    };
  } catch (error) {
      lastError = error;
      console.error(`Corrupted documents generation attempt ${attempt} failed:`, error);
    }
  }

  console.error("Corrupted documents generation error:", lastError);
  return {
    ...createFallbackCorruptedDocumentsPuzzle(),
    generatedBy: "fallback",
  };
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
