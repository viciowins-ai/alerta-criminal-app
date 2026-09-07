import React, { useEffect, useState, useRef } from 'react';
import { TopBar } from '../components/TopBar';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, limit, orderBy, doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { AlertTriangle, MapPin, Users, ShieldAlert, Activity, Car, Bike, Power } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function AdminDashboardPage() {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ activeSOS: 0, totalUsers: 0, recentIncidents: 0 });
  
  const [isPatrolling, setIsPatrolling] = useState(false);
  const [vehicleType, setVehicleType] = useState<'car' | 'motorcycle'>('car');
  const [activePatrols, setActivePatrols] = useState<any[]>([]);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    // Redireciona se não for admin/guard
    if (role !== 'admin' && role !== 'guard') {
      navigate('/dashboard');
    }
  }, [role, navigate]);

  useEffect(() => {
    if (!user) return;
    
    // Buscar status atual da viatura
    const fetchMyStatus = async () => {
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setIsPatrolling(data.isPatrolling || false);
        setVehicleType(data.vehicleType || 'car');
      }
    };
    fetchMyStatus();

    // Escutar por viaturas ativas
    const q = query(
      collection(db, 'users'), 
      where('isPatrolling', '==', true)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const patrols = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).filter(p => p.role === 'admin' || p.role === 'guard');
      setActivePatrols(patrols);
    });

    return () => {
      unsubscribe();
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [user]);

  useEffect(() => {
    if (isPatrolling && user) {
      if ('geolocation' in navigator) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          async (position) => {
            try {
              const userRef = doc(db, 'users', user.uid);
              await updateDoc(userRef, {
                location: {
                  lat: position.coords.latitude,
                  lng: position.coords.longitude
                }
              });
            } catch (err) {
              console.error("Erro ao atualizar localização da patrulha", err);
            }
          },
          (error) => {
            console.error("Erro de GPS", error);
          },
          { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
        );
      }
    } else {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    }
  }, [isPatrolling, user]);

  const togglePatrol = async () => {
    if (!user) return;
    try {
      const newState = !isPatrolling;
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        isPatrolling: newState,
        vehicleType: vehicleType
      });
      setIsPatrolling(newState);
    } catch (e) {
      console.error("Erro ao alterar status de patrulha", e);
    }
  };

  const changeVehicleType = async (type: 'car' | 'motorcycle') => {
    setVehicleType(type);
    if (isPatrolling && user) {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { vehicleType: type });
    }
  };

  if (role !== 'admin' && role !== 'guard') return null;

  return (
    <div className="flex flex-col h-full bg-slate-950">
      <TopBar title="Central de Operações" showBack={true} />
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
        
        {/* Painel da Viatura / Controle de Status */}
        <div className={`p-6 rounded-3xl border transition-colors ${isPatrolling ? 'bg-gradient-to-r from-blue-900/50 to-indigo-900/50 border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.3)]' : 'bg-slate-900 border-slate-800'}`}>
          <div className="flex items-center gap-4 mb-6">
            <div className={`p-3 rounded-2xl ${isPatrolling ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-500'}`}>
              <Activity className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white">Painel da Viatura</h2>
              <p className={`text-sm ${isPatrolling ? 'text-blue-200' : 'text-slate-400'}`}>
                {isPatrolling ? 'Em patrulhamento ativo' : 'Fora de serviço'}
              </p>
            </div>
            <button 
              onClick={togglePatrol}
              className={`p-4 rounded-full flex items-center justify-center transition-all ${isPatrolling ? 'bg-red-500/20 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'bg-green-500/20 text-green-500 shadow-[0_0_15px_rgba(34,197,94,0.4)]'}`}
            >
              <Power size={24} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => changeVehicleType('car')}
              className={`flex items-center justify-center gap-2 p-3 rounded-xl border font-bold text-sm transition-all ${vehicleType === 'car' ? (isPatrolling ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : 'bg-slate-800 border-slate-600 text-slate-300') : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'}`}
            >
              <Car size={18} />
              Viatura (Carro)
            </button>
            <button 
              onClick={() => changeVehicleType('motorcycle')}
              className={`flex items-center justify-center gap-2 p-3 rounded-xl border font-bold text-sm transition-all ${vehicleType === 'motorcycle' ? (isPatrolling ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : 'bg-slate-800 border-slate-600 text-slate-300') : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'}`}
            >
              <Bike size={18} />
              Tático Móvel
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col items-center justify-center text-center">
            <ShieldAlert className="text-red-500 mb-2" size={28} />
            <span className="text-3xl font-bold text-white">0</span>
            <span className="text-xs text-slate-400 uppercase tracking-wider mt-1">SOS Ativos</span>
          </div>
          
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col items-center justify-center text-center">
            <MapPin className="text-orange-500 mb-2" size={28} />
            <span className="text-3xl font-bold text-white">0</span>
            <span className="text-xs text-slate-400 uppercase tracking-wider mt-1">Ocorrências (24h)</span>
          </div>
        </div>

        <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="text-yellow-500" size={20} />
            Alertas em Tempo Real
          </h3>
          <div className="text-center py-8">
            <p className="text-slate-400">Nenhum SOS ativo no momento.</p>
            <p className="text-xs text-slate-500 mt-2">A central está monitorando sua região.</p>
          </div>
        </div>

        <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="text-blue-400" size={20} />
              Frota em Patrulha
            </div>
            <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-1 rounded-lg">{activePatrols.length} ativo(s)</span>
          </h3>
          <div className="space-y-3">
            {activePatrols.length > 0 ? (
              activePatrols.map(patrol => (
                <div key={patrol.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-900 rounded-lg text-blue-400">
                      {patrol.vehicleType === 'motorcycle' ? <Bike size={20} /> : <Car size={20} />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{patrol.name}</p>
                      <p className="text-xs text-slate-400">{patrol.vehicleType === 'motorcycle' ? 'Tático Móvel' : 'Viatura'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded-md">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    Ativa
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6">
                <p className="text-slate-400">Nenhuma viatura em patrulha</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
