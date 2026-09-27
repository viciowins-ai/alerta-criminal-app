import React, { useEffect, useState } from 'react';
import { TopBar } from '../components/TopBar';
import { Settings, Shield, Award, Users, ChevronRight, Bell, HelpCircle, LogOut, Star, BookOpen, ShieldCheck, Activity, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs, getCountFromServer } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import { getLevelInfo } from '../utils/levelUtils';
import { useTranslation } from 'react-i18next';
import { LanguageSelectorModal, SUPPORTED_LANGUAGES } from '../components/LanguageSelectorModal';
import { FlagIcon } from '../components/FlagIcon';

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, role, signOut } = useAuth();
  const { t, i18n } = useTranslation();
  const [profileData, setProfileData] = useState<any>(null);
  const [reportsCount, setReportsCount] = useState(0);
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfileData(docSnap.data());
        }
        const q = query(collection(db, 'reports'), where('authorId', '==', user.uid));
        const snapshot = await getCountFromServer(q);
        setReportsCount(snapshot.data().count);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'users/reports');
      }
    };

    fetchProfile();
  }, [user]);

  const levelInfo = getLevelInfo(profileData?.points || 0);

  const currentLangCode = i18n.language || 'pt';
  const currentLangObj = SUPPORTED_LANGUAGES.find(l => currentLangCode.startsWith(l.code)) || SUPPORTED_LANGUAGES[0];

  const menuItems = [
    { 
      icon: <Globe className="text-blue-400" />, 
      label: t('profile.language', 'Idioma'), 
      customClick: () => setIsLangModalOpen(true), 
      badge: (
        <span className="inline-flex items-center gap-1.5">
          <FlagIcon code={currentLangObj.flagCode || currentLangObj.code} size="xs" />
          <span>{currentLangObj.code.toUpperCase()}</span>
        </span>
      )
    },
    { icon: <BookOpen className="text-blue-500" />, label: t('profile.howToUse', 'Como Usar o App'), path: '/como-usar' },
    { icon: <Star className="text-yellow-400 fill-yellow-400" />, label: t('profile.feedback', 'Avaliar Aplicativo'), path: '/help/feedback' },
    { icon: <Users className="text-indigo-500" />, label: t('profile.groups', 'Grupos Privados'), path: '/groups' },
    { icon: <Award className="text-yellow-500" />, label: t('profile.contributionLevel', 'Meu Nível de Contribuição'), path: '/gamification', badge: levelInfo.badge },
    { icon: <Users className="text-green-500" />, label: t('profile.referral', 'Indique e Ganhe'), path: '/referral' },
    { icon: <Shield className="text-red-500" />, label: t('profile.trustedContacts', 'Contatos de Confiança'), path: '/trusted-contacts' },
    { icon: <Bell className="text-purple-500" />, label: t('profile.notifications', 'Notificações'), path: '/settings/notifications' },
    { icon: <HelpCircle className="text-orange-500" />, label: t('profile.help', 'Central de Ajuda'), path: '/help' },
    { icon: <Settings className="text-gray-500" />, label: t('profile.settings', 'Configurações'), path: '/settings' },
  ];

  if (role === 'admin' || role === 'guard') {
    menuItems.unshift({ icon: <Activity className="text-blue-400" />, label: 'Painel da Viatura', path: '/admin', badge: undefined, customClick: undefined });
  }

  return (
    <div className="flex flex-col h-full bg-slate-900">
      <TopBar title={t('profile.title', 'Perfil')} showBack={false} />
      
      <div className="flex-1 overflow-y-auto pb-20">
        {/* Header */}
        <div className="bg-slate-800 p-6 border-b border-slate-700 flex items-center gap-4">
          <img src={profileData?.avatar || user?.photoURL || "https://i.pravatar.cc/150?u=me"} alt="Me" className={`w-20 h-20 rounded-full object-cover border-4 ${levelInfo.verified ? 'border-blue-500' : 'border-blue-100'}`} referrerPolicy="no-referrer" />
          <div className="flex-1 overflow-hidden">
            <h2 className="text-xl font-bold text-white truncate flex items-center gap-1">
              {profileData?.name || user?.displayName || user?.email?.split('@')[0] || 'Usuário'}
              {levelInfo.verified && <ShieldCheck size={18} className="text-blue-500 fill-blue-500 inline shrink-0" />}
            </h2>
            <p className="text-sm text-slate-400 truncate">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${levelInfo.color}`}>
                {levelInfo.name}
              </span>
              <span className="text-xs text-slate-400">
                {profileData?.points || 0} XP
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 p-4">
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
            <span className="text-xs text-slate-400 block mb-1">Meus Reportes</span>
            <span className="text-2xl font-bold text-white">{reportsCount}</span>
          </div>
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
            <span className="text-xs text-slate-400 block mb-1">Pontos de Confiança</span>
            <span className="text-2xl font-bold text-white">{profileData?.points || 0}</span>
          </div>
        </div>

        {/* Menu Items */}
        <div className="bg-slate-800 border-y border-slate-700">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => item.customClick ? item.customClick() : item.path && navigate(item.path)}
              className="w-full flex items-center justify-between p-4 border-b border-slate-700 hover:bg-slate-700 transition-colors last:border-0"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-900 rounded-lg">
                  {item.icon}
                </div>
                <span className="text-sm font-medium text-slate-200">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                {item.badge && (
                  <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-full bg-blue-900/50 text-blue-400">
                    {item.badge}
                  </span>
                )}
                <ChevronRight size={16} className="text-slate-500" />
              </div>
            </button>
          ))}
        </div>

        {/* Admin Link */}
        <div className="p-6 space-y-3">
          {(profileData?.role === 'admin' || profileData?.role === 'guard') && (
            <button 
              onClick={() => navigate('/admin')}
              className="w-full py-3 rounded-xl border-2 border-dashed border-slate-700 text-slate-400 font-medium text-sm hover:bg-slate-800 transition-colors"
            >
              Acessar Painel Admin
            </button>
          )}
          
          <button 
            onClick={async () => {
              await signOut();
              navigate('/login');
            }}
            className="w-full py-3 rounded-xl bg-red-500/10 text-red-500 font-bold text-sm hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut size={18} />
            {t('settings.logout', 'Sair da Conta')}
          </button>
        </div>
      </div>

      <LanguageSelectorModal
        isOpen={isLangModalOpen}
        onClose={() => setIsLangModalOpen(false)}
      />
    </div>
  );
}
