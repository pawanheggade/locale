


import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Post } from '../types';
import { handleApiError, withRetry } from './api';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generic helper to generate structured JSON content from Gemini.
 */
async function generateJsonContent<T>(
    prompt: string, 
    schema: any, 
    errorContext: string,
    model: string,
    temperature: number = 0.5
): Promise<T | null> {
    try {
        const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
            model: model,
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
      prompt, schema, "AI search", "gemini-3-pro-preview", 0.1
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

  // We propagate the error here so the UI can decide whether to show a toast or fail silently.
  const result = await generateJsonContent<string[]>(prompt, schema, "generating search suggestions", "gemini-2.5-flash", 0.7);
  return result || [];
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

  const result = await generateJsonContent<string[]>(prompt, schema, "AI tag suggestion", "gemini-2.5-flash", 0.4);
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

  const result = await generateJsonContent<string[]>(prompt, schema, "AI category suggestion", "gemini-2.5-flash", 0.3);
  return result || [];
};