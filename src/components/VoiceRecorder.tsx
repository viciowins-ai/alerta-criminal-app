import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Trash2, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { AudioPlayer } from './AudioPlayer';

interface VoiceRecorderProps {
  onAudioRecorded: (audioData: { url: string; duration: number } | null) => void;
  maxDuration?: number; // em segundos (padrão 60)
  className?: string;
  label?: string;
}

export function VoiceRecorder({
  onAudioRecorded,
  maxDuration = 60,
  className = '',
  label = 'Mensagem de Voz'
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedAudio, setRecordedAudio] = useState<{ url: string; duration: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const animationFrameRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      cleanupResources();
    };
  }, []);

  const cleanupResources = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  };

  const startRecording = async () => {
    setErrorMessage(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setErrorMessage('Seu navegador não suporta gravação de áudio.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Setup audio level visualizer
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioContextClass();
        audioContextRef.current = audioCtx;
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateLevel = () => {
          if (!analyser) return;
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
          animationFrameRef.current = requestAnimationFrame(updateLevel);
        };
        updateLevel();
      } catch (e) {
        console.warn('AudioContext não disponível para visualizador:', e);
      }

      // Determine supported mimeType
      let mimeType = '';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = 'audio/webm';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/aac')) {
        mimeType = 'audio/aac';
      }

      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        cleanupResources();

        const actualMime = mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: actualMime });
        
        // Convert to Base64 Data URL so it is fully standalone and persistent
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          const finalDuration = recordingTime > 0 ? recordingTime : 1;
          const data = {
            url: base64data,
            duration: finalDuration
          };
          setRecordedAudio(data);
          onAudioRecorded(data);
        };
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordingTime(0);

      // Timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev + 1 >= maxDuration) {
            stopRecording();
            return maxDuration;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (err: any) {
      console.error('Erro ao acessar microfone:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage('Permissão do microfone negada. Autorize no navegador.');
      } else {
        setErrorMessage('Não foi possível iniciar o microfone.');
      }
      cleanupResources();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const discardAudio = () => {
    cleanupResources();
    setIsRecording(false);
    setRecordingTime(0);
    setRecordedAudio(null);
    onAudioRecorded(null);
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className={`w-full ${className}`}>
      {errorMessage && (
        <div className="mb-2 text-xs text-red-400 bg-red-500/10 border border-red-500/30 p-2.5 rounded-lg flex items-center gap-2">
          <AlertCircle size={14} className="shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* State 1: Recorded Preview */}
      {recordedAudio && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
              <Check size={14} className="text-emerald-400" />
              Áudio Gravado com Sucesso ({formatSeconds(recordedAudio.duration)})
            </span>
            <button
              type="button"
              onClick={discardAudio}
              className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer transition-colors p-1 rounded hover:bg-red-500/10"
              title="Excluir áudio e gravar novamente"
            >
              <Trash2 size={13} />
              <span>Descartar</span>
            </button>
          </div>

          <AudioPlayer src={recordedAudio.url} duration={recordedAudio.duration} />
        </div>
      )}

      {/* State 2: Live Recording */}
      {isRecording && (
        <div className="bg-red-950/40 border border-red-500/50 rounded-2xl p-3.5 flex items-center justify-between gap-3 animate-pulse shadow-lg">
          <div className="flex items-center gap-3">
            {/* Pulsing Recording Indicator */}
            <div className="relative flex items-center justify-center">
              <div className="w-3.5 h-3.5 rounded-full bg-red-500 animate-ping absolute opacity-75"></div>
              <div className="w-3.5 h-3.5 rounded-full bg-red-600"></div>
            </div>

            <div>
              <p className="text-xs font-bold text-red-200 flex items-center gap-1.5">
                Gravando áudio...
              </p>
              <p className="text-[11px] text-red-300 font-mono">
                {formatSeconds(recordingTime)} / {formatSeconds(maxDuration)}
              </p>
            </div>
          </div>

          {/* Dynamic Waveform Simulation */}
          <div className="flex items-center gap-0.5 h-5 flex-1 max-w-[120px] justify-center px-2">
            {[...Array(12)].map((_, i) => {
              const heightMultiplier = Math.max(0.2, (audioLevel / 100) * ((i % 3 === 0) ? 1.2 : 0.7));
              const height = Math.min(20, Math.max(4, 20 * heightMultiplier));
              return (
                <div
                  key={i}
                  className="w-1 bg-red-400 rounded-full transition-all duration-75"
                  style={{ height: `${height}px` }}
                />
              );
            })}
          </div>

          {/* Actions: Cancel or Finish */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={discardAudio}
              title="Cancelar gravação"
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-red-400 flex items-center justify-center transition-colors cursor-pointer"
            >
              <Trash2 size={15} />
            </button>
            <button
              type="button"
              onClick={stopRecording}
              title="Concluir gravação"
              className="bg-red-600 hover:bg-red-500 text-white rounded-full px-3 py-1.5 text-xs font-bold flex items-center gap-1 shadow-md transition-colors cursor-pointer"
            >
              <Square size={13} className="fill-white" />
              <span>Concluir</span>
            </button>
          </div>
        </div>
      )}

      {/* State 3: Idle (Ready to Record) */}
      {!isRecording && !recordedAudio && (
        <button
          type="button"
          onClick={startRecording}
          className="w-full border border-dashed border-indigo-500/40 hover:border-indigo-400/80 bg-slate-900/60 hover:bg-indigo-950/30 rounded-xl p-3 flex items-center justify-center gap-2.5 text-slate-300 hover:text-indigo-200 transition-all cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-full bg-indigo-600/20 group-hover:bg-indigo-600 text-indigo-400 group-hover:text-white flex items-center justify-center transition-colors">
            <Mic size={16} />
          </div>
          <div className="text-left">
            <p className="text-xs font-semibold text-white group-hover:text-indigo-200">
              {label}
            </p>
            <p className="text-[10px] text-slate-400">
              Grave até {maxDuration}s para descrever a ocorrência rapidamente
            </p>
          </div>
        </button>
      )}
    </div>
  );
}
