import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      // Previne o Chrome de exibir o prompt padrão automaticamente (opcional, mas recomendado)
      e.preventDefault();
      // Salva o evento para que possamos acioná-lo mais tarde.
      setDeferredPrompt(e);
      // Mostra o nosso botão customizado
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Remove o nosso botão/banner para não confundir o usuário
    setShowPrompt(false);

    // Mostra o prompt de instalação nativo
    deferredPrompt.prompt();

    // Aguarda a resposta do usuário
    const { outcome } = await deferredPrompt.userChoice;
    
    // Opcional: lidar com a resposta
    if (outcome === 'accepted') {
      console.log('App instalado com sucesso!');
    }
    
    // Limpa o evento, pois ele só pode ser usado uma vez
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-8 md:bottom-8 md:w-96 bg-slate-800 border border-slate-700 p-4 rounded-2xl shadow-2xl z-50 flex items-center justify-between gap-4 animate-in slide-in-from-bottom-5">
      <div className="flex-1">
        <h3 className="font-semibold text-slate-100 text-sm">Instale o App</h3>
        <p className="text-xs text-slate-400 mt-1">Adicione o Alerta Criminal à tela inicial para acesso rápido e seguro.</p>
      </div>
      <div className="flex items-center gap-2">
        <button 
          onClick={handleInstallClick}
          className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
        >
          <Download size={16} />
          <span>Baixar</span>
        </button>
        <button 
          onClick={handleDismiss}
          className="text-slate-400 hover:text-slate-200 p-2 rounded-xl transition-colors shrink-0"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
