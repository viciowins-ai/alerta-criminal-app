import React, { useEffect, useState } from 'react';
import { TopBar } from '../components/TopBar';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { AlertTriangle, MapPin, Users, ShieldAlert, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function AdminDashboardPage() {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ activeSOS: 0, totalUsers: 0, recentIncidents: 0 });

  useEffect(() => {
    // Redireciona se não for admin/guard
    if (role !== 'admin' && role !== 'guard') {
      navigate('/dashboard');
    }
  }, [role, navigate]);

  if (role !== 'admin' && role !== 'guard') return null;

  return (
    <div className="flex flex-col h-full bg-slate-950">
      <TopBar title="Central de Operações" showBack={true} />
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
        
        <div className="bg-gradient-to-r from-blue-900/50 to-indigo-900/50 p-6 rounded-3xl border border-blue-500/20">
          <div className="flex items-center gap-4">
            <div className="bg-blue-500/20 p-3 rounded-2xl">
              <Activity className="text-blue-400 w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Painel da Viatura</h2>
              <p className="text-sm text-blue-200/70">Módulo exclusivo para Segurança Privada</p>
            </div>
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

        <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 opacity-50">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Users className="text-blue-400" size={20} />
            Viaturas Próximas
          </h3>
          <div className="text-center py-4">
            <p className="text-xs text-slate-400">Integração de frota em breve</p>
          </div>
        </div>

      </div>
    </div>
  );
}
