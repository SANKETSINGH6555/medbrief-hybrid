import React from 'react';
import {
  X,
  History,
  Trash2,
  Calendar,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Layers,
  Sparkles,
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
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
          {/* Drawer Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-950 text-cyan-400 flex items-center justify-center border border-cyan-800">
                <History className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Firestore Brief Records</h3>
                <p className="text-[11px] text-slate-400">
                  Collection: <code className="text-cyan-300 font-mono">users/{'{uid}'}/briefs</code>
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

          {/* Privacy Notice */}
          <div className="p-3 bg-emerald-950/20 border-b border-emerald-900/30 text-xs text-emerald-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Guaranteed Zero-PII: Only sanitized summaries and care plans are stored.</span>
          </div>

          {/* Briefs List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-3" />
                <span className="text-xs">Loading Cloud Firestore records...</span>
              </div>
            ) : savedBriefs.length === 0 ? (
              <div className="text-center py-12 px-4">
                <Layers className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <h4 className="text-sm font-semibold text-slate-300 mb-1">No Saved Briefs Yet</h4>
                <p className="text-xs text-slate-500">
                  Process any clinical note and click "Save to Cloud" to persist it securely in your Firestore vault.
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
                    className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-slate-700 transition flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <h4 className="text-xs font-bold text-white line-clamp-1">
                          {brief.title}
                        </h4>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteBrief(brief.id);
                          }}
                          className="text-slate-500 hover:text-rose-400 transition p-1"
                          title="Delete record from Firestore"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <p className="text-[11px] text-slate-400 line-clamp-2 mb-2 leading-relaxed">
                        {brief.simplifiedSummary || brief.sanitizedClinicalText}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px] text-slate-500">
                      <span className="flex items-center gap-1 font-mono">
                        <Calendar className="w-3 h-3" />
                        {dateStr}
                      </span>

                      <button
                        onClick={() => {
                          onSelectBrief(brief);
                          onClose();
                        }}
                        className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-semibold"
                      >
                        <span>Restore Brief</span>
                        <ChevronRight className="w-3 h-3" />
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
