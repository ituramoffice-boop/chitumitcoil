import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChitumitLogo } from "@/components/ChitumitLogo";

export function PWAInstallPrompt() {
  const isMobile = useIsMobile();
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const dismissed = sessionStorage.getItem("pwa-dismissed");
    if (dismissed) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    
    // For iOS (no beforeinstallprompt), show after 5s on mobile
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    if (isMobile && isIOS && !isStandalone && !dismissed) {
      const timer = setTimeout(() => setShow(true), 5000);
      return () => { clearTimeout(timer); window.removeEventListener("beforeinstallprompt", handler); };
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [isMobile]);

  if (!show || !isMobile) return null;

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
    }
    setShow(false);
    sessionStorage.setItem("pwa-dismissed", "1");
  };

  const dismiss = () => {
    setShow(false);
    sessionStorage.setItem("pwa-dismissed", "1");
  };

  return (
    <div className="fixed bottom-20 inset-x-4 z-50 glass-card p-4 rounded-2xl border-gold/30 animate-fade-in safe-bottom">
      <button onClick={dismiss} className="absolute top-2 left-2 text-muted-foreground">
        <X className="w-4 h-4" />
      </button>
      <div className="flex items-center gap-3">
        <ChitumitLogo size={36} />
        <div className="flex-1">
          <p className="font-bold text-sm text-foreground">הורד את חיתומית</p>
          <p className="text-xs text-muted-foreground">גישה מהירה מהמסך הראשי</p>
        </div>
        <Button size="sm" onClick={handleInstall} className="bg-gold text-gold-foreground hover:bg-gold/90 gap-1">
          <Download className="w-3.5 h-3.5" />
          התקן
        </Button>
      </div>
    </div>
  );
}
