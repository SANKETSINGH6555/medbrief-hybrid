import React from 'react';
import {
  ShieldAlert,
  Cpu,
  Cloud,
  Sliders,
  History,
  HelpCircle,
  Wifi,
  Sparkles,
  Layers,
  UserCheck,
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
}

export const Header: React.FC<HeaderProps> = ({
  routingMode,
  onRoutingModeChange,
  nanoReadiness,
  remoteConfigDefault,
  userUid,
  savedBriefsCount,
  onOpenHistory,
  onOpenGuide,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* Brand & Track Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 ring-1 ring-white/20">
                <ShieldAlert className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                    MedBrief <span className="text-cyan-400">Hybrid</span>
                  </h1>
                  <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/80">
                    #BuildHybridAI 2026
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  On-Device Privacy Shield (Gemini Nano) & Cloud Recovery Analyzer (Cloud Gemini 3.8 Flash)
                </p>
              </div>
            </div>

            {/* Mobile Actions */}
            <div className="flex items-center gap-1.5 lg:hidden">
              <button
                onClick={onOpenGuide}
                title="Chrome Gemini Nano Setup Guide"
                className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
              <button
                onClick={onOpenHistory}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-200"
              >
                <History className="w-3.5 h-3.5 text-cyan-400" />
                <span>{savedBriefsCount}</span>
              </button>
            </div>
          </div>

          {/* Badges & Mode Switch */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Chrome Nano Readiness Badge */}
            <div
              onClick={onOpenGuide}
              className={`cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                nanoReadiness.status === 'available'
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/40'
                  : nanoReadiness.status === 'downloading'
                  ? 'bg-amber-950/40 border-amber-500/40 text-amber-300 hover:bg-amber-900/40'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
              title={nanoReadiness.message}
            >
              <Cpu className={`w-3.5 h-3.5 ${
                nanoReadiness.status === 'available' ? 'text-emerald-400' : 'text-cyan-400'
              }`} />
              <span>
                Nano:{' '}
                <strong className="font-semibold capitalize">
                  {nanoReadiness.status === 'available' ? 'Available' : nanoReadiness.status}
                </strong>
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            </div>

            {/* Remote Config Status Badge */}
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 border border-slate-700 text-slate-300"
              title="Remote Config policy fetched from Firebase"
            >
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span>Policy:</span>
              <span className="font-mono text-indigo-300 text-[11px]">{remoteConfigDefault}</span>
            </div>

            {/* Routing Mode Segmented Switch */}
            <div className="inline-flex items-center p-1 rounded-xl bg-slate-950/90 border border-slate-800">
              <button
                type="button"
                onClick={() => onRoutingModeChange('auto')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  routingMode === 'auto'
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Auto Hybrid: Uses on-device Gemini Nano if available, seamless cloud fallback"
              >
                <Sparkles className="w-3 h-3" />
                <span>Auto Hybrid</span>
              </button>

              <button
                type="button"
                onClick={() => onRoutingModeChange('only_on_device')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  routingMode === 'only_on_device'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Force On-Device: 100% offline inference inside Chrome"
              >
                <Cpu className="w-3 h-3" />
                <span>Force On-Device</span>
              </button>

              <button
                type="button"
                onClick={() => onRoutingModeChange('only_in_cloud')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  routingMode === 'only_in_cloud'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Force Cloud: Direct Gemini Cloud AI"
              >
                <Cloud className="w-3 h-3" />
                <span>Force Cloud</span>
              </button>
            </div>

            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center gap-2">
              <button
                onClick={onOpenGuide}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
                title="Chrome Gemini Nano Setup Guide"
              >
                <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                <span>Judge Guide</span>
              </button>

              <button
                onClick={onOpenHistory}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-950/70 border border-cyan-800/80 text-cyan-300 hover:bg-cyan-900/80 transition"
              >
                <History className="w-3.5 h-3.5 text-cyan-400" />
                <span>Saved Briefs</span>
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-cyan-800 text-white text-[10px] font-bold">
                  {savedBriefsCount}
                </span>
              </button>

              {userUid && (
                <div
                  className="hidden xl:flex items-center gap-1 text-[11px] text-slate-400 font-mono px-2 py-1 rounded bg-slate-950/60 border border-slate-800"
                  title={`Firebase Anonymous Auth UID: ${userUid}`}
                >
                  <UserCheck className="w-3 h-3 text-emerald-400" />
                  <span>{userUid.substring(0, 8)}...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
