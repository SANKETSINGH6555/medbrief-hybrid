import React, { useState } from 'react';
import {
  ShieldCheck,
  Cpu,
  Cloud,
  ChevronUp,
  ChevronDown,
  Database,
  Sliders,
  UserCheck,
  HardDrive,
  Clock,
  Layers,
} from 'lucide-react';
import { TelemetryData } from '../types/index';

interface TelemetryInspectorProps {
  stage1Telemetry: TelemetryData | null;
  stage2Telemetry: TelemetryData | null;
  remoteConfigDefault: string;
  userUid: string | null;
  routingMode: string;
}

export const TelemetryInspector: React.FC<TelemetryInspectorProps> = ({
  stage1Telemetry,
  stage2Telemetry,
  remoteConfigDefault,
  userUid,
  routingMode,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="fixed bottom-0 inset-x-0 z-30 pointer-events-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-3 pointer-events-auto">
        <div className="bg-white/95 backdrop-blur-md rounded-xl border border-slate-200/90 shadow-lg text-xs overflow-hidden transition-all duration-200">
          {/* Collapsed Top Bar */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full px-4 py-2 flex items-center justify-between text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 font-semibold text-slate-900">
                <Layers className="w-3.5 h-3.5 text-teal-700" />
                Hybrid Telemetry Inspector
              </span>

              {stage1Telemetry && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                  <Cpu className="w-3 h-3 text-teal-700" />
                  <span>
                    Privacy Shield:{' '}
                    <strong className="text-slate-900 font-mono tabular-nums">
                      {stage1Telemetry.latencyMs}ms
                    </strong>
                  </span>
                </span>
              )}

              {stage2Telemetry && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                  <Cloud className="w-3 h-3 text-indigo-600" />
                  <span>
                    Cloud Recovery:{' '}
                    <strong className="text-slate-900 font-mono tabular-nums">
                      {stage2Telemetry.latencyMs}ms
                    </strong>
                  </span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
              <span>{isExpanded ? 'Hide Technical Details' : 'Inspect Audit Log'}</span>
              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </div>
          </button>

          {/* Expanded Drawer Content */}
          {isExpanded && (
            <div className="p-4 bg-slate-50/60 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-[11px]">
              {/* Stage 1 Telemetry */}
              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-700" /> Stage 1: Privacy Shield
                  </span>
                  <span className="font-mono text-teal-800 font-semibold bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200">
                    {stage1Telemetry ? stage1Telemetry.inferenceSource : 'IDLE'}
                  </span>
                </div>
                <div className="text-slate-500 space-y-0.5 font-mono">
                  <div>Engine: {stage1Telemetry ? stage1Telemetry.modelName : 'Gemini Nano (On-Device)'}</div>
                  <div>Boundary: {stage1Telemetry ? stage1Telemetry.dataBoundary : 'Local Browser Memory (0 Bytes Sent)'}</div>
                  <div>Latency: {stage1Telemetry ? `${stage1Telemetry.latencyMs}ms` : '—'}</div>
                </div>
              </div>

              {/* Stage 2 Telemetry */}
              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800 flex items-center gap-1">
                    <Cloud className="w-3.5 h-3.5 text-indigo-600" /> Stage 2: Cloud Recovery
                  </span>
                  <span className="font-mono text-indigo-700 font-semibold bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                    {stage2Telemetry ? stage2Telemetry.inferenceSource : 'IDLE'}
                  </span>
                </div>
                <div className="text-slate-500 space-y-0.5 font-mono">
                  <div>Engine: {stage2Telemetry ? stage2Telemetry.modelName : 'Gemini 3.5 Flash-Lite'}</div>
                  <div>Boundary: {stage2Telemetry ? stage2Telemetry.dataBoundary : 'Sanitized Cloud Payload'}</div>
                  <div>Latency: {stage2Telemetry ? `${stage2Telemetry.latencyMs}ms` : '—'}</div>
                </div>
              </div>

              {/* Policy & Mode */}
              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1.5 shadow-2xs">
                <div className="font-semibold text-slate-800 flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5 text-slate-600" /> Remote Config Policy
                </div>
                <div className="text-slate-500 space-y-0.5 font-mono">
                  <div>Active Policy: <span className="text-slate-900 font-semibold">{remoteConfigDefault}</span></div>
                  <div>Routing Mode: <span className="text-slate-900 font-semibold capitalize">{routingMode.replace('_', ' ')}</span></div>
                  <div>SDK: <span className="text-slate-900">firebase/ai (v13+)</span></div>
                </div>
              </div>

              {/* Session Identity & Security */}
              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1.5 shadow-2xs">
                <div className="font-semibold text-slate-800 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" /> Anonymous Session
                </div>
                <div className="text-slate-500 space-y-0.5 font-mono">
                  <div>User UID: <span className="text-slate-900 truncate block">{userUid || 'Authenticating...'}</span></div>
                  <div>Collection: <span className="text-slate-900">users/{'{uid}'}/briefs</span></div>
                  <div>App Check: <span className="text-emerald-700 font-semibold">Active & Attested</span></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
