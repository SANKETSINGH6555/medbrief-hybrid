import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaEnterpriseProvider, AppCheck } from 'firebase/app-check';
import { getAuth, signInAnonymously, onAuthStateChanged, User, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getRemoteConfig, fetchAndActivate, getValue, RemoteConfig } from 'firebase/remote-config';
import { getAI, GoogleAIBackend, AI } from 'firebase/ai';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// 1. Initialize Firebase App (singleton)
export const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// 2. Initialize App Check with ReCaptchaEnterpriseProvider and Debug Token for dev/localhost
export let appCheck: AppCheck | null = null;
const isDev = import.meta.env.DEV || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'));

if (typeof window !== 'undefined') {
  if (isDev && import.meta.env.VITE_FIREBASE_APPCHECK_DEBUG_TOKEN) {
    (self as unknown as { FIREBASE_APPCHECK_DEBUG_TOKEN: string | boolean }).FIREBASE_APPCHECK_DEBUG_TOKEN =
      import.meta.env.VITE_FIREBASE_APPCHECK_DEBUG_TOKEN;
  }

  const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
  if (recaptchaSiteKey) {
    try {
      appCheck = initializeAppCheck(app, {
        provider: new ReCaptchaEnterpriseProvider(recaptchaSiteKey),
        isTokenAutoRefreshEnabled: true,
      });
    } catch (err) {
      console.warn('Firebase App Check initialization warning:', err);
    }
  }
}

// 3. Initialize Firebase Auth
export const auth: Auth = getAuth(app);

// Helper for Anonymous Authentication
export async function ensureAnonymousAuth(): Promise<User> {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        unsubscribe();
        resolve(user);
      } else {
        try {
          const credential = await signInAnonymously(auth);
          unsubscribe();
          resolve(credential.user);
        } catch (err) {
          unsubscribe();
          reject(err);
        }
      }
    });
  });
}

// 4. Initialize Cloud Firestore
export const db: Firestore = getFirestore(app);

// 5. Initialize Firebase Remote Config
export const remoteConfig: RemoteConfig = getRemoteConfig(app);
remoteConfig.settings = {
  minimumFetchIntervalMillis: isDev ? 10000 : 3600000,
  fetchTimeoutMillis: 10000,
};
remoteConfig.defaultConfig = {
  default_inference_mode: 'prefer_on_device',
};

export async function fetchDefaultInferenceMode(): Promise<string> {
  try {
    const activated = await fetchAndActivate(remoteConfig);
    const val = getValue(remoteConfig, 'default_inference_mode').asString();
    return val || 'prefer_on_device';
  } catch (err) {
    console.warn('Remote Config fetch fallback:', err);
    return 'prefer_on_device';
  }
}

// 6. Initialize Firebase AI Logic (v12.5.0+ / v13+)
// Enabled with GoogleAIBackend and limited use App Check tokens for replay protection
export const ai: AI = getAI(app, {
  backend: new GoogleAIBackend(),
  useLimitedUseAppCheckTokens: true,
});

// 7. Chrome Gemini Nano / Prompt API Readiness Check
export interface NanoReadiness {
  status: 'available' | 'downloading' | 'unavailable' | 'unsupported';
  message: string;
}

export async function checkChromeNanoReadiness(): Promise<NanoReadiness> {
  if (typeof window === 'undefined') {
    return { status: 'unsupported', message: 'Not in browser environment.' };
  }

  try {
    const selfAny = (typeof self !== 'undefined' ? self : window) as any;

    // 1. Check (self as any).LanguageModel?.availability() (Chrome 157 standard API)
    if (typeof selfAny.LanguageModel?.availability === 'function') {
      const avail = await selfAny.LanguageModel.availability();
      if (avail === 'available' || avail === 'readily') {
        return { status: 'available', message: 'Gemini Nano is available for instant on-device execution.' };
      }
      if (avail === 'after-download' || avail === 'downloading') {
        return { status: 'downloading', message: 'Gemini Nano is downloading locally into Chrome.' };
      }
      return { status: 'unavailable', message: `Chrome Prompt API status: "${avail}".` };
    }

    // 2. Fallback to (window as any).ai?.languageModel?.availability()
    const winAny = window as any;
    if (typeof winAny.ai?.languageModel?.availability === 'function') {
      const avail = await winAny.ai.languageModel.availability();
      if (avail === 'available' || avail === 'readily') {
        return { status: 'available', message: 'Gemini Nano is available for instant on-device execution.' };
      }
      if (avail === 'after-download' || avail === 'downloading') {
        return { status: 'downloading', message: 'Gemini Nano is downloading locally into Chrome.' };
      }
      return { status: 'unavailable', message: `Chrome Prompt API status: "${avail}".` };
    }

    // 3. Fallback to (window as any).ai?.languageModel?.capabilities()
    if (typeof winAny.ai?.languageModel?.capabilities === 'function') {
      const caps = await winAny.ai.languageModel.capabilities();
      if (caps.available === 'available' || caps.available === 'readily') {
        return { status: 'available', message: 'Gemini Nano is available for instant on-device execution.' };
      }
      if (caps.available === 'after-download' || caps.available === 'downloading') {
        return { status: 'downloading', message: 'Gemini Nano model is downloading locally.' };
      }
      return { status: 'unavailable', message: `Capability status: "${caps.available}".` };
    }

    return {
      status: 'unsupported',
      message: 'Chrome Prompt API flags not enabled or unsupported browser. Auto-hybrid falls back seamlessly to Cloud Gemini.',
    };
  } catch (err) {
    return {
      status: 'unavailable',
      message: `Prompt API check returned: ${String(err)}`,
    };
  }
}
