
import { GoogleGenAI, Type } from "@google/genai";
import { VisualAnalysis, EditablePoint } from "../types";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async analyzeProduct(base64Image: string, competitorLink?: string): Promise<VisualAnalysis> {
    try {
      const parts: any[] = [
        {
          inlineData: {
            data: base64Image.split(',')[1] || base64Image,
            mimeType: 'image/png',
          },
        },
        {
          text: `Analyze this product. ${competitorLink ? `Also consider this competitor link for context: ${competitorLink}.` : ''} 
          Return a JSON object with: 'subject' (product name), 'accessories' (included items), and 'materials' (texture/build). 
          Response must be strictly JSON.`,
        }
      ];

      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              subject: { type: Type.STRING },
              accessories: { type: Type.STRING },
              materials: { type: Type.STRING },
            },
            required: ["subject", "accessories", "materials"]
          },
          tools: competitorLink ? [{ googleSearch: {} }] : undefined,
        },
      });

      return JSON.parse(response.text);
    } catch (error) {
      console.error("Analysis error:", error);
      return { subject: "未知产品", accessories: "无", materials: "通用材质" };
    }
  }

  async translatePrompt(text: string, toEnglish: boolean): Promise<string> {
    const response = await this.ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a professional advertising translator. ${toEnglish ? 'Translate this Chinese commercial scene description to a detailed English image prompt.' : 'Translate this English image prompt to a descriptive Chinese reference.'} 
      
      Text: "${text}"
      
      Return ONLY the translated text.`,
    });
    return response.text.trim();
  }

  async generateProductScene(
    base64Image: string,
    item: EditablePoint,
    aspectRatio: string,
  ): Promise<string> {
    try {
      const fullPrompt = `${item.promptEn}. ${item.remarks ? `Additional details: ${item.remarks}` : ''}`;
      
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Image.split(',')[1] || base64Image,
                mimeType: 'image/png',
              },
            },
            {
              text: `STRICT REQUIREMENT: Place the product exactly as it appears in the source into this scene: ${fullPrompt}. 
              1. DO NOT change the product's size, proportions, shape, or colors.
              2. DO NOT change the product's materials or textures.
              3. MAINTAIN 100% fidelity to the original product features.
              4. TYPOGRAPHY: Add a ${item.fontSize} size text slogan in ${item.fontColor} color that says "${item.slogan}". The text should be integrated into the composition with professional layout.`,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio as any,
          },
        },
      });

      for (const candidate of response.candidates || []) {
        for (const part of candidate.content.parts) {
          if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
          }
        }
      }
      throw new Error("No image data found");
    } catch (error) {
      console.error("Generation error:", error);
      throw error;
    }
  }

  async refinePromptsForPoints(
    styleTemplate: string,
    points: string[],
    analysis: VisualAnalysis,
    market: string,
    category: string,
    platform: string,
    competitorContext: string
  ): Promise<EditablePoint[]> {
    const response = await this.ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a creative director. 
      Product: ${analysis.subject} (${analysis.materials}).
      Context: ${competitorContext || 'None'}.
      Market: ${market}, Category: ${category}, Platform: ${platform}.
      Style: ${styleTemplate}.
      
      For each of the following selling points, generate:
      1. A short, punchy marketing slogan (max 5 words).
      2. A detailed English image prompt.
      3. A descriptive Chinese translation/reference of that prompt.
      
      Selling Points:
      ${points.map((p, i) => `${i + 1}. ${p}`).join('\n')}
      
      Return a JSON array of objects with keys: 'slogan', 'promptEn', 'promptZh'.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              promptEn: { type: Type.STRING },
              promptZh: { type: Type.STRING },
              slogan: { type: Type.STRING },
            },
            required: ["promptEn", "promptZh", "slogan"]
          }
        }
      }
    });
    
    const data = JSON.parse(response.text);
    return data.map((d: any) => ({
      ...d,
      id: Math.random().toString(36).substr(2, 9),
      fontSize: "large",
      fontColor: "white",
      remarks: ""
    }));
  }
}

export const geminiService = new GeminiService();
