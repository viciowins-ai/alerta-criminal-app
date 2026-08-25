import React from 'react';
import { X, Database, CheckCircle2, Clock, AlertCircle, Shield } from 'lucide-react';

interface DataSourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DataSourcesModal({ isOpen, onClose }: DataSourcesModalProps) {
  if (!isOpen) return null;

  const sources = [
    { name: 'SINESP (Nacional)', type: 'Ministério da Justiça', status: 'syncing', date: 'Atualizando...' },
    { name: 'SSP-SP', type: 'Secretaria de Segurança (SP)', status: 'active', date: 'Atualizado há 2 dias' },
    { name: 'ISP-RJ', type: 'Segurança Pública (RJ)', status: 'active', date: 'Atualizado há 5 dias' },
    { name: 'SESP-MG', type: 'Segurança Pública (MG)', status: 'active', date: 'Atualizado há 1 semana' },
    { name: 'SSP-BA', type: 'Segurança Pública (BA)', status: 'delayed', date: 'Atraso na fonte (15 dias)' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/90" onClick={onClose} />
      
      <div className="bg-slate-800 rounded-3xl w-full max-w-md overflow-hidden relative shadow-2xl border border-slate-700 flex flex-col max-h-[80vh] animate-fade-in">
        <div className="p-5 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
              <Database size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Fontes de Dados</h2>
              <p className="text-xs text-slate-400">Status de integração nacional</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6">
            <div className="flex gap-3">
              <Shield className="text-blue-400 shrink-0 mt-0.5" size={18} />
              <p className="text-sm text-slate-300">
                <strong className="text-white">Arquitetura Comercial:</strong> O aplicativo está estruturado para consumir dados de APIs governamentais e planilhas de dados abertos de todos os estados do Brasil.
              </p>
            </div>
          </div>

          <h3 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">Status das Conexões</h3>
          
          <div className="flex flex-col gap-3">
            {sources.map((source, idx) => (
              <div key={idx} className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <h4 className="text-white font-medium text-sm">{source.name}</h4>
                  <p className="text-xs text-slate-400">{source.type}</p>
                </div>
                <div className="flex flex-col items-end">
                  {source.status === 'active' && <CheckCircle2 size={16} className="text-green-400 mb-1" />}
                  {source.status === 'syncing' && <Clock size={16} className="text-blue-400 mb-1 animate-spin-slow" />}
                  {source.status === 'delayed' && <AlertCircle size={16} className="text-orange-400 mb-1" />}
                  <span className={`text-[10px] font-medium ${
                    source.status === 'active' ? 'text-green-400/80' : 
                    source.status === 'syncing' ? 'text-blue-400/80' : 'text-orange-400/80'
                  }`}>
                    {source.date}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
