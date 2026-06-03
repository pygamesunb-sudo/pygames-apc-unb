import { useState, useEffect } from 'react';
import { 
  Play, 
  Terminal, 
  Award, 
  Trophy, 
  History, 
  LogOut, 
  ArrowRight, 
  Sparkles, 
  Code,
  User,
  BookOpen
} from 'lucide-react';
import Home from './pages/Home';
import Exercise from './pages/Exercise';
import MiniGame from './components/MiniGame';
import Leaderboard from './components/Leaderboard';
import SubmissionHistory from './components/SubmissionHistory';
import ApiDocs from './pages/ApiDocs';
import LoginCard from './components/LoginCard';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';

import { generateProblemStream, validateProblem, reviewProblem, submitCode, getUserProfile } from './services/api';
import { parsePartialJson } from './utils/partialJsonParser';
import { auth, loginWithGoogle, logout } from './services/firebase';
import './App.css';

const VIEW = { 
  HOME: 'home', 
  LOADING: 'loading', 
  EXERCISE: 'exercise', 
  MINIGAME: 'minigame',
  LEADERBOARD: 'leaderboard',
  HISTORY: 'history',
  DOCS: 'docs'
};

export default function App() {
  const [view, setView] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    if (Object.values(VIEW).includes(hash)) {
      if (hash === VIEW.EXERCISE || hash === VIEW.LOADING) {
        return VIEW.HOME;
      }
      return hash;
    }
    return VIEW.HOME;
  });
  const [problem, setProblem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isProblemReady, setIsProblemReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [validationStatus, setValidationStatus] = useState(''); // '', 'validating', 'reviewing', 'validated'
  const [phase, setPhase] = useState('');

  // Sincroniza o estado de visualização do React com a URL Hash (histórico de navegação)
  useEffect(() => {
    if (window.location.hash !== `#${view}`) {
      window.location.hash = view;
    }
  }, [view]);

  // Escuta o evento hashchange do navegador para suportar botões de Voltar / Avançar
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (Object.values(VIEW).includes(hash)) {
        if ((hash === VIEW.EXERCISE || hash === VIEW.LOADING) && !problem) {
          setView(VIEW.HOME);
          window.location.hash = VIEW.HOME;
        } else {
          setView(hash);
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [problem]);

  // Estados de Autenticacao
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // ETA dinamico e preciso
  const [eta, setEta] = useState(180);

  // Auto-redireciona para o exercicio ao terminar se o usuario nao estiver jogando
  useEffect(() => {
    if (isProblemReady && view !== VIEW.EXERCISE && view !== VIEW.MINIGAME) {
      setView(VIEW.EXERCISE);
      setIsProblemReady(false);
    }
  }, [isProblemReady, view]);

  // Monitora estado de login
  useEffect(() => {
    if (!auth) {
      setIsAuthLoading(false);
      return;
    }

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const profile = await getUserProfile();
          setUserProfile(profile);
          // Sincroniza API Key e ativacao do Gemini do Firestore com o localStorage
          if (profile.gemini_api_key !== undefined) {
            if (profile.gemini_api_key) {
              localStorage.setItem('gemini_api_key', profile.gemini_api_key);
            } else {
              localStorage.removeItem('gemini_api_key');
            }
          }
          if (profile.use_custom_key !== undefined) {
            localStorage.setItem('use_custom_key', profile.use_custom_key ? 'true' : 'false');
          }
        } catch (err) {
          console.error("Falha ao carregar perfil do usuario logado:", err);
        }
      } else {
        setUserProfile(null);
        // Limpa chaves locais ao deslogar
        localStorage.removeItem('gemini_api_key');
        localStorage.removeItem('use_custom_key');
      }
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Timer do ETA
  useEffect(() => {
    if (view !== 'loading') {
      setEta(180);
      setPhase('Agente 1: Iniciando conexao com o OpenRouter...');
      return;
    }

    const interval = setInterval(() => {
      setEta((prevEta) => {
        const nextEta = prevEta - 1;
        
        if (nextEta > 100) {
          setPhase('Agente 1: Gerando enunciado, casos de teste e solucao em Python...');
        } else if (nextEta > 20) {
          setPhase('Agentes 2 & 3: Executando solucao em Python e revisando qualidade...');
        } else if (nextEta > 5) {
          setPhase('Consolidando: Salvando o problema de programacao verificado...');
        } else {
          setPhase('Finalizando: Carregando area de exercicios...');
        }

        if (nextEta <= 3) {
          return 3;
        }
        return nextEta;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [view]);

  const handleGenerate = async (topic, difficulty) => {
    setError(null);
    setResult(null);
    setIsProblemReady(false);
    setIsGenerating(true);
    setValidationStatus('');
    
    // Inicia imediatamente a tela de exercicio com conteudo parcial
    setProblem({ title: 'Pensando...', description: 'Aguarde, gerando problema...', hints: [], test_cases: [], difficulty, topic });
    setView(VIEW.EXERCISE);

    let rawJson = "";

    try {
      await generateProblemStream(topic, difficulty, (chunk) => {
        rawJson += chunk;
        const partialData = parsePartialJson(rawJson);
        setProblem(prev => ({ ...prev, ...partialData, difficulty, topic }));
      });
      
      let completeProblem;
      try {
        completeProblem = JSON.parse(rawJson);
      } catch (e) {
        completeProblem = parsePartialJson(rawJson);
      }

      setProblem({ ...completeProblem, difficulty, topic });

      // Inicia a validacao local pos-streaming
      setValidationStatus('validating');
      const valResponse = await validateProblem(completeProblem.solution || "", completeProblem.test_cases || []);
      
      if (valResponse.passed) {
        setValidationStatus('validated');
        setIsProblemReady(true);
      } else {
        setValidationStatus('reviewing');
        const reviewedProblem = await reviewProblem(completeProblem);
        setProblem(reviewedProblem);
        setValidationStatus('validated');
        setIsProblemReady(true);
      }

    } catch (err) {
      const msg = err.message || 'Erro ao gerar o problema. Tente novamente.';
      setError(msg);
      setView(VIEW.HOME);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (code) => {
    if (!problem) return;
    setIsSubmitting(true);
    setResult(null);
    try {
      const data = await submitCode(problem.problem_id, code);
      setResult(data);
      // Sincroniza os novos pontos obtidos localmente no perfil
      if (userProfile) {
        setUserProfile(prev => ({
          ...prev,
          coding_points: data.coding_points !== undefined ? data.coding_points : prev.coding_points,
          total_score: data.total_score !== undefined ? data.total_score : prev.total_score
        }));
      }
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Erro ao submeter o codigo.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    setProblem(null);
    setResult(null);
    setError(null);
    setIsProblemReady(false);
    setView(VIEW.HOME);
    // Recarrega o perfil do usuario para manter sincronismo de pontuacao
    if (currentUser) {
      getUserProfile()
        .then(profile => setUserProfile(profile))
        .catch(err => console.error(err));
    }
  };

  const handleSelectProblem = (selected) => {
    setError(null);
    setResult(null);
    setProblem(selected);
    setView(VIEW.EXERCISE);
  };

  // Render do Carregamento Inicial
  if (isAuthLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#090d16', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" style={{ width: 40, height: 40, borderColor: '#6366f1' }} />
      </div>
    );
  }

  // Render da Tela de Login Obrigatório
  if (!currentUser) {
    return (
      <LoginCard 
        error={error}
        setError={setError}
        onLogin={async () => {
          setError(null);
          try {
            await loginWithGoogle();
          } catch (e) {
            setError(e.message || "Falha ao autenticar com o Google.");
          }
        }}
      />
    );
  }

  return (
    <div className="app-layout">
      {/* Navbar com links de menu e API Docs */}
      <Navbar 
        view={view}
        setView={setView}
        VIEW={VIEW}
        currentUser={currentUser}
        userProfile={userProfile}
        onLogout={async () => {
          try {
            await logout();
          } catch (e) {
            console.error(e);
          }
        }}
        onBack={handleBack}
        setError={setError}
        setResult={setResult}
      />

      {/* Conteudo Principal */}
      <main className="main-content">
        <div className="container">
          {/* Banner de erro global */}
          {error && (
            <div className="error-banner animate-fade-in">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="error-close">x</button>
            </div>
          )}

          {view === VIEW.HOME && (
            <Home onGenerate={handleGenerate} onSelectProblem={handleSelectProblem} isLoading={false} />
          )}

          {view === VIEW.LOADING && (
            <div className="loading-view animate-fade-in" style={{ width: '100%' }}>
              <div className="loading-container card" style={{ width: '100%', maxWidth: 500, margin: '0 auto 24px', padding: 24, border: '1px solid rgba(99,102,241,0.2)' }}>
                {isProblemReady ? (
                  <div className="text-center animate-fade-in">
                    <span className="badge badge--facil" style={{ padding: '6px 14px', fontSize: '0.85rem', marginBottom: 12 }}>
                      COMPILADO COM SUCESSO!
                    </span>
                    <h3 style={{ margin: '0 0 12px 0', color: '#f8fafc' }}>Seu desafio de programação está pronto!</h3>
                    <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: 20 }}>
                      Você pode continuar se divertindo no fliperama abaixo ou clicar no botão para resolver o exercício de Python.
                    </p>
                    <button 
                      className="btn-primary w-full justify-center" 
                      onClick={() => {
                        setView(VIEW.EXERCISE);
                        setIsProblemReady(false);
                      }}
                    >
                      Iniciar Desafio de Programação
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="loading-header-wrapper">
                      <div className="loading-phase-container">
                        <div className="spinner" style={{ width: 16, height: 16, flexShrink: 0 }} />
                        <span className="loading-phase-text">{phase}</span>
                      </div>
                      <span className="loading-eta-text">
                        ETA: {eta}s
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div style={{ background: '#1e293b', borderRadius: 999, height: 6, overflow: 'hidden', width: '100%', marginBottom: 12 }}>
                      <div 
                        style={{ 
                          background: 'linear-gradient(90deg, #6366f1 0%, #a855f7 100%)', 
                          height: '100%', 
                          width: `${Math.min(100, ((180 - eta) / 180) * 100)}%`,
                          transition: 'width 1s linear'
                        }} 
                      />
                    </div>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', textAlign: 'center' }}>
                      Enquanto a IA trabalha, divirta-se jogando mini-games retrô no fliperama abaixo!
                    </p>
                  </>
                )}
              </div>
              <MiniGame 
                visible={true} 
                isProblemReady={isProblemReady}
                userProfile={userProfile}
                onGoToExercise={() => {
                  setView(VIEW.EXERCISE);
                  setIsProblemReady(false);
                }}
              />
            </div>
          )}

          {view === VIEW.EXERCISE && problem && (
            <Exercise
              problem={problem}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              result={result}
              onBack={handleBack}
              validationStatus={validationStatus}
              isGenerating={isGenerating}
            />
          )}

          {view === VIEW.MINIGAME && (
            <div className="loading-view animate-fade-in" style={{ width: '100%' }}>
              <div className="arcade-header flex items-center justify-between w-full" style={{ marginBottom: 20, maxWidth: 900 }}>
                <h2 style={{ margin: 0, color: '#f8fafc', fontWeight: 600 }}>Modo Arcade Retro</h2>
                <button className="btn-primary" onClick={handleBack}>
                  Voltar para o Inicio
                </button>
              </div>
              <MiniGame 
                visible={true} 
                isProblemReady={isProblemReady}
                userProfile={userProfile}
                onGoToExercise={() => {
                  setView(VIEW.EXERCISE);
                  setView(VIEW.EXERCISE);
                  setIsProblemReady(false);
                }}
              />
            </div>
          )}

          {view === VIEW.LEADERBOARD && (
            <Leaderboard onBack={handleBack} />
          )}

          {view === VIEW.HISTORY && (
            <SubmissionHistory onBack={handleBack} />
          )}

          {/* Rota para Documentação da API */}
          {view === VIEW.DOCS && (
            <ApiDocs 
              currentUser={currentUser}
              userProfile={userProfile}
              setUserProfile={setUserProfile}
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>Pygame-APC &mdash; Problemas gerados por IA, revisados por pares LLM.</p>
        </div>
      </footer>

      {/* Floating Action Button (FAB) de Progresso da IA */}
      {((isGenerating && view !== VIEW.LOADING) || (isProblemReady && view !== VIEW.EXERCISE && view !== VIEW.LOADING)) && (
        <button 
          className={`floating-generator-fab ${isProblemReady ? 'floating-generator-fab--ready' : ''}`}
          onClick={() => {
            if (isProblemReady) {
              setView(VIEW.EXERCISE);
              setIsProblemReady(false);
            } else {
              setView(VIEW.LOADING);
            }
          }}
        >
          {isProblemReady ? (
            <>
              <Sparkles size={16} className="animate-pulse" style={{ color: '#10b981' }} />
              <span>Desafio Pronto! Iniciar</span>
            </>
          ) : (
            <>
              <div className="spinner" style={{ width: 14, height: 14, borderColor: '#6366f1' }} />
              <span>Gerando Desafio: {eta}s</span>
            </>
          )}
        </button>
      )}

      {/* Barra de Navegação Inferior (Bottom Navigation Bar) - Visível apenas no Mobile */}
      <BottomNav 
        view={view}
        setView={setView}
        VIEW={VIEW}
        onLogout={async () => {
          try {
            await logout();
          } catch (e) {
            console.error(e);
          }
        }}
        onBack={handleBack}
        setError={setError}
        setResult={setResult}
      />
    </div>
  );
}
