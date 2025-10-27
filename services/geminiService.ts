
import { GoogleGenAI, Type } from "@google/genai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  // In a real app, you would handle this more gracefully.
  // For this context, we assume the API key is provided via environment variables.
  console.warn("Gemini API key not found. AI features will be disabled.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

export const generateEventDescription = async (title: string): Promise<string> => {
  if (!API_KEY) {
    return "AI description generation is currently unavailable.";
  }
  
  try {
    const prompt = `Write a short, inspiring, and engaging description for an environmental cleanup event titled "${title}". Focus on community, positive impact, and call to action. Do not use markdown.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    return response.text || "Failed to generate AI description. Please write one manually.";
  } catch (error) {
    console.error("Error generating description with Gemini:", error);
    return "Failed to generate AI description. Please write one manually.";
  }
};

export const suggestEquipment = async (title: string, description: string): Promise<string[]> => {
  if (!API_KEY) {
    return [];
  }
  try {
    const prompt = `Based on the title and description for an environmental cleanup event, suggest a list of 5 to 7 essential items participants should consider bringing.
    Event Title: "${title}"
    Event Description: "${description}"
    Return a JSON object with a single key "items" which is an array of strings. The array should only contain the names of the items. For example: {"items": ["Work gloves", "Trash bags", "Sunscreen"]}.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            items: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });
    
    const jsonString = response.text?.trim() || "[]";
    const result = JSON.parse(jsonString);
    return result.items || [];
  } catch (error) {
    console.error("Error generating equipment suggestions with Gemini:", error);
    return [];
  }
};
