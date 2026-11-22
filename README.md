# MedBrief Hybrid — The Zero-Leakage Clinical Brief & Recovery Companion

[![#BuildHybridAI 2026](https://img.shields.io/badge/%23BuildHybridAI_2026-Web_%2F_Chrome_Track-06b6d4.svg)](https://github.com/SANKETSINGH6555/medbrief-hybrid)
[![Firebase AI Logic](https://img.shields.io/badge/Firebase_AI_Logic-v13+-FFA000.svg?logo=firebase)](https://firebase.google.com/docs/ai-logic)
[![Chrome Prompt API](https://img.shields.io/badge/Chrome_Gemini_Nano-On--Device_NPU-4285F4.svg?logo=googlechrome)](https://developer.chrome.com/docs/ai/built-in)
[![Cloud Firestore](https://img.shields.io/badge/Firestore-Zero--PII_Storage-FFCA28.svg?logo=firebase)](https://firebase.google.com/docs/firestore)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)

> **Official Submission for the #BuildHybridAI 2026 Hackathon (Web / Chrome Track)**  
> MedBrief Hybrid solves the healthcare AI paradox: patients need complex medical discharge notes translated into clear, actionable care plans, but medical records contain intensely sensitive Personally Identifiable Information (PII) that must never be exposed. MedBrief Hybrid deploys **Chrome Gemini Nano directly on-device** to strip all PII locally in the browser with **0 bytes transmitted**, and then routes the sanitized payload to **Cloud Gemini 2.5 Flash** to synthesize structured 7-day recovery plans, red-flag triage protocols, and doctor consultation checklists.

---

## 🏛️ Hybrid AI Architecture Diagram

```text
+---------------------------------------------------------------------------------------------------------+
|                                        MEDBRIEF HYBRID ARCHITECTURE                                     |
+---------------------------------------------------------------------------------------------------------+
|                                                                                                         |
|   +-------------------------------------------------------------------------------------------------+   |
|   | CLIENT BROWSER (Local Device Memory Boundary - 100% Offline Capable)                            |   |
|   |                                                                                                 |   |
|   |   [ Raw Clinical Note / EHR ]                                                                   |   |
|   |   (Contains Patient Names, MRNs, DOBs, Phone Numbers, Addresses, Dense Clinical Jargon)         |   |
|   |                 |                                                                               |   |
|   |                 v                                                                               |   |
|   |   +-----------------------------------------------------------------------------------------+   |   |
|   |   | STAGE 1: On-Device Privacy Shield & Translator (firebase/ai)                            |   |   |
|   |   | Engine: Chrome Gemini Nano via Prompt API (LanguageModel / window.ai)                   |   |   |
|   |   | Mode: InferenceMode.PREFER_ON_DEVICE / ONLY_ON_DEVICE                                   |   |   |
|   |   | Params: onDeviceParams: { outputLanguage: 'en' }                                        |   |   |
|   |   +-----------------------------------------------------------------------------------------+   |   |
|   |                 |                                                                               |   |
|   |                 +----------------------------+                                                  |   |
|   |                 |                            |                                                  |   |
|   |                 v                            v                                                  |   |
|   |   [ Sanitized Zero-PII Note ]     [ Patient-Friendly Summary ]                                  |   |
|   |   (Tokens: [REDACTED_NAME],       (8th-grade plain English,                                     |   |
|   |    [REDACTED_MRN], etc.)           empowering, jargon-free)                                     |   |
|   |                 |                                                                               |   |
|   +-----------------|-------------------------------------------------------------------------------+   |
|                     |                                                                                   |
|  ===================|==================== DATA PRIVACY BOUNDARY =======================================  |
|                     | (ZERO patient identifiers or unredacted records ever leave browser memory)        |
|                     v                                                                                   |
|   +-------------------------------------------------------------------------------------------------+   |
|   | GOOGLE CLOUD BACKEND (Sanitized Payloads Only)                                                  |   |
|   |                                                                                                 |   |
|   |   +-----------------------------------------------------------------------------------------+   |   |
|   |   | STAGE 2: Cloud Recovery & Red-Flag Analyzer (firebase/ai)                               |   |   |
|   |   | Engine: Gemini 2.5 Flash via GoogleAIBackend                                            |   |   |
|   |   | Mode: InferenceMode.ONLY_IN_CLOUD                                                        |   |   |
|   |   | Security: Firebase App Check (ReCaptcha Enterprise + Debug Tokens)                      |   |   |
|   |   +-----------------------------------------------------------------------------------------+   |   |
|   |                 |                                                                               |   |
|   |                 +----------------------------+-----------------------------+                    |   |
|   |                 v                            v                             v                    |   |
|   |      [ 7-Day Care Checklist ]       [ Red-Flag Warning Signs ]     [ 5 Questions for Doctor ]   |   |
|   |      (Interactive daily tasks)      (Urgent / Warning / Normal)    (Follow-up consultation)     |   |
|   |                                                                                                 |   |
|   |   +-----------------------------------------------------------------------------------------+   |   |
|   |   | Cloud Firestore: users/{uid}/briefs                                                     |   |   |
|   |   | STORES STRICTLY: Sanitized briefs, recovery plans, and hybrid telemetry audit logs.     |   |   |
|   |   | Anonymous Auth: signInAnonymously() creates private sandboxed user records.             |   |   |
|   |   +-----------------------------------------------------------------------------------------+   |   |
|   +-------------------------------------------------------------------------------------------------+   |
+---------------------------------------------------------------------------------------------------------+
```

---

## ⚡ Key Features

1. **One-Click Clinical Benchmark Samples:**
   - **Cardiology Post-Op Discharge Summary:** Post-CABG surgery, sternal precautions, reduced LVEF (42%), cardiac polypharmacy.
   - **ER Blood Panel & Triage Note:** Acute edematous gallstone pancreatitis, critical lipase (1,450 U/L), leukocytosis with left shift, urgent ERCP orders.
   - **Multi-Medication Complex Prescription:** Polypharmacy reconciliation for Type 2 Diabetes, Stage 3 CKD, peripheral neuropathy, and hypoglycemia warnings.
2. **On-Device Privacy Shield (`ONLY_ON_DEVICE` / `PREFER_ON_DEVICE`):**
   - Strips patient names, medical record numbers (MRNs), dates of birth, admission dates, phone numbers, and addresses directly inside Chrome.
   - Translates dense clinical jargon into empathetic, 8th-grade level patient English.
   - Operates **100% offline** with zero outbound network traffic during redaction.
3. **Cloud Recovery & Red-Flag Analyzer (`ONLY_IN_CLOUD`):**
   - Consumes *strictly* the sanitized, PII-free payload.
   - Synthesizes an interactive 7-day daily recovery checklist with interactive checkboxes and completion tracking.
   - Triage warning signs into **Urgent Emergency (Call 911)**, **Doctor Follow-Up (Call within 24h)**, and **Normal Healing**.
   - Generates 5 high-impact questions for the patient's next clinical consultation.
4. **Live Hybrid Telemetry & Demo Controls:**
   - Real-time engine indicator: `⚡ ON_DEVICE (Gemini Nano)` vs `☁️ IN_CLOUD (Gemini 2.5 Flash)`.
   - Precise millisecond latency counter.
   - Data Boundary audit indicator: `Local Browser Memory (0 Bytes Sent)` vs `Sanitized Cloud Payload`.
   - Routing mode switch: `Auto Hybrid` | `Force On-Device` | `Force Cloud`.
   - One-click **"Copy Summary"** and **"Export Brief (.md)"** with full telemetry audit trail.
5. **Full Firebase Ecosystem Integration:**
   - **Firebase AI Logic (`firebase/ai`):** Uses modern `getAI`, `GoogleAIBackend`, `getGenerativeModel`, and `InferenceMode`. Instantiated on or after user interaction (button click) per Chrome Prompt API requirements.
   - **Firebase App Check:** Integrated with `ReCaptchaEnterpriseProvider` and development debug tokens.
   - **Firebase Authentication:** Auto-authenticates via `signInAnonymously()`.
   - **Cloud Firestore:** Persists sanitized briefs to `users/{uid}/briefs` with an interactive slide-over history drawer.
   - **Firebase Remote Config:** Fetches `default_inference_mode` dynamically on app boot.
   - **Firebase Hosting:** Configured for `medbrief-hybrid-2026`.

---

## 🛠️ Chrome Gemini Nano Setup Instructions for Judges

MedBrief Hybrid features an **intelligent auto-hybrid fallback**: if tested on standard Chrome, Safari, or Firefox, it automatically routes through Cloud Gemini 2.5 with zero crashes. 

To evaluate **local on-device Gemini Nano execution in Chrome**:

### 1. Enable Prompt API Flag
Navigate to:
```text
chrome://flags/#prompt-api-for-gemini-nano
```
Set to **Enabled**, then relaunch Chrome.

### 2. Bypass Hardware Performance Requirements (Recommended for Laptops)
Navigate to:
```text
chrome://flags/#optimization-guide-on-device-model
```
Set to **Enabled BypassPerfRequirement**, then relaunch Chrome.

### 3. Verify Model Download
Navigate to:
```text
chrome://components
```
Locate **Optimization Guide On Device Model** and click **Check for update**. Once it shows `Status - Up-to-date` (approx. 1.5 GB), Chrome Gemini Nano is ready for sub-second, zero-network execution!

---

## 💻 Tech Stack

- **Framework:** React 18, TypeScript, Vite
- **Styling:** Tailwind CSS, Lucide Icons, Plus Jakarta Sans, JetBrains Mono
- **AI Engine:** Firebase AI Logic (`firebase/ai` v13.4.0)
- **Local Model:** Google Chrome Gemini Nano (via Chrome Prompt API / `window.ai.languageModel`)
- **Cloud Model:** Gemini 2.5 Flash (`GoogleAIBackend`)
- **Backend & Database:** Cloud Firestore, Firebase Authentication, Firebase Remote Config, Firebase App Check, Firebase Hosting

---

## 🚀 Local Development Setup

### 1. Clone the repository
```bash
git clone https://github.com/SANKETSINGH6555/medbrief-hybrid.git
cd medbrief-hybrid
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Copy `.env.example` to `.env.local` and configure your Firebase credentials:
```bash
cp .env.example .env.local
```

### 4. Start the development server
```bash
npm run dev
```
Open `http://localhost:5173` in Google Chrome.

### 5. Build for production
```bash
npm run build
```

---

## ☁️ Firebase Deployment

Deploy to Firebase Hosting with:
```bash
npx firebase-tools deploy --only hosting
```

---

## 📄 License
This project is licensed under the Apache License 2.0. See the [LICENSE](LICENSE) file for details.
