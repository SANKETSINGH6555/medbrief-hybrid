import React, { useState } from 'react';
import {
  X,
  Cpu,
  Check,
  Copy,
  Sparkles,
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
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
          onClick={onClose}
        />

        <div className="relative inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300 flex items-center justify-center border border-teal-100 dark:border-teal-800">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Chrome Gemini Nano Verification Guide
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  How judges can verify on-device inference for #BuildHybridAI 2026
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Seamless Hybrid Architecture Callout */}
          <div className="my-4 p-3.5 rounded-xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-900/60 text-xs text-teal-900 dark:text-teal-200 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-teal-800 dark:text-teal-300">Seamless Auto-Hybrid Fallback Active:</span>
              <p className="text-slate-600 dark:text-slate-300">
                If you are testing this on a browser without Gemini Nano flags enabled, MedBrief Hybrid automatically routes requests to Cloud Gemini via Firebase AI Logic. No crashes or manual configuration needed.
              </p>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-3.5 my-4">
            {steps.map((step) => (
              <div
                key={step.id}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-xs font-semibold text-slate-900 dark:text-white">
                    {step.title}
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 font-semibold">
                    {step.setting}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-2.5">{step.desc}</p>
                <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <code className="text-xs font-mono text-slate-700 dark:text-slate-300 truncate select-all">
                    {step.url}
                  </code>
                  <button
                    onClick={() => copyToClipboard(step.url, step.id)}
                    className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition shrink-0 cursor-pointer"
                  >
                    {copiedKey === step.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-emerald-700 dark:text-emerald-300">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy URL</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Footer note */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Restart Chrome after changing flags for changes to take effect.
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-teal-600 text-white text-xs font-semibold hover:bg-slate-800 dark:hover:bg-teal-500 transition cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};