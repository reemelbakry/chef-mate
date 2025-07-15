import { streamText, type CoreMessage } from "ai";
import {
  findRecipesTool,
  getRecipeDetailsTool,
  getNutritionByIdTool,
} from "@/lib/tools";
import { systemPrompt } from "@/lib/prompts";
import { getModel } from "@/lib/models";

export const maxDuration = 30;

export async function POST(req: Request) {
  const {
    messages,
    data,
  }: { messages: CoreMessage[]; data: { model: string } } = await req.json();

  const model = getModel(data.model);

  const result = streamText({
    model,
    system: systemPrompt,
    messages,
    tools: {
      findRecipes: findRecipesTool,
      getRecipeDetails: getRecipeDetailsTool,
      getNutritionFacts: getNutritionByIdTool,
    },
    maxSteps: 10,
  });

  return result.toDataStreamResponse();
}