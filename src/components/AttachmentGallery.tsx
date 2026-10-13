import React, { useRef, useState, useCallback, MouseEvent, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Play, X, Download } from 'lucide-react';

export function AttachmentGallery({ attachments }: { attachments: any[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragged, setDragged] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // In-app media preview state
  const [selectedMedia, setSelectedMedia] = useState<{ url: string; type: string } | null>(null);

  // Close on Escape key
  useEffect(() => {
    if (!selectedMedia) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedMedia(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedMedia]);

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
              onClick={() => {
                if (!dragged) {
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

      {/* Fullscreen Media Lightbox via Portal to escape card overflow & stacking context */}
      {selectedMedia && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedMedia(null)}
        >
          {/* Top action buttons */}
          <div className="absolute top-4 right-4 flex items-center gap-2 z-[10000]" onClick={(e) => e.stopPropagation()}>
            <a
              href={selectedMedia.url}
              download
              target="_blank"
              rel="noreferrer"
              className="p-2.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 rounded-full transition-colors flex items-center justify-center shadow-xl border border-slate-700/80"
              title="Baixar mídia"
            >
              <Download size={18} />
            </a>
            <button
              onClick={() => setSelectedMedia(null)}
              className="p-2.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 rounded-full transition-colors shadow-xl border border-slate-700/80"
              title="Fechar visualização"
            >
              <X size={20} />
            </button>
          </div>

          {/* Media Container */}
          <div 
            className="relative max-w-4xl max-h-[85vh] w-full flex items-center justify-center p-2"
            onClick={(e) => e.stopPropagation()}
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
                className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-slate-800"
              />
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
