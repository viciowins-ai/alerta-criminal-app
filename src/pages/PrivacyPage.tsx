import React from 'react';
import { TopBar } from '../components/TopBar';

export function PrivacyPage() {
  return (
    <div className="flex flex-col h-full bg-slate-900">
      <TopBar title="Política de Privacidade" />
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
        
        <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700">
          <p className="text-sm text-slate-300 leading-relaxed mb-6">
            A sua privacidade é fundamental para nós. Esta política explica como coletamos, usamos, e protegemos os seus dados no <strong>Alerta Criminal</strong>.
          </p>
          
          <h2 className="text-lg font-bold text-white mb-3">1. Informações que Coletamos</h2>
          <ul className="list-disc pl-5 space-y-2 text-sm text-slate-300 mb-6">
            <li><strong>Dados de Conta:</strong> Coletamos seu nome de usuário, e-mail e foto de perfil associados à sua conta (via Google ou e-mail).</li>
            <li><strong>Localização (GPS):</strong> Para mostrar alertas relevantes ao seu redor, traçar rotas e ativar o Botão SOS, solicitamos acesso à sua localização em tempo real.</li>
            <li><strong>Conteúdo Gerado:</strong> Textos, fotos e vídeos que você envia ao criar um alerta no Feed ou Mapa.</li>
          </ul>

          <h2 className="text-lg font-bold text-white mb-3">2. Como Usamos seus Dados</h2>
          <ul className="list-disc pl-5 space-y-2 text-sm text-slate-300 mb-6">
            <li>Para exibir alertas geolocalizados a outros usuários do aplicativo (garantindo a função central da plataforma).</li>
            <li>No recurso SOS ("Meu Guardião"), sua localização em tempo real será compartilhada de forma contínua com as pessoas com quem você compartilhar o link de emergência.</li>
            <li>Para calcular a gamificação (Pontos e Níveis de Guardião) associada ao seu perfil.</li>
          </ul>

          <h2 className="text-lg font-bold text-white mb-3">3. Proteção e Retenção</h2>
          <p className="text-sm text-slate-300 leading-relaxed mb-6">
            Utilizamos a infraestrutura de segurança do Google Firebase para armazenar seus dados. Nós <strong>NÃO</strong> vendemos seus dados pessoais para terceiros ou anunciantes. Os dados de alertas públicos permanecerão na base para manter o histórico das "Rotas Seguras", mas usuários podem solicitar exclusão de conta a qualquer momento via plataforma.
          </p>

          <h2 className="text-lg font-bold text-white mb-3">4. Permissões de Dispositivo</h2>
          <p className="text-sm text-slate-300 leading-relaxed mb-6">
            O aplicativo requer permissões de: Câmera (para fotos nos reportes), Microfone (para áudios/vídeos), e Localização (para alertas e SOS). Você pode revogar estas permissões a qualquer momento nas configurações do seu celular, mas algumas funcionalidades ficarão indisponíveis.
          </p>
        </div>
        
        <div className="text-center text-xs text-slate-500 pb-4">
          Última atualização: 29 de Agosto de 2026
        </div>
      </div>
    </div>
  );
}
