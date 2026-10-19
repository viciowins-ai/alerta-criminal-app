import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ShieldAlert, CheckCircle2, LogOut } from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export function AcceptTermsPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);

  const handleAccept = async () => {
    if (!user) return;
    setIsAccepting(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        termsAccepted: true,
        termsAcceptedAt: serverTimestamp()
      });
      navigate('/', { replace: true });
    } catch (error) {
      console.error("Erro ao aceitar termos:", error);
      setIsAccepting(false);
    }
  };

  const handleDecline = async () => {
    setIsDeclining(true);
    try {
      await signOut();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error("Erro ao deslogar:", error);
      setIsDeclining(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-900 max-w-md mx-auto">
      <div className="bg-slate-950 px-6 py-6 border-b border-slate-800 flex items-center justify-center gap-3">
        <ShieldAlert size={28} className="text-red-500" />
        <h1 className="text-xl font-bold text-white tracking-tight">Termos de Uso</h1>
      </div>
            
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        <div className="bg-slate-800/80 rounded-3xl p-6 border border-slate-700 shadow-xl">
          <p className="text-sm text-slate-300 leading-relaxed mb-6 font-medium">
            Para garantir a sua segurança e a de toda a comunidade, é necessário aceitar nossos termos antes de prosseguir.
          </p>

          <h2 className="text-lg font-bold text-white mb-3">1. Propósito e Coleta</h2>
          <p className="text-sm text-slate-300 leading-relaxed mb-6">
            O Alerta Criminal é uma plataforma colaborativa. Nós coletamos a sua <strong>localização exata</strong> para exibir e gerar alertas de risco na sua região, e utilizamos <strong>gravação de áudio</strong> como evidência unicamente quando você acionar o botão de emergência (S.O.S).
          </p>
                    
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-6">
            <h3 className="text-red-500 font-bold mb-2 flex items-center gap-2">
              <ShieldAlert size={18} />
              Isenção de Responsabilidade
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              O aplicativo <strong>NÃO SUBSTITUI</strong> a polícia. A responsabilidade por decisões baseadas nas nossas rotas ou pelo conteúdo publicado (fotos/relatos) é exclusivamente de quem publicou. Nós nos isentamos de falhas técnicas que impossibilitem pedidos de socorro em momentos críticos.
            </p>
          </div>

          <h2 className="text-lg font-bold text-white mb-3">2. Conduta Comunitária</h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Publicar falsos relatos de crime, ofender outros usuários ou expor terceiros inocentes resultará em <strong>banimento imediato</strong> e possível responsabilização penal (Art. 340 do Código Penal).
          </p>
        </div>
      </div>

      <div className="p-5 bg-slate-950 border-t border-slate-800 space-y-3 pb-safe">
        <button
          onClick={handleAccept}
          disabled={isAccepting || isDeclining}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
        >
          {isAccepting ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <>
              <CheckCircle2 size={20} />
              Eu li e concordo com os Termos
            </>
          )}
        </button>
        
        <button
          onClick={handleDecline}
          disabled={isAccepting || isDeclining}
          className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-3 rounded-2xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
        >
          <LogOut size={18} />
          Não concordo (Sair)
        </button>
      </div>
    </div>
  );
}
