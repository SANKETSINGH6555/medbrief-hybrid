import { InferenceMode, InferenceSource } from 'firebase/ai';

export type RoutingMode = 'auto' | 'only_on_device' | 'only_in_cloud';

export interface TelemetryData {
  inferenceSource: 'ON_DEVICE' | 'IN_CLOUD' | 'UNKNOWN';
  latencyMs: number;
  dataBoundary: 'Local Browser Memory (0 Bytes Sent)' | 'Sanitized Cloud Payload';
  timestamp: string;
  modelName: string;
}

export interface RedactedPIIItem {
  category: 'Patient Name' | 'MRN / ID' | 'Date / DOB' | 'Phone / Contact' | 'Location';
  originalRedactedType: string;
}

export interface MedicationSafetyAlert {
  drug: string;
  rule: string;
  severity: 'critical' | 'warning';
}

export interface Stage1Result {
  sanitizedText: string;
  detectedPiiTypes: string[];
  simplifiedSummary: string;
  medicationAlerts: MedicationSafetyAlert[];
  telemetry: TelemetryData;
}

export interface DayPlan {
  day: number;
  title: string;
  tasks: string[];
}

export interface WarningSign {
  severity: 'urgent' | 'warning' | 'normal';
  title: string;
  description: string;
  action: string;
}

export interface Stage2Result {
  checklist: DayPlan[];
  warningSigns: WarningSign[];
  doctorQuestions: string[];
  telemetry: TelemetryData;
}

export interface SavedBrief {
  id: string;
  title: string;
  createdAt: number;
  simplifiedSummary: string;
  sanitizedClinicalText: string;
  detectedPiiTypes: string[];
  medicationAlerts?: MedicationSafetyAlert[];
  checklist: DayPlan[];
  warningSigns: WarningSign[];
  doctorQuestions: string[];
  stage1Telemetry: TelemetryData;
  stage2Telemetry: TelemetryData;
}

export interface SampleNote {
  id: string;
  title: string;
  category: 'Cardiology' | 'Emergency' | 'Pharmacology';
  description: string;
  rawClinicalText: string;
}

export interface UploadedImage {
  name: string;
  mimeType: string;
  base64Data: string;
  dataUrl: string;
  sizeKb: number;
}
