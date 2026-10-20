import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  signOut,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
};

const measurementId = import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "";
if (measurementId) {
  firebaseConfig.measurementId = measurementId;
}

export const isConfigured = 
  firebaseConfig.apiKey && 
  firebaseConfig.projectId && 
  firebaseConfig.apiKey !== "your-firebase-api-key" &&
  firebaseConfig.apiKey !== "";

const mockAuth = {
  currentUser: {
    uid: "test-user-uid-12345",
    displayName: "Jogador Local (Mock)",
    email: "test@pygameapc.com",
    photoURL: null,
    getIdToken: () => Promise.resolve("mock-testing-token-apc")
  },
  onAuthStateChanged: (callback) => {
    const loggedIn = localStorage.getItem("mock_logged_in") === "true";
    setTimeout(() => {
      callback(loggedIn ? mockAuth.currentUser : null);
    }, 100);
    return () => {};
  },
  authStateReady: () => Promise.resolve()
};

if (!isConfigured) {
  console.warn(
    "[Firebase] Chaves reais de configuracao nao encontradas no arquivo frontend/.env! " +
    "O aplicativo rodará no modo de fallback/bypass local com credenciais simuladas."
  );
}

const app = isConfigured ? initializeApp(firebaseConfig) : null;
export const auth = app ? getAuth(app) : mockAuth;

function createGoogleProvider() {
  const provider = new GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');
  // Sempre exibe o seletor de contas Google (não loga direto na última conta)
  provider.setCustomParameters({ prompt: 'select_account' });
  return provider;
}

export const googleProvider = createGoogleProvider();

const AUTH_ERRORS = {
  'auth/invalid-email': 'E-mail inválido.',
  'auth/user-not-found': 'Usuário não encontrado.',
  'auth/wrong-password': 'Senha incorreta.',
  'auth/invalid-credential': 'E-mail ou senha incorretos.',
  'auth/email-already-in-use': 'Este e-mail já está cadastrado.',
  'auth/weak-password': 'A senha deve ter pelo menos 6 caracteres.',
  'auth/operation-not-allowed': 'Login por e-mail não está habilitado no Firebase Console.',
  'auth/too-many-requests': 'Muitas tentativas. Aguarde um momento e tente novamente.',
  'auth/popup-closed-by-user': 'Login cancelado.',
  'auth/network-request-failed': 'Erro de conexão. Verifique sua internet.',
};

function mapAuthError(error) {
  const code = error?.code || '';
  return AUTH_ERRORS[code] || error?.message || 'Falha na autenticação.';
}

function ensureAuth() {
  if (!auth) {
    throw new Error("O Firebase não foi configurado. Verifique o arquivo frontend/.env.");
  }
  return auth;
}

async function applyPersistence(rememberMe = true) {
  const instance = ensureAuth();
  await setPersistence(
    instance,
    rememberMe ? browserLocalPersistence : browserSessionPersistence
  );
}

export async function loginWithGoogle(rememberMe = true) {
  if (!isConfigured) {
    localStorage.setItem("mock_logged_in", "true");
    setTimeout(() => {
      window.location.reload();
    }, 100);
    return { user: mockAuth.currentUser };
  }
  await applyPersistence(rememberMe);
  const provider = createGoogleProvider();
  try {
    return await signInWithPopup(ensureAuth(), provider);
  } catch (error) {
    throw new Error(mapAuthError(error));
  }
}

export async function loginWithEmail(email, password, rememberMe = true) {
  if (!isConfigured) {
    localStorage.setItem("mock_logged_in", "true");
    setTimeout(() => {
      window.location.reload();
    }, 100);
    return { user: mockAuth.currentUser };
  }
  await applyPersistence(rememberMe);
  try {
    return await signInWithEmailAndPassword(ensureAuth(), email.trim(), password);
  } catch (error) {
    throw new Error(mapAuthError(error));
  }
}

export async function registerWithEmail(email, password, rememberMe = true) {
  if (!isConfigured) {
    localStorage.setItem("mock_logged_in", "true");
    setTimeout(() => {
      window.location.reload();
    }, 100);
    return { user: mockAuth.currentUser };
  }
  await applyPersistence(rememberMe);
  try {
    return await createUserWithEmailAndPassword(ensureAuth(), email.trim(), password);
  } catch (error) {
    throw new Error(mapAuthError(error));
  }
}

export async function resetPassword(email) {
  if (!isConfigured) {
    return;
  }
  try {
    await sendPasswordResetEmail(ensureAuth(), email.trim());
  } catch (error) {
    throw new Error(mapAuthError(error));
  }
}

export async function logout() {
  if (!isConfigured) {
    localStorage.removeItem("mock_logged_in");
    setTimeout(() => {
      window.location.reload();
    }, 100);
    return;
  }
  if (!auth) return;
  return signOut(auth);
}
