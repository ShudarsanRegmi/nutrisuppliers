import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  getPWACapabilities, 
  isStandalone, 
  getPWADisplayMode, 
  isMobileDevice,
  getNetworkStatus 
} from '@/lib/pwa';

export function PWADebug() {
  const [capabilities, setCapabilities] = useState(getPWACapabilities());
  const [displayMode, setDisplayMode] = useState(getPWADisplayMode());
  const [networkStatus, setNetworkStatus] = useState(getNetworkStatus());
  const [installPromptAvailable, setInstallPromptAvailable] = useState(false);

  useEffect(() => {
    // Listen for PWA events
    const handleInstallAvailable = () => setInstallPromptAvailable(true);
    const handleInstalled = () => setInstallPromptAvailable(false);
    const handleNetworkChange = () => setNetworkStatus(getNetworkStatus());

    window.addEventListener('pwa-install-available', handleInstallAvailable);
    window.addEventListener('pwa-installed', handleInstalled);
    window.addEventListener('online', handleNetworkChange);
    window.addEventListener('offline', handleNetworkChange);

    return () => {
      window.removeEventListener('pwa-install-available', handleInstallAvailable);
      window.removeEventListener('pwa-installed', handleInstalled);
      window.removeEventListener('online', handleNetworkChange);
      window.removeEventListener('offline', handleNetworkChange);
    };
  }, []);

  const getStatusBadge = (supported: boolean) => (
    <Badge variant={supported ? "default" : "secondary"}>
      {supported ? "✓ Supported" : "✗ Not Supported"}
    </Badge>
  );

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <Card className="w-80 max-h-96 overflow-y-auto">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">PWA Debug Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          {/* App Status */}
          <div>
            <h4 className="font-medium mb-1">App Status</h4>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Display Mode:</span>
                <Badge variant="outline">{displayMode}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Standalone:</span>
                {getStatusBadge(isStandalone())}
              </div>
              <div className="flex justify-between">
                <span>Mobile Device:</span>
                {getStatusBadge(isMobileDevice())}
              </div>
              <div className="flex justify-between">
                <span>Network:</span>
                <Badge variant={networkStatus === 'online' ? "default" : "destructive"}>
                  {networkStatus}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Install Prompt:</span>
                {getStatusBadge(installPromptAvailable)}
              </div>
            </div>
          </div>

          {/* PWA Capabilities */}
          <div>
            <h4 className="font-medium mb-1">PWA Capabilities</h4>
            <div className="grid grid-cols-2 gap-1">
              <div className="flex justify-between">
                <span>Service Worker:</span>
                {getStatusBadge(capabilities.serviceWorker)}
              </div>
              <div className="flex justify-between">
                <span>Push Notifications:</span>
                {getStatusBadge(capabilities.pushNotifications)}
              </div>
              <div className="flex justify-between">
                <span>Background Sync:</span>
                {getStatusBadge(capabilities.backgroundSync)}
              </div>
              <div className="flex justify-between">
                <span>Web Share:</span>
                {getStatusBadge(capabilities.webShare)}
              </div>
              <div className="flex justify-between">
                <span>Install Prompt:</span>
                {getStatusBadge(capabilities.installPrompt)}
              </div>
              <div className="flex justify-between">
                <span>Wake Lock:</span>
                {getStatusBadge(capabilities.wakeLock)}
              </div>
              <div className="flex justify-between">
                <span>Badging:</span>
                {getStatusBadge(capabilities.badging)}
              </div>
              <div className="flex justify-between">
                <span>File System:</span>
                {getStatusBadge(capabilities.fileSystemAccess)}
              </div>
            </div>
          </div>

          {/* Manifest Check */}
          <div>
            <h4 className="font-medium mb-1">Manifest</h4>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                fetch('/manifest.json')
                  .then(response => response.json())
                  .then(manifest => {
                    console.log('Manifest:', manifest);
                    alert('Manifest loaded successfully! Check console for details.');
                  })
                  .catch(error => {
                    console.error('Manifest error:', error);
                    alert('Manifest failed to load! Check console for details.');
                  });
              }}
              className="w-full"
            >
              Test Manifest
            </Button>
          </div>

          {/* Service Worker Check */}
          <div>
            <h4 className="font-medium mb-1">Service Worker</h4>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.getRegistrations()
                    .then(registrations => {
                      console.log('Service Worker registrations:', registrations);
                      alert(`Found ${registrations.length} service worker(s)! Check console for details.`);
                    });
                } else {
                  alert('Service Worker not supported!');
                }
              }}
              className="w-full"
            >
              Check Service Worker
            </Button>
          </div>

          {/* Manual Install Test */}
          <div>
            <h4 className="font-medium mb-1">Manual Install</h4>
            <div className="text-xs text-gray-600 mb-2">
              Try these steps:
              <br />• Chrome: Menu → Install NutriSuppliers
              <br />• Safari: Share → Add to Home Screen
              <br />• Edge: Menu → Apps → Install
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Toggle debug panel
export function PWADebugToggle() {
  const [showDebug, setShowDebug] = useState(false);

  // Only show in development or when explicitly enabled
  const shouldShow = process.env.NODE_ENV === 'development' || 
                    localStorage.getItem('pwa-debug') === 'true';

  if (!shouldShow) {
    return null;
  }

  return (
    <>
      <Button
        onClick={() => setShowDebug(!showDebug)}
        size="sm"
        variant="outline"
        className="fixed top-4 right-4 z-50"
      >
        PWA Debug
      </Button>
      {showDebug && <PWADebug />}
    </>
  );
}
