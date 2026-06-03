import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Download, X, Share, Plus } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showBottomSheet, setShowBottomSheet] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Show bottom sheet for iOS or unsupported browsers
      setShowBottomSheet(true);
      return;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        setIsInstallable(false);
      }
      setDeferredPrompt(null);
    } catch (error) {
      console.error('Install prompt error:', error);
    }
  };

  // Don't show if already installed
  if (isInstalled) {
    return null;
  }

  return (
    <>
      <motion.button
        onClick={handleInstallClick}
        className="items-center flex justify-center gap-2 h-[44px] sm:h-[54px] px-3 sm:px-5 text-[12px] sm:text-[14px] font-semibold border-2 border-gray-300 bg-white hover:bg-gray-50 text-gray-700 transition-colors rounded-lg"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title="Install App"
      >
        <Download className="w-4 h-4 sm:w-5 sm:h-5" />
        <span className="hidden sm:block uppercase">Install</span>
      </motion.button>

      {/* iOS Install Instructions Bottom Sheet - rendered in portal to escape parent transforms */}
      {createPortal(
        <AnimatePresence>
          {showBottomSheet && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowBottomSheet(false)}
                className="fixed inset-0 bg-black/50 z-[9999]"
              />

              {/* Bottom Sheet */}
              <motion.div
                initial={{ transform: 'translateY(100%)' }}
                animate={{ transform: 'translateY(0%)' }}
                exit={{ transform: 'translateY(100%)' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-[10000] max-h-[80vh] overflow-hidden pb-[env(safe-area-inset-bottom)]"
              >
                {/* Handle bar */}
                <div className="flex justify-center pt-3 pb-2">
                  <div className="w-10 h-1 bg-gray-300 rounded-full" />
                </div>

                {/* Close button */}
                <button
                  onClick={() => setShowBottomSheet(false)}
                  className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>

                {/* Content */}
                <div className="px-6 pb-8 pt-2 overflow-y-auto max-h-[calc(80vh-20px)]">
                  {/* Header */}
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[var(--bx-accent)] to-purple-600 rounded-2xl flex items-center justify-center">
                      <Download className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Install Lowkey Gem</h3>
                    <p className="text-gray-500 text-sm">Add to your home screen for the best experience</p>
                  </div>

                  {/* Steps */}
                  <div className="space-y-4">
                    <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                      <div className="flex-shrink-0 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                        <span className="text-lg font-bold accent-text">1</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 mb-1">Tap the Share button</p>
                        <div className="flex items-center gap-2 text-gray-500 text-sm">
                          <Share className="w-4 h-4" />
                          <span>Located at the bottom of Safari</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                      <div className="flex-shrink-0 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                        <span className="text-lg font-bold accent-text">2</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 mb-1">Scroll and tap "Add to Home Screen"</p>
                        <div className="flex items-center gap-2 text-gray-500 text-sm">
                          <Plus className="w-4 h-4" />
                          <span>You may need to scroll down</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                      <div className="flex-shrink-0 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                        <span className="text-lg font-bold accent-text">3</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 mb-1">Tap "Add" to confirm</p>
                        <p className="text-gray-500 text-sm">The app will appear on your home screen</p>
                      </div>
                    </div>
                  </div>

                  {/* Dismiss button */}
                  <button
                    onClick={() => setShowBottomSheet(false)}
                    className="w-full mt-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
                  >
                    Got it
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
