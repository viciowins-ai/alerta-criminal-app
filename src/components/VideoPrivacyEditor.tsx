import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Check, Shield, Sparkles, Play, Pause, Camera, RotateCcw, AlertTriangle, EyeOff, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FilesetResolver, FaceDetector } from '@mediapipe/tasks-vision';

interface VideoPrivacyEditorProps {
  file: File;
  onSave: (processedFile: File) => void;
  onExtractPhoto: (photoFile: File) => void;
  onCancel: () => void;
}

export function VideoPrivacyEditor({ file, onSave, onExtractPhoto, onCancel }: VideoPrivacyEditorProps) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [processedVideoUrl, setProcessedVideoUrl] = useState<string | null>(null);
  const [processedFile, setProcessedFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<'ai' | 'mask' | 'photo'>('ai');
  const [detector, setDetector] = useState<FaceDetector | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Mask state (normalized 0-1)
  const [maskPos, setMaskPos] = useState({ x: 0.35, y: 0.35, w: 0.3, h: 0.2 });
  const [isDraggingMask, setIsDraggingMask] = useState(false);
  const maskDragStart = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number } | null>(null);

  const cancelProcessingRef = useRef(false);

  // Initialize MediaPipe FaceDetector
  useEffect(() => {
    let isMounted = true;
    async function initDetector() {
      setIsAiLoading(true);
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );
        if (!isMounted) return;

        let faceDetector: FaceDetector;
        try {
          faceDetector = await FaceDetector.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
              delegate: 'GPU'
            },
            runningMode: 'VIDEO'
          });
        } catch {
          // Fallback to CPU delegate if GPU is unsupported
          faceDetector = await FaceDetector.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
              delegate: 'CPU'
            },
            runningMode: 'VIDEO'
          });
        }

        if (isMounted) {
          setDetector(faceDetector);
          setIsAiLoading(false);
        }
      } catch (err: any) {
        console.warn('Erro ao carregar MediaPipe FaceDetector:', err);
        if (isMounted) {
          setAiError('Modo IA offline. Você ainda pode usar a Tarja ou Extrair Fotos com Desfoque.');
          setIsAiLoading(false);
        }
      }
    }

    initDetector();
    return () => {
      isMounted = false;
    };
  }, []);

  // Load video file
  useEffect(() => {
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    return () => {
      URL.revokeObjectURL(url);
      if (processedVideoUrl) URL.revokeObjectURL(processedVideoUrl);
    };
  }, [file]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration || 0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (!videoRef.current) return;
    videoRef.current.currentTime = time;
    setCurrentTime(time);
  };

  // Pixelate function on canvas
  const applyPixelation = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    pixelSize = 14
  ) => {
    const sx = Math.max(0, Math.floor(x));
    const sy = Math.max(0, Math.floor(y));
    const sw = Math.min(ctx.canvas.width - sx, Math.ceil(w));
    const sh = Math.min(ctx.canvas.height - sy, Math.ceil(h));
    if (sw <= 0 || sh <= 0) return;

    const offscreen = document.createElement('canvas');
    const nw = Math.max(1, Math.floor(sw / pixelSize));
    const nh = Math.max(1, Math.floor(sh / pixelSize));
    offscreen.width = nw;
    offscreen.height = nh;
    const offCtx = offscreen.getContext('2d');
    if (!offCtx) return;

    offCtx.drawImage(ctx.canvas, sx, sy, sw, sh, 0, 0, nw, nh);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(offscreen, 0, 0, nw, nh, sx, sy, sw, sh);
    ctx.imageSmoothingEnabled = true;

    // Dark security border around blur
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(sx, sy, sw, sh);
  };

  // Best supported video mime
  const getSupportedMimeType = () => {
    const types = [
      'video/mp4;codecs=avc1',
      'video/mp4',
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm'
    ];
    for (const t of types) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) {
        return t;
      }
    }
    return 'video/webm';
  };

  // Process video with AI or manual mask
  const processVideo = useCallback(
    async (mode: 'ai' | 'mask') => {
      const video = videoRef.current;
      if (!video) return;

      setIsProcessing(true);
      cancelProcessingRef.current = false;
      setProgress(0);
      setStatusText(
        mode === 'ai'
          ? 'Iniciando detecção e rastreamento de rostos com IA...'
          : 'Iniciando processamento com tarja de segurança...'
      );

      // Create offscreen processing video and canvas
      const procVideo = document.createElement('video');
      procVideo.src = videoUrl;
      procVideo.muted = true;
      procVideo.playsInline = true;
      procVideo.crossOrigin = 'anonymous';

      await new Promise((res) => {
        procVideo.onloadedmetadata = () => res(true);
      });

      const width = procVideo.videoWidth || 640;
      const height = procVideo.videoHeight || 480;

      const procCanvas = document.createElement('canvas');
      procCanvas.width = width;
      procCanvas.height = height;
      const ctx = procCanvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        setIsProcessing(false);
        return;
      }

      const mimeType = getSupportedMimeType();
      const stream = procCanvas.captureStream(30);

      // Try capturing audio from original video
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const source = audioCtx.createMediaElementSource(procVideo);
        const dest = audioCtx.createMediaStreamDestination();
        source.connect(dest);
        const audioTrack = dest.stream.getAudioTracks()[0];
        if (audioTrack) {
          stream.addTrack(audioTrack);
        }
      } catch (e) {
        console.warn('Áudio não capturado diretamente, prosseguindo com fluxo de vídeo:', e);
      }

      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 2500000
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      const recorderFinishedPromise = new Promise<Blob>((resolve) => {
        recorder.onstop = () => {
          resolve(new Blob(chunks, { type: mimeType.split(';')[0] }));
        };
      });

      recorder.start(100);

      // Step through video frame by frame at ~30 FPS
      const totalDuration = procVideo.duration;
      const fps = 25; // 25 frames per second provides balance between quality and speed
      const totalFrames = Math.max(1, Math.floor(totalDuration * fps));
      const step = 1 / fps;

      for (let i = 0; i <= totalFrames; i++) {
        if (cancelProcessingRef.current) {
          recorder.stop();
          setIsProcessing(false);
          return;
        }

        const targetTime = Math.min(totalDuration, i * step);
        procVideo.currentTime = targetTime;

        await new Promise((res) => {
          const onSeeked = () => {
            procVideo.removeEventListener('seeked', onSeeked);
            res(true);
          };
          procVideo.addEventListener('seeked', onSeeked);
        });

        // Draw base video frame
        ctx.drawImage(procVideo, 0, 0, width, height);

        if (mode === 'ai' && detector) {
          try {
            const detections = detector.detectForVideo(procVideo, Math.round(targetTime * 1000));
            if (detections && detections.detections.length > 0) {
              for (const det of detections.detections) {
                const box = det.boundingBox;
                if (box) {
                  // Expand box by 25% for full facial privacy (hairline + chin)
                  const padX = box.width * 0.25;
                  const padY = box.height * 0.25;
                  const x = box.originX - padX;
                  const y = box.originY - padY;
                  const w = box.width + padX * 2;
                  const h = box.height + padY * 2;
                  applyPixelation(ctx, x, y, w, h, 14);
                }
              }
            }
          } catch (e) {
            console.warn('Erro ao detectar rosto no frame:', e);
          }
        } else if (mode === 'mask') {
          // Manual privacy mask
          const x = maskPos.x * width;
          const y = maskPos.y * height;
          const w = maskPos.w * width;
          const h = maskPos.h * height;
          applyPixelation(ctx, x, y, w, h, 16);
        }

        const pct = Math.round(((i + 1) / (totalFrames + 1)) * 100);
        setProgress(pct);
        setStatusText(
          mode === 'ai'
            ? `Rastreando e desfocando rostos: ${pct}% concluído`
            : `Aplicando tarja de privacidade: ${pct}% concluído`
        );
      }

      // Complete recording
      recorder.stop();
      setStatusText('Finalizando arquivo protegido...');

      const resultBlob = await recorderFinishedPromise;
      const extension = mimeType.includes('mp4') ? 'mp4' : 'webm';
      const outputName = file.name.replace(/\.[^/.]+$/, '') + `_desfocado.${extension}`;
      const newFile = new File([resultBlob], outputName, { type: resultBlob.type });

      setProcessedFile(newFile);
      setProcessedVideoUrl(URL.createObjectURL(resultBlob));
      setIsProcessing(false);
      setProgress(100);
    },
    [videoUrl, detector, maskPos, file]
  );

  // Extract current frame as photo and pass to ImageBlurEditor
  const handleExtractPhoto = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (blob) {
        const photoFile = new File([blob], `frame_extraido_${Date.now()}.jpg`, {
          type: 'image/jpeg'
        });
        onExtractPhoto(photoFile);
      }
    }, 'image/jpeg', 0.95);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-between animate-in fade-in zoom-in-95 duration-200">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between p-3.5 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg">
            <Shield size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
              Privacidade do Vídeo
              <span className="text-[10px] bg-blue-600/30 text-blue-300 border border-blue-500/40 px-1.5 py-0.5 rounded-full font-semibold">
                LGPD
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Desfoque rostos em movimento ou oculte placas antes de enviar
            </p>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
          title={t('common.cancel', 'Cancelar')}
        >
          <X size={18} />
        </button>
      </div>

      {/* Main Video Viewport */}
      <div className="flex-1 w-full max-w-2xl flex flex-col items-center justify-center p-3 relative overflow-hidden">
        {processedVideoUrl ? (
          /* Processed Video Preview */
          <div className="relative w-full max-h-[50vh] flex flex-col items-center justify-center rounded-2xl overflow-hidden bg-black border border-emerald-500/50 shadow-2xl">
            <video
              src={processedVideoUrl}
              controls
              autoPlay
              playsInline
              className="max-h-[48vh] max-w-full rounded-2xl"
            />
            <div className="absolute top-2 left-2 bg-emerald-950/90 border border-emerald-500 text-emerald-300 text-[10px] font-bold px-2 py-1 rounded-md shadow-lg flex items-center gap-1">
              <Check size={12} />
              Vídeo Tratado com Sucesso
            </div>
          </div>
        ) : (
          /* Original Video with Interactive Layer */
          <div className="relative w-full max-h-[50vh] flex items-center justify-center rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-2xl">
            <video
              ref={videoRef}
              src={videoUrl}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={() => setIsPlaying(false)}
              playsInline
              className="max-h-[48vh] max-w-full rounded-2xl"
            />

            {/* Manual Mask Overlay (in 'mask' tab) */}
            {activeTab === 'mask' && (
              <div
                className="absolute inset-0 cursor-crosshair select-none"
                onMouseDown={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = (e.clientX - rect.left) / rect.width;
                  const y = (e.clientY - rect.top) / rect.height;
                  setMaskPos((prev) => ({
                    ...prev,
                    x: Math.max(0, Math.min(1 - prev.w, x - prev.w / 2)),
                    y: Math.max(0, Math.min(1 - prev.h, y - prev.h / 2))
                  }));
                }}
              >
                <div
                  style={{
                    left: `${maskPos.x * 100}%`,
                    top: `${maskPos.y * 100}%`,
                    width: `${maskPos.w * 100}%`,
                    height: `${maskPos.h * 100}%`
                  }}
                  className="absolute border-2 border-dashed border-yellow-400 bg-yellow-500/20 backdrop-blur-md rounded-lg flex items-center justify-center shadow-2xl"
                >
                  <span className="text-[10px] bg-slate-950/90 text-yellow-300 font-bold px-1.5 py-0.5 rounded border border-yellow-500/60">
                    Área Desfocada
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Playback Controls & Timeline (only for original video) */}
        {!processedVideoUrl && (
          <div className="w-full mt-3 bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                disabled={isProcessing}
                className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors shrink-0 disabled:opacity-50"
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <input
                type="range"
                min={0}
                max={duration || 1}
                step={0.1}
                value={currentTime}
                onChange={handleSeek}
                disabled={isProcessing}
                className="flex-1 accent-blue-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
              <span className="text-xs font-mono text-slate-400 shrink-0">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
          </div>
        )}

        {/* Processing Progress Bar */}
        {isProcessing && (
          <div className="w-full mt-3 bg-slate-900/95 border border-blue-500/60 rounded-xl p-4 shadow-2xl flex flex-col gap-2 animate-in fade-in">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-blue-300 flex items-center gap-1.5">
                <Loader2 size={14} className="animate-spin text-blue-400" />
                {statusText}
              </span>
              <span className="font-bold text-blue-400">{progress}%</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-150"
                style={{ width: `${progress}%` }}
              />
            </div>
            <button
              onClick={() => {
                cancelProcessingRef.current = true;
                setIsProcessing(false);
              }}
              className="text-[11px] text-red-400 hover:text-red-300 self-end font-medium mt-1"
            >
              Cancelar processamento
            </button>
          </div>
        )}
      </div>

      {/* Tabs & Privacy Action Selector */}
      {!processedVideoUrl && !isProcessing && (
        <div className="w-full max-w-2xl px-3 flex flex-col gap-2.5">
          {aiError && (
            <div className="bg-orange-950/40 border border-orange-500/40 rounded-xl p-2.5 text-xs text-orange-200 flex items-center gap-2">
              <AlertTriangle size={16} className="text-orange-400 shrink-0" />
              <span>{aiError}</span>
            </div>
          )}

          {/* Mode Tabs */}
          <div className="grid grid-cols-3 gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('ai')}
              className={`py-2 px-1 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'ai'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles size={14} className={activeTab === 'ai' ? 'animate-pulse' : ''} />
              <span>IA Rostos</span>
            </button>

            <button
              onClick={() => setActiveTab('mask')}
              className={`py-2 px-1 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'mask'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <EyeOff size={14} />
              <span>Tarja / Placa</span>
            </button>

            <button
              onClick={() => setActiveTab('photo')}
              className={`py-2 px-1 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'photo'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Camera size={14} />
              <span>Extrair Foto</span>
            </button>
          </div>

          {/* Tab Explanation & Action Trigger */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
            {activeTab === 'ai' && (
              <div className="flex flex-col gap-2.5">
                <p className="text-xs text-slate-300">
                  <strong className="text-white">Rastreamento Inteligente:</strong> A IA do Google MediaPipe analisa cada quadro do vídeo e desfoca automaticamente todos os rostos detectados, mesmo que as pessoas se movam bastante.
                </p>
                <button
                  onClick={() => processVideo('ai')}
                  disabled={isAiLoading || !detector}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-950/50 disabled:opacity-50"
                >
                  {isAiLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Carregando Inteligência Artificial...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      Desfocar Rostos com IA no Vídeo
                    </>
                  )}
                </button>
              </div>
            )}

            {activeTab === 'mask' && (
              <div className="flex flex-col gap-2.5">
                <p className="text-xs text-slate-300">
                  <strong className="text-white">Tarja Fixa para Placas / Objetos:</strong> Toque no vídeo acima para posicionar a área amarela sobre a placa do carro ou detalhe que deseja ocultar.
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">Tamanho:</span>
                  <button
                    onClick={() => setMaskPos((p) => ({ ...p, w: 0.2, h: 0.15 }))}
                    className="px-2 py-1 bg-slate-800 text-[10px] text-slate-300 rounded hover:bg-slate-700"
                  >
                    Pequeno
                  </button>
                  <button
                    onClick={() => setMaskPos((p) => ({ ...p, w: 0.35, h: 0.25 }))}
                    className="px-2 py-1 bg-slate-800 text-[10px] text-slate-300 rounded hover:bg-slate-700"
                  >
                    Médio
                  </button>
                  <button
                    onClick={() => setMaskPos((p) => ({ ...p, w: 0.5, h: 0.35 }))}
                    className="px-2 py-1 bg-slate-800 text-[10px] text-slate-300 rounded hover:bg-slate-700"
                  >
                    Grande
                  </button>
                </div>
                <button
                  onClick={() => processVideo('mask')}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg"
                >
                  <EyeOff size={16} />
                  Aplicar Tarja no Vídeo Inteiro
                </button>
              </div>
            )}

            {activeTab === 'photo' && (
              <div className="flex flex-col gap-2.5">
                <p className="text-xs text-slate-300">
                  <strong className="text-white">Extrair Imagem e Desfocar com Pincel:</strong> Pause o vídeo no momento exato do fato. Vamos gerar uma foto do quadro atual para você passar o dedo e censurar manualmente.
                </p>
                <button
                  onClick={handleExtractPhoto}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg"
                >
                  <Camera size={16} />
                  Extrair Foto deste Momento ({formatTime(currentTime)})
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Footer Actions */}
      <div className="w-full p-3.5 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between gap-3 backdrop-blur-md">
        {processedVideoUrl && processedFile ? (
          <>
            <button
              onClick={() => {
                setProcessedVideoUrl(null);
                setProcessedFile(null);
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw size={14} />
              Refazer
            </button>
            <button
              onClick={() => onSave(processedFile)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-colors"
            >
              <Check size={16} />
              Salvar e Usar Vídeo Protegido
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onCancel}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => onSave(file)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
              title="Manter o vídeo como está, sem aplicar desfoque"
            >
              <span>Usar Original (Sem Desfoque)</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
