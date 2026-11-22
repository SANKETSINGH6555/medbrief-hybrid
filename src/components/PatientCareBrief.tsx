import React, { useState } from 'react';
import {
  ShieldCheck,
  FileText,
  Lock,
  Copy,
  Check,
  Download,
  BookmarkCheck,
  CheckCircle2,
  CalendarDays,
  AlertTriangle,
  HelpCircle,
  ArrowRight,
  Sparkles,
  Zap,
  Cloud,
  CheckCircle,
  Clock,
  ShieldAlert,
  Activity,
} from 'lucide-react';
import { Stage1Result, Stage2Result } from '../types';

interface PatientCareBriefProps {
  title: string;
  stage1Result: Stage1Result | null;
  stage2Result: Stage2Result | null;
  isPrivacyShieldLoading: boolean;
  isCloudLoading: boolean;
  streamingRecoveryText: string;
  onProceedToCloudStage: () => void;
  onSaveBrief: () => void;
  isSaving: boolean;
  hasSaved: boolean;
  onExportMarkdown: () => void;
  onCopySummary: () => void;
}

export const PatientCareBrief: React.FC<PatientCareBriefProps> = ({
  title,
  stage1Result,
  stage2Result,
  isPrivacyShieldLoading,
  isCloudLoading,
  streamingRecoveryText,
  onProceedToCloudStage,
  onSaveBrief,
  isSaving,
  hasSaved,
  onExportMarkdown,
  onCopySummary,
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'recovery' | 'triage'>('summary');
  const [summarySubTab, setSummarySubTab] = useState<'patient' | 'sanitized'>('patient');
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);

  const toggleTask = (taskId: string) => {
    setCompletedTasks((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  const handleCopy = () => {
    onCopySummary();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper to render redacted tokens as clean pills in summary
  const renderFormattedSummary = (text: string) => {
    const parts = text.split(/(\[REDACTED_[A-Z_]+\])/g);
    return parts.map((part, index) => {
      if (part.startsWith('[REDACTED_')) {
        return (
          <span
            key={index}
            className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-mono font-medium bg-teal-50 dark:bg-teal-950/70 text-teal-800 dark:text-teal-300 border border-teal-200/80 dark:border-teal-800/80 mx-0.5"
          >
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  // Task calculation
  const totalTasks = stage2Result
    ? stage2Result.checklist.reduce((acc, day) => acc + day.tasks.length, 0)
    : 0;
  const doneCount = Object.values(completedTasks).filter(Boolean).length;
  const progressPercent = totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0;

  // Empty state when no Stage 1 has run yet
  if (!stage1Result && !isPrivacyShieldLoading) {
    return (
      <div className="bg-surface rounded-2xl border border-border-theme p-8 shadow-xs flex flex-col justify-between min-h-[580px] transition-colors duration-200">
        <div>
          {/* Top Banner */}
          <div className="flex items-center justify-between pb-5 border-b border-border-theme">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 flex items-center justify-center border border-teal-200/80 dark:border-teal-800 shadow-2xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-primary">
                  Patient Care Brief Intelligence
                </h3>
                <p className="text-xs text-text-muted">
                  Dual-Engine Hybrid AI: On-Device Chrome Gemini Nano + Cloud Gemini
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-surface-subtle text-text-secondary font-medium border border-border-theme">
              Awaiting Input
            </span>
          </div>

          {/* Interactive Pipeline Architecture Diagram */}
          <div className="my-8 space-y-4">
            <div className="text-center max-w-md mx-auto space-y-1 mb-6">
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                How MedBrief Protects Patient Health Data
              </span>
              <h4 className="text-base font-extrabold text-text-primary">
                Zero-Leakage Hybrid Architecture
              </h4>
              <p className="text-xs text-text-muted leading-relaxed">
                Raw clinical notes with sensitive names and MRNs never touch external servers unredacted.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Stage 1 Box */}
              <div className="p-4 rounded-xl bg-teal-50/50 dark:bg-teal-950/30 border border-teal-200/80 dark:border-teal-900/60 relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-700">
                    Stage 1 · Local Edge
                  </span>
                  <Zap className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                </div>
                <h5 className="text-xs font-bold text-text-primary mb-1">
                  On-Device Privacy Shield
                </h5>
                <p className="text-[11px] text-text-secondary leading-relaxed mb-3">
                  Chrome Gemini Nano scrubs patient names, dates, and MRNs in browser RAM with 0 bytes transmitted.
                </p>
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-teal-800 dark:text-teal-300 font-medium">
                  <Lock className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                  <span>Output: Verbatim Sanitized Record</span>
                </div>
              </div>

              {/* Stage 2 Box */}
              <div className="p-4 rounded-xl bg-surface-subtle border border-border-theme relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    Stage 2 · Secure Cloud
                  </span>
                  <Cloud className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h5 className="text-xs font-bold text-text-primary mb-1">
                  Cloud Recovery Intelligence
                </h5>
                <p className="text-[11px] text-text-secondary leading-relaxed mb-3">
                  Streaming Cloud Gemini synthesizes interactive 7-day checklists and classifies red-flag warning signs.
                </p>
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-indigo-800 dark:text-indigo-300 font-medium">
                  <Activity className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                  <span>Output: Actionable Care Schedule</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA Cue */}
        <div className="p-4 rounded-xl bg-surface-subtle border border-border-theme flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-text-secondary">
            <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
            <span>Select a clinical record on the left and click <strong>Sanitize on Device</strong></span>
          </div>
          <span className="font-mono text-[11px] text-teal-700 dark:text-teal-400 font-semibold">
            Ready
          </span>
        </div>
      </div>
    );
  }

  // Loading state when Stage 1 is running
  if (isPrivacyShieldLoading) {
    return (
      <div className="bg-surface rounded-2xl border border-border-theme p-8 shadow-xs flex flex-col items-center justify-center text-center min-h-[580px] transition-colors duration-200">
        <div className="w-12 h-12 rounded-full border-3 border-teal-600 dark:border-teal-400 border-t-transparent animate-spin mb-4" />
        <h3 className="text-base font-bold text-text-primary mb-1">
          Processing On-Device Privacy Shield
        </h3>
        <p className="text-xs text-text-muted max-w-sm leading-relaxed mb-4">
          Executing Chrome Prompt API in local memory. Stripping names, dates, and medical record numbers locally with zero bytes leaving your browser.
        </p>
        <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/70 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 font-semibold">
          Inference Mode: PREFER_ON_DEVICE
        </span>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-2xl border border-border-theme shadow-xs overflow-hidden flex flex-col min-h-[580px] transition-colors duration-200">
      {/* Header Bar */}
      <div className="p-5 border-b border-border-theme bg-surface">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/70 text-teal-800 dark:text-teal-300 border border-teal-200/80 dark:border-teal-800">
                Patient Care Brief
              </span>
              <span className="text-xs font-medium text-text-muted">•</span>
              <span className="text-xs text-text-muted truncate max-w-[200px] sm:max-w-xs font-medium">
                {title}
              </span>
            </div>
            <h2 className="text-lg font-extrabold text-text-primary tracking-tight">
              Clinical Discharge & Recovery Summary
            </h2>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-subtle hover:bg-surface-hover text-xs font-semibold text-text-secondary hover:text-text-primary border border-border-theme transition cursor-pointer"
              title="Copy Summary"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-text-muted" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              type="button"
              onClick={onExportMarkdown}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-subtle hover:bg-surface-hover text-xs font-semibold text-text-secondary hover:text-text-primary border border-border-theme transition cursor-pointer"
              title="Export Markdown"
            >
              <Download className="w-3.5 h-3.5 text-text-muted" />
              <span>Export</span>
            </button>

            <button
              type="button"
              onClick={onSaveBrief}
              disabled={isSaving || hasSaved || !stage2Result}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                hasSaved
                  ? 'bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300'
                  : stage2Result
                  ? 'bg-teal-700 hover:bg-teal-800 text-white shadow-xs cursor-pointer'
                  : 'bg-surface-subtle text-text-muted cursor-not-allowed border border-border-theme'
              }`}
              title="Save to Cloud Firestore"
            >
              {isSaving ? (
                <div className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
              ) : hasSaved ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <BookmarkCheck className="w-3.5 h-3.5" />
              )}
              <span>{hasSaved ? 'Saved in Records' : 'Save to Records'}</span>
            </button>
          </div>
        </div>

        {/* Segmented Tab Navigation */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border-theme">
          <div className="inline-flex p-1 rounded-xl bg-surface-subtle border border-border-theme text-xs font-medium w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveTab('summary')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg transition cursor-pointer ${
                activeTab === 'summary'
                  ? 'bg-surface text-text-primary font-semibold shadow-2xs'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
              <span>Plain-English Summary</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('recovery')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg transition cursor-pointer ${
                activeTab === 'recovery'
                  ? 'bg-surface text-text-primary font-semibold shadow-2xs'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>7-Day Recovery Plan</span>
              {stage2Result && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('triage')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg transition cursor-pointer ${
                activeTab === 'triage'
                  ? 'bg-surface text-text-primary font-semibold shadow-2xs'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Red Flags & Doctor Questions</span>
              {stage2Result && (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Tab 1: Plain-English Summary */}
      {activeTab === 'summary' && stage1Result && (
        <div className="flex-1 flex flex-col justify-between p-6">
          <div className="space-y-4">
            {/* Sub-tab view toggle & entities pill */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-border-theme">
              <div className="inline-flex p-0.5 rounded-lg bg-surface-subtle border border-border-theme text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setSummarySubTab('patient')}
                  className={`px-3 py-1 rounded-md transition cursor-pointer ${
                    summarySubTab === 'patient'
                      ? 'bg-surface text-text-primary font-semibold shadow-2xs'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  Patient Translation
                </button>
                <button
                  type="button"
                  onClick={() => setSummarySubTab('sanitized')}
                  className={`px-3 py-1 rounded-md transition cursor-pointer ${
                    summarySubTab === 'sanitized'
                      ? 'bg-surface text-text-primary font-semibold shadow-2xs'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  Raw Sanitized Note (Zero-PII)
                </button>
              </div>

              {stage1Result.detectedPiiTypes.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-text-muted">
                  <Lock className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
                  <span>Stripped:</span>
                  <div className="flex flex-wrap gap-1">
                    {stage1Result.detectedPiiTypes.map((t, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-teal-50 dark:bg-teal-950/70 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 font-medium"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Translation Content */}
            {summarySubTab === 'patient' ? (
              <div className="text-text-primary space-y-3 leading-relaxed whitespace-pre-wrap font-sans text-xs sm:text-sm">
                {renderFormattedSummary(stage1Result.simplifiedSummary)}
              </div>
            ) : (
              <div className="bg-surface-subtle p-4 rounded-xl border border-border-theme font-mono text-xs text-text-primary whitespace-pre-wrap leading-relaxed max-h-[380px] overflow-y-auto">
                {stage1Result.sanitizedText}
              </div>
            )}
          </div>

          {/* Bottom Action & Provenance */}
          <div className="pt-6 mt-6 border-t border-border-theme">
            {!stage2Result && !isCloudLoading && (
              <div className="p-4 rounded-xl bg-surface-subtle border border-border-theme flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div className="flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-text-primary">
                      Step 2: Generate 7-Day Care Schedule & Red Flags
                    </h4>
                    <p className="text-[11px] text-text-muted leading-normal">
                      Only the sanitized note with 0 patient identifiers will be routed to Cloud Gemini.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onProceedToCloudStage}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white font-semibold text-xs shadow-sm hover:shadow transition shrink-0 cursor-pointer"
                >
                  <span>Generate Cloud Recovery Plan</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {isCloudLoading && (
              <div className="p-4 rounded-xl bg-surface-subtle border border-border-theme flex items-center justify-between gap-3 mb-4 animate-pulse">
                <div className="flex items-center gap-2.5">
                  <div className="w-3.5 h-3.5 border-2 border-teal-700 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-semibold text-text-primary">
                    Streaming Cloud Gemini tokens live into Plan & Triage tabs...
                  </span>
                </div>
                <span className="text-[11px] font-mono text-text-muted">
                  generateContentStream
                </span>
              </div>
            )}

            {/* Provenance footer */}
            <div className="flex items-center justify-between text-xs text-text-muted">
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
                <span>
                  Processed on-device ({stage1Result.telemetry.modelName} ·{' '}
                  <strong className="font-mono tabular-nums text-text-secondary">
                    {stage1Result.telemetry.latencyMs} ms
                  </strong>
                  )
                </span>
              </div>
              <span className="text-[11px] font-mono text-text-muted">
                Data Boundary: Local Chrome Memory
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: 7-Day Recovery Plan */}
      {activeTab === 'recovery' && (
        <div className="flex-1 flex flex-col justify-between p-6">
          {!stage2Result && !isCloudLoading ? (
            <div className="flex flex-col items-center justify-center text-center py-12">
              <div className="w-12 h-12 rounded-xl bg-surface-subtle text-text-secondary flex items-center justify-center mb-3 border border-border-theme">
                <CalendarDays className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-text-primary mb-1">
                7-Day Recovery Plan Not Yet Generated
              </h4>
              <p className="text-xs text-text-muted max-w-sm mb-4">
                Run Stage 2 to synthesize a day-by-day clinical recovery checklist, medication guardrails, and mobility schedule.
              </p>
              <button
                type="button"
                onClick={onProceedToCloudStage}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white font-semibold text-xs shadow-sm hover:shadow transition cursor-pointer"
              >
                <span>Generate Cloud Recovery Plan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : isCloudLoading ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-text-primary">
                  <div className="w-3 h-3 rounded-full bg-teal-600 animate-ping" />
                  <span>Streaming 7-Day Plan from Cloud Gemini...</span>
                </div>
                <span className="text-xs text-text-muted font-mono">1–2s Live Response</span>
              </div>
              <div className="p-4 rounded-xl bg-surface-subtle border border-border-theme font-mono text-xs text-text-primary whitespace-pre-wrap max-h-72 overflow-y-auto leading-relaxed">
                {streamingRecoveryText || 'Connecting to model and initiating token stream...'}
              </div>
            </div>
          ) : stage2Result ? (
            <div className="space-y-6">
              {/* Progress counter & bar */}
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold text-text-secondary">
                    Checklist Completion: {doneCount} of {totalTasks} milestones
                  </span>
                  <span className="font-mono text-text-primary font-bold tabular-nums">
                    {progressPercent}%
                  </span>
                </div>
                <div className="w-full h-2 bg-surface-subtle rounded-full overflow-hidden border border-border-theme">
                  <div
                    className="h-full bg-teal-600 dark:bg-teal-400 transition-all duration-300 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* 7-Day Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
                {stage2Result.checklist.map((dayPlan) => (
                  <div
                    key={dayPlan.day}
                    className="p-3.5 rounded-xl bg-surface-subtle border border-border-theme hover:border-slate-300 dark:hover:border-slate-700 transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-border-theme">
                        <span className="text-xs font-bold text-teal-800 dark:text-teal-400 font-mono">
                          Day {dayPlan.day}
                        </span>
                        <span className="text-[11px] text-text-secondary font-semibold truncate max-w-[150px]">
                          {dayPlan.title.replace(/^Day \d+:\s*/i, '')}
                        </span>
                      </div>

                      <ul className="space-y-2">
                        {dayPlan.tasks.map((task, taskIdx) => {
                          const taskId = `day-${dayPlan.day}-task-${taskIdx}`;
                          const isDone = !!completedTasks[taskId];

                          return (
                            <li key={taskIdx} className="flex items-start gap-2 text-xs">
                              <input
                                type="checkbox"
                                id={taskId}
                                checked={isDone}
                                onChange={() => toggleTask(taskId)}
                                className="mt-0.5 rounded border-border-theme text-teal-700 focus:ring-teal-600 cursor-pointer"
                              />
                              <label
                                htmlFor={taskId}
                                className={`cursor-pointer leading-tight transition-colors ${
                                  isDone ? 'line-through text-text-muted' : 'text-text-primary'
                                }`}
                              >
                                {task}
                              </label>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Provenance Footer */}
          {stage2Result && (
            <div className="pt-4 mt-4 border-t border-border-theme flex items-center justify-between text-xs text-text-muted">
              <div className="flex items-center gap-1.5">
                <Cloud className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>
                  Processed in cloud ({stage2Result.telemetry.modelName} ·{' '}
                  <strong className="font-mono tabular-nums text-text-secondary">
                    {stage2Result.telemetry.latencyMs} ms
                  </strong>
                  )
                </span>
              </div>
              <span className="text-[11px] font-mono text-text-muted">
                Data Boundary: Sanitized Zero-PII Cloud Payload
              </span>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Red Flags & Doctor Questions */}
      {activeTab === 'triage' && (
        <div className="flex-1 flex flex-col justify-between p-6">
          {!stage2Result && !isCloudLoading ? (
            <div className="flex flex-col items-center justify-center text-center py-12">
              <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 flex items-center justify-center mb-3 border border-amber-200 dark:border-amber-900">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-text-primary mb-1">
                Triage & Questions Not Yet Generated
              </h4>
              <p className="text-xs text-text-muted max-w-sm mb-4">
                Run Stage 2 to analyze warning signs, emergency thresholds, and customized questions for your doctor visit.
              </p>
              <button
                type="button"
                onClick={onProceedToCloudStage}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white font-semibold text-xs shadow-sm hover:shadow transition cursor-pointer"
              >
                <span>Generate Cloud Recovery Plan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : isCloudLoading ? (
            <div className="flex flex-col items-center justify-center text-center py-12">
              <div className="w-8 h-8 border-2 border-teal-700 border-t-transparent rounded-full animate-spin mb-3" />
              <span className="text-xs font-semibold text-text-primary">
                Analyzing triage thresholds with Cloud Gemini...
              </span>
            </div>
          ) : stage2Result ? (
            <div className="space-y-6 max-h-[460px] overflow-y-auto pr-1">
              {/* Red-Flag Warning Signs */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary">
                    Red-Flag Warning Signs (Triage Protocol)
                  </h4>
                  <span className="text-[11px] text-text-muted">Classified by urgency</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {stage2Result.warningSigns.map((warning, index) => {
                    const isUrgent = warning.severity === 'urgent';
                    const isWarning = warning.severity === 'warning';

                    return (
                      <div
                        key={index}
                        className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                          isUrgent
                            ? 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-900 dark:text-rose-200'
                            : isWarning
                            ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200'
                            : 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-200'
                        }`}
                      >
                        <div>
                          <div className="mb-2">
                            <span
                              className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                                isUrgent
                                  ? 'bg-rose-100 dark:bg-rose-900/70 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-800'
                                  : isWarning
                                  ? 'bg-amber-100 dark:bg-amber-900/70 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-800'
                                  : 'bg-emerald-100 dark:bg-emerald-900/70 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800'
                              }`}
                            >
                              {isUrgent
                                ? 'Emergency: Call 911 / ER'
                                : isWarning
                                ? 'Call Doctor in 24h'
                                : 'Normal Milestone'}
                            </span>
                          </div>

                          <h5 className="text-xs font-bold text-text-primary mb-1">
                            {warning.title}
                          </h5>

                          <p className="text-[11px] text-text-secondary leading-relaxed mb-3">
                            {warning.description}
                          </p>
                        </div>

                        <div
                          className={`pt-2 border-t text-[11px] font-semibold flex items-center gap-1.5 ${
                            isUrgent
                              ? 'border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300'
                              : isWarning
                              ? 'border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300'
                              : 'border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300'
                          }`}
                        >
                          <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                          <span>Action: {warning.action}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 5 Questions for the Doctor */}
              <div className="bg-surface-subtle rounded-xl border border-border-theme p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary">
                      5 High-Impact Questions for Your Doctor
                    </h4>
                  </div>
                  <span className="text-[11px] text-text-muted">For your clinic visit</span>
                </div>

                <ol className="space-y-2">
                  {stage2Result.doctorQuestions.map((q, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2.5 p-2.5 rounded-lg bg-surface border border-border-theme text-xs text-text-primary"
                    >
                      <span className="w-5 h-5 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0 font-bold text-[11px] font-mono border border-teal-200 dark:border-teal-800">
                        {idx + 1}
                      </span>
                      <span className="pt-0.5 leading-relaxed">{q}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          ) : null}

          {/* Provenance Footer */}
          {stage2Result && (
            <div className="pt-4 mt-4 border-t border-border-theme flex items-center justify-between text-xs text-text-muted">
              <div className="flex items-center gap-1.5">
                <Cloud className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>
                  Processed in cloud ({stage2Result.telemetry.modelName} ·{' '}
                  <strong className="font-mono tabular-nums text-text-secondary">
                    {stage2Result.telemetry.latencyMs} ms
                  </strong>
                  )
                </span>
              </div>
              <span className="text-[11px] font-mono text-text-muted">
                Data Boundary: Sanitized Zero-PII Cloud Payload
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};