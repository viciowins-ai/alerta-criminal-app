import React, { useState, useEffect } from 'react';
import { TopBar } from '../components/TopBar';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';

export function PrivacySettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState({ anonymousReports: false, shareLocation: true });

  useEffect(() => {
    const fetchSettings = async () => {
      if (!user) return;
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().privacySettings) {
          setSettings(docSnap.data().privacySettings);
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'users');
      }
    };
    fetchSettings();
  }, [user]);

  const toggleSetting = async (key: keyof typeof settings) => {
    if (!user) return;
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    try {
      const docRef = doc(db, 'users', user.uid);
      await updateDoc(docRef, { privacySettings: newSettings });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'users');
      // Revert on error
      setSettings(settings);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900">
      <TopBar title="Privacidade" showBack />
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20">
        <ToggleItem 
          label="Reportar Anonimamente" 
          description="Seu nome não aparecerá nos alertas que você criar no mapa. Apenas a equipe de moderação terá acesso." 
          checked={settings.anonymousReports} 
          onChange={() => toggleSetting('anonymousReports')} 
        />
        <ToggleItem 
          label="Compartilhar Localização" 
          description="Permite que o aplicativo use seu GPS para mostrar alertas em tempo real ao seu redor." 
          checked={settings.shareLocation} 
          onChange={() => toggleSetting('shareLocation')} 
        />
      </div>
    </div>
  );
}

function ToggleItem({ label, description, checked, onChange }: { label: string, description: string, checked: boolean, onChange: () => void }) {
  return (
    <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 flex items-center justify-between">
      <div className="flex-1 pr-4">
        <p className="font-bold text-white text-sm">{label}</p>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{description}</p>
      </div>
      <button 
        onClick={onChange} 
        className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${checked ? 'bg-blue-500' : 'bg-slate-600'}`}
      >
        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${checked ? 'left-7' : 'left-1'}`} />
      </button>
    </div>
  );
}
