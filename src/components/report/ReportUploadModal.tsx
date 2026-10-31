import React from 'react';
import { UploadCloud, Loader2, Siren, Wifi, Clock, AlertTriangle, X } from 'lucide-react';
import { formatFileSize } from '../../utils/imageCompressor';

export interface UploadStatusState {
  active: boolean;
  fileName: string;
  fileIndex: number;
  totalFiles: number;
  progress: number;
  bytesTransferred: number;
  totalBytes: number;
  speedKBps: number;
  estimatedSecondsLeft: number;
  phase: 'uploading' | 'saving' | 'broadcasting' | 'done';
  statusText?: string;
}

interface ReportUploadModalProps {
  isOpen: boolean;
  uploadStatus: UploadStatusState;
  onCancel: () => void;
}

export function ReportUploadModal({ isOpen, uploadStatus, onCancel }: ReportUploadModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/90 rounded-3xl p-6 max-w-sm w-full shadow-2xl flex flex-col items-center text-center space-y-4">
        {/* Animated Icon */}
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
            {uploadStatus.phase === 'uploading' ? (
              <UploadCloud size={30} className="text-blue-400 animate-pulse" />
            ) : uploadStatus.phase === 'saving' ? (
              <Loader2 size={30} className="text-indigo-400 animate-spin" />
            ) : (
              <Siren size={30} className="text-red-400 animate-pulse" />
            )}
          </div>
          <div className="absolute -inset-1 rounded-full border border-blue-400/30 animate-ping pointer-events-none" />
        </div>

        <div className="space-y-1">
          <h3 className="text-base font-bold text-white">
            {uploadStatus.phase === 'uploading'
              ? 'Enviando Ocorrência...'
              : uploadStatus.phase === 'saving'
              ? 'Gravando no Mapa...'
              : 'Notificando Moradores...'}
          </h3>
          <p className="text-xs text-slate-400">
            {uploadStatus.phase === 'uploading'
              ? `Anexo ${uploadStatus.fileIndex} de ${uploadStatus.totalFiles}: ${uploadStatus.fileName}`
              : uploadStatus.statusText || 'Processando alerta de segurança...'}
          </p>
        </div>

        {uploadStatus.phase === 'uploading' && (
          <div className="w-full space-y-2.5 bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/60">
            {/* Progress Bar & Percentage */}
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-blue-400 text-sm">
                {uploadStatus.progress}%
              </span>
              <span className="text-slate-300 font-medium">
                {formatFileSize(uploadStatus.bytesTransferred)} / {formatFileSize(uploadStatus.totalBytes)}
              </span>
            </div>

            <div className="w-full h-2.5 bg-slate-700 rounded-full overflow-hidden p-0.5 border border-slate-600/40">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-300"
                style={{ width: `${Math.max(4, uploadStatus.progress)}%` }}
              />
            </div>

            {/* Speed & Estimated Time */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5 border-t border-slate-700/50">
              <span className="flex items-center gap-1 text-slate-300">
                <Wifi size={12} className="text-blue-400" />
                {uploadStatus.speedKBps > 0 ? `${uploadStatus.speedKBps} KB/s` : 'Enviando pacotes...'}
              </span>
              <span className="flex items-center gap-1 text-slate-300">
                <Clock size={12} className="text-indigo-400" />
                {uploadStatus.estimatedSecondsLeft > 0 ? `~${uploadStatus.estimatedSecondsLeft}s restantes` : 'Calculando...'}
              </span>
            </div>
          </div>
        )}

        {/* Explicação pedagógica se for vídeo grande */}
        {uploadStatus.phase === 'uploading' && uploadStatus.totalBytes > 10 * 1024 * 1024 && (
          <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[11px] text-blue-200/90 text-left space-y-1">
            <p className="font-semibold text-blue-300 flex items-center gap-1">
              <AlertTriangle size={12} className="text-blue-400" />
              Por que pode demorar no 4G?
            </p>
            <p className="text-[10px] leading-relaxed text-slate-300">
              Vídeos de celular têm alta resolução ({formatFileSize(uploadStatus.totalBytes)}). Em redes móveis, a velocidade de upload da operadora costuma levar de 1 a 3 minutos para enviar tudo sem perda de dados.
            </p>
          </div>
        )}

        {/* Cancel Button */}
        <button
          type="button"
          onClick={onCancel}
          className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white text-xs font-semibold rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <X size={14} className="text-red-400" />
          Cancelar Envio
        </button>
      </div>
    </div>
  );
}
