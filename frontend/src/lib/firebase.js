import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';

function readEnv(name) {
  const value = import.meta.env[name];
  if (value == null || value === '') return '';
  return String(value).trim();
}

const firebaseConfig = {
  apiKey: readEnv('VITE_FIREBASE_API_KEY'),
  authDomain: readEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: readEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: readEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: readEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: readEnv('VITE_FIREBASE_APP_ID'),
};

const REQUIRED_KEYS = [
  ['VITE_FIREBASE_API_KEY', firebaseConfig.apiKey],
  ['VITE_FIREBASE_AUTH_DOMAIN', firebaseConfig.authDomain],
  ['VITE_FIREBASE_PROJECT_ID', firebaseConfig.projectId],
  ['VITE_FIREBASE_APP_ID', firebaseConfig.appId],
];

export function getMissingFirebaseEnvVars() {
  return REQUIRED_KEYS.filter(([, value]) => !value).map(([name]) => name);
}

export const isFirebaseConfigured = getMissingFirebaseEnvVars().length === 0;

let app = null;
let auth = null;
let googleProvider = null;
let initError = null;

function initFirebase() {
  if (!isFirebaseConfigured) {
    const missing = getMissingFirebaseEnvVars().join(', ');
    console.warn(
      `[Firebase] Variaveis ausentes: ${missing}. ` +
      'Copie frontend/.env.example para frontend/.env.local e preencha as chaves do Console Firebase.'
    );
    return;
  }

  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: 'select_account' });
  } catch (error) {
    initError = error;
    app = null;
    auth = null;
    googleProvider = null;
    console.error('[Firebase] Falha ao inicializar o SDK:', error);
  }
}

initFirebase();

export { auth, googleProvider, initError, onAuthStateChanged };

function mapFirebaseAuthError(error) {
  const code = error?.code || '';

  const messages = {
    'auth/popup-closed-by-user': 'Login cancelado. Tente novamente.',
    'auth/cancelled-popup-request': 'Outra janela de login ja estava aberta. Tente novamente.',
    'auth/popup-blocked': 'O navegador bloqueou o popup. Permita popups para este site.',
    'auth/network-request-failed': 'Falha de rede. Verifique sua conexao e tente novamente.',
    'auth/unauthorized-domain': 'Dominio nao autorizado no Firebase. Adicione localhost em Authentication > Settings.',
    'auth/operation-not-allowed': 'Login com Google nao esta habilitado no Firebase Console.',
  };

  return messages[code] || error?.message || 'Falha ao autenticar com o Google.';
}

export async function loginWithGoogle() {
  if (initError) {
    throw new Error(
      'Firebase nao pôde ser inicializado. Verifique as variaveis VITE_FIREBASE_* em frontend/.env.local.'
    );
  }

  if (!auth || !googleProvider) {
    throw new Error(
      'Firebase nao configurado. Crie o arquivo frontend/.env.local com as variaveis VITE_FIREBASE_* ' +
      '(veja frontend/.env.example) e reinicie o servidor de desenvolvimento.'
    );
  }

  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (error) {
    throw new Error(mapFirebaseAuthError(error));
  }
}

export async function getIdToken(forceRefresh = false) {
  if (!auth?.currentUser) {
    throw new Error('Nenhum usuario autenticado.');
  }
  return auth.currentUser.getIdToken(forceRefresh);
}

export async function logout() {
  if (!auth) return;
  return signOut(auth);
}
