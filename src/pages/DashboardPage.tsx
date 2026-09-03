import React, { useEffect, useState } from 'react';
import { TopBar } from '../components/TopBar';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, onSnapshot, orderBy, limit, getCountFromServer, where, getDocs } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';

export function DashboardPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [usersCount, setUsersCount] = useState(0);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    // Fetch reports
    let unsubscribeReports = () => {};
    const setupReportsListener = async () => {
      let userGroupIds: string[] = [];
      if (user) {
        try {
          const qGroups = query(collection(db, 'groups'), where('members', 'array-contains', user.uid));
          const snap = await getDocs(qGroups);
          userGroupIds = snap.docs.map(d => d.id);
        } catch (e) {
          console.error(e);
        }
      }
      
      const qReports = query(collection(db, 'reports'), orderBy('createdAt', 'desc'), limit(50));
      unsubscribeReports = onSnapshot(qReports, (snapshot) => {
        let reportsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as any)
        }));
        
        // Filter reports
        reportsData = reportsData.filter((r: any) => 
          !r.visibility || 
          r.visibility === 'public' || 
          (r.visibility === 'group' && userGroupIds.includes(r.groupId)) ||
          r.authorId === user?.uid
        );
        
        setReports(reportsData);

        // Calculate chart data (last 7 days)
        const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const today = new Date().getDay();
        const orderedDays = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          orderedDays.push(days[d.getDay()]);
        }

        const counts = [0, 0, 0, 0, 0, 0, 0];
        
        reportsData.forEach(r => {
          if (r.createdAt && r.createdAt.toMillis) {
            const date = new Date(r.createdAt.toMillis());
            const now = new Date();
            const diffTime = Math.abs(now.getTime() - date.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
            
            if (diffDays <= 7) {
              const dayIndex = 6 - (diffDays - 1);
              if (dayIndex >= 0 && dayIndex < 7) {
                counts[dayIndex]++;
              }
            }
          }
        });

        const newChartData = orderedDays.map((day, index) => ({
          name: day,
          alertas: counts[index]
        }));
        
        // If no data, show some placeholder trend so chart isn't empty
        if (reportsData.length === 0) {
          setChartData([
            { name: 'Seg', alertas: 0 },
            { name: 'Ter', alertas: 0 },
            { name: 'Qua', alertas: 0 },
            { name: 'Qui', alertas: 0 },
            { name: 'Sex', alertas: 0 },
            { name: 'Sáb', alertas: 0 },
            { name: 'Dom', alertas: 0 },
          ]);
        } else {
          setChartData(newChartData);
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'reports');
      });
    };
    setupReportsListener();

    // Fetch users count efficiently
    const fetchUsersCount = async () => {
      try {
        const coll = collection(db, 'users');
        const snapshot = await getCountFromServer(coll);
        setUsersCount(snapshot.data().count);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'users');
      }
    };
    fetchUsersCount();

    return () => {
      unsubscribeReports();
    };
  }, []);

  const totalAlerts = reports.length;
  const verifiedAlerts = reports.filter(r => r.status === 'verified').length;
  const falseAlerts = reports.filter(r => r.status === 'false').length;
  
  const verifiedPercentage = totalAlerts > 0 ? Math.round((verifiedAlerts / totalAlerts) * 100) : 0;
  const falsePercentage = totalAlerts > 0 ? Math.round((falseAlerts / totalAlerts) * 100) : 0;

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Agora mesmo';
    if (diffInMinutes < 60) return `Há ${diffInMinutes} min`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Há ${diffInHours} h`;
    return `${Math.floor(diffInHours / 24)} d atrás`;
  };

  return (
    <div className="flex flex-col h-full bg-slate-900">
      <TopBar title="Dashboard Admin" />
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-20">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-700 flex flex-col items-center justify-center">
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-full mb-2">
              <AlertTriangle size={24} />
            </div>
            <p className="text-2xl font-bold text-white">{totalAlerts}</p>
            <p className="text-xs text-slate-400 uppercase font-semibold text-center">Total Alertas</p>
          </div>
          <div className="bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-700 flex flex-col items-center justify-center">
            <div className="p-3 bg-green-500/10 text-green-400 rounded-full mb-2">
              <CheckCircle size={24} />
            </div>
            <p className="text-2xl font-bold text-white">{verifiedPercentage}%</p>
            <p className="text-xs text-slate-400 uppercase font-semibold text-center">Verificados</p>
          </div>
          <div className="bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-700 flex flex-col items-center justify-center">
            <div className="p-3 bg-purple-500/10 text-purple-400 rounded-full mb-2">
              <Users size={24} />
            </div>
            <p className="text-2xl font-bold text-white">{usersCount}</p>
            <p className="text-xs text-slate-400 uppercase font-semibold text-center">Usuários Ativos</p>
          </div>
          <div className="bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-700 flex flex-col items-center justify-center">
            <div className="p-3 bg-red-500/10 text-red-400 rounded-full mb-2">
              <XCircle size={24} />
            </div>
            <p className="text-2xl font-bold text-white">{falsePercentage}%</p>
            <p className="text-xs text-slate-400 uppercase font-semibold text-center">Falsos Alarmes</p>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-700">
          <h3 className="text-sm font-semibold text-white mb-4">Tendência de Ocorrências (Semana)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', border: '1px solid #334155', color: '#f8fafc', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  cursor={{ stroke: '#334155', strokeWidth: 2 }}
                />
                <Line type="monotone" dataKey="alertas" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4, fill: '#3B82F6', strokeWidth: 2, stroke: '#1e293b' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Alerts List */}
        <div className="bg-slate-800 rounded-2xl shadow-sm border border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-700 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-white">Alertas Recentes</h3>
            <button className="text-xs text-blue-400 font-medium hover:underline">Ver Todos</button>
          </div>
          <div className="divide-y divide-slate-700">
            {reports.slice(0, 5).map((report) => (
              <div key={report.id} className="p-4 flex items-center justify-between hover:bg-slate-700/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    report.type === 'roubo' ? 'bg-red-500' : 
                    report.type === 'suspeito' ? 'bg-orange-500' : 
                    report.type === 'vandalismo' ? 'bg-yellow-500' : 'bg-slate-400'
                  }`} />
                  <div>
                    <p className="text-sm font-medium text-white capitalize">{report.type}</p>
                    <p className="text-xs text-slate-400 truncate max-w-[150px]">{report.location.address || 'Localização Desconhecida'}</p>
                  </div>
                </div>
                <span className="text-xs text-slate-500">{formatTime(report.createdAt)}</span>
              </div>
            ))}
            {reports.length === 0 && (
              <div className="p-4 text-center text-slate-400 text-sm">
                Nenhum alerta recente.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
