import React from 'react';
import { TopBar } from '../components/TopBar';
import { useAuth } from '../contexts/AuthContext';
import { ShieldCheck, Mail } from 'lucide-react';

export function SecuritySettingsPage() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col h-full bg-slate-900">
      <TopBar title="Segurança" showBack />
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20">
        <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 text-center">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30">
            <ShieldCheck size={40} className="text-green-500" />
          </div>
          <h2 className="text-xl font-black text-white mb-2">Conta Segura</h2>
          <p className="text-sm text-slate-400 mb-8 leading-relaxed">
            Sua conta está vinculada ao Google, garantindo o mais alto nível de segurança, proteção de dados e autenticação em duas etapas.
          </p>
          
          <div className="bg-slate-900/50 p-4 rounded-2xl flex items-center gap-4 text-left border border-slate-700/50">
            <div className="p-3 bg-slate-800 rounded-xl">
              <Mail className="text-slate-400" size={24} />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">E-mail Vinculado</p>
              <p className="text-sm text-white font-medium truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
