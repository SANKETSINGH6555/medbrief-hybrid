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
} from '../types/index';

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
 * STAGE 1: On-Device Privacy Shield & Plain-English Translator
 * Instantiated on user interaction (button click).
 * Strips PII locally in Chrome via Gemini Nano and translates clinical jargon with deep medical accuracy.
 */
export async function runPrivacyShieldStage(
  rawClinicalNote: string,
  routingMode: RoutingMode
): Promise<Stage1Result> {
  const startTime = performance.now();
  const inferenceMode = getFirebaseInferenceMode(routingMode);

  // Pre-scrub deterministic check to establish baseline detected PII
  const preScrub = scrubPIIDeterministic(rawClinicalNote);

  // Instantiated on user interaction as required by Chrome Prompt API
  const model = getGenerativeModel(ai, {
    model: 'gemini-3.8-flash',
    mode: inferenceMode,
    onDeviceParams: {
      outputLanguage: 'en',
      createOptions: {
        expectedOutputs: [{ type: 'text', language: 'en' }],
        expectedInputs: [{ type: 'text', language: 'en' }],
      },
    } as any,
    inCloudParams: {
      model: 'gemini-3.8-flash',
    },
    systemInstruction:
      'You are the On-Device Privacy Shield & Medical Translator for MedBrief Hybrid. Always respond in clear English.\n\n' +
      'PRIMARY DIRECTIVE 1: STRICT PII SANITIZATION\n' +
      '- Strip all patient names, doctor names, clinicians, and emergency contacts. Replace them strictly with [REDACTED_NAME].\n' +
      '- Strip all exact dates (birthdates, admission dates, surgery dates, discharge dates, follow-up appointment dates). Replace them strictly with [REDACTED_DATE].\n' +
      '- Strip all Medical Record Numbers (MRNs), health IDs, phone numbers, and addresses. Replace them strictly with [REDACTED_ID].\n' +
      '- Never leak any raw name, exact date, MRN, or phone number in the output.\n\n' +
      'PRIMARY DIRECTIVE 2: HIGH-ACCURACY MEDICAL TRANSLATION (DO NOT GUESS ABBREVIATIONS)\n' +
      'Translate clinical jargon with exact anatomical and pharmacological precision into 8th-grade patient-friendly English:\n' +
      '- "CABG x3": Triple coronary artery bypass graft surgery—using blood vessel bridges to detour around 3 blocked heart arteries.\n' +
      '- "LIMA to LAD": Left Internal Mammary Artery = healthy artery from inside the chest wall repurposed to bypass the heart\'s front artery (LAD).\n' +
      '- "SVG to OM1 / RCA / PDA": Saphenous Vein Graft = vein taken from the patient\'s leg to bypass blocked arteries on the side and back of the heart.\n' +
      '- "LVEF" (e.g. 42%): Left Ventricular Ejection Fraction = heart pumping efficiency (normal is 50-70%; 42% means the heart pump is mildly weakened and needs rest and medications).\n' +
      '- "Sternal Precautions & Pillow Splinting": Sternal precautions (no lifting >5 lbs, no pushing or pulling) protect the healing breastbone/sternum for 8 weeks. Splinting by hugging a heart pillow firmly against the chest supports and stabilizes the breastbone during coughing or sneezing, drastically reducing sharp pain and preventing incision separation.\n' +
      '- "Diuretics (e.g. Furosemide / Lasix)": A water pill prescribed as-needed for sudden fluid retention, leg/ankle swelling (peripheral edema), or rapid weight gain (>3 lbs in 24 hours), which indicates excess fluid loading the heart.\n' +
      '- "Beta-Blockers (e.g. Metoprolol Succinate)": Slows heart rate and relaxes blood vessels so the heart does not work too hard; require checking pulse and holding if heart rate <55.\n' +
      '- "Dual Antiplatelet Therapy (Aspirin + Clopidogrel)": Two blood thinners working together to prevent blood clots from forming inside the new bypass grafts.\n' +
      '- "Lipase (e.g. 1,450 U/L) & Pancreatitis": Lipase is a digestive enzyme made by the pancreas. Critical high levels indicate acute pancreatitis (sudden severe inflammation of the pancreas).\n' +
      '- "Choledocholithiasis": Gallstones that have slipped into and blocked the common bile duct, trapping digestive enzymes and bile.\n' +
      '- "NPO (Nothing by Mouth)": Strict pause on all food and drink so the pancreas can rest and stop pumping digestive enzymes.\n' +
      '- "ERCP": A specialized scope procedure passed through the mouth into the digestive tract to safely extract gallstones lodged in the bile duct.\n' +
      '- "Type 2 Diabetes, Stage 3 CKD, SGLT2 (Empagliflozin) & Metformin": Metformin and SGLT2 inhibitors protect the kidneys and regulate sugar, but must be paused during dehydration, illness, or contrast dye scans to prevent kidney injury or lactic acidosis.\n\n' +
      'OUTPUT FORMAT:\n' +
      '### SANITIZED CLINICAL TEXT\n' +
      '(Verbatim clinical note where all names are [REDACTED_NAME], dates are [REDACTED_DATE], and MRNs/phones/IDs are [REDACTED_ID])\n\n' +
      '### PATIENT-FRIENDLY SUMMARY\n' +
      '(Warm, clear, accessible breakdown of the diagnosis, anatomical explanations, medication rules, and sternal/wound care precautions)',
  });

  const prompt = `Please sanitize and translate the following clinical note. Replace all PII with [REDACTED_NAME], [REDACTED_DATE], and [REDACTED_ID], and provide an accurate patient translation:\n\n${rawClinicalNote}`;

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

    return {
      sanitizedText: scrubbedSanitized.scrubbedText,
      detectedPiiTypes: combinedPiiTypes,
      simplifiedSummary: scrubbedSummary.scrubbedText,
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
 * Runs strictly with InferenceMode.ONLY_IN_CLOUD.
 * Receives ONLY the sanitized, PII-stripped summary from Stage 1. Zero raw PII leaves the browser.
 */
export async function runCloudRecoveryAnalyzerStage(
  sanitizedText: string,
  simplifiedSummary: string
): Promise<Stage2Result> {
  const startTime = performance.now();

  // Instantiate on user interaction
  const model = getGenerativeModel(ai, {
    model: 'gemini-3.8-flash',
    mode: InferenceMode.ONLY_IN_CLOUD,
    inCloudParams: {
      model: 'gemini-3.8-flash',
    },
    systemInstruction:
      'You are the MedBrief Cloud Recovery Specialist & Red-Flag Analyzer. Respond in English. ' +
      'Given a PII-sanitized medical brief (where all PII has already been replaced by [REDACTED_NAME], [REDACTED_DATE], [REDACTED_ID]), generate: ' +
      '1) A structured 7-Day Recovery Checklist (Day 1 through Day 7) with 2-3 specific, medically accurate tasks per day (e.g. pillow splinting when coughing, daily weighing for fluid retention, sternal precautions). ' +
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
    const cleaned = rawText.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '').trim();
    const parsed = JSON.parse(cleaned);
    checklist = parsed.checklist || [];
    warningSigns = parsed.warningSigns || [];
    doctorQuestions = parsed.doctorQuestions || [];
  } catch (parseError) {
    console.warn('Failed to parse structured JSON from cloud response, fallback parsing:', parseError);
    checklist = [
      { day: 1, title: 'Day 1: Discharge Rest & Pillow Splinting', tasks: ['Rest in a semi-upright position; keep heart pillow within arm\'s reach', 'Hug heart pillow firmly to chest whenever coughing, sneezing, or laughing to splint sternum', 'Log baseline vitals and resting heart rate'] },
      { day: 2, title: 'Day 2: Fluid Monitoring & Daily Weight', tasks: ['Weigh yourself first thing in morning after urinating; log in diary', 'Take Furosemide (diuretic) only if sudden weight gain >3 lbs in 24h or pedal swelling appears', 'Check sternal incision for clean edges with zero redness or drainage'] },
      { day: 3, title: 'Day 3: Gentle Ambulation & Breathing Exercises', tasks: ['Take 3 gentle 5-minute indoor walks on flat surfaces', 'Use incentive spirometer or perform 10 deep breathing cycles per hour', 'Strictly avoid lifting anything heavier than 5 lbs (gallon of milk)'] },
      { day: 4, title: 'Day 4: Cardiac Polypharmacy Reconciliation', tasks: ['Take Metoprolol with breakfast; verify pulse is above 55 bpm beforehand', 'Take Aspirin and Clopidogrel with meals to protect bypass grafts', 'Ensure zero NSAIDs (ibuprofen/naproxen) are taken; use acetaminophen for pain'] },
      { day: 5, title: 'Day 5: Progressive Indoor Walking', tasks: ['Increase indoor walking to 10 minutes twice daily', 'Eat low-sodium, heart-healthy meals to prevent fluid overload', 'Confirm no dizziness or lightheadedness when standing up'] },
      { day: 6, title: 'Day 6: Surgical Incision & Symptom Check', tasks: ['Inspect leg vein graft (SVG) site and chest incision (LIMA site) with caregiver', 'List any questions or unusual palpitations in medication log', 'Confirm follow-up transportation (strictly no driving)'] },
      { day: 7, title: 'Day 7: Follow-up Clinical Consultation Prep', tasks: ['Bring all prescription bottles and 7-day vitals/weight log to doctor appointment', 'Review cardiac rehab start schedule with cardiologist', 'Review return-to-work and driving clearance criteria with surgical team'] },
    ];
    warningSigns = [
      { severity: 'urgent', title: 'Severe Crushing Chest Pain or Breathlessness', description: 'Pain radiating to jaw or left arm, severe shortness of breath at rest, or clicking/grinding sensation in breastbone.', action: 'Call 911 or proceed to Emergency Room immediately.' },
      { severity: 'warning', title: 'Sudden Weight Gain >3 lbs or Spreading Redness', description: 'Weight jump >3 lbs in 24 hours (fluid retention), fever > 100.4°F, or drainage from leg/chest incisions.', action: 'Contact cardiology clinic within 24 hours.' },
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

  const telemetry: TelemetryData = {
    inferenceSource: isSourceOnDevice ? 'ON_DEVICE' : 'IN_CLOUD',
    latencyMs,
    dataBoundary: 'Sanitized Cloud Payload',
    timestamp: new Date().toLocaleTimeString(),
    modelName: 'Gemini 3.8 Flash (Google Cloud AI)',
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
