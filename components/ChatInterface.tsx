import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, MessageRole } from '../types';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  suggestedQuestions: string[];
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, isLoading, suggestedQuestions }) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      {/* Chat Header */}
      <div className="p-5 border-b border-white/5 bg-slate-900/50 backdrop-blur-sm">
        <h3 className="font-bold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          Assistente Estratégico
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Memória ativa do contexto atual
        </p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6 opacity-0 animate-enter" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-white/5">
                <Bot className="w-8 h-8 text-indigo-400" />
            </div>
            <div className="space-y-2 max-w-xs">
                <p className="text-sm text-slate-300 font-medium">
                Pronto para debater cenários.
                </p>
                <p className="text-xs text-slate-500">
                Posso refinar a análise, criar projeções ou esclarecer dúvidas sobre os KPIs.
                </p>
            </div>
            
            {suggestedQuestions.length > 0 && (
              <div className="flex flex-col gap-2 w-full">
                {suggestedQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSendMessage(q)}
                    className="text-xs text-left bg-slate-800/50 hover:bg-indigo-600/20 text-indigo-200 border border-indigo-500/20 p-3 rounded-xl transition-all hover:scale-[1.02]"
                  >
                    "{q}"
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex w-full animate-enter ${msg.role === MessageRole.USER ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`flex gap-3 max-w-[85%] ${
                msg.role === MessageRole.USER ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg ${
                  msg.role === MessageRole.USER ? 'bg-indigo-600' : 'bg-slate-700'
                }`}
              >
                {msg.role === MessageRole.USER ? <User size={14} /> : <Bot size={14} />}
              </div>
              <div
                className={`p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  msg.role === MessageRole.USER
                    ? 'bg-indigo-600 text-white rounded-tr-none'
                    : 'bg-slate-800/80 text-slate-200 border border-slate-700/50 rounded-tl-none'
                }`}
              >
                {msg.text}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start w-full">
            <div className="flex gap-3 max-w-[85%]">
              <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0">
                <Loader2 size={14} className="animate-spin text-indigo-400" />
              </div>
              <div className="bg-slate-800/50 p-4 rounded-2xl rounded-tl-none border border-slate-700/50">
                <div className="flex space-x-1.5">
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-75"></div>
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-150"></div>
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-300"></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-white/5 bg-slate-900/50">
        <form onSubmit={handleSubmit} className="relative group">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Explore seus dados..."
            disabled={isLoading}
            className="w-full bg-slate-950/80 text-white placeholder-slate-500 border border-slate-700 rounded-xl pl-4 pr-12 py-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 text-sm transition-all shadow-inner"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="absolute right-2 top-2 p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all disabled:opacity-50 disabled:hover:bg-indigo-600 shadow-lg shadow-indigo-600/20"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;