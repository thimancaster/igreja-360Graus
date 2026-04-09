import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Smartphone, Download, Share, PlusSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIosInstructions, setShowIosInstructions] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
      return;
    }

    // Check localStorage for dismissed state
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const now = new Date();
      const daysDiff = (now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      // Show again after 3 days (shorter for high conversion)
      if (daysDiff < 3) return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show prompt after a small delay for better "wow" factor
      setTimeout(() => setShowPrompt(true), 2000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Also show prompt for iOS users after a delay
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS && !window.matchMedia('(display-mode: standalone)').matches && !(window.navigator as any).standalone) {
      setTimeout(() => setShowPrompt(true), 3000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    if (isIOS) {
      setShowIosInstructions(true);
      return;
    }

    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
    setShowPrompt(false);
  };

  if (isInstalled || !showPrompt) return null;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  return (
    <>
      <AnimatePresence>
        {showPrompt && !showIosInstructions && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-6 left-4 right-4 z-[100] md:left-auto md:right-8 md:bottom-8 md:w-[400px]"
          >
            <div className="glass-ultra rounded-[2rem] p-6 border border-white/20 shadow-2xl relative overflow-hidden group">
              {/* Animated background glow */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl group-hover:bg-primary/30 transition-all duration-500" />
              
              <button 
                onClick={handleDismiss}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                aria-label="Fecar"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>

              <div className="flex gap-5">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center shrink-0 shadow-lg glow-primary">
                  <Smartphone className="h-10 w-10 text-white" />
                </div>
                
                <div className="flex flex-col justify-center pr-4">
                  <h3 className="font-black text-lg leading-tight tracking-tight">Instalar Igreja 360</h3>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    Acesse como um aplicativo e receba notificações importantes direto no seu celular.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button 
                  onClick={handleInstall}
                  className="flex-1 rounded-2xl h-14 font-black text-base gradient-brand text-white shadow-xl glow-primary hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <Download className="mr-2 h-5 w-5" />
                  Instalar Agora
                </Button>
                <Button 
                  variant="ghost"
                  onClick={handleDismiss}
                  className="rounded-2xl h-14 px-6 text-muted-foreground font-bold hover:bg-black/5 dark:hover:bg-white/5"
                >
                  Depois
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* iOS Unified Guided Install */}
      <AnimatePresence>
        {showIosInstructions && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-ultra rounded-[2.5rem] w-full max-w-sm p-8 border border-white/20 text-center relative overflow-hidden"
            >
              {/* Brand Icon */}
              <div className="h-20 w-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl rotate-3">
                 <img src="/pwa-icons/icon-192x192.png" alt="Igreja 360" className="h-14 w-14" />
              </div>

              <h3 className="text-2xl font-black mb-3">Instalar no iPhone</h3>
              <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
                Adicione o Igreja 360 à sua tela de início para uma experiência completa:
              </p>

              <div className="space-y-6 text-left mb-8">
                <div className="flex items-center gap-4 group">
                  <div className="h-12 w-12 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Share className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-sm font-bold">
                    1. Toque no botão de <span className="text-primary underline decoration-2 underline-offset-4 font-black">Compartilhar</span> na barra do Safari.
                  </p>
                </div>

                <div className="flex items-center gap-4 group">
                  <div className="h-12 w-12 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <PlusSquare className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-sm font-bold">
                    2. Role a lista e toque em <span className="text-primary underline decoration-2 underline-offset-4 font-black">Adicionar à Tela de Início</span>.
                  </p>
                </div>
              </div>

              <Button 
                onClick={() => {
                  setShowIosInstructions(false);
                  setShowPrompt(false);
                  localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
                }}
                className="w-full rounded-2xl h-16 font-black text-xl gradient-brand text-white shadow-xl glow-primary"
              >
                Tudo Pronto!
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

