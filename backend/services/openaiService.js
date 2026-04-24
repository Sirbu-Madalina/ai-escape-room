import dotenv from "dotenv";
import OpenAI from "openai";
import { extractJsonText } from "../utils/jsonUtils.js";

dotenv.config();

// Create OpenAI client using API key from environment variables
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Calls OpenAI to generate a short riddle response.
export const createJsonResponse = async (instructions) => {

  // Send request to OpenAI with given instructions
  const response = await client.responses.create({
    model: "gpt-5-nano",
    reasoning: {
      effort: "minimal",
    },
    max_output_tokens: 260,
    input: instructions,
  });

  // Extract only the JSON text
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
  // Parse JSON string into JavaScript object
  return JSON.parse(response.output_text);
};

// Converts raw JSON string into a JavaScript object
const parseGeneratedJson = (rawText) => {
  return JSON.parse(rawText);
};

// Tries again if the AI response is not valid the first time.
export const generateStructuredJson = async ({ instructions, validate, retries = 2 }) => {
  let lastError = null;

 // Try multiple times in case AI returns invalid JSON
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      // Step 1: Call OpenAI to generate response
      const rawText = await createJsonResponse(instructions);
      // Step 2: Parse response into JSON object
      const parsed = parseGeneratedJson(rawText);
  
      // Ensures required fields exist (title, riddle, answer, etc.)
      validate(parsed);

      return parsed;
    } catch (error) {
      lastError = error;
    }
  }

  // If all attempts fail, throw the last error
  throw lastError;
};
