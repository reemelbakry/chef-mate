import { z } from "zod";
import { tool } from "ai";

const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY;
const SPOONACULAR_BASE_URL = "https://api.spoonacular.com";

if (!SPOONACULAR_API_KEY) {
  throw new Error("Missing Spoonacular API key. Please set SPOONACULAR_API_KEY in your environment variables.");
}

const SUPPORTED_CUISINES = [
  "African", "Asian", "American", "British", "Cajun", "Caribbean", "Chinese", 
  "Eastern European", "European", "French", "German", "Greek", "Indian", 
  "Irish", "Italian", "Japanese", "Jewish", "Korean", "Latin American", 
  "Mediterranean", "Mexican", "Middle Eastern", "Nordic", "Southern", 
  "Spanish", "Thai", "Vietnamese"
] as const;

export const findRecipesTool = tool({
  description: "Finds recipe suggestions. Can filter by a list of ingredients the user has and/or by a specific cuisine type.",
  parameters: z.object({
    ingredients: z.array(z.string()).optional().describe("A list of ingredients that the user has available."),
    cuisine: z.enum(SUPPORTED_CUISINES).optional().describe("The cuisine to filter recipes by. If the user specifies a cuisine not in this list, you must inform them and ask to choose from the available options."),
    query: z.string().optional().describe("The (natural language) recipe search query.."),
  }),
  execute: async ({ ingredients, cuisine, query }) => {
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
    params.append("apiKey", SPOONACULAR_API_KEY);
    
    // Using complexSearch API as it supports both ingredients and cuisine
    const url = `${SPOONACULAR_BASE_URL}/recipes/complexSearch?${params.toString()}`;

    try {
      const res = await fetch(url);
      if (!res.ok) {
        const errorData = await res.json();
        console.error("Spoonacular API error in findRecipes:", errorData);
        return { error: "Failed to fetch recipes.", details: errorData };
      }
      const data = await res.json();
      // We only need the id and title for the user to select from.
      return data.results.map((recipe: any) => ({
        id: recipe.id,
        title: recipe.title,
      }));
    } catch (err) {
      console.error("Network error in findRecipes:", err);
      return { error: "Failed to connect to the recipe service." };
    }
  },
});

export const getRecipeDetailsTool = tool({
  description: "Gets detailed information for a specific recipe, including its full ingredient list and cooking instructions. Does not include nutrition facts.",
  parameters: z.object({
    recipeId: z.number(),
  }),
  execute: async ({ recipeId }) => {
    const params = new URLSearchParams();
    params.append("apiKey", SPOONACULAR_API_KEY);

    const url = `${SPOONACULAR_BASE_URL}/recipes/${recipeId}/information?${params.toString()}`;

    try {
        const res = await fetch(url);
        if (!res.ok) {
            const errorData = await res.json();
            console.error("Spoonacular API error in getRecipeDetails:", errorData);
            return { error: "Failed to fetch recipe details.", details: errorData };
        }
        const data = await res.json();
        
        return {
            title: data.title,
            ingredients: data.extendedIngredients.map((ing: any) => ing.original),
            instructions: data.instructions,
        };
    } catch (err) {
        console.error("Network error in getRecipeDetails:", err);
        return { error: "Failed to connect to the recipe service." };
    }
  },
});

export const getNutritionByIdTool = tool({
  description: "Gets detailed nutrition information for a specific recipe by its ID. This should be used when the user specifically asks for nutrition facts.",
  parameters: z.object({
    recipeId: z.number().describe("The ID of the recipe to get nutrition for."),
  }),
  execute: async ({ recipeId }) => {
    const params = new URLSearchParams();
    params.append("apiKey", SPOONACULAR_API_KEY);

    const url = `${SPOONACULAR_BASE_URL}/recipes/${recipeId}/nutritionWidget.json?${params.toString()}`;

    try {
      const res = await fetch(url);
      if (!res.ok) {
        const errorData = await res.json();
        console.error("Spoonacular API error in getNutritionById:", errorData);
        return { error: "Failed to fetch nutrition information.", details: errorData };
      }
      const data = await res.json();
      
      const keyNutrients = {
          calories: data.calories,
          protein: data.protein,
          fat: data.fat,
          carbs: data.carbs,
      };

      return keyNutrients;
    } catch (err) {
      console.error("Network error in getNutritionById:", err);
      return { error: "Failed to connect to the nutrition service." };
    }
  },
}); 