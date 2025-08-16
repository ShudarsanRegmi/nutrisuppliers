import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, Download } from 'lucide-react';

interface PWAStatusProps {
  onInstall?: () => void;
}

export function PWAStatus({ onInstall }: PWAStatusProps) {
  const [manifestStatus, setManifestStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [serviceWorkerStatus, setServiceWorkerStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [installPromptAvailable, setInstallPromptAvailable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is installed
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInWebAppiOS = (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone || isInWebAppiOS);
    };

    checkInstalled();

    // Test manifest
    fetch('/manifest.json')
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        throw new Error(`HTTP ${response.status}`);
      })
      .then(manifest => {
        console.log('Manifest loaded successfully:', manifest);
        setManifestStatus('success');
      })
      .catch(error => {
        console.error('Manifest failed to load:', error);
        setManifestStatus('error');
      });

    // Test service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations()
        .then(registrations => {
          if (registrations.length > 0) {
            console.log('Service worker registered:', registrations);
            setServiceWorkerStatus('success');
          } else {
            console.log('No service worker registrations found');
            setServiceWorkerStatus('error');
          }
        })
        .catch(error => {
          console.error('Service worker check failed:', error);
          setServiceWorkerStatus('error');
        });
    } else {
      setServiceWorkerStatus('error');
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPromptAvailable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPromptAvailable(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const getStatusIcon = (status: 'loading' | 'success' | 'error') => {
    switch (status) {
      case 'success':
        return <CheckCircle className="text-green-500" size={16} />;
      case 'error':
        return <XCircle className="text-red-500" size={16} />;
      case 'loading':
        return <AlertCircle className="text-yellow-500" size={16} />;
    }
  };

  const getStatusText = (status: 'loading' | 'success' | 'error') => {
    switch (status) {
      case 'success':
        return 'Working';
      case 'error':
        return 'Failed';
      case 'loading':
        return 'Checking...';
    }
  };

  if (isInstalled) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Card className="w-64">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="text-green-500" size={20} />
              <span className="text-sm font-medium">App Installed!</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              NutriSuppliers is running as an installed app.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-80">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">PWA Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Manifest Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm">Manifest:</span>
            <div className="flex items-center space-x-2">
              {getStatusIcon(manifestStatus)}
              <span className="text-xs">{getStatusText(manifestStatus)}</span>
            </div>
          </div>

          {/* Service Worker Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm">Service Worker:</span>
            <div className="flex items-center space-x-2">
              {getStatusIcon(serviceWorkerStatus)}
              <span className="text-xs">{getStatusText(serviceWorkerStatus)}</span>
            </div>
          </div>

          {/* Install Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm">Install Prompt:</span>
            <Badge variant={installPromptAvailable ? "default" : "secondary"}>
              {installPromptAvailable ? "Available" : "Not Available"}
            </Badge>
          </div>

          {/* Install Instructions */}
          {!installPromptAvailable && manifestStatus === 'success' && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-800 mb-2">
                <strong>Manual Installation:</strong>
              </p>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Chrome: Menu → "Install NutriSuppliers"</li>
                <li>• Safari: Share → "Add to Home Screen"</li>
                <li>• Edge: Menu → Apps → "Install this site"</li>
              </ul>
            </div>
          )}

          {/* Install Button */}
          {installPromptAvailable && (
            <Button
              onClick={onInstall}
              className="w-full"
              size="sm"
            >
              <Download size={16} className="mr-2" />
              Install App
            </Button>
          )}

          {/* Debug Info */}
          <div className="text-xs text-gray-500 space-y-1">
            <div>User Agent: {navigator.userAgent.slice(0, 50)}...</div>
            <div>Display Mode: {window.matchMedia('(display-mode: standalone)').matches ? 'Standalone' : 'Browser'}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Simple status indicator for header
export function PWAStatusIndicator() {
  const [isInstalled, setIsInstalled] = useState(false);
  const [manifestOk, setManifestOk] = useState(false);

  useEffect(() => {
    // Check installation status
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = (window.navigator as any).standalone === true;
    setIsInstalled(isStandalone || isInWebAppiOS);

    // Quick manifest check
    fetch('/manifest.json')
      .then(response => response.ok && setManifestOk(true))
      .catch(() => setManifestOk(false));
  }, []);

  if (isInstalled) {
    return (
      <Badge variant="default" className="text-xs">
        <CheckCircle size={12} className="mr-1" />
        Installed
      </Badge>
    );
  }

  // if (manifestOk) {
  //   return (
  //     <Badge variant="outline" className="text-xs">
  //       <Download size={12} className="mr-1" />
  //       Installable
  //     </Badge>
  //   );
  // }

  return null;
}
