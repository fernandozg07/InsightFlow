import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AlertCircle } from 'lucide-react';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen w-screen bg-slate-950 text-white p-6 text-center">
            <div className="p-4 bg-red-500/10 rounded-full mb-6">
                <AlertCircle className="w-12 h-12 text-red-500" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Ops! Algo deu errado.</h2>
            <p className="text-slate-400 mb-8 max-w-md text-lg leading-relaxed">
                Não foi possível carregar o InsightFlow. Isso geralmente acontece quando a Chave de API não está configurada corretamente no Vercel.
            </p>
            
            <div className="bg-slate-900/80 p-6 rounded-xl border border-slate-800 font-mono text-xs text-left mb-8 w-full max-w-lg overflow-auto shadow-xl">
                <p className="text-red-400 font-bold mb-2">Detalhe do Erro:</p>
                {this.state.error?.toString()}
            </div>

            <button 
                onClick={() => window.location.reload()} 
                className="px-8 py-3 bg-indigo-600 rounded-full hover:bg-indigo-500 transition-all font-semibold shadow-lg shadow-indigo-600/20 hover:scale-105"
            >
                Recarregar Página
            </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
        <App />
    </ErrorBoundary>
  </React.StrictMode>
);