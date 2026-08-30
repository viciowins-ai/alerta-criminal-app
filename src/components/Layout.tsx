import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Map, Navigation, Plus, User, Users, WifiOff } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const hideBottomNav = ['/login', '/dashboard'].includes(location.pathname);
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
    <div className="flex flex-col h-screen max-w-md mx-auto bg-slate-900 shadow-2xl overflow-hidden relative">
      {isOffline && (
        <div className="bg-amber-600 text-white text-xs font-medium py-1.5 px-4 flex items-center justify-center gap-2 z-[60] shrink-0">
          <WifiOff size={14} />
          <span>Você está offline. O app continua funcionando com dados salvos.</span>
        </div>
      )}
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>
      
      {!hideBottomNav && (
        <nav className="absolute bottom-0 w-full bg-slate-950 border-t border-white/10 flex justify-around items-center h-20 px-2 pb-safe z-50">
          <NavItem to="/" icon={<Map size={24} />} label="Mapa" />
          <NavItem to="/route" icon={<Navigation size={24} />} label="Rotas" />
          
          {/* Central Report Button */}
          <div className="relative -top-6 group">
            <div className="absolute inset-0 bg-blue-600 rounded-full opacity-40 group-hover:opacity-70 transition-opacity"></div>
            <button 
              onClick={() => navigate('/report')}
              className="relative bg-gradient-to-b from-blue-500 to-blue-700 text-white rounded-full p-4 shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:from-blue-600 hover:to-blue-800 transition-all active:scale-95 flex flex-col items-center justify-center border-4 border-slate-900"
            >
              <Plus size={28} strokeWidth={3} />
            </button>
          </div>
          
          <NavItem to="/feed" icon={<Users size={24} />} label="Feed" />
          <NavItem to="/profile" icon={<User size={24} />} label="Perfil" />
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
