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

  // Novos estados para progressão e melhorias
  const [xp, setXp] = useState(0);
  const [xpNeeded, setXpNeeded] = useState(100);
  const [level, setLevel] = useState(1);
  const [weaponLevel, setWeaponLevel] = useState(1);
  const [shieldActive, setShieldActive] = useState(false);
  const [isSelectingUpgrade, setIsSelectingUpgrade] = useState(false);
  const [upgradeChoices, setUpgradeChoices] = useState([]);

  // Geração de inimigos com múltiplos tipos dependendo da linha
  const generateInvaders = useCallback((waveNum) => {
    const invaders = [];
    const speed = 0.8 + waveNum * 0.25;
    for (let r = 0; r < INVADER_ROWS; r++) {
      let type = 'syntax'; // Tipo padrão
      let health = 1;
      
      if (r === 0) {
        type = 'leak'; // Tank
        health = 3;
      } else if (r === 1) {
        type = 'glitch'; // Investida
        health = 1;
      } else if (r === 2) {
        type = 'warning'; // Zigue-zague
        health = 1;
      }

      for (let c = 0; c < INVADER_COLS; c++) {
        invaders.push({
          x: 40 + c * 52,
          y: 60 + r * 38,
          w: INVADER_W,
          h: INVADER_H,
          shootCooldown: Math.random() * 200 + 50,
          alive: true,
          type,
          health,
          maxHealth: health,
          phase: Math.random() * Math.PI * 2, // Para oscilação do Warning bug
          glitchCharge: false, // Flag de investida do Glitch bug
          flashFrames: 0,
        });
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
      xpBits: [],
      score: 0,
      wave: 1,
      keys: { left: false, right: false, lastShoot: 0 },
      isGameOver: false,
      isPaused: false,
      
      // Multiplicadores e estado de upgrades do jogador
      playerSpeedModifier: 1.0,
      cooldownModifier: 1.0,
      weaponLevel: 1,
      plasmaRadiusModifier: 1.0,
      shieldActive: false,
      xp: 0,
      xpNeeded: 100,
      level: 1,
    };
    setScore(0);
    setLives(3);
    setWave(1);
    setXp(0);
    setXpNeeded(100);
    setLevel(1);
    setWeaponLevel(1);
    setShieldActive(false);
    setIsDead(false);
    setIsPaused(false);
    setIsSelectingUpgrade(false);
  }, [generateInvaders]);

  // Função para gerenciar a seleção de melhorias no Level Up
  const triggerLevelUp = useCallback((s) => {
    s.isPaused = true;
    
    const pool = [
      { id: 'SPEED', name: 'Overclock Interno', description: '+15% Velocidade da Nave', icon: '🚀' },
      { id: 'COOLDOWN', name: 'Compilador Rápido', description: '+18% Cadência de Disparo', icon: '⚡' },
      { id: 'SHIELD', name: 'Firewall Ativo', description: 'Ativa um escudo que absorve 1 colisão', icon: '🛡️' },
      { id: 'LIFE', name: 'Refatorar Integridade', description: '+1 Vida Extra (Máx: 5)', icon: '🔧' },
    ];
    
    // Oferece upgrade de arma caso não esteja no máximo
    if (s.weaponLevel < 4) {
      pool.push({ id: 'WEAPON', name: 'Instalar Dependência', description: `Evolui arma para Nível ${s.weaponLevel + 1}`, icon: '🔫' });
    } else {
      pool.push({ id: 'PLASMA_OVERDRIVE', name: 'Plasma Overdrive', description: '+20% Raio de Explosão do Plasma', icon: '💥' });
    }
    
    // Seleciona 3 opções aleatórias únicas
    const shuffled = pool.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3);
    
    setUpgradeChoices(selected);
    setIsSelectingUpgrade(true);
  }, []);

  const selectUpgrade = (upgrade) => {
    if (!stateRef.current) return;
    const s = stateRef.current;
    
    if (upgrade.id === 'SPEED') {
      s.playerSpeedModifier += 0.15;
    } else if (upgrade.id === 'COOLDOWN') {
      s.cooldownModifier *= 0.82;
    } else if (upgrade.id === 'SHIELD') {
      s.shieldActive = true;
      setShieldActive(true);
    } else if (upgrade.id === 'LIFE') {
      if (s.player.lives < 5) {
        s.player.lives++;
        setLives(s.player.lives);
      }
    } else if (upgrade.id === 'WEAPON') {
      if (s.weaponLevel < 4) {
        s.weaponLevel++;
        setWeaponLevel(s.weaponLevel);
      }
    } else if (upgrade.id === 'PLASMA_OVERDRIVE') {
      s.plasmaRadiusModifier += 0.20;
    }
    
    setIsSelectingUpgrade(false);
    s.isPaused = false;
  };

  const handleShoot = useCallback((s) => {
    const now = Date.now();
    const cooldown = 280 * s.cooldownModifier;
    if (now - s.keys.lastShoot > cooldown) {
      const level = s.weaponLevel;
      if (level === 1) {
        // Laser verde padrão
        s.playerBullets.push({ x: s.player.x + PLAYER_W / 2, y: s.player.y, vy: -7.5, type: 'normal', color: '#10b981' });
      } else if (level === 2) {
        // Laser azul duplo lateral
        s.playerBullets.push({ x: s.player.x + 4, y: s.player.y, vy: -7.5, type: 'normal', color: '#3b82f6' });
        s.playerBullets.push({ x: s.player.x + PLAYER_W - 4, y: s.player.y, vy: -7.5, type: 'normal', color: '#3b82f6' });
      } else if (level === 3) {
        // Laser amarelo triplo em leque
        s.playerBullets.push({ x: s.player.x + PLAYER_W / 2, y: s.player.y, vy: -7.5, vx: 0, type: 'normal', color: '#eab308' });
        s.playerBullets.push({ x: s.player.x + PLAYER_W / 2, y: s.player.y, vy: -7.2, vx: -1.5, type: 'normal', color: '#eab308' });
        s.playerBullets.push({ x: s.player.x + PLAYER_W / 2, y: s.player.y, vy: -7.2, vx: 1.5, type: 'normal', color: '#eab308' });
      } else if (level === 4) {
        // Grande esfera de plasma ciano
        s.playerBullets.push({ x: s.player.x + PLAYER_W / 2, y: s.player.y, vy: -4.5, vx: 0, type: 'plasma' });
      }
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

    // Funções auxiliares declaradas no escopo do loop
    function damageEnemy(s, inv, index) {
      inv.health--;
      if (inv.health <= 0) {
        inv.alive = false;
        
        const xpDropCount = inv.type === 'leak' ? 4 : inv.type === 'glitch' ? 2 : 1;
        const pts = inv.type === 'leak' ? 400 : inv.type === 'glitch' ? 200 : inv.type === 'warning' ? 250 : 150;
        s.score += pts;

        // Partículas explosivas customizadas por tipo
        const particleColor = inv.type === 'leak' ? '#c084fc' : inv.type === 'warning' ? '#f59e0b' : inv.type === 'glitch' ? '#f97316' : '#f43f5e';
        for (let pi = 0; pi < (inv.type === 'leak' ? 18 : 10); pi++) {
          s.particles.push({
            x: inv.x + inv.w / 2,
            y: inv.y + inv.h / 2,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            color: particleColor,
            life: 25 + Math.random() * 15
          });
        }

        // Dropa XP Bits
        for (let bi = 0; bi < xpDropCount; bi++) {
          s.xpBits.push({
            x: inv.x + inv.w / 2,
            y: inv.y + inv.h / 2,
            vy: 1.2 + Math.random() * 1.5,
            vx: (Math.random() - 0.5) * 2.5,
            value: inv.type === 'leak' ? 30 : inv.type === 'glitch' ? 20 : 15,
          });
        }
      } else {
        // Flash e faíscas ao receber dano
        inv.flashFrames = 5;
        for (let pi = 0; pi < 3; pi++) {
          s.particles.push({
            x: inv.x + inv.w / 2,
            y: inv.y + inv.h / 2,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            color: '#ffffff',
            life: 12
          });
        }
      }
    }

    function triggerPlasmaExplosion(s, ex, ey) {
      const radius = 55 * s.plasmaRadiusModifier;
      
      // Efeito visual circular de onda expansiva
      for (let r = 0; r < 24; r++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.5 + Math.random() * 4.5;
        s.particles.push({
          x: ex,
          y: ey,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: Math.random() < 0.65 ? '#22d3ee' : '#a855f7',
          life: 20 + Math.random() * 15
        });
      }

      // Aplica dano a todos os inimigos no raio da explosão
      s.invaders.forEach((inv, k) => {
        if (!inv.alive) return;
        const renderY = inv.y + (inv.type === 'warning' ? Math.sin(inv.phase) * 8 : 0);
        const cx = inv.x + inv.w / 2;
        const cy = renderY + inv.h / 2;
        const dist = Math.hypot(cx - ex, cy - ey);
        if (dist <= radius) {
          inv.health -= 2; // Causa bastante dano no impacto
          damageEnemy(s, inv, k);
        }
      });
    }

    function loseLife(s) {
      if (s.shieldActive) {
        s.shieldActive = false;
        setShieldActive(false);
        s.player.invulnerableFrames = 60;
        
        // Efeito de explosão azul do escudo se rompendo
        for (let pi = 0; pi < 20; pi++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 2 + Math.random() * 4;
          s.particles.push({
            x: s.player.x + PLAYER_W / 2,
            y: s.player.y + PLAYER_H / 2,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color: '#22d3ee',
            life: 25
          });
        }
        return;
      }

      s.player.lives--;
      setLives(s.player.lives);
      
      // Penalidade de rebaixamento de arma
      if (s.weaponLevel > 1) {
        s.weaponLevel--;
        setWeaponLevel(s.weaponLevel);
      }

      if (s.player.lives <= 0) {
        s.isGameOver = true;
        setIsDead(true);
        onGameOverRef.current(s.score);
      } else {
        s.player.x = CANVAS_W / 2 - PLAYER_W / 2;
        s.player.invulnerableFrames = 90;
        s.enemyBullets = [];
        // Limpa glitchs investidas ao morrer
        s.invaders.forEach(inv => {
          if (inv.alive && inv.glitchCharge) {
            inv.glitchCharge = false;
            inv.y = 60 + (s.wave * 10) % 50; // recoloca mais acima
          }
        });
      }
    }

    function gameLoop() {
      if (!stateRef.current) return;
      const s = stateRef.current;
      const { player, invaders, playerBullets, enemyBullets, particles, xpBits, keys } = s;

      if (!s.isGameOver && !s.isPaused) {
        if (player.invulnerableFrames > 0) player.invulnerableFrames--;

        // Movimentação adaptativa baseada na velocidade melhorada
        const currentSpeed = 4.5 * s.playerSpeedModifier;
        if (keys.left) player.x = Math.max(8, player.x - currentSpeed);
        else if (keys.right) player.x = Math.min(CANVAS_W - PLAYER_W - 8, player.x + currentSpeed);

        // Movimentação e comportamento dos Projéteis do Jogador
        for (let i = playerBullets.length - 1; i >= 0; i--) {
          const b = playerBullets[i];
          b.y += b.vy;
          if (b.vx) b.x += b.vx;

          let hit = false;
          for (let k = 0; k < invaders.length; k++) {
            const inv = invaders[k];
            if (!inv.alive) continue;
            
            // Corrige Y baseado no zigue-zague se aplicável
            const renderY = inv.y + (inv.type === 'warning' ? Math.sin(inv.phase) * 8 : 0);

            if (b.x > inv.x && b.x < inv.x + inv.w && b.y > renderY && b.y < renderY + inv.h) {
              hit = true;
              if (b.type === 'plasma') {
                triggerPlasmaExplosion(s, b.x, b.y);
              } else {
                damageEnemy(s, inv, k);
              }
              break;
            }
          }
          if (hit || b.y < -15 || b.x < -15 || b.x > CANVAS_W + 15) playerBullets.splice(i, 1);
        }

        // Movimentação dos Inimigos (Ignora bugs em investida de colisão horizontal)
        let edgeReached = false;
        invaders.forEach(inv => {
          if (!inv.alive) return;
          
          if (inv.glitchCharge) {
            // Investida veloz para baixo em direção ao X do jogador
            inv.y += 4.5;
            const dx = (player.x + PLAYER_W / 2) - (inv.x + inv.w / 2);
            inv.x += Math.sign(dx) * 1.5;

            // Rastro de partículas do glitch
            if (Math.random() < 0.35) {
              particles.push({
                x: inv.x + inv.w / 2,
                y: inv.y,
                vx: (Math.random() - 0.5) * 2,
                vy: -0.8,
                color: '#f97316',
                life: 15
              });
            }

            // Colisão do Glitch Bug com o Jogador
            if (player.invulnerableFrames <= 0) {
              if (inv.x > player.x - inv.w && inv.x < player.x + PLAYER_W && inv.y > player.y - inv.h && inv.y < player.y + PLAYER_H) {
                inv.y = 60;
                inv.glitchCharge = false;
                loseLife(s);
              }
            }

            // Wrap-around se ultrapassar o limite inferior
            if (inv.y > CANVAS_H) {
              inv.y = 60;
              inv.glitchCharge = false;
            }
          } else {
            // Movimentação normal na grade
            const speedMod = inv.type === 'warning' ? 1.3 : 1.0;
            inv.x += s.invaderSpeed * s.invaderDir * speedMod;
            if (inv.type === 'warning') inv.phase += 0.05;

            if (inv.x < 10 || inv.x > CANVAS_W - inv.w - 10) edgeReached = true;
          }
        });

        if (edgeReached) {
          s.invaderDir *= -1;
          invaders.forEach(inv => {
            if (!inv.alive || inv.glitchCharge) return;
            inv.y += 18;
            if (inv.y + inv.h >= player.y) {
              s.isGameOver = true; setIsDead(true); onGameOverRef.current(s.score);
            }
          });
        }

        // Ataques e Ações dos Inimigos
        invaders.forEach(inv => {
          if (!inv.alive) return;
          inv.shootCooldown--;
          
          if (inv.shootCooldown <= 0) {
            if (inv.type === 'leak') {
              // Dispara dois tiros em espiral/leque
              enemyBullets.push({ x: inv.x + inv.w / 4, y: inv.y + inv.h, vy: 3.5 + s.wave * 0.35, rot: 0 });
              enemyBullets.push({ x: inv.x + (inv.w * 3) / 4, y: inv.y + inv.h, vy: 3.5 + s.wave * 0.35, rot: 0.4 });
              inv.shootCooldown = 110 + Math.random() * 150;
            } else if (inv.type === 'glitch') {
              // Glitch bugs ocasionalmente investem em vez de atirar
              if (Math.random() < 0.25 && !inv.glitchCharge) {
                inv.glitchCharge = true;
                // Partículas indicando carga de glitch
                for (let pi = 0; pi < 8; pi++) {
                  particles.push({
                    x: inv.x + inv.w / 2,
                    y: inv.y + inv.h,
                    vx: (Math.random() - 0.5) * 4,
                    vy: Math.random() * 2,
                    color: '#f97316',
                    life: 15
                  });
                }
                inv.shootCooldown = 180 + Math.random() * 100;
              } else {
                enemyBullets.push({ x: inv.x + inv.w / 2, y: inv.y + inv.h, vy: 3.2 + s.wave * 0.3, rot: 0 });
                inv.shootCooldown = 150 + Math.random() * 220;
              }
            } else {
              // Disparo normal
              enemyBullets.push({ x: inv.x + inv.w / 2, y: inv.y + inv.h, vy: 3.2 + s.wave * 0.3, rot: 0 });
              inv.shootCooldown = 160 + Math.random() * 240;
            }
          }
        });

        // Colisão das Balas Inimigas com Jogador
        for (let i = enemyBullets.length - 1; i >= 0; i--) {
          const eb = enemyBullets[i];
          eb.y += eb.vy;
          eb.rot += 0.12;
          if (player.invulnerableFrames <= 0) {
            if (eb.x > player.x && eb.x < player.x + PLAYER_W && eb.y > player.y && eb.y < player.y + PLAYER_H) {
              enemyBullets.splice(i, 1);
              loseLife(s);
              continue;
            }
          }
          if (eb.y > CANVAS_H + 10) enemyBullets.splice(i, 1);
        }

        // Física e Atração dos Coletáveis de XP (Ímã de Bits)
        for (let i = xpBits.length - 1; i >= 0; i--) {
          const bit = xpBits[i];
          bit.y += bit.vy;
          bit.x += bit.vx;
          bit.vx *= 0.98; // Desaceleração horizontal gradual

          // Magnetismo se estiver próximo do jogador
          const dx = (player.x + PLAYER_W / 2) - bit.x;
          const dy = (player.y + PLAYER_H / 2) - bit.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 85) {
            bit.x += (dx / dist) * 4.2;
            bit.y += (dy / dist) * 4.2;
          }

          // Colisão / Coleta de XP
          if (bit.x > player.x - 6 && bit.x < player.x + PLAYER_W + 6 && bit.y > player.y - 6 && bit.y < player.y + PLAYER_H + 6) {
            s.xp += bit.value;
            s.score += bit.value * 5;
            xpBits.splice(i, 1);

            // Verifica Level Up
            if (s.xp >= s.xpNeeded) {
              s.xp -= s.xpNeeded;
              s.level++;
              s.xpNeeded = Math.floor(s.xpNeeded * 1.25 + 50);
              triggerLevelUp(s);
            }
            continue;
          }

          if (bit.y > CANVAS_H + 10) xpBits.splice(i, 1);
        }

        // Partículas
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i]; p.x += p.vx; p.y += p.vy; p.life--;
          if (p.life <= 0) particles.splice(i, 1);
        }

        // Próxima onda
        const allDead = invaders.every(inv => !inv.alive);
        if (allDead) {
          s.wave++; setWave(s.wave);
          const { list, dir, speed } = generateInvaders(s.wave);
          s.invaders = list; s.invaderDir = dir; s.invaderSpeed = speed;
          s.enemyBullets = []; s.playerBullets = [];
        }

        // Sincroniza estados do HUD React em tempo real
        setScore(s.score);
        setXp(s.xp);
        setXpNeeded(s.xpNeeded);
        setLevel(s.level);
        setWeaponLevel(s.weaponLevel);
        setShieldActive(s.shieldActive);
      }

      // --- RENDERIZADOR ---
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.fillStyle = '#0a0a14'; ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Estrelas de Fundo
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      for (let star = 0; star < 15; star++) {
        ctx.fillRect((star * 123) % CANVAS_W, (star * 87) % CANVAS_H, 2, 2);
      }

      // Desenha Partículas
      for (const p of particles) { ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, 2, 2); }

      // Desenha XP Bits como binários piscantes e brilhantes ('0' e '1')
      ctx.save();
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      xpBits.forEach(bit => {
        ctx.fillStyle = '#22d3ee'; ctx.shadowColor = '#22d3ee'; ctx.shadowBlur = 6;
        ctx.fillText(Math.random() < 0.5 ? '0' : '1', bit.x, bit.y);
      });
      ctx.restore();

      // Desenha Projéteis do Jogador
      for (const b of playerBullets) {
        ctx.save();
        if (b.type === 'plasma') {
          // Esfera de Plasma com efeito de núcleo
          ctx.fillStyle = '#22d3ee'; ctx.shadowColor = '#22d3ee'; ctx.shadowBlur = 12;
          ctx.beginPath(); ctx.arc(b.x, b.y, 8, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#a855f7'; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.arc(b.x, b.y, 11, 0, Math.PI * 2); ctx.stroke();
        } else {
          ctx.fillStyle = b.color; ctx.shadowColor = b.color; ctx.shadowBlur = 8;
          ctx.fillRect(b.x - 1.5, b.y, 3, 10);
        }
        ctx.restore();
      }

      // Desenha Inimigos customizados
      invaders.forEach(inv => {
        if (!inv.alive) return;
        ctx.save();
        
        const renderY = inv.y + (inv.type === 'warning' ? Math.sin(inv.phase) * 8 : 0);

        if (inv.flashFrames > 0) {
          // Renderiza inteiramente em branco por dano
          ctx.fillStyle = '#ffffff'; ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 10;
          ctx.beginPath(); ctx.roundRect(inv.x, renderY, inv.w, inv.h, 4); ctx.fill();
          inv.flashFrames--;
        } else {
          // Estilização única de acordo com a classe do Bug
          if (inv.type === 'leak') {
            // TANK (Roxo) - Robusto e com mini-barra de vida
            ctx.fillStyle = '#c084fc'; ctx.shadowColor = '#d8b4fe'; ctx.shadowBlur = 8;
            ctx.beginPath(); ctx.roundRect(inv.x - 2, renderY - 2, inv.w + 4, inv.h + 4, 4); ctx.fill(); ctx.shadowBlur = 0;
            // Detalhe de blindagem
            ctx.strokeStyle = '#a855f7'; ctx.lineWidth = 1.5; ctx.strokeRect(inv.x + 2, renderY + 2, inv.w - 4, renderY + 4);
            // Olhos
            ctx.fillStyle = '#ffffff'; ctx.fillRect(inv.x + 4, renderY + 6, 4, 4); ctx.fillRect(inv.x + inv.w - 8, renderY + 6, 4, 4);
            ctx.fillStyle = '#7c3aed'; ctx.fillRect(inv.x + 5, renderY + 7, 2, 2); ctx.fillRect(inv.x + inv.w - 7, renderY + 7, 2, 2);
            // Indicador de vida
            if (inv.health < inv.maxHealth) {
              ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(inv.x, renderY - 8, inv.w, 4);
              ctx.fillStyle = '#c084fc'; ctx.fillRect(inv.x, renderY - 8, inv.w * (inv.health / inv.maxHealth), 4);
            }
          } else if (inv.type === 'warning') {
            // FAST (Amarelo) - Asas pontiagudas
            ctx.fillStyle = '#f59e0b'; ctx.shadowColor = '#fbbf24'; ctx.shadowBlur = 6;
            ctx.beginPath(); ctx.roundRect(inv.x, renderY, inv.w, inv.h, 6); ctx.fill(); ctx.shadowBlur = 0;
            // Asas laterais
            ctx.beginPath();
            ctx.moveTo(inv.x, renderY + inv.h / 2); ctx.lineTo(inv.x - 4, renderY + inv.h / 2 - 4); ctx.lineTo(inv.x - 4, renderY + inv.h / 2 + 4);
            ctx.moveTo(inv.x + inv.w, renderY + inv.h / 2); ctx.lineTo(inv.x + inv.w + 4, renderY + inv.h / 2 - 4); ctx.lineTo(inv.x + inv.w + 4, renderY + inv.h / 2 + 4);
            ctx.fill();
            // Olhos
            ctx.fillStyle = '#ffffff'; ctx.fillRect(inv.x + 4, renderY + 5, 4, 4); ctx.fillRect(inv.x + inv.w - 8, renderY + 5, 4, 4);
            ctx.fillStyle = '#d97706'; ctx.fillRect(inv.x + 5, renderY + 6, 2, 2); ctx.fillRect(inv.x + inv.w - 7, renderY + 6, 2, 2);
          } else if (inv.type === 'glitch') {
            // GLITCH (Laranja) - Renderizador oscilante / bugado
            const isGlitched = Math.random() < 0.15;
            const offsetX = isGlitched ? (Math.random() - 0.5) * 8 : 0;
            const offsetY = isGlitched ? (Math.random() - 0.5) * 4 : 0;
            ctx.fillStyle = '#f97316'; ctx.shadowColor = '#fdba74'; ctx.shadowBlur = 7;
            ctx.beginPath(); ctx.roundRect(inv.x + offsetX, renderY + offsetY, inv.w, inv.h, 2); ctx.fill(); ctx.shadowBlur = 0;
            // Olhos tipo listra de falha digital
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(inv.x + offsetX + 3, renderY + offsetY + 6, 5, 2);
            ctx.fillRect(inv.x + offsetX + inv.w - 8, renderY + offsetY + 6, 5, 2);
          } else {
            // PADRÃO (Vermelho)
            ctx.fillStyle = '#e11d48'; ctx.shadowColor = '#f43f5e'; ctx.shadowBlur = 6;
            ctx.beginPath(); ctx.roundRect(inv.x, renderY, inv.w, inv.h, 4); ctx.fill(); ctx.shadowBlur = 0;
            ctx.fillStyle = '#ffffff'; ctx.fillRect(inv.x + 3, renderY + 4, inv.w - 6, 5);
            ctx.fillStyle = '#e11d48'; ctx.beginPath(); ctx.arc(inv.x + inv.w / 2, renderY + 6.5, 1.8, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#e11d48'; ctx.lineWidth = 2; ctx.beginPath();
            ctx.moveTo(inv.x + 4, renderY + inv.h); ctx.lineTo(inv.x + 2, renderY + inv.h + 4);
            ctx.moveTo(inv.x + inv.w - 4, renderY + inv.h); ctx.lineTo(inv.x + inv.w - 2, renderY + inv.h + 4);
            ctx.stroke();
          }
        }
        ctx.restore();
      });

      // Desenha Projéteis do Inimigo (Shurikens)
      for (const eb of enemyBullets) {
        ctx.save(); ctx.translate(eb.x, eb.y); ctx.rotate(eb.rot);
        ctx.fillStyle = '#f43f5e'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, -SHURIKEN_SIZE / 2); ctx.lineTo(SHURIKEN_SIZE / 5, -SHURIKEN_SIZE / 5); ctx.lineTo(SHURIKEN_SIZE / 2, 0); ctx.lineTo(SHURIKEN_SIZE / 5, SHURIKEN_SIZE / 5); ctx.lineTo(0, SHURIKEN_SIZE / 2); ctx.lineTo(-SHURIKEN_SIZE / 5, SHURIKEN_SIZE / 5); ctx.lineTo(-SHURIKEN_SIZE / 2, 0); ctx.lineTo(-SHURIKEN_SIZE / 5, -SHURIKEN_SIZE / 5); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.restore();
      }

      // Desenha a Nave do Jogador (Piscando se invulnerável)
      const isBlinking = player.invulnerableFrames > 0 && Math.floor(player.invulnerableFrames / 5) % 2 === 0;
      if (!isBlinking) {
        ctx.save(); ctx.fillStyle = '#10b981'; ctx.shadowColor = '#10b981'; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.moveTo(player.x, player.y + PLAYER_H); ctx.lineTo(player.x + PLAYER_W / 2, player.y); ctx.lineTo(player.x + PLAYER_W, player.y + PLAYER_H); ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0;
        ctx.fillStyle = '#0a0a14'; ctx.font = 'bold 10px JetBrains Mono, monospace'; ctx.textAlign = 'center';
        ctx.fillText('>_', player.x + PLAYER_W / 2, player.y + PLAYER_H - 4); ctx.restore();

        // Desenha Escudo Protetor Neon
        if (s.shieldActive) {
          ctx.save();
          ctx.strokeStyle = '#22d3ee';
          ctx.lineWidth = 2;
          ctx.shadowColor = '#22d3ee';
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(player.x + PLAYER_W / 2, player.y + PLAYER_H / 2, 22, 0, Math.PI * 2);
          ctx.stroke();
          // Linhas dinâmicas rotativas internas
          ctx.strokeStyle = 'rgba(34, 211, 238, 0.4)';
          ctx.setLineDash([8, 15]);
          ctx.beginPath();
          ctx.arc(player.x + PLAYER_W / 2, player.y + PLAYER_H / 2, 18, Date.now() / 200, Date.now() / 200 + Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      }

      animRef.current = requestAnimationFrame(gameLoop);
    }

    animRef.current = requestAnimationFrame(gameLoop);
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [initGame, generateInvaders, handleShoot, triggerLevelUp]);

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
      <style>{`
        .levelup-panel {
          background: rgba(10, 10, 20, 0.95);
          border: 2px solid #22d3ee !important;
          box-shadow: 0 0 20px rgba(34, 211, 238, 0.3);
        }
        .upgrade-choice-card {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(34, 211, 238, 0.2);
          border-radius: 8px;
          padding: 10px 14px;
          color: #ffffff;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s ease;
          width: 100%;
        }
        .upgrade-choice-card:hover {
          background: rgba(34, 211, 238, 0.15);
          border-color: #22d3ee;
          transform: scale(1.02);
          box-shadow: 0 0 10px rgba(34, 211, 238, 0.2);
        }
        .upgrade-icon {
          font-size: 1.5rem;
        }
        .upgrade-info {
          display: flex;
          flex-direction: column;
        }
        .upgrade-title {
          font-weight: bold;
          font-size: 0.9rem;
          color: #22d3ee;
          font-family: 'JetBrains Mono', monospace;
        }
        .upgrade-desc {
          font-size: 0.75rem;
          color: #94a3b8;
          font-family: sans-serif;
        }
        .hud-xp-bar-container {
          height: 5px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
          overflow: hidden;
        }
        .hud-xp-bar {
          height: 100%;
          background: linear-gradient(90deg, #22d3ee, #10b981);
          box-shadow: 0 0 6px #22d3ee;
          transition: width 0.2s ease-out;
        }
      `}</style>

      {/* HUD de Jogo Melhorado */}
      <div className="game-hud" style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div className="hud-lives" style={{ display: 'flex', gap: '4px' }}>
            {Array.from({ length: Math.max(3, lives) }).map((_, i) => (
              <svg key={i} className={`hud-heart ${i < lives ? 'hud-heart--active' : 'hud-heart--empty'}`} viewBox="0 0 24 24" fill={i < lives ? '#f43f5e' : 'none'} stroke="#f43f5e" strokeWidth="2" style={{ width: 20, height: 20 }}>
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '10px', fontSize: '0.75rem', fontFamily: 'JetBrains Mono, monospace', color: '#94a3b8' }}>
            <span>Nív: <span style={{ color: '#22d3ee', fontWeight: 'bold' }}>{level}</span></span>
            <span>Arma: <span style={{ color: '#10b981', fontWeight: 'bold' }}>Lvl {weaponLevel}</span></span>
            {shieldActive && <span style={{ color: '#22d3ee', animation: 'pulse 1s infinite' }}>[🛡️]</span>}
          </div>
          <span className="game-score-count">Wave: <span className="text-accent">{wave}</span> | Score: {score}</span>
        </div>
        
        {/* Barra de XP de Progresso */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
          <span style={{ fontSize: '0.65rem', color: '#64748b', fontFamily: 'monospace', fontWeight: 'bold' }}>XP</span>
          <div className="hud-xp-bar-container" style={{ flexGrow: 1 }}>
            <div className="hud-xp-bar" style={{ width: `${Math.min(100, (xp / xpNeeded) * 100)}%` }} />
          </div>
        </div>
      </div>

      <div className="canvas-wrapper">
        <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} className="retro-canvas" />

        {/* Modal de Auto-Pause da LLM */}
        {isPaused && isProblemReady && !isSelectingUpgrade && (
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

        {/* Modal de Upgrade do Level Up */}
        {isSelectingUpgrade && (
          <div className="arcade-gameover-overlay animate-fade-in" style={{ zIndex: 110 }}>
            <div className="arcade-gameover-panel card levelup-panel" style={{ maxWidth: '340px' }}>
              <h2 className="text-accent mb-1 font-mono text-center" style={{ color: '#22d3ee', textShadow: '0 0 10px rgba(34,211,238,0.5)', fontSize: '1.4rem' }}>
                ▲ LEVEL UP! ▲
              </h2>
              <p className="text-secondary mb-4 text-center font-mono" style={{ fontSize: '0.8rem' }}>
                Selecione uma otimização do sistema:
              </p>
              <div className="flex flex-col gap-3 w-full">
                {upgradeChoices.map((choice, i) => (
                  <button
                    key={i}
                    className="upgrade-choice-card"
                    onClick={() => selectUpgrade(choice)}
                  >
                    <span className="upgrade-icon">{choice.icon}</span>
                    <div className="upgrade-info">
                      <span className="upgrade-title">{choice.name}</span>
                      <span className="upgrade-desc">{choice.description}</span>
                    </div>
                  </button>
                ))}
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
