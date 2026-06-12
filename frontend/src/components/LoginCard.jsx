import { isFirebaseConfigured, initError } from '../services/firebase';
import { formatError } from '../utils/formatError';

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path
        fill="#ffffff"
        d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-6.887 4.114-4.664 0-8.443-3.778-8.443-8.443s3.778-8.443 8.443-8.443c2.25 0 4.18.81 5.67 2.22l3.17-3.17C18.91 1.91 15.9 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.478 0 10.793-4.537 10.793-10.978 0-.74-.067-1.422-.19-2.22H12.24z"
      />
    </svg>
  );
}

export default function LoginCard({ error, setError, onLogin }) {
  const firebaseReady = isFirebaseConfigured && !initError;

  return (
    <aside id="login" className="login-panel">
      <div className="login-panel__card">
        <div className="login-panel__glow" />

        <h2 className="login-panel__title">Acesse sua conta</h2>
        <p className="login-panel__subtitle">
          Entre com sua conta Google para continuar sua jornada no Python Arcade.
        </p>

        {!firebaseReady && (
          <div className="login-panel__config-warning">
            <strong>Firebase nao configurado</strong>
            <p>
              Crie o arquivo <code>frontend/.env.local</code> com as variaveis{' '}
              <code>VITE_FIREBASE_*</code> (veja <code>.env.example</code>) e reinicie o servidor.
            </p>
          </div>
        )}

        {error && (
          <div className="error-banner animate-fade-in login-panel__error">
            <span>{formatError(error)}</span>
            <button type="button" onClick={() => setError(null)} className="error-close">x</button>
          </div>
        )}

        <button
          type="button"
          className="login-panel__google"
          onClick={onLogin}
          disabled={!firebaseReady}
        >
          <GoogleIcon />
          Entrar com Google
        </button>

        <p className="login-panel__secure">
          Autenticacao segura provida pelo Google Firebase.
        </p>
      </div>
    </aside>
  );
}
