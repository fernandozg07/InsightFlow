import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist';

// Safe PDFJS initialization
let pdfJs: any;
try {
    pdfJs = (pdfjsLib as any).default || pdfjsLib;
    // Set worker correctly for ESM usage
    if (pdfJs && pdfJs.GlobalWorkerOptions) {
        pdfJs.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;
    }
} catch (e) {
    console.warn("PDF JS Init warning:", e);
}

// Helper to fetch with timeout
const fetchWithTimeout = async (resource: string, options: RequestInit = {}, timeout = 5000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(resource, {
        ...options,
        signal: controller.signal
    });
    return response;
  } finally {
    clearTimeout(id);
  }
};

export const readFileAsBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
};

export const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
    reader.readAsText(file);
  });
};

export const readExcelAsText = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        let text = "";
        
        // Limit to 1 sheet
        const sheetLimit = Math.min(workbook.SheetNames.length, 1);
        
        for (let i = 0; i < sheetLimit; i++) {
            const sheetName = workbook.SheetNames[i];
            const sheet = workbook.Sheets[sheetName];
            const csv = XLSX.utils.sheet_to_csv(sheet);
            if (csv.trim().length > 0) {
                // Limit to 2000 chars
                text += `\n--- Planilha: ${sheetName} ---\n${csv.substring(0, 2000)}`;
            }
        }
        
        resolve(text);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

export const readPdfAsText = async (file: File): Promise<string> => {
  if (!pdfJs) return "[ERRO: PDF.js library not loaded]";

  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfJs.getDocument({ data: arrayBuffer });
    
    const pdf = await Promise.race([
        loadingTask.promise,
        new Promise<any>((_, reject) => setTimeout(() => reject(new Error("Timeout loading PDF doc")), 10000))
    ]);

    let text = "";
    // Limit to 1 page for absolute safety
    const maxPages = Math.min(pdf.numPages, 1); 
    
    for (let i = 1; i <= maxPages; i++) {
      try {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const strings = content.items.map((item: any) => item.str);
        text += `\n--- Página PDF ${i} ---\n${strings.join(" ")}`;
      } catch (pageError) {
        text += `\n--- Página ${i} (Erro) ---`;
      }
    }
    
    return text;

  } catch (error) {
    console.error("PDF Read Error", error);
    return `[ERRO LEITURA PDF: ${file.name}]`;
  }
};