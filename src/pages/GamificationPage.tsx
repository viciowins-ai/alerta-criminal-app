import React, { useEffect, useState } from 'react';
import { TopBar } from '../components/TopBar';
import { Award, Star, Shield, Zap, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs, getCountFromServer } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';

export function GamificationPage() {
  const { user } = useAuth();
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

  const points = profileData?.points || 0;
  
  let level = 'Iniciante';
  if (points >= 1500) level = 'Herói Local';
  else if (points >= 500) level = 'Guardião';
  else if (points >= 100) level = 'Vigilante';

  // Simple logic for next level
  let nextLevelPoints = 100;
  let progress = 0;
  
  if (points < 100) {
    nextLevelPoints = 100;
    progress = (points / 100) * 100;
  } else if (points < 500) {
    nextLevelPoints = 500;
    progress = ((points - 100) / 400) * 100;
  } else if (points < 1500) {
    nextLevelPoints = 1500;
    progress = ((points - 500) / 1000) * 100;
  } else {
    nextLevelPoints = 5000;
    progress = ((points - 1500) / 3500) * 100;
  }

  const daysActive = profileData?.createdAt?.toMillis ? Math.max(1, Math.floor((Date.now() - profileData.createdAt.toMillis()) / (1000 * 60 * 60 * 24))) : 1;

  return (
    <div className="flex flex-col h-full bg-slate-900">
      <TopBar title="Meu Nível de Contribuição" />
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-20">
        {/* Current Level Card */}
        <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-6 rounded-3xl shadow-lg text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white opacity-10 rounded-full" />
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-white opacity-10 rounded-full" />
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-4 border-4 border-white/30 shadow-inner">
              <Award size={48} className="text-white drop-shadow-md" />
            </div>
            <h2 className="text-2xl font-black tracking-tight mb-1">{level}</h2>
            <p className="text-yellow-100 text-sm font-medium mb-6">Continue contribuindo para subir de nível!</p>
            
            <div className="w-full bg-black/20 rounded-full h-3 mb-2 overflow-hidden">
              <div 
                className="bg-white h-full rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)] transition-all duration-1000" 
                style={{ width: `${Math.min(100, progress)}%` }}
              />
            </div>
            <div className="flex justify-between w-full text-xs font-bold text-yellow-100">
              <span>{points} pts</span>
              <span>Próximo Nível: {nextLevelPoints} pts</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <StatCard icon={<Star className="text-yellow-500" />} label="Alertas Criados" value={reportsCount.toString()} />
          <StatCard icon={<Shield className="text-blue-500" />} label="Rotas Seguras" value="0" />
          <StatCard icon={<Zap className="text-purple-500" />} label="Dias Ativo" value={daysActive.toString()} />
          <StatCard icon={<CheckCircle2 className="text-green-500" />} label="Comunidade" value="Top 10%" />
        </div>

        {/* Rewards */}
        <div className="bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-700">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            Benefícios Desbloqueados
            <span className="bg-green-500/20 text-green-400 text-[10px] px-2 py-1 rounded-full uppercase">Ativos</span>
          </h3>
          <ul className="space-y-4">
            <RewardItem title="Dicas Avançadas de IA" desc="Acesso antecipado a rotas seguras geradas por IA." active={points >= 100} />
            <RewardItem title="Selo de Verificação" desc="Seus alertas ganham prioridade no feed." active={points >= 500} />
            <RewardItem title="Descontos em Parceiros" desc="50% off em seguros e serviços de monitoramento." active={points >= 1500} />
          </ul>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-700 flex flex-col items-center justify-center text-center">
      <div className="p-3 bg-slate-900 rounded-full mb-3">
        {icon}
      </div>
      <p className="text-2xl font-black text-white mb-1">{value}</p>
      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{label}</p>
    </div>
  );
}

function RewardItem({ title, desc, active }: { title: string, desc: string, active: boolean }) {
  return (
    <li className={`flex gap-4 items-start p-3 rounded-xl transition-colors ${active ? 'bg-blue-900/20' : 'opacity-50 grayscale'}`}>
      <div className={`p-2 rounded-full shrink-0 ${active ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-500'}`}>
        <CheckCircle2 size={20} />
      </div>
      <div>
        <h4 className={`text-sm font-bold mb-1 ${active ? 'text-white' : 'text-slate-500'}`}>{title}</h4>
        <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
      </div>
    </li>
  );
}
