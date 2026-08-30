import React from 'react';
import { TopBar } from '../components/TopBar';
import { HelpCircle, MessageCircle, FileText, ExternalLink, Star, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function HelpPage() {
  const navigate = useNavigate();
  
  return (
    <div className="flex flex-col h-full bg-slate-900">
      <TopBar title="Central de Ajuda" />
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-20">
        <div className="bg-gradient-to-br from-orange-400 to-red-500 p-8 rounded-3xl shadow-lg text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white opacity-10 rounded-full" />
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-white opacity-10 rounded-full" />
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-6 border-4 border-white/30 shadow-inner">
              <HelpCircle size={40} className="text-white drop-shadow-md" />
            </div>
            <h2 className="text-2xl font-black tracking-tight mb-2">Como podemos ajudar?</h2>
            <p className="text-orange-100 text-sm font-medium leading-relaxed max-w-[250px] mx-auto">
              Encontre respostas para suas dúvidas ou entre em contato com nosso suporte.
            </p>
          </div>
        </div>

        <div className="bg-slate-800 rounded-3xl shadow-sm border border-slate-700 overflow-hidden">
          <HelpItem icon={<BookOpen size={20} className="text-yellow-500" />} label="Tutorial: Instalar e Compartilhar" onClick={() => navigate('/help/tutorial')} />
          <HelpItem icon={<Star size={20} className="text-yellow-400 fill-yellow-400" />} label="Avaliar Aplicativo" onClick={() => navigate('/help/feedback')} />
          <HelpItem icon={<MessageCircle size={20} className="text-blue-500" />} label="Falar com Suporte" onClick={() => navigate('/help/support')} />
          <HelpItem icon={<FileText size={20} className="text-green-500" />} label="Perguntas Frequentes (FAQ)" onClick={() => navigate('/help/faq')} />
          <HelpItem icon={<ExternalLink size={20} className="text-purple-500" />} label="Termos de Uso" onClick={() => navigate('/help/terms')} />
          <HelpItem icon={<ExternalLink size={20} className="text-orange-500" />} label="Política de Privacidade" onClick={() => navigate('/help/privacy')} />
        </div>
      </div>
    </div>
  );
}

function HelpItem({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick?: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between p-4 border-b border-slate-700 hover:bg-slate-700/50 transition-colors last:border-0">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-slate-900 rounded-xl">
          {icon}
        </div>
        <span className="text-sm font-medium text-slate-300">{label}</span>
      </div>
      <ExternalLink size={16} className="text-slate-500" />
    </button>
  );
}
