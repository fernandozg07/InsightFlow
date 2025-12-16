export interface FileData {
  id: string;
  name: string;
  type: string;
  content: string; // Base64 or Text content
  mimeType: string;
}

export enum MessageRole {
  USER = 'user',
  MODEL = 'model'
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  text: string;
  timestamp: Date;
}

export enum InsightType {
  PROBLEM = 'problem',
  OPPORTUNITY = 'opportunity',
  INFO = 'info'
}

export interface Insight {
  type: InsightType;
  title: string;
  description: string;
}

export interface Kpi {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
}

export interface ChartPoint {
  name: string;
  value: number;
}

export type ChartType = 'area' | 'bar' | 'line' | 'pie';

export interface AnalysisResult {
  summary: string;
  insights: Insight[];
  kpis: Kpi[];
  chartData: ChartPoint[];
  chartType: ChartType;
  suggestedQuestions: string[];
}