import { useState, useEffect, useCallback } from 'react';
import DoodleNinja from './minigames/DoodleNinja';
import SnakePy from './minigames/SnakePy';
import BugInvaders from './minigames/BugInvaders';
import { updateGameScore } from '../services/api';

const GAME_VIEWS = {
  MENU: 'menu',
  DOODLE: 'doodle',
  SNAKE: 'snake',
  INVADERS: 'invaders'
};

export default function MiniGame({ visible, isProblemReady, onGoToExercise, userProfile }) {
  const [activeGame, setActiveGame] = useState(GAME_VIEWS.MENU);
  const [highScores, setHighScores] = useState({
    doodle: 0,
    snake: 0,
    invaders: 0
  });

  const [gameOverScore, setGameOverScore] = useState(null);
  const [isNewRecord, setIsNewRecord] = useState(false);

  // Carrega pontuações máximas históricas do localStorage ou sincroniza com o banco de dados do Firebase
  useEffect(() => {
    if (userProfile && userProfile.games) {
      setHighScores({
        doodle: userProfile.games.doodle || 0,
        snake: userProfile.games.snake || 0,
        invaders: userProfile.games.invaders || 0
      });
    } else {
      const cachedDoodle = localStorage.getItem('apc_highscore_doodle') || 0;
      const cachedSnake = localStorage.getItem('apc_highscore_snake') || 0;
      const cachedInvaders = localStorage.getItem('apc_highscore_invaders') || 0;

      setHighScores({
        doodle: parseInt(cachedDoodle, 10),
        snake: parseInt(cachedSnake, 10),
        invaders: parseInt(cachedInvaders, 10)
      });
    }
  }, [userProfile]);

  const handleGameOver = useCallback(async (gameKey, finalScore) => {
    setGameOverScore(finalScore);
    
    // Atualiza recorde no banco do Firebase de forma assincrona
    try {
      await updateGameScore(gameKey, finalScore);
      console.log(`[Arcade] Score de ${gameKey} atualizado com sucesso no Firebase.`);
    } catch (err) {
      console.error("[Arcade] Falha ao sincronizar score no Firebase:", err);
    }

    // Sincroniza localmente se necessário
    const currentHigh = highScores[gameKey];
    if (finalScore > currentHigh) {
      setIsNewRecord(true);
      const updatedScores = { ...highScores, [gameKey]: finalScore };
      setHighScores(updatedScores);
      localStorage.setItem(`apc_highscore_${gameKey}`, finalScore.toString());
    } else {
      setIsNewRecord(false);
    }
  }, [highScores]);

  const handleDoodleGameOver = useCallback((score) => {
    handleGameOver('doodle', score);
  }, [handleGameOver]);

  const handleSnakeGameOver = useCallback((score) => {
    handleGameOver('snake', score);
  }, [handleGameOver]);

  const handleInvadersGameOver = useCallback((score) => {
    handleGameOver('invaders', score);
  }, [handleGameOver]);

  const handleRestart = () => {
    setGameOverScore(null);
    setIsNewRecord(false);
    const currentGame = activeGame;
    setActiveGame(GAME_VIEWS.MENU);
    setTimeout(() => {
      setActiveGame(currentGame);
    }, 50);
  };

  const handleBackToHub = () => {
    setGameOverScore(null);
    setIsNewRecord(false);
    setActiveGame(GAME_VIEWS.MENU);
  };

  if (!visible) return null;

  return (
    <div className="arcade-cabinet-wrapper">
      {activeGame === GAME_VIEWS.MENU ? (
        <div className="arcade-hub-menu card animate-fade-in" style={{ width: '100%' }}>
          
          {/* Banner de problema pronto no topo do Hub */}
          {isProblemReady && (
            <div className="arcade-ready-banner animate-glow">
              <div className="ready-banner-text">
                <span className="badge badge--facil" style={{ marginBottom: 4 }}>PRONTO</span>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#f8fafc', fontWeight: 600 }}>Seu exercício foi compilado com sucesso!</p>
              </div>
              <button className="btn-primary ready-banner-btn" onClick={onGoToExercise}>
                Iniciar Desafio de Programação
              </button>
            </div>
          )}

          <div className="arcade-hub-header">
            <div className="arcade-hub-neon-title">
              <span className="retro-neon-purple">PYTHON</span>
              <span className="retro-neon-cyan">ARCADE</span>
            </div>
            <p className="arcade-hub-subtitle text-secondary">
              Divirta-se jogando mini-games temáticos de programação enquanto seu problema é compilado pela IA!
            </p>
          </div>

          <div className="arcade-games-grid">
            {/* Game 1: Doodle Code-Ninja */}
            <div 
              className="arcade-game-card card-interactive"
              onClick={() => setActiveGame(GAME_VIEWS.DOODLE)}
            >
              <div className="game-card-icon-container bg-doodle">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="game-icon">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <div className="game-card-body">
                <h3 className="game-card-title text-primary">Doodle Code-Ninja</h3>
                <p className="game-card-desc text-secondary">
                  Suba plataformas de código, ative o pulo duplo e atire lasers para eliminar ninjas japoneses e shurikens!
                </p>
                <div className="game-card-score-info flex justify-between items-center mt-4">
                  <span className="badge badge--facil">Ação / Plataforma</span>
                  <span className="high-score-label">Recorde: <span className="text-accent">{highScores.doodle}</span></span>
                </div>
              </div>
            </div>

            {/* Game 2: Snake.py */}
            <div 
              className="arcade-game-card card-interactive"
              onClick={() => setActiveGame(GAME_VIEWS.SNAKE)}
            >
              <div className="game-card-icon-container bg-snake">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="game-icon">
                  <path d="M8.3 10a3.5 3.5 0 0 1 5.4 0l6.5 6.5a3.5 3.5 0 0 1-5 5l-6.5-6.5a3.5 3.5 0 0 1 0-5z" />
                  <path d="M12 2a4 4 0 0 0-4 4v4h8V6a4 4 0 0 0-4-4z" />
                </svg>
              </div>
              <div className="game-card-body">
                <h3 className="game-card-title text-primary">Snake.py (Cobrinha)</h3>
                <p className="game-card-desc text-secondary">
                  Coma palavras-chave Python na sequência correta para compilar scripts e fuja dos bugs vermelhos que te perseguem!
                </p>
                <div className="game-card-score-info flex justify-between items-center mt-4">
                  <span className="badge badge--medio">Clássico / Arcade</span>
                  <span className="high-score-label">Recorde: <span className="text-accent">{highScores.snake}</span></span>
                </div>
              </div>
            </div>

            {/* Game 3: Bug Invaders */}
            <div 
              className="arcade-game-card card-interactive"
              onClick={() => setActiveGame(GAME_VIEWS.INVADERS)}
            >
              <div className="game-card-icon-container bg-invaders">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="game-icon">
                  <path d="M12 2L2 22h20L12 2zM12 9v4M12 17h.01" />
                </svg>
              </div>
              <div className="game-card-body">
                <h3 className="game-card-title text-primary">Bug Invaders</h3>
                <p className="game-card-desc text-secondary">
                  Proteja seu terminal compilador disparando lasers contra exércitos de ninjas invasores que jogam shurikens!
                </p>
                <div className="game-card-score-info flex justify-between items-center mt-4">
                  <span className="badge badge--dificil">Shooter Retrô</span>
                  <span className="high-score-label">Recorde: <span className="text-accent">{highScores.invaders}</span></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="active-game-viewport animate-fade-in" style={{ width: '100%' }}>
          <div className="arcade-game-header">
            <button className="btn-secondary flex items-center gap-2 arcade-header-back-btn" onClick={handleBackToHub}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              <span>Voltar</span>
            </button>
            <h3 className="arcade-current-game-title text-accent">
              {activeGame === GAME_VIEWS.DOODLE && 'Doodle Code-Ninja'}
              {activeGame === GAME_VIEWS.SNAKE && 'Snake.py'}
              {activeGame === GAME_VIEWS.INVADERS && 'Bug Invaders'}
            </h3>
            <button className="btn-secondary arcade-header-reset-btn" onClick={handleRestart}>
              Reiniciar
            </button>
          </div>

          <div className="arcade-screen-container">
            {activeGame === GAME_VIEWS.DOODLE && (
              <DoodleNinja 
                onGameOver={handleDoodleGameOver} 
                onBackToMenu={handleBackToHub} 
                isProblemReady={isProblemReady}
                onGoToExercise={onGoToExercise}
              />
            )}
            {activeGame === GAME_VIEWS.SNAKE && (
              <SnakePy 
                onGameOver={handleSnakeGameOver} 
                onBackToMenu={handleBackToHub} 
                isProblemReady={isProblemReady}
                onGoToExercise={onGoToExercise}
              />
            )}
            {activeGame === GAME_VIEWS.INVADERS && (
              <BugInvaders 
                onGameOver={handleInvadersGameOver} 
                onBackToMenu={handleBackToHub} 
                isProblemReady={isProblemReady}
                onGoToExercise={onGoToExercise}
              />
            )}

            {/* Game Over Modal / Overlay */}
            {gameOverScore !== null && (
              <div className="arcade-gameover-overlay animate-fade-in">
                <div className="arcade-gameover-panel card">
                  <h2 className="text-danger mb-2 font-mono">GAME OVER</h2>
                  
                  {isNewRecord ? (
                    <div className="new-record-banner animate-glow mb-4">
                      <span className="badge badge--competitivo" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                        NOVO RECORDE HISTÓRICO!
                      </span>
                    </div>
                  ) : null}

                  <p className="text-secondary mb-2">Pontuação Obtida</p>
                  <h1 className="text-primary font-mono mb-6" style={{ fontSize: '3rem', margin: 0 }}>
                    {gameOverScore}
                  </h1>

                  <div className="flex gap-4 w-full justify-center">
                    <button className="btn-primary" onClick={handleRestart}>
                      Jogar de Novo
                    </button>
                    <button className="btn-secondary" onClick={handleBackToHub}>
                      Menu do Hub
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
