import React from 'react';
import { TopBar } from '../components/TopBar';
import { ShieldAlert, AlertTriangle } from 'lucide-react';

export function TermsPage() {
  return (
    <div className="flex flex-col h-full bg-slate-900">
      <TopBar title="Termos de Uso" />
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
        
        <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700">
          <h2 className="text-xl font-bold text-white mb-4">1. Aceitação dos Termos</h2>
          <p className="text-sm text-slate-300 leading-relaxed mb-4">
            Ao acessar e utilizar o aplicativo <strong>Alerta Criminal</strong>, você concorda com estes Termos de Uso. Se você não concordar com qualquer parte destes termos, não deverá utilizar o aplicativo.
          </p>
          
          <h2 className="text-xl font-bold text-white mb-4 mt-6">2. Propósito do Aplicativo</h2>
          <p className="text-sm text-slate-300 leading-relaxed mb-4">
            O Alerta Criminal é uma plataforma de cunho colaborativo e comunitário, destinada ao compartilhamento de informações sobre segurança pública entre os próprios usuários. <strong>Não somos um órgão governamental, policial ou serviço de emergência oficial.</strong>
          </p>
          
          <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert className="text-red-500" size={20} />
              <h3 className="text-red-500 font-bold">3. ISENÇÃO DE RESPONSABILIDADE (CRÍTICO)</h3>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              O uso do aplicativo é de inteira responsabilidade do usuário. Os criadores, desenvolvedores e mantenedores do Alerta Criminal <strong>NÃO SE RESPONSABILIZAM</strong> por:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-2 text-sm text-slate-300">
              <li>Qualquer dano físico, moral, material, psicológico ou de qualquer outra natureza decorrente do uso ou da impossibilidade de uso do aplicativo.</li>
              <li>Inatidão, falsidade, ou atraso nas informações (alertas) publicadas por outros usuários.</li>
              <li>Falhas de conexão, bugs, imprecisão do GPS, falha no envio do alerta SOS, ou qualquer falha técnica que impeça o funcionamento ideal do aplicativo em momentos de emergência.</li>
              <li>Decisões tomadas com base nas "Rotas Seguras" ou nos alertas do mapa, visto que são gerados baseados em probabilidade e relatos de terceiros.</li>
            </ul>
          </div>

          <h2 className="text-xl font-bold text-white mb-4 mt-6">4. Acionamento de Emergência</h2>
          <p className="text-sm text-slate-300 leading-relaxed mb-4">
            O botão SOS e os recursos do aplicativo <strong>NÃO SUBSTITUEM</strong> o contato direto com as autoridades policiais. Em caso de emergência real, o usuário deve imediatamente acionar a Polícia Militar (190), SAMU (192) ou Bombeiros (193).
          </p>

          <h2 className="text-xl font-bold text-white mb-4 mt-6">5. Conduta do Usuário</h2>
          <p className="text-sm text-slate-300 leading-relaxed mb-4">
            O usuário se compromete a:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm text-slate-300 mb-4">
            <li>Publicar alertas verdadeiros, sob pena de banimento da plataforma.</li>
            <li>Não utilizar o aplicativo para perseguição, difamação, calúnia, ou envio de falsas comunicações de crime, o que constitui crime perante a legislação penal brasileira (Art. 340 do Código Penal).</li>
            <li>Não expor dados pessoais, placas de veículos ou rostos de pessoas inocentes sem justificativa clara de segurança.</li>
          </ul>
        </div>
        
        <div className="text-center text-xs text-slate-500 pb-4">
          Última atualização: 29 de Agosto de 2026
        </div>
      </div>
    </div>
  );
}
