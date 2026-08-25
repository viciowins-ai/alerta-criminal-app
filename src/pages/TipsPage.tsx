import React, { useState, useRef, useEffect } from 'react';
import { TopBar } from '../components/TopBar';
import { Shield, Send, Bot, User, Loader2 } from 'lucide-react';

export function TipsPage() {
  const [messages, setMessages] = useState<{role: 'user' | 'model', text: string}[]>([
    { role: 'model', text: 'Olá! Sou o Guardião Virtual, seu assistente de segurança pessoal. Como posso ajudar você hoje? Posso dar dicas de segurança, analisar rotas ou explicar como agir em emergências.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMsg = input.trim();
    setInput('');
    
    const newMessages = [...messages, { role: 'user' as const, text: userMsg }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages })
      });

      if (!response.ok) {
        throw new Error('Falha na resposta do servidor');
      }

      const data = await response.json();
      
      setMessages(prev => [...prev, { role: 'model', text: data.text || 'Desculpe, não consegui processar sua mensagem.' }]);
    } catch (error) {
      console.error("Erro no chat:", error);
      setMessages(prev => [...prev, { role: 'model', text: 'Desculpe, ocorreu um erro ao conectar com o servidor de IA. Tente novamente em instantes.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900">
      <TopBar title="Assistente Virtual (IA)" />
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-4 rounded-2xl shadow-lg text-white mb-4 flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-xl">
            <Shield size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Guardião Virtual</h2>
            <p className="text-blue-100 text-xs">Tire dúvidas sobre segurança e rotas</p>
          </div>
        </div>

        <div className="space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-blue-600' : 'bg-slate-700'}`}>
                {msg.role === 'user' ? <User size={16} className="text-white" /> : <Bot size={16} className="text-blue-400" />}
              </div>
              <div className={`p-3 rounded-2xl max-w-[80%] text-sm leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-none' 
                  : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                <Bot size={16} className="text-blue-400" />
              </div>
              <div className="p-3 rounded-2xl bg-slate-800 border border-slate-700 rounded-tl-none flex items-center gap-2">
                <Loader2 size={16} className="text-blue-400 animate-spin" />
                <span className="text-xs text-slate-400">Analisando...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-slate-900 border-t border-slate-800">
        <div className="flex gap-2">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Pergunte sobre segurança..." 
            className="flex-1 bg-slate-800 border border-slate-700 rounded-full px-4 py-3 text-sm text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button 
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="w-12 h-12 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-full flex items-center justify-center transition-colors shrink-0"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
