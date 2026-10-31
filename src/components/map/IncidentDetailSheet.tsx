import React from 'react';
import { X, ThumbsUp, Navigation, Share2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AudioPlayer } from '../AudioPlayer';
import { AttachmentGallery } from '../AttachmentGallery';

interface IncidentDetailSheetProps {
  selectedLocation: any;
  currentUserId?: string;
  currentUserEmail?: string | null;
  onClose: () => void;
  onNavigateRoute: (address: string) => void;
  onUpvote: (id: string) => void;
  onShare: () => void;
  onDelete: () => void;
  getRiskLevel: (type: string) => string;
  getLabel: (type: string) => string;
}

export function IncidentDetailSheet({
  selectedLocation,
  currentUserId,
  currentUserEmail,
  onClose,
  onNavigateRoute,
  onUpvote,
  onShare,
  onDelete,
  getRiskLevel,
  getLabel,
}: IncidentDetailSheetProps) {
  const { t } = useTranslation();

  if (!selectedLocation) return null;

  const isAuthorOrAdmin = currentUserId === selectedLocation.authorId || currentUserEmail === 'viciowins@gmail.com';
  const hasUpvoted = currentUserId && selectedLocation.upvotedBy?.includes(currentUserId);

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-slate-950/95 backdrop-blur-xl rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.7)] p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] z-50 transition-transform border-t border-slate-700/60 animate-in slide-in-from-bottom-full max-h-[50vh] flex flex-col">
      <div className="relative flex items-center justify-center mb-4 shrink-0">
        <div 
          className="w-12 h-1.5 bg-slate-700 rounded-full cursor-pointer hover:bg-slate-600 transition-colors" 
          onClick={onClose} 
        />
        <button 
          onClick={onClose}
          className="absolute right-0 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          title={t('common.close', 'Fechar')}
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar -mx-5 px-5 pb-2">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 pr-4">
            <h2 className="text-xl font-black text-white tracking-tight mb-1 line-clamp-2">
              {selectedLocation.location?.address || getLabel(selectedLocation.type)}
            </h2>
            <div className="flex items-center gap-3 mt-2">
              <p className="text-sm text-slate-400 font-medium">
                {t('map.riskLevels.risk', 'Risco')}:{' '}
                <span className={`font-bold drop-shadow-[0_0_8px_rgba(239,68,68,0.5)] ${
                  selectedLocation.type === 'roubo' ? 'text-red-500' :
                  selectedLocation.type === 'suspeito' ? 'text-orange-500' :
                  selectedLocation.type === 'zeladoria' || selectedLocation.type === 'vandalismo' ? 'text-yellow-500' : 'text-green-500'
                }`}>
                  {getRiskLevel(selectedLocation.type)}
                </span>
              </p>
              <div className="w-1 h-1 rounded-full bg-slate-600" />
              <p className="text-sm text-slate-400 font-medium flex items-center gap-1">
                <ThumbsUp size={14} className={hasUpvoted ? 'text-blue-400' : ''} />
                {selectedLocation.upvotes || 0} {t('map.confirmed', 'confirmaram')}
              </p>
              {selectedLocation.authorName && (
                <>
                  <div className="w-1 h-1 rounded-full bg-slate-600" />
                  <p className="text-sm text-slate-400 font-medium">
                    {t('map.byAuthor', 'Por:')} <span className="text-white">{selectedLocation.authorName}</span>
                  </p>
                </>
              )}
            </div>
          </div>
          <div className="bg-slate-900/50 border border-white/5 rounded-xl p-2 text-center min-w-[4rem] shrink-0">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">
              {t('map.status', 'Status')}
            </p>
            <p className={`text-sm font-black leading-none ${
              selectedLocation.status === 'verified' ? 'text-green-500' :
              selectedLocation.status === 'pending' ? 'text-yellow-500' : 'text-red-500'
            }`}>
              {selectedLocation.status === 'verified' 
                ? t('map.statusVerified', 'Verificado') 
                : selectedLocation.status === 'pending' 
                ? t('map.statusPending', 'Pendente') 
                : t('map.statusFake', 'Falso')}
            </p>
          </div>
        </div>
        
        {selectedLocation.description && (
          <p className="text-sm text-slate-300 mb-4 italic border-l-2 border-slate-600 pl-3">
            "{selectedLocation.description}"
          </p>
        )}

        {selectedLocation.audioUrl && (
          <div className="mb-4">
            <AudioPlayer src={selectedLocation.audioUrl} duration={selectedLocation.audioDuration} />
          </div>
        )}

        {selectedLocation.attachments && selectedLocation.attachments.length > 0 && (
          <div className="mb-4">
            <AttachmentGallery attachments={selectedLocation.attachments} />
          </div>
        )}
      </div>

      <div className="flex gap-3 overflow-x-auto pt-3 pb-1 hide-scrollbar shrink-0 border-t border-slate-800 mt-2">
        <button 
          onClick={() => onNavigateRoute(selectedLocation.location?.address || '')}
          className="flex flex-col items-center gap-1.5 min-w-[68px] cursor-pointer"
        >
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-lg active:scale-95 transition-transform">
            <Navigation size={18} />
          </div>
          <span className="text-[11px] font-bold text-blue-500">{t('nav.routes', 'Rotas')}</span>
        </button>

        <button 
          onClick={() => onUpvote(selectedLocation.id)}
          className="flex flex-col items-center gap-1.5 min-w-[68px] cursor-pointer"
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all duration-300 ${
            hasUpvoted 
              ? 'bg-blue-500 text-white shadow-blue-500/30 border border-blue-400' 
              : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
          }`}>
            <ThumbsUp size={18} className={hasUpvoted ? 'fill-current' : ''} />
          </div>
          <span className={`text-[11px] font-bold ${hasUpvoted ? 'text-blue-400' : 'text-slate-300'}`}>
            {hasUpvoted ? t('map.confirmedAction', 'Confirmado') : t('map.confirmAction', 'Confirmar')}
          </span>
        </button>

        <button 
          onClick={onShare}
          className="flex flex-col items-center gap-1.5 min-w-[68px] cursor-pointer"
        >
          <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-white shadow-lg active:scale-95 transition-transform">
            <Share2 size={18} />
          </div>
          <span className="text-[11px] font-bold text-slate-300">{t('map.share', 'Compartilhar')}</span>
        </button>

        {isAuthorOrAdmin && (
          <button 
            onClick={onDelete}
            className="flex flex-col items-center gap-1.5 min-w-[68px] cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-red-500/50 flex items-center justify-center text-red-500 shadow-lg active:scale-95 transition-transform">
              <X size={18} />
            </div>
            <span className="text-[11px] font-bold text-red-500">{t('map.delete', 'Excluir')}</span>
          </button>
        )}
      </div>
    </div>
  );
}
