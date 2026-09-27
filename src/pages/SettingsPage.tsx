import React, { useState } from 'react';
import { TopBar } from '../components/TopBar';
import { User, Bell, Shield, Lock, LogOut, ChevronRight, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { LanguageSelectorModal, SUPPORTED_LANGUAGES } from '../components/LanguageSelectorModal';

export function SettingsPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { t, i18n } = useTranslation();
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const currentLangCode = i18n.language || 'pt';
  const currentLangObj = SUPPORTED_LANGUAGES.find(l => currentLangCode.startsWith(l.code)) || SUPPORTED_LANGUAGES[0];

  return (
    <div className="flex flex-col h-full bg-slate-900">
      <TopBar title={t('settings.title', 'Configurações')} />
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Seletor de Idioma Principal */}
        <div className="bg-slate-800 rounded-3xl shadow-sm border border-slate-700 overflow-hidden">
          <button 
            onClick={() => setIsLangModalOpen(true)}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-700/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-xl text-blue-400">
                <Globe size={20} />
              </div>
              <div className="text-left">
                <span className="text-sm font-semibold text-white block">
                  {t('settings.language', 'Idioma do Aplicativo')}
                </span>
                <span className="text-xs text-slate-400">
                  {currentLangObj.flag} {currentLangObj.label}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-1 bg-slate-900 text-blue-400 font-semibold rounded-lg border border-slate-700">
                {currentLangObj.flag}
              </span>
              <ChevronRight size={16} className="text-slate-500" />
            </div>
          </button>
        </div>

        <div className="bg-slate-800 rounded-3xl shadow-sm border border-slate-700 overflow-hidden">
          <SettingItem 
            icon={<User size={20} />} 
            label={t('settings.myAccount', 'Minha Conta')} 
            onClick={() => navigate('/settings/account')} 
          />
          <SettingItem 
            icon={<Bell size={20} />} 
            label={t('settings.notifications', 'Notificações')} 
            onClick={() => navigate('/settings/notifications')} 
          />
          <SettingItem 
            icon={<Shield size={20} />} 
            label={t('settings.privacy', 'Privacidade')} 
            onClick={() => navigate('/settings/privacy')} 
          />
          <SettingItem 
            icon={<Lock size={20} />} 
            label={t('settings.security', 'Segurança')} 
            onClick={() => navigate('/settings/security')} 
          />
        </div>

        <div className="bg-slate-800 rounded-3xl shadow-sm border border-slate-700 overflow-hidden">
          <SettingItem 
            icon={<LogOut size={20} className="text-red-500" />} 
            label={t('settings.logout', 'Sair da Conta')} 
            onClick={handleLogout} 
            textColor="text-red-400" 
            hideArrow 
          />
        </div>
      </div>

      <LanguageSelectorModal
        isOpen={isLangModalOpen}
        onClose={() => setIsLangModalOpen(false)}
      />
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
