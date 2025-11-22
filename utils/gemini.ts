
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Post } from '../types';

// This is a placeholder check. In a real environment, the API key would be
// securely managed and loaded, and this check might not be necessary.
if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * A utility to retry an async function with exponential backoff.
 */
export const withRetry = async <T>(apiCall: () => Promise<T>, maxRetries = 3, initialDelay = 1000): Promise<T> => {
    let lastError: any;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await apiCall();
        } catch (error: any) {
            lastError = error;
            const isRetryable =
                (error.status && (error.status === 429 || error.status >= 500)) ||
                (error.message && (
                    error.message.toLowerCase().includes('rate limit') ||
                    error.message.toLowerCase().includes('server error') ||
                    error.message.toLowerCase().includes('failed to fetch')
                ));

            if (isRetryable && attempt < maxRetries) {
                const delay = initialDelay * Math.pow(2, attempt - 1);
                console.warn(`Retryable error detected. Retrying in ${delay}ms... (Attempt ${attempt}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                throw lastError;
            }
        }
    }
    throw lastError;
};


/**
 * Handles API errors by creating user-friendly error messages.
 */
export const handleApiError = (error: unknown, context: string): Error => {
    console.error(`Error during ${context}:`, error);

    if (!navigator.onLine) {
        return new Error("Network error. Please check your internet connection and try again.");
    }

    if (error && typeof error === 'object') {
        if ('status' in error) {
            const status = error.status as number;
            if (status === 429) {
                return new Error(`We're experiencing high traffic. Please try again in a few moments.`);
            }
            if (status >= 500) {
                return new Error(`The service is currently unavailable. Please try again later.`);
            }
            if (status === 400) {
                 return new Error(`There was an issue with the request. If this persists, please contact support.`);
            }
        }
        if ('message' in error && typeof error.message === 'string') {
            const message = error.message.toLowerCase();
            if (message.includes('rate limit')) {
                return new Error(`You've made too many requests. Please wait a moment before trying again.`);
            }
            if (message.includes('api key')) {
                return new Error(`There is an issue with the API configuration. Please contact support.`);
            }
            if (message.includes('failed to fetch')) {
                 return new Error("Could not connect to the service. Please check your network connection.");
            }
        }
    }
    return new Error(`An unexpected error occurred while ${context}. Please try again.`);
};

/**
 * Generic helper to generate structured JSON content from Gemini.
 */
async function generateJsonContent<T>(
    prompt: string, 
    schema: any, 
    errorContext: string,
    temperature: number = 0.5
): Promise<T | null> {
    try {
        const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
                temperature: temperature,
            },
        }));

        const jsonText = response.text?.trim();
        if (!jsonText) {
            return null;
        }
        return JSON.parse(jsonText) as T;
    } catch (error) {
        throw handleApiError(error, errorContext);
    }
}

export const performAiSearch = async (query: string, posts: Post[]): Promise<Array<{id: string, reasoning: string}>> => {
  const simplifiedPosts = posts.map(p => ({
    id: p.id,
    title: p.title,
    description: p.description,
    type: p.type,
    category: p.category,
    price: p.price,
    location: p.location,
    tags: p.tags,
  }));

  const prompt = `
    You are an intelligent search assistant for an online marketplace app called "Locale".
    Analyze the account's search query and the provided list of posts.
    The account's query is: "${query}"

    Here is the list of available posts in JSON format:
    ${JSON.stringify(simplifiedPosts)}

    Your task is to return a JSON array of objects for posts that are the most relevant to the account's query.
    Consider the semantic meaning.
    The returned list should be sorted from most relevant to least relevant.
    Each object must contain the post "id" and a "reasoning" field (3-7 words explaining relevance).
    If no posts are relevant, return an empty array.
  `;

  const schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING, description: "The unique ID of a relevant post." },
        reasoning: { type: Type.STRING, description: "A very short phrase explaining why the post is relevant." }
      },
      required: ["id", "reasoning"],
    },
  };

  const result = await generateJsonContent<Array<{id: string, reasoning: string}>>(
      prompt, schema, "AI search", 0.1
  );
  
  return result || [];
};

export const generateSearchSuggestions = async (query: string): Promise<string[]> => {
  if (query.trim().length < 2) return [];

  const prompt = `
    You are a search suggestion assistant for a hyperlocal marketplace app called "Locale".
    Based on the user's current search query, generate 5 relevant and concise search query suggestions.
    User's current query: "${query}"
    Return a JSON array of strings.
  `;
  
  const schema = {
    type: Type.ARRAY,
    items: { type: Type.STRING, description: "A relevant search query suggestion." }
  };

  try {
      const result = await generateJsonContent<string[]>(prompt, schema, "AI suggestion generation", 0.7);
      return result || [];
  } catch (error) {
      console.error((error as Error).message);
      return [];
  }
};


export const suggestTagsForPost = async (title: string, description: string): Promise<string[]> => {
  const prompt = `
    You are an expert in categorizing items on a marketplace called 'Locale'.
    Based on the title and description below, suggest 5 to 7 relevant, concise (1-2 words), lowercase tags.
    Title: "${title}"
    Description: "${description}"
    Return a JSON array of strings.
  `;

  const schema = {
    type: Type.ARRAY,
    items: { type: Type.STRING, description: "A relevant, lowercase tag." },
  };

  const result = await generateJsonContent<string[]>(prompt, schema, "AI tag suggestion", 0.4);
  return result || [];
};

export const suggestCategoriesForPost = async (title: string, description: string, existingCategories: string[]): Promise<string[]> => {
  const prompt = `
    You are an expert in categorizing items on a marketplace.
    Based on the title and description, suggest up to 3 relevant categories.
    Prefer existing categories: ${JSON.stringify(existingCategories)}.
    If none fit, suggest broad new ones.
    Title: "${title}"
    Description: "${description}"
    Return a JSON array of strings, most relevant first.
  `;

  const schema = {
    type: Type.ARRAY,
    items: { type: Type.STRING, description: "A relevant category." },
  };

  const result = await generateJsonContent<string[]>(prompt, schema, "AI category suggestion", 0.3);
  return result || [];
};
