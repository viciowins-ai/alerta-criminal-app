import React, { useState, useEffect } from 'react';
import { Compass, ExternalLink, X } from 'lucide-react';
import { isInAppBrowser, openInExternalBrowser } from '../utils/inAppBrowser';

export function InAppBrowserBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isInAppBrowser()) {
      const dismissed = sessionStorage.getItem('dismissed_inapp_banner');
      if (!dismissed) {
        setShow(true);
      }
    }
  }, []);

  if (!show) return null;

  return (
    <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-orange-600 text-white px-3.5 py-2.5 shadow-lg relative z-50 flex items-center justify-between gap-3 text-xs border-b border-amber-400/40 animate-in slide-in-from-top duration-300">
      <div className="flex items-center gap-2.5 min-w-0">
        <Compass size={18} className="shrink-0 text-amber-200 animate-pulse" />
        <div className="leading-tight">
          <p className="font-bold">Acessando pelo Facebook ou Instagram?</p>
          <p className="text-[11px] text-amber-100 truncate">
            Para fazer login e usar o GPS com precisão, abra no Chrome ou Safari externo.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => openInExternalBrowser()}
          className="bg-slate-950/80 hover:bg-slate-950 text-white px-2.5 py-1.5 rounded-lg font-bold text-[11px] flex items-center gap-1 shadow-sm transition-all active:scale-95 border border-white/20"
        >
          <ExternalLink size={12} />
          <span>Abrir</span>
        </button>

        <button
          onClick={() => {
            setShow(false);
            sessionStorage.setItem('dismissed_inapp_banner', 'true');
          }}
          className="p-1 hover:bg-black/20 rounded-md text-amber-100 transition-colors"
          title="Fechar"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
