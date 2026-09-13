import React, { useState, useRef, useEffect } from 'react';
import { X, Check, Droplet, Undo, Info } from 'lucide-react';

interface ImageBlurEditorProps {
  file: File;
  onSave: (file: File) => void;
  onCancel: () => void;
}

export function ImageBlurEditor({ file, onSave, onCancel }: ImageBlurEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const blurCanvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
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

    // Calculate dimensions to fit screen while maintaining aspect ratio
    const maxWidth = containerRef.current.clientWidth;
    const maxHeight = containerRef.current.clientHeight;
    
    let targetWidth = image.width;
    let targetHeight = image.height;
    
    if (targetWidth > maxWidth || targetHeight > maxHeight) {
      const ratio = Math.min(maxWidth / targetWidth, maxHeight / targetHeight);
      targetWidth *= ratio;
      targetHeight *= ratio;
    }

    canvas.width = targetWidth;
    canvas.height = targetHeight;
    blurCanvas.width = targetWidth;
    blurCanvas.height = targetHeight;

    // Draw base image
    ctx.drawImage(image, 0, 0, targetWidth, targetHeight);
    
    // Create blurred version
    blurCtx.filter = 'blur(15px)';
    blurCtx.drawImage(image, 0, 0, targetWidth, targetHeight);
    blurCtx.filter = 'none'; // reset

    // Save initial state to history
    setHistory([ctx.getImageData(0, 0, canvas.width, canvas.height)]);
  }, [image]);

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
        const blurredFile = new File([blob], file.name, { type: file.type });
        onSave(blurredFile);
      }
    }, file.type, 0.9);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-between animate-in fade-in zoom-in-95 duration-200">
      {/* Top Bar */}
      <div className="w-full flex items-center justify-between p-4 bg-slate-900/80 border-b border-slate-800">
        <button onClick={onCancel} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors">
          <X size={24} />
        </button>
        <span className="text-white font-semibold flex items-center gap-2">
          <Droplet size={18} className="text-blue-400" /> Censurar Rostos
        </span>
        <button onClick={handleSave} className="p-2 text-blue-400 hover:text-blue-300 rounded-full hover:bg-blue-500/10 transition-colors">
          <Check size={24} />
        </button>
      </div>

      {/* Warning */}
      <div className="w-full bg-blue-900/30 border-b border-blue-900/50 p-3 flex gap-3 items-center justify-center text-blue-200 text-xs sm:text-sm shadow-inner">
        <Info size={16} className="text-blue-400 shrink-0" />
        <p>Passe o dedo nas pessoas e nas placas de viaturas para desfocá-las.</p>
      </div>

      {/* Canvas Container */}
      <div 
        ref={containerRef} 
        className="flex-1 w-full h-full flex items-center justify-center p-4 overflow-hidden relative touch-none"
      >
        {!image && (
          <div className="absolute text-slate-400 animate-pulse">Carregando imagem...</div>
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
      <div className="w-full p-6 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-4">
        <button 
          onClick={handleUndo} 
          disabled={history.length <= 1}
          className="p-3 text-slate-400 hover:text-white disabled:opacity-50 disabled:hover:text-slate-400 hover:bg-slate-800 rounded-xl transition-all"
        >
          <Undo size={24} />
        </button>
        
        <div className="flex-1 flex flex-col items-center gap-2 max-w-[200px]">
          <span className="text-xs text-slate-400">Tamanho do Desfoque</span>
          <input 
            type="range" 
            min="10" 
            max="60" 
            value={brushSize} 
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-full accent-blue-500"
          />
        </div>
      </div>
    </div>
  );
}
