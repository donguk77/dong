import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AIReadyData } from "../types";

const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve({
        inlineData: {
          data: base64String,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const processPdfForAI = async (file: File): Promise<AIReadyData> => {
  // Initialize AI client lazily inside the function.
  // This prevents the application from crashing at startup (White Screen) if process.env.API_KEY is undefined.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const filePart = await fileToGenerativePart(file);

  const prompt = `
    You are an expert Data Engineer specializing in unstructured data processing.
    
    TASK:
    Analyze the attached PDF document. Your goal is to extract the content and structure it into a format that is perfectly optimized for ANOTHER AI model to read and understand later.
    
    REQUIREMENTS:
    1. Extract the main Title and a concise Summary of the document.
    2. Identify Key Points (bullet points) that summarize the core intent.
    3. EXTRACT ALL TABLES ACCURATELY. Representation of tables is critical. 
       - For the 'tables' array, strictly separate headers from row data.
    4. Provide a 'markdown' version of the full text content. In this markdown, represent tables using standard Markdown table syntax so an LLM can visualize it.
    5. Maintain the original language of the document (e.g., if it is Korean, keep it Korean).
    
    The output must be pure JSON adhering to the defined schema.
  `;

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      metadata: {
        type: Type.OBJECT,
        properties: {
          filename: { type: Type.STRING },
          processedAt: { type: Type.STRING },
          language: { type: Type.STRING, description: "The primary language of the document (e.g., 'ko-KR')" },
        },
        required: ["filename", "processedAt", "language"],
      },
      documentAnalysis: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          summary: { type: Type.STRING },
          keyPoints: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: ["title", "summary", "keyPoints"],
      },
      structuredContent: {
        type: Type.OBJECT,
        properties: {
          markdown: { type: Type.STRING, description: "Full document text with markdown formatting, especially for tables." },
          tables: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                headers: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                rows: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
              },
              required: ["headers", "rows"],
            },
          },
        },
        required: ["markdown", "tables"],
      },
    },
    required: ["metadata", "documentAnalysis", "structuredContent"],
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        role: "user",
        parts: [
            filePart,
            { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    if (!response.text) {
      throw new Error("No response text received from Gemini.");
    }

    const data = JSON.parse(response.text) as AIReadyData;
    
    // Manually inject filename/date if the model hallucinated them or to ensure accuracy
    data.metadata.filename = file.name;
    data.metadata.processedAt = new Date().toISOString();

    return data;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
