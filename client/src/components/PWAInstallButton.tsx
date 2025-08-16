import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, X, Smartphone, Monitor, Chrome, Globe } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showManualInstructions, setShowManualInstructions] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = (window.navigator as any).standalone === true;
    
    if (isStandalone || isInWebAppiOS) {
      setIsInstalled(true);
      return;
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('beforeinstallprompt event fired');
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallPrompt(true);
    };

    // Listen for successful installation
    const handleAppInstalled = () => {
      console.log('App installed successfully');
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Show manual install option after 5 seconds if no prompt
    const timer = setTimeout(() => {
      if (!deferredPrompt && !isInstalled) {
        setShowInstallPrompt(true);
      }
    }, 5000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      clearTimeout(timer);
    };
  }, [deferredPrompt, isInstalled]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
          console.log('User accepted the install prompt');
        } else {
          console.log('User dismissed the install prompt');
        }
        
        setDeferredPrompt(null);
        setShowInstallPrompt(false);
      } catch (error) {
        console.error('Error during installation:', error);
      }
    } else {
      // Show manual instructions
      setShowManualInstructions(true);
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  const getBrowserInstructions = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
      return {
        browser: 'Chrome',
        icon: <Chrome size={20} />,
        steps: [
          'Click the three dots menu (⋮) in the top right',
          'Select "Install NutriSuppliers..."',
          'Click "Install" in the popup'
        ]
      };
    } else if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
      return {
        browser: 'Safari',
        icon: <Globe size={20} />,
        steps: [
          'Tap the Share button (□↗) at the bottom',
          'Scroll down and tap "Add to Home Screen"',
          'Tap "Add" to confirm'
        ]
      };
    } else if (userAgent.includes('edg')) {
      return {
        browser: 'Edge',
        icon: <Monitor size={20} />,
        steps: [
          'Click the three dots menu (...) in the top right',
          'Select "Apps" → "Install this site as an app"',
          'Click "Install" in the popup'
        ]
      };
    } else {
      return {
        browser: 'Browser',
        icon: <Smartphone size={20} />,
        steps: [
          'Look for an "Install" or "Add to Home Screen" option in your browser menu',
          'Follow the prompts to install the app',
          'The app will appear on your home screen'
        ]
      };
    }
  };

  // Don't show if already installed
  if (isInstalled) {
    return null;
  }

  // Check if user dismissed recently (within 24 hours)
  const dismissedTime = localStorage.getItem('pwa-install-dismissed');
  if (dismissedTime && Date.now() - parseInt(dismissedTime) < 24 * 60 * 60 * 1000) {
    return null;
  }

  if (!showInstallPrompt) {
    return null;
  }

  const instructions = getBrowserInstructions();

  return (
    <>
      {/* Install Prompt */}
      <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
        <Card className="shadow-lg border-primary/20 bg-gradient-to-r from-primary/5 to-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <Download className="text-white" size={16} />
                </div>
                <h3 className="font-semibold text-gray-900">Install NutriSuppliers</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="h-8 w-8 p-0"
              >
                <X size={16} />
              </Button>
            </div>
            
            <p className="text-sm text-gray-600 mb-3">
              Get the app for quick access and offline functionality.
            </p>
            
            <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
              <div className="flex items-center space-x-1">
                <Smartphone size={14} />
                <span>Works offline</span>
              </div>
              <div className="flex items-center space-x-1">
                <Monitor size={14} />
                <span>Fast loading</span>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button
                onClick={handleInstallClick}
                className="flex-1"
                size="sm"
              >
                <Download size={16} className="mr-2" />
                {deferredPrompt ? 'Install App' : 'How to Install'}
              </Button>
              <Button
                variant="outline"
                onClick={handleDismiss}
                size="sm"
              >
                Later
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Manual Instructions Modal */}
      {showManualInstructions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  {instructions.icon}
                  <h3 className="text-lg font-semibold">Install on {instructions.browser}</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowManualInstructions(false)}
                  className="h-8 w-8 p-0"
                >
                  <X size={16} />
                </Button>
              </div>
              
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Follow these steps to install NutriSuppliers as an app:
                </p>
                
                <ol className="space-y-2">
                  {instructions.steps.map((step, index) => (
                    <li key={index} className="flex items-start space-x-2 text-sm">
                      <span className="flex-shrink-0 w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </span>
                      <span className="text-gray-700">{step}</span>
                    </li>
                  ))}
                </ol>
                
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-800">
                    💡 <strong>Tip:</strong> Once installed, the app will work offline and load faster!
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end mt-6">
                <Button
                  onClick={() => setShowManualInstructions(false)}
                  variant="outline"
                >
                  Got it
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

// Simple install button for header/navbar
export function PWAInstallButtonSimple() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = (window.navigator as any).standalone === true;
    
    if (isStandalone || isInWebAppiOS) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    }
  };

  if (isInstalled || !deferredPrompt) {
    return null;
  }

  return (
    <Button
      onClick={handleInstall}
      variant="outline"
      size="sm"
      className="hidden md:flex"
    >
      <Download size={16} className="mr-2" />
      Install App
    </Button>
  );
}
