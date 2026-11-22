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
          ? 'bg-teal-50/70 border-teal-200 text-teal-900'
          : 'bg-slate-50 border-slate-200 text-slate-800'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex items-center space-x-2">
          {isOnDevice ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-100/80 text-teal-800 border border-teal-200">
              <Zap className="w-3.5 h-3.5 text-teal-700" />
              On-Device (Gemini Nano)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-200/80 text-slate-800 border border-slate-300">
              <Cloud className="w-3.5 h-3.5 text-slate-700" />
              In-Cloud (Gemini)
            </span>
          )}
          {label && (
            <span className="text-xs text-slate-500 font-medium">({label})</span>
          )}
        </div>

        <div className="flex items-center gap-2.5 text-xs">
          <span className="inline-flex items-center gap-1 text-slate-700">
            <Clock className="w-3 h-3 text-slate-400" />
            <strong className="font-mono tabular-nums text-slate-900">{telemetry.latencyMs} ms</strong>
          </span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-500 font-mono text-[11px] tabular-nums">{telemetry.timestamp}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1.5 border-t border-slate-200/60">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className={`w-3.5 h-3.5 ${isOnDevice ? 'text-teal-700' : 'text-slate-600'}`} />
          <span className="text-slate-500">Data Boundary:</span>
          <span className={`font-semibold ${isOnDevice ? 'text-teal-800' : 'text-slate-800'}`}>
            {telemetry.dataBoundary}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {isOnDevice ? (
            <Cpu className="w-3.5 h-3.5 text-teal-700" />
          ) : (
            <Database className="w-3.5 h-3.5 text-slate-600" />
          )}
          <span className="text-slate-500">Engine:</span>
          <span className="text-slate-800 font-mono text-[11px] truncate">{telemetry.modelName}</span>
        </div>
      </div>
    </div>
  );
};
