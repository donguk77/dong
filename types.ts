export enum ProcessingStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export interface ExtractedTable {
  title?: string;
  headers: string[];
  rows: string[][];
  description?: string;
}

export interface AIReadyData {
  metadata: {
    filename: string;
    processedAt: string;
    language: string;
  };
  documentAnalysis: {
    title: string;
    summary: string;
    keyPoints: string[];
  };
  structuredContent: {
    markdown: string;
    tables: ExtractedTable[];
  };
}
