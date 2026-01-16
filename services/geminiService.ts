import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AIReadyData } from "../types";

// 파일을 Gemini가 이해할 수 있는 형식으로 변환하는 함수
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

// 잠시 대기하는 유틸리티 함수
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const processPdfForAI = async (file: File): Promise<AIReadyData> => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey === "") {
    throw new Error("API Key가 설정되지 않았습니다. Vercel 설정에서 API_KEY를 추가해주세요.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const filePart = await fileToGenerativePart(file);

  const prompt = `
    Analyze the attached PDF document. Your goal is to extract the content and structure it into a format that is perfectly optimized for ANOTHER AI model to read.
    1. Extract Title and Summary.
    2. Identify Key Points.
    3. EXTRACT ALL TABLES ACCURATELY.
    4. Provide full content in Markdown.
    5. Maintain original language (Keep it Korean if it's Korean).
  `;

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      metadata: {
        type: Type.OBJECT,
        properties: {
          filename: { type: Type.STRING },
          processedAt: { type: Type.STRING },
          language: { type: Type.STRING },
        },
        required: ["filename", "processedAt", "language"],
      },
      documentAnalysis: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          summary: { type: Type.STRING },
          keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["title", "summary", "keyPoints"],
      },
      structuredContent: {
        type: Type.OBJECT,
        properties: {
          markdown: { type: Type.STRING },
          tables: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                headers: { type: Type.ARRAY, items: { type: Type.STRING } },
                rows: { type: Type.ARRAY, items: { type: Type.ARRAY, items: { type: Type.STRING } } },
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

  // 재시도 관련 설정
  const MAX_RETRIES = 3;
  let retryCount = 0;

  while (retryCount <= MAX_RETRIES) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: {
          role: "user",
          parts: [filePart, { text: prompt }]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
        },
      });

      if (!response.text) throw new Error("Gemini로부터 응답을 받지 못했습니다.");
      
      const data = JSON.parse(response.text) as AIReadyData;
      data.metadata.filename = file.name;
      data.metadata.processedAt = new Date().toISOString();
      return data;

    } catch (error: any) {
      const isOverloaded = error?.message?.includes("503") || error?.message?.includes("overloaded");
      
      if (isOverloaded && retryCount < MAX_RETRIES) {
        retryCount++;
        // 지수 백오프: 1초, 2초, 4초 대기
        const waitTime = Math.pow(2, retryCount - 1) * 1000;
        console.warn(`서버가 바쁩니다. ${waitTime/1000}초 후 다시 시도합니다... (${retryCount}/${MAX_RETRIES})`);
        await sleep(waitTime);
        continue;
      }

      // 재시도 끝에 실패하거나 다른 에러인 경우
      if (isOverloaded) {
        throw new Error("현재 구글 AI 서버에 사용자가 너무 많아 처리가 지연되고 있습니다. 잠시 후 다시 시도해 주세요.");
      }
      
      console.error("Gemini API Error:", error);
      throw error;
    }
  }
  
  throw new Error("문서 처리 중 알 수 없는 오류가 발생했습니다.");
};