import { useState, useEffect, useCallback } from 'react';
import DoodleNinja from './minigames/DoodleNinja';
import SnakePy from './minigames/SnakePy';
import BugInvaders from './minigames/BugInvaders';
import { updateGameScore } from '../services/api';
import './MiniGame.css';

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

  const playSound = (type) => {
    const isMuted = localStorage.getItem('is_muted') !== 'false';
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
        gain.gain.setValueAtTime(0.02, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
        osc.start();
        osc.stop(ctx.currentTime + 0.04);
      } else if (type === 'click') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(550, ctx.currentTime);
        osc.frequency.setValueAtTime(800, ctx.currentTime + 0.04);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } else if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16); // G5
        osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.24); // C6
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch (e) {
      console.warn("AudioContext failed", e);
    }
  };

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
            
            {/* Cabinet Card 1: Doodle Code-Ninja */}
            <div 
              className="arcade-game-cabinet-card"
              onClick={() => { setActiveGame(GAME_VIEWS.DOODLE); playSound('success'); }}
              onMouseEnter={() => playSound('type')}
            >
              {/* Cabinet Top Header Marquee */}
              <div className="cabinet-marquee bg-doodle-marquee">
                <span className="cabinet-marquee-text font-mono">DOODLE NINJA</span>
              </div>
              
              {/* Screen Preview */}
              <div className="cabinet-screen-bezel-mock">
                <div className="cabinet-screen-preview bg-doodle">
                  <div className="crt-glow-overlay" />
                  <div className="scanlines-overlay" />
                  <div className="laser-scanner-line" />
                  
                  {/* Styled Ninja Player */}
                  <div className="doodle-player-mock">
                    <span className="doodle-player-band" />
                    <span className="doodle-player-visor">
                      <span className="pupil" />
                    </span>
                  </div>

                  {/* Styled Enemy */}
                  <div className="doodle-enemy-mock">
                    <span className="enemy-band" />
                    <span className="enemy-visor">
                      <span className="pupil" />
                    </span>
                  </div>

                  {/* Platforms */}
                  <div className="doodle-plat-ani plat-1"><span>def</span></div>
                  <div className="doodle-plat-ani plat-2"><span>return</span></div>
                  
                  {/* Styled Shuriken */}
                  <div className="doodle-shuriken-mock">
                    <span className="star-point p1" />
                    <span className="star-point p2" />
                    <span className="star-center" />
                  </div>

                  {/* Laser projectile */}
                  <div className="doodle-laser-ani" />
                </div>
              </div>
              
              {/* Control Slope */}
              <div className="cabinet-controls-mock">
                <div className="joystick-mock"><span /></div>
                <div className="coin-slot-mock"><span>$0.25</span></div>
                <div className="buttons-mock"><span /><span /></div>
              </div>
              
              {/* Info Area */}
              <div className="cabinet-info-plate">
                <h4>Doodle Code-Ninja</h4>
                <p>Suba plataformas de código, pule e atire lasers para eliminar shurikens!</p>
                <div className="cabinet-score-row">
                  <span className="badge badge--facil">AÇÃO</span>
                  <span className="high-score-label">MAX: <strong>{highScores.doodle}</strong></span>
                </div>
              </div>
            </div>

            {/* Cabinet Card 2: Snake.py */}
            <div 
              className="arcade-game-cabinet-card"
              onClick={() => { setActiveGame(GAME_VIEWS.SNAKE); playSound('success'); }}
              onMouseEnter={() => playSound('type')}
            >
              {/* Cabinet Top Header Marquee */}
              <div className="cabinet-marquee bg-snake-marquee">
                <span className="cabinet-marquee-text font-mono">SNAKE.PY</span>
              </div>
              
              {/* Screen Preview */}
              <div className="cabinet-screen-bezel-mock">
                <div className="cabinet-screen-preview bg-snake">
                  <div className="crt-glow-overlay" />
                  <div className="scanlines-overlay" />
                  <div className="laser-scanner-line" />
                  
                  {/* Styled Snake Head */}
                  <div className="snake-head-mock">
                    <span className="snake-eyes"><span /><span /></span>
                  </div>

                  {/* Styled Snake Body Segment */}
                  <div className="snake-body-mock body-1" />
                  <div className="snake-body-mock body-2" />

                  {/* Styled Food */}
                  <div className="snake-food-mock"><span>print</span></div>
                  
                  {/* Styled Bug */}
                  <div className="snake-bug-mock">
                    <span className="bug-label">BUG</span>
                    <span className="bug-eyes"><span /><span /></span>
                  </div>
                </div>
              </div>
              
              {/* Control Slope */}
              <div className="cabinet-controls-mock">
                <div className="joystick-mock"><span /></div>
                <div className="coin-slot-mock"><span>$0.25</span></div>
                <div className="buttons-mock"><span /><span /></div>
              </div>
              
              {/* Info Area */}
              <div className="cabinet-info-plate">
                <h4>Snake.py (Cobrinha)</h4>
                <p>Coma palavras-chave Python para compilar scripts e fuja dos bugs vermelhos!</p>
                <div className="cabinet-score-row">
                  <span className="badge badge--medio">ARCADE</span>
                  <span className="high-score-label">MAX: <strong>{highScores.snake}</strong></span>
                </div>
              </div>
            </div>

            {/* Cabinet Card 3: Bug Invaders */}
            <div 
              className="arcade-game-cabinet-card"
              onClick={() => { setActiveGame(GAME_VIEWS.INVADERS); playSound('success'); }}
              onMouseEnter={() => playSound('type')}
            >
              {/* Cabinet Top Header Marquee */}
              <div className="cabinet-marquee bg-invaders-marquee">
                <span className="cabinet-marquee-text font-mono">BUG INVADERS</span>
              </div>
              
              {/* Screen Preview */}
              <div className="cabinet-screen-bezel-mock">
                <div className="cabinet-screen-preview bg-invaders">
                  <div className="crt-glow-overlay" />
                  <div className="scanlines-overlay" />
                  <div className="laser-scanner-line" />
                  
                  {/* Styled Ship */}
                  <div className="invaders-ship-mock">
                    <span className="ship-terminal-text">&gt;_</span>
                  </div>

                  {/* Laser projectile */}
                  <div className="invaders-laser-ani" />

                  {/* Styled Bug Invaders */}
                  <div className="invaders-bug-mock bug-1">
                    <span className="invader-eyes" />
                    <span className="invader-legs" />
                  </div>
                  <div className="invaders-bug-mock bug-2">
                    <span className="invader-eyes" />
                    <span className="invader-legs" />
                  </div>

                  {/* Styled Enemy Bullet (Shuriken) */}
                  <div className="invaders-shuriken-mock">
                    <span className="star-point p1" />
                    <span className="star-point p2" />
                    <span className="star-center" />
                  </div>
                </div>
              </div>
              
              {/* Control Slope */}
              <div className="cabinet-controls-mock">
                <div className="joystick-mock"><span /></div>
                <div className="coin-slot-mock"><span>$0.25</span></div>
                <div className="buttons-mock"><span /><span /></div>
              </div>
              
              {/* Info Area */}
              <div className="cabinet-info-plate">
                <h4>Bug Invaders</h4>
                <p>Proteja seu terminal compilador disparando lasers contra exércitos de bugs!</p>
                <div className="cabinet-score-row">
                  <span className="badge badge--dificil">SHOOTER</span>
                  <span className="high-score-label">MAX: <strong>{highScores.invaders}</strong></span>
                </div>
              </div>
            </div>

          </div>
        </div>
      ) : (
        <div className="active-game-viewport animate-fade-in" style={{ width: '100%' }}>
          
          {/* Top Arcade Marquee banner */}
          <div className="arcade-cabinet-marquee">
            <div className="marquee-neon-glow" />
            <span className="marquee-title font-mono glitch-title" data-text="PYTHON RETRO ARCADE">
              PYTHON RETRO ARCADE
            </span>
          </div>

          <div className="arcade-cabinet-screen-bezel">
            {/* Speakers grilles & Warning */}
            <div className="bezel-speakers-row">
              <div className="speaker-grille"><span></span><span></span><span></span><span></span></div>
              <div className="bezel-instruction">1 PLAY = 1 PYTHON CHALLENGE</div>
              <div className="speaker-grille"><span></span><span></span><span></span><span></span></div>
            </div>

            {/* Game Screen Viewport Wrapper */}
            <div className="arcade-screen-container">
              <div className="crt-glow-overlay" />
              <div className="scanlines-overlay" />
              
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
            
            {/* Cabinet Physical Control Panel */}
            <div className="arcade-cabinet-control-panel">
              <div className="panel-joystick-side">
                <div className="arcade-panel-joystick-base">
                  <div className="arcade-panel-joystick-handle" />
                </div>
                <span className="panel-label">ANALOG JOYSTICK</span>
              </div>
              
              <div className="panel-info-side">
                <div className="coin-slot-indicator">
                  <span className="coin-label">INSERT COIN</span>
                  <span className="coin-light-dot" />
                </div>
              </div>
              
              <div className="panel-buttons-side">
                <div className="arcade-action-button-group">
                  <button 
                    className="arcade-panel-btn btn-red" 
                    onClick={handleRestart}
                    title="Reiniciar jogo (Button A)"
                  >
                    <span className="btn-letter">A</span>
                    <span className="btn-label-text">RESTART</span>
                  </button>
                  <button 
                    className="arcade-panel-btn btn-blue" 
                    onClick={handleBackToHub}
                    title="Menu do fliperama (Button B)"
                  >
                    <span className="btn-letter">B</span>
                    <span className="btn-label-text">EXIT</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
