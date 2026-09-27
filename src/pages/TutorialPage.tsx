import React from 'react';
import { Link } from 'react-router-dom';
import { TopBar } from '../components/TopBar';
import { 
  ShieldCheck, 
  Share2, 
  Download, 
  Smartphone, 
  Monitor, 
  ChevronRight, 
  Map, 
  AlertTriangle, 
  ShieldAlert, 
  Route, 
  Users, 
  Award, 
  BookOpen, 
  Plus, 
  Moon, 
  Wrench, 
  PhoneCall, 
  Crosshair, 
  Lock,
  Globe
} from 'lucide-react';

export function TutorialPage() {
  return (
    <div className="flex flex-col h-full bg-slate-900">
      <TopBar title="Tutorial de Uso" showBack={true} />
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-20">
        
        {/* Bloco Geral de Recursos */}
        <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl">
              <BookOpen size={24} />
            </div>
            <h2 className="text-xl font-bold text-white">Como Usar os Recursos</h2>
          </div>
          <p className="text-slate-300 text-sm mb-6 leading-relaxed">
            Aprenda a utilizar todas as ferramentas e novos recursos do Alerta Criminal para proteger você, sua família e sua comunidade.
          </p>
          
          <div className="space-y-4">
            {/* 1. Mapa de Risco */}
            <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50 flex gap-4 items-start">
              <div className="bg-blue-500/20 p-2 rounded-lg shrink-0 mt-1">
                <Map size={20} className="text-blue-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Mapa de Risco & Mancha Criminal</h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-3">
                  Visualize ocorrências recentes ao seu redor. As áreas "mais quentes" (vermelhas no Mapa de Calor) indicam maior concentração de perigo.
                </p>
                <p className="text-sm text-slate-300 leading-relaxed mb-3 bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
                  <strong className="text-blue-400">Mídias no Mapa:</strong> Ao tocar em qualquer alerta no mapa, você pode visualizar as <strong>fotos e vídeos</strong> da ocorrência diretamente na janelinha! Toque na mídia para abri-la em tela cheia.
                </p>
                
                <h4 className="text-xs font-bold text-slate-300 mb-2 uppercase">Botões de Controle do Mapa (Direita):</h4>
                <ul className="text-sm text-slate-400 space-y-2">
                  <li><strong>Filtro (Lupa/Funil):</strong> Escolha ver apenas roubos, atitudes suspeitas, zeladoria ou filtre por tempo (ex: últimas 24h, 7 dias).</li>
                  <li><strong>Escudo Azul:</strong> Ativa instantaneamente o "Meu Guardião", transmitindo sua rota para pessoas de confiança.</li>
                  <li><strong>Lua (Modo Pânico):</strong> Ativa a tela escura anti-assalto com disfarce.</li>
                  <li><strong>Alvo (Mira GPS):</strong> Centraliza o mapa na sua posição atual e recalibra a antena com máxima precisão.</li>
                </ul>
              </div>
            </div>

            {/* 2. Botão SOS */}
            <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50 flex gap-4 items-start">
              <div className="bg-red-500/20 p-2 rounded-lg shrink-0 mt-1">
                <ShieldAlert size={20} className="text-red-500" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Botão SOS (Emergência)</h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-3">
                  O botão de escudo vermelho no canto direito do mapa. Use-o <strong>apenas</strong> em caso de perigo real!
                </p>
                <ul className="text-sm text-slate-400 space-y-2 list-disc pl-4">
                  <li>Inicia automaticamente uma <strong>gravação de áudio de 10 segundos</strong> do ambiente em segundo plano para registro de provas.</li>
                  <li>Gera um link exclusivo de rastreio da sua localização ao vivo.</li>
                  <li>Dispara mensagens imediatas com seu link para os seus <strong>Contatos de Confiança</strong> via WhatsApp.</li>
                  <li>Oferece um atalho de discagem rápida para ligação com a Polícia (190).</li>
                </ul>
              </div>
            </div>

            {/* 3. Modo Guardião & Camuflagem */}
            <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50 flex gap-4 items-start">
              <div className="bg-blue-500/20 p-2 rounded-lg shrink-0 mt-1">
                <ShieldCheck size={20} className="text-blue-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Modo Guardião & Camuflagem</h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-2">
                  Ideal para quando estiver voltando para casa, caminhando sozinho ou em transporte por aplicativo. O Modo Guardião monitora seu percurso contínuo.
                </p>
                <p className="text-sm text-slate-400 leading-relaxed mb-2">
                  Se você não confirmar que chegou bem ao destino dentro do tempo estipulado, o sistema enviará um aviso de alerta automático aos seus contatos cadastrados.
                </p>
                <p className="text-sm text-slate-300 leading-relaxed bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
                  <strong className="text-blue-400">Camuflagem de Tela:</strong> Toque no ícone de olho cortado durante o uso para transformar a tela em uma falsa pesquisa do Google, despistando olhares curiosos sem interromper a transmissão do GPS. Para destrancar: mantenha a tela pressionada por 2 segundos.
                </p>
              </div>
            </div>

            {/* 4. Aviso de Rastreamento (Regras de Ouro) */}
            <div className="bg-orange-500/10 p-4 rounded-2xl border border-orange-500/30 flex gap-4 items-start">
              <div className="bg-orange-500/20 p-2 rounded-lg shrink-0 mt-1">
                <AlertTriangle size={20} className="text-orange-400" />
              </div>
              <div>
                <h3 className="text-orange-400 font-semibold mb-2">Como manter o rastreio ativo?</h3>
                <p className="text-sm text-slate-300 leading-relaxed mb-3">
                  Para que o SOS e o Modo Guardião funcionem sem cortes (já que o sistema operacional pode suspender o GPS para economizar carga), siga as 3 regras de ouro:
                </p>
                <ul className="text-sm text-slate-300 space-y-3 list-decimal pl-4">
                  <li><strong>Não minimize o app:</strong> Deixe-o aberto na tela. O aplicativo impede que a tela se apague sozinha. Se precisar esconder, ative a <strong>Camuflagem</strong>.</li>
                  <li><strong>Localização Precisa:</strong> Garanta que a permissão de GPS esteja como "Sempre" ou "Durante o uso" com <strong>Alta Precisão</strong> ativada.</li>
                  <li><strong>Economia de Energia:</strong> Desative a "Economia de Bateria" do celular durante o trajeto, pois ela desliga o chip GPS.</li>
                </ul>
              </div>
            </div>

            {/* 5. Modo Pânico (Tela Escura Anti-Assalto) */}
            <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50 flex gap-4 items-start">
              <div className="bg-yellow-500/20 p-2 rounded-lg shrink-0 mt-1">
                <Moon size={20} className="text-yellow-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Modo Pânico (Tela Escura Anti-Assalto)</h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-3">
                  Acesse pelo botão de <strong>Lua (🌙)</strong> no menu ou no mapa. Se você for abordado ou forçado a entregar o celular desbloqueado, ative-o imediatamente.
                </p>
                <ul className="text-sm text-slate-400 space-y-2 list-disc pl-4 mb-3">
                  <li>A tela fica <strong>totalmente preta e bloqueada</strong>, simulando que o aparelho está desligado ou travado, protegendo seus dados e aplicativos bancários.</li>
                  <li><strong>SOS Secreto:</strong> Com a tela preta ativada, dê <strong>3 toques rápidos</strong> em qualquer lugar da tela ou <strong>chacoalhe o celular</strong> com firmeza para acionar o SOS silenciosamente para seus contatos.</li>
                  <li><strong>Como sair do Modo Pânico:</strong> Dê dois toques rápidos exatamente no canto superior direito da tela.</li>
                </ul>
              </div>
            </div>

            {/* 6. Zeladoria e Riscos Ambientais */}
            <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50 flex gap-4 items-start">
              <div className="bg-cyan-500/20 p-2 rounded-lg shrink-0 mt-1">
                <Wrench size={20} className="text-cyan-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Zeladoria & Riscos Ambientais (🚧)</h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-2">
                  Segurança pública também depende de prevenção urbana. Reportar riscos estruturais é tão importante quanto relatar assaltos:
                </p>
                <ul className="text-sm text-slate-400 space-y-2 list-disc pl-4 mb-2">
                  <li><strong>Iluminação pública defeituosa:</strong> Ruas escuras e postes apagados atraem criminosos e favorecem emboscadas.</li>
                  <li><strong>Mato alto e entulho:</strong> Escondem suspeitos e bloqueiam visibilidade.</li>
                  <li><strong>Buracos e áreas alagadas:</strong> Impedem o tráfego seguro de pedestres, ciclistas e veículos de emergência.</li>
                  <li><strong>Fios caídos ou rompidos:</strong> Risco iminente de choque e cortes de energia.</li>
                </ul>
                <p className="text-xs text-cyan-300/80">
                  Marque esses pontos no mapa para alertar a comunidade e gerar dados para cobrança de melhorias públicas.
                </p>
              </div>
            </div>

            {/* 7. Contatos de Confiança */}
            <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50 flex gap-4 items-start">
              <div className="bg-emerald-500/20 p-2 rounded-lg shrink-0 mt-1">
                <PhoneCall size={20} className="text-emerald-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Contatos de Confiança</h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-2">
                  Acesse pelo menu lateral ou Perfil na seção <strong>"Contatos de Confiança"</strong>. Cadastre até 5 parentes ou amigos próximos com telefone de WhatsApp.
                </p>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Em qualquer situação de risco (SOS ou atraso no Guardião), essas pessoas são notificadas imediatamente com o link para acompanhar sua localização ao vivo.
                </p>
              </div>
            </div>

            {/* 8. Grupos Privados */}
            <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50 flex gap-4 items-start">
              <div className="bg-purple-500/20 p-2 rounded-lg shrink-0 mt-1">
                <Lock size={20} className="text-purple-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Grupos Privados (Redes de Vizinhança)</h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-2">
                  Crie ou participe de Redes Privadas para a sua rua, vizinhança protegida, condomínio ou família através de códigos de convite seguros.
                </p>
                <p className="text-sm text-slate-400 leading-relaxed">
                  <strong>Trava de Privacidade:</strong> Alertas publicados como Privados aparecem com o ícone de cadeado (🔒) e <strong>só podem ser visualizados pelos membros daquele grupo</strong>, garantindo total sigilo. Eles nunca aparecem no feed público geral.
                </p>
              </div>
            </div>

            {/* 9. Botão Reportar */}
            <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50 flex gap-4 items-start">
              <div className="bg-blue-500/20 p-2 rounded-lg shrink-0 mt-1">
                <Plus size={20} className="text-blue-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Botão Reportar (Sinal de +)</h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-3">
                  O grande botão azul central na barra inferior. Presenciou algo ou foi vítima? Ajude outras pessoas:
                </p>
                <ul className="text-sm text-slate-400 space-y-2 list-disc pl-4 mb-3">
                  <li>Escolha o tipo: Roubo/Furto, Atividade Suspeita, Zeladoria/Risco ou Vandalismo.</li>
                  <li>Adicione <strong>fotos e vídeos</strong> gravados na hora ou da sua galeria.</li>
                  <li>Defina a visibilidade: <strong>Alerta Público</strong> (para todos) ou restrito a um <strong>Grupo Privado</strong>.</li>
                  <li><strong>GPS Inteligente:</strong> Puxa automaticamente sua posição exata com cálculo de precisão.</li>
                </ul>
                <div className="p-3 bg-slate-800/70 border border-slate-700 rounded-xl text-xs text-slate-300">
                  <span className="font-bold text-blue-400 block mb-1">Dica de Correção:</span>
                  Se você enviar um alerta com informações trocadas ou categoria errada, vá na aba <strong>Feed</strong>, localize o seu reporte e toque no botão <strong>"Corrigir"</strong>.
                </div>
              </div>
            </div>

            {/* 10. Rotas Seguras */}
            <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50 flex gap-4 items-start">
              <div className="bg-indigo-500/20 p-2 rounded-lg shrink-0 mt-1">
                <Route size={20} className="text-indigo-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Rotas Seguras (Desvio Inteligente)</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Vai se deslocar a pé, de bicicleta, carro ou moto? Em vez de calcular apenas o caminho mais curto, o aplicativo mapeia a <strong>Rota Mais Segura</strong>, desviando dinamicamente de ruas com histórico recente de assaltos e alertas críticos.
                </p>
              </div>
            </div>

            {/* 11. Feed da Comunidade */}
            <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50 flex gap-4 items-start">
              <div className="bg-green-500/20 p-2 rounded-lg shrink-0 mt-1">
                <Users size={20} className="text-green-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Feed da Comunidade (Rede Comunitária)</h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-3">
                  A linha do tempo do seu bairro com alertas em tempo real, comentários e mídias.
                </p>
                <ul className="text-sm text-slate-400 space-y-2 list-disc pl-4 mb-3">
                  <li><strong>Abas de Navegação:</strong> Alterne facilmente entre <strong>🚨 Alertas Públicos</strong> e <strong>🔒 Redes Privadas</strong> dos seus grupos.</li>
                  <li><strong>Botão "Ver no mapa":</strong> Toque nele em qualquer publicação para ir diretamente até a coordenada exata da ocorrência.</li>
                  <li><strong>Selo "Verificado":</strong> Outros moradores podem confirmar alertas reais. Quando acumula confirmações, o reporte ganha o selo verde oficial de autenticidade contra trotes.</li>
                </ul>
              </div>
            </div>

            {/* 12. Precisão de GPS */}
            <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50 flex gap-4 items-start">
              <div className="bg-blue-500/20 p-2 rounded-lg shrink-0 mt-1">
                <Crosshair size={20} className="text-blue-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Precisão da Localização (Celular vs PC)</h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-2">
                  O Alerta Criminal oferece máxima eficácia em smartphones:
                </p>
                <ul className="text-sm text-slate-400 space-y-2 list-disc pl-4 mb-2">
                  <li><strong>No Celular:</strong> Possui antena GNSS/GPS dedicada. Mantenha a "Localização de Alta Precisão" ativa para localização milimétrica.</li>
                  <li><strong>No Computador (PC/Notebook):</strong> PCs não possuem antena GPS e estimam a localização pela rede de internet, podendo apresentar divergências de bairro.</li>
                </ul>
                <p className="text-xs text-slate-300 bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
                  <strong className="text-blue-400">Dica para PC:</strong> Se estiver no computador e a localização estiver imprecisa, use a barra de busca de endereço no mapa ou arraste o pino manualmente ao reportar!
                </p>
              </div>
            </div>

            {/* 13. Pontos e Níveis */}
            <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50 flex gap-4 items-start">
              <div className="bg-yellow-500/20 p-2 rounded-lg shrink-0 mt-1">
                <Award size={20} className="text-yellow-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Pontos (XP) & Selo de Verificado</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Ganhe experiência ao colaborar com a comunidade: criando reportes verídicos, confirmando ocorrências de vizinhos ou convidando moradores. Ao alcançar o Nível Ouro (500 XP), você desbloqueia o <strong>Selo de Verificado Oficial</strong> no seu perfil, concedendo máxima relevância aos seus alertas!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bloco de Instalação (PWA) */}
        <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-500/20 text-blue-400 rounded-xl">
              <Download size={24} />
            </div>
            <h2 className="text-xl font-bold text-white">Como Instalar o Aplicativo (PWA)</h2>
          </div>
          <p className="text-slate-300 text-sm mb-6 leading-relaxed">
            O Alerta Criminal é um Web App Progressivo (PWA). Você pode instalá-lo diretamente pelo navegador sem consumir a memória pesada de lojas de aplicativos!
          </p>
          
          <div className="space-y-4">
            <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50">
              <h3 className="text-white font-semibold flex items-center gap-2 mb-2">
                <Smartphone size={18} className="text-green-400"/> No Android (Google Chrome)
              </h3>
              <ol className="text-sm text-slate-400 space-y-2 list-decimal list-inside">
                <li>Abra o site <strong>https://alertacriminal.com.br/</strong> no Chrome.</li>
                <li>Toque no menu de <strong>três pontinhos (⋮)</strong> no canto superior direito.</li>
                <li>Toque em <strong>"Instalar aplicativo"</strong> ou "Adicionar à tela inicial".</li>
                <li>Confirme. O ícone oficial do Escudo aparecerá junto aos seus aplicativos!</li>
              </ol>
            </div>
            
            <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50">
              <h3 className="text-white font-semibold flex items-center gap-2 mb-2">
                <Smartphone size={18} className="text-blue-400"/> No iPhone / iPad (Safari)
              </h3>
              <ol className="text-sm text-slate-400 space-y-2 list-decimal list-inside">
                <li>Abra o site no navegador <strong>Safari</strong>.</li>
                <li>Toque no botão central de <strong>Compartilhar</strong> (quadrado com seta para cima).</li>
                <li>Role a lista para baixo e toque em <strong>"Adicionar à Tela de Início"</strong>.</li>
                <li>Toque em Adicionar no topo direito. Pronto!</li>
              </ol>
            </div>
            
            <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50">
              <h3 className="text-white font-semibold flex items-center gap-2 mb-2">
                <Monitor size={18} className="text-slate-300"/> No Computador (Chrome / Edge)
              </h3>
              <ol className="text-sm text-slate-400 space-y-2 list-decimal list-inside">
                <li>Acesse pelo Google Chrome ou Microsoft Edge.</li>
                <li>Na barra de endereços (ao lado da estrela/link), clique no ícone de <strong>instalação (computador com seta para baixo)</strong>.</li>
                <li>Clique em Instalar. O app abrirá em uma janela nativa independente.</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Bloco de Compartilhamento */}
        <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-500/20 text-green-400 rounded-xl">
              <Share2 size={24} />
            </div>
            <h2 className="text-xl font-bold text-white">Como Compartilhar Oficialmente</h2>
          </div>
          <p className="text-slate-300 text-sm mb-4 leading-relaxed">
            Multiplique a segurança da sua rua e bairro convidando vizinhos e familiares para a rede.
          </p>
          <ul className="text-sm text-slate-400 space-y-3">
            <li className="flex items-start gap-2">
              <ChevronRight size={16} className="text-green-500 shrink-0 mt-0.5" />
              <span>
                <strong>No WhatsApp:</strong> Cole o link <code>https://alertacriminal.com.br/</code> no grupo da sua rua ou família e <strong>aguarde de 2 a 3 segundos</strong> antes de tocar em enviar. A imagem oficial do nosso Escudo e o resumo do app carregarão automaticamente na miniatura!
              </span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight size={16} className="text-blue-500 shrink-0 mt-0.5" />
              <span>
                <strong>No Facebook e Redes:</strong> Compartilhe no seu perfil, grupos de bairro ou envie via Messenger para expandir a rede de vigilância comunitária.
              </span>
            </li>
          </ul>
        </div>

        {/* Bloco de Idiomas Internacionais */}
        <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-500/20 text-blue-400 rounded-xl">
              <Globe size={24} />
            </div>
            <h2 className="text-xl font-bold text-white">Versões em Outros Idiomas</h2>
          </div>
          <p className="text-slate-300 text-sm mb-4 leading-relaxed">
            O Alerta Criminal disponibiliza páginas de instruções otimizadas para turistas, residentes e motores de busca globais em 7 idiomas principais:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <Link to="/como-usar" className="p-3 bg-slate-900 hover:bg-slate-700/60 transition-all rounded-xl border border-slate-700 text-sm text-white font-medium flex items-center gap-2">
              <span>🇧🇷</span> Português
            </Link>
            <Link to="/en/how-to-use" className="p-3 bg-slate-900 hover:bg-slate-700/60 transition-all rounded-xl border border-slate-700 text-sm text-white font-medium flex items-center gap-2">
              <span>🇺🇸</span> English
            </Link>
            <Link to="/es/como-usar" className="p-3 bg-slate-900 hover:bg-slate-700/60 transition-all rounded-xl border border-slate-700 text-sm text-white font-medium flex items-center gap-2">
              <span>🇪🇸</span> Español
            </Link>
            <Link to="/fr/comment-utiliser" className="p-3 bg-slate-900 hover:bg-slate-700/60 transition-all rounded-xl border border-slate-700 text-sm text-white font-medium flex items-center gap-2">
              <span>🇫🇷</span> Français
            </Link>
            <Link to="/it/come-usare" className="p-3 bg-slate-900 hover:bg-slate-700/60 transition-all rounded-xl border border-slate-700 text-sm text-white font-medium flex items-center gap-2">
              <span>🇮🇹</span> Italiano
            </Link>
            <Link to="/hi/kaise-upyog-kare" className="p-3 bg-slate-900 hover:bg-slate-700/60 transition-all rounded-xl border border-slate-700 text-sm text-white font-medium flex items-center gap-2">
              <span>🇮🇳</span> हिन्दी
            </Link>
            <Link to="/ar/kayfiat-alastikhdam" className="p-3 bg-slate-900 hover:bg-slate-700/60 transition-all rounded-xl border border-slate-700 text-sm text-white font-medium flex items-center gap-2">
              <span>🇸🇦</span> العربية
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
