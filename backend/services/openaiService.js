import dotenv from "dotenv";
import OpenAI from "openai";
import { extractJsonText } from "../utils/jsonUtils.js";

dotenv.config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Calls OpenAI to generate a short riddle response.
export const createJsonResponse = async (instructions) => {
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

// Calls OpenAI with a strict JSON schema for more structured puzzles.
export const createStructuredSchemaResponse = async ({ instructions, schemaName, schema }) => {
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

// Tries again if the AI response is not valid the first time.
export const generateStructuredJson = async ({ instructions, validate, retries = 2 }) => {
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
