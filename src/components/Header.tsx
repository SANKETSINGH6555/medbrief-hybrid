import React from 'react';
import {
  ShieldCheck,
  Cpu,
  Cloud,
  Sparkles,
  History,
  HelpCircle,
  Sun,
  Moon,
} from 'lucide-react';
import { RoutingMode } from '../types/index';
import { NanoReadiness } from '../lib/firebase';

interface HeaderProps {
  routingMode: RoutingMode;
  onRoutingModeChange: (mode: RoutingMode) => void;
  nanoReadiness: NanoReadiness;
  remoteConfigDefault: string;
  userUid: string | null;
  savedBriefsCount: number;
  onOpenHistory: () => void;
  onOpenGuide: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  routingMode,
  onRoutingModeChange,
  nanoReadiness,
  savedBriefsCount,
  onOpenHistory,
  onOpenGuide,
  theme,
  onToggleTheme,
}) => {
  const isNanoReady = nanoReadiness.status === 'available';

  return (
    <header className="border-b border-border-theme bg-surface/90 backdrop-blur-md sticky top-0 z-40 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex items-center justify-between gap-4">
          {/* Brand Mark & Clinical Copilot Title */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-teal-700 dark:bg-teal-600 flex items-center justify-center text-white shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-text-primary">
                  MedBrief
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 tracking-wide">
                  Hybrid AI Copilot
                </span>
              </div>
              <p className="text-[11px] text-text-muted font-medium hidden sm:block">
                On-device privacy redaction with cloud-assisted recovery analytics
              </p>
            </div>
          </div>

          {/* Right Status Controls */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* On-Device AI Status Pill */}
            <button
              type="button"
              onClick={onOpenGuide}
              className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                isNanoReady
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100/60'
                  : 'bg-surface-subtle text-text-secondary border-border-theme hover:bg-surface-hover'
              }`}
              title={nanoReadiness.message}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isNanoReady ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                }`}
              />
              <span>
                On-Device AI:{' '}
                <strong className="font-semibold">
                  {isNanoReady ? 'Ready' : 'Checking / Auto'}
                </strong>
              </span>
            </button>

            {/* Routing Mode Segmented Control */}
            <div className="inline-flex items-center p-0.5 rounded-xl bg-surface-subtle border border-border-theme text-xs">
              <button
                type="button"
                onClick={() => onRoutingModeChange('auto')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  routingMode === 'auto'
                    ? 'bg-surface text-text-primary shadow-xs font-semibold'
                    : 'text-text-muted hover:text-text-primary'
                }`}
                title="Auto Hybrid: Uses on-device Gemini Nano if available, with seamless cloud fallback"
              >
                <Sparkles className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                <span>Auto</span>
              </button>
              <button
                type="button"
                onClick={() => onRoutingModeChange('only_on_device')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  routingMode === 'only_on_device'
                    ? 'bg-surface text-teal-800 dark:text-teal-300 shadow-xs font-semibold'
                    : 'text-text-muted hover:text-text-primary'
                }`}
                title="Force On-Device: 100% offline local inference in Chrome"
              >
                <Cpu className="w-3 h-3" />
                <span>On-Device</span>
              </button>
              <button
                type="button"
                onClick={() => onRoutingModeChange('only_in_cloud')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  routingMode === 'only_in_cloud'
                    ? 'bg-surface text-indigo-700 dark:text-indigo-300 shadow-xs font-semibold'
                    : 'text-text-muted hover:text-text-primary'
                }`}
                title="Force Cloud: Direct Cloud Gemini inference"
              >
                <Cloud className="w-3 h-3" />
                <span>Cloud</span>
              </button>
            </div>

            {/* Saved Briefs Button */}
            <button
              type="button"
              onClick={onOpenHistory}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-surface border border-border-theme text-text-secondary hover:text-text-primary hover:bg-surface-hover shadow-xs transition cursor-pointer"
            >
              <History className="w-3.5 h-3.5 text-text-muted" />
              <span className="hidden sm:inline">Saved Briefs</span>
              <span className="sm:ml-1 px-1.5 py-0.2 rounded-full bg-surface-subtle text-text-secondary font-mono text-[11px] font-semibold border border-border-theme">
                {savedBriefsCount}
              </span>
            </button>

            {/* Theme Toggle Button (Light / Dark) */}
            <button
              type="button"
              onClick={onToggleTheme}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-text-secondary bg-surface border border-border-theme hover:text-text-primary hover:bg-surface-hover shadow-xs transition cursor-pointer"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline text-[11px]">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-slate-600" />
                  <span className="hidden sm:inline text-[11px]">Dark</span>
                </>
              )}
            </button>

            {/* Guide Button */}
            <button
              type="button"
              onClick={onOpenGuide}
              className="p-1.5 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-hover transition cursor-pointer"
              title="Chrome Gemini Nano Setup Guide for Judges"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};