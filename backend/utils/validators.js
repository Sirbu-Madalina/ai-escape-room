// Checks that the riddle has all the fields the frontend needs.
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
