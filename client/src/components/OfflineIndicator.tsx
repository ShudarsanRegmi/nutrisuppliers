import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { WifiOff, Wifi, Cloud, CloudOff } from 'lucide-react';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowIndicator(true);
      // Hide the "back online" indicator after 3 seconds
      setTimeout(() => setShowIndicator(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowIndicator(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Show indicator initially if offline
    if (!navigator.onLine) {
      setShowIndicator(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showIndicator) {
    return null;
  }

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <Badge
        variant={isOnline ? "default" : "destructive"}
        className={`
          flex items-center space-x-2 px-3 py-2 text-sm font-medium
          ${isOnline 
            ? 'bg-green-100 text-green-800 border-green-200' 
            : 'bg-red-100 text-red-800 border-red-200'
          }
          animate-in slide-in-from-top-2 duration-300
        `}
      >
        {isOnline ? (
          <>
            <Wifi size={16} />
            <span>Back online</span>
          </>
        ) : (
          <>
            <WifiOff size={16} />
            <span>Working offline</span>
          </>
        )}
      </Badge>
    </div>
  );
}

// Network Status Hook
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

// Sync Status Component
export function SyncStatusIndicator() {
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'error'>('synced');
  const isOnline = useNetworkStatus();

  useEffect(() => {
    if (!isOnline) {
      setSyncStatus('offline');
    } else {
      setSyncStatus('synced');
    }
  }, [isOnline]);

  const getStatusConfig = () => {
    switch (syncStatus) {
      case 'synced':
        return {
          icon: <Cloud size={14} />,
          text: 'Synced',
          className: 'bg-green-50 text-green-700 border-green-200'
        };
      case 'syncing':
        return {
          icon: <Cloud size={14} className="animate-pulse" />,
          text: 'Syncing...',
          className: 'bg-blue-50 text-blue-700 border-blue-200'
        };
      case 'offline':
        return {
          icon: <CloudOff size={14} />,
          text: 'Offline',
          className: 'bg-gray-50 text-gray-700 border-gray-200'
        };
      case 'error':
        return {
          icon: <CloudOff size={14} />,
          text: 'Sync Error',
          className: 'bg-red-50 text-red-700 border-red-200'
        };
      default:
        return {
          icon: <Cloud size={14} />,
          text: 'Synced',
          className: 'bg-green-50 text-green-700 border-green-200'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <Badge
        variant="outline"
        className={`
          flex items-center space-x-1 px-2 py-1 text-xs
          ${config.className}
        `}
      >
        {config.icon}
        <span>{config.text}</span>
      </Badge>
    </div>
  );
}
