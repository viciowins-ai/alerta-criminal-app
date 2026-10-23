import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, RefreshCw, Zap, ZapOff, AlertCircle, Image as ImageIcon } from 'lucide-react';

interface InAppCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
  onFallbackToFilePicker: () => void;
}

export function InAppCameraModal({
  isOpen,
  onClose,
  onCapture,
  onFallbackToFilePicker
}: InAppCameraModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Stop camera tracks cleanly
  const stopStream = () => {
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
        const constraints: MediaStreamConstraints = {
          audio: false,
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          }
        };

        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch {
          // Fallback if ideal resolution/facingMode is rejected
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        }

        if (!isMounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
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
          setCameraError('Permissão da câmera negada. Você pode autorizar no navegador ou escolher da galeria.');
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
  }, [isOpen, facingMode]);

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
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Take photo
  const takePhoto = () => {
    if (!videoRef.current || isCapturing) return;

    setIsCapturing(true);

    try {
      const video = videoRef.current;
      const width = video.videoWidth || 1280;
      const height = video.videoHeight || 720;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setIsCapturing(false);
        return;
      }

      // If front camera, mirror horizontal so photo looks natural
      if (facingMode === 'user') {
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
      }

      ctx.drawImage(video, 0, 0, width, height);

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-black flex flex-col justify-between overflow-hidden animate-in fade-in duration-200">
      {/* Top Controls Bar */}
      <div className="relative z-20 flex items-center justify-between p-4 pt-safe bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <button
          type="button"
          onClick={() => {
            stopStream();
            onClose();
          }}
          className="p-3 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-md transition-all active:scale-95"
          aria-label="Fechar"
        >
          <X size={22} />
        </button>

        <div className="flex items-center gap-2">
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

          <button
            type="button"
            onClick={toggleFacingMode}
            className="p-3 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-md transition-all active:scale-95"
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
            <button
              type="button"
              onClick={() => {
                stopStream();
                onClose();
                onFallbackToFilePicker();
              }}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 active:scale-98 text-white rounded-xl text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <ImageIcon size={16} />
              <span>Escolher foto da Galeria / Arquivos</span>
            </button>
          </div>
        )}
      </div>

      {/* Bottom Shutter Controls */}
      <div className="relative z-20 flex items-center justify-around px-8 py-6 pb-safe bg-gradient-to-t from-black via-black/70 to-transparent">
        {/* Gallery / File Picker quick option */}
        <button
          type="button"
          onClick={() => {
            stopStream();
            onClose();
            onFallbackToFilePicker();
          }}
          className="flex flex-col items-center gap-1 text-slate-300 hover:text-white transition-all active:scale-95"
          title="Abrir Galeria"
        >
          <div className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
            <ImageIcon size={20} />
          </div>
          <span className="text-[10px] font-semibold">Galeria</span>
        </button>

        {/* Snap Button */}
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

        {/* Placeholder to balance layout */}
        <div className="w-11" />
      </div>
    </div>
  );
}
