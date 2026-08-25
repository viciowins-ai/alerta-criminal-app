import React from 'react';
import { TopBar } from '../components/TopBar';
import { User, Bell, Shield, Lock, LogOut, ChevronRight, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

export function SettingsPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="flex flex-col h-full bg-slate-900">
      <TopBar title="Configurações" />
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        <div className="bg-slate-800 rounded-3xl shadow-sm border border-slate-700 overflow-hidden">
          <SettingItem icon={<User size={20} />} label="Minha Conta" onClick={() => navigate('/settings/account')} />
          <SettingItem icon={<Bell size={20} />} label="Notificações" onClick={() => navigate('/settings/notifications')} />
          <SettingItem icon={<Shield size={20} />} label="Privacidade" onClick={() => navigate('/settings/privacy')} />
          <SettingItem icon={<Lock size={20} />} label="Segurança" onClick={() => navigate('/settings/security')} />
        </div>

        <div className="bg-slate-800 rounded-3xl shadow-sm border border-slate-700 overflow-hidden">
          <SettingItem icon={<LogOut size={20} className="text-red-500" />} label="Sair da Conta" onClick={handleLogout} textColor="text-red-400" hideArrow />
        </div>
      </div>
    </div>
  );
}

function SettingItem({ icon, label, onClick, textColor = 'text-slate-300', hideArrow = false }: { icon: React.ReactNode, label: string, onClick?: () => void, textColor?: string, hideArrow?: boolean }) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 border-b border-slate-700 hover:bg-slate-700/50 transition-colors last:border-0"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-slate-900 rounded-xl text-slate-400">
          {icon}
        </div>
        <span className={`text-sm font-medium ${textColor}`}>{label}</span>
      </div>
      {!hideArrow && <ChevronRight size={16} className="text-slate-500" />}
    </button>
  );
}
