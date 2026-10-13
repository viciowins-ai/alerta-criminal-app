import React, { useRef, useState, useCallback, MouseEvent, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Play, X, Download, ArrowLeft } from 'lucide-react';

export function AttachmentGallery({ attachments }: { attachments: any[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragged, setDragged] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // In-app media preview state
  const [selectedMedia, setSelectedMedia] = useState<{ url: string; type: string } | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const isClosingRef = useRef(false);

  // Close handler with ghost-click protection & history pop
  const handleClose = useCallback((e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    setIsClosing(true);

    // If we pushed state, back will trigger popstate
    if (window.history.state && window.history.state.lightbox) {
      window.history.back();
    } else {
      setTimeout(() => {
        setSelectedMedia(null);
        setIsClosing(false);
        isClosingRef.current = false;
      }, 250);
    }
  }, []);

  // Listen for native Android back button / swipe back gesture & ESC key
  useEffect(() => {
    if (!selectedMedia) return;

    // Push state for Android back gesture
    const stateId = `lightbox_${Date.now()}`;
    window.history.pushState({ lightbox: stateId }, '');

    const handlePopState = () => {
      setIsClosing(true);
      isClosingRef.current = true;
      setTimeout(() => {
        setSelectedMedia(null);
        setIsClosing(false);
        isClosingRef.current = false;
      }, 250);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedMedia, handleClose]);

  const onMouseDown = useCallback((e: MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setDragged(false);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  }, []);

  const onMouseLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const onMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !scrollRef.current) return;
      e.preventDefault();
      const x = e.pageX - scrollRef.current.offsetLeft;
      const walk = (x - startX) * 2;
      if (Math.abs(walk) > 10) {
        setDragged(true);
      }
      scrollRef.current.scrollLeft = scrollLeft - walk;
    },
    [isDragging, startX, scrollLeft]
  );

  return (
    <>
      <div 
        ref={scrollRef}
        onMouseDown={onMouseDown}
        onMouseLeave={onMouseLeave}
        onMouseUp={onMouseUp}
        onMouseMove={onMouseMove}
        className={`mt-4 flex gap-2 overflow-x-auto pb-2 ${isDragging ? 'cursor-grabbing' : 'cursor-grab snap-x'}`}
        style={{ scrollBehavior: isDragging ? 'auto' : 'smooth' }}
      >
        {attachments.map((attachment: any, index: number) => {
          const isObject = typeof attachment === 'object' && attachment !== null;
          const url = isObject ? attachment.url : attachment;
          const type = isObject ? attachment.type : (url.includes('.mp4') || url.includes('.webm') || url.includes('video') ? 'video/mp4' : 'image/jpeg');
          return (
            <div 
              key={index} 
              className="relative aspect-video w-[85%] max-w-sm shrink-0 snap-center rounded-xl overflow-hidden border border-slate-700 bg-slate-900 group cursor-pointer" 
              onClick={(e) => {
                e.stopPropagation();
                if (!dragged) {
                  isClosingRef.current = false;
                  setIsClosing(false);
                  setSelectedMedia({ url, type });
                }
              }}
            >
              {type.startsWith('video/') ? (
                <>
                  <video src={url} className="w-full h-full object-cover pointer-events-none" muted playsInline preload="metadata" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/50 transition-colors pointer-events-none">
                    <div className="w-12 h-12 rounded-full bg-blue-600/80 backdrop-blur-sm flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Play className="text-white fill-white translate-x-0.5" size={24} />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <img src={url} alt="Anexo do post" className="w-full h-full object-cover pointer-events-none" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent pointer-events-none" />
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Fullscreen Media Lightbox via Portal with touch absorption & history isolation */}
      {selectedMedia && typeof document !== 'undefined' && createPortal(
        <div 
          className={`fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 transition-opacity duration-200 select-none ${
            isClosing ? 'opacity-0 pointer-events-auto' : 'opacity-100'
          }`}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleClose(e);
            }
          }}
          onTouchEnd={(e) => {
            if (e.target === e.currentTarget) {
              e.preventDefault();
              e.stopPropagation();
              handleClose(e);
            }
          }}
          style={{ touchAction: 'manipulation' }}
        >
          {/* Top Header Bar with prominent Back button and action buttons */}
          <div 
            className="absolute top-0 left-0 right-0 p-4 pt-safe flex items-center justify-between z-[10000] bg-gradient-to-b from-black/80 via-black/40 to-transparent"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={handleClose}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleClose(e);
              }}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800/90 hover:bg-slate-700 active:scale-95 text-white rounded-full transition-all shadow-xl border border-slate-700/80 touch-manipulation cursor-pointer"
              title="Voltar ao Feed"
            >
              <ArrowLeft size={18} />
              <span className="text-xs font-semibold pr-1">Voltar</span>
            </button>

            <div className="flex items-center gap-2">
              <a
                href={selectedMedia.url}
                download
                target="_blank"
                rel="noreferrer"
                className="p-2.5 bg-slate-800/90 hover:bg-slate-700 active:scale-95 text-slate-200 rounded-full transition-all flex items-center justify-center shadow-xl border border-slate-700/80 touch-manipulation cursor-pointer"
                title="Baixar mídia"
              >
                <Download size={18} />
              </a>
              <button
                type="button"
                onClick={handleClose}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleClose(e);
                }}
                className="p-2.5 bg-slate-800/90 hover:bg-slate-700 active:scale-95 text-slate-200 rounded-full transition-all shadow-xl border border-slate-700/80 touch-manipulation cursor-pointer"
                title="Fechar visualização"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Media Container (clicks/taps here do not close the lightbox) */}
          <div 
            className="relative max-w-4xl max-h-[85vh] w-full flex items-center justify-center p-2"
            onClick={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            {selectedMedia.type.startsWith('video/') ? (
              <video
                src={selectedMedia.url}
                controls
                autoPlay
                playsInline
                className="max-w-full max-h-[80vh] rounded-2xl shadow-2xl border border-slate-800 bg-black"
              />
            ) : (
              <img
                src={selectedMedia.url}
                alt="Visualização do anexo"
                className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-slate-800 pointer-events-auto"
              />
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
