const SPOONACULAR_BASE_URL = "https://api.spoonacular.com";

//#region Interfaces
export interface RecipeSearchResult {
  id: number;
  title: string;
}

export interface RecipeDetails {
  title: string;
  extendedIngredients: { original: string }[];
  analyzedInstructions?: { steps: { step: string }[] }[];
  instructions?: string;
  servings: number;
}

export interface NutritionInfo {
  calories: string;
  protein: string;
  fat: string;
  carbs: string;
  caloricBreakdown: {
    percentProtein: number;
    percentFat: number;
    percentCarbs: number;
  };
  weightPerServing: {
    amount: number;
    unit: string;
  };
}
//#endregion

//#region Tool Call Functions
export async function fetchSpoonacular<T>(path: string, params: URLSearchParams = new URLSearchParams()): Promise<{ data: T | null; error: { message: string; details?: unknown } | null }> {
  const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY;
  if (!SPOONACULAR_API_KEY) {
    throw new Error("Missing Spoonacular API key. Please set SPOONACULAR_API_KEY in your environment variables.");
  }

  params.append("apiKey", SPOONACULAR_API_KEY);
  const url = `${SPOONACULAR_BASE_URL}${path}?${params.toString()}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      const errorData = await res.json();
      console.error(`Spoonacular API error at ${path}:`, errorData);
      return { data: null, error: { message: `Failed to fetch from ${path}.`, details: errorData } };
    }
    const data = await res.json();
    return { data, error: null };
  } catch (err) {
    console.error(`Network error in fetchSpoonacular at ${path}:`, err);
    return { data: null, error: { message: `Failed to connect to the Spoonacular service.`} };
  }
} 
//#endregion