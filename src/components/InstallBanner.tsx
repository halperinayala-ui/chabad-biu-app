import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Share } from 'lucide-react';
import './InstallBanner.css';

const InstallBanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if the app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    if (isStandalone) {
      return; // Already installed, don't show banner
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    if (isIosDevice) {
      // iOS doesn't support beforeinstallprompt, so we just show the banner
      setTimeout(() => setShowBanner(true), 3000); // Show after 3 seconds
    } else {
      // Android / Chrome desktop
      const handleBeforeInstallPrompt = (e: any) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setShowBanner(true);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      // It's iOS, they need to do it manually. The banner already tells them how.
      return;
    }

    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    
    setShowBanner(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="install-banner"
      >
        <button className="install-close" onClick={handleDismiss}>
          <X size={18} />
        </button>
        <div className="install-content">
          <div className="install-icon">
            <img src="/app-logo-white.png" alt="Chabad BIU" />
          </div>
          <div className="install-text">
            <h4>הוסף את האפליקציה!</h4>
            {isIOS ? (
              <p>לחץ על <b>שתף <Share size={12} style={{ display: 'inline', margin: '0 2px', verticalAlign: 'middle' }}/></b> למטה ואז בחר <b>"הוסף למסך הבית" <Download size={12} style={{ display: 'inline', margin: '0 2px', verticalAlign: 'middle' }}/></b>.</p>
            ) : (
              <p>שמור אותנו למסך הבית לגישה מהירה!</p>
            )}
          </div>
          {!isIOS && (
            <button className="install-button" onClick={handleInstallClick}>
              התקן
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default InstallBanner;
