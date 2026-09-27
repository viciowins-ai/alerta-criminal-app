import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Map, Navigation, Plus, User, Users, WifiOff } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useTranslation } from 'react-i18next';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Layout() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const isMapPage = location.pathname === '/';
  const hideBottomNav = ['/login', '/dashboard', '/report'].includes(location.pathname);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="flex flex-col h-[100dvh] max-w-md mx-auto bg-slate-900 shadow-2xl overflow-hidden relative select-none">
      {isOffline && (
        <div className="bg-amber-600 text-white text-xs font-medium py-1.5 px-4 flex items-center justify-center gap-2 z-[70] shrink-0">
          <WifiOff size={14} />
          <span>{t('common.offlineNotice', 'Você está offline. O app continua funcionando com dados salvos.')}</span>
        </div>
      )}
      <main className={`flex-1 relative ${isMapPage ? 'overflow-hidden' : 'overflow-y-auto'} ${hideBottomNav ? 'pb-safe' : isMapPage ? '' : 'pb-24'}`}>
        <Outlet />
      </main>
      
      {!hideBottomNav && (
        <nav className="absolute bottom-0 left-0 right-0 bg-slate-950/90 backdrop-blur-lg border-t border-slate-800/80 flex justify-around items-center h-20 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] z-40">
          <NavItem to="/" icon={<Map size={22} />} label={t('nav.map', 'Mapa')} />
          <NavItem to="/route" icon={<Navigation size={22} />} label={t('nav.routes', 'Rotas')} />
          
          {/* Central Report Button */}
          <div className="relative -top-5 group shrink-0">
            <div className="absolute inset-0 bg-blue-500 rounded-full blur-md opacity-50 group-hover:opacity-80 transition-opacity"></div>
            <button 
              onClick={() => navigate('/report')}
              className="relative bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-full p-3.5 shadow-xl hover:scale-105 active:scale-95 transition-all flex flex-col items-center justify-center border-4 border-slate-950"
              title={t('nav.report', 'Reportar')}
              aria-label={t('nav.report', 'Reportar')}
            >
              <Plus size={26} strokeWidth={3} />
            </button>
          </div>
          
          <NavItem to="/feed" icon={<Users size={22} />} label={t('nav.feed', 'Feed')} />
          <NavItem to="/profile" icon={<User size={22} />} label={t('nav.profile', 'Perfil')} />
        </nav>
      )}
    </div>
  );
}

function NavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex flex-col items-center justify-center w-16 h-full text-slate-400 transition-colors",
          isActive && "text-blue-400"
        )
      }
    >
      {icon}
      <span className="text-[10px] font-medium mt-1">{label}</span>
    </NavLink>
  );
}
