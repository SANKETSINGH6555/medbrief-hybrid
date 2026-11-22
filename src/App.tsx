import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  Cpu,
  Cloud,
  Sparkles,
  ArrowRight,
  FileText,
  AlertCircle,
  Copy,
  Download,
  RotateCcw,
  CheckCircle,
  Info,
  Sliders,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import { Header } from './components/Header';
import { SampleNotesSelector } from './components/SampleNotesSelector';
import { PrivacyShieldResult } from './components/PrivacyShieldResult';
import { CloudRecoveryPlan } from './components/CloudRecoveryPlan';
import { HistoryDrawer } from './components/HistoryDrawer';
import { ChromeGuideModal } from './components/ChromeGuideModal';
import { SAMPLE_CLINICAL_NOTES } from './data/sampleNotes';
import {
  RoutingMode,
  SampleNote,
  Stage1Result,
  Stage2Result,
  SavedBrief,
} from './types';
import {
  ensureAnonymousAuth,
  fetchDefaultInferenceMode,
  checkChromeNanoReadiness,
  NanoReadiness,
} from './lib/firebase';
import {
  runPrivacyShieldStage,
  runCloudRecoveryAnalyzerStage,
  saveBriefToFirestore,
  loadUserBriefs,
  deleteUserBrief,
} from './lib/aiService';

export default function App() {
  // State
  const [routingMode, setRoutingMode] = useState<RoutingMode>('auto');
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>('sample-cardio');
  const [clinicalText, setClinicalText] = useState<string>(SAMPLE_CLINICAL_NOTES[0].rawClinicalText);
  const [currentTitle, setCurrentTitle] = useState<string>(SAMPLE_CLINICAL_NOTES[0].title);

  const [isPrivacyShieldLoading, setIsPrivacyShieldLoading] = useState(false);
  const [isCloudLoading, setIsCloudLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  const [stage1Result, setStage1Result] = useState<Stage1Result | null>(null);
  const [stage2Result, setStage2Result] = useState<Stage2Result | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // User & History
  const [userUid, setUserUid] = useState<string | null>(null);
  const [savedBriefs, setSavedBriefs] = useState<SavedBrief[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  // Modals & Panels
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Hardware & Remote Config Status
  const [nanoReadiness, setNanoReadiness] = useState<NanoReadiness>({
    status: 'unavailable',
    message: 'Checking Chrome Prompt API...',
  });
  const [remoteConfigDefault, setRemoteConfigDefault] = useState<string>('prefer_on_device');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // 1. Initial Load: Auth, Remote Config, Chrome Nano Check, Firestore History
  useEffect(() => {
    let isMounted = true;

    async function initializeSystem() {
      // Chrome Prompt API detection
      try {
        const readiness = await checkChromeNanoReadiness();
        if (isMounted) setNanoReadiness(readiness);
      } catch (err) {
        console.warn('Chrome Nano readiness check failed:', err);
      }

      // Remote Config fetch
      try {
        const mode = await fetchDefaultInferenceMode();
        if (isMounted) {
          setRemoteConfigDefault(mode);
          if (mode === 'only_on_device' || mode === 'only_in_cloud' || mode === 'auto') {
            setRoutingMode(mode);
          }
        }
      } catch (err) {
        console.warn('Remote Config initialization error:', err);
      }

      // Anonymous Auth & Firestore load
      try {
        const user = await ensureAnonymousAuth();
        if (isMounted) {
          setUserUid(user.uid);
          setIsHistoryLoading(true);
          const briefs = await loadUserBriefs(user.uid);
          setSavedBriefs(briefs);
          setIsHistoryLoading(false);
        }
      } catch (err) {
        console.warn('Auth or Firestore initialization error:', err);
        if (isMounted) setIsHistoryLoading(false);
      }
    }

    initializeSystem();
    return () => {
      isMounted = false;
    };
  }, []);

  // Handle Note selection
  const handleSelectSampleNote = (note: SampleNote) => {
    setSelectedNoteId(note.id);
    setClinicalText(note.rawClinicalText);
    setCurrentTitle(note.title);
    setStage1Result(null);
    setStage2Result(null);
    setErrorMsg(null);
    setHasSaved(false);
  };

  // Stage 1 Trigger: Instantiated on User Click as required by Chrome Prompt API
  const handleExecutePrivacyShield = async () => {
    if (!clinicalText.trim()) {
      setErrorMsg('Please enter or select a clinical note to process.');
      return;
    }

    setIsPrivacyShieldLoading(true);
    setErrorMsg(null);
    setHasSaved(false);

    try {
      const result = await runPrivacyShieldStage(clinicalText, routingMode);
      setStage1Result(result);
      showToast('Stage 1 Complete: Patient PII Redacted Locally');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
    } finally {
      setIsPrivacyShieldLoading(false);
    }
  };

  // Stage 2 Trigger: Instantiated on User Click for Cloud Gemini
  const handleExecuteCloudRecovery = async () => {
    if (!stage1Result) return;

    setIsCloudLoading(true);
    setErrorMsg(null);

    try {
      const result = await runCloudRecoveryAnalyzerStage(
        stage1Result.sanitizedText,
        stage1Result.simplifiedSummary
      );
      setStage2Result(result);
      showToast('Stage 2 Complete: 7-Day Care Plan & Red Flags Generated');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(`Cloud Stage Error: ${msg}`);
    } finally {
      setIsCloudLoading(false);
    }
  };

  // Save brief to Firestore
  const handleSaveToFirestore = async () => {
    if (!userUid || !stage1Result || !stage2Result) {
      showToast('Cannot save until both stages are completed.');
      return;
    }

    setIsSaving(true);
    try {
      const docId = await saveBriefToFirestore(
        userUid,
        currentTitle,
        stage1Result,
        stage2Result
      );
      setHasSaved(true);
      showToast('Brief successfully saved to Cloud Firestore!');
      // Reload history
      const updatedBriefs = await loadUserBriefs(userUid);
      setSavedBriefs(updatedBriefs);
    } catch (err) {
      console.error('Failed to save to Firestore:', err);
      showToast('Failed to save brief to Firestore.');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete brief from Firestore
  const handleDeleteBrief = async (briefId: string) => {
    if (!userUid) return;
    try {
      await deleteUserBrief(userUid, briefId);
      setSavedBriefs((prev) => prev.filter((b) => b.id !== briefId));
      showToast('Brief removed from Firestore.');
    } catch (err) {
      console.error('Failed to delete brief:', err);
      showToast('Error deleting brief.');
    }
  };

  // Restore brief from history
  const handleRestoreBrief = (brief: SavedBrief) => {
    setCurrentTitle(brief.title);
    setClinicalText(brief.sanitizedClinicalText);
    setSelectedNoteId(null);
    setStage1Result({
      sanitizedText: brief.sanitizedClinicalText,
      simplifiedSummary: brief.simplifiedSummary,
      detectedPiiTypes: brief.detectedPiiTypes,
      telemetry: brief.stage1Telemetry,
    });
    setStage2Result({
      checklist: brief.checklist,
      warningSigns: brief.warningSigns,
      doctorQuestions: brief.doctorQuestions,
      telemetry: brief.stage2Telemetry,
    });
    setHasSaved(true);
    showToast(`Restored brief: "${brief.title}"`);
  };

  // Export Brief (.md)
  const handleExportMarkdown = () => {
    if (!stage1Result) return;

    let md = `# MedBrief Hybrid — Clinical Discharge Brief\n`;
    md += `**Document Title:** ${currentTitle}\n`;
    md += `**Generated At:** ${new Date().toLocaleString()}\n`;
    md += `**Hackathon:** #BuildHybridAI 2026 (Web / Chrome Track)\n\n`;

    md += `---\n\n`;
    md += `## 1. Hybrid AI Execution Telemetry Audit\n\n`;
    md += `| Stage | Engine / Mode | Latency | Data Boundary |\n`;
    md += `| :--- | :--- | :--- | :--- |\n`;
    md += `| **Stage 1 (Privacy Shield)** | \`${stage1Result.telemetry.inferenceSource}\` (${stage1Result.telemetry.modelName}) | \`${stage1Result.telemetry.latencyMs} ms\` | \`${stage1Result.telemetry.dataBoundary}\` |\n`;

    if (stage2Result) {
      md += `| **Stage 2 (Cloud Analyzer)** | \`${stage2Result.telemetry.inferenceSource}\` (${stage2Result.telemetry.modelName}) | \`${stage2Result.telemetry.latencyMs} ms\` | \`${stage2Result.telemetry.dataBoundary}\` |\n`;
    }
    md += `\n**Redacted PII Entities (0 Bytes Transmitted to Cloud):** ${stage1Result.detectedPiiTypes.join(', ')}\n\n`;

    md += `---\n\n`;
    md += `## 2. Patient-Friendly Plain-English Summary\n\n`;
    md += `${stage1Result.simplifiedSummary}\n\n`;

    if (stage2Result) {
      md += `---\n\n`;
      md += `## 3. Red-Flag Warning Signs (Triage Protocol)\n\n`;
      stage2Result.warningSigns.forEach((w) => {
        md += `### [${w.severity.toUpperCase()}] ${w.title}\n`;
        md += `* **Description:** ${w.description}\n`;
        md += `* **Action Required:** ${w.action}\n\n`;
      });

      md += `---\n\n`;
      md += `## 4. 7-Day Structured Recovery Checklist\n\n`;
      stage2Result.checklist.forEach((day) => {
        md += `### Day ${day.day}: ${day.title}\n`;
        day.tasks.forEach((t) => {
          md += `- [ ] ${t}\n`;
        });
        md += `\n`;
      });

      md += `---\n\n`;
      md += `## 5. High-Impact Questions for Your Doctor\n\n`;
      stage2Result.doctorQuestions.forEach((q, idx) => {
        md += `${idx + 1}. ${q}\n`;
      });
      md += `\n`;
    }

    md += `---\n\n`;
    md += `## 6. Sanitized Clinical Text (Zero-PII)\n\n`;
    md += `\`\`\`text\n${stage1Result.sanitizedText}\n\`\`\`\n`;

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `MedBrief-${currentTitle.replace(/[^a-zA-Z0-9]/g, '_')}-${Date.now()}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Exported MedBrief Markdown file!');
  };

  // Copy full summary
  const handleCopySummary = () => {
    if (!stage1Result) return;
    let full = `MEDBRIEF PATIENT SUMMARY: ${currentTitle}\n\n`;
    full += stage1Result.simplifiedSummary + '\n\n';
    if (stage2Result) {
      full += 'DOCTOR QUESTIONS:\n';
      stage2Result.doctorQuestions.forEach((q, i) => {
        full += `${i + 1}. ${q}\n`;
      });
    }
    navigator.clipboard.writeText(full);
    showToast('Summary copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Top Header */}
      <Header
        routingMode={routingMode}
        onRoutingModeChange={setRoutingMode}
        nanoReadiness={nanoReadiness}
        remoteConfigDefault={remoteConfigDefault}
        userUid={userUid}
        savedBriefsCount={savedBriefs.length}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
      />

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 text-cyan-300 border border-cyan-500/40 shadow-xl shadow-cyan-500/10 text-xs font-semibold animate-bounce">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Hero Banner / Track Description */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-cyan-950/30 to-indigo-950/40 border border-slate-800 p-6">
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-medium mb-3">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Google #BuildHybridAI 2026 Hackathon Official Entry</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight mb-2">
              The Zero-Leakage Hybrid AI Healthcare Companion
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Medical records contain intensely sensitive personal data. MedBrief Hybrid deploys <strong className="text-emerald-400">Chrome Gemini Nano on-device</strong> to strip patient identifiers locally with 0 bytes leaving browser memory, then securely activates <strong className="text-indigo-400">Cloud Gemini 2.5</strong> with sanitized payloads to build interactive 7-day care plans.
            </p>
          </div>

          <div className="absolute right-4 bottom-4 opacity-10 pointer-events-none hidden md:block">
            <Shield className="w-48 h-48 text-cyan-400" />
          </div>
        </div>

        {/* 1-Click Sample Notes Selector */}
        <SampleNotesSelector
          selectedNoteId={selectedNoteId}
          onSelectNote={handleSelectSampleNote}
          disabled={isPrivacyShieldLoading || isCloudLoading}
        />

        {/* Error Notification */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/50 text-rose-200 text-xs flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <strong className="font-semibold block mb-1">Execution Diagnostic:</strong>
              <p className="text-rose-300 leading-relaxed">{errorMsg}</p>
              {routingMode === 'only_on_device' && (
                <button
                  type="button"
                  onClick={() => {
                    setRoutingMode('auto');
                    setErrorMsg(null);
                  }}
                  className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-900/60 hover:bg-rose-800 text-white font-medium text-xs border border-rose-600/50"
                >
                  <Sparkles className="w-3 h-3 text-cyan-300" />
                  <span>Switch to Auto Hybrid Mode (Recommended)</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Input & Execution Section */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              <label htmlFor="clinical-notes" className="text-sm font-bold text-white">
                Clinical Note Input (EHR / Discharge / Prescription)
              </label>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
              <span>{clinicalText.length} characters</span>
              <span>•</span>
              <span>{clinicalText.split(/\s+/).filter(Boolean).length} words</span>
            </div>
          </div>

          <textarea
            id="clinical-notes"
            rows={8}
            value={clinicalText}
            onChange={(e) => {
              setClinicalText(e.target.value);
              setSelectedNoteId(null);
            }}
            placeholder="Paste clinical note, discharge summary, lab reports, or medication list here..."
            className="w-full rounded-xl bg-slate-950 border border-slate-800 p-4 font-mono text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition leading-relaxed resize-y"
          />

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4 pt-3 border-t border-slate-800/80">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Active Mode: <strong className="text-white capitalize">{routingMode.replace('_', ' ')}</strong>
                {' '}({routingMode === 'auto' ? 'Auto-selects Gemini Nano locally with cloud fallback' : routingMode === 'only_on_device' ? 'Strict local execution only' : 'Direct cloud inference'})
              </span>
            </div>

            <button
              type="button"
              onClick={handleExecutePrivacyShield}
              disabled={isPrivacyShieldLoading || isCloudLoading || !clinicalText.trim()}
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50 cursor-pointer shrink-0"
            >
              {isPrivacyShieldLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Sanitizing Locally in Chrome...</span>
                </>
              ) : (
                <>
                  <Cpu className="w-4 h-4" />
                  <span>Sanitize & Translate on Device</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Stage 1 Output: On-Device Privacy Shield */}
        {stage1Result && (
          <PrivacyShieldResult
            result={stage1Result}
            onProceedToCloudStage={handleExecuteCloudRecovery}
            isCloudLoading={isCloudLoading}
          />
        )}

        {/* Stage 2 Output: Cloud Recovery & Red-Flag Analyzer */}
        {stage2Result && (
          <CloudRecoveryPlan
            result={stage2Result}
            onSaveBrief={handleSaveToFirestore}
            isSaving={isSaving}
            hasSaved={hasSaved}
            onExportMarkdown={handleExportMarkdown}
            onCopyAll={handleCopySummary}
          />
        )}
      </main>

      {/* History Slide-Over Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        savedBriefs={savedBriefs}
        onSelectBrief={handleRestoreBrief}
        onDeleteBrief={handleDeleteBrief}
        isLoading={isHistoryLoading}
      />

      {/* Chrome Guide Modal */}
      <ChromeGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-6 text-center text-xs text-slate-500 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">MedBrief Hybrid</span>
            <span>•</span>
            <span>Built with Firebase AI Logic (v13+), Cloud Firestore, and Chrome Prompt API</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <button
              onClick={() => setIsGuideOpen(true)}
              className="text-cyan-400 hover:text-cyan-300 transition"
            >
              Chrome Flags Guide
            </button>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">#BuildHybridAI 2026 Hackathon</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
