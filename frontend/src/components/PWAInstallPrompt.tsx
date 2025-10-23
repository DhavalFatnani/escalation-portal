import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAInstallPromptProps {
  collapsed?: boolean;
}

const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({ collapsed = false }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if user has previously dismissed or installed
    const installDismissed = localStorage.getItem('pwa-install-dismissed');
    if (installDismissed === 'true') {
      return;
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    // Listen for successful installation
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      localStorage.setItem('pwa-install-dismissed', 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user's response
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  // Don't show anything if installed or dismissed
  if (isInstalled || !showPrompt || !deferredPrompt) {
    return null;
  }

  if (collapsed) {
    return (
      <button
        onClick={handleInstallClick}
        className="flex justify-center p-2 hover:bg-indigo-600 rounded-lg transition-colors group"
        title="Install App"
      >
        <Download className="w-6 h-6 text-indigo-400 group-hover:text-white" />
      </button>
    );
  }

  return (
    <div className="px-3 py-3 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg relative">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-slate-400 hover:text-slate-600"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
      
      <div className="flex items-center space-x-2 mb-2">
        <Download className="w-5 h-5 text-indigo-600" />
        <h3 className="text-sm font-semibold text-slate-800">Install App</h3>
      </div>
      
      <p className="text-xs text-slate-600 mb-3">
        Install Escalation Portal for quick access and offline support
      </p>
      
      <button
        onClick={handleInstallClick}
        className="w-full px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center space-x-2"
      >
        <Download className="w-4 h-4" />
        <span>Install Now</span>
      </button>
    </div>
  );
};

export default PWAInstallPrompt;

