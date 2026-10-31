import React from 'react';
import { Filter, Layers, Flame, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface MapFilterPopoverProps {
  isOpen: boolean;
  activeFilter: string | null;
  showHeatmap: boolean;
  isRTL: boolean;
  onClose: () => void;
  onSelectFilter: (type: string | null) => void;
  onClearFilter: () => void;
  onToggleHeatmap: () => void;
}

export function MapFilterPopover({
  isOpen,
  activeFilter,
  showHeatmap,
  isRTL,
  onClose,
  onSelectFilter,
  onClearFilter,
  onToggleHeatmap,
}: MapFilterPopoverProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <>
      {/* Invisible backdrop to dismiss when tapping outside */}
      <div 
        className="fixed inset-0 z-40 bg-black/20" 
        onClick={onClose} 
      />
      
      <div 
        className={`absolute top-full mt-2 w-64 sm:w-72 max-w-[calc(100vw-1.5rem)] bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/70 overflow-hidden z-50 animate-fade-in divide-y divide-slate-800/80 ${
          isRTL ? 'left-0 right-auto' : 'right-0 left-auto'
        }`}
      >
        {/* Header with Title and Clear button */}
        <div className="px-3.5 py-2.5 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-blue-400" />
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              {t('map.filters.title', 'Filtros')}
            </span>
          </div>
          {activeFilter && (
            <button
              onClick={onClearFilter}
              className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
            >
              {t('common.clear', 'Limpar')}
            </button>
          )}
        </div>

        {/* Filter Items */}
        <div className="p-1.5 space-y-0.5">
          <button
            onClick={() => onSelectFilter(null)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              !activeFilter 
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' 
                : 'text-slate-300 hover:bg-slate-800/80 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Layers size={14} className="text-blue-400 shrink-0" />
              <span className="truncate">{t('map.filters.all', 'Todos os Alertas')}</span>
            </div>
            {!activeFilter && <Check size={16} className={`text-blue-400 shrink-0 ${isRTL ? 'mr-2' : 'ml-2'}`} />}
          </button>

          <button
            onClick={() => onSelectFilter('roubo')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              activeFilter === 'roubo' 
                ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                : 'text-slate-300 hover:bg-slate-800/80 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
              <span className="truncate">{t('report.types.roubo', 'Roubo/Furto')}</span>
            </div>
            {activeFilter === 'roubo' && <Check size={16} className={`text-red-400 shrink-0 ${isRTL ? 'mr-2' : 'ml-2'}`} />}
          </button>

          <button
            onClick={() => onSelectFilter('suspeito')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              activeFilter === 'suspeito' 
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' 
                : 'text-slate-300 hover:bg-slate-800/80 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0 shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
              <span className="truncate">{t('report.types.suspeito', 'Atividade Suspeita')}</span>
            </div>
            {activeFilter === 'suspeito' && <Check size={16} className={`text-orange-400 shrink-0 ${isRTL ? 'mr-2' : 'ml-2'}`} />}
          </button>

          <button
            onClick={() => onSelectFilter('zeladoria')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              activeFilter === 'zeladoria' 
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' 
                : 'text-slate-300 hover:bg-slate-800/80 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shrink-0 shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
              <span className="truncate">{t('report.types.zeladoria', 'Zeladoria / Risco')}</span>
            </div>
            {activeFilter === 'zeladoria' && <Check size={16} className={`text-cyan-400 shrink-0 ${isRTL ? 'mr-2' : 'ml-2'}`} />}
          </button>

          <button
            onClick={() => onSelectFilter('vandalismo')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              activeFilter === 'vandalismo' 
                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' 
                : 'text-slate-300 hover:bg-slate-800/80 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 shrink-0 shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
              <span className="truncate">{t('report.types.vandalismo', 'Vandalismo')}</span>
            </div>
            {activeFilter === 'vandalismo' && <Check size={16} className={`text-yellow-400 shrink-0 ${isRTL ? 'mr-2' : 'ml-2'}`} />}
          </button>

          <button
            onClick={() => onSelectFilter('outro')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              activeFilter === 'outro' 
                ? 'bg-slate-500/20 text-slate-300 border border-slate-500/30' 
                : 'text-slate-300 hover:bg-slate-800/80 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0" />
              <span className="truncate">{t('report.types.outro', 'Outro')}</span>
            </div>
            {activeFilter === 'outro' && <Check size={16} className={`text-slate-300 shrink-0 ${isRTL ? 'mr-2' : 'ml-2'}`} />}
          </button>
        </div>

        {/* Heatmap Section */}
        <div className="p-1.5 bg-slate-950/40">
          <button
            onClick={onToggleHeatmap}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              showHeatmap 
                ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40 shadow-sm' 
                : 'text-slate-300 hover:bg-slate-800/80 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Flame size={16} className={showHeatmap ? "text-orange-400 shrink-0 animate-pulse" : "text-slate-400 shrink-0"} />
              <div className="flex flex-col text-left">
                <span className="truncate font-semibold">{t('map.filters.heatmap', 'Mapa de Calor')}</span>
                <span className="text-[10px] text-slate-400">Mancha térmica criminal</span>
              </div>
            </div>
            <div className={`w-9 h-5 rounded-full transition-colors relative shrink-0 ${isRTL ? 'mr-2' : 'ml-2'} ${showHeatmap ? 'bg-orange-600' : 'bg-slate-700'}`}>
              <div 
                className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-all duration-200 ${
                  showHeatmap 
                    ? (isRTL ? 'right-[18px]' : 'left-[18px]') 
                    : (isRTL ? 'right-[3px]' : 'left-[3px]')
                }`} 
              />
            </div>
          </button>
        </div>
      </div>
    </>
  );
}
