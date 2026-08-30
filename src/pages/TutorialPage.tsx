import React from 'react';
import { TopBar } from '../components/TopBar';
import { Share2, Download, Smartphone, Monitor, ChevronRight, Map, AlertTriangle, ShieldAlert, Route, Users, Award, BookOpen } from 'lucide-react';

export function TutorialPage() {
  return (
    <div className="flex flex-col h-full bg-slate-900">
      <TopBar title="Tutorial de Uso" showBack={true} />
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-20">
        
        <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl">
              <BookOpen size={24} />
            </div>
            <h2 className="text-xl font-bold text-white">Como Usar os Recursos</h2>
          </div>
          <p className="text-slate-300 text-sm mb-6 leading-relaxed">
            Aprenda a utilizar as principais ferramentas do Alerta Criminal para proteger você e sua comunidade.
          </p>
          
          <div className="space-y-4">
            {/* Mapa */}
            <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50 flex gap-4 items-start">
              <div className="bg-blue-500/20 p-2 rounded-lg shrink-0 mt-1">
                <Map size={20} className="text-blue-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Mapa de Risco</h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-3">Visualize ocorrências recentes ao seu redor. As áreas "mais quentes" (vermelhas) indicam maior perigo.</p>
                
                <h4 className="text-xs font-bold text-slate-300 mb-2 uppercase">Botões do Mapa (Direita):</h4>
                <ul className="text-sm text-slate-400 space-y-2">
                  <li><strong>Filtro (Lupa/Funil):</strong> Escolha ver apenas roubos, atitudes suspeitas ou filtre por tempo (ex: últimas 24h).</li>
                  <li><strong>Escudo Azul:</strong> Ativa o "Meu Guardião", transmitindo sua localização para pessoas de confiança.</li>
                  <li><strong>Lua/Sol:</strong> Muda o mapa para o modo claro ou escuro.</li>
                  <li><strong>Alvo:</strong> Centraliza o mapa na sua posição atual.</li>
                </ul>
              </div>
            </div>

            {/* Botão SOS */}
            <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50 flex gap-4 items-start">
              <div className="bg-red-500/20 p-2 rounded-lg shrink-0 mt-1">
                <ShieldAlert size={20} className="text-red-500" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Botão SOS (Emergência)</h3>
                <p className="text-sm text-slate-400 leading-relaxed">O grande botão vermelho na barra inferior. Use-o <strong>apenas</strong> em caso de perigo real! Ele gera um link de rastreio da sua localização ao vivo e permite enviar rapidamente para seus Contatos de Confiança via SMS ou WhatsApp.</p>
              </div>
            </div>

            {/* Reportar */}
            <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50 flex gap-4 items-start">
              <div className="bg-orange-500/20 p-2 rounded-lg shrink-0 mt-1">
                <AlertTriangle size={20} className="text-orange-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Reportar Ocorrência</h3>
                <p className="text-sm text-slate-400 leading-relaxed">Viu algo suspeito ou foi vítima? Ajude outras pessoas! Registre furtos, assaltos ou atitudes suspeitas adicionando fotos, vídeos e a localização exata do ocorrido.</p>
                <div className="mt-3 p-3 bg-slate-800/50 border border-slate-700 rounded-xl text-xs text-slate-300">
                  <span className="font-bold text-blue-400 block mb-1">Dica de Correção:</span>
                  Se você enviar e errar o tipo da ocorrência, vá na aba <strong>Feed</strong>, procure o seu alerta e toque no botão <strong>"Corrigir"</strong>.
                </div>
              </div>
            </div>

            {/* Rotas */}
            <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50 flex gap-4 items-start">
              <div className="bg-indigo-500/20 p-2 rounded-lg shrink-0 mt-1">
                <Route size={20} className="text-indigo-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Rotas Seguras</h3>
                <p className="text-sm text-slate-400 leading-relaxed">Vai sair a pé ou de bicicleta? O aplicativo traçará uma rota até o seu destino tentando desviar das zonas (ruas) com maior índice de criminalidade e alertas recentes.</p>
              </div>
            </div>

            {/* Feed */}
            <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50 flex gap-4 items-start">
              <div className="bg-green-500/20 p-2 rounded-lg shrink-0 mt-1">
                <Users size={20} className="text-green-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Feed da Comunidade</h3>
                <p className="text-sm text-slate-400 leading-relaxed">Fique por dentro das fofocas e avisos do bairro. Você também pode verificar (curtir) alertas de outras pessoas para confirmar que aquela ocorrência foi real, ajudando a combater informações falsas.</p>
              </div>
            </div>

            {/* Pontos */}
            <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50 flex gap-4 items-start">
              <div className="bg-yellow-500/20 p-2 rounded-lg shrink-0 mt-1">
                <Award size={20} className="text-yellow-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Pontos e Níveis</h3>
                <p className="text-sm text-slate-400 leading-relaxed">Ganhe pontos ao fazer postagens, reportar crimes ou confirmar os alertas de outras pessoas. Suba de nível e ganhe destaque como um Guardião Ativo da sua região!</p>
              </div>
            </div>
          </div>
        </div>

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
