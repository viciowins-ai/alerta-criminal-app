import React, { useState, useEffect } from 'react';
import { TopBar } from '../components/TopBar';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import { Save, Edit2 } from 'lucide-react';

export function AccountSettingsPage() {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

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
    
    setIsSaving(true);
    
    try {
      const docRef = doc(db, 'users', user.uid);
      
      // Update in background
      updateDoc(docRef, { name, phone }).catch(err => {
        console.error("Erro background updateDoc:", err);
      });
      
      alert('Dados atualizados com sucesso!');
      setIsEditing(false);
    } catch (err: any) {
      console.error("Erro ao iniciar salvamento:", err);
      alert('Erro do banco de dados: ' + (err.message || 'Desconhecido'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900">
      <TopBar title="Minha Conta" showBack />
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20">
        <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-slate-400">Nome Completo</label>
            {!isEditing && (
              <button onClick={() => setIsEditing(true)} className="text-blue-400 hover:text-blue-300 p-1">
                <Edit2 size={16} />
              </button>
            )}
          </div>
          {isEditing ? (
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none transition-colors" 
              placeholder="Seu nome"
            />
          ) : (
            <div className="text-white text-lg font-medium px-1 py-1">{name || 'Não informado'}</div>
          )}
        </div>
        <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-slate-400">Telefone</label>
            {!isEditing && (
              <button onClick={() => setIsEditing(true)} className="text-blue-400 hover:text-blue-300 p-1">
                <Edit2 size={16} />
              </button>
            )}
          </div>
          {isEditing ? (
            <input 
              type="tel" 
              value={phone} 
              onChange={e => setPhone(e.target.value)} 
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none transition-colors" 
              placeholder="(11) 99999-9999"
            />
          ) : (
            <div className="text-white text-lg font-medium px-1 py-1">{phone || 'Não informado'}</div>
          )}
        </div>
        {isEditing && (
          <button 
            onClick={handleSave} 
            disabled={isSaving} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 mt-4"
          >
            <Save size={20} />
            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        )}
      </div>
    </div>
  );
}
