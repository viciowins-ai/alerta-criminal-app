import React from 'react';
import { TopBar } from '../components/TopBar';
import { ShieldCheck, Share2, Download, Smartphone, Monitor, ChevronRight, Map, AlertTriangle, ShieldAlert, Route, Users, Award, BookOpen, Plus, ShieldCheck } from 'lucide-react';

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
                <p className="text-sm text-slate-400 leading-relaxed mb-3">
                  <strong>Novidade:</strong> Ao tocar em um alerta no mapa, você pode visualizar as <strong>fotos e vídeos</strong> da ocorrência diretamente na janelinha! Toque na mídia para abri-la em tela cheia.
                </p>
                
                <h4 className="text-xs font-bold text-slate-300 mb-2 uppercase">Botões do Mapa (Direita):</h4>
                <ul className="text-sm text-slate-400 space-y-2">
                  <li><strong>Filtro (Lupa/Funil):</strong> Escolha ver apenas roubos, atitudes suspeitas ou filtre por tempo (ex: últimas 24h).</li>
                  <li><strong>Escudo Azul:</strong> Ativa o "Meu Guardião", transmitindo sua localização para pessoas de confiança.</li>
                  <li><strong>Lua:</strong> Ativa o "Modo Pânico" (Tela Escura). A tela ficará totalmente preta (como se estivesse desligada). Com a tela preta, dê 3 toques rápidos nela ou chacoalhe o celular para acionar o S.O.S secretamente. Para sair, dê dois toques rápidos no canto superior direito.</li>
                  <li><strong>Alvo:</strong> Centraliza o mapa na sua posição atual e calibra o GPS com extrema precisão.</li>
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
                <p className="text-sm text-slate-400 leading-relaxed mb-3">O botão de escudo vermelho no canto direito do mapa. Use-o <strong>apenas</strong> em caso de perigo real!</p>
                <ul className="text-sm text-slate-400 space-y-2 list-disc pl-4">
                  <li>Inicia automaticamente uma <strong>gravação de áudio de 10 segundos</strong> do ambiente para registro de evidências.</li>
                  <li>Gera um link de rastreio da sua localização ao vivo.</li>
                  <li>Permite compartilhar rapidamente o link com seus Contatos de Confiança via WhatsApp.</li>
                  <li>Oferece um atalho para ligação imediata para a Polícia (190).</li>
                </ul>
              </div>
            </div>

            {/* Modo Guardião */}
            <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50 flex gap-4 items-start">
              <div className="bg-blue-500/20 p-2 rounded-lg shrink-0 mt-1">
                <ShieldCheck size={20} className="text-blue-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Modo Guardião & Camuflagem</h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-2">Acesse pelo menu lateral. O Modo Guardião rastreia sua localização em tempo real e a compartilha com seus <strong>Contatos de Confiança</strong>.</p>
                <p className="text-sm text-slate-400 leading-relaxed"><strong>Camuflagem de Tela:</strong> Durante o uso, você pode ativar a camuflagem (que deixa o app com aparência de página de busca do Google) para despistar olhares suspeitos. Pressione a tela por 2 segundos para destrancar.</p>
              </div>
            </div>

            {/* Aviso de Rastreamento */}
            <div className="bg-orange-500/10 p-4 rounded-2xl border border-orange-500/30 flex gap-4 items-start">
              <div className="bg-orange-500/20 p-2 rounded-lg shrink-0 mt-1">
                <AlertTriangle size={20} className="text-orange-400" />
              </div>
              <div>
                <h3 className="text-orange-400 font-semibold mb-2">Como manter o rastreio ativo?</h3>
                <p className="text-sm text-slate-300 leading-relaxed mb-3">Para que o SOS e o Modo Guardião funcionem sem interrupções (já que o sistema do seu celular pode cortar o GPS), siga as 3 regras de ouro:</p>
                <ul className="text-sm text-slate-300 space-y-3 list-decimal pl-4">
                  <li><strong>Não minimize o app:</strong> Deixe-o aberto! O aplicativo impedirá que a tela desligue sozinha. Se precisar esconder, use a <strong>Camuflagem</strong>.</li>
                  <li><strong>Localização Precisa:</strong> Garanta que a permissão de GPS esteja como "Sempre" ou "Durante o uso" com <strong>Alta Precisão</strong> ativada.</li>
                  <li><strong>Economia de Energia:</strong> Evite o modo "Economia de Bateria" do celular, pois ele desliga a antena do GPS para poupar carga.</li>
                </ul>
              </div>
            </div>

            {/* Grupos Privados */}
            <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50 flex gap-4 items-start">
              <div className="bg-purple-500/20 p-2 rounded-lg shrink-0 mt-1">
                <Users size={20} className="text-purple-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Grupos Privados</h3>
                <p className="text-sm text-slate-400 leading-relaxed">Disponível na aba "Perfil". Crie um grupo criptografado e fechado para a sua rua, vizinhança ou condomínio. Alertas enviados de forma restrita <strong>só podem ser vistos pelos seus membros</strong>, garantindo total privacidade.</p>
              </div>
            </div>

            {/* Reportar */}
            <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50 flex gap-4 items-start">
              <div className="bg-blue-500/20 p-2 rounded-lg shrink-0 mt-1">
                <Plus size={20} className="text-blue-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Botão Reportar (Sinal de +)</h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-3">O grande botão azul com o sinal de "+" bem no centro da barra inferior.</p>
                <p className="text-sm text-slate-400 leading-relaxed mb-3">Viu algo suspeito ou foi vítima? Ajude outras pessoas! Registre furtos, assaltos ou atitudes suspeitas adicionando <strong>fotos, vídeos e descrição.</strong></p>
                <p className="text-sm text-slate-400 leading-relaxed"><strong>GPS Inteligente:</strong> A tela de reportes puxa automaticamente sua última localização com a precisão máxima calculada pelo mapa, garantindo que o seu alerta seja colocado no local correto!</p>
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
                <p className="text-sm text-slate-400 leading-relaxed">Vai sair a pé, de bicicleta, carro ou moto? O aplicativo traçará a rota mais segura até o seu destino, desviando automaticamente de ruas e regiões perigosas (locais com muitos alertas recentes).</p>
              </div>
            </div>

            {/* Feed */}
            <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50 flex gap-4 items-start">
              <div className="bg-green-500/20 p-2 rounded-lg shrink-0 mt-1">
                <Users size={20} className="text-green-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Feed da Comunidade</h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-3">Fique por dentro dos alertas e avisos da sua comunidade. Você também pode verificar (curtir) alertas de outras pessoas para confirmar que aquela ocorrência foi real, ajudando a combater informações falsas.</p>
                <p className="text-sm text-slate-400 leading-relaxed"><strong>Ver no Mapa:</strong> Agora, cada alerta no Feed possui um botão <strong>"Ver no mapa"</strong>. Ao tocar nele, você é levado instantaneamente até o local exato da ocorrência!</p>
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
            O Alerta Criminal é um Web App Progressivo (PWA). Isso significa que você pode instalá-lo diretamente do seu navegador, sem precisar da loja de aplicativos, economizando memória no seu celular!
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
