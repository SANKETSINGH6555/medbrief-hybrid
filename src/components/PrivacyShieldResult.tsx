import React, { useState } from 'react';
import {
  ShieldCheck,
  FileCheck2,
  Lock,
  Copy,
  Check,
  ArrowRight,
  Eye,
  FileText,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { Stage1Result } from '../types/index';
import { TelemetryBadge } from './TelemetryBadge';

interface PrivacyShieldResultProps {
  result: Stage1Result;
  onProceedToCloudStage: () => void;
  isCloudLoading: boolean;
}

export const PrivacyShieldResult: React.FC<PrivacyShieldResultProps> = ({
  result,
  onProceedToCloudStage,
  isCloudLoading,
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'raw_sanitized'>('summary');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const textToCopy =
      activeTab === 'summary' ? result.simplifiedSummary : result.sanitizedText;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
      {/* Header Bar */}
      <div className="p-5 border-b border-slate-800 bg-slate-950/60">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Stage 1 Complete
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                  100% Client-Side Privacy
                </span>
              </div>
              <h3 className="text-base font-bold text-white">
                On-Device Privacy Shield & Plain-English Translation
              </h3>
            </div>
          </div>

          {/* Action Tabs & Copy */}
          <div className="flex items-center gap-2">
            <div className="inline-flex p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('summary')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
                  activeTab === 'summary'
                    ? 'bg-slate-800 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Patient Summary</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('raw_sanitized')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
                  activeTab === 'raw_sanitized'
                    ? 'bg-slate-800 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Sanitized Note</span>
              </button>
            </div>

            <button
              onClick={handleCopy}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
              title="Copy to clipboard"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Live Hybrid Telemetry Banner */}
        <TelemetryBadge telemetry={result.telemetry} label="Privacy Shield Output" />
      </div>

      {/* PII Redaction Chips */}
      <div className="px-5 py-3 bg-slate-950/40 border-b border-slate-800/80 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-slate-400 flex items-center gap-1 font-medium">
          <Lock className="w-3 h-3 text-emerald-400" /> Redacted Entities:
        </span>
        {result.detectedPiiTypes.length > 0 ? (
          result.detectedPiiTypes.map((type, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-[11px] font-mono"
            >
              <Check className="w-3 h-3 text-emerald-400" />
              {type}
            </span>
          ))
        ) : (
          <span className="text-slate-500 italic">No standard PII detected</span>
        )}
      </div>

      {/* Content Body */}
      <div className="p-5 max-h-[420px] overflow-y-auto">
        {activeTab === 'summary' ? (
          <div className="prose prose-invert prose-sm max-w-none text-slate-200 space-y-3 leading-relaxed whitespace-pre-wrap font-sans">
            {result.simplifiedSummary}
          </div>
        ) : (
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-[360px] overflow-y-auto">
            {result.sanitizedText}
          </div>
        )}
      </div>

      {/* Cloud Stage Call-to-Action Footer */}
      <div className="p-4 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Data Boundary Verified: Only sanitized text with <strong className="text-emerald-300">zero patient identifiers</strong> will be routed to Cloud Gemini.
          </span>
        </div>

        <button
          type="button"
          onClick={onProceedToCloudStage}
          disabled={isCloudLoading}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 cursor-pointer shrink-0"
        >
          {isCloudLoading ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Analyzing in Cloud...</span>
            </>
          ) : (
            <>
              <span>Generate Cloud Recovery Plan</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
