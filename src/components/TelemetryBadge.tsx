import React from 'react';
import { Cpu, Cloud, Zap, ShieldCheck, Database, HardDrive, Clock } from 'lucide-react';
import { TelemetryData } from '../types';

interface TelemetryBadgeProps {
  telemetry: TelemetryData;
  label?: string;
}

export const TelemetryBadge: React.FC<TelemetryBadgeProps> = ({ telemetry, label }) => {
  const isOnDevice = telemetry.inferenceSource === 'ON_DEVICE';

  return (
    <div className={`rounded-xl border p-3.5 transition-all shadow-sm ${
      isOnDevice
        ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
        : 'bg-indigo-950/20 border-indigo-500/30 text-indigo-300'
    }`}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex items-center space-x-2">
          {isOnDevice ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              ⚡ ON_DEVICE (Gemini Nano)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
              <Cloud className="w-3.5 h-3.5 text-indigo-400" />
              ☁️ IN_CLOUD (Gemini 2.5 Flash)
            </span>
          )}
          {label && (
            <span className="text-xs text-slate-400 font-medium">({label})</span>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1 text-slate-300">
            <Clock className="w-3 h-3 text-slate-400" />
            <strong className="font-mono text-white">{telemetry.latencyMs} ms</strong>
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400 font-mono text-[11px]">{telemetry.timestamp}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-700/50">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className={`w-3.5 h-3.5 ${isOnDevice ? 'text-emerald-400' : 'text-indigo-400'}`} />
          <span className="text-slate-400">Data Boundary:</span>
          <span className={`font-medium ${isOnDevice ? 'text-emerald-300' : 'text-indigo-200'}`}>
            {telemetry.dataBoundary}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {isOnDevice ? (
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Database className="w-3.5 h-3.5 text-indigo-400" />
          )}
          <span className="text-slate-400">Engine:</span>
          <span className="text-slate-200 font-mono text-[11px] truncate">{telemetry.modelName}</span>
        </div>
      </div>
    </div>
  );
};
