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

export function getModel(modelId: string): LanguageModel {
  if (GOOGLE_MODELS.includes(modelId)) {
    return google(modelId);
  }
  return groq(modelId);
} 