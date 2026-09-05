import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Plus, Users, Search, ArrowRight, UserPlus, LogOut, Copy, Check } from 'lucide-react';
import { TopBar } from '../components/TopBar';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, query, where, getDocs, doc, updateDoc, arrayUnion, arrayRemove, serverTimestamp } from 'firebase/firestore';

export function GroupsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchGroups = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const q = query(collection(db, 'groups'), where('members', 'array-contains', user.uid));
      const querySnapshot = await getDocs(q);
      const groupsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setGroups(groupsData);
    } catch (err) {
      console.error("Error fetching groups", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [user]);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newGroupName.trim()) return;
    
    // Generate a 6-character random alphanumeric code
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    try {
      const payload = {
        name: newGroupName.trim(),
        inviteCode,
        createdBy: user.uid,
        members: [user.uid],
        // @ts-ignore
        createdAt: serverTimestamp()
      };
      // console.log('Creating group payload:', payload);
      await addDoc(collection(db, 'groups'), payload);
      setNewGroupName('');
      setIsCreating(false);
      fetchGroups();
    } catch (err) {
      console.error("Error creating group", err);
      alert(`Erro ao criar o grupo. Tente novamente. Detalhes: ${err.message || err}`);
    }
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !joinCode.trim()) return;
    
    const code = joinCode.trim().toUpperCase();
    
    try {
      const q = query(collection(db, 'groups'), where('inviteCode', '==', code));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        alert("Código de convite inválido ou grupo não encontrado.");
        return;
      }
      
      const groupDoc = querySnapshot.docs[0];
      const groupData = groupDoc.data();
      
      if (groupData.members.includes(user.uid)) {
        alert("Você já faz parte deste grupo!");
        return;
      }
      
      await updateDoc(doc(db, 'groups', groupDoc.id), {
        members: arrayUnion(user.uid)
      });
      
      setJoinCode('');
      setIsJoining(false);
      fetchGroups();
      alert(`Você entrou no grupo: ${groupData.name}`);
    } catch (err) {
      console.error("Error joining group", err);
      alert("Erro ao entrar no grupo. Tente novamente.");
    }
  };

  const handleLeaveGroup = async (groupId: string, groupName: string) => {
    if (!user) return;
    if (confirm(`Tem certeza que deseja sair do grupo "${groupName}"?`)) {
      try {
        await updateDoc(doc(db, 'groups', groupId), {
          members: arrayRemove(user.uid)
        });
        fetchGroups();
      } catch (err) {
        console.error("Error leaving group", err);
        alert("Erro ao sair do grupo.");
      }
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900">
      <TopBar title="Redes de Vizinhos" showBack />
      
      <div className="flex-1 overflow-y-auto p-4 pb-20">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white mb-2">Círculos de Confiança</h2>
          <p className="text-slate-400 text-sm">
            Crie ou entre em redes privadas para compartilhar alertas de segurança exclusivos com sua rua, condomínio ou bairro.
          </p>
        </div>

        <div className="flex gap-3 mb-8">
          <button 
            onClick={() => { setIsCreating(true); setIsJoining(false); }}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 px-4 flex items-center justify-center gap-2 font-medium transition-colors"
          >
            <Plus size={18} />
            Criar Grupo
          </button>
          <button 
            onClick={() => { setIsJoining(true); setIsCreating(false); }}
            className="flex-1 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white rounded-xl py-3 px-4 flex items-center justify-center gap-2 font-medium transition-colors"
          >
            <UserPlus size={18} />
            Entrar
          </button>
        </div>

        {isCreating && (
          <form onSubmit={handleCreateGroup} className="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-8 animate-in fade-in slide-in-from-top-4">
            <h3 className="text-white font-bold mb-3">Criar Novo Grupo</h3>
            <input 
              type="text" 
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Ex: Moradores da Rua das Flores"
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-3 mb-3 focus:outline-none focus:border-blue-500"
              required
            />
            <div className="flex gap-2">
              <button type="button" onClick={() => setIsCreating(false)} className="flex-1 py-2 text-slate-400 font-medium">Cancelar</button>
              <button type="submit" className="flex-1 bg-blue-600 text-white rounded-lg py-2 font-medium">Criar</button>
            </div>
          </form>
        )}

        {isJoining && (
          <form onSubmit={handleJoinGroup} className="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-8 animate-in fade-in slide-in-from-top-4">
            <h3 className="text-white font-bold mb-3">Entrar com Código</h3>
            <input 
              type="text" 
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Digite o código de 6 dígitos"
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-3 mb-3 focus:outline-none focus:border-blue-500 text-center uppercase tracking-widest font-bold"
              maxLength={6}
              required
            />
            <div className="flex gap-2">
              <button type="button" onClick={() => setIsJoining(false)} className="flex-1 py-2 text-slate-400 font-medium">Cancelar</button>
              <button type="submit" className="flex-1 bg-blue-600 text-white rounded-lg py-2 font-medium">Entrar</button>
            </div>
          </form>
        )}

        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
          <Shield size={18} className="text-blue-500" />
          Seus Grupos
        </h3>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : groups.length === 0 ? (
          <div className="bg-slate-800/50 rounded-xl p-8 text-center border border-slate-700/50">
            <Users size={48} className="text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 font-medium">Você ainda não faz parte de nenhuma rede privada.</p>
            <p className="text-slate-500 text-sm mt-2">Crie um grupo ou peça um código de convite para um vizinho.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map(group => (
              <div key={group.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-white font-bold text-lg">{group.name}</h4>
                  <span className="bg-slate-900 text-slate-300 text-xs px-2 py-1 rounded-md font-medium border border-slate-700">
                    {group.members.length} {group.members.length === 1 ? 'membro' : 'membros'}
                  </span>
                </div>
                
                <div className="mt-4 pt-4 border-t border-slate-700 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Código de Convite:</p>
                      <p className="text-white font-mono font-bold tracking-widest text-lg">{group.inviteCode}</p>
                    </div>
                    <button 
                      onClick={() => copyToClipboard(group.inviteCode)}
                      className="bg-slate-700 hover:bg-slate-600 text-white p-2 rounded-lg transition-colors flex items-center gap-2"
                    >
                      {copiedCode === group.inviteCode ? (
                        <Check size={16} className="text-green-400" />
                      ) : (
                        <Copy size={16} />
                      )}
                      <span className="text-xs font-medium">{copiedCode === group.inviteCode ? 'Copiado' : 'Copiar'}</span>
                    </button>
                  </div>
                  
                  <div className="flex justify-end mt-2">
                    <button 
                      onClick={() => handleLeaveGroup(group.id, group.name)}
                      className="text-red-400 hover:text-red-300 text-xs font-medium flex items-center gap-1"
                    >
                      <LogOut size={14} /> Sair do Grupo
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
