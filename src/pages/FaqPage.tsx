import React, { useState } from 'react';
import { TopBar } from '../components/TopBar';
import { ChevronDown, ChevronUp } from 'lucide-react';

const faqs = [
  {
    question: "O aplicativo é gratuito?",
    answer: "Sim! O Alerta Criminal é 100% gratuito para todos os usuários. Nosso objetivo é aumentar a segurança da comunidade de forma colaborativa."
  },
  {
    question: "Como o botão S.O.S funciona?",
    answer: "O botão SOS (escudo vermelho no mapa) serve para emergências reais. Ele inicia automaticamente uma gravação de áudio do ambiente por 10 segundos (anexada ao seu alerta no sistema para segurança), permite ligar rapidamente para a polícia (190) e também cria um link de rastreamento ao vivo que você pode enviar para seus Contatos de Confiança pelo WhatsApp."
  },
  {
    question: "O aplicativo avisa a polícia automaticamente?",
    answer: "Não. O aplicativo é uma rede comunitária. Para acionar a polícia, você deve usar o atalho do SOS para ligar para o 190."
  },
  {
    question: "Como eu corrijo um alerta que enviei errado?",
    answer: "Basta ir na aba 'Feed' (na barra inferior), encontrar a sua publicação e tocar no botão 'Corrigir'. Você poderá alterar o tipo de ocorrência e a descrição."
  },
  {
    question: "Minha localização fica exposta para todo mundo?",
    answer: "Não! Sua localização exata e contínua só é compartilhada quando você ativa o 'Meu Guardião' ou o SOS, e APENAS com quem você enviar o link. O mapa apenas mostra os marcadores gerais das ocorrências reportadas."
  }
];

export function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="flex flex-col h-full bg-slate-900">
      <TopBar title="Perguntas Frequentes" />
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        <p className="text-sm text-slate-400 mb-6 px-2">
          Encontre respostas rápidas para as dúvidas mais comuns sobre o uso do Alerta Criminal.
        </p>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <span className="font-semibold text-white text-sm pr-4">{faq.question}</span>
                {openIndex === index ? (
                  <ChevronUp size={20} className="text-slate-400 shrink-0" />
                ) : (
                  <ChevronDown size={20} className="text-slate-400 shrink-0" />
                )}
              </button>
              
              {openIndex === index && (
                <div className="p-4 pt-0 text-sm text-slate-300 leading-relaxed border-t border-slate-700/50 mt-2">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
