import { SampleNote } from '../types';

export const SAMPLE_CLINICAL_NOTES: SampleNote[] = [
  {
    id: 'sample-cardio',
    title: 'Cardiology Post-Op Discharge Summary',
    category: 'Cardiology',
    description: 'Post-CABG surgery with sternal precautions, reduced EF, and cardiac polypharmacy.',
    rawClinicalText: `PATIENT DISCHARGE SUMMARY — ST. JUDE MEMORIAL HOSPITAL
PATIENT NAME: Robert Vance | DOB: 04/12/1958 | AGE: 68
MRN: #CRD-882910 | ADMISSION: 11/08/2026 | DISCHARGE: 11/14/2026
PRIMARY CARE PHYSICIAN: Dr. Arthur Pendleton (Tel: 555-728-1120)
EMERGENCY CONTACT: Eleanor Vance (Wife, 555-392-8819)

ATTENDING CARDIOTHORACIC SURGEON: Dr. Sarah Lin, MD, FACS
PRIMARY DIAGNOSIS: Triple-vessel CAD, severe angina pectoris (CCS Class III).
PROCEDURE PERFORMED: Coronary Artery Bypass Graft x3 (LIMA to LAD, SVG to OM1, SVG to PDA) on 11/09/2026.
CARDIAC FUNCTION: Post-op Transthoracic Echo reveals LVEF 42%, mild hypokinesis of anterior and apical segments, trace mitral regurgitation. Sternal incision coapted, clean without erythema or purulent drainage.

DISCHARGE MEDICATIONS:
1. Atorvastatin 80mg PO QHS (Lipid stabilization)
2. Metoprolol Succinate ER 50mg PO QD (Hold if HR <55 or SBP <100)
3. Aspirin 81mg PO QD with food
4. Clopidogrel 75mg PO QD (Dual antiplatelet therapy for 12 months minimum)
5. Furosemide 20mg PO QAM PRN for peripheral pedal edema >2+ or acute weight gain >3 lbs/24hr
6. Acetaminophen 650mg PO Q6H PRN for incisional pain (avoid NSAIDs/ibuprofen due to bleeding and renal risk)

ACTIVITY & STERNAL PRECAUTIONS:
- Strict sternal precautions x 8 weeks: No lifting, pushing, or pulling >5 lbs.
- Hug heart pillow against chest when coughing or sneezing.
- No driving until cleared by surgical team (minimum 4 weeks).
- Cardiac rehabilitation referral placed. Follow-up clinic appointment scheduled on 11/24/2026 at 10:30 AM with Dr. Pendleton.`
  },
  {
    id: 'sample-er',
    title: 'ER Blood Panel & Triage Note',
    category: 'Emergency',
    description: 'Acute severe pancreatitis secondary to choledocholithiasis with elevated lipase and leukocytosis.',
    rawClinicalText: `EMERGENCY DEPARTMENT CLINICAL NOTE — METRO HEALTH SYSTEM
PATIENT: Elena Rostova | DOB: 09/23/1984 | AGE: 42 | GENDER: F
MRN: #EMR-401924 | ENCOUNTER DATE: 11/20/2026 03:15 AM
PRIMARY RESIDENCE: 1422 Elmwood Ave, Apt 4B, Chicago, IL (Ph: 555-918-2341)
TRIAGE NURSE: M. Gallagher, RN | ATTENDING PHYSICIAN: Dr. Tariq Al-Mansoor, MD

CHIEF COMPLAINT: "Excruciating upper abdominal pain burning through to my spine, vomiting for 18 hours."

HISTORY OF PRESENT ILLNESS:
42-year-old female presents with acute onset epigastric pain that began 18 hours postprandial (high-fat meal). Pain described as boring, constant (9/10), radiating straight to mid-thoracic spine. Accompanied by 6 episodes of bilious emesis and intractable nausea. Denies hematemesis or melena.

LABORATORY FINDINGS (STAT LABS):
- Serum Lipase: 1,450 U/L [Ref: 10 - 140 U/L] (Critical High - 10x upper limit)
- Serum Amylase: 580 U/L [Ref: 28 - 100 U/L] (High)
- Complete Blood Count: WBC 16.4 k/uL [Ref: 4.5 - 11.0] with 84% neutrophils (Left shift)
- Hepatic Function: Total Bilirubin 2.2 mg/dL [Ref: 0.2 - 1.2], Direct Bili 1.4 mg/dL; AST 180 U/L, ALT 210 U/L; Alkaline Phosphatase 230 U/L
- Basic Metabolic Panel: BUN 26 mg/dL, Cr 1.1 mg/dL, Glucose 168 mg/dL, Serum Calcium 8.4 mg/dL (ionized Ca normal)

IMAGING (CT ABDOMEN/PELVIS W/ IV CONTRAST):
Diffusely enlarged pancreatic head and body with indistinct margins and extensive peripancreatic fluid stranding in the anterior pararenal space. Common bile duct dilated to 9mm with 4mm radiopaque focus at ampulla of Vater consistent with choledocholithiasis. No walled-off necrosis.

CLINICAL IMPRESSION & ORDERS:
1. Acute interstitial edematous gallstone pancreatitis.
2. Admit to Inpatient Step-Down Unit under GI service.
3. Strict NPO (nothing by mouth) until pain decreases and nausea resolves.
4. Aggressive IV fluid resuscitation: Lactated Ringer's at 200 mL/hr with target urine output >0.5 mL/kg/hr.
5. Analgesia: Hydromorphone 0.5mg IV Q3H PRN severe breakthrough pain; Ondansetron 4mg IV Q8H PRN nausea.
6. Urgent GI consult requested for ERCP (Endoscopic Retrograde Cholangiopancreatography) with sphincterotomy.`
  },
  {
    id: 'sample-rx',
    title: 'Multi-Medication Complex Prescription',
    category: 'Pharmacology',
    description: 'Polypharmacy regimen for Type 2 Diabetes, Stage 3 Chronic Kidney Disease, and Neuropathy.',
    rawClinicalText: `AMBULATORY CLINIC ENCOUNTER & MEDICATION RECONCILIATION
PATIENT NAME: Marcus Sterling | DOB: 11/03/1961 | AGE: 65
MRN: #MED-994102 | PHONE: 555-482-9012 | PHARMACY: Walgreens #4912
PRIMARY ENDOCRINOLOGIST: Dr. Kimberly Hayes, MD (Tel: 555-630-4921)
DATE: 11/18/2026

ACTIVE CLINICAL PROBLEM LIST:
1. Type 2 Diabetes Mellitus with severe peripheral sensorimotor polyneuropathy (HbA1c 8.8%).
2. Chronic Kidney Disease (CKD) Stage 3a (Baseline Serum Creatinine 1.6 mg/dL, eGFR 48 mL/min/1.73m², Urine Albumin-to-Creatinine Ratio 180 mg/g).
3. Primary Essential Hypertension with left ventricular hypertrophy.
4. Mixed Hyperlipidemia.

MEDICATION RECONCILIATION & SAFETY WARNINGS:
1. Metformin HCl ER 1,000mg PO BID with evening and morning meals.
   - CAUTION: Monitor renal function regularly. Must HOLD immediately if patient experiences dehydration, vomiting, or receives iodinated IV contrast (risk of lactic acidosis with eGFR <45).
2. Empagliflozin (Jardiance) 10mg PO QAM.
   - SGLT2 inhibitor for cardiorenal protection. Ensure adequate hydration. Patient warned regarding symptoms of euglycemic DKA and mycotic genital infections.
3. Lisinopril 20mg PO QD in morning.
   - ACE inhibitor for renal protection & BP control. Recheck serum potassium and creatinine in 2 weeks. Discontinue if persistent dry cough or angioedema occurs.
4. Gabapentin 300mg PO TID (8 AM, 2 PM, 8 PM).
   - For burning neuropathic pain in lower extremities. Titrate slowly. Warn regarding somnolence and dizziness; avoid operating heavy machinery.
5. Atorvastatin 40mg PO QHS.
   - Report unexplained muscle pain, tenderness, or brown urine immediately (rhabdomyolysis warning).
6. Insulin Glargine (Lantus) 24 units SubQ QHS at bedtime.
   - Strict hypoglycemia protocol: Keep fast-acting carbohydrates (15g rule) accessible. Recheck blood glucose if feeling shaky, diaphoretic, or confused.`
  }
];
