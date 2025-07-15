import { createGroq } from "@ai-sdk/groq";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText, type CoreMessage } from "ai";
import {
  findRecipesTool,
  getRecipeDetailsTool,
  getNutritionByIdTool,
} from "@/lib/tools";
import { systemPrompt } from "@/lib/prompts";

export const maxDuration = 30;

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY,
});

const GOOGLE_MODELS = ["gemini-2.5-flash"];

export async function POST(req: Request) {
  const {
    messages,
    data,
  }: { messages: CoreMessage[]; data: { model: string } } = await req.json();

  const { model: modelId } = data;

  const model = GOOGLE_MODELS.includes(modelId)
    ? google(modelId)
    : groq(modelId);

  const result = streamText({
    model,
    system: systemPrompt,
    messages,
    tools: {
      findRecipes: findRecipesTool,
      getRecipeDetails: getRecipeDetailsTool,
      getNutritionById: getNutritionByIdTool,
    },
    maxSteps: 10,
  });

  return result.toDataStreamResponse();
}