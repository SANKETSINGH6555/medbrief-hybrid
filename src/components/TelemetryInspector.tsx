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
  Sparkles,
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
        <div className="bg-surface/95 backdrop-blur-md rounded-2xl border border-border-theme shadow-lg text-xs overflow-hidden transition-all duration-200">
          {/* Collapsed Top Bar */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full px-4 py-2.5 flex items-center justify-between text-text-secondary hover:bg-surface-hover transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 font-bold text-text-primary">
                <Layers className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>Hybrid Telemetry Inspector</span>
              </span>

              {stage1Telemetry && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2.5 py-0.5 rounded-full border border-teal-200 dark:border-teal-800">
                  <Cpu className="w-3 h-3 text-teal-700 dark:text-teal-400" />
                  <span>
                    Privacy Shield:{' '}
                    <strong className="text-text-primary font-mono tabular-nums">
                      {stage1Telemetry.latencyMs}ms
                    </strong>
                  </span>
                </span>
              )}

              {stage2Telemetry && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-indigo-800 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                  <Cloud className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                  <span>
                    Cloud Recovery:{' '}
                    <strong className="text-text-primary font-mono tabular-nums">
                      {stage2Telemetry.latencyMs}ms
                    </strong>
                  </span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-[11px] text-text-muted font-medium">
              <span>{isExpanded ? 'Hide Technical Details' : 'Inspect Audit Log'}</span>
              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </div>
          </button>

          {/* Expanded Drawer Content */}
          {isExpanded && (
            <div className="p-4 bg-surface-subtle border-t border-border-theme grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-[11px]">
              {/* Stage 1 Telemetry */}
              <div className="p-3 bg-surface rounded-xl border border-border-theme space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-text-primary flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" /> Stage 1: Privacy Shield
                  </span>
                  <span className="font-mono text-teal-800 dark:text-teal-300 font-semibold bg-teal-50 dark:bg-teal-950/70 px-1.5 py-0.2 rounded border border-teal-200 dark:border-teal-800">
                    {stage1Telemetry ? stage1Telemetry.inferenceSource : 'IDLE'}
                  </span>
                </div>
                <div className="text-text-muted space-y-0.5 font-mono">
                  <div>Engine: {stage1Telemetry ? stage1Telemetry.modelName : 'Gemini Nano (On-Device)'}</div>
                  <div>Boundary: {stage1Telemetry ? stage1Telemetry.dataBoundary : 'Local Browser RAM (0 Bytes Sent)'}</div>
                  <div>Latency: {stage1Telemetry ? `${stage1Telemetry.latencyMs}ms` : '—'}</div>
                </div>
              </div>

              {/* Stage 2 Telemetry */}
              <div className="p-3 bg-surface rounded-xl border border-border-theme space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-text-primary flex items-center gap-1">
                    <Cloud className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Stage 2: Cloud Recovery
                  </span>
                  <span className="font-mono text-indigo-800 dark:text-indigo-300 font-semibold bg-indigo-50 dark:bg-indigo-950/70 px-1.5 py-0.2 rounded border border-indigo-200 dark:border-indigo-800">
                    {stage2Telemetry ? stage2Telemetry.inferenceSource : 'IDLE'}
                  </span>
                </div>
                <div className="text-text-muted space-y-0.5 font-mono">
                  <div>Engine: {stage2Telemetry ? stage2Telemetry.modelName : 'Gemini 3.5 Flash-Lite'}</div>
                  <div>Boundary: {stage2Telemetry ? stage2Telemetry.dataBoundary : 'Zero-PII Payload Stream'}</div>
                  <div>Latency: {stage2Telemetry ? `${stage2Telemetry.latencyMs}ms` : '—'}</div>
                </div>
              </div>

              {/* Firebase Remote Config Policy */}
              <div className="p-3 bg-surface rounded-xl border border-border-theme space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-text-primary flex items-center gap-1">
                    <Sliders className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" /> Remote Config Policy
                  </span>
                  <span className="font-mono text-text-secondary bg-surface-subtle px-1.5 py-0.2 rounded border border-border-theme">
                    Live
                  </span>
                </div>
                <div className="text-text-muted space-y-0.5">
                  <div>Default: <span className="font-mono font-medium text-text-primary">{remoteConfigDefault}</span></div>
                  <div>Active Mode: <span className="font-mono font-medium text-text-primary capitalize">{routingMode.replace('_', ' ')}</span></div>
                  <div>Fallback: Seamless Cloud Fallback</div>
                </div>
              </div>

              {/* Security & App Check Status */}
              <div className="p-3 bg-surface rounded-xl border border-border-theme space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-text-primary flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Security Perimeter
                  </span>
                  <span className="font-mono text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-800 font-semibold">
                    Attested
                  </span>
                </div>
                <div className="text-text-muted space-y-0.5 font-mono truncate">
                  <div className="truncate">UID: {userUid ? `${userUid.substring(0, 14)}...` : 'Anonymous'}</div>
                  <div>App Check: reCAPTCHA Enterprise</div>
                  <div>Firestore: users/{userUid ? `${userUid.substring(0, 6)}...` : 'anon'}/briefs</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};