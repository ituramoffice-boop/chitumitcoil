import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChitumitLogo } from "./ChitumitLogo";

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onComplete, 600);
    }, 2200);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background"
        >
          {/* Radial glow behind logo */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.15 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="absolute w-80 h-80 rounded-full"
            style={{
              background: "radial-gradient(circle, hsl(43 74% 52% / 0.4) 0%, transparent 70%)",
            }}
          />

          {/* Logo */}
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <ChitumitLogo size={96} className="drop-shadow-[0_0_30px_hsl(43,74%,52%,0.4)]" />
          </motion.div>

          {/* Brand name */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-6 text-3xl font-bold text-gold font-assistant tracking-wide"
          >
            חיתומית
          </motion.h1>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
            className="mt-2 text-sm text-muted-foreground"
          >
            הבינה שמאחורי האישור
          </motion.p>

          {/* Loading bar */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: 120 }}
            transition={{ duration: 1.8, delay: 0.4, ease: "easeInOut" }}
            className="mt-8 h-0.5 rounded-full bg-gradient-to-r from-gold/60 via-gold to-gold/60"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
