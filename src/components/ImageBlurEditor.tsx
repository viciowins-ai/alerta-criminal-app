import React, { useState, useRef, useEffect } from 'react';
import { X, Check, Droplet, Undo, Info, CheckCircle2, RotateCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ImageBlurEditorProps {
  file: File;
  onSave: (file: File) => void;
  onCancel: () => void;
}

export function ImageBlurEditor({ file, onSave, onCancel }: ImageBlurEditorProps) {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const blurCanvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [rotation, setRotation] = useState<number>(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(30);
  const [history, setHistory] = useState<ImageData[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.src = url;
    img.onload = () => {
      setImage(img);
    };
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!image || !canvasRef.current || !blurCanvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const blurCanvas = blurCanvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const blurCtx = blurCanvas.getContext('2d', { willReadFrequently: true });
    if (!ctx || !blurCtx) return;

    const isRotated90or270 = rotation === 90 || rotation === 270;
    const imgNaturalW = image.naturalWidth || image.width;
    const imgNaturalH = image.naturalHeight || image.height;

    // Oriented dimensions
    const orientedW = isRotated90or270 ? imgNaturalH : imgNaturalW;
    const orientedH = isRotated90or270 ? imgNaturalW : imgNaturalH;

    // Calculate dimensions to fit screen while maintaining aspect ratio
    const maxWidth = containerRef.current.clientWidth || 400;
    const maxHeight = containerRef.current.clientHeight || 500;
    
    let targetWidth = orientedW;
    let targetHeight = orientedH;
    
    if (targetWidth > maxWidth || targetHeight > maxHeight) {
      const ratio = Math.min(maxWidth / targetWidth, maxHeight / targetHeight);
      targetWidth = Math.round(targetWidth * ratio);
      targetHeight = Math.round(targetHeight * ratio);
    }

    canvas.width = targetWidth;
    canvas.height = targetHeight;
    blurCanvas.width = targetWidth;
    blurCanvas.height = targetHeight;

    const drawW = isRotated90or270 ? targetHeight : targetWidth;
    const drawH = isRotated90or270 ? targetWidth : targetHeight;

    // Draw base image with rotation
    ctx.save();
    ctx.translate(targetWidth / 2, targetHeight / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.drawImage(image, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();
    
    // Create blurred version with rotation
    blurCtx.save();
    blurCtx.filter = 'blur(15px)';
    blurCtx.translate(targetWidth / 2, targetHeight / 2);
    blurCtx.rotate((rotation * Math.PI) / 180);
    blurCtx.drawImage(image, -drawW / 2, -drawH / 2, drawW, drawH);
    blurCtx.filter = 'none'; // reset
    blurCtx.restore();

    // Save initial state to history
    setHistory([ctx.getImageData(0, 0, canvas.width, canvas.height)]);
  }, [image, rotation]);

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canvasRef.current) return null;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    if (isDrawing && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        setHistory(prev => [...prev, ctx.getImageData(0, 0, canvasRef.current!.width, canvasRef.current!.height)].slice(-10)); // Keep last 10 steps
      }
    }
    setIsDrawing(false);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !canvasRef.current || !blurCanvasRef.current) return;
    
    const coords = getCoordinates(e);
    if (!coords) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.beginPath();
    ctx.arc(coords.x, coords.y, brushSize, 0, Math.PI * 2);
    ctx.clip();
    // Draw the blurred image only inside the clipped region
    ctx.drawImage(blurCanvasRef.current, 0, 0);
    ctx.restore();
  };

  const handleUndo = () => {
    if (history.length > 1 && canvasRef.current) {
      const newHistory = [...history];
      newHistory.pop(); // remove current state
      const previousState = newHistory[newHistory.length - 1];
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.putImageData(previousState, 0, 0);
        setHistory(newHistory);
      }
    }
  };

  const handleSave = () => {
    if (!canvasRef.current) return;
    canvasRef.current.toBlob((blob) => {
      if (blob) {
        const blurredFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", { type: 'image/jpeg' });
        onSave(blurredFile);
      }
    }, 'image/jpeg', 0.9);
  };

  const handleUseWithoutBlur = () => {
    if (rotation === 0) {
      onSave(file);
    } else {
      handleSave();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-between animate-in fade-in zoom-in-95 duration-200">
      {/* Top Bar */}
      <div className="w-full flex items-center justify-between p-3.5 bg-slate-900/80 border-b border-slate-800">
        <button onClick={onCancel} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors cursor-pointer" title="Cancelar">
          <X size={20} />
        </button>
        <span className="text-white text-sm font-semibold flex items-center gap-2">
          <Droplet size={17} className="text-blue-400" /> {t('blur.title', 'Censurar Rostos')}
        </span>
        <div className="flex items-center gap-2">
          {/* Rotate Button */}
          <button
            type="button"
            onClick={handleRotate}
            className="px-2.5 py-1 text-xs font-bold text-blue-300 hover:text-white bg-blue-950/60 hover:bg-blue-900/60 border border-blue-500/40 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
            title="Girar foto em 90 graus"
          >
            <RotateCw size={13} />
            <span>Girar 90°</span>
          </button>

          <button
            onClick={handleUseWithoutBlur}
            className="px-2.5 py-1 text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-950/50 hover:bg-emerald-900/50 border border-emerald-500/30 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
            title="Usar imagem sem aplicar desfoque"
          >
            <CheckCircle2 size={13} />
            <span>Sem Desfoque</span>
          </button>
          <button
            onClick={handleSave}
            className="p-2 text-blue-400 hover:text-blue-300 rounded-full hover:bg-blue-500/10 transition-colors cursor-pointer"
            title="Salvar com desfoque"
          >
            <Check size={20} />
          </button>
        </div>
      </div>

      {/* Warning */}
      <div className="w-full bg-blue-900/30 border-b border-blue-900/50 p-2.5 flex gap-2.5 items-center justify-center text-blue-200 text-xs sm:text-sm shadow-inner text-center">
        <Info size={16} className="text-blue-400 shrink-0" />
        <p>{t('blur.hint', 'Passe o dedo nas pessoas e nas placas de viaturas para desfocá-las.')}</p>
      </div>

      {/* Canvas Container */}
      <div 
        ref={containerRef} 
        className="flex-1 w-full h-full flex items-center justify-center p-4 overflow-hidden relative touch-none"
      >
        {!image && (
          <div className="absolute text-slate-400 animate-pulse">{t('blur.loading', 'Carregando imagem...')}</div>
        )}
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl cursor-crosshair border border-slate-800"
          style={{ touchAction: 'none' }}
        />
        {/* Hidden blur canvas used as source */}
        <canvas ref={blurCanvasRef} className="hidden" />
      </div>

      {/* Bottom Controls */}
      <div className="w-full p-3.5 sm:p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-2.5">
        <button 
          onClick={handleUndo} 
          disabled={history.length <= 1}
          className="p-2 text-slate-400 hover:text-white disabled:opacity-40 disabled:hover:text-slate-400 hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
          title="Desfazer"
        >
          <Undo size={19} />
        </button>
        
        <div className="flex-1 flex flex-col items-center gap-1 max-w-[180px]">
          <span className="text-[11px] text-slate-400">{t('blur.brushSize', 'Tamanho do Pincel')}</span>
          <input 
            type="range" 
            min="10" 
            max="60" 
            value={brushSize} 
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-full accent-blue-500 cursor-pointer"
          />
        </div>

        <button
          type="button"
          onClick={handleRotate}
          className="px-2.5 py-1.5 text-xs font-bold text-blue-300 hover:text-white bg-blue-950/60 hover:bg-blue-900/60 border border-blue-500/40 rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
          title="Girar foto"
        >
          <RotateCw size={13} />
          <span>Girar</span>
        </button>

        <button
          onClick={handleUseWithoutBlur}
          className="px-3 py-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-950/50 hover:bg-emerald-900/50 border border-emerald-500/40 rounded-xl flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
        >
          <CheckCircle2 size={14} />
          Sem Desfoque
        </button>
      </div>
    </div>
  );
}
