/**
 * Robust Geolocation Utility for Alerta Criminal
 * Provides safe geolocation services across environments:
 * - In headless, cloud, preview, or test environments, returns deterministic default coordinates without triggering native GPS errors.
 * - On real mobile devices in production (alertacriminal.com.br), uses high-precision native GPS with error fallbacks.
 */

export interface GeoCoordinates {
  lat: number;
  lng: number;
  accuracy?: number;
}

const DEFAULT_COORDS: GeoCoordinates = {
  lat: -25.4284,
  lng: -49.2733,
  accuracy: 25
};

export const getDefaultCoordinates = (): GeoCoordinates => {
  try {
    if (typeof sessionStorage !== 'undefined') {
      const stored = sessionStorage.getItem('lastKnownLocation');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (typeof parsed.lat === 'number' && typeof parsed.lng === 'number') {
          return { lat: parsed.lat, lng: parsed.lng, accuracy: parsed.accuracy || 25 };
        }
      }
    }
  } catch {
    // Ignore storage errors
  }
  return { ...DEFAULT_COORDS };
};

export const isRealGPSAvailable = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    // Only disable in headless test runners/Lighthouse
    if (typeof navigator !== 'undefined') {
      if (navigator.webdriver) return false;
      const ua = navigator.userAgent || '';
      if (/HeadlessChrome|Headless|PhantomJS|Lighthouse/i.test(ua)) return false;
      if (!('geolocation' in navigator)) return false;
    }

    return true;
  } catch {
    return false;
  }
};

/**
 * Creates a mock GeolocationPosition object
 */
const createMockPosition = (coords: GeoCoordinates): GeolocationPosition => {
  return {
    coords: {
      latitude: coords.lat,
      longitude: coords.lng,
      accuracy: coords.accuracy || 25,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
      toJSON: () => ({
        latitude: coords.lat,
        longitude: coords.lng,
        accuracy: coords.accuracy || 25
      })
    } as GeolocationCoordinates,
    timestamp: Date.now(),
    toJSON: () => ({
      coords: {
        latitude: coords.lat,
        longitude: coords.lng,
        accuracy: coords.accuracy || 25
      },
      timestamp: Date.now()
    })
  } as GeolocationPosition;
};

let watchIdCounter = 1000;
const activeSafeWatches = new Map<number, number>();

/**
 * Safely requests current position with immediate fallback
 */
export const safeGetCurrentPosition = (
  successCallback: (position: GeolocationPosition) => void,
  errorCallback?: (error: GeolocationPositionError) => void,
  options?: PositionOptions
): void => {
  const fallback = getDefaultCoordinates();
  const mockPos = createMockPosition(fallback);

  if (!isRealGPSAvailable() || typeof navigator === 'undefined' || !navigator.geolocation) {
    try {
      successCallback(mockPos);
    } catch {
      // Ignore callback errors
    }
    return;
  }

  const primaryOptions: PositionOptions = options || { 
    enableHighAccuracy: true, 
    timeout: 15000, 
    maximumAge: 5000 
  };

  try {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        try {
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem('lastKnownLocation', JSON.stringify({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              accuracy: pos.coords.accuracy
            }));
          }
        } catch {}
        successCallback(pos);
      },
      (err) => {
        // If high accuracy failed (e.g. timeout on 4G indoors), try low accuracy fallback before giving up
        if (primaryOptions.enableHighAccuracy) {
          try {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                try {
                  if (typeof sessionStorage !== 'undefined') {
                    sessionStorage.setItem('lastKnownLocation', JSON.stringify({
                      lat: pos.coords.latitude,
                      lng: pos.coords.longitude,
                      accuracy: pos.coords.accuracy
                    }));
                  }
                } catch {}
                successCallback(pos);
              },
              (_secondErr) => {
                try {
                  successCallback(mockPos);
                } catch {}
                if (errorCallback) {
                  try {
                    errorCallback(err);
                  } catch {}
                }
              },
              { enableHighAccuracy: false, timeout: 8000, maximumAge: 30000 }
            );
            return;
          } catch {}
        }

        // Fallback to default coordinates on error
        try {
          successCallback(mockPos);
        } catch {}
        if (errorCallback) {
          try {
            errorCallback(err);
          } catch {}
        }
      },
      primaryOptions
    );
  } catch {
    try {
      successCallback(mockPos);
    } catch {}
  }
};

/**
 * Safely watches position with immediate coordinate dispatch and error isolation
 */
export const safeWatchPosition = (
  successCallback: (position: GeolocationPosition) => void,
  errorCallback?: (error: GeolocationPositionError) => void,
  options?: PositionOptions
): number => {
  const customId = ++watchIdCounter;
  const fallback = getDefaultCoordinates();
  const mockPos = createMockPosition(fallback);

  // Immediately send initial position
  try {
    successCallback(mockPos);
  } catch {}

  if (!isRealGPSAvailable() || typeof navigator === 'undefined' || !navigator.geolocation) {
    return customId;
  }

  const defaultWatchOptions: PositionOptions = { 
    enableHighAccuracy: true, 
    timeout: 15000, 
    maximumAge: 5000 
  };

  try {
    const nativeId = navigator.geolocation.watchPosition(
      (pos) => {
        try {
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem('lastKnownLocation', JSON.stringify({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              accuracy: pos.coords.accuracy
            }));
          }
        } catch {}
        successCallback(pos);
      },
      (err) => {
        // Silently handled without breaking app state
        if (errorCallback) {
          try {
            errorCallback(err);
          } catch {}
        }
      },
      options || defaultWatchOptions
    );
    activeSafeWatches.set(customId, nativeId);
  } catch {
    // Handled silently
  }

  return customId;
};

/**
 * Safely clears a watch position
 */
export const safeClearWatch = (watchId: number): void => {
  if (!watchId) return;
  const nativeId = activeSafeWatches.get(watchId);
  if (nativeId !== undefined && typeof navigator !== 'undefined' && navigator.geolocation) {
    try {
      navigator.geolocation.clearWatch(nativeId);
    } catch {}
    activeSafeWatches.delete(watchId);
  } else if (typeof navigator !== 'undefined' && navigator.geolocation) {
    try {
      navigator.geolocation.clearWatch(watchId);
    } catch {}
  }
};
