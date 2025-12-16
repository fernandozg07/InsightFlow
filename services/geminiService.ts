import { GoogleGenAI } from "@google/genai";
import { AnalysisResult, FileData, MessageRole } from "../types";
import { DASHBOARD_PROMPT, DASHBOARD_SYSTEM_INSTRUCTION, CHAT_SYSTEM_INSTRUCTION } from "../constants";

// Helper to safely get API Key without crashing if 'process' is undefined
const getAIClient = () => {
  let apiKey = "";
  try {
    // Check if process exists before accessing env to avoid ReferenceError in some browsers
    if (typeof process !== 'undefined' && process.env) {
      apiKey = process.env.API_KEY || "";
    }
  } catch (e) {
    console.warn("Ambiente 'process' não detectado. Verifique a configuração do bundler.");
  }

  if (!apiKey) {
    console.warn("DEBUG: API_KEY missing.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

// Robust JSON Parser
const parseJSON = (text: string): any => {
    if (!text) throw new Error("Vazio.");
    const tryParse = (str: string) => { try { return JSON.parse(str); } catch (e) { return null; } };

    let result = tryParse(text);
    if (result) return result;

    let cleaned = text.replace(/```json\s*|\s*```/g, '').trim();
    result = tryParse(cleaned);
    if (result) return result;

    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
        result = tryParse(cleaned.substring(start, end + 1));
        if (result) return result;
    }

    if (start !== -1 && (end === -1 || end < start)) {
         throw new Error("Resposta cortada pela IA (Limite de Tokens). Tente enviar menos arquivos.");
    }
    throw new Error("Formato inválido.");
};

export const generateDashboardAnalysis = async (
  files: FileData[], 
  onStatusUpdate?: (status: string) => void
): Promise<AnalysisResult> => {
  
  const ai = getAIClient();
  if (!ai) throw new Error("API Key não encontrada. Configure a variável de ambiente 'API_KEY' no Vercel (Settings > Environment Variables).");

  const parts: any[] = [];
  if (onStatusUpdate) onStatusUpdate("Processando documentos...");

  files.forEach(file => {
    if (file.mimeType.startsWith('image/')) {
      parts.push({ inlineData: { mimeType: file.mimeType, data: file.content } });
    } else {
      // Moderate limit: 6000 chars allows for decent context without crashing
      const safeContent = file.content.length > 6000 ? file.content.substring(0, 6000) + "\n[TRUNCADO]" : file.content;
      parts.push({ text: `ARQUIVO: ${file.name}\n${safeContent}\n---` });
    }
  });

  parts.push({ text: DASHBOARD_PROMPT });

  try {
    if (onStatusUpdate) onStatusUpdate("Gerando inteligência estratégica...");
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts },
      config: {
        systemInstruction: DASHBOARD_SYSTEM_INSTRUCTION, // USE DASHBOARD SPECIFIC INSTRUCTION
        responseMimeType: "application/json", 
        temperature: 0.2, 
        maxOutputTokens: 8192
      }
    });

    if (response.text) {
      try {
        const parsed = parseJSON(response.text) as AnalysisResult;
        // Defaults
        parsed.insights = parsed.insights || [];
        parsed.kpis = parsed.kpis || [];
        parsed.chartData = parsed.chartData || [];
        parsed.suggestedQuestions = parsed.suggestedQuestions || [];
        parsed.chartType = parsed.chartType || 'area'; // Default fallback
        return parsed;
      } catch (parseError) {
        throw new Error("Erro ao interpretar dados da IA. Tente novamente.");
      }
    }
    throw new Error("Sem resposta da IA.");
  } catch (error: any) {
    if (error.message?.includes("429")) throw new Error("Muitas requisições. Aguarde um momento.");
    throw error;
  }
};

export const sendMessageToChat = async (
  history: { role: MessageRole, text: string }[],
  newMessage: string,
  files: FileData[],
  analysisContext: AnalysisResult | null
): Promise<string> => {
  
  const ai = getAIClient();
  if (!ai) throw new Error("API Key ausente.");

  // Build a "System Memory" string
  let memoryContext = "Você já analisou os arquivos. Aqui está o resumo do que encontrou (Use isso como MEMÓRIA para contextualizar, mas não se limite a isso):\n";
  if (analysisContext) {
      memoryContext += `RESUMO: ${analysisContext.summary}\n`;
      memoryContext += `KPIs: ${analysisContext.kpis.map(k => `${k.label}: ${k.value}`).join(', ')}\n`;
  }

  const chatHistory = history.map(msg => ({
    role: msg.role === MessageRole.USER ? 'user' : 'model',
    parts: [{ text: msg.text }]
  }));

  try {
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      history: chatHistory,
      config: {
        // USE CHAT SPECIFIC INSTRUCTION + ENABLE SEARCH
        systemInstruction: `${CHAT_SYSTEM_INSTRUCTION}\n\nCONTEXTO DE MEMÓRIA DOS ARQUIVOS:\n${memoryContext}`,
        tools: [{ googleSearch: {} }], // Enable Google Search for market research
        maxOutputTokens: 2000, // Increased for deeper explanation
        temperature: 0.7 // Higher for more creative/natural reasoning
      }
    });

    const messageParts: any[] = [];
    
    // Context injection strategy
    if (history.length < 4) {
        files.forEach(file => {
          if (!file.mimeType.startsWith('image/')) {
            const chatSafeContent = file.content.length > 2500 ? file.content.substring(0, 2500) + "\n[...]" : file.content;
            messageParts.push({ text: `[Ref: ${file.name}]\n${chatSafeContent}\n---` });
          }
        });
    }

    messageParts.push({ text: newMessage });

    const result = await chat.sendMessage({ message: messageParts });
    
    let finalText = result.text || "Sem resposta.";

    // Append Search Sources if available
    const groundingChunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks && groundingChunks.length > 0) {
        const sources = groundingChunks
            .map((chunk: any) => chunk.web ? `[${chunk.web.title}](${chunk.web.uri})` : null)
            .filter(Boolean);
        
        if (sources.length > 0) {
            // Deduplicate sources
            const uniqueSources = [...new Set(sources)];
            finalText += `\n\n**Fontes Consultadas:**\n` + uniqueSources.map(s => `- ${s}`).join('\n');
        }
    }

    return finalText;

  } catch (error) {
    console.error("Chat Error:", error);
    return "Desculpe, estou tendo dificuldades para processar essa solicitação complexa no momento. Tente reformular.";
  }
};