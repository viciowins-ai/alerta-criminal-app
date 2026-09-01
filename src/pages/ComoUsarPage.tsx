import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export function ComoUsarPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans selection:bg-blue-500/30">
      <Helmet>
        <title>Como usar o Alerta Criminal</title>
        <meta name="description" content="Aprenda a utilizar o mapa de risco, botão SOS, Meu Guardião, Modo Pânico, rotas seguras, reportes e demais recursos do Alerta Criminal." />
        
        {/* Open Graph / Facebook / WhatsApp */}
        <meta property="og:title" content="Como usar o Alerta Criminal" />
        <meta property="og:description" content="Aprenda a utilizar o mapa de risco, botão SOS, Meu Guardião, Modo Pânico, rotas seguras, reportes e demais recursos do Alerta Criminal." />
        <meta property="og:url" content="https://alertacriminal.com.br/como-usar" />
        <meta property="og:type" content="article" />
        
        {/* Twitter */}
        <meta name="twitter:title" content="Como usar o Alerta Criminal" />
        <meta name="twitter:description" content="Aprenda a utilizar o mapa de risco, botão SOS, Meu Guardião, Modo Pânico, rotas seguras, reportes e demais recursos do Alerta Criminal." />
      </Helmet>

      <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
            <span className="font-medium">Voltar para o App</span>
          </Link>
          <div className="flex items-center gap-2">
            <img src="/escudo-logo.png" alt="Alerta Criminal Logo" className="w-8 h-8 object-contain" />
            <span className="font-black text-white hidden sm:block">Alerta Criminal</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-12 text-center">
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-6 tracking-tight">Como usar o Alerta Criminal</h1>
          <p className="text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
            Aprenda a utilizar o mapa de risco, botão SOS, Meu Guardião, Modo Pânico, rotas seguras, reportes e demais recursos do Alerta Criminal.
          </p>
        </div>

        <div className="space-y-8">
          <section className="bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <span className="text-2xl">🗺️</span> Como funciona o Mapa de Risco?
            </h2>
            <p className="text-slate-400 leading-relaxed mb-4">
              O Mapa de Risco é a tela principal do aplicativo. Ele exibe em tempo real as ocorrências registradas na sua região. Basta dar zoom nas áreas para visualizar os marcadores de perigo. Você pode tocar no botão de "Filtros" para ativar a visão de <strong>Mapa de Calor</strong> e entender instantaneamente as zonas com maior concentração de alertas.
            </p>
          </section>

          <section className="bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <span className="text-2xl">🚨</span> Como funciona o SOS?
            </h2>
            <p className="text-slate-400 leading-relaxed mb-4">
              O botão SOS (vermelho) serve para emergências reais. Ao ser acionado, ele:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-400 ml-4">
              <li>Grava o áudio do ambiente secretamente (10 segundos).</li>
              <li>Gera um link de rastreamento da sua localização em tempo real.</li>
              <li>Permite o disparo imediato desse link para os seus Contatos de Confiança pré-cadastrados.</li>
              <li>Oferece um atalho para ligar rapidamente para a Polícia (190).</li>
            </ul>
          </section>

          <section className="bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <span className="text-2xl">🛡️</span> Como usar o Meu Guardião?
            </h2>
            <p className="text-slate-400 leading-relaxed mb-4">
              Ideal para quando você estiver andando sozinho, em um carro de aplicativo ou sentindo-se inseguro. Ao ativá-lo, o Alerta Criminal passa a monitorar sua localização continuamente. Se você não confirmar que chegou bem ao destino após o tempo estipulado, o aplicativo envia um alerta automático para seus contatos de confiança.
            </p>
          </section>

          <section className="bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <span className="text-2xl">🌙</span> Como ativar o Modo Pânico?
            </h2>
            <p className="text-slate-400 leading-relaxed mb-4">
              Se você for abordado e obrigado a entregar o celular desbloqueado, toque no botão do <strong>Modo Pânico</strong>. A tela ficará completamente escura e bloqueada, simulando que o celular está desligado ou travado, protegendo seus dados e impedindo o acesso aos seus aplicativos bancários.
            </p>
          </section>

          <section className="bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <span className="text-2xl">📍</span> Como reportar uma ocorrência?
            </h2>
            <p className="text-slate-400 leading-relaxed mb-4">
              No menu inferior, toque no botão azul central <strong>(+)</strong>. O GPS inteligente buscará sua localização exata. Escolha o tipo de crime ou situação suspeita, adicione fotos, vídeos e uma descrição do ocorrido. Esse alerta ajudará a proteger todo o seu bairro.
            </p>
          </section>

          <section className="bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <span className="text-2xl">🛣️</span> Como utilizar as Rotas Seguras?
            </h2>
            <p className="text-slate-400 leading-relaxed mb-4">
              Vá até o menu de navegação e insira o seu destino. Em vez de simplesmente mostrar o caminho mais rápido, o Alerta Criminal calculará a <strong>Rota Mais Segura</strong>, desviando automaticamente de vias onde ocorreram crimes recentemente.
            </p>
          </section>

          <section className="bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <span className="text-2xl">📰</span> Como funciona o Feed?
            </h2>
            <p className="text-slate-400 leading-relaxed mb-4">
              O Feed é a rede social da sua comunidade. Nele, você pode ver as últimas ocorrências em formato de linha do tempo. Você também pode <strong>Confirmar</strong> um alerta se souber que é real. Quando um alerta recebe confirmações suficientes, ele ganha o selo verde de "Verificado".
            </p>
          </section>

          <section className="bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <span className="text-2xl">🏆</span> Como ganhar pontos?
            </h2>
            <p className="text-slate-400 leading-relaxed mb-4">
              Você acumula pontos (XP) sempre que interage positivamente com a plataforma: criando reportes precisos, confirmando alertas de terceiros ou convidando amigos. Ao atingir o Nível Ouro (500 pontos), você recebe um <strong>Selo de Verificado</strong> azul no seu perfil, dando mais credibilidade aos seus alertas perante a comunidade!
            </p>
          </section>

          <section className="bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <span className="text-2xl">📱</span> Como instalar o aplicativo?
            </h2>
            <p className="text-slate-400 leading-relaxed mb-4">
              O Alerta Criminal não precisa ser baixado de lojas de apps. Ele é um Web App Progressivo (PWA), o que significa que é mais leve e seguro.
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-400 ml-4">
              <li><strong>No Android (Chrome):</strong> Toque nos três pontinhos (⋮) e selecione "Instalar aplicativo" ou "Adicionar à tela inicial".</li>
              <li><strong>No iPhone (Safari):</strong> Toque no ícone de Compartilhar e selecione "Adicionar à Tela de Início".</li>
            </ul>
          </section>

          <section className="bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <span className="text-2xl">📤</span> Como compartilhar o Alerta Criminal?
            </h2>
            <p className="text-slate-400 leading-relaxed mb-4">
              Ajude a sua rua a se proteger! Basta copiar o link <code>https://alertacriminal.com.br/</code> e enviar nos grupos de WhatsApp ou no Facebook. Ao colar no WhatsApp, aguarde 3 segundos para que a miniatura oficial com o Escudo seja carregada antes de enviar.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-slate-800 bg-slate-950 py-8 text-center text-slate-500 text-sm mt-12">
        <p>&copy; {new Date().getFullYear()} Alerta Criminal. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
