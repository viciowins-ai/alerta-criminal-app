import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Logo } from './Logo';

interface TopBarProps {
  title: string;
  action?: React.ReactNode;
  onBack?: () => void;
  showBack?: boolean;
}

export function TopBar({ title, action, onBack, showBack = true }: TopBarProps) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700 sticky top-0 z-40">
      <div className="flex items-center gap-3">
        {showBack && (
          <button 
            onClick={onBack || (() => navigate(-1))}
            className="p-2 -ml-2 rounded-full hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft size={20} className="text-slate-300" />
          </button>
        )}
        {!showBack && <Logo className="w-6 h-6" />}
        <h1 className="text-lg font-semibold text-white">{title}</h1>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
