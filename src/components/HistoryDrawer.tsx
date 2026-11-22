import React from 'react';
import {
  X,
  History,
  Trash2,
  Calendar,
  ShieldCheck,
  ChevronRight,
  FileText,
} from 'lucide-react';
import { SavedBrief } from '../types/index';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  savedBriefs: SavedBrief[];
  onSelectBrief: (brief: SavedBrief) => void;
  onDeleteBrief: (briefId: string) => void;
  isLoading: boolean;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  savedBriefs,
  onSelectBrief,
  onDeleteBrief,
  isLoading,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col transition-colors duration-200">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/70 text-teal-800 dark:text-teal-300 flex items-center justify-center border border-teal-200/80 dark:border-teal-800">
                <History className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Saved Clinical Briefs</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  Cloud Firestore: users/{'{uid}'}/briefs
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Privacy Guarantee Banner */}
          <div className="p-3 bg-teal-50/70 dark:bg-teal-950/40 border-b border-teal-200/60 dark:border-teal-900/60 text-xs text-teal-900 dark:text-teal-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-700 dark:text-teal-400 shrink-0" />
            <span className="leading-snug">
              Guaranteed Zero-PII: Only sanitized summaries and care plans are stored in the cloud.
            </span>
          </div>

          {/* Briefs List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 dark:bg-slate-950/50">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <div className="w-6 h-6 border-2 border-teal-700 dark:border-teal-400 border-t-transparent rounded-full animate-spin mb-3" />
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Loading Firestore records...</span>
              </div>
            ) : savedBriefs.length === 0 ? (
              <div className="text-center py-16 px-4">
                <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">No Saved Briefs Yet</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                  Sanitize any clinical note or prescription image, generate a recovery plan, and save it to your private clinical vault.
                </p>
              </div>
            ) : (
              savedBriefs.map((brief) => {
                const dateStr = new Date(brief.createdAt).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={brief.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                          {brief.title}
                        </h4>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteBrief(brief.id);
                          }}
                          className="text-slate-400 hover:text-rose-600 transition p-1 cursor-pointer"
                          title="Delete from Firestore"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 mb-3 leading-relaxed">
                        {brief.simplifiedSummary || brief.sanitizedClinicalText}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1 font-mono text-[10px] text-slate-400 dark:text-slate-500">
                        <Calendar className="w-3 h-3" />
                        {dateStr}
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          onSelectBrief(brief);
                          onClose();
                        }}
                        className="flex items-center gap-1 text-teal-700 dark:text-teal-400 hover:text-teal-900 dark:hover:text-teal-300 font-semibold cursor-pointer"
                      >
                        <span>Restore</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};