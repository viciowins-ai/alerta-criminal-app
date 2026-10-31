import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, RefreshCw, Zap, ZapOff, AlertCircle, Image as ImageIcon, Video, Square, Smartphone } from 'lucide-react';

interface InAppCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
  onFallbackToFilePicker: (mode: 'photo' | 'video' | 'gallery') => void;
  initialMode?: 'photo' | 'video';
}

export function InAppCameraModal({
  isOpen,
  onClose,
  onCapture,
  onFallbackToFilePicker,
  initialMode = 'photo'
}: InAppCameraModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [mode, setMode] = useState<'photo' | 'video'>(initialMode);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Video recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);

  // Reset mode to initialMode whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setIsRecording(false);
      setRecordingSeconds(0);
    }
  }, [isOpen, initialMode]);

  // Stop camera tracks cleanly
  const stopStream = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
      mediaRecorderRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setTorchOn(false);
    setIsRecording(false);
  };

  // Start in-app camera
  useEffect(() => {
    if (!isOpen) {
      stopStream();
      return;
    }

    let isMounted = true;
    setIsInitializing(true);
    setCameraError(null);

    const startCamera = async () => {
      stopStream();

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (isMounted) {
          setCameraError('Câmera integrada não suportada pelo navegador.');
          setIsInitializing(false);
        }
        return;
      }

      try {
        let stream: MediaStream | null = null;

        const isDevicePortrait = typeof window !== 'undefined' && window.innerHeight > window.innerWidth;
        const idealWidth = isDevicePortrait ? 1080 : 1920;
        const idealHeight = isDevicePortrait ? 1920 : 1080;

        // If in video mode, attempt to capture video + audio for complete incident documentation
        if (mode === 'video') {
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              audio: true,
              video: {
                facingMode: { ideal: facingMode },
                width: { ideal: isDevicePortrait ? 720 : 1280 },
                height: { ideal: isDevicePortrait ? 1280 : 720 }
              }
            });
          } catch {
            // Audio permission might be denied or unsupported, fallback to video-only
            try {
              stream = await navigator.mediaDevices.getUserMedia({
                audio: false,
                video: {
                  facingMode: { ideal: facingMode },
                  width: { ideal: isDevicePortrait ? 720 : 1280 },
                  height: { ideal: isDevicePortrait ? 1280 : 720 }
                }
              });
            } catch {
              stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            }
          }
        } else {
          // Photo mode: video stream only
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              audio: false,
              video: {
                facingMode: { ideal: facingMode },
                width: { ideal: idealWidth },
                height: { ideal: idealHeight }
              }
            });
          } catch {
            stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          }
        }

        if (!isMounted) {
          stream?.getTracks().forEach(t => t.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current && stream) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }

        // Check if torch/flash is supported on track
        const track = stream.getVideoTracks()[0];
        if (track) {
          const capabilities: any = track.getCapabilities ? track.getCapabilities() : {};
          setHasTorch(Boolean(capabilities?.torch));
        }

        setIsInitializing(false);
      } catch (err: any) {
        if (!isMounted) return;
        console.warn('[InAppCamera] Error accessing camera:', err);
        setIsInitializing(false);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setCameraError('Permissão da câmera negada. Você pode autorizar no navegador ou usar o app de câmera do aparelho.');
        } else {
          setCameraError('Não foi possível iniciar a câmera integrada.');
        }
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      stopStream();
    };
  }, [isOpen, facingMode, mode]);

  // Toggle Torch/Flash
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track && hasTorch) {
      try {
        const nextState = !torchOn;
        await (track as any).applyConstraints({
          advanced: [{ torch: nextState }]
        });
        setTorchOn(nextState);
      } catch (e) {
        console.warn('[InAppCamera] Failed to toggle torch:', e);
      }
    }
  };

  // Flip front/back camera
  const toggleFacingMode = () => {
    if (isRecording) return;
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Take photo
  const takePhoto = () => {
    if (!videoRef.current || isCapturing) return;

    setIsCapturing(true);

    try {
      const video = videoRef.current;
      const rawWidth = video.videoWidth || 1280;
      const rawHeight = video.videoHeight || 720;

      const isDevicePortrait = typeof window !== 'undefined' && window.innerHeight > window.innerWidth;
      const isStreamLandscape = rawWidth > rawHeight;
      const needsRotation = isDevicePortrait && isStreamLandscape;

      const canvas = document.createElement('canvas');
      if (needsRotation) {
        canvas.width = rawHeight;
        canvas.height = rawWidth;
      } else {
        canvas.width = rawWidth;
        canvas.height = rawHeight;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setIsCapturing(false);
        return;
      }

      if (needsRotation) {
        // Rotate 90deg CW to match portrait screen orientation
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((90 * Math.PI) / 180);
        if (facingMode === 'user') {
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, -rawWidth / 2, -rawHeight / 2, rawWidth, rawHeight);
      } else {
        // Standard orientation
        if (facingMode === 'user') {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      }

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const fileName = `foto_ocorrencia_${Date.now()}.jpg`;
            const file = new File([blob], fileName, { type: 'image/jpeg', lastModified: Date.now() });
            
            // Turn off camera and invoke callback
            stopStream();
            onCapture(file);
          }
          setIsCapturing(false);
        },
        'image/jpeg',
        0.88
      );
    } catch (err) {
      console.error('[InAppCamera] Error capturing photo:', err);
      setIsCapturing(false);
    }
  };

  // Helper to find supported video mime type
  const getSupportedVideoMimeType = () => {
    if (typeof MediaRecorder === 'undefined') return '';
    const candidates = [
      'video/mp4;codecs=avc1,mp4a.40.2',
      'video/mp4',
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm'
    ];
    for (const t of candidates) {
      if (MediaRecorder.isTypeSupported(t)) {
        return t;
      }
    }
    return '';
  };

  // Start recording video
  const startRecording = () => {
    if (!streamRef.current || isRecording) return;

    recordedChunksRef.current = [];
    setRecordingSeconds(0);

    const mimeType = getSupportedVideoMimeType();
    const options: MediaRecorderOptions = mimeType ? { mimeType } : {};

    try {
      const recorder = new MediaRecorder(streamRef.current, options);
      
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const finalMime = recorder.mimeType || 'video/mp4';
        const ext = finalMime.includes('mp4') ? 'mp4' : 'webm';
        const blob = new Blob(recordedChunksRef.current, { type: finalMime });
        
        if (blob.size > 0) {
          const file = new File([blob], `video_gravado_${Date.now()}.${ext}`, {
            type: blob.type || 'video/mp4',
            lastModified: Date.now()
          });
          stopStream();
          onCapture(file);
        }
        setIsRecording(false);
        setRecordingSeconds(0);
      };

      recorder.start(500); // 500ms time slices
      mediaRecorderRef.current = recorder;
      setIsRecording(true);

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 60) {
            // Auto stop at 60 seconds
            stopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error('[InAppCamera] Failed to initialize MediaRecorder:', err);
      // Fallback to native device recorder
      stopStream();
      onClose();
      onFallbackToFilePicker('video');
    }
  };

  // Stop recording video
  const stopRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.warn('Error stopping MediaRecorder:', e);
      }
    }
  };

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-black flex flex-col justify-between overflow-hidden animate-in fade-in duration-200">
      {/* Top Controls Bar */}
      <div className="relative z-20 flex items-center justify-between p-4 pt-safe bg-gradient-to-b from-black/85 via-black/40 to-transparent">
        <button
          type="button"
          onClick={() => {
            if (isRecording) {
              stopRecording();
            }
            stopStream();
            onClose();
          }}
          className="p-3 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-md transition-all active:scale-95"
          aria-label="Fechar"
        >
          <X size={22} />
        </button>

        {/* Live Video Recording Indicator */}
        {isRecording && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-600/90 text-white shadow-lg animate-pulse">
            <span className="w-2.5 h-2.5 rounded-full bg-white" />
            <span className="text-xs font-mono font-bold tracking-wider">
              {formatTime(recordingSeconds)} / 01:00
            </span>
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Torch/Flash button */}
          {hasTorch && (
            <button
              type="button"
              onClick={toggleTorch}
              className={`p-3 rounded-full backdrop-blur-md transition-all active:scale-95 ${
                torchOn ? 'bg-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-400/40' : 'bg-black/50 text-white'
              }`}
              aria-label="Lanterna"
            >
              {torchOn ? <Zap size={20} /> : <ZapOff size={20} />}
            </button>
          )}

          {/* Flip camera */}
          <button
            type="button"
            onClick={toggleFacingMode}
            disabled={isRecording}
            className="p-3 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-md transition-all active:scale-95 disabled:opacity-40"
            aria-label="Alternar Câmera"
          >
            <RefreshCw size={20} />
          </button>
        </div>
      </div>

      {/* Viewfinder Area */}
      <div className="relative flex-1 w-full flex items-center justify-center overflow-hidden bg-slate-950">
        <video
          ref={videoRef}
          playsInline
          autoPlay
          muted
          className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
        />

        {/* Viewfinder Target Framing Overlay */}
        <div className="pointer-events-none absolute inset-6 sm:inset-12 border-2 border-white/20 rounded-3xl flex flex-col justify-between p-4">
          <div className="flex justify-between">
            <span className="w-6 h-6 border-t-2 border-l-2 border-white rounded-tl-lg" />
            <span className="w-6 h-6 border-t-2 border-r-2 border-white rounded-tr-lg" />
          </div>
          <div className="flex justify-between">
            <span className="w-6 h-6 border-b-2 border-l-2 border-white rounded-bl-lg" />
            <span className="w-6 h-6 border-b-2 border-r-2 border-white rounded-br-lg" />
          </div>
        </div>

        {/* Loading Indicator */}
        {isInitializing && (
          <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center gap-3 text-slate-300">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-medium">Iniciando câmera segura...</span>
          </div>
        )}

        {/* Error Fallback Box */}
        {cameraError && (
          <div className="absolute inset-4 m-auto max-w-sm h-fit bg-slate-900/95 border border-slate-700/80 p-5 rounded-3xl text-center space-y-4 shadow-2xl backdrop-blur-md">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 mx-auto flex items-center justify-center">
              <AlertCircle size={24} />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-white">Câmera Indisponível</p>
              <p className="text-xs text-slate-300 leading-relaxed">{cameraError}</p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  stopStream();
                  onClose();
                  onFallbackToFilePicker(mode);
                }}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 active:scale-98 text-white rounded-xl text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <Smartphone size={16} />
                <span>Usar App de Câmera do Celular</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  stopStream();
                  onClose();
                  onFallbackToFilePicker('gallery');
                }}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2"
              >
                <ImageIcon size={16} />
                <span>Escolher da Galeria</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls Area */}
      <div className="relative z-20 flex flex-col items-center pb-safe bg-gradient-to-t from-black via-black/80 to-transparent pt-3">
        {/* Mode Selector (FOTO | VÍDEO) */}
        {!isRecording && (
          <div className="flex items-center gap-6 mb-3">
            <button
              type="button"
              onClick={() => setMode('photo')}
              className={`text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full transition-all ${
                mode === 'photo'
                  ? 'text-amber-300 bg-amber-400/20 border border-amber-400/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Foto
            </button>
            <button
              type="button"
              onClick={() => setMode('video')}
              className={`text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full transition-all ${
                mode === 'video'
                  ? 'text-red-400 bg-red-500/20 border border-red-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Vídeo
            </button>
          </div>
        )}

        {/* Shutter row */}
        <div className="w-full flex items-center justify-around px-8 pb-6">
          {/* Gallery / File Picker quick option */}
          <button
            type="button"
            disabled={isRecording}
            onClick={() => {
              stopStream();
              onClose();
              onFallbackToFilePicker('gallery');
            }}
            className="flex flex-col items-center gap-1 text-slate-300 hover:text-white transition-all active:scale-95 disabled:opacity-20"
            title="Abrir Galeria"
          >
            <div className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <ImageIcon size={20} />
            </div>
            <span className="text-[10px] font-semibold">Galeria</span>
          </button>

          {/* Shutter Button (Photo vs Video) */}
          {mode === 'photo' ? (
            <button
              type="button"
              onClick={takePhoto}
              disabled={isCapturing || isInitializing || Boolean(cameraError)}
              className="relative w-20 h-20 rounded-full border-4 border-white flex items-center justify-center transition-all active:scale-90 disabled:opacity-40 group shadow-2xl shadow-blue-500/20"
              aria-label="Tirar Foto"
            >
              <div className="w-16 h-16 rounded-full bg-white group-hover:scale-95 transition-transform flex items-center justify-center text-slate-900">
                <Camera size={26} className="text-slate-900 drop-shadow-sm" />
              </div>
            </button>
          ) : (
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isInitializing || Boolean(cameraError)}
              className={`relative w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all active:scale-95 disabled:opacity-40 shadow-2xl ${
                isRecording 
                  ? 'border-red-500 shadow-red-500/40 bg-red-500/20' 
                  : 'border-white shadow-red-500/20 hover:border-red-400'
              }`}
              aria-label={isRecording ? 'Parar Gravação' : 'Gravar Vídeo'}
            >
              {isRecording ? (
                <div className="w-7 h-7 bg-red-500 rounded-md transition-all flex items-center justify-center">
                  <Square size={16} className="text-white fill-white" />
                </div>
              ) : (
                <div className="w-15 h-15 rounded-full bg-red-500 hover:scale-95 transition-transform flex items-center justify-center">
                  <Video size={24} className="text-white" />
                </div>
              )}
            </button>
          )}

          {/* Native System Camera option */}
          <button
            type="button"
            disabled={isRecording}
            onClick={() => {
              stopStream();
              onClose();
              onFallbackToFilePicker(mode);
            }}
            className="flex flex-col items-center gap-1 text-slate-300 hover:text-white transition-all active:scale-95 disabled:opacity-20"
            title="Usar Câmera Nativa do Aparelho"
          >
            <div className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Smartphone size={20} />
            </div>
            <span className="text-[10px] font-semibold">Câmera Nativa</span>
          </button>
        </div>
      </div>
    </div>
  );
}
