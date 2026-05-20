// Ensures the frontend always receives all required fields in correct format
export const validateRiddlePuzzle = (value) => {
  const requiredKeys = ["title", "riddle", "answer", "hint", "explanation"];

  for (const key of requiredKeys) {
    if (typeof value?.[key] !== "string" || value[key].trim() === "") {
      throw new Error(`Invalid riddle payload: missing ${key}`);
    }
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
};
