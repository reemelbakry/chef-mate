import { createGroq } from "@ai-sdk/groq";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { type LanguageModel } from "ai";

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY,
});

const GOOGLE_MODELS = ["gemini-2.5-flash"];

/**
 * Retrieves the appropriate language model instance based on the model ID.
 * It defaults to the Groq provider for any model not explicitly listed as a Google model.
 *
 * @param modelId The ID of the model to retrieve.
 * @returns An instance of a LanguageModel.
 */
export function getModel(modelId: string): LanguageModel {
  if (GOOGLE_MODELS.includes(modelId)) {
    return google(modelId);
  }
  return groq(modelId);
} 