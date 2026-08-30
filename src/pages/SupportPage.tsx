import React from 'react';
import { TopBar } from '../components/TopBar';
import { Mail, MessageCircle, AlertCircle } from 'lucide-react';

export function SupportPage() {
  return (
    <div className="flex flex-col h-full bg-slate-900">
      <TopBar title="Falar com Suporte" />
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
        
        <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700 text-center">
          <div className="w-16 h-16 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle size={32} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Como podemos te ajudar?</h2>
          <p className="text-sm text-slate-400 leading-relaxed mb-6">
            Se você encontrou algum erro no aplicativo, tem sugestões de melhorias ou precisa de ajuda com a sua conta, entre em contato com nossa equipe.
          </p>

          <div className="space-y-4">
            <a 
              href="mailto:suporte@alertacriminal.com.br"
              className="flex items-center gap-3 w-full bg-slate-900 p-4 rounded-2xl border border-slate-700 hover:border-blue-500/50 transition-colors"
            >
              <div className="p-3 bg-blue-500/20 text-blue-400 rounded-xl shrink-0">
                <Mail size={24} />
              </div>
              <div className="text-left">
                <h3 className="text-white font-bold text-sm">Enviar um E-mail</h3>
                <p className="text-xs text-slate-400">suporte@alertacriminal.com.br</p>
              </div>
            </a>
          </div>
        </div>

        <div className="bg-orange-500/10 border border-orange-500/30 p-4 rounded-2xl flex gap-3 items-start">
          <AlertCircle className="text-orange-400 shrink-0 mt-0.5" size={20} />
          <p className="text-xs text-orange-200/80 leading-relaxed">
            <strong>Atenção:</strong> Nosso suporte é apenas para dúvidas sobre o uso do aplicativo. <strong>Não somos um canal de emergência policial.</strong> Se você estiver em perigo, ligue imediatamente para o 190.
          </p>
        </div>
        
      </div>
    </div>
  );
}
