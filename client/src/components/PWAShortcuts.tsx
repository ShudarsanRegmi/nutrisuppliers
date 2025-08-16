import { useEffect } from 'react';
import { useLocation } from 'wouter';

interface PWAShortcutsProps {
  onNavigate: (view: 'dashboard' | 'clients' | 'ledger' | 'reports') => void;
  onAction?: (action: string) => void;
}

export function PWAShortcuts({ onNavigate, onAction }: PWAShortcutsProps) {
  const [location] = useLocation();

  useEffect(() => {
    // Handle PWA shortcuts from manifest.json
    const handleShortcuts = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const view = urlParams.get('view');
      const action = urlParams.get('action');

      if (view) {
        switch (view) {
          case 'clients':
            onNavigate('clients');
            break;
          case 'reports':
            onNavigate('reports');
            break;
          case 'ledger':
            onNavigate('ledger');
            break;
          default:
            onNavigate('dashboard');
        }
        
        // Clean up URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      if (action && onAction) {
        onAction(action);
        
        // Clean up URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };

    // Handle shortcuts on initial load
    handleShortcuts();

    // Handle shortcuts when URL changes
    window.addEventListener('popstate', handleShortcuts);

    return () => {
      window.removeEventListener('popstate', handleShortcuts);
    };
  }, [onNavigate, onAction]);

  return null; // This component doesn't render anything
}

// PWA Share functionality
export function usePWAShare() {
  const canShare = 'share' in navigator;

  const shareData = async (data: {
    title?: string;
    text?: string;
    url?: string;
    files?: File[];
  }) => {
    if (!canShare) {
      // Fallback to clipboard or other sharing methods
      if (data.url && 'clipboard' in navigator) {
        try {
          await navigator.clipboard.writeText(data.url);
          return { success: true, method: 'clipboard' };
        } catch (error) {
          console.error('Failed to copy to clipboard:', error);
          return { success: false, error };
        }
      }
      return { success: false, error: 'Sharing not supported' };
    }

    try {
      await navigator.share(data);
      return { success: true, method: 'native' };
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        return { success: false, error: 'Share cancelled by user' };
      }
      console.error('Error sharing:', error);
      return { success: false, error };
    }
  };

  return { canShare, shareData };
}

// PWA Badge API (for showing unread counts, etc.)
export function usePWABadge() {
  const canSetBadge = 'setAppBadge' in navigator;

  const setBadge = async (count?: number) => {
    if (!canSetBadge) return false;

    try {
      if (count === undefined || count === 0) {
        await (navigator as any).clearAppBadge();
      } else {
        await (navigator as any).setAppBadge(count);
      }
      return true;
    } catch (error) {
      console.error('Failed to set app badge:', error);
      return false;
    }
  };

  const clearBadge = async () => {
    if (!canSetBadge) return false;

    try {
      await (navigator as any).clearAppBadge();
      return true;
    } catch (error) {
      console.error('Failed to clear app badge:', error);
      return false;
    }
  };

  return { canSetBadge, setBadge, clearBadge };
}

// PWA Screen Wake Lock (prevent screen from sleeping during important operations)
export function useWakeLock() {
  let wakeLock: any = null;

  const requestWakeLock = async () => {
    if ('wakeLock' in navigator) {
      try {
        wakeLock = await (navigator as any).wakeLock.request('screen');
        console.log('Screen wake lock activated');
        return true;
      } catch (error) {
        console.error('Failed to request wake lock:', error);
        return false;
      }
    }
    return false;
  };

  const releaseWakeLock = async () => {
    if (wakeLock) {
      try {
        await wakeLock.release();
        wakeLock = null;
        console.log('Screen wake lock released');
        return true;
      } catch (error) {
        console.error('Failed to release wake lock:', error);
        return false;
      }
    }
    return false;
  };

  return { requestWakeLock, releaseWakeLock };
}

// PWA File System Access (for exporting reports, etc.)
export function usePWAFileSystem() {
  const canAccessFileSystem = 'showSaveFilePicker' in window;

  const saveFile = async (data: string, filename: string, mimeType: string = 'text/plain') => {
    if (!canAccessFileSystem) {
      // Fallback to download
      const blob = new Blob([data], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return { success: true, method: 'download' };
    }

    try {
      const fileHandle = await (window as any).showSaveFilePicker({
        suggestedName: filename,
        types: [{
          description: 'Text files',
          accept: { [mimeType]: ['.txt', '.csv', '.json'] }
        }]
      });

      const writable = await fileHandle.createWritable();
      await writable.write(data);
      await writable.close();

      return { success: true, method: 'filesystem' };
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        return { success: false, error: 'Save cancelled by user' };
      }
      console.error('Failed to save file:', error);
      return { success: false, error };
    }
  };

  return { canAccessFileSystem, saveFile };
}
