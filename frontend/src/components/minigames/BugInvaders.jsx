import { useRef, useEffect, useState, useCallback } from 'react';

const CANVAS_W = 400;
const CANVAS_H = 600;
const PLAYER_W = 34;
const PLAYER_H = 20;
const INVADER_W = 28;
const INVADER_H = 24;
const INVADER_COLS = 6;
const INVADER_ROWS = 4;
const SHURIKEN_SIZE = 10;

export default function BugInvaders({ onGameOver, onBackToMenu, isProblemReady, onGoToExercise }) {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const animRef = useRef(null);
  const onGameOverRef = useRef(onGameOver);

  useEffect(() => {
    onGameOverRef.current = onGameOver;
  }, [onGameOver]);

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [wave, setWave] = useState(1);
  const [isDead, setIsDead] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const generateInvaders = useCallback((waveNum) => {
    const invaders = [];
    const speed = 0.8 + waveNum * 0.25;
    for (let r = 0; r < INVADER_ROWS; r++) {
      for (let c = 0; c < INVADER_COLS; c++) {
        invaders.push({ x: 40 + c * 52, y: 60 + r * 38, w: INVADER_W, h: INVADER_H, shootCooldown: Math.random() * 200, alive: true });
      }
    }
    return { list: invaders, dir: 1, speed };
  }, []);

  const initGame = useCallback(() => {
    const { list, dir, speed } = generateInvaders(1);
    stateRef.current = {
      player: { x: CANVAS_W / 2 - PLAYER_W / 2, y: CANVAS_H - 50, lives: 3, invulnerableFrames: 90 },
      invaders: list,
      invaderDir: dir,
      invaderSpeed: speed,
      playerBullets: [],
      enemyBullets: [],
      particles: [],
      score: 0,
      wave: 1,
      keys: { left: false, right: false, lastShoot: 0 },
      isGameOver: false,
      isPaused: false,
    };
    setScore(0);
    setLives(3);
    setWave(1);
    setIsDead(false);
    setIsPaused(false);
  }, [generateInvaders]);

  const handleShoot = useCallback((s) => {
    const now = Date.now();
    if (now - s.keys.lastShoot > 280) {
      s.playerBullets.push({ x: s.player.x + PLAYER_W / 2, y: s.player.y, vy: -7.5 });
      s.keys.lastShoot = now;
    }
  }, []);

  // Monitora a compilação do Agente de IA para pausar
  useEffect(() => {
    if (isProblemReady && stateRef.current && !stateRef.current.isGameOver) {
      stateRef.current.isPaused = true;
      setIsPaused(true);
    }
  }, [isProblemReady]);

  useEffect(() => {
    initGame();

    const onKeyDown = (e) => {
      if (!stateRef.current) return;
      const s = stateRef.current;

      // Bloqueia rolagem
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'w', 's', 'a', 'd', 'W', 'S', 'A', 'D'].includes(e.key)) {
        e.preventDefault();
      }

      if (s.isGameOver || s.isPaused) return;

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') s.keys.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') s.keys.right = true;
      if (e.key === ' ') handleShoot(s);
    };

    const onKeyUp = (e) => {
      if (!stateRef.current) return;
      const s = stateRef.current;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') s.keys.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') s.keys.right = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function gameLoop() {
      if (!stateRef.current) return;
      const s = stateRef.current;
      const { player, invaders, playerBullets, enemyBullets, particles, keys } = s;

      if (!s.isGameOver && !s.isPaused) {
        if (player.invulnerableFrames > 0) player.invulnerableFrames--;

        if (keys.left) player.x = Math.max(8, player.x - 4.5);
        else if (keys.right) player.x = Math.min(CANVAS_W - PLAYER_W - 8, player.x + 4.5);

        for (let i = playerBullets.length - 1; i >= 0; i--) {
          const b = playerBullets[i]; b.y += b.vy;
          let hit = false;
          for (let k = 0; k < invaders.length; k++) {
            const inv = invaders[k];
            if (inv.alive && b.x > inv.x && b.x < inv.x + inv.w && b.y > inv.y && b.y < inv.y + inv.h) {
              inv.alive = false; hit = true; s.score += 150;
              for (let pi = 0; pi < 10; pi++) particles.push({ x: inv.x + inv.w/2, y: inv.y + inv.h/2, vx: (Math.random()-0.5)*5, vy: (Math.random()-0.5)*5, color: '#f43f5e', life: 30 });
              break;
            }
          }
          if (hit || b.y < -10) playerBullets.splice(i, 1);
        }

        let edgeReached = false;
        invaders.forEach(inv => {
          if (!inv.alive) return;
          inv.x += s.invaderSpeed * s.invaderDir;
          if (inv.x < 10 || inv.x > CANVAS_W - inv.w - 10) edgeReached = true;
        });

        if (edgeReached) {
          s.invaderDir *= -1;
          invaders.forEach(inv => {
            if (!inv.alive) return;
            inv.y += 18;
            if (inv.y + inv.h >= player.y) {
              s.isGameOver = true; setIsDead(true); onGameOverRef.current(s.score);
            }
          });
        }

        invaders.forEach(inv => {
          if (!inv.alive) return;
          inv.shootCooldown--;
          if (inv.shootCooldown <= 0) {
            enemyBullets.push({ x: inv.x + inv.w / 2, y: inv.y + inv.h, vy: 3.2 + s.wave * 0.3, rot: 0 });
            inv.shootCooldown = 150 + Math.random() * 250;
          }
        });

        for (let i = enemyBullets.length - 1; i >= 0; i--) {
          const eb = enemyBullets[i]; eb.y += eb.vy; eb.rot += 0.12;
          if (player.invulnerableFrames <= 0) {
            if (eb.x > player.x && eb.x < player.x + PLAYER_W && eb.y > player.y && eb.y < player.y + PLAYER_H) {
              enemyBullets.splice(i, 1); loseLife(s); continue;
            }
          }
          if (eb.y > CANVAS_H + 10) enemyBullets.splice(i, 1);
        }

        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i]; p.x += p.vx; p.y += p.vy; p.life--;
          if (p.life <= 0) particles.splice(i, 1);
        }

        const allDead = invaders.every(inv => !inv.alive);
        if (allDead) {
          s.wave++; setWave(s.wave);
          const { list, dir, speed } = generateInvaders(s.wave);
          s.invaders = list; s.invaderDir = dir; s.invaderSpeed = speed;
          s.enemyBullets = []; s.playerBullets = [];
        }
        setScore(s.score);
      }

      // --- RENDER ---
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.fillStyle = '#0a0a14'; ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      for (let star = 0; star < 15; star++) {
        ctx.fillRect((star * 123) % CANVAS_W, (star * 87) % CANVAS_H, 2, 2);
      }

      for (const p of particles) { ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, 2, 2); }

      ctx.fillStyle = '#10b981';
      for (const b of playerBullets) {
        ctx.shadowColor = '#10b981'; ctx.shadowBlur = 8;
        ctx.fillRect(b.x - 1.5, b.y, 3, 10); ctx.shadowBlur = 0;
      }

      invaders.forEach(inv => {
        if (!inv.alive) return;
        ctx.save(); ctx.fillStyle = '#e11d48'; ctx.shadowColor = '#f43f5e'; ctx.shadowBlur = 6;
        ctx.beginPath(); ctx.roundRect(inv.x, inv.y, inv.w, inv.h, 4); ctx.fill(); ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff'; ctx.fillRect(inv.x + 3, inv.y + 4, inv.w - 6, 5);
        ctx.fillStyle = '#e11d48'; ctx.beginPath(); ctx.arc(inv.x + inv.w / 2, inv.y + 6.5, 1.8, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#e11d48'; ctx.lineWidth = 2; ctx.beginPath();
        ctx.moveTo(inv.x + 4, inv.y + inv.h); ctx.lineTo(inv.x + 2, inv.y + inv.h + 4);
        ctx.moveTo(inv.x + inv.w - 4, inv.y + inv.h); ctx.lineTo(inv.x + inv.w - 2, inv.y + inv.h + 4);
        ctx.stroke(); ctx.restore();
      });

      for (const eb of enemyBullets) {
        ctx.save(); ctx.translate(eb.x, eb.y); ctx.rotate(eb.rot);
        ctx.fillStyle = '#f43f5e'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, -SHURIKEN_SIZE/2); ctx.lineTo(SHURIKEN_SIZE/5, -SHURIKEN_SIZE/5); ctx.lineTo(SHURIKEN_SIZE/2, 0); ctx.lineTo(SHURIKEN_SIZE/5, SHURIKEN_SIZE/5); ctx.lineTo(0, SHURIKEN_SIZE/2); ctx.lineTo(-SHURIKEN_SIZE/5, SHURIKEN_SIZE/5); ctx.lineTo(-SHURIKEN_SIZE/2, 0); ctx.lineTo(-SHURIKEN_SIZE/5, -SHURIKEN_SIZE/5); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.restore();
      }

      const isBlinking = player.invulnerableFrames > 0 && Math.floor(player.invulnerableFrames / 5) % 2 === 0;
      if (!isBlinking) {
        ctx.save(); ctx.fillStyle = '#10b981'; ctx.shadowColor = '#10b981'; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.moveTo(player.x, player.y + PLAYER_H); ctx.lineTo(player.x + PLAYER_W / 2, player.y); ctx.lineTo(player.x + PLAYER_W, player.y + PLAYER_H); ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0;
        ctx.fillStyle = '#0a0a14'; ctx.font = 'bold 10px JetBrains Mono, monospace'; ctx.textAlign = 'center';
        ctx.fillText('>_', player.x + PLAYER_W / 2, player.y + PLAYER_H - 4); ctx.restore();
      }

      animRef.current = requestAnimationFrame(gameLoop);
    }

    function loseLife(s) {
      s.player.lives--; setLives(s.player.lives);
      if (s.player.lives <= 0) {
        s.isGameOver = true; setIsDead(true); onGameOverRef.current(s.score);
      } else {
        s.player.x = CANVAS_W / 2 - PLAYER_W / 2; s.player.invulnerableFrames = 90; s.enemyBullets = [];
      }
    }

    animRef.current = requestAnimationFrame(gameLoop);
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [initGame, generateInvaders, handleShoot]);

  // Handlers mobile
  const handleMoveLeft = (active) => {
    if (stateRef.current) stateRef.current.keys.left = active;
  };
  const handleMoveRight = (active) => {
    if (stateRef.current) stateRef.current.keys.right = active;
  };
  const handleShootVirtual = () => {
    if (stateRef.current) {
      const s = stateRef.current;
      if (!s.isGameOver && !s.isPaused) handleShoot(s);
    }
  };
  const handleUnpause = () => {
    if (stateRef.current) {
      stateRef.current.isPaused = false;
      setIsPaused(false);
    }
  };

  return (
    <div className="game-container-inner">
      <div className="game-hud">
        <div className="hud-lives">
          {Array.from({ length: 3 }).map((_, i) => (
            <svg key={i} className={`hud-heart ${i < lives ? 'hud-heart--active' : 'hud-heart--empty'}`} viewBox="0 0 24 24" fill={i < lives ? '#f43f5e' : 'none'} stroke="#f43f5e" strokeWidth="2" style={{ width: 20, height: 20 }}>
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          ))}
        </div>
        <span className="game-score-count">Wave: <span className="text-accent">{wave}</span> | Score: {score}</span>
      </div>

      <div className="canvas-wrapper">
        <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} className="retro-canvas" />

        {/* Modal de Auto-Pause da LLM */}
        {isPaused && isProblemReady && (
          <div className="arcade-gameover-overlay animate-fade-in" style={{ zIndex: 100 }}>
            <div className="arcade-gameover-panel card" style={{ borderColor: 'var(--accent-primary)' }}>
              <h2 className="text-accent mb-2 font-mono">CÓDIGO COMPILADO!</h2>
              <p className="text-secondary mb-6" style={{ fontSize: '0.85rem' }}>
                Seu problema de programação foi gerado com sucesso pela IA do Agente.
              </p>
              <div className="flex flex-col gap-3 w-full">
                <button className="btn-primary" onClick={onGoToExercise}>
                  Ir para o Exercício
                </button>
                <button className="btn-secondary" onClick={handleUnpause}>
                  Continuar Jogando
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controles de Ação para Mobile */}
      <div className="mobile-controls-wrapper">
        <div className="mobile-movement-buttons">
          <button 
            className="dpad-btn" 
            onTouchStart={(e) => { e.preventDefault(); handleMoveLeft(true); }} 
            onTouchEnd={(e) => { e.preventDefault(); handleMoveLeft(false); }} 
            onMouseDown={(e) => { e.preventDefault(); handleMoveLeft(true); }} 
            onMouseUp={(e) => { e.preventDefault(); handleMoveLeft(false); }}
          >
            ◀
          </button>
          <button 
            className="dpad-btn" 
            onTouchStart={(e) => { e.preventDefault(); handleMoveRight(true); }} 
            onTouchEnd={(e) => { e.preventDefault(); handleMoveRight(false); }} 
            onMouseDown={(e) => { e.preventDefault(); handleMoveRight(true); }} 
            onMouseUp={(e) => { e.preventDefault(); handleMoveRight(false); }}
          >
            ▶
          </button>
        </div>
        <button 
          className="dpad-btn action-btn-shoot" 
          onTouchStart={(e) => { e.preventDefault(); handleShootVirtual(); }}
          onMouseDown={(e) => { e.preventDefault(); handleShootVirtual(); }}
        >
          ⚡
        </button>
      </div>

      <div className="game-controls-legend hide-on-mobile">
        <span>A/D ou ◀/▶: Mover | Espaço: Disparar laser compilador</span>
      </div>
    </div>
  );
}
