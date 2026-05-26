import { useState, useEffect } from 'react';
import Home from './pages/Home';
import Exercise from './pages/Exercise';
import MiniGame from './components/MiniGame';
import { generateProblem, submitCode } from './services/api';
import './App.css';

const VIEW = { HOME: 'home', LOADING: 'loading', EXERCISE: 'exercise', MINIGAME: 'minigame' };

export default function App() {
  const [view, setView] = useState(VIEW.HOME);
  const [problem, setProblem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isProblemReady, setIsProblemReady] = useState(false);

  // ETA dinamico e preciso
  const [eta, setEta] = useState(180);
  const [phase, setPhase] = useState('Agente 1: Iniciando conexao com o OpenRouter...');

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
    setView(VIEW.LOADING);
    try {
      const data = await generateProblem(topic, difficulty);
      setProblem(data);
      setIsProblemReady(true);
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Erro ao gerar o problema. Tente novamente.';
      setError(msg);
      setView(VIEW.HOME);
    }
  };

  const handleSubmit = async (code) => {
    if (!problem) return;
    setIsSubmitting(true);
    setResult(null);
    try {
      const data = await submitCode(problem.problem_id, code);
      setResult(data);
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
  };

  const handleSelectProblem = (selected) => {
    setError(null);
    setResult(null);
    setProblem(selected);
    setView(VIEW.EXERCISE);
  };

  return (
    <div className="app-layout">
      {/* Navbar */}
      <header className="navbar">
        <div className="container flex items-center justify-between">
          <button className="navbar-brand" onClick={handleBack}>
            <span className="navbar-logo">APC</span>
            <span className="navbar-name">Pygame-APC</span>
          </button>
          <nav className="navbar-links" style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn-secondary"
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              onClick={() => {
                setError(null);
                setResult(null);
                setView(VIEW.MINIGAME);
              }}
            >
              Jogar Mini-game
            </button>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="btn-secondary"
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            >
              GitHub
            </a>
          </nav>
        </div>
      </header>

      {/* Conteudo */}
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
                    <div className="flex items-center justify-between" style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div className="flex items-center gap-2" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="spinner" style={{ width: 16, height: 16 }} />
                        <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>{phase}</span>
                      </div>
                      <span style={{ fontSize: '1rem', color: '#6366f1', fontWeight: 'bold' }}>
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
                onGoToExercise={() => {
                  setView(VIEW.EXERCISE);
                  setIsProblemReady(false);
                }}
              />
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>Pygame-APC &mdash; Problemas gerados por IA, revisados por pares LLM.</p>
        </div>
      </footer>
    </div>
  );
}
