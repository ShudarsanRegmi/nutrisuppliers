// PWA Service Worker Registration and Utilities

export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New content is available, show update prompt
                  console.log('New content is available; please refresh.');
                  
                  // Dispatch custom event for update notification
                  window.dispatchEvent(new CustomEvent('sw-update-available', {
                    detail: { registration }
                  }));
                }
              });
            }
          });
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    });
  }
}

export function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}

// Check if app is running in standalone mode (installed as PWA)
export function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true;
}

// Check if device is mobile
export function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Check if browser supports PWA features
export function isPWASupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

// Get PWA display mode
export function getPWADisplayMode(): string {
  if (isStandalone()) {
    return 'standalone';
  }
  if (window.matchMedia('(display-mode: minimal-ui)').matches) {
    return 'minimal-ui';
  }
  if (window.matchMedia('(display-mode: fullscreen)').matches) {
    return 'fullscreen';
  }
  return 'browser';
}

// Add to home screen prompt utilities
export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

export function setupInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('beforeinstallprompt event fired');
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('pwa-install-available'));
  });

  window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    deferredPrompt = null;
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('pwa-installed'));
  });
}

export async function showInstallPrompt(): Promise<boolean> {
  if (!deferredPrompt) {
    return false;
  }

  try {
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    
    return outcome === 'accepted';
  } catch (error) {
    console.error('Error showing install prompt:', error);
    return false;
  }
}

export function isInstallPromptAvailable(): boolean {
  return deferredPrompt !== null;
}

// PWA Analytics
export function trackPWAEvent(event: string, data?: any) {
  console.log(`PWA Event: ${event}`, data);
  
  // You can integrate with analytics services here
  // Example: gtag('event', event, { custom_parameter: data });
}

// PWA Storage utilities
export function setPWAData(key: string, value: any): void {
  try {
    localStorage.setItem(`pwa_${key}`, JSON.stringify(value));
  } catch (error) {
    console.error('Error saving PWA data:', error);
  }
}

export function getPWAData(key: string): any {
  try {
    const item = localStorage.getItem(`pwa_${key}`);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error('Error reading PWA data:', error);
    return null;
  }
}

export function removePWAData(key: string): void {
  try {
    localStorage.removeItem(`pwa_${key}`);
  } catch (error) {
    console.error('Error removing PWA data:', error);
  }
}

// PWA Network status
export function getNetworkStatus(): 'online' | 'offline' {
  return navigator.onLine ? 'online' : 'offline';
}

export function onNetworkChange(callback: (status: 'online' | 'offline') => void): () => void {
  const handleOnline = () => callback('online');
  const handleOffline = () => callback('offline');
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

// PWA Capabilities detection
export function getPWACapabilities() {
  return {
    serviceWorker: 'serviceWorker' in navigator,
    pushNotifications: 'PushManager' in window,
    backgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
    webShare: 'share' in navigator,
    installPrompt: 'BeforeInstallPromptEvent' in window,
    fullscreen: 'requestFullscreen' in document.documentElement,
    wakeLock: 'wakeLock' in navigator,
    badging: 'setAppBadge' in navigator,
    fileSystemAccess: 'showOpenFilePicker' in window,
    webAuthn: 'credentials' in navigator,
    geolocation: 'geolocation' in navigator,
    camera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
    storage: 'storage' in navigator && 'estimate' in navigator.storage
  };
}

// Initialize PWA
export function initializePWA() {
  console.log('Initializing PWA...');
  
  // Register service worker
  registerServiceWorker();
  
  // Setup install prompt
  setupInstallPrompt();
  
  // Track PWA initialization
  trackPWAEvent('pwa_initialized', {
    displayMode: getPWADisplayMode(),
    isStandalone: isStandalone(),
    isMobile: isMobileDevice(),
    capabilities: getPWACapabilities()
  });
  
  console.log('PWA initialized successfully');
}
