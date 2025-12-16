import React, { useRef, useState } from 'react';
import { UploadCloud, FileType, X, Image as ImageIcon, FileSpreadsheet, ScanLine } from 'lucide-react';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  isProcessing: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFilesSelected, isProcessing }) => {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(Array.from(e.target.files));
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div
        className={`relative group w-full h-64 rounded-3xl border-2 border-dashed transition-all duration-500 ease-out flex flex-col items-center justify-center cursor-pointer overflow-hidden backdrop-blur-md
          ${dragActive 
            ? "border-indigo-400 bg-indigo-500/10 scale-[1.02] shadow-[0_0_40px_rgba(99,102,241,0.3)]" 
            : "border-slate-700/50 bg-slate-900/40 hover:bg-slate-800/60 hover:border-indigo-500/50 hover:shadow-lg"
          }
          ${isProcessing ? "opacity-50 pointer-events-none" : ""}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          className="hidden"
          type="file"
          multiple
          accept=".csv,.txt,.json,.md,.png,.jpg,.jpeg,.webp,.pdf,.xls,.xlsx"
          onChange={handleChange}
        />
        
        {/* Animated Scanner Effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent animate-[scan_2s_linear_infinite]"></div>
        </div>
        
        <div className="z-10 flex flex-col items-center text-center p-8 space-y-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 ${dragActive ? 'bg-indigo-500 text-white shadow-lg' : 'bg-slate-800 text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-500/20'}`}>
                {isProcessing ? <ScanLine className="animate-pulse" size={32}/> : <UploadCloud size={32} />}
            </div>
            
            <div className="space-y-1">
                <h3 className="text-xl font-semibold text-white tracking-tight">
                    {isProcessing ? 'Analisando Dados...' : 'Iniciar Análise Estratégica'}
                </h3>
                <p className="text-sm text-slate-400">
                    Arraste documentos ou clique para conectar seus dados
                </p>
            </div>

            <div className="flex gap-2 mt-4 text-xs font-mono text-slate-500 border border-slate-800 rounded-full px-4 py-1.5 bg-slate-950/50">
                <span>PDF</span>
                <span className="text-slate-700">|</span>
                <span>XLSX</span>
                <span className="text-slate-700">|</span>
                <span>CSV</span>
                <span className="text-slate-700">|</span>
                <span>IMAGEM</span>
            </div>
        </div>

        {/* Decorative Ambience */}
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-indigo-600/10 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-violet-600/10 rounded-full blur-[80px] pointer-events-none"></div>
      </div>
    </div>
  );
};

export default FileUpload;