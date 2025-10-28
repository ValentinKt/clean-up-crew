
import { GoogleGenAI, Type } from "@google/genai";
import { logger } from '../utils/logger';
import { errorHandler, ErrorType } from '../utils/errorHandler';
import { performanceMonitor } from '../utils/performance';

/**
 * Enhanced Gemini AI service with comprehensive logging, error handling, and performance monitoring
 */

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Custom error class for service errors
class ServiceError extends Error {
  public type: ErrorType;
  
  constructor(message: string, type: ErrorType = ErrorType.UNKNOWN) {
    super(message);
    this.type = type;
    this.name = 'ServiceError';
  }
}

if (!API_KEY) {
  logger.warn('Gemini API key not found - AI features will be disabled', {
    service: 'gemini',
    feature: 'initialization'
  });
}

const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

/**
 * Generate event description using Gemini AI
 */
export const generateEventDescription = async (title: string): Promise<string> => {
  logger.info('Generating event description with AI', {
    service: 'gemini',
    action: 'generate_description',
    titleLength: title?.length || 0
  });

  // Validate input
  if (!title?.trim()) {
    const error = new ServiceError('Event title is required for description generation', ErrorType.VALIDATION);
    throw errorHandler.handleError(error, 'generate_description');
  }

  if (!API_KEY || !ai) {
    logger.warn('AI description generation unavailable - API key missing', {
      service: 'gemini',
      action: 'generate_description',
      title: title.substring(0, 50)
    });
    return "AI description generation is currently unavailable.";
  }

  const timer = performanceMonitor.startTimer('gemini_generate_description');

  try {
    const prompt = `Write a short, inspiring, and engaging description for an environmental cleanup event titled "${title}". Focus on community, positive impact, and call to action. Do not use markdown.`;

    logger.apiCall('POST', 'gemini/generateContent', {
      service: 'gemini',
      model: 'gemini-2.5-flash',
      action: 'generate_description',
      promptLength: prompt.length,
      title: title.substring(0, 50)
    });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const duration = performanceMonitor.endTimer('gemini_generate_description', {
      service: 'gemini',
      status: 'success',
      responseLength: response.text?.length || 0
    });

    const generatedText = response.text || "Failed to generate AI description. Please write one manually.";

    logger.info('Event description generated successfully', {
      service: 'gemini',
      action: 'generate_description',
      duration,
      title: title.substring(0, 50),
      responseLength: generatedText.length,
      success: !!response.text
    });

    return generatedText;
  } catch (error: any) {
    performanceMonitor.endTimer('gemini_generate_description', {
      service: 'gemini',
      status: 'error'
    });

    logger.error('Failed to generate event description', {
      service: 'gemini',
      action: 'generate_description',
      title: title.substring(0, 50),
      error: error.message,
      errorType: error.name
    });

    // Return fallback instead of throwing for AI services
    return "Failed to generate AI description. Please write one manually.";
  }
};

/**
 * Suggest equipment for event using Gemini AI
 */
export const suggestEquipment = async (title: string, description: string): Promise<string[]> => {
  logger.info('Generating equipment suggestions with AI', {
    service: 'gemini',
    action: 'suggest_equipment',
    titleLength: title?.length || 0,
    descriptionLength: description?.length || 0
  });

  // Validate input
  if (!title?.trim() || !description?.trim()) {
    const error = new ServiceError('Event title and description are required for equipment suggestions', ErrorType.VALIDATION);
    logger.warn('Equipment suggestion failed - missing required fields', {
      service: 'gemini',
      action: 'suggest_equipment',
      hasTitle: !!title?.trim(),
      hasDescription: !!description?.trim()
    });
    return [];
  }

  if (!API_KEY || !ai) {
    logger.warn('AI equipment suggestions unavailable - API key missing', {
      service: 'gemini',
      action: 'suggest_equipment',
      title: title.substring(0, 50)
    });
    return [];
  }

  const timer = performanceMonitor.startTimer('gemini_suggest_equipment');

  try {
    const prompt = `Based on the title and description for an environmental cleanup event, suggest a list of 5 to 7 essential items participants should consider bringing.
    Event Title: "${title}"
    Event Description: "${description}"
    Return a JSON object with a single key "items" which is an array of strings. The array should only contain the names of the items. For example: {"items": ["Work gloves", "Trash bags", "Sunscreen"]}.`;

    logger.apiCall('POST', 'gemini/generateContent', {
      service: 'gemini',
      model: 'gemini-2.5-flash',
      action: 'suggest_equipment',
      promptLength: prompt.length,
      title: title.substring(0, 50),
      responseFormat: 'json'
    });

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

    const duration = performanceMonitor.endTimer('gemini_suggest_equipment', {
      service: 'gemini',
      status: 'success',
      responseLength: response.text?.length || 0
    });

    const jsonString = response.text?.trim() || "[]";
    const result = JSON.parse(jsonString);
    const items = result.items || [];

    logger.info('Equipment suggestions generated successfully', {
      service: 'gemini',
      action: 'suggest_equipment',
      duration,
      title: title.substring(0, 50),
      itemCount: items.length,
      responseLength: jsonString.length
    });

    return items;
  } catch (error: any) {
    performanceMonitor.endTimer('gemini_suggest_equipment', {
      service: 'gemini',
      status: 'error'
    });

    logger.error('Failed to generate equipment suggestions', {
      service: 'gemini',
      action: 'suggest_equipment',
      title: title.substring(0, 50),
      error: error.message,
      errorType: error.name
    });

    // Return empty array instead of throwing for AI services
    return [];
  }
};
