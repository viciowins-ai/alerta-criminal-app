import React, { useState, useEffect } from 'react';
import { useShakeDetection } from '../hooks/useShakeDetection';

interface PanicModeOverlayProps {
  isActive: boolean;
  onDeactivate: () => void;
  onTriggerSOS: () => void;
}

export function PanicModeOverlay({ isActive, onDeactivate, onTriggerSOS }: PanicModeOverlayProps) {
  const [tapCount, setTapCount] = useState(0);

  useShakeDetection(() => {
    if (isActive) {
      onTriggerSOS();
    }
  }, 20, 2000); // slightly higher sensitivity to avoid accidental shakes

  useEffect(() => {
    if (tapCount >= 3) {
      onTriggerSOS();
      setTapCount(0);
    }
  }, [tapCount, onTriggerSOS]);

  useEffect(() => {
    if (tapCount > 0) {
      const timer = setTimeout(() => setTapCount(0), 1500); // reset taps after 1.5s
      return () => clearTimeout(timer);
    }
  }, [tapCount]);

  if (!isActive) return null;

  return (
    <div 
      className="fixed inset-0 z-[999] bg-black"
      onClick={() => setTapCount(prev => prev + 1)}
    >
      {/* Hidden exit button in the top right corner (long press or double tap to exit) */}
      <button 
        onDoubleClick={onDeactivate}
        className="absolute top-0 right-0 w-20 h-20 opacity-0"
        aria-label="Sair do modo pânico"
      />
    </div>
  );
}
