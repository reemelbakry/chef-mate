/*import { z } from "zod"
import { tool } from "ai"

const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY!

async function fetchSpoonacular(path: string, params: Record<string, string>) {
  const url = new URL(`https://api.spoonacular.com${path}`)

  const definedParams: Record<string, string> = {
    apiKey: SPOONACULAR_API_KEY,
  }
  for (const key in params) {
    if (Object.prototype.hasOwnProperty.call(params, key)) {
      if (params[key] !== "" && params[key] !== undefined) {
        definedParams[key] = params[key]
      }
    }
  }

  url.search = new URLSearchParams(definedParams).toString()

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Spoonacular API request failed: ${await response.text()}`)
  }
  return await response.json()
}

const searchRecipesSchema = z.object({
  cuisine: z
    .enum([
      "African",
      "Asian",
      "American",
      "British",
      "Cajun",
      "Caribbean",
      "Chinese",
      "Eastern European",
      "European",
      "French",
      "German",
      "Greek",
      "Indian",
      "Irish",
      "Italian",
      "Japanese",
      "Jewish",
      "Korean",
      "Latin American",
      "Mediterranean",
      "Mexican",
      "Middle Eastern",
      "Nordic",
      "Southern",
      "Spanish",
      "Thai",
      "Vietnamese",
    ])
    .optional()
    .describe("The cuisine of the recipes."),
  ingredients: z
    .string()
    .optional()
    .describe(
      "A comma-separated list of ingredients that should be included in the recipes, e.g. 'chicken,potatoes'."
    ),
})

export const searchRecipes = tool({
  description:
    "Suggests recipes based on ingredients and/or cuisine the user provides.",
  parameters: searchRecipesSchema,
  execute: async ({
    cuisine,
    ingredients,
  }: z.infer<typeof searchRecipesSchema>) => {
    console.log("Searching for recipes...")
    const results = await fetchSpoonacular("/recipes/complexSearch", {
      cuisine: cuisine ?? "",
      includeIngredients: ingredients ?? "",
      addRecipeInformation: "true",
      number: "5",
    })

    return {
      results: results.results.map((recipe: any) => ({
        //id: recipe.id,
        title: recipe.title,
        summary: recipe.summary,
      })),
    }
  },
})

const getRecipeInformationSchema = z.object({
  id: z.number().describe("The ID of the recipe."),
})

export const getRecipeInformation = tool({
  description: "Gets the recipe details for a given recipe ID.",
  parameters: getRecipeInformationSchema,
  execute: async ({ id }: z.infer<typeof getRecipeInformationSchema>) => {
    console.log(`Fetching details for recipe ${id}...`)
    const recipe = await fetchSpoonacular(`/recipes/${id}/information`, {
      includeNutrition: "false",
    })

    return {
      recipe: {
        title: recipe.title,
        ingredients: recipe.extendedIngredients.map(
          (ingredient: any) => ingredient.original
        ),
        instructions:
          recipe.analyzedInstructions?.[0]?.steps.map(
            (step: any) => step.step
          ) ?? [],
      },
    }
  },
})

const getRecipeNutritionSchema = z.object({
  id: z.number().describe("The ID of the recipe."),
})

export const getRecipeNutrition = tool({
  description: "Gets the nutrition facts for a specific recipe by its ID.",
  parameters: getRecipeNutritionSchema,
  execute: async ({ id }: z.infer<typeof getRecipeNutritionSchema>) => {
    console.log(`Fetching nutrition for recipe ${id}...`)
    const nutrition = await fetchSpoonacular(
      `/recipes/${id}/nutritionWidget.json`,
      {}
    )
    return {
      nutrition: {
        calories: nutrition.calories,
        protein: nutrition.protein,
        fat: nutrition.fat,
        carbs: nutrition.carbs,
      },
    }
  },
})*/

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