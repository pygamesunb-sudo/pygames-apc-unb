import { useState, useEffect } from 'react';
import {
  Code2,
  Brain,
  Gamepad2,
  Trophy,
  ArrowRight,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Users,
  Star,
  ChevronRight,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  loginWithGoogle,
  loginWithEmail,
  registerWithEmail,
  resetPassword,
} from '../services/firebase';
import './LandingPage.css';

const NAV_LINKS = [
  { id: 'inicio', label: 'Início' },
  { id: 'recursos', label: 'Recursos' },
  { id: 'como-funciona', label: 'Como Funciona' },
  { id: 'sobre', label: 'Sobre' },
  { id: 'contato', label: 'Contato' },
];

const FEATURES = [
  {
    icon: Brain,
    title: 'IA Inteligente',
    desc: 'Exercícios gerados e validados por IA.',
    color: '#a855f7',
  },
  {
    icon: Gamepad2,
    title: 'Mini-games',
    desc: 'Jogos retrô para desafiar sua mente.',
    color: '#3b82f6',
  },
  {
    icon: Trophy,
    title: 'Gamificação',
    desc: 'Ganhe XP, conquistas e suba no ranking.',
    color: '#f59e0b',
  },
];

const STATS = [
  { icon: Users, value: '2.500+', label: 'Usuários ativos' },
  { icon: Code2, value: '15.000+', label: 'Exercícios gerados' },
  { icon: Trophy, value: '120.000+', label: 'Desafios resolvidos' },
  { icon: Star, value: '98%', label: 'Satisfação dos alunos' },
];

function ArcadeIllustration({ activeField, isLoading }) {
  return (
    <div className="arcade-illustration" aria-hidden="true">
      <div className="arcade-illustration__glow" />
      <div className="arcade-illustration__grid" />

      <div className="float-card float-card--progress">
        <div className="float-card__bar">
          <div className="float-card__bar-fill" />
        </div>
        <span>72%</span>
      </div>

      <div className="float-card float-card--ranking">
        <span className="float-card__label">Ranking</span>
        <strong>#3</strong>
        <div className="float-card__chart">
          <span /><span /><span />
        </div>
      </div>

      <div className="float-card float-card--challenge">
        <Code2 size={12} className="float-card__code-icon" />
        <span>Desafio Gerado por IA</span>
      </div>

      <div className="float-pixel float-pixel--alien">👾</div>
      <div className="float-pixel float-pixel--heart">❤️</div>
      <div className="float-pixel float-pixel--star">⭐</div>
      <div className="float-pixel float-pixel--joystick">🕹️</div>

      <div className="arcade-machine">
        <div className="arcade-machine__monitor">
          <div className={`arcade-machine__screen ${isLoading ? 'arcade-machine__screen--loading' : ''} ${activeField ? 'arcade-machine__screen--active' : ''}`}>
            <div className="crt-glow-overlay" />
            <div className="scanlines-overlay" />
            
            {isLoading ? (
              <div className="arcade-screen-status loading">
                <span className="arcade-screen-dot pulse" />
                <span className="arcade-screen-text font-mono">LOADING...</span>
                <span className="arcade-screen-sub font-mono">CONNECTING TO HOST</span>
              </div>
            ) : activeField === 'email' ? (
              <div className="arcade-screen-status active">
                <span className="arcade-screen-text font-mono">&gt; INPUT: EMAIL</span>
                <span className="arcade-screen-sub font-mono">sys.read_input()</span>
                <div className="matrix-rain-mock">
                  <span>10101</span><span>01101</span><span>11001</span>
                </div>
              </div>
            ) : activeField === 'password' ? (
              <div className="arcade-screen-status active-alt">
                <span className="arcade-screen-text font-mono">&gt; SECURE KEY</span>
                <span className="arcade-screen-sub font-mono">decrypting_sha256</span>
                <div className="lock-icon-glow">🔒</div>
              </div>
            ) : (
              <div className="arcade-screen-status idle">
                <Code2 size={44} strokeWidth={1.5} className="pulse-logo" />
                <span className="arcade-screen-start font-mono">PRESS START</span>
              </div>
            )}
          </div>
          <div className="arcade-machine__stand" />
        </div>
        <div className="arcade-machine__keyboard">
          {Array.from({ length: 18 }).map((_, i) => (
            <span 
              key={i} 
              className={activeField ? 'arcade-machine__key--typing' : ''} 
              style={{ animationDelay: `${i * 0.05}s` }} 
            />
          ))}
        </div>
        <div className={`arcade-machine__joystick ${activeField ? 'arcade-machine__joystick--moving' : ''}`} />
      </div>
    </div>
  );
}

export default function LandingPage({ error, setError }) {
  const [activeNav, setActiveNav] = useState('inicio');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSignup, setIsSignup] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Interactive enhancements
  const [activeField, setActiveField] = useState(null);
  const [isMuted, setIsMuted] = useState(true);
  const [shakeError, setShakeError] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    // Calculate values from -1 to 1 representing relative mouse location
    setMousePos({
      x: (clientX / innerWidth - 0.5) * 2,
      y: (clientY / innerHeight - 0.5) * 2,
    });
  };

  const playSound = (type) => {
    if (isMuted) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'type') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440 + Math.random() * 80, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.04);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
        osc.start();
        osc.stop(ctx.currentTime + 0.04);
      } else if (type === 'click') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.setValueAtTime(900, ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      } else if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16); // G5
        osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.24); // C6
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else if (type === 'error') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.setValueAtTime(100, ctx.currentTime + 0.06);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      }
    } catch (e) {
      console.warn("AudioContext failed", e);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Preencha e-mail e senha.');
      setShakeError(true);
      playSound('error');
      setTimeout(() => setShakeError(false), 500);
      return;
    }

    setError(null);
    setSuccessMsg('');
    setIsLoading(true);
    try {
      if (isSignup) {
        await registerWithEmail(email, password, rememberMe);
      } else {
        await loginWithEmail(email, password, rememberMe);
      }
      playSound('success');
    } catch (err) {
      setError(err.message || 'Falha ao autenticar.');
      setShakeError(true);
      playSound('error');
      setTimeout(() => setShakeError(false), 500);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setSuccessMsg('');
    setIsLoading(true);
    try {
      await loginWithGoogle(rememberMe);
      playSound('success');
    } catch (err) {
      setError(err.message || 'Falha ao autenticar com o Google.');
      setShakeError(true);
      playSound('error');
      setTimeout(() => setShakeError(false), 500);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError('Digite seu e-mail para recuperar a senha.');
      setShakeError(true);
      playSound('error');
      setTimeout(() => setShakeError(false), 500);
      return;
    }
    setError(null);
    setSuccessMsg('');
    setIsLoading(true);
    try {
      await resetPassword(email);
      setSuccessMsg('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
      playSound('success');
    } catch (err) {
      setError(err.message || 'Não foi possível enviar o e-mail de recuperação.');
      setShakeError(true);
      playSound('error');
      setTimeout(() => setShakeError(false), 500);
    } finally {
      setIsLoading(false);
    }
  };

  const scrollTo = (id) => {
    setActiveNav(id);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    playSound('click');
  };

  return (
    <div 
      className="landing" 
      onMouseMove={handleMouseMove} 
      style={{ 
        '--mouse-x': mousePos.x, 
        '--mouse-y': mousePos.y 
      }}
    >
      <header className="landing-nav">
        <div className="landing-nav__inner">
          <button className="landing-logo" onClick={() => scrollTo('inicio')}>
            <span className="landing-logo__icon">
              <Code2 size={18} />
            </span>
            <span className="landing-logo__text glitch-title" data-text="PYTHON ARCADE">
              <span className="landing-logo__python">PYTHON</span>
              <span className="landing-logo__arcade">ARCADE</span>
            </span>
          </button>

          <nav className="landing-nav__links">
            {NAV_LINKS.map(({ id, label }) => (
              <button
                key={id}
                className={`landing-nav__link ${activeNav === id ? 'landing-nav__link--active' : ''}`}
                onClick={() => scrollTo(id)}
              >
                {label}
              </button>
            ))}
          </nav>

          <div className="landing-nav__actions">
            <button 
              className={`landing-sound-btn ${!isMuted ? 'active' : ''}`}
              onClick={() => { setIsMuted(!isMuted); playSound('click'); }}
              title={isMuted ? "Ativar som retrô" : "Mutar som"}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              <span>{isMuted ? 'AUDIO OFF' : 'AUDIO ON'}</span>
            </button>
            <button className="landing-nav__cta" onClick={() => scrollTo('login')}>
              Começar Agora
            </button>
          </div>
        </div>
      </header>

      <main className="landing-main" id="inicio">
        <section className="landing-hero">
          <div className="landing-hero__left">
            <span className="landing-badge">APRENDA. PRATIQUE. EVOLUA.</span>

            <h1 className="landing-title neon-title">
              Aprenda Python de forma{' '}
              <span className="landing-title__purple">divertida</span> e{' '}
              <span className="landing-title__blue">inteligente.</span>
            </h1>

            <p className="landing-desc">
              Exercícios gerados por IA, mini-games retrô e gamificação completa.
              Aprenda programação jogando em um fliperama cyberpunk.
            </p>

            <div className="landing-features" id="recursos">
              {FEATURES.map(({ icon: Icon, title, desc, color }) => (
                <div key={title} className="landing-feature-card">
                  <span className="landing-feature-card__icon" style={{ color, borderColor: `${color}50` }}>
                    <Icon size={20} />
                  </span>
                  <strong>{title}</strong>
                  <p>{desc}</p>
                </div>
              ))}
            </div>

            <div className="landing-cta-row">
              <button className="landing-btn-primary" onClick={() => scrollTo('login')}>
                Explorar Plataforma
                <ArrowRight size={18} />
              </button>
              <button className="landing-btn-ghost" onClick={() => scrollTo('como-funciona')}>
                Saiba mais
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="landing-hero__center">
            <ArcadeIllustration activeField={activeField} isLoading={isLoading} />
          </div>

          <div className="landing-hero__right" id="login">
            <div className={`landing-login__card cyber-panel ${shakeError ? 'shake' : ''}`}>
              <div className="cyber-bracket cyber-bracket--top-left" />
              <div className="cyber-bracket cyber-bracket--top-right" />
              <div className="cyber-bracket cyber-bracket--bottom-left" />
              <div className="cyber-bracket cyber-bracket--bottom-right" />
              <div className="cyber-grid-overlay" />
              
              <div className="cyber-terminal-header">
                <div className="cyber-status-light">
                  <span className="blinking-dot"></span>
                  <span>SYS.AUTH_SECURE</span>
                </div>
                <span className="cyber-serial">NODE // APC-88</span>
              </div>

              <h2>{isSignup ? 'CREATE_ACCOUNT.EXE' : 'ACCESS_SYSTEM.EXE'}</h2>
              <p className="cyber-sub">
                {isSignup
                  ? 'Cadastre-se e inicialize sua simulação no Python Arcade.'
                  : 'Insira suas credenciais para reestabelecer conexão.'}
              </p>

              <form onSubmit={handleEmailAuth}>
                <label className="landing-field cyber-field">
                  <Mail size={16} className={`field-icon ${activeField === 'email' ? 'active' : ''}`} />
                  <input
                    type="email"
                    placeholder="E-mail"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); playSound('type'); }}
                    onFocus={() => { setActiveField('email'); playSound('type'); }}
                    onBlur={() => setActiveField(null)}
                    autoComplete="email"
                  />
                </label>

                <label className="landing-field cyber-field">
                  <Lock size={16} className={`field-icon ${activeField === 'password' ? 'active' : ''}`} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Senha"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); playSound('type'); }}
                    onFocus={() => { setActiveField('password'); playSound('type'); }}
                    onBlur={() => setActiveField(null)}
                    autoComplete={isSignup ? 'new-password' : 'current-password'}
                  />
                  <button
                    type="button"
                    className="landing-field__toggle"
                    onClick={() => { setShowPassword((v) => !v); playSound('click'); }}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </label>

                <div className="landing-form-row">
                  <label className="landing-checkbox cyber-checkbox-label">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => { setRememberMe(e.target.checked); playSound('click'); }}
                    />
                    <span className="cyber-checkbox-custom" />
                    Lembrar de mim
                  </label>
                  <button 
                    type="button" 
                    className="landing-link cyber-link" 
                    onClick={() => { handleForgotPassword(); playSound('click'); }}
                  >
                    Esqueci minha senha
                  </button>
                </div>

                {error && (
                  <div className="landing-error cyber-alert cyber-alert--error">
                    <div className="cyber-alert__accent" />
                    <span>{error}</span>
                    <button type="button" onClick={() => { setError(null); playSound('click'); }}>×</button>
                  </div>
                )}

                {successMsg && (
                  <div className="landing-success cyber-alert cyber-alert--success">
                    <div className="cyber-alert__accent" />
                    <span>{successMsg}</span>
                  </div>
                )}

                <button 
                  type="submit" 
                  className="landing-btn-submit cyber-btn" 
                  disabled={isLoading}
                  onClick={() => playSound('click')}
                >
                  {isLoading ? (
                    <div className="btn-loader">
                      <span className="spinner"></span>
                      <span>CONNECTING...</span>
                    </div>
                  ) : isSignup ? (
                    'INITIALIZE_CADASTRO.EXE'
                  ) : (
                    'CONNECT_SESSION.EXE'
                  )}
                </button>
              </form>

              <div className="landing-divider cyber-divider">
                <span>ALTERNATIVE_AUTH</span>
              </div>

              <button 
                className="landing-btn-google cyber-btn-social" 
                onClick={() => { handleGoogleLogin(); playSound('click'); }} 
                disabled={isLoading}
              >
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" opacity="0.8" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" opacity="0.7" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" opacity="0.9" />
                </svg>
                ENTRAR_COM_GOOGLE
              </button>

              <p className="landing-signup cyber-signup-footer">
                {isSignup ? 'SYS.REGISTERED_USER?' : 'SYS.NEW_USER?'}{' '}
                <button
                  type="button"
                  className="landing-link cyber-link"
                  onClick={() => {
                    setIsSignup((v) => !v);
                    setError(null);
                    setSuccessMsg('');
                    playSound('click');
                  }}
                >
                  {isSignup ? '[LOGIN]' : '[SIGN_UP]'}
                </button>
              </p>
            </div>
          </div>
        </section>

        <section className="landing-info" id="como-funciona">
          <div className="landing-info__block" id="sobre">
            <h3>Como Funciona</h3>
            <p>
              Escolha um tema, gere exercícios personalizados com IA e resolva em blocos ou código.
              Enquanto a IA trabalha, jogue mini-games retrô no fliperama.
            </p>
          </div>
          <div className="landing-info__block" id="contato">
            <h3>Sobre o Projeto</h3>
            <p>
              Python Arcade combina aprendizado de programação com gamificação,
              ranking global e desafios gerados por modelos de linguagem revisados por pares.
            </p>
          </div>
        </section>
      </main>

      <footer className="landing-stats">
        {STATS.map(({ icon: Icon, value, label }) => (
          <div key={label} className="landing-stat">
            <span className="landing-stat__icon">
              <Icon size={20} />
            </span>
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </footer>
    </div>
  );
}
