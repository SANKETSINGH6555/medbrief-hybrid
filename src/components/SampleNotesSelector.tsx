import React from 'react';
import { HeartPulse, Stethoscope, Pill, ArrowRight, Sparkles } from 'lucide-react';
import { SAMPLE_CLINICAL_NOTES } from '../data/sampleNotes';
import { SampleNote } from '../types';

interface SampleNotesSelectorProps {
  selectedNoteId: string | null;
  onSelectNote: (note: SampleNote) => void;
  disabled?: boolean;
}

export const SampleNotesSelector: React.FC<SampleNotesSelectorProps> = ({
  selectedNoteId,
  onSelectNote,
  disabled,
}) => {
  const getIcon = (category: SampleNote['category']) => {
    switch (category) {
      case 'Cardiology':
        return <HeartPulse className="w-4 h-4 text-rose-400" />;
      case 'Emergency':
        return <Stethoscope className="w-4 h-4 text-amber-400" />;
      case 'Pharmacology':
        return <Pill className="w-4 h-4 text-cyan-400" />;
    }
  };

  const getBadgeClass = (category: SampleNote['category']) => {
    switch (category) {
      case 'Cardiology':
        return 'bg-rose-950/60 border-rose-800/80 text-rose-300';
      case 'Emergency':
        return 'bg-amber-950/60 border-amber-800/80 text-amber-300';
      case 'Pharmacology':
        return 'bg-cyan-950/60 border-cyan-800/80 text-cyan-300';
    }
  };

  return (
    <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-slate-200">
            One-Click Clinical Benchmark Samples (Hackathon Evaluation)
          </h3>
        </div>
        <span className="text-xs text-slate-400">Click to instantly populate</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {SAMPLE_CLINICAL_NOTES.map((sample) => {
          const isSelected = selectedNoteId === sample.id;
          return (
            <button
              key={sample.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelectNote(sample)}
              className={`text-left p-3.5 rounded-xl border transition-all duration-200 flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-850 border-cyan-500/80 shadow-md shadow-cyan-500/10 ring-1 ring-cyan-500/50'
                  : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border ${getBadgeClass(sample.category)}`}>
                    {getIcon(sample.category)}
                    {sample.category}
                  </span>
                  {isSelected && (
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                      Selected
                    </span>
                  )}
                </div>
                <h4 className="text-xs font-semibold text-white leading-snug line-clamp-1 mb-1">
                  {sample.title}
                </h4>
                <p className="text-[11px] text-slate-400 line-clamp-2 mb-3">
                  {sample.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[11px] text-cyan-400 font-medium">
                <span>Load Clinical Record</span>
                <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
