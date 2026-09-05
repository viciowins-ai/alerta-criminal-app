import React, { useRef } from 'react';
import { ShieldAlert, X, Phone, MessageCircle, PhoneCall, Mic, Video, CheckCircle2 } from 'lucide-react';

interface Contact {
  name: string;
  phone: string;
}

interface SOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: Contact[];
  location: { lat: number; lng: number } | null;
  isRecordingAudio?: boolean;
  onVideoUpload?: (file: File) => void;
}

export function SOSModal({ isOpen, onClose, contacts, location, isRecordingAudio, onVideoUpload }: SOSModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [videoAttached, setVideoAttached] = React.useState(false);

  if (!isOpen) return null;

  const handleWhatsApp = (phone: string) => {
    if (!location) return;
    const message = encodeURIComponent(
      `🚨 *ALERTA DE EMERGÊNCIA (SOS)* 🚨\n\nPreciso de ajuda! Esta é minha localização atual:\nhttps://maps.google.com/?q=${location.lat},${location.lng}`
    );
    let cleanPhone = phone.replace(/\D/g, '');
    
    // Remove 55 if it's already there to standardize processing
    if (cleanPhone.startsWith('55') && cleanPhone.length > 11) {
      cleanPhone = cleanPhone.substring(2);
    }
    
    // Ensure it has the country code (55 for Brazil)
    if (!cleanPhone.startsWith('55') && cleanPhone.length >= 10) {
      cleanPhone = `55${cleanPhone}`;
    } else if (!cleanPhone.startsWith('55') && cleanPhone.length < 10) {
       cleanPhone = `55${cleanPhone}`;
    }
    
    const waLink = `https://wa.me/${cleanPhone}?text=${message}`;
    window.open(waLink, '_blank');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      if (onVideoUpload) {
        onVideoUpload(e.target.files[0]);
        setVideoAttached(true);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-red-500/30 rounded-3xl w-full max-w-sm shadow-[0_0_40px_rgba(220,38,38,0.2)] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="bg-red-600/10 p-6 text-center relative border-b border-red-500/20 shrink-0">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors bg-slate-800/50 rounded-full p-1"
          >
            <X size={20} />
          </button>
          
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/30">
            <ShieldAlert size={24} className="text-red-500 animate-pulse" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">SOS Registrado!</h2>
          <p className="text-slate-300 text-sm">
            Seu alerta foi salvo no sistema. Peça ajuda imediatamente:
          </p>
          
          {isRecordingAudio && (
            <div className="mt-4 flex items-center justify-center gap-2 text-red-400 bg-red-500/10 py-2 px-4 rounded-full border border-red-500/20 animate-pulse">
              <Mic size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">Gravando Áudio (10s)...</span>
            </div>
          )}
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          {/* Botão Fixo da Polícia */}
          <div className="mb-4">
            <a
              href="tel:190"
              className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-colors shadow-lg shadow-red-600/20"
            >
              <PhoneCall size={24} />
              LIGAR PARA POLÍCIA (190)
            </a>
          </div>

          <div className="mb-6">
            <input 
              type="file" 
              accept="video/*" 
              capture="environment" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={videoAttached}
              className={`w-full py-3 rounded-2xl flex items-center justify-center gap-2 transition-colors border ${
                videoAttached 
                  ? 'bg-green-500/10 border-green-500/30 text-green-400 cursor-default' 
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
              }`}
            >
              {videoAttached ? (
                <>
                  <CheckCircle2 size={20} />
                  <span className="font-bold text-sm">Vídeo Anexado</span>
                </>
              ) : (
                <>
                  <Video size={20} />
                  <span className="font-bold text-sm">Gravar/Anexar Vídeo (Opcional)</span>
                </>
              )}
            </button>
          </div>

          <div className="mb-4 flex items-center gap-2">
            <div className="h-px bg-slate-800 flex-1"></div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contatos de Confiança</span>
            <div className="h-px bg-slate-800 flex-1"></div>
          </div>

          {contacts.length === 0 ? (
            <div className="text-center py-6 bg-slate-800/30 rounded-2xl border border-slate-700/50">
              <p className="text-slate-400 text-sm mb-4 px-4">Você ainda não possui contatos de confiança cadastrados.</p>
              <button 
                onClick={() => {
                  onClose();
                  window.location.href = '/trusted-contacts';
                }}
                className="bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-700 transition-colors border border-slate-700"
              >
                Configurar Contatos
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {contacts.map((contact, idx) => (
                <div key={idx} className="bg-slate-800/50 border border-slate-700 rounded-2xl p-3 flex items-center justify-between">
                  <div>
                    <p className="text-white font-bold text-sm">{contact.name}</p>
                    <p className="text-slate-400 text-xs flex items-center gap-1 mt-0.5">
                      <Phone size={10} />
                      {contact.phone}
                    </p>
                  </div>
                  <button
                    onClick={() => handleWhatsApp(contact.phone)}
                    className="bg-[#25D366] hover:bg-[#20bd5a] text-white px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors shadow-lg shadow-[#25D366]/20"
                  >
                    <MessageCircle size={16} />
                    WhatsApp
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-slate-800 bg-slate-900/50 shrink-0">
          <button
            onClick={onClose}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
