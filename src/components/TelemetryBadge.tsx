import React from 'react';
import { Cpu, Cloud, Zap, ShieldCheck, Database, Clock } from 'lucide-react';
import { TelemetryData } from '../types/index';

interface TelemetryBadgeProps {
  telemetry: TelemetryData;
  label?: string;
}

export const TelemetryBadge: React.FC<TelemetryBadgeProps> = ({ telemetry, label }) => {
  const isOnDevice = telemetry.inferenceSource === 'ON_DEVICE';

  return (
    <div
      className={`rounded-xl border p-3 transition-all ${
        isOnDevice
          ? 'bg-teal-50/70 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800 text-teal-900 dark:text-teal-200'
          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex items-center space-x-2">
          {isOnDevice ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-100/80 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-700">
              <Zap className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
              On-Device (Gemini Nano)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-200/80 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700">
              <Cloud className="w-3.5 h-3.5 text-slate-700 dark:text-slate-400" />
              In-Cloud (Gemini)
            </span>
          )}
          {label && (
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">({label})</span>
          )}
        </div>

        <div className="flex items-center gap-2.5 text-xs">
          <span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300">
            <Clock className="w-3 h-3 text-slate-400" />
            <strong className="font-mono tabular-nums text-slate-900 dark:text-white">{telemetry.latencyMs} ms</strong>
          </span>
          <span className="text-slate-300 dark:text-slate-600">•</span>
          <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px] tabular-nums">{telemetry.timestamp}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1.5 border-t border-slate-200/60 dark:border-slate-800">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className={`w-3.5 h-3.5 ${isOnDevice ? 'text-teal-700 dark:text-teal-400' : 'text-slate-600 dark:text-slate-400'}`} />
          <span className="text-slate-500 dark:text-slate-400">Data Boundary:</span>
          <span className={`font-semibold ${isOnDevice ? 'text-teal-800 dark:text-teal-300' : 'text-slate-800 dark:text-slate-200'}`}>
            {telemetry.dataBoundary}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {isOnDevice ? (
            <Cpu className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
          ) : (
            <Database className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
          )}
          <span className="text-slate-500 dark:text-slate-400">Engine:</span>
          <span className="text-slate-800 dark:text-slate-200 font-mono text-[11px] truncate">{telemetry.modelName}</span>
        </div>
      </div>
    </div>
  );
};