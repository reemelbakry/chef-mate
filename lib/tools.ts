import { z } from "zod";
import { tool } from "ai";
import { fetchSpoonacular, RecipeSearchResult, RecipeDetails, NutritionInfo } from "./spoonacular";

const SUPPORTED_CUISINES = [
  "African", "Asian", "American", "British", "Cajun", "Caribbean", "Chinese", 
  "Eastern European", "European", "French", "German", "Greek", "Indian", 
  "Irish", "Italian", "Japanese", "Jewish", "Korean", "Latin American", 
  "Mediterranean", "Mexican", "Middle Eastern", "Nordic", "Southern", 
  "Spanish", "Thai", "Vietnamese"
] as const;

const SUPPORTED_MEAL_TYPES = [
  "main course", "side dish", "dessert", "appetizer", "salad", "bread", "breakfast", "soup", "beverage", "sauce", "marinade", "fingerfood", "snack", "drink"
] as const;

export const findRecipesTool = tool({
  description: "Finds recipe suggestions. Can filter by a list of ingredients the user has and/or by a specific cuisine type.",
  parameters: z.object({
    ingredients: z.array(z.string()).optional().describe("A list of ingredients that the user has available."),
    cuisine: z.enum(SUPPORTED_CUISINES).optional().describe("The cuisine to filter recipes by. If the user specifies a cuisine not in this list, you must inform them and ask to choose from the available options."),
    query: z.string().optional().describe("The (natural language) recipe search query.."),
    type: z.enum(SUPPORTED_MEAL_TYPES).optional().describe("The type of meal to filter recipes by."),
  }),
  execute: async ({ ingredients, cuisine, query, type }) => {
    const params = new URLSearchParams();
    if (ingredients && ingredients.length > 0) {
        params.append("includeIngredients", ingredients.join(","));
    }
    if (cuisine) {
        params.append("cuisine", cuisine);
    }
    if (query) {
        params.append("query", query);
    }
    if (type) {
        params.append("type", type);
    }
    const { data, error } = await fetchSpoonacular<{results: RecipeSearchResult[]}>("/recipes/complexSearch", params);

    if (error || !data) {
      return { error: "Failed to fetch recipes." };
    }
    
    return data.results.map((recipe) => ({
      id: recipe.id,
      title: recipe.title,
    }));
  },
});

export const getRecipeDetailsTool = tool({
  description: "Gets detailed information for a specific recipe, including its full ingredient list and cooking instructions. Does not include nutrition facts.",
  parameters: z.object({
    recipeId: z.number(),
  }),
  execute: async ({ recipeId }) => {
    const { data, error } = await fetchSpoonacular<RecipeDetails>(`/recipes/${recipeId}/information`);
    
    if (error || !data) {
      return { error: "Failed to fetch recipe details." };
    }
    
    return {
        title: data.title,
        ingredients: data.extendedIngredients.map((ing) => ing.original),
        instructions: data.analyzedInstructions?.[0]?.steps.map((step) => step.step) ?? data.instructions ?? "No instructions available.",
        servings: data.servings,
    };
  },
});

export const getNutritionByIdTool = tool({
  description: "Gets detailed nutrition information for a specific recipe by its ID. This should be used when the user specifically asks for nutrition facts.",
  parameters: z.object({
    recipeId: z.number().describe("The ID of the recipe to get nutrition for."),
  }),
  execute: async ({ recipeId }) => {
    const { data, error } = await fetchSpoonacular<NutritionInfo>(`/recipes/${recipeId}/nutritionWidget.json`);

    if (error || !data) {
      return { error: "Failed to fetch nutrition information." };
    }
    
    return {
      calories: data.calories,
      protein: data.protein,
      fat: data.fat,
      carbs: data.carbs,
      caloricBreakdown: data.caloricBreakdown,
      weightPerServing: data.weightPerServing,
    };
  },
}); 