import React from 'react';
import { TopBar } from '../components/TopBar';
import { Users, Share2, Copy, Gift } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function ReferralPage() {
  const { user } = useAuth();
  const referralCode = user?.uid ? user.uid.substring(0, 8).toUpperCase() : 'ALERTA2026';

  return (
    <div className="flex flex-col h-full bg-slate-900">
      <TopBar title="Indique e Ganhe" />
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-20">
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-8 rounded-3xl shadow-lg text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white opacity-10 rounded-full" />
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-white opacity-10 rounded-full" />
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-6 border-4 border-white/30 shadow-inner">
              <Gift size={40} className="text-white drop-shadow-md" />
            </div>
            <h2 className="text-2xl font-black tracking-tight mb-2">Convide Amigos</h2>
            <p className="text-green-100 text-sm font-medium leading-relaxed max-w-[250px] mx-auto">
              Ganhe 500 pontos extras para cada amigo que se cadastrar e reportar a primeira ocorrência.
            </p>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-700">
          <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Seu Código de Convite</h3>
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 bg-slate-900 border-2 border-dashed border-slate-600 rounded-2xl p-4 text-center">
              <span className="text-2xl font-black text-blue-400 tracking-widest">{referralCode}</span>
            </div>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(referralCode);
                alert('Código copiado para a área de transferência!');
              }}
              className="p-4 bg-blue-500/10 text-blue-400 rounded-2xl hover:bg-blue-500/20 transition-colors shadow-sm"
            >
              <Copy size={24} />
            </button>
          </div>
          
          <button 
            onClick={async () => {
              try {
                const sharedUrl = window.location.origin;
                if (navigator.share) {
                  await navigator.share({
                    title: 'Junte-se ao Guardian',
                    text: `Use meu código ${referralCode} para ganhar pontos extras no Guardian!`,
                    url: sharedUrl,
                  });
                } else {
                  navigator.clipboard.writeText(`Use meu código ${referralCode} no Guardian: ${sharedUrl}`);
                  alert('Link copiado para a área de transferência!');
                }
              } catch (error) {
                console.error('Erro ao compartilhar:', error);
              }
            }}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-3 shadow-lg shadow-blue-500/30 active:scale-[0.98]"
          >
            <Share2 size={20} />
            Compartilhar Link
          </button>
        </div>

        <div className="bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Seu Progresso</h3>
            <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full">0/5 Amigos</span>
          </div>
          
          <div className="flex justify-between items-center relative">
            <div className="absolute top-1/2 left-0 w-full h-2 bg-slate-700 -translate-y-1/2 rounded-full" />
            <div className="absolute top-1/2 left-0 w-0 h-2 bg-blue-500 -translate-y-1/2 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
            
            {[1, 2, 3, 4, 5].map((step) => (
              <div key={step} className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-500 bg-slate-800 border-4 border-slate-700 text-slate-500`}>
                {step}
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-slate-400 mt-6 font-medium">Faltam 5 amigos para desbloquear o próximo prêmio!</p>
        </div>
      </div>
    </div>
  );
}
