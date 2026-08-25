import { useEffect, useRef } from 'react';

export function useShakeDetection(onShake: () => void, sensitivity = 15, timeout = 1000) {
  const lastShake = useRef(0);

  useEffect(() => {
    let lastX = 0, lastY = 0, lastZ = 0;

    const handleMotion = (e: DeviceMotionEvent) => {
      const current = e.accelerationIncludingGravity;
      if (!current || current.x === null || current.y === null || current.z === null) return;

      const deltaX = Math.abs(lastX - current.x);
      const deltaY = Math.abs(lastY - current.y);
      const deltaZ = Math.abs(lastZ - current.z);

      if (deltaX + deltaY + deltaZ > sensitivity) {
        const now = Date.now();
        if (now - lastShake.current > timeout) {
          lastShake.current = now;
          onShake();
        }
      }

      lastX = current.x;
      lastY = current.y;
      lastZ = current.z;
    };

    // Request permission for iOS 13+ devices
    const requestPermission = async () => {
      if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
        try {
          const permission = await (DeviceMotionEvent as any).requestPermission();
          if (permission === 'granted') {
            window.addEventListener('devicemotion', handleMotion);
          }
        } catch (error) {
          console.error('Error requesting device motion permission:', error);
        }
      } else {
        window.addEventListener('devicemotion', handleMotion);
      }
    };

    requestPermission();

    return () => {
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, [onShake, sensitivity, timeout]);
}
