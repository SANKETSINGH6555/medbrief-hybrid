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
        return <HeartPulse className="w-3.5 h-3.5 text-rose-600" />;
      case 'Emergency':
        return <Stethoscope className="w-3.5 h-3.5 text-amber-600" />;
      case 'Pharmacology':
        return <Pill className="w-3.5 h-3.5 text-teal-600" />;
    }
  };

  const getBadgeClass = (category: SampleNote['category']) => {
    switch (category) {
      case 'Cardiology':
        return 'bg-rose-50 border-rose-200 text-rose-700';
      case 'Emergency':
        return 'bg-amber-50 border-amber-200 text-amber-800';
      case 'Pharmacology':
        return 'bg-teal-50 border-teal-200 text-teal-700';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-teal-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Clinical Benchmark Bench
          </h3>
        </div>
        <span className="text-[11px] text-slate-500">Select to load benchmark note</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
        {SAMPLE_CLINICAL_NOTES.map((sample) => {
          const isSelected = selectedNoteId === sample.id;
          return (
            <button
              key={sample.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelectNote(sample)}
              className={`text-left p-3 rounded-lg border transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-teal-50/40 border-teal-600 ring-1 ring-teal-600 shadow-2xs'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border ${getBadgeClass(
                      sample.category
                    )}`}
                  >
                    {getIcon(sample.category)}
                    {sample.category}
                  </span>
                  {isSelected && (
                    <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider">
                      Active
                    </span>
                  )}
                </div>
                <h4 className="text-xs font-semibold text-slate-900 leading-snug line-clamp-1 mb-1">
                  {sample.title}
                </h4>
                <p className="text-[11px] text-slate-500 line-clamp-2 mb-2">
                  {sample.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 text-[11px] text-teal-700 font-medium">
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
