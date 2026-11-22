import React, { useState } from 'react';
import {
  CalendarDays,
  AlertTriangle,
  HelpCircle,
  CheckCircle2,
  BookmarkCheck,
  Download,
  Copy,
  Check,
  Flame,
  Activity,
  HeartHandshake,
  ShieldAlert,
} from 'lucide-react';
import { Stage2Result, DayPlan, WarningSign } from '../types';
import { TelemetryBadge } from './TelemetryBadge';

interface CloudRecoveryPlanProps {
  result: Stage2Result;
  onSaveBrief: () => void;
  isSaving: boolean;
  hasSaved: boolean;
  onExportMarkdown: () => void;
  onCopyAll: () => void;
}

export const CloudRecoveryPlan: React.FC<CloudRecoveryPlanProps> = ({
  result,
  onSaveBrief,
  isSaving,
  hasSaved,
  onExportMarkdown,
  onCopyAll,
}) => {
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);

  const toggleTask = (taskId: string) => {
    setCompletedTasks((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  const handleCopy = () => {
    onCopyAll();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Calculate task completion progress
  const totalTasks = result.checklist.reduce((acc, day) => acc + day.tasks.length, 0);
  const doneCount = Object.values(completedTasks).filter(Boolean).length;
  const progressPercent = totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0;

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden mt-6">
      {/* Stage Header */}
      <div className="p-5 border-b border-slate-800 bg-slate-950/60">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                  Stage 2 Complete
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 font-mono">
                  Cloud Recovery Intelligence
                </span>
              </div>
              <h3 className="text-base font-bold text-white">
                7-Day Recovery Plan, Red Flags & Doctor Questions
              </h3>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition"
              title="Copy full summary"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copied ? 'Copied' : 'Copy Summary'}</span>
            </button>

            <button
              onClick={onExportMarkdown}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-cyan-300 transition"
              title="Export Brief (.md)"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export Brief (.md)</span>
            </button>

            <button
              onClick={onSaveBrief}
              disabled={isSaving || hasSaved}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-md transition ${
                hasSaved
                  ? 'bg-emerald-950/80 border border-emerald-600/60 text-emerald-300'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
              }`}
            >
              {isSaving ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : hasSaved ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <BookmarkCheck className="w-3.5 h-3.5" />
              )}
              <span>{hasSaved ? 'Saved in Firestore' : 'Save to Cloud'}</span>
            </button>
          </div>
        </div>

        {/* Live Cloud Telemetry */}
        <TelemetryBadge telemetry={result.telemetry} label="Cloud Analyzer Output" />
      </div>

      <div className="p-6 space-y-6">
        {/* Section 1: Red-Flag Warning Signs */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                Red-Flag Warning Signs (Triage Protocol)
              </h4>
            </div>
            <span className="text-xs text-slate-400">Classified by clinical urgency</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {result.warningSigns.map((warning, index) => {
              const isUrgent = warning.severity === 'urgent';
              const isWarning = warning.severity === 'warning';

              return (
                <div
                  key={index}
                  className={`p-4 rounded-xl border flex flex-col justify-between ${
                    isUrgent
                      ? 'bg-rose-950/30 border-rose-500/40 text-rose-100'
                      : isWarning
                      ? 'bg-amber-950/30 border-amber-500/40 text-amber-100'
                      : 'bg-slate-950/40 border-slate-800 text-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                          isUrgent
                            ? 'bg-rose-900/60 text-rose-300 border border-rose-700/60'
                            : isWarning
                            ? 'bg-amber-900/60 text-amber-300 border border-amber-700/60'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {isUrgent ? 'Emergency: Call 911 / ER' : isWarning ? 'Call Doctor in 24h' : 'Expected Milestone'}
                      </span>
                    </div>

                    <h5 className="text-xs font-bold text-white mt-1 mb-1">
                      {warning.title}
                    </h5>

                    <p className="text-[11px] text-slate-300 leading-relaxed mb-3">
                      {warning.description}
                    </p>
                  </div>

                  <div className={`pt-2 border-t text-[11px] font-semibold flex items-center gap-1.5 ${
                    isUrgent ? 'border-rose-900/40 text-rose-300' : isWarning ? 'border-amber-900/40 text-amber-300' : 'border-slate-800 text-slate-400'
                  }`}>
                    <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                    <span>Action: {warning.action}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: 7-Day Structured Recovery Checklist */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-cyan-400" />
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                Interactive 7-Day Recovery Checklist
              </h4>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span>Progress: {doneCount}/{totalTasks} tasks</span>
              <span className="font-mono text-cyan-400 font-bold">({progressPercent}%)</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-slate-800 rounded-full mb-4 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {result.checklist.map((dayPlan) => (
              <div
                key={dayPlan.day}
                className="bg-slate-950/60 rounded-xl border border-slate-800/80 p-3.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/60">
                    <span className="text-xs font-bold text-cyan-400 font-mono">
                      Day {dayPlan.day}
                    </span>
                    <span className="text-[11px] text-slate-300 font-semibold truncate max-w-[130px]">
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
                            className="mt-0.5 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-400 focus:ring-offset-slate-950 cursor-pointer"
                          />
                          <label
                            htmlFor={taskId}
                            className={`cursor-pointer leading-tight transition-colors ${
                              isDone ? 'line-through text-slate-500' : 'text-slate-300'
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

        {/* Section 3: 5 Questions for the Doctor */}
        <div className="bg-slate-950/70 rounded-xl border border-slate-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-indigo-400" />
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                5 High-Impact Questions for Your Doctor
              </h4>
            </div>
            <span className="text-xs text-slate-400">Take these to your clinic visit</span>
          </div>

          <ol className="space-y-2.5">
            {result.doctorQuestions.map((q, idx) => (
              <li
                key={idx}
                className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/60 text-xs text-slate-200"
              >
                <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 font-bold text-[11px] font-mono border border-indigo-500/30">
                  {idx + 1}
                </span>
                <span className="pt-0.5 leading-relaxed">{q}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
};
