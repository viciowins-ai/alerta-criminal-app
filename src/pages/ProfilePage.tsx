import React, { useEffect, useState } from 'react';
import { TopBar } from '../components/TopBar';
import { Settings, Shield, Award, Users, ChevronRight, Bell, HelpCircle, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs, getCountFromServer } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [reportsCount, setReportsCount] = useState(0);

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

  const menuItems = [
    { icon: <Award className="text-yellow-500" />, label: 'Meu Nível de Contribuição', path: '/gamification', badge: profileData?.level || 'Iniciante' },
    { icon: <Users className="text-green-500" />, label: 'Indique e Ganhe', path: '/referral' },
    { icon: <Shield className="text-red-500" />, label: 'Contatos de Confiança', path: '/trusted-contacts' },
    { icon: <Bell className="text-purple-500" />, label: 'Notificações', path: '/settings' },
    { icon: <HelpCircle className="text-orange-500" />, label: 'Central de Ajuda', path: '/help' },
    { icon: <Settings className="text-gray-500" />, label: 'Configurações', path: '/settings' },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-900">
      <TopBar title="Perfil" showBack={false} />
      
      <div className="flex-1 overflow-y-auto pb-20">
        {/* Header */}
        <div className="bg-slate-800 p-6 border-b border-slate-700 flex items-center gap-4">
          <img src={profileData?.avatar || user?.photoURL || "https://i.pravatar.cc/150?u=me"} alt="Me" className="w-20 h-20 rounded-full object-cover border-4 border-blue-100" referrerPolicy="no-referrer" />
          <div className="flex-1 overflow-hidden">
            <h2 className="text-xl font-bold text-white truncate">
              {profileData?.name || user?.displayName || user?.email?.split('@')[0] || 'Usuário'}
            </h2>
            <p className="text-sm text-slate-400 mb-1 truncate">{user?.email}</p>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              <Award size={12} />
              {profileData?.level || 'Iniciante'}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 p-6 bg-slate-800 mb-2">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{reportsCount}</p>
            <p className="text-xs text-slate-400 uppercase font-semibold">Alertas</p>
          </div>
          <div className="text-center border-l border-r border-slate-700">
            <p className="text-2xl font-bold text-white">{profileData?.points || 0}</p>
            <p className="text-xs text-slate-400 uppercase font-semibold">Pontos</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white">
              {profileData?.createdAt?.toMillis ? Math.max(1, Math.floor((Date.now() - profileData.createdAt.toMillis()) / (1000 * 60 * 60 * 24))) : 1}
            </p>
            <p className="text-xs text-slate-400 uppercase font-semibold">Dias Ativo</p>
          </div>
        </div>

        {/* Menu */}
        <div className="bg-slate-800 mt-2">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => navigate(item.path)}
              className="w-full flex items-center justify-between p-4 border-b border-slate-700 hover:bg-slate-700 transition-colors"
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

        {/* Admin Link (For Demo) */}
        <div className="p-6 space-y-3">
          {profileData?.role === 'admin' && (
            <button 
              onClick={() => navigate('/dashboard')}
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
            Sair da Conta
          </button>
        </div>
      </div>
    </div>
  );
}
