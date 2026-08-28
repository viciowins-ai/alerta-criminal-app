import React, { useState, useEffect } from 'react';
import { TopBar } from '../components/TopBar';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import { UserPlus, Trash2, Phone, AlertTriangle, Loader2, Edit2, X } from 'lucide-react';

interface Contact {
  name: string;
  phone: string;
}

export function TrustedContactsPage() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContacts = async () => {
      if (!user) return;
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.trustedContacts) {
            setContacts(data.trustedContacts);
          }
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'users');
      } finally {
        setIsLoading(false);
      }
    };

    fetchContacts();
  }, [user]);

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!newName.trim() || !newPhone.trim()) {
      setError('Preencha nome e telefone.');
      return;
    }
    if (editingIndex === null && contacts.length >= 10) {
      setError('Você pode adicionar no máximo 10 contatos.');
      return;
    }

    setIsSaving(true);
    setError(null);

    let updatedContacts;
    if (editingIndex !== null) {
      updatedContacts = [...contacts];
      updatedContacts[editingIndex] = { name: newName.trim(), phone: newPhone.trim() };
    } else {
      updatedContacts = [...contacts, { name: newName.trim(), phone: newPhone.trim() }];
    }

    try {
      const docRef = doc(db, 'users', user.uid);
      updateDoc(docRef, { trustedContacts: updatedContacts }).catch(e => console.error(e));
      setContacts(updatedContacts);
      setNewName('');
      setNewPhone('');
      setEditingIndex(null);
    } catch (err) {
      setError('Erro ao salvar contato.');
      handleFirestoreError(err, OperationType.UPDATE, 'users');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditClick = (index: number) => {
    setEditingIndex(index);
    setNewName(contacts[index].name);
    setNewPhone(contacts[index].phone);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setNewName('');
    setNewPhone('');
    setError(null);
  };

  const handleRemoveContact = async (indexToRemove: number) => {
    if (!user) return;
    setIsSaving(true);
    setError(null);

    const updatedContacts = contacts.filter((_, index) => index !== indexToRemove);

    try {
      const docRef = doc(db, 'users', user.uid);
      updateDoc(docRef, { trustedContacts: updatedContacts }).catch(e => console.error(e));
      setContacts(updatedContacts);
    } catch (err) {
      setError('Erro ao remover contato.');
      handleFirestoreError(err, OperationType.UPDATE, 'users');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImportContact = async () => {
    const nav = navigator as any;
    if (!('contacts' in nav && 'ContactsManager' in window)) {
      setError('A importação de contatos não é suportada neste navegador/dispositivo.');
      return;
    }

    try {
      const props = ['name', 'tel'];
      const opts = { multiple: false };
      const selectedContacts = await nav.contacts.select(props, opts);
      
      if (selectedContacts && selectedContacts.length > 0) {
        const contact = selectedContacts[0];
        const name = contact.name && contact.name.length > 0 ? contact.name[0] : '';
        const phone = contact.tel && contact.tel.length > 0 ? contact.tel[0] : '';
        
        // Remove caracteres não numéricos do telefone (opcional, mas recomendado)
        const cleanPhone = phone.replace(/[^\d+]/g, '');
        
        setNewName(name);
        setNewPhone(cleanPhone);
        setError(null);
      }
    } catch (err) {
      console.error('Erro ao importar contato:', err);
      // Alguns erros são apenas o usuário cancelando a seleção
      // setError('Não foi possível importar o contato.');
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900">
      <TopBar title="Contatos de Confiança" showBack={true} />
      
      <div className="flex-1 overflow-y-auto p-4 pb-20">
        <div className="bg-blue-900/30 border border-blue-500/30 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="text-blue-400 shrink-0 mt-0.5" size={20} />
          <p className="text-sm text-blue-200">
            Adicione até 10 contatos de confiança. Eles receberão um SMS com sua localização caso você acione o botão de emergência (SOS).
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-xl mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSaveContact} className="bg-slate-800 p-4 rounded-2xl border border-slate-700 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold flex items-center gap-2">
              {editingIndex !== null ? (
                <><Edit2 size={18} className="text-blue-400" /> Editar Contato</>
              ) : (
                <><UserPlus size={18} className="text-blue-400" /> Novo Contato</>
              )}
            </h3>
            <div className="flex items-center gap-2">
              {editingIndex === null && ('contacts' in navigator && 'ContactsManager' in window) && (
                <button
                  type="button"
                  onClick={handleImportContact}
                  className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-sm bg-blue-500/10 px-2 py-1 rounded-lg transition-colors"
                >
                  <UserPlus size={14} /> Importar
                </button>
              )}
              {editingIndex !== null && (
                <button 
                  type="button" 
                  onClick={handleCancelEdit}
                  className="text-slate-400 hover:text-white flex items-center gap-1 text-sm"
                >
                  <X size={16} /> Cancelar
                </button>
              )}
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Nome</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: Mãe, João..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                maxLength={50}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Telefone (com DDD)</label>
              <input
                type="tel"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="Ex: 11999999999"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                maxLength={20}
              />
            </div>
            <button
              type="submit"
              disabled={isSaving || !newName.trim() || !newPhone.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2 mt-2"
            >
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : (editingIndex !== null ? 'Salvar Alterações' : 'Adicionar Contato')}
            </button>
          </div>
        </form>

        <div>
          <h3 className="text-white font-semibold mb-3">Seus Contatos ({contacts.length}/10)</h3>
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 size={24} className="text-blue-500 animate-spin" />
            </div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-8 bg-slate-800/50 rounded-2xl border border-slate-700 border-dashed">
              <p className="text-slate-400 text-sm">Nenhum contato adicionado ainda.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {contacts.map((contact, index) => (
                <div key={index} className={`bg-slate-800 p-4 rounded-xl border flex items-center justify-between transition-colors ${editingIndex === index ? 'border-blue-500 bg-blue-900/20' : 'border-slate-700'}`}>
                  <div>
                    <p className="text-white font-medium">{contact.name}</p>
                    <p className="text-slate-400 text-sm flex items-center gap-1 mt-0.5">
                      <Phone size={12} />
                      {contact.phone}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEditClick(index)}
                      disabled={isSaving}
                      className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                      aria-label="Editar contato"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleRemoveContact(index)}
                      disabled={isSaving}
                      className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                      aria-label="Remover contato"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
