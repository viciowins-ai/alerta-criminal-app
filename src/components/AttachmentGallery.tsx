import React, { useRef, useState, useCallback, MouseEvent } from 'react';
import { Play } from 'lucide-react';

export function AttachmentGallery({ attachments }: { attachments: any[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragged, setDragged] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

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
        const type = isObject ? attachment.type : (url.includes('.mp4') || url.includes('video') ? 'video/mp4' : 'image/jpeg');
        return (
          <div 
            key={index} 
            className="relative aspect-video w-[85%] max-w-sm shrink-0 snap-center rounded-xl overflow-hidden border border-slate-700 group" 
            onClick={() => {
              if (!dragged) window.open(url, '_blank');
            }}
          >
            {type.startsWith('video/') ? (
              <>
                <video src={url} className="w-full h-full object-cover pointer-events-none" muted playsInline preload="metadata" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/50 transition-colors pointer-events-none">
                  <Play className="text-white fill-white/80" size={32} />
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
  );
}
