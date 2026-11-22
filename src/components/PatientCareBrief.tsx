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
            className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-mono font-medium bg-teal-50 text-teal-800 border border-teal-200 mx-0.5"
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
      <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-xs flex flex-col items-center justify-center text-center min-h-[560px]">
        <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100 mb-4">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-900 mb-2">
          Patient Care Brief Ready to Generate
        </h3>
        <p className="text-xs text-slate-500 max-w-md leading-relaxed mb-6">
          Select one of the clinical benchmark samples or upload a medical document image on the left. Click <strong className="text-teal-700 font-semibold">Sanitize on Device</strong> to strip personal identifiers locally before patient translation.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-lg text-left">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center gap-2 mb-1.5">
              <Zap className="w-3.5 h-3.5 text-teal-600" />
              <span className="text-xs font-semibold text-slate-800">1. On-Device Shield</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-normal">
              Zero PHI leaves browser memory. Chrome Gemini Nano sanitizes names and dates locally.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center gap-2 mb-1.5">
              <CalendarDays className="w-3.5 h-3.5 text-slate-700" />
              <span className="text-xs font-semibold text-slate-800">2. 7-Day Plan</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-normal">
              Structured daily milestones and actionable checklists generated via Cloud Gemini streaming.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center gap-2 mb-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span className="text-xs font-semibold text-slate-800">3. Red-Flag Triage</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-normal">
              Urgency protocols (Emergency vs Doctor Call) plus 5 high-impact physician questions.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Loading state when Stage 1 is running
  if (isPrivacyShieldLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-xs flex flex-col items-center justify-center text-center min-h-[560px]">
        <div className="w-12 h-12 rounded-full border-3 border-teal-600 border-t-transparent animate-spin mb-4" />
        <h3 className="text-base font-bold text-slate-900 mb-1">
          Processing On-Device Privacy Shield
        </h3>
        <p className="text-xs text-slate-500 max-w-sm leading-relaxed mb-4">
          Executing Chrome Prompt API in browser memory. Stripping names, dates, and medical record numbers locally with zero bytes leaving your device.
        </p>
        <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200 font-semibold">
          Inference Mode: PREFER_ON_DEVICE
        </span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col min-h-[560px]">
      {/* Header Bar */}
      <div className="p-5 border-b border-slate-200 bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200">
                Patient Care Brief
              </span>
              <span className="text-xs font-medium text-slate-400">•</span>
              <span className="text-xs text-slate-500 truncate max-w-[200px] sm:max-w-xs font-medium">
                {title}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Clinical Discharge & Recovery Summary
            </h2>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition"
              title="Copy Summary"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              type="button"
              onClick={onExportMarkdown}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition"
              title="Export Markdown"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export</span>
            </button>

            <button
              type="button"
              onClick={onSaveBrief}
              disabled={isSaving || hasSaved || !stage2Result}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                hasSaved
                  ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
                  : stage2Result
                  ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
              title="Save to Cloud Firestore"
            >
              {isSaving ? (
                <div className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
              ) : hasSaved ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <BookmarkCheck className="w-3.5 h-3.5" />
              )}
              <span>{hasSaved ? 'Saved in Records' : 'Save to Records'}</span>
            </button>
          </div>
        </div>

        {/* Segmented Tab Navigation */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
          <div className="inline-flex p-1 rounded-xl bg-slate-100 text-xs font-medium w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveTab('summary')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg transition ${
                activeTab === 'summary'
                  ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
              <span>Plain-English Summary</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('recovery')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg transition ${
                activeTab === 'recovery'
                  ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5 text-slate-700" />
              <span>7-Day Recovery Plan</span>
              {stage2Result && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('triage')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg transition ${
                activeTab === 'triage'
                  ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="inline-flex p-0.5 rounded-lg bg-slate-100 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setSummarySubTab('patient')}
                  className={`px-3 py-1 rounded-md transition ${
                    summarySubTab === 'patient'
                      ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Patient Translation
                </button>
                <button
                  type="button"
                  onClick={() => setSummarySubTab('sanitized')}
                  className={`px-3 py-1 rounded-md transition ${
                    summarySubTab === 'sanitized'
                      ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Raw Sanitized Note (Zero-PII)
                </button>
              </div>

              {stage1Result.detectedPiiTypes.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Lock className="w-3.5 h-3.5 text-teal-700" />
                  <span>Stripped:</span>
                  <div className="flex flex-wrap gap-1">
                    {stage1Result.detectedPiiTypes.map((t, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200 font-medium"
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
              <div className="prose prose-slate prose-sm max-w-none text-slate-700 space-y-3 leading-relaxed whitespace-pre-wrap font-sans text-xs sm:text-sm">
                {renderFormattedSummary(stage1Result.simplifiedSummary)}
              </div>
            ) : (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono text-xs text-slate-700 whitespace-pre-wrap leading-relaxed max-h-[380px] overflow-y-auto">
                {stage1Result.sanitizedText}
              </div>
            )}
          </div>

          {/* Bottom Action & Provenance */}
          <div className="pt-6 mt-6 border-t border-slate-200">
            {!stage2Result && !isCloudLoading && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div className="flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      Step 2: Generate 7-Day Care Schedule & Red Flags
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      Only the sanitized note with 0 patient identifiers will be routed to Cloud Gemini.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onProceedToCloudStage}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs transition shrink-0"
                >
                  <span>Generate Cloud Recovery Plan</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {isCloudLoading && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-300 flex items-center justify-between gap-3 mb-4 animate-pulse">
                <div className="flex items-center gap-2.5">
                  <div className="w-3.5 h-3.5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-semibold text-slate-900">
                    Streaming Cloud Gemini tokens live into Plan & Triage tabs...
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-600">generateContentStream</span>
              </div>
            )}

            {/* Provenance footer */}
            <div className="flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-teal-700" />
                <span>
                  Processed on-device ({stage1Result.telemetry.modelName} ·{' '}
                  <strong className="font-mono tabular-nums text-slate-700">
                    {stage1Result.telemetry.latencyMs} ms
                  </strong>
                  )
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
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
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center mb-3">
                <CalendarDays className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-1">
                7-Day Recovery Plan Not Yet Generated
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mb-4">
                Run Stage 2 to synthesize a day-by-day clinical recovery checklist, medication guardrails, and mobility schedule.
              </p>
              <button
                type="button"
                onClick={onProceedToCloudStage}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs transition"
              >
                <span>Generate Cloud Recovery Plan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : isCloudLoading ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
                  <div className="w-3 h-3 rounded-full bg-slate-900 animate-ping" />
                  <span>Streaming 7-Day Plan from Cloud Gemini...</span>
                </div>
                <span className="text-xs text-slate-500 font-mono">1–2s Live Response</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-700 whitespace-pre-wrap max-h-72 overflow-y-auto leading-relaxed">
                {streamingRecoveryText || 'Connecting to model and initiating token stream...'}
              </div>
            </div>
          ) : stage2Result ? (
            <div className="space-y-6">
              {/* Progress counter & bar */}
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold text-slate-800">
                    Checklist Completion: {doneCount} of {totalTasks} milestones
                  </span>
                  <span className="font-mono text-slate-900 font-bold tabular-nums">
                    {progressPercent}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-600 transition-all duration-300 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* 7-Day Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
                {stage2Result.checklist.map((dayPlan) => (
                  <div
                    key={dayPlan.day}
                    className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 hover:border-slate-300 transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/60">
                        <span className="text-xs font-bold text-teal-800 font-mono">
                          Day {dayPlan.day}
                        </span>
                        <span className="text-[11px] text-slate-600 font-semibold truncate max-w-[150px]">
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
                                className="mt-0.5 rounded border-slate-300 text-teal-700 focus:ring-teal-600 cursor-pointer"
                              />
                              <label
                                htmlFor={taskId}
                                className={`cursor-pointer leading-tight transition-colors ${
                                  isDone ? 'line-through text-slate-400' : 'text-slate-700'
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
            <div className="pt-4 mt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <Cloud className="w-3.5 h-3.5 text-slate-700" />
                <span>
                  Processed in cloud ({stage2Result.telemetry.modelName} ·{' '}
                  <strong className="font-mono tabular-nums text-slate-700">
                    {stage2Result.telemetry.latencyMs} ms
                  </strong>
                  )
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
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
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-3">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-1">
                Triage & Questions Not Yet Generated
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mb-4">
                Run Stage 2 to analyze warning signs, emergency thresholds, and customized questions for your doctor visit.
              </p>
              <button
                type="button"
                onClick={onProceedToCloudStage}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs transition"
              >
                <span>Generate Cloud Recovery Plan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : isCloudLoading ? (
            <div className="flex flex-col items-center justify-center text-center py-12">
              <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mb-3" />
              <span className="text-xs font-semibold text-slate-800">
                Analyzing triage thresholds with Cloud Gemini...
              </span>
            </div>
          ) : stage2Result ? (
            <div className="space-y-6 max-h-[460px] overflow-y-auto pr-1">
              {/* Red-Flag Warning Signs */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Red-Flag Warning Signs (Triage Protocol)
                  </h4>
                  <span className="text-[11px] text-slate-500">Classified by urgency</span>
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
                            ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                            : isWarning
                            ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                            : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                        }`}
                      >
                        <div>
                          <div className="mb-2">
                            <span
                              className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                                isUrgent
                                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                                  : isWarning
                                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                                  : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              }`}
                            >
                              {isUrgent
                                ? 'Emergency: Call 911 / ER'
                                : isWarning
                                ? 'Call Doctor in 24h'
                                : 'Normal Milestone'}
                            </span>
                          </div>

                          <h5 className="text-xs font-bold text-slate-900 mb-1">
                            {warning.title}
                          </h5>

                          <p className="text-[11px] text-slate-600 leading-relaxed mb-3">
                            {warning.description}
                          </p>
                        </div>

                        <div
                          className={`pt-2 border-t text-[11px] font-semibold flex items-center gap-1.5 ${
                            isUrgent
                              ? 'border-rose-200 text-rose-800'
                              : isWarning
                              ? 'border-amber-200 text-amber-800'
                              : 'border-emerald-200 text-emerald-800'
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
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-slate-700" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      5 High-Impact Questions for Your Doctor
                    </h4>
                  </div>
                  <span className="text-[11px] text-slate-500">For your clinic visit</span>
                </div>

                <ol className="space-y-2">
                  {stage2Result.doctorQuestions.map((q, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white border border-slate-200/80 text-xs text-slate-700"
                    >
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center shrink-0 font-bold text-[11px] font-mono border border-slate-200">
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
            <div className="pt-4 mt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <Cloud className="w-3.5 h-3.5 text-slate-700" />
                <span>
                  Processed in cloud ({stage2Result.telemetry.modelName} ·{' '}
                  <strong className="font-mono tabular-nums text-slate-700">
                    {stage2Result.telemetry.latencyMs} ms
                  </strong>
                  )
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Data Boundary: Sanitized Zero-PII Cloud Payload
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};