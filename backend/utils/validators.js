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
