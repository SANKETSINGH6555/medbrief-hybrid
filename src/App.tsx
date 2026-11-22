import React, { useState, useEffect, useRef } from 'react';
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
  Upload,
  Image as ImageIcon,
  X,
  Lock,
  HeartPulse,
  Stethoscope,
  Pill,
  Trash2,
  FileCode,
} from 'lucide-react';
import { Header } from './components/Header';
import { PatientCareBrief } from './components/PatientCareBrief';
import { TelemetryInspector } from './components/TelemetryInspector';
import { HistoryDrawer } from './components/HistoryDrawer';
import { ChromeGuideModal } from './components/ChromeGuideModal';
import { SAMPLE_CLINICAL_NOTES } from './data/sampleNotes';
import {
  RoutingMode,
  SampleNote,
  Stage1Result,
  Stage2Result,
  SavedBrief,
  UploadedImage,
} from './types/index';
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
} from './services/hybridAI';

export default function App() {
  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'light' || savedTheme === 'dark') {
        return savedTheme;
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  // Sync theme with HTML class
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // State
  const [routingMode, setRoutingMode] = useState<RoutingMode>('auto');
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>('sample-cardio');
  const [clinicalText, setClinicalText] = useState<string>(SAMPLE_CLINICAL_NOTES[0].rawClinicalText);
  const [currentTitle, setCurrentTitle] = useState<string>(SAMPLE_CLINICAL_NOTES[0].title);
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null);

  const [isPrivacyShieldLoading, setIsPrivacyShieldLoading] = useState(false);
  const [isCloudLoading, setIsCloudLoading] = useState(false);
  const [streamingRecoveryText, setStreamingRecoveryText] = useState<string>('');
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

  // File input ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  // Handle Sample Note selection
  const handleSelectSampleNote = (note: SampleNote) => {
    setSelectedNoteId(note.id);
    setClinicalText(note.rawClinicalText);
    setCurrentTitle(note.title);
    setStage1Result(null);
    setStage2Result(null);
    setErrorMsg(null);
    setHasSaved(false);
  };

  // Handle Multimodal Image Upload
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (.jpg, .png).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64Data = dataUrl.split(',')[1] || '';

      setUploadedImage({
        name: file.name,
        mimeType: file.type,
        base64Data,
        dataUrl,
        sizeKb: Math.round(file.size / 1024),
      });

      setCurrentTitle(`Prescription / Image Analysis (${file.name})`);
      setSelectedNoteId(null);
      setErrorMsg(null);
      showToast(`Attached image: ${file.name}`);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setUploadedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Stage 1 Trigger: Instantiated on User Click as required by Chrome Prompt API
  const handleExecutePrivacyShield = async () => {
    if (!clinicalText.trim() && !uploadedImage) {
      setErrorMsg('Please enter a clinical note or upload a prescription/lab photo to process.');
      return;
    }

    setIsPrivacyShieldLoading(true);
    setErrorMsg(null);
    setHasSaved(false);

    try {
      const result = await runPrivacyShieldStage(clinicalText, routingMode, uploadedImage);
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
    setStreamingRecoveryText('');
    setErrorMsg(null);

    try {
      const result = await runCloudRecoveryAnalyzerStage(
        stage1Result.sanitizedText,
        stage1Result.simplifiedSummary,
        (_chunk, accumulated) => {
          setStreamingRecoveryText(accumulated);
        }
      );
      setStage2Result(result);
      showToast('Stage 2 Complete: 7-Day Care Plan & Red Flags Generated');

      // Prevent Firestore Blocking - non-blocking background save
      if (userUid) {
        saveBriefToFirestore(userUid, currentTitle, stage1Result, result)
          .then(() => {
            setHasSaved(true);
            loadUserBriefs(userUid).then(setSavedBriefs).catch(console.error);
          })
          .catch((err) => {
            console.error('Non-blocking Firestore background save warning:', err);
          });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(`Cloud Stage Error: ${msg}`);
    } finally {
      setIsCloudLoading(false);
      setStreamingRecoveryText('');
    }
  };

  // Save brief to Firestore (non-blocking)
  const handleSaveToFirestore = () => {
    if (!userUid || !stage1Result || !stage2Result) {
      showToast('Cannot save until both stages are completed.');
      return;
    }

    setIsSaving(true);
    saveBriefToFirestore(userUid, currentTitle, stage1Result, stage2Result)
      .then(() => {
        setHasSaved(true);
        showToast('Brief successfully saved to Cloud Firestore!');
        return loadUserBriefs(userUid);
      })
      .then((updatedBriefs) => {
        setSavedBriefs(updatedBriefs);
      })
      .catch((err) => {
        console.error('Failed to save to Firestore:', err);
        showToast('Failed to save brief to Firestore.');
      })
      .finally(() => {
        setIsSaving(false);
      });
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
    setUploadedImage(null);
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
    showToast('Exported MedBrief Markdown file.');
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
    showToast('Summary copied to clipboard.');
  };

  // Total redacted count for live counter pill
  const totalRedactedCount = stage1Result?.detectedPiiTypes.length || 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans pb-16 transition-colors duration-200">
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
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-14 right-5 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white shadow-xl text-xs font-semibold animate-fade-in border border-slate-700">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Error Notification */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-3 shadow-2xs">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <strong className="font-semibold block mb-0.5">Execution Diagnostic:</strong>
              <p className="text-rose-700 dark:text-rose-300 leading-relaxed">{errorMsg}</p>
              {routingMode === 'only_on_device' && (
                <button
                  type="button"
                  onClick={() => {
                    setRoutingMode('auto');
                    setErrorMsg(null);
                  }}
                  className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs transition shadow-2xs"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Switch to Auto Hybrid Mode (Recommended)</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* 2-Column Split Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Clinical Record Input & Multimodal Attachment */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs dark:shadow-xl space-y-4 transition-colors duration-200">
              {/* Card Header & Sample Tabs */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950/70 text-teal-700 dark:text-teal-400 flex items-center justify-center border border-teal-200/80 dark:border-teal-800">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        Clinical Record Input
                      </h3>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        EHR, Discharge Summary, or Prescription
                      </span>
                    </div>
                  </div>
                </div>

                {/* 1-Click Sample Benchmarks + Upload Image Tab */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {SAMPLE_CLINICAL_NOTES.map((sample) => {
                    const isSelected = selectedNoteId === sample.id;
                    const getIcon = () => {
                      if (sample.category === 'Cardiology') return <HeartPulse className="w-3.5 h-3.5 text-rose-500" />;
                      if (sample.category === 'Emergency') return <Stethoscope className="w-3.5 h-3.5 text-amber-500" />;
                      return <Pill className="w-3.5 h-3.5 text-teal-500" />;
                    };

                    return (
                      <button
                        key={sample.id}
                        type="button"
                        disabled={isPrivacyShieldLoading || isCloudLoading}
                        onClick={() => handleSelectSampleNote(sample)}
                        className={`text-left p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-teal-50/80 dark:bg-teal-950/50 border-teal-600 dark:border-teal-500 text-teal-950 dark:text-teal-100 font-semibold ring-1 ring-teal-600 dark:ring-teal-500 shadow-2xs'
                            : 'bg-slate-50/70 dark:bg-slate-850 border-slate-200/90 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            {getIcon()}
                            {sample.category}
                          </span>
                          {isSelected && (
                            <span className="w-2 h-2 rounded-full bg-teal-600 dark:bg-teal-400 animate-pulse" />
                          )}
                        </div>
                        <div className="truncate font-semibold text-slate-900 dark:text-slate-100">{sample.title}</div>
                      </button>
                    );
                  })}

                  {/* Multimodal Upload Trigger */}
                  <button
                    type="button"
                    disabled={isPrivacyShieldLoading || isCloudLoading}
                    onClick={() => fileInputRef.current?.click()}
                    className={`text-left p-2.5 rounded-xl border text-xs transition-all flex flex-col justify-between cursor-pointer ${
                      uploadedImage
                        ? 'bg-teal-50/80 dark:bg-teal-950/50 border-teal-600 dark:border-teal-500 text-teal-950 dark:text-teal-100 font-semibold ring-1 ring-teal-600 dark:ring-teal-500 shadow-2xs'
                        : 'bg-slate-50/70 dark:bg-slate-850 border-slate-200/90 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] uppercase font-bold text-teal-700 dark:text-teal-400 flex items-center gap-1">
                        <Upload className="w-3 h-3" />
                        Multimodal
                      </span>
                      {uploadedImage && (
                        <span className="w-2 h-2 rounded-full bg-teal-600 dark:bg-teal-400 animate-pulse" />
                      )}
                    </div>
                    <div className="truncate font-semibold text-slate-900 dark:text-slate-100">
                      {uploadedImage ? 'Photo Attached' : 'Upload Rx / Lab Photo'}
                    </div>
                  </button>
                </div>

                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </div>

              {/* Uploaded Image Preview Card (if attached) */}
              {uploadedImage && (
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={uploadedImage.dataUrl}
                      alt="Prescription Preview"
                      className="w-12 h-12 object-cover rounded-lg border border-slate-200 dark:border-slate-700 shrink-0 shadow-xs"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {uploadedImage.name}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        {uploadedImage.sizeKb} KB · On-Device Vision Redaction
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer"
                    title="Remove image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Textarea Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Clinical Note Verbatim
                  </span>
                  <div className="flex items-center gap-2 font-mono tabular-nums text-[11px]">
                    <span>{clinicalText.length} chars</span>
                    <span>•</span>
                    <span>{clinicalText.split(/\s+/).filter(Boolean).length} words</span>
                  </div>
                </div>

                <textarea
                  id="clinical-notes"
                  rows={10}
                  value={clinicalText}
                  onChange={(e) => {
                    setClinicalText(e.target.value);
                    setSelectedNoteId(null);
                  }}
                  placeholder="Paste clinical note, discharge summary, or medication list here..."
                  className="w-full rounded-xl bg-slate-50/70 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 p-3.5 font-mono text-xs text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-teal-600/30 dark:focus:ring-teal-500/30 focus:border-teal-600 dark:focus:border-teal-500 transition leading-relaxed resize-y shadow-2xs"
                />
              </div>

              {/* Live PII Redaction Counter Pill (Appears after redaction) */}
              {stage1Result && (
                <div className="p-3.5 rounded-xl bg-teal-50/80 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/80 flex items-center justify-between gap-2 shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-teal-950 dark:text-teal-200">
                        {totalRedactedCount} Identifiers Stripped Locally
                      </span>
                      <p className="text-[11px] text-teal-800 dark:text-teal-400">
                        Zero patient names, dates, or MRNs transmitted to cloud services.
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300 font-semibold border border-teal-200 dark:border-teal-700">
                    Client Shield Active
                  </span>
                </div>
              )}

              {/* Action Bar */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <Lock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                  <span>100% On-Device Boundary</span>
                </div>

                <button
                  type="button"
                  onClick={handleExecutePrivacyShield}
                  disabled={
                    isPrivacyShieldLoading ||
                    isCloudLoading ||
                    (!clinicalText.trim() && !uploadedImage)
                  }
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs shadow-md shadow-teal-600/20 active:scale-[0.99] transition disabled:opacity-50 cursor-pointer shrink-0"
                >
                  {isPrivacyShieldLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Sanitizing on Device...</span>
                    </>
                  ) : (
                    <>
                      <Cpu className="w-4 h-4" />
                      <span>Sanitize on Device</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Tabbed Patient Care Brief */}
          <div className="lg:col-span-7">
            <PatientCareBrief
              title={currentTitle}
              stage1Result={stage1Result}
              stage2Result={stage2Result}
              isPrivacyShieldLoading={isPrivacyShieldLoading}
              isCloudLoading={isCloudLoading}
              streamingRecoveryText={streamingRecoveryText}
              onProceedToCloudStage={handleExecuteCloudRecovery}
              onSaveBrief={handleSaveToFirestore}
              isSaving={isSaving}
              hasSaved={hasSaved}
              onExportMarkdown={handleExportMarkdown}
              onCopySummary={handleCopySummary}
            />
          </div>
        </div>
      </main>

      {/* Docked Collapsible Hybrid Telemetry Inspector Bar */}
      <TelemetryInspector
        stage1Telemetry={stage1Result?.telemetry || null}
        stage2Telemetry={stage2Result?.telemetry || null}
        remoteConfigDefault={remoteConfigDefault}
        userUid={userUid}
        routingMode={routingMode}
      />

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
    </div>
  );
}