import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Check, Shield, Sparkles, Play, Pause, Camera, RotateCcw, AlertTriangle, EyeOff, Loader2, Eye, Volume2, VolumeX } from 'lucide-react';
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);

  const [videoUrl, setVideoUrl] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  // Active Privacy Mode
  const [activeTab, setActiveTab] = useState<'ai' | 'mask' | 'photo'>('ai');
  const [showBlurPreview, setShowBlurPreview] = useState(true);

  // AI Face Detection State
  const [detector, setDetector] = useState<FaceDetector | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(true);
  const [aiDetectedCount, setAiDetectedCount] = useState(0);
  const [aiError, setAiError] = useState<string | null>(null);

  // Cached face boxes for smooth 60fps rendering
  const activeFacesRef = useRef<{ x: number; y: number; w: number; h: number }[]>([]);
  const lastDetectTimeRef = useRef<number>(0);
  const isDetectingRef = useRef<boolean>(false);

  // Manual Mask State (percentages 0-1)
  const [maskPos, setMaskPos] = useState({ x: 0.35, y: 0.2, w: 0.3, h: 0.3 });
  const [maskShape, setMaskShape] = useState<'circle' | 'rect'>('circle');
  const [blurIntensity, setBlurIntensity] = useState<'heavy' | 'medium' | 'black'>('heavy');

  // Video Export / Processing State
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatusText, setExportStatusText] = useState('');
  const [processedVideoUrl, setProcessedVideoUrl] = useState<string | null>(null);
  const [processedFile, setProcessedFile] = useState<File | null>(null);

  // Audio Context Ref to avoid duplicate createMediaElementSource
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const audioDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);

  // Load Video File URL
  useEffect(() => {
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    return () => {
      URL.revokeObjectURL(url);
      if (processedVideoUrl) URL.revokeObjectURL(processedVideoUrl);
    };
  }, [file]);

  // Initialize MediaPipe FaceDetector in IMAGE mode (reliable on all devices, no monotonic timestamp constraints)
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
            runningMode: 'IMAGE'
          });
        } catch {
          // Fallback to CPU delegate if GPU is not available
          faceDetector = await FaceDetector.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
              delegate: 'CPU'
            },
            runningMode: 'IMAGE'
          });
        }

        if (isMounted) {
          setDetector(faceDetector);
          setIsAiLoading(false);
        }
      } catch (err: any) {
        console.warn('MediaPipe FaceDetector falhou ao inicializar:', err);
        if (isMounted) {
          setAiError('Modo automático offline. Use a Área de Desfoque tocando na tela.');
          setIsAiLoading(false);
          setActiveTab('mask'); // Fallback directly to interactive mask
        }
      }
    }

    initDetector();
    return () => {
      isMounted = false;
    };
  }, []);

  // Gaussian Blur / Privacy Overlay Renderer
  const applyBlurToRegion = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      video: HTMLVideoElement,
      x: number,
      y: number,
      w: number,
      h: number,
      shape: 'circle' | 'rect',
      intensity: 'heavy' | 'medium' | 'black'
    ) => {
      const vw = ctx.canvas.width;
      const vh = ctx.canvas.height;
      if (w <= 0 || h <= 0) return;

      ctx.save();
      ctx.beginPath();
      if (shape === 'circle') {
        const rx = Math.max(10, w / 2);
        const ry = Math.max(10, h / 2);
        ctx.ellipse(x + rx, y + ry, rx, ry, 0, 0, Math.PI * 2);
      } else {
        ctx.rect(x, y, w, h);
      }
      ctx.clip();

      if (intensity === 'black') {
        // Blackout censor bar
        ctx.fillStyle = '#090d16';
        ctx.fill();
      } else {
        // Real Gaussian Blur using native canvas filter
        const blurRadius = intensity === 'heavy' ? '24px' : '14px';
        ctx.filter = `blur(${blurRadius})`;
        ctx.drawImage(video, 0, 0, vw, vh);

        // Security tint to prevent any edge recovery
        ctx.filter = 'none';
        ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
        ctx.fill();
      }

      ctx.filter = 'none';
      ctx.strokeStyle = shape === 'circle' ? 'rgba(59, 130, 246, 0.7)' : 'rgba(234, 179, 8, 0.7)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    },
    []
  );

  // Live Canvas Render Loop
  const renderFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(renderFrame);
      return;
    }

    const vw = video.videoWidth || 640;
    const vh = video.videoHeight || 480;
    if (canvas.width !== vw || canvas.height !== vh) {
      canvas.width = vw;
      canvas.height = vh;
    }

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      animFrameRef.current = requestAnimationFrame(renderFrame);
      return;
    }

    // 1. Draw base video frame
    ctx.drawImage(video, 0, 0, vw, vh);

    // 2. Perform AI Face Detection every ~80ms without stalling 60fps render
    const now = performance.now();
    if (
      showBlurPreview &&
      activeTab === 'ai' &&
      detector &&
      !isDetectingRef.current &&
      now - lastDetectTimeRef.current > 80
    ) {
      isDetectingRef.current = true;
      lastDetectTimeRef.current = now;
      try {
        const result = detector.detect(canvas);
        if (result && result.detections && result.detections.length > 0) {
          const newBoxes = result.detections.map((d) => {
            const b = d.boundingBox;
            if (!b) return { x: 0, y: 0, w: 0, h: 0 };
            // Expand box by 40% to cover full hair and chin
            const padX = b.width * 0.4;
            const padY = b.height * 0.4;
            return {
              x: Math.max(0, b.originX - padX),
              y: Math.max(0, b.originY - padY),
              w: Math.min(vw, b.width + padX * 2),
              h: Math.min(vh, b.height + padY * 2)
            };
          });
          activeFacesRef.current = newBoxes;
          setAiDetectedCount(newBoxes.length);
        } else {
          // If no face found in this frame, gently keep last position or reset
          if (now - lastDetectTimeRef.current > 600) {
            activeFacesRef.current = [];
            setAiDetectedCount(0);
          }
        }
      } catch (err) {
        console.warn('Face detection error:', err);
      } finally {
        isDetectingRef.current = false;
      }
    }

    // 3. Render Blur Overlays
    if (showBlurPreview) {
      if (activeTab === 'ai') {
        if (activeFacesRef.current.length > 0) {
          for (const box of activeFacesRef.current) {
            applyBlurToRegion(ctx, video, box.x, box.y, box.w, box.h, 'circle', blurIntensity);
          }
        } else {
          // If AI is active but hasn't locked a face yet, provide a gentle central focus blur zone
          const defX = vw * 0.3;
          const defY = vh * 0.15;
          const defW = vw * 0.4;
          const defH = vh * 0.45;
          applyBlurToRegion(ctx, video, defX, defY, defW, defH, 'circle', blurIntensity);
        }
      } else if (activeTab === 'mask') {
        // Manual Interactive Mask
        const mx = maskPos.x * vw;
        const my = maskPos.y * vh;
        const mw = maskPos.w * vw;
        const mh = maskPos.h * vh;
        applyBlurToRegion(ctx, video, mx, my, mw, mh, maskShape, blurIntensity);
      }
    }

    animFrameRef.current = requestAnimationFrame(renderFrame);
  }, [detector, activeTab, showBlurPreview, maskPos, maskShape, blurIntensity, applyBlurToRegion]);

  // Start live canvas rendering
  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(renderFrame);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [renderFrame]);

  // Toggle Video Play / Pause
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
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

  // Extract current frame as photo for ImageBlurEditor
  const handleExtractPhoto = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const photoFile = new File([blob], `frame_extraido_${Date.now()}.jpg`, {
            type: 'image/jpeg'
          });
          onExtractPhoto(photoFile);
        }
      },
      'image/jpeg',
      0.95
    );
  };

  // Supported video mime type
  const getSupportedMimeType = () => {
    const types = [
      'video/mp4;codecs=avc1,mp4a.40.2',
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

  // Record canvas to new video file with audio
  const handleExportBlurredVideo = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    setIsExporting(true);
    setExportProgress(0);
    setExportStatusText('Processando desfoque do vídeo...');

    // Rewind video to start
    video.pause();
    setIsPlaying(false);
    video.currentTime = 0;
    await new Promise((res) => setTimeout(res, 250));

    const mimeType = getSupportedMimeType();
    const stream = canvas.captureStream(30);

    // Audio capture via WebAudio (safe single initialization)
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioSourceRef.current = audioContextRef.current.createMediaElementSource(video);
        audioDestRef.current = audioContextRef.current.createMediaStreamDestination();
        audioSourceRef.current.connect(audioDestRef.current);
        audioSourceRef.current.connect(audioContextRef.current.destination);
      }
      if (audioDestRef.current) {
        const audioTrack = audioDestRef.current.stream.getAudioTracks()[0];
        if (audioTrack) stream.addTrack(audioTrack);
      }
    } catch (e) {
      console.warn('Áudio capturado em modo padrão:', e);
    }

    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 2500000
      });
    } catch {
      recorder = new MediaRecorder(stream);
    }

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    const finishedPromise = new Promise<Blob>((resolve) => {
      recorder.onstop = () => {
        resolve(new Blob(chunks, { type: mimeType.split(';')[0] || 'video/mp4' }));
      };
    });

    recorder.start(100);

    try {
      await video.play();
      setIsPlaying(true);
    } catch {
      video.muted = true;
      await video.play();
      setIsPlaying(true);
    }

    const totalDur = video.duration || 1;
    const checkInterval = setInterval(() => {
      if (!video) return;
      const pct = Math.min(99, Math.round((video.currentTime / totalDur) * 100));
      setExportProgress(pct);
      setExportStatusText(`Gravando vídeo com desfoque: ${pct}%`);

      if (video.ended || video.currentTime >= totalDur - 0.15) {
        clearInterval(checkInterval);
        try {
          recorder.stop();
        } catch {}
        video.pause();
        setIsPlaying(false);
      }
    }, 150);

    const resultBlob = await finishedPromise;
    clearInterval(checkInterval);

    const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
    const outputName = file.name.replace(/\.[^/.]+$/, '') + `_desfocado.${ext}`;
    const newFile = new File([resultBlob], outputName, { type: resultBlob.type });

    setProcessedFile(newFile);
    const newUrl = URL.createObjectURL(resultBlob);
    setProcessedVideoUrl(newUrl);
    setIsExporting(false);
    setExportProgress(100);
    setExportStatusText('Vídeo com desfoque pronto!');
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
              Desfoque & Privacidade do Vídeo
              <span className="text-[10px] bg-blue-600/30 text-blue-300 border border-blue-500/40 px-1.5 py-0.5 rounded-full font-semibold">
                LGPD
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Desfoque ativo em tempo real na tela abaixo
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
          /* Processed Video Result */
          <div className="relative w-full max-h-[50vh] flex flex-col items-center justify-center rounded-2xl overflow-hidden bg-black border border-emerald-500/60 shadow-2xl">
            <video
              src={processedVideoUrl}
              controls
              autoPlay
              playsInline
              className="max-h-[48vh] max-w-full rounded-2xl"
            />
            <div className="absolute top-2 left-2 bg-emerald-950/90 border border-emerald-500 text-emerald-300 text-[10px] font-bold px-2 py-1 rounded-md shadow-lg flex items-center gap-1">
              <Check size={12} />
              Vídeo com Desfoque Pronto
            </div>
          </div>
        ) : (
          /* Live Canvas Preview with Real-time Blur */
          <div className="relative w-full max-h-[50vh] flex items-center justify-center rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-2xl">
            {/* Hidden Source Video */}
            <video
              ref={videoRef}
              src={videoUrl}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={() => setIsPlaying(false)}
              playsInline
              muted={isMuted}
              className="hidden"
            />

            {/* Live Canvas */}
            <canvas
              ref={canvasRef}
              onClick={togglePlay}
              className="max-h-[48vh] max-w-full rounded-2xl cursor-pointer"
            />

            {/* Status indicator on top of video */}
            <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none">
              {showBlurPreview ? (
                <span className="bg-blue-600/90 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                  <Shield size={11} />
                  Desfoque Ativo
                </span>
              ) : (
                <span className="bg-slate-800/90 backdrop-blur-md text-slate-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                  Original
                </span>
              )}

              {activeTab === 'ai' && (
                <span className="bg-emerald-600/90 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                  <Sparkles size={11} />
                  {isAiLoading
                    ? 'Iniciando IA...'
                    : aiDetectedCount > 0
                    ? `${aiDetectedCount} Rosto(s) Protegido(s)`
                    : 'Rastreando Rosto'}
                </span>
              )}
            </div>

            {/* Toggle Compare Button */}
            <button
              onClick={() => setShowBlurPreview((prev) => !prev)}
              className="absolute top-3 right-3 bg-slate-900/80 hover:bg-slate-800 backdrop-blur-md border border-slate-700 text-slate-200 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg transition-colors"
              title="Comparar antes e depois"
            >
              <Eye size={12} className={showBlurPreview ? 'text-blue-400' : 'text-slate-400'} />
              <span>{showBlurPreview ? 'Ver Original' : 'Ver com Desfoque'}</span>
            </button>

            {/* Manual Drag Overlay when in 'mask' tab */}
            {activeTab === 'mask' && (
              <div
                className="absolute inset-0 cursor-crosshair select-none"
                onClick={(e) => {
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
                  className={`absolute border-2 border-dashed border-yellow-400 bg-yellow-500/20 backdrop-blur-sm flex items-center justify-center shadow-2xl pointer-events-none ${
                    maskShape === 'circle' ? 'rounded-full' : 'rounded-lg'
                  }`}
                >
                  <span className="text-[9px] bg-slate-950/90 text-yellow-300 font-bold px-1.5 py-0.5 rounded border border-yellow-500/60 pointer-events-none">
                    Toque para mover
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Playback Controls & Timeline */}
        {!processedVideoUrl && (
          <div className="w-full mt-3 bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                disabled={isExporting}
                className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors shrink-0 disabled:opacity-50"
                title={isPlaying ? 'Pausar' : 'Reproduzir'}
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>

              <button
                onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.muted = !isMuted;
                    setIsMuted(!isMuted);
                  }
                }}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors shrink-0"
                title={isMuted ? 'Ativar som' : 'Silenciar'}
              >
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>

              <input
                type="range"
                min={0}
                max={duration || 1}
                step={0.1}
                value={currentTime}
                onChange={handleSeek}
                disabled={isExporting}
                className="flex-1 accent-blue-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />

              <span className="text-xs font-mono text-slate-400 shrink-0">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
          </div>
        )}

        {/* Export Progress Bar */}
        {isExporting && (
          <div className="w-full mt-3 bg-slate-900/95 border border-blue-500/60 rounded-xl p-4 shadow-2xl flex flex-col gap-2 animate-in fade-in">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-blue-300 flex items-center gap-1.5">
                <Loader2 size={14} className="animate-spin text-blue-400" />
                {exportStatusText}
              </span>
              <span className="font-bold text-blue-400">{exportProgress}%</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-150"
                style={{ width: `${exportProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Tabs & Controls */}
      {!processedVideoUrl && !isExporting && (
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
              <span>Área / Tarja</span>
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

          {/* Tab Explanation & Controls */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
            {activeTab === 'ai' && (
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-300">
                    <strong className="text-white">Rastreamento Automático:</strong> Os rostos são detectados e borrados automaticamente enquanto o vídeo roda.
                  </p>
                  <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg shrink-0 ml-2">
                    <button
                      onClick={() => setBlurIntensity('heavy')}
                      className={`px-2 py-0.5 text-[10px] rounded font-semibold transition-colors ${
                        blurIntensity === 'heavy' ? 'bg-blue-600 text-white' : 'text-slate-400'
                      }`}
                    >
                      Desfoque
                    </button>
                    <button
                      onClick={() => setBlurIntensity('black')}
                      className={`px-2 py-0.5 text-[10px] rounded font-semibold transition-colors ${
                        blurIntensity === 'black' ? 'bg-blue-600 text-white' : 'text-slate-400'
                      }`}
                    >
                      Tarja Preta
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-slate-800/60 p-2 rounded-lg">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <span>Dê <strong>Play</strong> no vídeo para ver os rostos sendo desfocados em movimento na tela!</span>
                </div>
              </div>
            )}

            {activeTab === 'mask' && (
              <div className="flex flex-col gap-2.5">
                <p className="text-xs text-slate-300">
                  <strong className="text-white">Área de Desfoque Manual:</strong> Toque em qualquer parte do vídeo acima para mover a área de desfoque sobre placas, rostos ou detalhes.
                </p>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-400">Formato:</span>
                    <button
                      onClick={() => setMaskShape('circle')}
                      className={`px-2 py-1 text-[10px] font-semibold rounded ${
                        maskShape === 'circle' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      Círculo
                    </button>
                    <button
                      onClick={() => setMaskShape('rect')}
                      className={`px-2 py-1 text-[10px] font-semibold rounded ${
                        maskShape === 'rect' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      Retângulo
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-400">Tamanho:</span>
                    <button
                      onClick={() => setMaskPos((p) => ({ ...p, w: 0.25, h: 0.2 }))}
                      className="px-2 py-1 bg-slate-800 text-[10px] text-slate-300 rounded hover:bg-slate-700"
                    >
                      Pequeno
                    </button>
                    <button
                      onClick={() => setMaskPos((p) => ({ ...p, w: 0.38, h: 0.3 }))}
                      className="px-2 py-1 bg-slate-800 text-[10px] text-slate-300 rounded hover:bg-slate-700"
                    >
                      Médio
                    </button>
                    <button
                      onClick={() => setMaskPos((p) => ({ ...p, w: 0.55, h: 0.45 }))}
                      className="px-2 py-1 bg-slate-800 text-[10px] text-slate-300 rounded hover:bg-slate-700"
                    >
                      Grande
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'photo' && (
              <div className="flex flex-col gap-2.5">
                <p className="text-xs text-slate-300">
                  <strong className="text-white">Extrair Foto para Pincel Manual:</strong> Pause o vídeo no momento exato e toque abaixo para abrir o editor com pincel de dedo.
                </p>
                <button
                  onClick={handleExtractPhoto}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-colors"
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
              Salvar e Usar Vídeo com Desfoque
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
              onClick={handleExportBlurredVideo}
              disabled={isExporting}
              className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-950/50 transition-colors disabled:opacity-50"
            >
              <Shield size={16} />
              {isExporting ? 'Processando Vídeo...' : 'Salvar Vídeo com Desfoque'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
