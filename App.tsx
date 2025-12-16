import React, { useState } from 'react';
import { FileData, AnalysisResult, ChatMessage, MessageRole, InsightType } from './types';
import { readFileAsBase64, readFileAsText, readExcelAsText, readPdfAsText } from './utils/fileHelpers';
import { generateDashboardAnalysis, sendMessageToChat } from './services/geminiService';
import FileUpload from './components/FileUpload';
import Dashboard from './components/Dashboard';
import ChatInterface from './components/ChatInterface';
import { Sparkles, AlertCircle, FileDown, Loader2, Menu, PlayCircle, RefreshCw } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Dados de Exemplo para o Modo Demo
const DEMO_RESULT: AnalysisResult = {
  summary: "Crescimento robusto de 18% na receita recorrente, mas custos operacionais (OpEx) subiram desproporcionalmente, pressionando a margem líquida.",
  kpis: [
    { label: "Receita Recorrente (ARR)", value: "R$ 4.8M", trend: "up" },
    { label: "CAC (Custo Aquisição)", value: "R$ 340", trend: "down" },
    { label: "Churn Rate", value: "2.4%", trend: "neutral" },
    { label: "Margem Líquida", value: "12.5%", trend: "down" }
  ],
  insights: [
    { type: InsightType.PROBLEM, title: "Escalada de OpEx", description: "Gastos com infraestrutura subiram 35% no último trimestre." },
    { type: InsightType.OPPORTUNITY, title: "Expansão Enterprise", description: "Segmento corporativo representa 60% do novo faturamento." },
    { type: InsightType.INFO, title: "Sazonalidade Q4", description: "Historicamente, Q4 representa 40% das vendas anuais." }
  ],
  chartData: [
    { name: "Jul", value: 320 },
    { name: "Ago", value: 350 },
    { name: "Set", value: 340 },
    { name: "Out", value: 410 },
    { name: "Nov", value: 450 },
    { name: "Dez", value: 580 }
  ],
  chartType: 'area', // Demo chart type
  suggestedQuestions: [
    "Como podemos otimizar o OpEx sem impactar o crescimento?",
    "Qual a projeção de receita para o próximo Q1?",
    "Análise detalhada do Churn por segmento"
  ]
};

const App: React.FC = () => {
  const [files, setFiles] = useState<FileData[]>([]);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showChatMobile, setShowChatMobile] = useState(false);

  // Função para resetar o app para o estado inicial (Nova Análise)
  const resetApp = () => {
    setFiles([]);
    setAnalysisResult(null);
    setChatMessages([]);
    setIsProcessing(false);
    setError(null);
    setProcessingStep("");
    setShowChatMobile(false);
  };

  const handleDemoLoad = () => {
    setIsProcessing(true);
    setProcessingStep("Carregando cenário de demonstração...");
    setError(null);
    
    // Simular delay para efeito visual
    setTimeout(() => {
        setFiles([{ 
            id: 'demo-1', 
            name: 'Relatorio_Financeiro_Q4.xlsx', 
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
            content: 'demo-content', 
            mimeType: 'application/xlsx' 
        }]);
        setAnalysisResult(DEMO_RESULT);
        setChatMessages([{
            id: 'demo-msg-1',
            role: MessageRole.MODEL,
            text: "Carreguei um cenário de exemplo focado em métricas SaaS. Note a pressão na margem líquida apesar do crescimento de receita. Como posso ajudar a aprofundar essa análise?",
            timestamp: new Date()
        }]);
        setIsProcessing(false);
        setProcessingStep("");
    }, 1500);
  };

  const handleFilesSelected = async (uploadedFiles: File[]) => {
    setIsProcessing(true);
    setProcessingStep("Lendo arquivos...");
    setError(null);
    setFiles([]); 
    setAnalysisResult(null);
    setChatMessages([]);

    try {
      const processedFiles: FileData[] = [];

      for (const file of uploadedFiles) {
        setProcessingStep(`Processando: ${file.name}...`);
        let content = '';
        const mimeType = file.type || 'application/octet-stream';

        try {
            if (mimeType.startsWith('image/')) {
              content = await readFileAsBase64(file);
            } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
               content = await readExcelAsText(file);
            } else if (file.name.endsWith('.pdf') || mimeType === 'application/pdf') {
               content = await readPdfAsText(file);
            } else {
               content = await readFileAsText(file);
            }

            processedFiles.push({
              id: Math.random().toString(36).substr(2, 9),
              name: file.name,
              type: mimeType,
              content: content,
              mimeType: mimeType
            });
        } catch (e) {
            console.error(`Error processing ${file.name}:`, e);
        }
      }

      if (processedFiles.length === 0) throw new Error("Nenhum arquivo válido processado.");

      setFiles(processedFiles);
      setProcessingStep("Análise Cognitiva Iniciada...");

      const result = await generateDashboardAnalysis(processedFiles, (status) => {
        setProcessingStep(status);
      });
      
      setAnalysisResult(result);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro desconhecido.");
    } finally {
      setIsProcessing(false);
      setProcessingStep("");
    }
  };

  const handleSendMessage = async (text: string) => {
    const newUserMsg: ChatMessage = {
      id: Date.now().toString(),
      role: MessageRole.USER,
      text: text,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, newUserMsg]);
    setIsChatLoading(true);

    try {
      const historyForApi = chatMessages.map(m => ({ role: m.role, text: m.text }));
      
      const responseText = await sendMessageToChat(historyForApi, text, files, analysisResult);

      const newAiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: MessageRole.MODEL,
        text: responseText,
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, newAiMsg]);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: MessageRole.MODEL,
        text: "Ocorreu um erro na comunicação. Verifique sua conexão ou a Chave de API.",
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const generateReport = async () => {
    const dashboardElement = document.getElementById('dashboard-content');
    if(!dashboardElement) return;

    setIsExporting(true);
    try {
        const canvas = await html2canvas(dashboardElement, { 
            scale: 2,
            backgroundColor: '#020617', 
            logging: false,
            useCORS: true 
        });
        const imgData = canvas.toDataURL('image/png');
        
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgHeight = (canvas.height * pdfWidth) / canvas.width;

        pdf.setFillColor(2, 6, 23); 
        pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');
        
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(20);
        pdf.text("Relatório Estratégico InsightFlow", 15, 20);
        
        pdf.setFontSize(10);
        pdf.setTextColor(148, 163, 184); 
        pdf.text(`Gerado via IA Generativa em: ${new Date().toLocaleDateString()}`, 15, 28);
        
        if (imgHeight <= (pdfHeight - 40)) {
            pdf.addImage(imgData, 'PNG', 0, 40, pdfWidth, imgHeight);
        } else {
            pdf.addImage(imgData, 'PNG', 0, 40, pdfWidth, imgHeight);
        }

        if (chatMessages.length > 0) {
            pdf.addPage();
            pdf.setFillColor(2, 6, 23);
            pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');
            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(16);
            pdf.text("Highlights da Discussão (Memória)", 15, 20);
            
            let yPos = 40;
            pdf.setFontSize(10);
            chatMessages.slice(-6).forEach(msg => {
                if (yPos > 270) return;
                
                if (msg.role === MessageRole.USER) {
                    pdf.setTextColor(129, 140, 248); 
                } else {
                    pdf.setTextColor(52, 211, 153);
                }
                
                pdf.text(`${msg.role === MessageRole.USER ? 'Você' : 'InsightFlow'}:`, 15, yPos);
                
                pdf.setTextColor(203, 213, 225);
                const lines = pdf.splitTextToSize(msg.text, 180);
                pdf.text(lines, 15, yPos + 6);
                yPos += (lines.length * 5) + 15;
            });
        }

        pdf.save('InsightFlow_Report.pdf');
    } catch (e) {
        console.error("Export failed", e);
        alert("Erro ao gerar PDF.");
    } finally {
        setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col h-screen text-slate-100 overflow-hidden relative">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-500/10 rounded-full blur-[120px]"></div>
      </div>

      {/* Header */}
      <header className="h-16 glass-panel border-b-0 flex items-center justify-between px-6 flex-shrink-0 z-20 relative m-4 rounded-2xl">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={resetApp}>
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            InsightFlow <span className="text-indigo-400 font-light">AI</span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
             {analysisResult && (
                <>
                <button 
                    onClick={resetApp}
                    className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-bold uppercase tracking-wider rounded-lg transition-all border border-slate-700 hover:border-indigo-500/30"
                >
                    <RefreshCw size={14} />
                    <span>Nova Análise</span>
                </button>
                <button 
                    onClick={generateReport}
                    disabled={isExporting}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all hover:scale-105 disabled:opacity-50 shadow-lg shadow-indigo-600/20"
                >
                    {isExporting ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
                    <span className="hidden sm:inline">Exportar PDF</span>
                </button>
                </>
            )}
             <button 
                className="lg:hidden p-2 text-slate-300 hover:bg-slate-800 rounded-lg"
                onClick={() => setShowChatMobile(!showChatMobile)}
             >
                <Menu size={24} />
             </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden z-10 relative px-4 pb-4 gap-4">
        {/* Left/Main Panel */}
        <main className="flex-1 glass-panel rounded-2xl overflow-y-auto p-4 lg:p-8 custom-scrollbar">
          <div className="max-w-6xl mx-auto space-y-8">
            
            {/* Upload / Intro */}
            <div className={`space-y-6 transition-all duration-700 ease-in-out ${analysisResult ? 'opacity-100' : 'mt-10'}`}>
              {!analysisResult && !isProcessing && (
                <div className="text-center mb-12 animate-enter">
                  <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
                    Inteligência de Dados <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">Sem Limites</span>
                  </h2>
                  <p className="text-slate-400 max-w-2xl mx-auto text-lg mb-8">
                    Carregue planilhas, PDFs ou imagens. Nossa IA extrai insights estratégicos, KPIs ocultos e cria planos de ação.
                  </p>
                  
                  <button 
                    onClick={handleDemoLoad}
                    className="inline-flex items-center gap-2 px-6 py-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-full text-sm font-medium transition-all border border-slate-700 hover:border-indigo-500/50 mb-8 group"
                  >
                    <PlayCircle size={16} className="group-hover:text-indigo-400" />
                    <span>Ver Exemplo (Demo Dashboard)</span>
                  </button>
                </div>
              )}
              
              {!analysisResult && (
                <FileUpload onFilesSelected={handleFilesSelected} isProcessing={isProcessing} />
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 animate-enter">
                <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
                    <span>{error}</span>
                </div>
                <button 
                    onClick={resetApp}
                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-lg text-xs font-bold uppercase transition-colors whitespace-nowrap"
                >
                    Tentar Novamente
                </button>
              </div>
            )}

            {/* Loader */}
            {isProcessing && (
              <div className="flex flex-col items-center justify-center py-20 space-y-6 animate-enter">
                <div className="relative">
                  <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 animate-pulse rounded-full"></div>
                  <Loader2 className="w-16 h-16 text-indigo-400 animate-spin relative z-10" />
                </div>
                <div className="text-center">
                    <h3 className="text-xl font-medium text-white mb-2">Processando Inteligência</h3>
                    <p className="text-sm text-slate-400 font-mono animate-pulse">
                      {processingStep}
                    </p>
                </div>
              </div>
            )}

            {/* Dashboard */}
            {analysisResult && <Dashboard data={analysisResult} />}
          </div>
        </main>

        {/* Right Panel: Chat (Desktop: Static, Mobile: Absolute) */}
        <aside className={`
            w-full lg:w-[400px] glass-panel rounded-2xl flex-shrink-0 
            fixed inset-4 lg:static lg:inset-auto z-30 
            transition-transform duration-300 shadow-2xl lg:shadow-none
            ${showChatMobile ? 'translate-x-0' : 'translate-x-[110%] lg:translate-x-0'}
        `}>
          <ChatInterface 
            messages={chatMessages} 
            onSendMessage={handleSendMessage}
            isLoading={isChatLoading}
            suggestedQuestions={analysisResult?.suggestedQuestions || []}
          />
          {/* Close button for mobile */}
          {showChatMobile && (
             <button 
                onClick={() => setShowChatMobile(false)}
                className="absolute top-4 right-4 p-2 bg-slate-800 rounded-full lg:hidden border border-slate-700 text-white z-50"
             >
                <span className="text-xl">×</span>
             </button>
          )}
        </aside>
      </div>
    </div>
  );
};

export default App;