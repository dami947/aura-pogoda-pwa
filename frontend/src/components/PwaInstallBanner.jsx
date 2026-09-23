import { useState, useEffect } from "react";
import { Download, X, Zap, WifiOff, Smartphone } from "lucide-react";

export const PwaInstallBanner = ({ prompt, onInstall, onDismiss }) => {
  if (!prompt) return null;
  return (
    <div
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-[92vw] max-w-md rounded-3xl backdrop-blur-2xl bg-slate-900/85 border border-white/20 p-5 shadow-2xl animate-in"
      data-testid="pwa-install-banner"
    >
      <button onClick={onDismiss} className="absolute top-3 right-3 text-white/50 hover:text-white" data-testid="pwa-dismiss-btn">
        <X className="w-4 h-4" />
      </button>
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2.5 rounded-2xl bg-sky-500/20">
          <Smartphone className="w-6 h-6 text-sky-300" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-white">Zainstaluj aplikację</h3>
          <p className="text-xs text-white/60">Dodaj Aura Pogoda do ekranu głównego</p>
        </div>
      </div>
      <div className="flex gap-3 text-[11px] text-white/70 mb-4">
        <span className="flex items-center gap-1"><WifiOff className="w-3 h-3" /> Tryb offline</span>
        <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> Szybkie ładowanie</span>
        <span className="flex items-center gap-1"><Smartphone className="w-3 h-3" /> Ikona na pulpicie</span>
      </div>
      <button
        onClick={onInstall}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full bg-sky-500 hover:bg-sky-400 text-white font-medium text-sm transition-colors active:scale-95"
        data-testid="pwa-install-button"
      >
        <Download className="w-4 h-4" /> Zainstaluj PWA
      </button>
    </div>
  );
};
