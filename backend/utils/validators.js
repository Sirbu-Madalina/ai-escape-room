// Ensures the frontend always receives all required fields in correct format
export const validateRiddlePuzzle = (value) => {
  const requiredKeys = ["title", "riddle", "answer", "hint", "explanation"];

  for (const key of requiredKeys) {
    if (typeof value?.[key] !== "string" || value[key].trim() === "") {
      throw new Error(`Invalid riddle payload: missing ${key}`);
    }
  }
};

export const validateCrosswordPuzzle = (value) => {
  const requiredTextKeys = ["title", "riddle", "hint", "explanation", "answer"];

  for (const key of requiredTextKeys) {
    if (typeof value?.[key] !== "string" || value[key].trim() === "") {
      throw new Error(`Invalid crossword payload: missing ${key}`);
    }
  }

  if (!Array.isArray(value.entries) || value.entries.length !== 5) {
    throw new Error("Invalid crossword payload: entries must have length 5");
  }

  const hasValidEntries = value.entries.every((entry) =>
    typeof entry?.id === "string" &&
    Number.isInteger(entry?.number) &&
    ["across", "down"].includes(entry?.direction) &&
    typeof entry?.clue === "string" &&
    /^[a-z]{1,6}$/i.test(entry?.answer ?? "") &&
    Number.isInteger(entry?.row) &&
    Number.isInteger(entry?.col) &&
    Array.isArray(entry?.prefilledIndexes) &&
    entry.prefilledIndexes.every((index) => Number.isInteger(index) && index >= 0 && index < entry.answer.length)
  );

  if (!hasValidEntries) {
    throw new Error("Invalid crossword payload: malformed entry");
  }

  const vagueClueWords = [
    "might",
    "maybe",
    "yummy",
    "nice",
    "thing",
    "stuff",
    "something",
    "anything",
  ];

  const hasVagueClues = value.entries.some((entry) => {
    const clue = entry.clue.toLowerCase();
    return vagueClueWords.some((word) => clue.includes(word));
  });

  if (hasVagueClues) {
    throw new Error("Invalid crossword payload: clue is too vague");
  }

  const cellLetters = new Map();

  value.entries.forEach((entry) => {
    entry.answer.toLowerCase().split("").forEach((letter, index) => {
      const row = entry.direction === "down" ? entry.row + index : entry.row;
      const col = entry.direction === "across" ? entry.col + index : entry.col;
      const key = `${row}-${col}`;
      const existingLetter = cellLetters.get(key);

      if (existingLetter && existingLetter !== letter) {
        throw new Error("Invalid crossword payload: overlapping letters do not match");
      }

      cellLetters.set(key, letter);
    });
  });
};

export const validateCrosswordWordSet = (value) => {
  if (!Array.isArray(value?.words) || value.words.length !== 5) {
    throw new Error("Invalid crossword word set: words must have length 5");
  }

  const vagueClueWords = [
    "might",
    "maybe",
    "yummy",
    "nice",
    "thing",
    "stuff",
    "something",
    "anything",
  ];

  const getInvalidWordReason = (item, index) => {
    if (
      typeof item?.answer !== "string" ||
      typeof item?.clue !== "string"
    ) {
      return `word ${index + 1} is missing answer or clue`;
    }

    if (!/^[a-z]{2,6}$/i.test(item.answer)) {
      return `word ${index + 1} has invalid answer "${item.answer}"`;
    }

    const clue = item.clue.toLowerCase();
    const vagueWord = vagueClueWords.find((word) =>
      new RegExp(`\\b${word}\\b`, "i").test(clue)
    );

    if (vagueWord) {
      return `word ${index + 1} has vague clue word "${vagueWord}"`;
    }

    return null;
  };

  const invalidReason = value.words
    .map((item, index) => getInvalidWordReason(item, index))
    .find(Boolean);

  if (invalidReason) {
    throw new Error(`Invalid crossword word set: ${invalidReason}`);
  }
};

// Checks that the logic puzzle has the correct structure.
export const validateLogicBoardPuzzle = (value) => {
  // Required text fields for the puzzle
  const requiredTextKeys = ["title", "riddle", "hint", "explanation", "answer"];

  // Validate basic text fields (same logic as riddle validation)
  for (const key of requiredTextKeys) {
    if (typeof value?.[key] !== "string" || value[key].trim() === "") {
      throw new Error(`Invalid logic board payload: missing ${key}`);
    }
  }
  // Validate "statements" array, Must exist, be an array, and contain exactly 3 items
  if (!Array.isArray(value.statements) || value.statements.length !== 3) {
    throw new Error("Invalid logic board payload: statements must have length 3");
  }

  // Ensure each statement is a non-empty string
  if (!value.statements.every((statement) => typeof statement === "string" && statement.trim() !== "")) {
    throw new Error("Invalid logic board payload: statements must be strings");
  }

  // Validate "options" array (possible answers)
  if (!Array.isArray(value.options) || value.options.length !== 3) {
    throw new Error("Invalid logic board payload: options must have length 3");
  }

  // Validate structure of each option object (must have id, label, and description)
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

  // Ensure that the answer actually exists in the options
  if (!value.options.some((option) => option.id === value.answer)) {
    throw new Error("Invalid logic board payload: answer does not match any option");
  }
};

export const validateEmailInvestigationPuzzle = (value) => {
  const requiredTextKeys = ["title", "riddle", "hint", "explanation", "answer"];

  for (const key of requiredTextKeys) {
    if (typeof value?.[key] !== "string" || value[key].trim() === "") {
      throw new Error(`Invalid email investigation payload: missing ${key}`);
    }
  }

  if (!/^[a-z0-9]{4,7}$/i.test(value.answer.trim())) {
    throw new Error("Invalid email investigation payload: answer must be 4 to 7 letters/numbers");
  }

  const normalizedAnswer = value.answer.trim().toLowerCase();
  const hasLetter = /[a-z]/i.test(normalizedAnswer);
  const hasNumber = /\d/.test(normalizedAnswer);

  if (!hasLetter || !hasNumber) {
    throw new Error("Invalid email investigation payload: answer must mix letters and numbers");
  }

  const overusedCodePieces = ["dc", "d7", "7b", "b7", "gl", "ar", "nx", "au"];
  const repeatedPiece = overusedCodePieces.find((piece) => normalizedAnswer.includes(piece));

  if (repeatedPiece) {
    throw new Error(`Invalid email investigation payload: answer uses overused code piece ${repeatedPiece}`);
  }

  const looksLikeCodePiece = (text) => /^[a-z0-9]{1,4}$/i.test(text.trim());
  const normalizePiece = (text) => text.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  const potentialCluePattern = /potential clue:\s*([a-z0-9]+)/i;

  const profile = value.employeeProfile;
  if (
    typeof profile?.name !== "string" ||
    typeof profile?.role !== "string" ||
    typeof profile?.detailLabel !== "string" ||
    typeof profile?.detailValue !== "string" ||
    typeof profile?.notes !== "string"
  ) {
    throw new Error("Invalid email investigation payload: malformed employee profile");
  }

  if (!Array.isArray(value.clues) || value.clues.length !== 4) {
    throw new Error("Invalid email investigation payload: clues must contain 4 items");
  }

  const hasValidClues = value.clues.every((clue) =>
    typeof clue?.label === "string" &&
    typeof clue?.value === "string" &&
    typeof clue?.discovered === "boolean"
  );

  if (!hasValidClues) {
    throw new Error("Invalid email investigation payload: malformed clue");
  }

  const allPotentialCluesAreUsed = value.clues.every((clue) => {
    if (clue.label.toLowerCase() !== "potential clue") {
      return true;
    }

    const piece = normalizePiece(clue.value);
    return piece !== "" && normalizedAnswer.includes(piece);
  });

  if (!allPotentialCluesAreUsed) {
    throw new Error("Invalid email investigation payload: potential clue is not used in answer");
  }

  if (!Array.isArray(value.emails) || value.emails.length < 5 || value.emails.length > 6) {
    throw new Error("Invalid email investigation payload: emails must contain 5 to 6 items");
  }

  const hasValidEmails = value.emails.every((email) =>
    typeof email?.id === "string" &&
    typeof email?.from === "string" &&
    typeof email?.to === "string" &&
    typeof email?.subject === "string" &&
    typeof email?.preview === "string" &&
    typeof email?.body === "string" &&
    typeof email?.time === "string" &&
    ["normal", "clue", "danger"].includes(email?.priority) &&
    typeof email?.clueSummary === "string" &&
    typeof email?.attachmentName === "string" &&
    Array.isArray(email?.tags) &&
    email.tags.every((tag) => typeof tag === "string")
  );

  if (!hasValidEmails) {
    throw new Error("Invalid email investigation payload: malformed email");
  }

  const emailPotentialCluesAreUsed = value.emails.every((email) => {
    const match = email.clueSummary.match(potentialCluePattern);

    if (!match) {
      return true;
    }

    const piece = normalizePiece(match[1]);
    return looksLikeCodePiece(piece) && normalizedAnswer.includes(piece);
  });

  if (!emailPotentialCluesAreUsed) {
    throw new Error("Invalid email investigation payload: email potential clue is not used in answer");
  }
};

export const validateCorruptedDocumentsPuzzle = (value) => {
  const requiredTextKeys = ["title", "riddle", "hint", "explanation", "answer"];

  for (const key of requiredTextKeys) {
    if (typeof value?.[key] !== "string" || value[key].trim() === "") {
      throw new Error(`Invalid corrupted documents payload: missing ${key}`);
    }
  }

  if (!Array.isArray(value.documents) || value.documents.length !== 3) {
    throw new Error("Invalid corrupted documents payload: documents must have length 3");
  }

  const allowedCommandWords = {
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

  const abstractWords = [
    "consequent",
    "erroneous",
    "transact",
    "integrity",
    "protocol",
    "information",
  ];

  const stripToLetters = (text) => text.replace(/[^a-z]/gi, "").toLowerCase();
  const getCapitalLetters = (text) => (text.match(/[A-Z]/g) ?? []).join("").toLowerCase();

  const documentMatchesPuzzleType = (document) => {
    const corruptedText = document.corruptedText;
    const hiddenClue = document.hiddenClue.trim().toLowerCase();

    if (!corruptedText.includes("OBJECTIVE:") || !corruptedText.includes("CORRUPTED LINE:")) {
      return false;
    }

    if (document.puzzleType === "missing-letters") {
      return corruptedText.includes("_");
    }

    if (document.puzzleType === "hidden-word") {
      return corruptedText.includes(document.hiddenClue.trim().toUpperCase());
    }

    if (document.puzzleType === "reverse-word") {
      return corruptedText.toLowerCase().includes(hiddenClue.split("").reverse().join(""));
    }

    if (document.puzzleType === "remove-symbols") {
      return stripToLetters(corruptedText).includes(hiddenClue);
    }

    if (document.puzzleType === "capital-letters") {
      return getCapitalLetters(corruptedText).includes(hiddenClue);
    }

    return false;
  };

  value.documents.forEach((document, index) => {
    const documentNumber = index + 1;

    if (
      typeof document?.id !== "string" ||
      typeof document?.title !== "string" ||
      typeof document?.classification !== "string" ||
      !["missing-letters", "hidden-word", "reverse-word", "remove-symbols", "capital-letters"].includes(document?.puzzleType) ||
      typeof document?.corruptedText !== "string" ||
      typeof document?.clue !== "string" ||
      typeof document?.hiddenClue !== "string" ||
      typeof document?.clueLabel !== "string" ||
      typeof document?.orderHint !== "string"
    ) {
      throw new Error(`Invalid corrupted documents payload: malformed document ${documentNumber}`);
    }

    if (
      document.id.trim() === "" ||
      document.title.trim() === "" ||
      document.corruptedText.trim() === "" ||
      document.clue.trim() === "" ||
      document.orderHint.trim() === ""
    ) {
      throw new Error(`Invalid corrupted documents payload: empty document ${documentNumber}`);
    }

    if (!/^[a-z]{2,11}$/i.test(document.hiddenClue.trim())) {
      throw new Error(`Invalid corrupted documents payload: unclear recovered word in document ${documentNumber}`);
    }

    if (abstractWords.includes(document.hiddenClue.trim().toLowerCase())) {
      throw new Error(`Invalid corrupted documents payload: abstract recovered word in document ${documentNumber}`);
    }

    if (!documentMatchesPuzzleType(document)) {
      throw new Error(`Invalid corrupted documents payload: ${document.puzzleType} task does not match document ${documentNumber}`);
    }
  });

  const normalizedAnswerWords = value.answer
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  const normalizedFragments = value.documents.map((document) => document.hiddenClue.trim().toLowerCase());
  const normalizedAnswer = normalizedAnswerWords.join(" ");

  if (
    normalizedAnswerWords.length !== 3 ||
    !allowedCommandWords.actions.includes(normalizedAnswerWords[0]) ||
    !allowedCommandWords.middle.includes(normalizedAnswerWords[1]) ||
    !allowedCommandWords.targets.includes(normalizedAnswerWords[2])
  ) {
    throw new Error("Invalid corrupted documents payload: answer must be a clear command phrase");
  }

  if (
    normalizedAnswerWords.length !== normalizedFragments.length ||
    !normalizedFragments.every((fragment, index) => normalizedAnswerWords[index] === fragment)
  ) {
    throw new Error("Invalid corrupted documents payload: answer must match document fragments in order");
  }
};
