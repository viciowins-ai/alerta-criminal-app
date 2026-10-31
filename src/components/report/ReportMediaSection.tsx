import React from 'react';
import { Camera, Video, Image as ImageIcon, Loader2, AlertTriangle, Shield, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatFileSize } from '../../utils/imageCompressor';

interface ReportMediaSectionProps {
  attachments: File[];
  isCompressingImage: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  galleryInputRef: React.RefObject<HTMLInputElement | null>;
  videoInputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTriggerInAppCamera: (mode: 'photo' | 'video') => void;
  onEditImage: (file: File) => void;
  onEditVideo: (file: File) => void;
  onRemoveAttachment: (index: number) => void;
}

export function ReportMediaSection({
  attachments,
  isCompressingImage,
  fileInputRef,
  galleryInputRef,
  videoInputRef,
  onFileChange,
  onTriggerInAppCamera,
  onEditImage,
  onEditVideo,
  onRemoveAttachment,
}: ReportMediaSectionProps) {
  const { t } = useTranslation();

  const isVideoFile = (f: File) => f.type.startsWith('video/') || /\.(mp4|mov|avi|webm|mkv|3gp|m4v|ogv)$/i.test(f.name);

  return (
    <div>
      <h3 className="text-sm font-semibold text-white mb-3">
        {t('report.attachmentsTitle', 'Anexos (Opcional)')}
      </h3>
      <div className="grid grid-cols-3 gap-2.5">
        {/* Hidden Native Inputs */}
        <input 
          type="file" 
          accept="image/*" 
          capture="environment"
          ref={fileInputRef} 
          onChange={onFileChange} 
          className="hidden" 
        />
        <input 
          type="file" 
          accept="image/*,video/*" 
          multiple
          ref={galleryInputRef} 
          onChange={onFileChange} 
          className="hidden" 
        />
        <input 
          type="file" 
          accept="video/*" 
          capture="environment"
          ref={videoInputRef} 
          onChange={onFileChange} 
          className="hidden" 
        />

        {/* 1. Tirar Foto (Câmera Integrada de Alta Performance) */}
        <button 
          type="button" 
          onClick={() => onTriggerInAppCamera('photo')} 
          className="bg-slate-800/60 border border-dashed border-blue-500/40 rounded-2xl p-3 flex flex-col items-center justify-center gap-1.5 hover:bg-slate-800 hover:border-blue-400 transition-all group active:scale-95 cursor-pointer"
        >
          <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-full group-hover:bg-blue-500/20 transition-colors">
            <Camera size={20} className="drop-shadow-sm" />
          </div>
          <span className="text-[11px] font-bold text-slate-200">
            {t('report.takePhoto', 'Tirar Foto')}
          </span>
        </button>

        {/* 2. Galeria / Arquivos */}
        <button 
          type="button" 
          onClick={() => galleryInputRef.current?.click()} 
          className="bg-slate-800/60 border border-dashed border-slate-600 rounded-2xl p-3 flex flex-col items-center justify-center gap-1.5 hover:bg-slate-800 hover:border-slate-400 transition-all group active:scale-95 cursor-pointer"
        >
          <div className="p-2.5 bg-slate-900/60 text-slate-300 rounded-full group-hover:bg-slate-700 transition-colors">
            <ImageIcon size={20} />
          </div>
          <span className="text-[11px] font-bold text-slate-300">
            {t('report.gallery', 'Galeria')}
          </span>
        </button>

        {/* 3. Gravar Vídeo (Abre Câmera de Vídeo Integrada ou Nativa) */}
        <button 
          type="button" 
          onClick={() => onTriggerInAppCamera('video')} 
          className="bg-slate-800/60 border border-dashed border-red-500/40 rounded-2xl p-3 flex flex-col items-center justify-center gap-1.5 hover:bg-slate-800 hover:border-red-400 transition-all group active:scale-95 cursor-pointer"
        >
          <div className="p-2.5 bg-red-500/10 text-red-400 rounded-full group-hover:bg-red-500/20 transition-colors">
            <Video size={20} className="drop-shadow-sm" />
          </div>
          <span className="text-[11px] font-bold text-slate-200">
            {t('report.recordVideo', 'Gravar Vídeo')}
          </span>
        </button>
      </div>

      {isCompressingImage && (
        <div className="mt-2.5 flex items-center justify-center gap-2 p-2 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-300 text-xs animate-pulse">
          <Loader2 size={14} className="animate-spin text-blue-400" />
          <span>Otimizando imagem para evitar travamentos de memória...</span>
        </div>
      )}
      
      <p className="text-[11px] text-red-400/80 text-center font-medium px-4 mt-2">
        {t('report.legalNotice', '⚠️ Por motivos legais, evite filmar rostos de terceiros e placas de viaturas. Use o desfoque antes de enviar.')}
      </p>
      
      {attachments.length > 0 && (
        <div className="mt-4 space-y-3">
          <div className="flex gap-2.5 overflow-x-auto pb-2">
            {attachments.map((file, index) => {
              const isVid = isVideoFile(file);
              const isHeavy = file.size > 15 * 1024 * 1024;
              return (
                <div key={index} className="relative w-28 h-28 shrink-0 rounded-2xl overflow-hidden border border-slate-700 bg-slate-800/90 group shadow-md flex flex-col">
                  {!isVid ? (
                    <div 
                      onClick={() => onEditImage(file)}
                      className="w-full h-full cursor-pointer relative"
                      title="Toque para editar o desfoque da foto"
                    >
                      <img src={URL.createObjectURL(file)} alt="attachment" className="w-full h-full object-cover" />
                      <div className="absolute inset-x-0 bottom-0 bg-slate-950/80 backdrop-blur-xs py-1 px-1.5 flex items-center justify-between text-[9px] text-slate-300">
                        <span className="truncate max-w-[55px] font-medium">{file.name}</span>
                        <span className="font-bold text-slate-400">{formatFileSize(file.size)}</span>
                      </div>
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <span className="text-[10px] text-white font-bold bg-slate-900/90 px-1.5 py-0.5 rounded">Editar Foto</span>
                      </div>
                    </div>
                  ) : (
                    <div 
                      onClick={() => onEditVideo(file)}
                      className="w-full h-full bg-slate-900 border border-blue-500/30 flex flex-col items-center justify-between cursor-pointer hover:bg-slate-850 transition-colors p-2 text-center relative"
                      title="Toque para abrir editor de privacidade e desfoque do vídeo"
                    >
                      <div className="p-2 bg-blue-600/20 text-blue-400 rounded-full mt-1">
                        <Video size={20} />
                      </div>
                      <div className="w-full">
                        <span className="text-[9px] text-blue-300 font-bold flex items-center justify-center gap-0.5 leading-tight">
                          <Shield size={10} className="text-blue-400 shrink-0" /> Desfocar Vídeo
                        </span>
                        <span className="text-[8px] text-slate-400 truncate block max-w-full mt-0.5">
                          {file.name}
                        </span>
                        <span className={`text-[9px] font-bold block mt-0.5 ${isHeavy ? 'text-amber-400' : 'text-slate-400'}`}>
                          {isHeavy ? '⚠️ ' : ''}{formatFileSize(file.size)}
                        </span>
                      </div>
                    </div>
                  )}
                  <button 
                    type="button" 
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveAttachment(index);
                    }}
                    className="absolute top-1.5 right-1.5 bg-black/80 hover:bg-red-500 rounded-full p-1 transition-colors z-10 cursor-pointer"
                    title="Remover anexo"
                  >
                    <X size={12} className="text-white" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Dica se houver vídeo pesado (> 15MB) */}
          {attachments.some(f => isVideoFile(f) && f.size > 15 * 1024 * 1024) && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-2.5 text-xs text-amber-200">
              <AlertTriangle size={17} className="text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <p className="font-bold text-amber-300 text-xs">
                  Vídeo pesado em alta resolução ({formatFileSize(attachments.find(f => isVideoFile(f))?.size || 0)})
                </p>
                <p className="text-[11px] text-amber-200/90 leading-relaxed">
                  Em redes móveis (4G/3G), vídeos gravados pela câmera do celular levam de 1 a 3 minutos para envio completo aos servidores.
                </p>
                <p className="text-[11px] text-amber-300/90 font-medium">
                  💡 <strong>Dica rápida:</strong> Se preferir envio instantâneo sem esperar o upload do vídeo, você pode tocar no vídeo e escolher <em>"Extrair Foto"</em>.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
