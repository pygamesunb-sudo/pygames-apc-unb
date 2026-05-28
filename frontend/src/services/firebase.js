import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

// Carrega as configuracoes das chaves do Firebase do .env
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ""
};

// Verifica se as chaves minimas foram preenchidas para nao quebrar a inicializacao
const isConfigured = firebaseConfig.apiKey && firebaseConfig.projectId;

if (!isConfigured) {
  console.warn(
    "[Firebase] Chaves de configuracao nao encontradas no arquivo frontend/.env! " +
    "Por favor, configure as variaveis VITE_FIREBASE_API_KEY e VITE_FIREBASE_PROJECT_ID."
  );
}

const app = isConfigured ? initializeApp(firebaseConfig) : null;
export const auth = app ? getAuth(app) : null;
export const googleProvider = new GoogleAuthProvider();

/**
 * Efetua login via pop-up do Google.
 */
export async function loginWithGoogle() {
  if (!auth) {
    throw new Error("O Firebase nao foi configurado corretamente no frontend. Verifique seu arquivo .env.");
  }
  return signInWithPopup(auth, googleProvider);
}

/**
 * Efetua logout da aplicacao.
 */
export async function logout() {
  if (!auth) return;
  return signOut(auth);
}
