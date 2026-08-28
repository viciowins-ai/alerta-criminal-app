import React from 'react';
import { TopBar } from '../components/TopBar';
import { Share2, Download, Smartphone, Monitor, ChevronRight } from 'lucide-react';

export function TutorialPage() {
  return (
    <div className="flex flex-col h-full bg-slate-900">
      <TopBar title="Tutorial de Uso" showBack={true} />
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-20">
        
        <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-500/20 text-blue-400 rounded-xl">
              <Download size={24} />
            </div>
            <h2 className="text-xl font-bold text-white">Como Instalar o Aplicativo (PWA)</h2>
          </div>
          <p className="text-slate-300 text-sm mb-6 leading-relaxed">
            O Alerta Criminal é um Web App Progressivo (PWA). Isso significa que você pode instalá-mo diretamente do seu navegador, sem precisar da loja de aplicativos, economizando memória no seu celular!
          </p>
          
          <div className="space-y-4">
            <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50">
              <h3 className="text-white font-semibold flex items-center gap-2 mb-2"><Smartphone size={18} className="text-green-400"/> No Android (Chrome)</h3>
              <ol className="text-sm text-slate-400 space-y-2 list-decimal list-inside">
                <li>Abra o site no <strong>Google Chrome</strong>.</li>
                <li>Toque nos <strong>três pontinhos</strong> no canto superior direito.</li>
                <li>Selecione <strong>"Instalar aplicativo"</strong> ou "Adicionar à tela inicial".</li>
                <li>Confirme. O ícone do escudo vai aparecer na tela do seu celular!</li>
              </ol>
            </div>
            
            <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50">
              <h3 className="text-white font-semibold flex items-center gap-2 mb-2"><Smartphone size={18} className="text-blue-400"/> No iPhone (Safari)</h3>
              <ol className="text-sm text-slate-400 space-y-2 list-decimal list-inside">
                <li>Abra o site no <strong>Safari</strong>.</li>
                <li>Toque no botão de <strong>Compartilhar</strong> (quadrado com seta para cima).</li>
                <li>Role para baixo e selecione <strong>"Adicionar à Tela de Início"</strong>.</li>
                <li>Toque em Adicionar. Pronto!</li>
              </ol>
            </div>
            
            <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50">
              <h3 className="text-white font-semibold flex items-center gap-2 mb-2"><Monitor size={18} className="text-slate-300"/> No Computador</h3>
              <ol className="text-sm text-slate-400 space-y-2 list-decimal list-inside">
                <li>Acesse pelo Chrome ou Edge.</li>
                <li>Na barra de endereços (onde fica o link), clique no ícone de <strong>download ou monitor com setinha</strong> no canto direito.</li>
                <li>Clique em Instalar.</li>
              </ol>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-500/20 text-green-400 rounded-xl">
              <Share2 size={24} />
            </div>
            <h2 className="text-xl font-bold text-white">Como Compartilhar</h2>
          </div>
          <p className="text-slate-300 text-sm mb-4 leading-relaxed">
            Ajude a sua comunidade a ficar mais segura compartilhando o aplicativo no WhatsApp e Facebook.
          </p>
          <ul className="text-sm text-slate-400 space-y-3">
            <li className="flex items-start gap-2">
              <ChevronRight size={16} className="text-green-500 shrink-0 mt-0.5" />
              <span><strong>WhatsApp:</strong> Ao colar o link <code>https://alertacriminal.com.br/</code> no WhatsApp, aguarde uns 2 a 3 segundos antes de enviar. O WhatsApp vai carregar a foto do nosso Escudo Oficial e a descrição do app automaticamente!</span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight size={16} className="text-blue-500 shrink-0 mt-0.5" />
              <span><strong>Facebook:</strong> Cole o mesmo link no seu mural ou envie via Messenger. A imagem oficial otimizada será carregada.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
