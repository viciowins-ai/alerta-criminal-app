import React, { useState, useEffect } from 'react';
import { TopBar } from '../components/TopBar';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import { Save } from 'lucide-react';

export function AccountSettingsPage() {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setName(data.name || user.displayName || '');
          setPhone(data.phone || '');
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'users');
      }
    };
    fetchProfile();
  }, [user]);

  const handleSave = () => {
    if (!user) return;
    
    // Mostra que iniciou (opcional, já que vai ser bem rápido agora)
    setIsSaving(true);
    
    try {
      const docRef = doc(db, 'users', user.uid);
      
      // Removemos o `await` e a promessa de timeout.
      // O Firebase vai salvar localmente instantaneamente e sincronizar em background.
      // Isso evita o travamento "Salvando..." se a internet ou WebSocket estiver instável no celular.
      setDoc(docRef, { name, phone, uid: user.uid }, { merge: true }).catch(err => {
        console.error("Erro em background ao salvar perfil:", err);
      });
      
      // Feedback imediato para o usuário (Optimistic UI)
      alert('Dados atualizados com sucesso!');
    } catch (err) {
      console.error("Erro ao iniciar salvamento:", err);
      alert('Erro ao tentar salvar os dados.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900">
      <TopBar title="Minha Conta" showBack />
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20">
        <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700">
          <label className="block text-sm font-medium text-slate-400 mb-2">Nome Completo</label>
          <input 
            type="text" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none transition-colors" 
            placeholder="Seu nome"
          />
        </div>
        <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700">
          <label className="block text-sm font-medium text-slate-400 mb-2">Telefone</label>
          <input 
            type="tel" 
            value={phone} 
            onChange={e => setPhone(e.target.value)} 
            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none transition-colors" 
            placeholder="(11) 99999-9999"
          />
        </div>
        <button 
          onClick={handleSave} 
          disabled={isSaving} 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
        >
          <Save size={20} />
          {isSaving ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>
    </div>
  );
}
