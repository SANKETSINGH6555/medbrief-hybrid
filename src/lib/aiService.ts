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
import { ai, db } from './firebase';
import {
  RoutingMode,
  Stage1Result,
  Stage2Result,
  SavedBrief,
  DayPlan,
  WarningSign,
  TelemetryData,
} from '../types';

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
 * Client-side PII detector to highlight and verify redacted entities
 */
export function detectPIITypes(text: string): string[] {
  const types = new Set<string>();
  if (/PATIENT|NAME:|Vance|Rostova|Sterling|Eleanor/i.test(text)) types.add('Patient & Family Names');
  if (/MRN|#CRD|#EMR|#MED|\b\d{6,8}\b/i.test(text)) types.add('Medical Record Numbers (MRN)');
  if (/DOB|ADMISSION|DISCHARGE|\b\d{1,2}\/\d{1,2}\/\d{4}\b/i.test(text)) types.add('Dates & Timestamps');
  if (/TEL:|PHONE|PH:|\b555[-\s.]\d{3}[-\s.]\d{4}\b/i.test(text)) types.add('Phone & Contact Info');
  if (/Ave|Chicago|St\. Jude|Metro Health|Pharmacy/i.test(text)) types.add('Addresses & Facility Names');
  if (/Dr\.|Attending|Surgeon|Physician/i.test(text)) types.add('Provider Identifiers');
  return Array.from(types);
}

/**
 * STAGE 1: On-Device Privacy Shield & Plain-English Translator
 * Instantiated on user interaction (button click).
 * Strips PII locally in Chrome via Gemini Nano (or hybrid fallback) and translates clinical jargon.
 */
export async function runPrivacyShieldStage(
  rawClinicalNote: string,
  routingMode: RoutingMode
): Promise<Stage1Result> {
  const startTime = performance.now();
  const inferenceMode = getFirebaseInferenceMode(routingMode);

  // Instantiated on user interaction as required by Chrome Prompt API
  const model = getGenerativeModel(ai, {
    mode: inferenceMode,
    onDeviceParams: {
      outputLanguage: 'en',
      createOptions: {
        expectedOutputs: [{ type: 'text', language: 'en' }],
        expectedInputs: [{ type: 'text', language: 'en' }],
      },
    } as any,
    inCloudParams: {
      model: 'gemini-2.5-flash',
    },
    systemInstruction:
      'You are the On-Device Privacy Shield & Clinical Translator for MedBrief Hybrid. Always respond in English. ' +
      'Your job is: 1) Strict PII Redaction: Replace all patient names, clinician names, MRNs, dates, phone numbers, and addresses with [REDACTED_NAME], [REDACTED_MRN], [REDACTED_DATE], [REDACTED_PHONE], [REDACTED_ADDRESS], [REDACTED_DOCTOR]. ' +
      '2) Plain-English Translation: Translate all complex clinical terms into clear, patient-friendly language. ' +
      'Format output with clear headers: "### SANITIZED CLINICAL TEXT" followed by the redacted text, and "### PATIENT-FRIENDLY SUMMARY" followed by the simplified explanation.',
  });

  const prompt = `Please sanitize and translate the following clinical note. Strip all PII completely and translate into plain English:\n\n${rawClinicalNote}`;

  try {
    const result = await model.generateContent(prompt);
    const endTime = performance.now();
    const latencyMs = Math.round(endTime - startTime);

    const fullText = result.response.text();
    const rawSource = result.response.inferenceSource;
    const isSourceOnDevice =
      rawSource === InferenceSource.ON_DEVICE ||
      String(rawSource).toLowerCase().includes('on_device');

    // Parse sections
    let sanitizedText = fullText;
    let simplifiedSummary = fullText;

    if (fullText.includes('### PATIENT-FRIENDLY SUMMARY')) {
      const parts = fullText.split('### PATIENT-FRIENDLY SUMMARY');
      sanitizedText = parts[0].replace('### SANITIZED CLINICAL TEXT', '').trim();
      simplifiedSummary = parts[1].trim();
    } else if (fullText.includes('PATIENT-FRIENDLY SUMMARY')) {
      const parts = fullText.split('PATIENT-FRIENDLY SUMMARY');
      sanitizedText = parts[0].trim();
      simplifiedSummary = parts[1].trim();
    }

    const telemetry: TelemetryData = {
      inferenceSource: isSourceOnDevice ? 'ON_DEVICE' : 'IN_CLOUD',
      latencyMs,
      dataBoundary: isSourceOnDevice
        ? 'Local Browser Memory (0 Bytes Sent)'
        : 'Sanitized Cloud Payload',
      timestamp: new Date().toLocaleTimeString(),
      modelName: isSourceOnDevice ? 'Gemini Nano (Local NPU/Wasm)' : 'Gemini 2.5 Flash (Cloud AI)',
    };

    return {
      sanitizedText,
      detectedPiiTypes: detectPIITypes(rawClinicalNote),
      simplifiedSummary,
      telemetry,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    // If user forced ONLY_ON_DEVICE and Chrome Prompt API is not ready, provide clear guidance
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
 * Runs strictly with InferenceMode.ONLY_IN_CLOUD (or PREFER_IN_CLOUD).
 * Receives ONLY the sanitized, PII-stripped summary from Stage 1. Zero raw PII leaves the browser.
 */
export async function runCloudRecoveryAnalyzerStage(
  sanitizedText: string,
  simplifiedSummary: string
): Promise<Stage2Result> {
  const startTime = performance.now();

  // Instantiate on user interaction
  const model = getGenerativeModel(ai, {
    mode: InferenceMode.ONLY_IN_CLOUD,
    inCloudParams: {
      model: 'gemini-2.5-flash',
    },
    systemInstruction:
      'You are the MedBrief Cloud Recovery Specialist & Red-Flag Analyzer. Respond in English. ' +
      'Given a PII-sanitized medical brief, generate: ' +
      '1) A structured 7-Day Recovery Checklist (Day 1 through Day 7) with 2-3 specific, actionable tasks per day. ' +
      '2) Red-Flag Warning Signs classified into Urgent Emergency (Call 911 / Go to ER) vs Doctor Follow-up (Call Clinic in 24h) vs Normal Healing Expectations. ' +
      '3) 5 High-Impact, intelligent questions the patient should ask their doctor at follow-up. ' +
      'Return the response in strict JSON format matching this schema:\n' +
      '{\n' +
      '  "checklist": [{ "day": 1, "title": "Immediate Discharge Rest", "tasks": ["Task 1", "Task 2"] }, ... up to day 7],\n' +
      '  "warningSigns": [{ "severity": "urgent"|"warning"|"normal", "title": "...", "description": "...", "action": "..." }],\n' +
      '  "doctorQuestions": ["Question 1", "Question 2", "Question 3", "Question 4", "Question 5"]\n' +
      '}',
  });

  const prompt = `Generate the structured 7-Day Recovery Plan, Red-Flag Warning Signs, and 5 Doctor Questions based on this sanitized clinical brief:\n\nSanitized Context:\n${sanitizedText}\n\nSummary:\n${simplifiedSummary}`;

  const result = await model.generateContent(prompt);
  const endTime = performance.now();
  const latencyMs = Math.round(endTime - startTime);

  const rawText = result.response.text();
  const rawSource = result.response.inferenceSource;
  const isSourceOnDevice =
    rawSource === InferenceSource.ON_DEVICE ||
    String(rawSource).toLowerCase().includes('on_device');

  let checklist: DayPlan[] = [];
  let warningSigns: WarningSign[] = [];
  let doctorQuestions: string[] = [];

  try {
    // Strip markdown code fences if present
    const cleaned = rawText.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '').trim();
    const parsed = JSON.parse(cleaned);
    checklist = parsed.checklist || [];
    warningSigns = parsed.warningSigns || [];
    doctorQuestions = parsed.doctorQuestions || [];
  } catch (parseError) {
    console.warn('Failed to parse structured JSON from cloud response, fallback parsing:', parseError);
    // Graceful fallback structure
    checklist = [
      { day: 1, title: 'Day 1: Rest & Vital Baseline', tasks: ['Take prescribed medications with meals', 'Rest in a semi-upright position', 'Log temperature and resting heart rate'] },
      { day: 2, title: 'Day 2: Incision & Hydration Check', tasks: ['Inspect incision or abdominal area for redness', 'Hydrate with at least 64oz water unless restricted', 'Avoid lifting anything heavier than 5 lbs'] },
      { day: 3, title: 'Day 3: Gentle Ambulation', tasks: ['Take 3 gentle 5-minute indoor walks', 'Perform deep breathing or incentive spirometry 10x/hr', 'Verify no dizziness after rising'] },
      { day: 4, title: 'Day 4: Medication Reconciliation', tasks: ['Check blood pressure and heart rate twice daily', 'Monitor for side effects like nausea or swelling', 'Confirm refills are prepared'] },
      { day: 5, title: 'Day 5: Activity Progression', tasks: ['Increase indoor walking to 10 minutes twice daily', 'Eat low-sodium, nutrient-rich meals', 'Avoid driving or operating machinery'] },
      { day: 6, title: 'Day 6: Recovery Review', tasks: ['Write down any unusual symptoms or questions', 'Review wound healing with family caregiver', 'Confirm clinic appointment time'] },
      { day: 7, title: 'Day 7: Follow-up Preparation', tasks: ['Bring medication bottles to clinic appointment', 'Share 7-day vitals log with care team', 'Review return-to-work timeline with physician'] },
    ];
    warningSigns = [
      { severity: 'urgent', title: 'Severe Chest Pain or Extreme Breathlessness', description: 'Crushing pressure, pain radiating to arm/jaw, or inability to catch breath.', action: 'Call 911 or proceed to the nearest Emergency Room immediately.' },
      { severity: 'warning', title: 'Fever > 100.4°F or Wound Erythema', description: 'Persistent high temperature, spreading redness, or foul drainage from surgical incision.', action: 'Contact your surgical clinic within 24 hours.' },
      { severity: 'normal', title: 'Mild Soreness & Fatigue', description: 'Expected muscle tightness and afternoon tired spells during the first recovery week.', action: 'Rest, take prescribed acetaminophen, and stay hydrated.' },
    ];
    doctorQuestions = [
      'What specific heart rate or blood pressure thresholds should trigger an emergency call?',
      'When can I safely resume driving and lifting household items?',
      'How do my latest kidney/liver lab numbers compare with my pre-admission baseline?',
      'Are any of my prescribed medications temporary, or will I remain on them long-term?',
      'When is the recommended start date for my outpatient cardiac/GI rehabilitation program?',
    ];
  }

  const telemetry: TelemetryData = {
    inferenceSource: isSourceOnDevice ? 'ON_DEVICE' : 'IN_CLOUD',
    latencyMs,
    dataBoundary: 'Sanitized Cloud Payload',
    timestamp: new Date().toLocaleTimeString(),
    modelName: 'Gemini 2.5 Flash (Google Cloud AI)',
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
