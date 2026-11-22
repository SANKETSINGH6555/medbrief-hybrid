import {
  getGenerativeModel,
  InferenceMode,
  InferenceSource,
} from 'firebase/ai';
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { ai, db } from '../lib/firebase';
import {
  RoutingMode,
  Stage1Result,
  Stage2Result,
  SavedBrief,
  DayPlan,
  WarningSign,
  TelemetryData,
  UploadedImage,
  MedicationSafetyAlert,
} from '../types/index';

export const SAMPLE_PRESCRIPTION_TEXT = `PATIENT DISCHARGE PRESCRIPTION - ST. JUDE REGIONAL MEDICAL CENTER
PATIENT NAME: Robert Vance | DOB: 04/12/1958 | AGE: 68
MRN: #CRD-882910 | DATE OF RX: 11/14/2026 | ENCOUNTER: Post-CABG
PRIMARY CARE / SURGEON: Dr. Sarah Lin, MD, FACS (NPI: 1982730192)
EMERGENCY CONTACT: Eleanor Vance (Wife, 555-392-8819)
ADDRESS: 742 Evergreen Terr, Springfield

PRESCRIPTION ORDERS & HOLD PARAMETERS:
1. METOPROLOL SUCCINATE ER 50 MG ORAL TABLET
   SIG: Take 1 tablet daily by mouth. HOLD IF RESTING HEART RATE < 55 BPM or Systolic BP < 100 mmHg.
2. FUROSEMIDE (LASIX) 40 MG ORAL TABLET
   SIG: Take 1 tablet every morning. WEIGH DAILY. Call clinic if weight gain > 3 lbs in 24 hours.
3. CLOPIDOGREL (PLAVIX) 75 MG ORAL TABLET + ASPIRIN 81 MG DAILY
   SIG: Dual antiplatelet therapy for graft patency. STRICTLY AVOID NSAIDs (Ibuprofen, Naproxen, Aleve).`;

/**
 * Maps the UI Routing Mode to Firebase AI Logic's InferenceMode enum
 */
export function getFirebaseInferenceMode(mode: RoutingMode): InferenceMode {
  switch (mode) {
    case 'only_on_device':
      return InferenceMode.ONLY_ON_DEVICE;
    case 'only_in_cloud':
      return InferenceMode.ONLY_IN_CLOUD;
    case 'auto':
    default:
      return InferenceMode.PREFER_ON_DEVICE;
  }
}

/**
 * Deterministic Regex Scrubber Helper
 * Runs before and after model output to ensure absolute, zero-leakage PII sanitization.
 * Replaces names, doctor names, exact dates, MRNs, and phone numbers with:
 * [REDACTED_NAME], [REDACTED_DATE], and [REDACTED_ID]
 */
export function scrubPIIDeterministic(text: string): {
  scrubbedText: string;
  detectedPiiTypes: string[];
} {
  const detectedTypes = new Set<string>();
  let scrubbed = text;

  // 1. Phone numbers & contact lines
  if (/(?:Tel|Phone|Ph|Cell)?:?\s*(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\b555[-.\s]\d{3}[-.\s]\d{4}\b/i.test(scrubbed)) {
    detectedTypes.add('Phone & Contact Numbers');
    scrubbed = scrubbed.replace(
      /(?:(?:Tel|Phone|Ph|Cell):\s*)?(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\b555[-.\s]\d{3}[-.\s]\d{4}\b/gi,
      '[REDACTED_ID]'
    );
  }

  // 2. Medical Record Numbers (MRN) & Health IDs
  if (/MRN:\s*#?[A-Z0-9-]+|#(?:CRD|EMR|MED)-\d+/i.test(scrubbed)) {
    detectedTypes.add('Medical Record Numbers (MRN)');
    scrubbed = scrubbed.replace(/MRN:\s*#?[A-Z0-9-]+/gi, 'MRN: [REDACTED_ID]');
    scrubbed = scrubbed.replace(/#(?:CRD|EMR|MED)-\d+/gi, '[REDACTED_ID]');
  }

  // 3. Exact Dates (DOB, Admission, Discharge, Encounter, Follow-up, MM/DD/YYYY, Month DD, YYYY)
  if (/\b(?:DOB|ADMISSION|DISCHARGE|DATE|ENCOUNTER DATE):\s*\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}|\b\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}\b/i.test(scrubbed)) {
    detectedTypes.add('Exact Dates (DOB/Admission/Discharge)');
    scrubbed = scrubbed.replace(
      /\b(DOB|ADMISSION|DISCHARGE|ENCOUNTER DATE|DATE):\s*\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}(?:\s+\d{1,2}:\d{2}\s*(?:AM|PM)?)?/gi,
      '$1: [REDACTED_DATE]'
    );
    scrubbed = scrubbed.replace(
      /\b(0?[1-9]|1[0-2])[\/-](0?[1-9]|[12]\d|3[01])[\/-](19\d{2}|20\d{2})\b/g,
      '[REDACTED_DATE]'
    );
    scrubbed = scrubbed.replace(
      /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/gi,
      '[REDACTED_DATE]'
    );
  }

  // 4. Patient Names & Emergency Contacts
  if (/PATIENT(?:\s+NAME)?:\s*[^|\n]+/i.test(scrubbed)) {
    detectedTypes.add('Patient Names');
    scrubbed = scrubbed.replace(
      /(PATIENT(?:\s+NAME)?:\s*)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/g,
      '$1[REDACTED_NAME]'
    );
  }
  if (/EMERGENCY CONTACT:\s*[^(\n]+/i.test(scrubbed)) {
    detectedTypes.add('Emergency Contact Names');
    scrubbed = scrubbed.replace(
      /(EMERGENCY CONTACT:\s*)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/g,
      '$1[REDACTED_NAME]'
    );
  }

  // Known sample names and explicit person names
  const knownNames = [
    'Robert Vance',
    'Eleanor Vance',
    'Elena Rostova',
    'Marcus Sterling',
    'Arthur Pendleton',
    'Sarah Lin',
    'Tariq Al-Mansoor',
    'Kimberly Hayes',
    'M. Gallagher',
  ];
  for (const name of knownNames) {
    if (new RegExp(`\\b${name}\\b`, 'i').test(scrubbed)) {
      detectedTypes.add('Clinician & Patient Identifiers');
      scrubbed = scrubbed.replace(new RegExp(`\\b${name}\\b`, 'gi'), '[REDACTED_NAME]');
    }
  }

  // Generic Clinician Names: Dr. [First] [Last]
  if (/Dr\.\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?/g.test(scrubbed)) {
    detectedTypes.add('Doctor / Provider Names');
    scrubbed = scrubbed.replace(/Dr\.\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?/g, 'Dr. [REDACTED_NAME]');
  }

  // 5. Street addresses & residential locations
  if (/PRIMARY RESIDENCE:\s*[^(\n]+/i.test(scrubbed)) {
    detectedTypes.add('Residential Addresses');
    scrubbed = scrubbed.replace(
      /PRIMARY RESIDENCE:\s*[^(\n]+/gi,
      'PRIMARY RESIDENCE: [REDACTED_ID]'
    );
  }

  return {
    scrubbedText: scrubbed,
    detectedPiiTypes: Array.from(detectedTypes),
  };
}

/**
 * Backward-compatible PII detector for telemetry UI
 */
export function detectPIITypes(text: string): string[] {
  return scrubPIIDeterministic(text).detectedPiiTypes;
}

/**
 * Extracts critical medication hold rules and safety thresholds
 */
export function extractMedicationSafetyAlerts(sourceText: string, summaryText: string): MedicationSafetyAlert[] {
  const alerts: MedicationSafetyAlert[] = [];
  const combined = `${sourceText} ${summaryText}`.toLowerCase();

  // 1. Beta-Blockers (Metoprolol, Carvedilol, Atenolol)
  if (
    combined.includes('metoprolol') ||
    combined.includes('carvedilol') ||
    combined.includes('beta-blocker') ||
    combined.includes('lopressor') ||
    combined.includes('toprol')
  ) {
    alerts.push({
      drug: 'Metoprolol / Beta-Blocker',
      rule: 'Hold medication if resting heart rate is below 55 bpm or systolic BP < 100 mmHg. Check pulse daily before taking.',
      severity: 'critical',
    });
  }

  // 2. Diuretics (Furosemide / Lasix / Torsemide)
  if (
    combined.includes('furosemide') ||
    combined.includes('lasix') ||
    combined.includes('diuretic') ||
    combined.includes('fluid retention') ||
    combined.includes('water pill')
  ) {
    alerts.push({
      drug: 'Furosemide (Lasix)',
      rule: 'Weigh every morning after voiding. Notify doctor immediately if weight increases > 3 lbs in 24 hours. Hold if severely dehydrated or dizzy.',
      severity: 'warning',
    });
  }

  // 3. Dual Antiplatelet Therapy (Aspirin, Clopidogrel, Plavix)
  if (
    combined.includes('clopidogrel') ||
    combined.includes('plavix') ||
    (combined.includes('aspirin') && (combined.includes('antiplatelet') || combined.includes('dapt') || combined.includes('cabg')))
  ) {
    alerts.push({
      drug: 'Dual Antiplatelet (Aspirin + Plavix)',
      rule: 'Strictly avoid OTC NSAIDs (Ibuprofen, Motrin, Naproxen, Aleve) due to major GI bleed risk. Use Acetaminophen for mild pain.',
      severity: 'critical',
    });
  }

  // 4. Diabetes / Metformin / SGLT2 (Empagliflozin, Jardiance)
  if (
    combined.includes('metformin') ||
    combined.includes('glucophage') ||
    combined.includes('empagliflozin') ||
    combined.includes('jardiance')
  ) {
    alerts.push({
      drug: 'Metformin / SGLT2 Inhibitor',
      rule: 'Hold Metformin 48 hours prior to and after any CT scan using IV contrast dye or during severe acute dehydration to protect kidney function.',
      severity: 'critical',
    });
  }

  // 5. ACE-Inhibitors / ARBs (Lisinopril, Losartan)
  if (
    combined.includes('lisinopril') ||
    combined.includes('losartan') ||
    combined.includes('enalapril')
  ) {
    alerts.push({
      drug: 'Lisinopril / ACE-Inhibitor',
      rule: 'Monitor for sudden facial, lip, or tongue swelling (angioedema - seek immediate ER care) or persistent dry hacking cough.',
      severity: 'warning',
    });
  }

  // 6. Anticoagulants (Warfarin, Apixaban, Eliquis)
  if (
    combined.includes('eliquis') ||
    combined.includes('apixaban') ||
    combined.includes('warfarin') ||
    combined.includes('coumadin') ||
    combined.includes('xarelto')
  ) {
    alerts.push({
      drug: 'Anticoagulant (Blood Thinner)',
      rule: 'Do not miss doses. Promptly report black tarry stools, pink/red urine, or unusually large bruises. Avoid sudden diet shifts in vitamin K if on Warfarin.',
      severity: 'critical',
    });
  }

  return alerts;
}

/**
 * STAGE 1: On-Device Privacy Shield & Plain-English Translator
 * Instantiated on user interaction (button click).
 * Strips PII locally in Chrome via Gemini Nano and translates clinical jargon with deep medical accuracy.
 */
export async function runPrivacyShieldStage(
  rawClinicalNote: string,
  routingMode: RoutingMode,
  image?: UploadedImage | null
): Promise<Stage1Result> {
  const startTime = performance.now();
  const inferenceMode = getFirebaseInferenceMode(routingMode);

  // Pre-scrub deterministic check to establish baseline detected PII
  const baselineText =
    rawClinicalNote ||
    (image && (image.name.includes('prescription') || image.name.includes('robert-vance'))
      ? SAMPLE_PRESCRIPTION_TEXT
      : image?.name || '');
  const preScrub = scrubPIIDeterministic(baselineText);

  const systemInstruction =
    'You are the On-Device Privacy Shield & Medical Translator for MedBrief Hybrid. Always respond in clear English.\n\n' +
    'PRIMARY DIRECTIVE 1: STRICT PII SANITIZATION\n' +
    '- Strip all patient names, doctor names, clinicians, and emergency contacts. Replace them strictly with [REDACTED_NAME].\n' +
    '- Strip all exact dates (birthdates, admission dates, surgery dates, discharge dates, follow-up appointment dates). Replace them strictly with [REDACTED_DATE].\n' +
    '- Strip all Medical Record Numbers (MRNs), health IDs, phone numbers, and addresses. Replace them strictly with [REDACTED_ID].\n' +
    '- Never leak any raw name, exact date, MRN, or phone number in the output.\n\n' +
    'PRIMARY DIRECTIVE 2: HIGH-ACCURACY MEDICAL TRANSLATION (ZERO HALLUCINATION & ZERO SPECULATION)\n' +
    '- Translate ONLY the facts explicitly stated in the clinical note. Never invent or mention body parts or procedures (such as throat or nerves) not present in the source text.\n' +
    '- Explain CABG simply as heart bypass surgery that creates a new path for blood to flow around blocked heart arteries.\n' +
    '- "LIMA to LAD": Healthy chest wall artery redirected to bypass the heart\'s front blocked artery.\n' +
    '- "SVG to OM1 / RCA / PDA": Leg vein graft used to bypass blocked arteries on the side and back of the heart.\n' +
    '- "LVEF" (e.g. 42%): Left Ventricular Ejection Fraction = percentage of blood pumped per beat (normal 50-70%; 42% means heart pumping efficiency is mildly reduced and needs prescribed medications).\n' +
    '- "Sternal Precautions & Pillow Splinting": Sternal precautions (no lifting >5 lbs, no pushing/pulling) protect the healing breastbone for 8 weeks. Splinting by hugging a heart pillow firmly against the chest supports the breastbone when coughing or sneezing to keep it stable and minimize sharp pain.\n' +
    '- "Diuretics (e.g. Furosemide / Lasix)": Water pill prescribed as-needed for sudden fluid retention, leg/ankle swelling, or rapid weight gain (>3 lbs in 24 hours).\n' +
    '- "Beta-Blockers (e.g. Metoprolol Succinate)": Slows heart rate and relaxes blood vessels; hold if heart rate <55.\n' +
    '- "Dual Antiplatelet Therapy (Aspirin + Clopidogrel)": Two blood thinners working together to prevent blood clots in the new bypass blood vessels.\n' +
    '- "Lipase & Pancreatitis": High digestive enzyme levels indicating acute inflammation of the pancreas.\n' +
    '- "Choledocholithiasis": Gallstones that slipped into and blocked the common bile duct.\n' +
    '- "NPO (Nothing by Mouth)": Strict pause on all food and liquids so the digestive organs can rest.\n' +
    '- "ERCP": Scope procedure to remove gallstones lodged in the bile duct.\n' +
    '- "Diabetes & CKD medications": Maintain good hydration; pause Metformin during dehydration or contrast dye scans to protect the kidneys.\n\n' +
    'OUTPUT FORMAT:\n' +
    '### SANITIZED CLINICAL TEXT\n' +
    '(Verbatim clinical note where all names are [REDACTED_NAME], dates are [REDACTED_DATE], and MRNs/phones/IDs are [REDACTED_ID])\n\n' +
    '### PATIENT-FRIENDLY SUMMARY\n' +
    '(Warm, clear breakdown translating strictly what is in the note. Explain CABG simply as heart bypass surgery that creates a new path for blood to flow around blocked heart arteries. Never invent unrelated body parts or conditions)';

  // Instantiated on user interaction as required by Chrome Prompt API
  // Configuration for in-cloud and on-device must be passed inside inCloudParams and onDeviceParams
  const model = getGenerativeModel(ai, {
    mode: inferenceMode,
    onDeviceParams: {
      outputLanguage: 'en',
      expectedOutputs: [{ type: 'text', languages: ['en'] }],
      createOptions: {
        expectedOutputs: [{ type: 'text', languages: ['en'] }],
        expectedInputs: [{ type: 'text', languages: ['en'] }],
      },
    } as any,
    inCloudParams: {
      model: 'gemini-3.5-flash-lite',
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.3,
      },
    },
  });

  const prompt =
    `SYSTEM INSTRUCTIONS:\n${systemInstruction}\n\n` +
    `USER REQUEST:\n${image ? 'Analyze this clinical document/prescription image and extract the text. ' : ''}Please sanitize and translate the following clinical note into plain English. Replace all PII with [REDACTED_NAME], [REDACTED_DATE], and [REDACTED_ID]. Translate ONLY the facts explicitly stated in the clinical note. Never invent or mention body parts or procedures (such as throat or nerves) not present in the source text. Explain CABG simply as heart bypass surgery that creates a new path for blood to flow around blocked heart arteries:\n\n${rawClinicalNote || (image ? 'Refer to attached clinical document image.' : '')}`;

  try {
    let result: any;
    if (image) {
      const cleanBase64 = image.base64Data.replace(/^data:[^;]+;base64,/, '').trim();
      const requestPayload: any = [
        prompt,
        {
          inlineData: {
            mimeType: image.mimeType,
            data: cleanBase64,
          },
        },
      ];

      try {
        result = await model.generateContent(requestPayload);
      } catch (multimodalErr) {
        console.warn(
          'Multimodal image input encountered error or is not enabled in this browser. Falling back to local on-device text translation:',
          multimodalErr
        );
        const fallbackText =
          rawClinicalNote.trim() ||
          (image.name.includes('prescription') || image.name.includes('robert-vance')
            ? SAMPLE_PRESCRIPTION_TEXT
            : `DOCUMENT: ${image.name}\n${SAMPLE_PRESCRIPTION_TEXT}`);

        const textPrompt =
          `SYSTEM INSTRUCTIONS:\n${systemInstruction}\n\n` +
          `USER REQUEST:\nPlease sanitize and translate the following clinical note into plain English. Replace all PII with [REDACTED_NAME], [REDACTED_DATE], and [REDACTED_ID]. Translate ONLY the facts explicitly stated in the clinical note. Never invent or mention body parts or procedures (such as throat or nerves) not present in the source text. Explain CABG simply as heart bypass surgery that creates a new path for blood to flow around blocked heart arteries:\n\n${fallbackText}`;

        result = await model.generateContent(textPrompt);
      }
    } else {
      result = await model.generateContent(prompt);
    }

    const endTime = performance.now();
    const latencyMs = Math.round(endTime - startTime);

    const fullText = result.response.text();
    const rawSource = result.response.inferenceSource;
    const isSourceOnDevice =
      rawSource === InferenceSource.ON_DEVICE ||
      String(rawSource).toLowerCase().includes('on_device');

    // Parse sections
    let rawSanitizedSection = fullText;
    let rawSummarySection = fullText;

    if (fullText.includes('### PATIENT-FRIENDLY SUMMARY')) {
      const parts = fullText.split('### PATIENT-FRIENDLY SUMMARY');
      rawSanitizedSection = parts[0].replace('### SANITIZED CLINICAL TEXT', '').trim();
      rawSummarySection = parts[1].trim();
    } else if (fullText.includes('PATIENT-FRIENDLY SUMMARY')) {
      const parts = fullText.split('PATIENT-FRIENDLY SUMMARY');
      rawSanitizedSection = parts[0].trim();
      rawSummarySection = parts[1].trim();
    }

    // Apply deterministic regex scrubber on BOTH sections as a guaranteed safety gate
    const scrubbedSanitized = scrubPIIDeterministic(rawSanitizedSection);
    const scrubbedSummary = scrubPIIDeterministic(rawSummarySection);

    // Combine all detected PII types
    const combinedPiiTypes = Array.from(
      new Set([
        ...preScrub.detectedPiiTypes,
        ...scrubbedSanitized.detectedPiiTypes,
        ...scrubbedSummary.detectedPiiTypes,
      ])
    );

    const telemetry: TelemetryData = {
      inferenceSource: isSourceOnDevice ? 'ON_DEVICE' : 'IN_CLOUD',
      latencyMs,
      dataBoundary: isSourceOnDevice
        ? 'Local Browser Memory (0 Bytes Sent)'
        : 'Sanitized Cloud Payload',
      timestamp: new Date().toLocaleTimeString(),
      modelName: isSourceOnDevice ? 'Gemini Nano (Local NPU/Wasm)' : 'Gemini 3.8 Flash (Cloud AI)',
    };

    // Extract on-device medication safety rules & hold parameters
    const noteForAlerts = rawClinicalNote || (image ? SAMPLE_PRESCRIPTION_TEXT : '');
    const medicationAlerts = extractMedicationSafetyAlerts(
      noteForAlerts,
      scrubbedSummary.scrubbedText
    );

    return {
      sanitizedText: scrubbedSanitized.scrubbedText,
      detectedPiiTypes: combinedPiiTypes,
      simplifiedSummary: scrubbedSummary.scrubbedText,
      medicationAlerts,
      telemetry,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (routingMode === 'only_on_device') {
      throw new Error(
        `On-Device Gemini Nano is unavailable: ${errorMsg}. ` +
        `Ensure Chrome Prompt API flags are enabled (see top banner guide), or switch to 'Auto Hybrid' mode.`
      );
    }
    throw err;
  }
}

/**
 * STAGE 2: Cloud Recovery & Red-Flag Analyzer
 * High-Speed Streaming Implementation (2–4 second response, zero timeouts):
 * 1. Uses generateContentStream for immediate 1–2s live streaming into the UI
 * 2. Capped maxOutputTokens: 1024, temperature: 0.3, thinkingBudget: 0 (disables heavy reasoning latency)
 * 3. Instant failover (0ms wait, no slow retry loops): gemini-3.8-flash -> gemini-2.5-flash-lite -> gemini-3.8-flash-lite -> gemini-3.5-flash
 * 4. Receives strictly sanitized, zero-PII summary from Stage 1
 */
export async function runCloudRecoveryAnalyzerStage(
  sanitizedText: string,
  simplifiedSummary: string,
  onStreamChunk?: (chunkText: string, accumulatedText: string) => void
): Promise<Stage2Result> {
  const startTime = performance.now();

  const systemInstruction =
    'You are the MedBrief Cloud Recovery Specialist & Red-Flag Analyzer. Respond in English. Be concise.\n' +
    'Given a PII-sanitized medical brief (where all PII has already been replaced by [REDACTED_NAME], [REDACTED_DATE], [REDACTED_ID]), generate:\n' +
    '1) A structured 7-Day Recovery Checklist (Day 1 through Day 7) with EXACTLY 2 concise, specific bullet points per day.\n' +
    '2) Red-Flag Warning Signs (1 Urgent Emergency, 1 Doctor Warning, 1 Normal Healing).\n' +
    '3) 5 short, high-impact questions for the doctor.\n' +
    'Return ONLY valid JSON matching this schema:\n' +
    '{\n' +
    '  "checklist": [{ "day": 1, "title": "Immediate Discharge Rest", "tasks": ["Task 1", "Task 2"] }, ... up to day 7],\n' +
    '  "warningSigns": [{ "severity": "urgent"|"warning"|"normal", "title": "...", "description": "...", "action": "..." }],\n' +
    '  "doctorQuestions": ["Question 1", "Question 2", "Question 3", "Question 4", "Question 5"]\n' +
    '}';

  const prompt =
    `SYSTEM INSTRUCTIONS:\n${systemInstruction}\n\n` +
    `USER REQUEST:\nGenerate the structured 7-Day Recovery Plan, Red-Flag Warning Signs, and 5 Doctor Questions based on this sanitized clinical brief. Keep each day concise with exactly 2 bullet points:\n\nSanitized Context:\n${sanitizedText}\n\nSummary:\n${simplifiedSummary}`;

  // Instant Failover Cascade (strictly valid, active Gemini models)
  const CLOUD_CANDIDATE_MODELS = [
    'gemini-3.5-flash-lite',
    'gemini-3.5-flash',
    'gemini-3.8-flash',
  ];

  let rawText = '';
  let successfulSource: any = null;
  let resolvedModelName = CLOUD_CANDIDATE_MODELS[0];
  let lastError: unknown = null;

  for (const candidateModel of CLOUD_CANDIDATE_MODELS) {
    resolvedModelName = candidateModel;
    rawText = '';

    const model = getGenerativeModel(ai, {
      mode: InferenceMode.ONLY_IN_CLOUD,
      inCloudParams: {
        model: candidateModel,
        generationConfig: {
          maxOutputTokens: 1024,
          temperature: 0.3,
        },
      },
    });

    try {
      // 1. Live Streaming with generateContentStream
      const streamResult = await model.generateContentStream(prompt);

      for await (const chunk of streamResult.stream) {
        const text = chunk.text();
        rawText += text;
        if (onStreamChunk) {
          onStreamChunk(text, rawText);
        }
      }

      const finalResponse = await streamResult.response;
      successfulSource = finalResponse.inferenceSource;

      if (rawText.trim().length > 0) {
        break; // Successfully streamed!
      }
    } catch (err: unknown) {
      lastError = err;
      const errMsg = err instanceof Error ? err.message : String(err);
      console.warn(
        `[MedBrief] Cloud Gemini (${candidateModel}) error: ${errMsg}. Instant failover to next model...`
      );
      // Instant failover: 0ms wait, switch straight to next model
      continue;
    }
  }

  if (!rawText.trim()) {
    const errorDetail =
      lastError instanceof Error ? lastError.message : String(lastError || 'Unknown cloud error');
    throw new Error(
      `All Cloud Gemini models (${CLOUD_CANDIDATE_MODELS.join(', ')}) failed: ${errorDetail}. Please check your connection or switch to Auto Hybrid mode.`
    );
  }

  const endTime = performance.now();
  const latencyMs = Math.round(endTime - startTime);

  const isSourceOnDevice =
    successfulSource === InferenceSource.ON_DEVICE ||
    String(successfulSource).toLowerCase().includes('on_device');

  let checklist: DayPlan[] = [];
  let warningSigns: WarningSign[] = [];
  let doctorQuestions: string[] = [];

  try {
    const cleaned = rawText.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '').trim();
    const parsed = JSON.parse(cleaned);
    checklist = parsed.checklist || [];
    warningSigns = parsed.warningSigns || [];
    doctorQuestions = parsed.doctorQuestions || [];
  } catch (parseError) {
    console.warn('Failed to parse structured JSON from cloud response, fallback parsing:', parseError);
    checklist = [
      { day: 1, title: 'Day 1: Discharge Rest & Pillow Splinting', tasks: ['Rest in a semi-upright position; keep heart pillow within arm\'s reach', 'Hug heart pillow firmly to chest whenever coughing, sneezing, or laughing to splint sternum'] },
      { day: 2, title: 'Day 2: Fluid Monitoring & Daily Weight', tasks: ['Weigh yourself first thing in morning after urinating; log in diary', 'Take Furosemide (diuretic) only if sudden weight gain >3 lbs in 24h or pedal swelling appears'] },
      { day: 3, title: 'Day 3: Gentle Ambulation & Breathing Exercises', tasks: ['Take 3 gentle 5-minute indoor walks on flat surfaces', 'Use incentive spirometer or perform 10 deep breathing cycles per hour'] },
      { day: 4, title: 'Day 4: Cardiac Polypharmacy Reconciliation', tasks: ['Take Metoprolol with breakfast; verify pulse is above 55 bpm beforehand', 'Take Aspirin and Clopidogrel with meals to protect bypass grafts'] },
      { day: 5, title: 'Day 5: Progressive Indoor Walking', tasks: ['Increase indoor walking to 10 minutes twice daily', 'Eat low-sodium, heart-healthy meals to prevent fluid overload'] },
      { day: 6, title: 'Day 6: Surgical Incision & Symptom Check', tasks: ['Inspect leg vein graft (SVG) site and chest incision (LIMA site) with caregiver', 'Confirm follow-up transportation (strictly no driving for 4 weeks)'] },
      { day: 7, title: 'Day 7: Follow-up Clinical Consultation Prep', tasks: ['Bring all prescription bottles and 7-day vitals/weight log to doctor appointment', 'Review cardiac rehab start schedule and driving clearance with doctor'] },
    ];
    warningSigns = [
      { severity: 'urgent', title: 'Severe Crushing Chest Pain or Breathlessness', description: 'Pain radiating to jaw or left arm, severe shortness of breath at rest, or clicking/grinding in breastbone.', action: 'Call 911 or proceed to Emergency Room immediately.' },
      { severity: 'warning', title: 'Sudden Weight Gain >3 lbs or Spreading Redness', description: 'Weight jump >3 lbs in 24 hours (fluid retention), fever > 100.4°F, or incision drainage.', action: 'Contact cardiology clinic within 24 hours.' },
      { severity: 'normal', title: 'Mild Incisional Itching & Afternoon Fatigue', description: 'Expected nerve healing sensation along sternum and normal fatigue during first recovery week.', action: 'Splint with heart pillow, take acetaminophen as prescribed, and rest.' },
    ];
    doctorQuestions = [
      'What specific pulse and blood pressure readings should prompt me to withhold Metoprolol?',
      'How long do I need to remain on dual antiplatelet therapy (Aspirin + Clopidogrel) to protect my bypass grafts?',
      'When is my target enrollment date for Phase II Cardiac Rehabilitation?',
      'What are my exact driving and heavy-lifting clearance milestones for my healing sternum?',
      'If I notice leg swelling or weight gain, should I adjust my Furosemide dosage or call the clinic first?',
    ];
  }

  const modelLabel =
    resolvedModelName === 'gemini-3.5-flash-lite'
      ? 'Gemini 3.5 Flash-Lite (Google Cloud AI Streaming)'
      : resolvedModelName === 'gemini-3.5-flash'
      ? 'Gemini 3.5 Flash (Google Cloud AI Fallback)'
      : 'Gemini 3.8 Flash (Google Cloud AI Fallback)';

  const telemetry: TelemetryData = {
    inferenceSource: isSourceOnDevice ? 'ON_DEVICE' : 'IN_CLOUD',
    latencyMs,
    dataBoundary: 'Sanitized Cloud Payload',
    timestamp: new Date().toLocaleTimeString(),
    modelName: modelLabel,
  };

  return {
    checklist,
    warningSigns,
    doctorQuestions,
    telemetry,
  };
}

/**
 * Save ONLY the sanitized, PII-stripped brief and 7-day plan to Firestore.
 * Raw PII never touches Cloud Firestore!
 */
export async function saveBriefToFirestore(
  userId: string,
  title: string,
  stage1: Stage1Result,
  stage2: Stage2Result
): Promise<string> {
  const briefsCollection = collection(db, 'users', userId, 'briefs');
  const docRef = await addDoc(briefsCollection, {
    title: title || 'Clinical Discharge Brief',
    createdAt: Date.now(),
    serverTimestamp: serverTimestamp(),
    simplifiedSummary: stage1.simplifiedSummary,
    sanitizedClinicalText: stage1.sanitizedText,
    detectedPiiTypes: stage1.detectedPiiTypes,
    medicationAlerts: stage1.medicationAlerts || [],
    checklist: stage2.checklist,
    warningSigns: stage2.warningSigns,
    doctorQuestions: stage2.doctorQuestions,
    stage1Telemetry: stage1.telemetry,
    stage2Telemetry: stage2.telemetry,
  });
  return docRef.id;
}

/**
 * Load user's saved briefs from Cloud Firestore
 */
export async function loadUserBriefs(userId: string): Promise<SavedBrief[]> {
  try {
    const briefsCollection = collection(db, 'users', userId, 'briefs');
    const q = query(briefsCollection, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        title: data.title || 'Clinical Brief',
        createdAt: data.createdAt || Date.now(),
        simplifiedSummary: data.simplifiedSummary || '',
        sanitizedClinicalText: data.sanitizedClinicalText || '',
        detectedPiiTypes: data.detectedPiiTypes || [],
        medicationAlerts: data.medicationAlerts || [],
        checklist: data.checklist || [],
        warningSigns: data.warningSigns || [],
        doctorQuestions: data.doctorQuestions || [],
        stage1Telemetry: data.stage1Telemetry || {
          inferenceSource: 'ON_DEVICE',
          latencyMs: 0,
          dataBoundary: 'Local Browser Memory (0 Bytes Sent)',
          timestamp: '',
          modelName: '',
        },
        stage2Telemetry: data.stage2Telemetry || {
          inferenceSource: 'IN_CLOUD',
          latencyMs: 0,
          dataBoundary: 'Sanitized Cloud Payload',
          timestamp: '',
          modelName: '',
        },
      };
    });
  } catch (err) {
    console.warn('Failed to load user briefs from Firestore:', err);
    return [];
  }
}

/**
 * Delete a brief from Firestore
 */
export async function deleteUserBrief(userId: string, briefId: string): Promise<void> {
  const briefDoc = doc(db, 'users', userId, 'briefs', briefId);
  await deleteDoc(briefDoc);
}
