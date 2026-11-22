import React, { useState } from 'react';
import {
  X,
  Cpu,
  CheckCircle,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Info,
} from 'lucide-react';

interface ChromeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChromeGuideModal: React.FC<ChromeGuideModalProps> = ({ isOpen, onClose }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const steps = [
    {
      id: 'step1',
      title: '1. Enable Chrome Prompt API',
      url: 'chrome://flags/#prompt-api-for-gemini-nano',
      setting: 'Enabled',
      desc: 'Enables the browser JavaScript window.ai / LanguageModel API in Chrome 128+ or Chrome Dev/Canary.',
    },
    {
      id: 'step2',
      title: '2. Bypass Performance Requirements (For testing/laptops)',
      url: 'chrome://flags/#optimization-guide-on-device-model',
      setting: 'Enabled BypassPerfRequirement',
      desc: 'Allows Chrome to load and execute Gemini Nano even if battery saver or lower GPU RAM is detected.',
    },
    {
      id: 'step3',
      title: '3. Download & Verify Gemini Nano Model Weights',
      url: 'chrome://components',
      setting: 'Check for update',
      desc: 'Look for "Optimization Guide On Device Model" and click "Check for update". Wait until the component shows "Up-to-date" (approx 1.5GB local weights).',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        <div className="relative inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-950 text-cyan-400 flex items-center justify-center border border-cyan-800">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Chrome Gemini Nano Hackathon Setup Guide
                </h3>
                <p className="text-xs text-slate-400">
                  How judges can verify on-device inference for #BuildHybridAI 2026
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Seamless Hybrid Architecture Callout */}
          <div className="my-4 p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-800/60 text-xs text-cyan-200 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-cyan-300">Seamless Auto-Hybrid Fallback Active:</span>
              <p className="text-slate-300">
                If you are testing this on a browser without Gemini Nano flags enabled, MedBrief Hybrid automatically and smoothly routes requests to Cloud Gemini via Firebase AI Logic. No crashes or manual configuration needed!
              </p>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-3.5 my-4">
            {steps.map((step) => (
              <div
                key={step.id}
                className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 flex flex-col justify-between"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h4 className="text-xs font-bold text-white">{step.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">{step.desc}</p>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-amber-900/50 whitespace-nowrap">
                    {step.setting}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs font-mono text-cyan-300 bg-slate-900/80 px-2.5 py-1.5 rounded-lg">
                  <span className="truncate select-all">{step.url}</span>
                  <button
                    onClick={() => copyToClipboard(step.url, step.id)}
                    className="p-1 rounded text-slate-400 hover:text-white transition shrink-0"
                    title="Copy URL"
                  >
                    {copiedKey === step.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-md transition"
            >
              Understood / Close Guide
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
