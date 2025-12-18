
export type AspectRatio = "1:1" | "4:3" | "16:9" | "9:16";
export type ImageSize = "1K" | "2K";

export interface UploadedImage {
  id: string;
  base64: string;
  file: File;
}

export interface StyleOption {
  id: string;
  name: string;
  description: string;
  previewUrl: string;
  promptTemplate: string;
}

export interface VisualAnalysis {
  subject: string;
  accessories: string;
  materials: string;
}

export interface EditablePoint {
  id: string;
  slogan: string;
  promptEn: string;
  promptZh: string;
  fontSize: string;
  fontColor: string;
  remarks: string;
}

export interface GenerationConfig {
  aspectRatio: AspectRatio;
  imageSize: ImageSize;
  style: StyleOption;
  sellingPoints: string;
  competitorLink: string;
  targetMarket: string;
  category: string;
  marketingPlatform: string;
  uploadedImages: UploadedImage[];
  selectedImageId: string | null;
  visualAnalysis: VisualAnalysis;
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  slogan: string;
  sourceImageId: string;
  timestamp: number;
}
