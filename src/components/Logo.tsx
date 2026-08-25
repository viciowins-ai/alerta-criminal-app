import React from 'react';

export function Logo({ className = "w-24 h-24" }: { className?: string }) {
  return (
    <img 
      src="/escudo-logo.png" 
      alt="Alerta Criminal Logo" 
      className={`object-contain drop-shadow-2xl ${className}`}
    />
  );
}
