import React from 'react';
import {
  ShieldCheck,
  Cpu,
  Cloud,
  Sparkles,
  History,
  HelpCircle,
  Activity,
  Layers,
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
  savedBriefsCount,
  onOpenHistory,
  onOpenGuide,
}) => {
  const isNanoReady = nanoReadiness.status === 'available';

  return (
    <header className="border-b border-slate-200/80 bg-white/95 backdrop-blur-md sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Brand Mark & Clinical Copilot Title */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-teal-700 flex items-center justify-center text-white shadow-xs">
              <svg
                className="w-5 h-5 fill-none stroke-current stroke-2"
                viewBox="0 0 24 24"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-slate-900 tracking-tight">
                  MedBrief
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200/70">
                  Hybrid Clinical Copilot
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                On-device privacy redaction with cloud-assisted recovery analytics
              </p>
            </div>
          </div>

          {/* Right Status Controls */}
          <div className="flex items-center gap-2.5">
            {/* On-Device AI Status Pill */}
            <button
              type="button"
              onClick={onOpenGuide}
              className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                isNanoReady
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80 hover:bg-emerald-100/60'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
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
                  {isNanoReady ? 'Ready' : 'Checking / Cloud Auto'}
                </strong>
              </span>
            </button>

            {/* Routing Mode Segmented Control */}
            <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 border border-slate-200/90 text-xs">
              <button
                type="button"
                onClick={() => onRoutingModeChange('auto')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  routingMode === 'auto'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Auto Hybrid: Uses on-device Gemini Nano if available, with seamless cloud fallback"
              >
                Auto
              </button>
              <button
                type="button"
                onClick={() => onRoutingModeChange('only_on_device')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  routingMode === 'only_on_device'
                    ? 'bg-white text-teal-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Force On-Device: 100% offline local inference in Chrome"
              >
                On-Device
              </button>
              <button
                type="button"
                onClick={() => onRoutingModeChange('only_in_cloud')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  routingMode === 'only_in_cloud'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Force Cloud: Direct Cloud Gemini inference"
              >
                Cloud
              </button>
            </div>

            {/* Saved Briefs Button */}
            <button
              type="button"
              onClick={onOpenHistory}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-xs transition"
            >
              <History className="w-3.5 h-3.5 text-slate-500" />
              <span>Saved Briefs</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 font-mono text-[11px] font-semibold border border-slate-200">
                {savedBriefsCount}
              </span>
            </button>

            {/* Guide Button */}
            <button
              type="button"
              onClick={onOpenGuide}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
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
