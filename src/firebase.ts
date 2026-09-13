import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging, isSupported } from 'firebase/messaging';
import { getAnalytics, isSupported as isAnalyticsSupported, logEvent } from 'firebase/analytics';
import { getPerformance } from 'firebase/performance';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase services
export const auth = getAuth(app);

// Use getFirestore without persistent local cache in Dev to avoid HMR errors in AI Studio
// In production, enable persistent cache so data survives offline or flaky mobile connections
let firestoreDb;
if (import.meta.env.PROD) {
  firestoreDb = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
  });
} else {
  firestoreDb = getFirestore(app);
}
export const db = firestoreDb;

export const storage = getStorage(app);

// Initialize Performance Monitoring
export const perf = getPerformance(app);

// Initialize Messaging (only if supported by the browser)
export const messaging = async () => {
  const supported = await isSupported();
  if (supported) {
    return getMessaging(app);
  }
  return null;
};


// Initialize Analytics (only if supported by the browser)
let analyticsInstance: any = null;
export const analytics = async () => {
  if (analyticsInstance) return analyticsInstance;
  const supported = await isAnalyticsSupported();
  if (supported) {
    analyticsInstance = getAnalytics(app);
    return analyticsInstance;
  }
  return null;
};

// Custom Helper: Tracker de Eventos Centralizado
export const trackEvent = async (eventName: string, eventParams?: object) => {
  try {
    const analyticsObj = await analytics();
    if (analyticsObj) {
      logEvent(analyticsObj, eventName, eventParams);
      console.log(`[Analytics] Event tracked: ${eventName}`, eventParams || '');
    }
  } catch (error) {
    console.error(`[Analytics Error] Failed to track ${eventName}:`, error);
  }
};
