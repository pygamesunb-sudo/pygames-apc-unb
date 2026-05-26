import { useRef, useEffect, useState, useCallback } from 'react';

const CANVAS_W = 400;
const CANVAS_H = 600;
const GRAVITY = 0.35;
const JUMP_FORCE = -10.5;
const DOUBLE_JUMP_FORCE = -9;
const SUPER_JUMP_FORCE = -18;
const LOW_JUMP_FORCE = -6;
const PLATFORM_COUNT = 7;
const PLATFORM_W = 80;
const PLATFORM_H = 14;
const PLAYER_W = 32;
const PLAYER_H = 32;
const ENEMY_W = 36;
const ENEMY_H = 36;
const SHURIKEN_SIZE = 12;

const PLATFORM_TYPES = {
  NORMAL: 'normal',
  MOVING: 'moving',
  FRAGILE: 'fragile',
  BOUNCY: 'bouncy',
  STICKY: 'sticky'
};

const BUG_COMMANDS = ['print()', 'for i:', 'def f():', 'if x:', 'while True:', 'return', 'import', 'class C:', 'try:'];

function randomBetween(a, b) { return a + Math.random() * (b - a); }

export default function DoodleNinja({ onGameOver, onBackToMenu, isProblemReady, onGoToExercise }) {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const animRef = useRef(null);
  
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [isDead, setIsDead] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const spawnPlatform = useCallback((y, index) => {
    const typeRoll = Math.random();
    let type = PLATFORM_TYPES.NORMAL;
    if (y < -1500) {
      if (typeRoll < 0.25) type = PLATFORM_TYPES.MOVING;
      else if (typeRoll < 0.45) type = PLATFORM_TYPES.FRAGILE;
      else if (typeRoll < 0.55) type = PLATFORM_TYPES.BOUNCY;
      else if (typeRoll < 0.65) type = PLATFORM_TYPES.STICKY;
    } else if (y < -500) {
      if (typeRoll < 0.2) type = PLATFORM_TYPES.MOVING;
      else if (typeRoll < 0.35) type = PLATFORM_TYPES.FRAGILE;
      else if (typeRoll < 0.45) type = PLATFORM_TYPES.BOUNCY;
    }
    return {
      x: randomBetween(10, CANVAS_W - PLATFORM_W - 10),
      y: y,
      type,
      label: BUG_COMMANDS[index % BUG_COMMANDS.length],
      vx: type === PLATFORM_TYPES.MOVING ? (Math.random() > 0.5 ? 1.5 : -1.5) : 0,
      broken: false,
      touched: false,
    };
  }, []);

  const generatePlatforms = useCallback((startY = CANVAS_H - 60) => {
    const platforms = [];
    for (let i = 0; i < PLATFORM_COUNT; i++) {
      platforms.push(spawnPlatform(startY - i * (CANVAS_H / PLATFORM_COUNT), i));
    }
    platforms[0].type = PLATFORM_TYPES.NORMAL;
    platforms[0].vx = 0;
    return platforms;
  }, [spawnPlatform]);

  const initGame = useCallback(() => {
    const platforms = generatePlatforms();
    const firstPlat = platforms[0];
    stateRef.current = {
      player: {
        x: firstPlat.x + PLATFORM_W / 2 - PLAYER_W / 2,
        y: firstPlat.y - PLAYER_H,
        vy: JUMP_FORCE,
        vx: 0,
        facing: 1,
        canDoubleJump: true,
        lives: 3,
        invulnerableFrames: 120,
      },
      platforms,
      enemies: [{ x: randomBetween(50, CANVAS_W - ENEMY_W - 50), y: randomBetween(-200, -100), vx: 1.0, throwTimer: 0 }],
      bullets: [],
      shurikens: [],
      particles: [],
      cameraY: 0,
      score: 0,
      keys: { left: false, right: false, up: false, shoot: false, lastShoot: 0 },
      isGameOver: false,
      isPaused: false,
    };
    setScore(0);
    setLives(3);
    setIsDead(false);
    setIsPaused(false);
  }, [generatePlatforms]);

  const handleShoot = useCallback((s) => {
    const now = Date.now();
    if (now - s.keys.lastShoot > 250) {
      s.bullets.push({ x: s.player.x + PLAYER_W / 2, y: s.player.y, vy: -9 });
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
      
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        if (!s.keys.up) {
          s.keys.up = true;
          triggerDoubleJump(s);
        }
      }
      if (e.key === ' ') handleShoot(s);
    };

    const onKeyUp = (e) => {
      if (!stateRef.current) return;
      const s = stateRef.current;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') s.keys.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') s.keys.right = false;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') s.keys.up = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function gameLoop() {
      if (!stateRef.current) return;
      const s = stateRef.current;
      const { player, platforms, enemies, bullets, shurikens, particles, keys } = s;

      if (!s.isGameOver && !s.isPaused) {
        if (player.invulnerableFrames > 0) player.invulnerableFrames--;

        if (keys.left) { player.vx = -4.8; player.facing = -1; }
        else if (keys.right) { player.vx = 4.8; player.facing = 1; }
        else player.vx *= 0.78;

        player.x += player.vx;
        player.vy += GRAVITY;
        player.y += player.vy;

        if (player.x > CANVAS_W) player.x = -PLAYER_W;
        if (player.x < -PLAYER_W) player.x = CANVAS_W;

        if (player.vy > 0) {
          for (const p of platforms) {
            if (p.broken) continue;
            const sy = p.y - s.cameraY;
            const psy = player.y - s.cameraY;
            if (player.x + PLAYER_W > p.x && player.x < p.x + PLATFORM_W && psy + PLAYER_H > sy && psy + PLAYER_H < sy + PLATFORM_H + 8) {
              if (p.type === PLATFORM_TYPES.STICKY) player.vy = LOW_JUMP_FORCE;
              else if (p.type === PLATFORM_TYPES.BOUNCY) {
                player.vy = SUPER_JUMP_FORCE;
                for (let i = 0; i < 10; i++) particles.push({ x: player.x + PLAYER_W/2, y: player.y + PLAYER_H, vx: randomBetween(-3,3), vy: randomBetween(-4,-1), color: 'rgba(16,185,129,0.8)', life: 30 });
              } else if (p.type === PLATFORM_TYPES.FRAGILE) {
                p.broken = true; player.vy = JUMP_FORCE;
                for (let i = 0; i < 8; i++) particles.push({ x: p.x + PLATFORM_W/2, y: p.y + PLATFORM_H/2, vx: randomBetween(-3,3), vy: randomBetween(-2,4), color: 'rgba(249,115,22,0.8)', life: 20 });
              } else player.vy = JUMP_FORCE;
              player.canDoubleJump = true; p.touched = true; break;
            }
          }
        }

        const psy = player.y - s.cameraY;
        if (psy < CANVAS_H * 0.45) {
          const delta = CANVAS_H * 0.45 - psy;
          s.cameraY -= delta; s.score += Math.floor(delta * 0.12);
        }

        for (const p of platforms) {
          if (p.type === PLATFORM_TYPES.MOVING) {
            p.x += p.vx; if (p.x < 0 || p.x > CANVAS_W - PLATFORM_W) p.vx *= -1;
          }
        }

        const topPlat = platforms.reduce((a, b) => (a.y < b.y ? a : b));
        if (topPlat.y - s.cameraY > -CANVAS_H) {
          platforms.push(spawnPlatform(topPlat.y - 85 - Math.random() * 45, platforms.length));
          s.platforms = platforms.filter(p => p.y - s.cameraY < CANVAS_H + 100);
        }

        for (let i = bullets.length - 1; i >= 0; i--) {
          bullets[i].y += bullets[i].vy; if (bullets[i].y < s.cameraY - 20) bullets.splice(i, 1);
        }

        if (enemies.length < 2 && Math.random() < 0.005) {
          enemies.push({ x: randomBetween(20, CANVAS_W - ENEMY_W - 20), y: s.cameraY - randomBetween(300, 600), vx: Math.random() > 0.5 ? 1.3 : -1.3, throwTimer: 0 });
        }

        for (let ei = enemies.length - 1; ei >= 0; ei--) {
          const e = enemies[ei]; e.x += e.vx; if (e.x < 0 || e.x > CANVAS_W - ENEMY_W) e.vx *= -1;
          e.throwTimer++;
          if (e.throwTimer > 110 + Math.random() * 60) {
            shurikens.push({ x: e.x + ENEMY_W/2, y: e.y + ENEMY_H, vy: 3.5, rot: 0 });
            e.throwTimer = 0;
          }

          for (let bi = bullets.length - 1; bi >= 0; bi--) {
            const b = bullets[bi];
            if (b.x > e.x && b.x < e.x + ENEMY_W && b.y > e.y && b.y < e.y + ENEMY_H) {
              bullets.splice(bi, 1);
              for (let pi = 0; pi < 10; pi++) particles.push({ x: e.x + ENEMY_W/2, y: e.y + ENEMY_H/2, vx: randomBetween(-3,3), vy: randomBetween(-3,3), color: '#f43f5e', life: 30 });
              enemies.splice(ei, 1); s.score += 250; break;
            }
          }

          if (player.invulnerableFrames <= 0) {
            if (player.x + 4 < e.x + ENEMY_W && player.x + PLAYER_W - 4 > e.x && player.y + 4 < e.y + ENEMY_H && player.y + PLAYER_H - 4 > e.y) loseLife(s);
          }
          if (e.y - s.cameraY > CANVAS_H + 200) enemies.splice(ei, 1);
        }

        for (let i = shurikens.length - 1; i >= 0; i--) {
          const sh = shurikens[i]; sh.y += sh.vy; sh.rot += 0.16;
          if (player.invulnerableFrames <= 0) {
            if (player.x + 4 < sh.x + SHURIKEN_SIZE && player.x + PLAYER_W - 4 > sh.x && player.y + 4 < sh.y + SHURIKEN_SIZE && player.y + PLAYER_H - 4 > sh.y) {
              shurikens.splice(i, 1); loseLife(s); continue;
            }
          }
          if (sh.y > s.cameraY + CANVAS_H + 50) shurikens.splice(i, 1);
        }

        if (player.y - s.cameraY > CANVAS_H + 100) loseLife(s);

        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i]; p.x += p.vx; p.y += p.vy; p.life--;
          if (p.life <= 0) particles.splice(i, 1);
        }

        setScore(s.score);
      }

      // --- RENDER ---
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.fillStyle = '#0a0e1a'; ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.04)'; ctx.lineWidth = 1;
      for (let gx = 0; gx < CANVAS_W; gx += 40) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, CANVAS_H); ctx.stroke(); }
      for (let gy = (s.cameraY % 40); gy < CANVAS_H; gy += 40) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(CANVAS_W, gy); ctx.stroke(); }

      for (const p of particles) { ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y - s.cameraY, 3, 3); }

      for (const p of s.platforms) {
        if (p.broken) continue;
        const sy = p.y - s.cameraY; if (sy < -30 || sy > CANVAS_H + 30) continue;
        let color = '#6366f1';
        if (p.type === PLATFORM_TYPES.MOVING) color = '#06b6d4';
        else if (p.type === PLATFORM_TYPES.FRAGILE) color = '#f97316';
        else if (p.type === PLATFORM_TYPES.BOUNCY) color = '#10b981';
        else if (p.type === PLATFORM_TYPES.STICKY) color = '#eab308';

        ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(p.x, sy, PLATFORM_W, PLATFORM_H, 4); ctx.fill();
        ctx.shadowColor = color; ctx.shadowBlur = 8; ctx.fill(); ctx.shadowBlur = 0;

        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 9px JetBrains Mono, monospace'; ctx.textAlign = 'center';
        ctx.fillText(p.label, p.x + PLATFORM_W / 2, sy + 10);
      }

      ctx.fillStyle = '#22d3ee';
      for (const b of bullets) {
        const bsy = b.y - s.cameraY; ctx.shadowColor = '#22d3ee'; ctx.shadowBlur = 10;
        ctx.fillRect(b.x - 2, bsy, 4, 12); ctx.shadowBlur = 0;
      }

      for (const e of enemies) {
        const esy = e.y - s.cameraY; ctx.save(); ctx.shadowColor = '#f43f5e'; ctx.shadowBlur = 12;
        ctx.fillStyle = '#1e293b'; ctx.beginPath(); ctx.roundRect(e.x, esy, ENEMY_W, ENEMY_H, 8); ctx.fill(); ctx.shadowBlur = 0;
        ctx.fillStyle = '#f43f5e'; ctx.fillRect(e.x, esy + 6, ENEMY_W, 6);
        ctx.fillStyle = '#ffffff'; ctx.fillRect(e.x + 6, esy + 14, ENEMY_W - 12, 7);
        ctx.fillStyle = '#e11d48'; ctx.beginPath(); ctx.arc(e.x + ENEMY_W/2, esy + 17, 3, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#ffffff'; ctx.fillRect(e.x + 8, esy + 24, 6, 2); ctx.fillRect(e.x + 22, esy + 24, 6, 2);
        ctx.restore();
      }

      for (const sh of shurikens) {
        const shsy = sh.y - s.cameraY; ctx.save(); ctx.translate(sh.x + SHURIKEN_SIZE/2, shsy + SHURIKEN_SIZE/2); ctx.rotate(sh.rot);
        ctx.fillStyle = '#94a3b8'; ctx.strokeStyle = '#f8fafc'; ctx.lineWidth = 1.5; ctx.beginPath();
        ctx.moveTo(0, -SHURIKEN_SIZE/2); ctx.lineTo(SHURIKEN_SIZE/6, -SHURIKEN_SIZE/6); ctx.lineTo(SHURIKEN_SIZE/2, 0); ctx.lineTo(SHURIKEN_SIZE/6, SHURIKEN_SIZE/6); ctx.lineTo(0, SHURIKEN_SIZE/2); ctx.lineTo(-SHURIKEN_SIZE/6, SHURIKEN_SIZE/6); ctx.lineTo(-SHURIKEN_SIZE/2, 0); ctx.lineTo(-SHURIKEN_SIZE/6, -SHURIKEN_SIZE/6); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#f43f5e'; ctx.beginPath(); ctx.arc(0,0,2,0,Math.PI*2); ctx.fill(); ctx.restore();
      }

      const isBlinking = player.invulnerableFrames > 0 && Math.floor(player.invulnerableFrames / 5) % 2 === 0;
      if (!isBlinking) {
        ctx.save(); if (player.facing === -1) { ctx.scale(-1, 1); ctx.translate(-CANVAS_W, 0); }
        const dx = player.facing === -1 ? CANVAS_W - player.x - PLAYER_W : player.x;
        ctx.fillStyle = '#6366f1'; ctx.shadowColor = '#6366f1'; ctx.shadowBlur = 14; ctx.beginPath(); ctx.roundRect(dx, player.y - s.cameraY, PLAYER_W, PLAYER_H, 6); ctx.fill(); ctx.shadowBlur = 0;
        ctx.fillStyle = '#22d3ee'; ctx.fillRect(dx, player.y - s.cameraY + 4, PLAYER_W, 5);
        ctx.fillStyle = '#ffffff'; ctx.fillRect(dx + 16, player.y - s.cameraY + 12, 10, 6);
        ctx.fillStyle = '#0f172a'; ctx.fillRect(dx + 19, player.y - s.cameraY + 14, 4, 4);
        ctx.restore();
      }

      animRef.current = requestAnimationFrame(gameLoop);
    }

    function triggerDoubleJump(s) {
      if (s.player.canDoubleJump) {
        s.player.vy = DOUBLE_JUMP_FORCE; s.player.canDoubleJump = false;
        for (let i = 0; i < 8; i++) s.particles.push({ x: s.player.x + PLAYER_W/2, y: s.player.y + PLAYER_H, vx: randomBetween(-2,2), vy: randomBetween(1,3), color: 'rgba(255,255,255,0.6)', life: 30 });
      }
    }

    function loseLife(s) {
      s.player.lives--; setLives(s.player.lives);
      if (s.player.lives <= 0) {
        s.isGameOver = true; setIsDead(true); onGameOver(s.score);
      } else {
        s.player.invulnerableFrames = 120;
        const vps = s.platforms.filter(plat => plat.y - s.cameraY > 100 && plat.y - s.cameraY < CANVAS_H - 100 && !plat.broken);
        const safe = vps.length > 0 ? vps[0] : s.platforms[0];
        s.player.x = safe.x + PLATFORM_W/2 - PLAYER_W/2; s.player.y = safe.y - PLAYER_H; s.player.vy = JUMP_FORCE; s.player.vx = 0;
        s.shurikens = [];
      }
    }

    animRef.current = requestAnimationFrame(gameLoop);
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [initGame, spawnPlatform, onGameOver, handleShoot]);

  // Handlers mobile virtuais
  const handleMoveLeft = (active) => {
    if (stateRef.current) stateRef.current.keys.left = active;
  };
  const handleMoveRight = (active) => {
    if (stateRef.current) stateRef.current.keys.right = active;
  };
  const handleJump = () => {
    if (stateRef.current) {
      const s = stateRef.current;
      if (!s.isGameOver && !s.isPaused) {
        triggerDoubleJump(s);
      }
    }
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
  
  function triggerDoubleJump(s) {
    if (s.player.canDoubleJump) {
      s.player.vy = DOUBLE_JUMP_FORCE; s.player.canDoubleJump = false;
      for (let i = 0; i < 8; i++) s.particles.push({ x: s.player.x + PLAYER_W/2, y: s.player.y + PLAYER_H, vx: randomBetween(-2,2), vy: randomBetween(1,3), color: 'rgba(255,255,255,0.6)', life: 30 });
    }
  }

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
        <span className="game-score-count">Score: {score}</span>
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
      <div className="mobile-dpad-container doodle-mobile-controls" style={{ display: 'flex', gap: '30px', justifyContent: 'center', width: '100%', padding: '10px 20px' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="dpad-btn" onTouchStart={() => handleMoveLeft(true)} onTouchEnd={() => handleMoveLeft(false)} onMouseDown={() => handleMoveLeft(true)} onMouseUp={() => handleMoveLeft(false)}>◀</button>
          <button className="dpad-btn" onTouchStart={() => handleMoveRight(true)} onTouchEnd={() => handleMoveRight(false)} onMouseDown={() => handleMoveRight(true)} onMouseUp={() => handleMoveRight(false)}>▶</button>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="dpad-btn action-btn-jump" onClick={handleJump} style={{ backgroundColor: 'rgba(99,102,241,0.2)', border: '2px solid #6366f1' }}>▲</button>
          <button className="dpad-btn action-btn-shoot" onClick={handleShootVirtual} style={{ backgroundColor: 'rgba(34,211,238,0.2)', border: '2px solid #22d3ee' }}>⚡</button>
        </div>
      </div>

      <div className="game-controls-legend hide-on-mobile">
        <span>A/D ou ◀/▶: Mover | W ou ▲: Pulo Duplo | Espaço: Atirar</span>
      </div>
    </div>
  );
}
