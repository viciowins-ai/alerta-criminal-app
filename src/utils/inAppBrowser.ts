/**
 * Utilities for detecting and handling In-App Browsers (Facebook, Instagram, Messenger, TikTok, etc.)
 * where third-party cookies, storage, and Google OAuth popups are blocked or partitioned.
 */

export const isInAppBrowser = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || navigator.vendor || (window as any).opera || '';
  return /FBAN|FBAV|Instagram|FB_IAB|FB4A|FBIOS|Messenger|Line|musical_ly|ByteDance|TikTok|Snapchat/i.test(ua);
};

export const isAndroid = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  return /Android/i.test(navigator.userAgent);
};

export const isIOS = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
};

/**
 * Attempts to escape in-app browser by launching standard system browser (Chrome on Android, Safari on iOS)
 */
export const openInExternalBrowser = (targetUrl?: string): boolean => {
  const currentUrl = targetUrl || window.location.href;

  if (isAndroid()) {
    try {
      // Use Android Intent to force Chrome native app
      const cleanUrl = currentUrl.replace(/^https?:\/\//, '');
      const intentUrl = `intent://${cleanUrl}#Intent;scheme=https;package=com.android.chrome;end`;
      window.location.href = intentUrl;
      return true;
    } catch (e) {
      // Fallback: normal navigate
      window.open(currentUrl, '_system');
      return false;
    }
  }

  // iOS Safari cannot be forced via intent, but window.open with _system or triggering a download can help
  try {
    window.open(currentUrl, '_blank');
  } catch (e) {}

  return false;
};
