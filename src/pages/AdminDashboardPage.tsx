import React, { useEffect, useState, useRef } from 'react';
import { TopBar } from '../components/TopBar';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, limit, orderBy, doc, getDoc, updateDoc, onSnapshot, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { AlertTriangle, MapPin, Users, ShieldAlert, Activity, Car, Bike, Power, MessageSquare, ShieldBan, Send, CheckCircle2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AttachmentGallery } from '../components/AttachmentGallery';

export function AdminDashboardPage() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'moderation' | 'feedbacks'>('dashboard');

  // Patrulha State
  const [isPatrolling, setIsPatrolling] = useState(false);
  const [vehicleType, setVehicleType] = useState<'car' | 'motorcycle'>('car');
  const [activePatrols, setActivePatrols] = useState<any[]>([]);
  const watchIdRef = useRef<number | null>(null);

  // Moderação e Feedbacks State
  const [privateReports, setPrivateReports] = useState<any[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (loading) return;
    
    // Redireciona se não for admin/guard e se já carregou
    if (role !== 'admin' && role !== 'guard') {
      navigate('/map');
      return;
    }

    const fetchMyStatus = async () => {
      if (!user) return;
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
    const qPatrol = query(
      collection(db, 'users'), 
      where('isPatrolling', '==', true)
    );
    const unsubPatrol = onSnapshot(qPatrol, (snapshot) => {
      const patrols = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      })).filter(p => p.role === 'admin' || p.role === 'guard');
      setActivePatrols(patrols);
    });

    // Escutar Relatos Privados (Moderação)
    const qReports = query(collection(db, 'reports'), orderBy('createdAt', 'desc'), limit(100));
    const unsubReports = onSnapshot(qReports, (snapshot) => {
      const allReports = snapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      setPrivateReports(allReports.filter(r => r.visibility === 'group' || r.visibility === 'private'));
    });

    // Escutar Feedbacks
    const qFeedbacks = query(collection(db, 'feedbacks'), orderBy('createdAt', 'desc'), limit(50));
    const unsubFeedbacks = onSnapshot(qFeedbacks, (snapshot) => {
      setFeedbacks(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubPatrol();
      unsubReports();
      unsubFeedbacks();
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [user, role, loading, navigate]);

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

  const blockUser = async (userId: string) => {
    if (window.confirm("Tem certeza que deseja bloquear este usuário? Ele perderá acesso para criar novos grupos ou relatar ocorrências.")) {
      try {
        await updateDoc(doc(db, 'users', userId), { role: 'blocked' });
        alert("Usuário bloqueado com sucesso!");
      } catch (e) {
        console.error(e);
        alert("Erro ao bloquear usuário");
      }
    }
  };

  const deleteReport = async (reportId: string) => {
    if (window.confirm("Excluir esta ocorrência permanentemente?")) {
      try {
        await deleteDoc(doc(db, 'reports', reportId));
        alert("Ocorrência excluída.");
      } catch (e) {
        console.error(e);
        alert("Erro ao excluir");
      }
    }
  };

  const sendFeedbackReply = async (feedbackId: string) => {
    const text = replyText[feedbackId];
    if (!text || text.trim() === '') return;
    
    try {
      await updateDoc(doc(db, 'feedbacks', feedbackId), {
        adminResponse: text,
        adminResponseAt: new Date()
      });
      alert("Resposta enviada ao usuário com sucesso!");
      setReplyText(prev => ({ ...prev, [feedbackId]: '' }));
    } catch (e) {
      console.error(e);
      alert("Erro ao enviar resposta");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-950">
        <Activity className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (role !== 'admin' && role !== 'guard') return null;

  return (
    <div className="flex flex-col h-full bg-slate-950">
      <TopBar title="Painel Admin" showBack={true} />
      
      {/* Abas Superiores */}
      <div className="flex px-4 py-2 bg-slate-900 border-b border-slate-800 gap-2 overflow-x-auto hide-scrollbar">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap text-sm font-bold transition-all ${activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
        >
          <Activity size={18} /> Operações
        </button>
        <button 
          onClick={() => setActiveTab('moderation')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap text-sm font-bold transition-all ${activeTab === 'moderation' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
        >
          <ShieldAlert size={18} /> Moderação (Privados)
        </button>
        <button 
          onClick={() => setActiveTab('feedbacks')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap text-sm font-bold transition-all ${activeTab === 'feedbacks' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
        >
          <MessageSquare size={18} /> Feedbacks
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
        
        {/* ABA 1: DASHBOARD DE OPERAÇÕES */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
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
        )}

        {/* ABA 2: MODERAÇÃO DE RELATOS PRIVADOS */}
        {activeTab === 'moderation' && (
          <div className="space-y-6">
            <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <ShieldAlert className="text-red-500" size={24} />
                Auditoria de Relatos Privados
              </h3>
              <p className="text-sm text-slate-400 mb-6">
                Todas as ocorrências criadas dentro de grupos (Rede Privada) são direcionadas para esta central de moderação. Avalie se há mau uso e aplique banimento se necessário.
              </p>

              <div className="space-y-4">
                {privateReports.length > 0 ? (
                  privateReports.map(report => (
                    <div key={report.id} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-white">{report.type}</h4>
                          <p className="text-xs text-slate-400">Grupo: <span className="text-indigo-400 font-medium">{report.groupName || 'Rede Privada'}</span></p>
                          <p className="text-xs text-slate-500">Autor: {report.authorName} • {report.createdAt?.toDate ? format(report.createdAt.toDate(), "dd/MM/yy 'às' HH:mm", { locale: ptBR }) : ''}</p>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => deleteReport(report.id)}
                            className="bg-slate-800 p-2 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                            title="Apagar Ocorrência"
                          >
                            <Trash2 size={16} />
                          </button>
                          <button 
                            onClick={() => blockUser(report.authorId)}
                            className="bg-red-500/20 border border-red-500/50 p-2 rounded-lg text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                            title="Bloquear Perfil"
                          >
                            <ShieldBan size={16} />
                          </button>
                        </div>
                      </div>
                      
                      {report.description && (
                        <p className="text-sm text-slate-300 bg-slate-900 p-3 rounded-xl border-l-2 border-indigo-500 italic">
                          "{report.description}"
                        </p>
                      )}

                      {report.attachments && report.attachments.length > 0 && (
                        <div className="mt-2">
                          <AttachmentGallery attachments={report.attachments} />
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 bg-slate-900/50 rounded-2xl border border-slate-800">
                    <CheckCircle2 className="mx-auto text-green-500 mb-3" size={32} />
                    <p className="text-slate-400 font-medium">Nenhum relato privado no momento.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ABA 3: GESTÃO DE FEEDBACKS */}
        {activeTab === 'feedbacks' && (
          <div className="space-y-6">
            <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <MessageSquare className="text-blue-500" size={24} />
                Gestão de Feedbacks
              </h3>
              <p className="text-sm text-slate-400 mb-6">
                Avaliações e sugestões enviadas pelos usuários. Envie um feedback de retorno para melhorar o engajamento e aprimorar a plataforma com as sugestões.
              </p>

              <div className="space-y-4">
                {feedbacks.length > 0 ? (
                  feedbacks.map(fb => (
                    <div key={fb.id} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{fb.userName}</span>
                            <span className="text-xs bg-slate-800 text-yellow-500 px-2 py-0.5 rounded-full font-bold">★ {fb.rating}/5</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{fb.createdAt?.toDate ? format(fb.createdAt.toDate(), "dd/MM/yyyy HH:mm", { locale: ptBR }) : ''}</p>
                        </div>
                      </div>
                      
                      <p className="text-sm text-slate-300">
                        {fb.comment}
                      </p>

                      {/* Resposta do Admin */}
                      {fb.adminResponse ? (
                        <div className="mt-2 bg-blue-950/30 border border-blue-900/50 p-3 rounded-xl">
                          <p className="text-xs text-blue-400 font-bold mb-1 flex items-center gap-1">
                            <CheckCircle2 size={12} /> Resposta enviada:
                          </p>
                          <p className="text-sm text-slate-300 italic">"{fb.adminResponse}"</p>
                        </div>
                      ) : (
                        <div className="mt-2 flex items-center gap-2">
                          <input 
                            type="text" 
                            placeholder="Escreva uma resposta ao usuário..."
                            value={replyText[fb.id] || ''}
                            onChange={(e) => setReplyText(prev => ({ ...prev, [fb.id]: e.target.value }))}
                            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                          />
                          <button 
                            onClick={() => sendFeedbackReply(fb.id)}
                            className="bg-blue-600 p-2.5 rounded-xl text-white hover:bg-blue-500 transition-colors"
                          >
                            <Send size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 bg-slate-900/50 rounded-2xl border border-slate-800">
                    <p className="text-slate-400 font-medium">Nenhum feedback recebido ainda.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
