import { useRef, useEffect, useState, useCallback } from 'react';
import { SNAKE_LEVELS } from './snakeLevels';
import MobileDpad from './MobileDpad';
import CodeDisplay from './CodeDisplay';

const CANVAS_W = 400;
const CANVAS_H = 600;
const GRID_SIZE = 16;
const COLS = Math.floor(CANVAS_W / GRID_SIZE);
const ROWS = Math.floor(CANVAS_H / GRID_SIZE);

export default function SnakePy({ onGameOver, onBackToMenu, isProblemReady, onGoToExercise }) {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const animRef = useRef(null);

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [currentScript, setCurrentScript] = useState({ lines: [], tokens: [] });
  const [currentTokenIdx, setCurrentTokenIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const selectScriptForLevel = useCallback((lvl) => {
    const levelKey = lvl > 4 ? 4 : lvl;
    const variants = SNAKE_LEVELS[levelKey];
    const randomIndex = Math.floor(Math.random() * variants.length);
    return JSON.parse(JSON.stringify(variants[randomIndex]));
  }, []);

  const spawnFoodsForTokens = useCallback((snakeBody, tokens, currentIdx, count) => {
    const spawnedFoods = [];
    const activeIndices = [currentIdx];
    
    for (let i = 1; i < count; i++) {
      const nextIdx = (currentIdx + i) % tokens.length;
      activeIndices.push(nextIdx);
    }

    activeIndices.forEach((tIdx) => {
      let x, y, overlap;
      do {
        x = Math.floor(randomBetween(1, COLS - 1));
        y = Math.floor(randomBetween(3, ROWS - 1));
        overlap = snakeBody.some(segment => segment.x === x && segment.y === y) ||
                  spawnedFoods.some(food => food.x === x && food.y === y);
      } while (overlap);

      spawnedFoods.push({ x, y, word: tokens[tIdx], tokenIndex: tIdx });
    });

    return spawnedFoods;
  }, []);

  const spawnBugsForScript = useCallback((snakeBody, foods, count) => {
    const spawnedBugs = [];
    for (let i = 0; i < count; i++) {
      let x, y, overlap;
      do {
        x = Math.floor(randomBetween(1, COLS - 1));
        y = Math.floor(randomBetween(3, ROWS - 1));
        overlap = snakeBody.some(segment => segment.x === x && segment.y === y) ||
                  (foods && foods.some(f => f.x === x && f.y === y)) ||
                  spawnedBugs.some(b => b.x === x && b.y === y);
      } while (overlap);

      spawnedBugs.push({ x, y, tickCounter: 0 });
    }
    return spawnedBugs;
  }, []);

  const replenishFood = useCallback((s) => {
    const tokens = s.script.tokens;
    const currentIdx = s.currentTokenIndex;
    const isNextPresent = s.foods.some(f => f.tokenIndex === currentIdx);
    
    let tokenIdx = currentIdx;
    if (isNextPresent) {
      tokenIdx = (currentIdx + s.foods.length) % tokens.length;
    }

    let x, y, overlap;
    let attempts = 0;
    do {
      x = Math.floor(randomBetween(1, COLS - 1));
      y = Math.floor(randomBetween(3, ROWS - 1));
      overlap = s.snake.some(segment => segment.x === x && segment.y === y) ||
                s.foods.some(food => food.x === x && food.y === y) ||
                s.bugs.some(bug => bug.x === x && bug.y === y);
      attempts++;
    } while (overlap && attempts < 100);

    s.foods.push({ x, y, word: tokens[tokenIdx], tokenIndex: tokenIdx });
  }, []);

  const initGame = useCallback(() => {
    const initialSnake = [{ x: 12, y: 18 }, { x: 12, y: 19 }, { x: 12, y: 20 }];
    const initialLevel = 1;
    const script = selectScriptForLevel(initialLevel);
    
    const foodsCount = 2 * script.lines.length;
    const foods = spawnFoodsForTokens(initialSnake, script.tokens, 0, foodsCount);
    const bugs = spawnBugsForScript(initialSnake, foods, script.lines.length);

    stateRef.current = {
      snake: initialSnake,
      direction: { x: 0, y: -1 },
      nextDirection: { x: 0, y: -1 },
      level: initialLevel,
      script,
      foods,
      bugs,
      currentTokenIndex: 0,
      score: 0,
      lives: 3,
      tickRate: 155,
      lastTickTime: 0,
      floaters: [],
      invulnerableFrames: 60,
      isGameOver: false,
      isPaused: false
    };

    setScore(0);
    setLives(3);
    setLevel(initialLevel);
    setCurrentScript(script);
    setCurrentTokenIdx(0);
    setIsPaused(false);
  }, [selectScriptForLevel, spawnFoodsForTokens, spawnBugsForScript]);

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
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'w', 's', 'a', 'd', 'W', 'S', 'A', 'D'].includes(e.key)) {
        e.preventDefault();
      }
      if (s.isGameOver || s.isPaused) return;

      const dir = s.direction;
      if ((e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') && dir.y === 0) s.nextDirection = { x: 0, y: -1 };
      if ((e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') && dir.y === 0) s.nextDirection = { x: 0, y: 1 };
      if ((e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') && dir.x === 0) s.nextDirection = { x: -1, y: 0 };
      if ((e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') && dir.x === 0) s.nextDirection = { x: 1, y: 0 };
    };

    window.addEventListener('keydown', onKeyDown);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function gameLoop(timestamp) {
      if (!stateRef.current) return;
      const s = stateRef.current;

      if (!s.isGameOver && !s.isPaused) {
        if (!s.lastTickTime) s.lastTickTime = timestamp;
        const elapsed = timestamp - s.lastTickTime;

        if (elapsed > s.tickRate) {
          s.lastTickTime = timestamp;
          updateLogic(s);
        }

        for (let i = s.floaters.length - 1; i >= 0; i--) {
          s.floaters[i].y -= 0.8;
          s.floaters[i].life--;
          if (s.floaters[i].life <= 0) s.floaters.splice(i, 1);
        }
      }

      // --- RENDER ---
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.fillStyle = '#090d16'; ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      ctx.strokeStyle = 'rgba(34, 211, 238, 0.02)'; ctx.lineWidth = 1;
      for (let x = 0; x < CANVAS_W; x += GRID_SIZE) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_H); ctx.stroke(); }
      for (let y = 0; y < CANVAS_H; y += GRID_SIZE) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_W, y); ctx.stroke(); }

      // Foods (Identical layout to force reading the Python lines)
      s.foods.forEach((food) => {
        const fx = food.x * GRID_SIZE;
        const fy = food.y * GRID_SIZE;
        ctx.fillStyle = '#22d3ee';
        
        ctx.save();
        ctx.shadowColor = '#22d3ee'; ctx.shadowBlur = 10;
        ctx.fillRect(fx + 1, fy + 1, GRID_SIZE - 2, GRID_SIZE - 2);
        ctx.restore();

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 9px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(food.word, fx + GRID_SIZE / 2, fy - 3);
      });

      // Chasing Bugs
      s.bugs.forEach((b) => {
        const bx = b.x * GRID_SIZE;
        const by = b.y * GRID_SIZE;
        ctx.fillStyle = '#f43f5e'; ctx.shadowColor = '#f43f5e'; ctx.shadowBlur = 12;
        ctx.fillRect(bx + 1, by + 1, GRID_SIZE - 2, GRID_SIZE - 2); ctx.shadowBlur = 0;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(bx + 3, by + 4, 2, 2); ctx.fillRect(bx + 11, by + 4, 2, 2);

        ctx.fillStyle = '#f43f5e'; ctx.font = 'bold 7px Inter, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('BUG', bx + GRID_SIZE / 2, by - 3);
      });

      // Snake
      const isBlinking = s.invulnerableFrames > 0 && Math.floor(s.invulnerableFrames / 5) % 2 === 0;
      if (s.invulnerableFrames > 0) s.invulnerableFrames--;

      if (!isBlinking) {
        s.snake.forEach((segment, index) => {
          const sx = segment.x * GRID_SIZE;
          const sy = segment.y * GRID_SIZE;

          if (index === 0) {
            ctx.fillStyle = '#6366f1'; ctx.shadowColor = '#6366f1'; ctx.shadowBlur = 12;
            ctx.beginPath(); ctx.roundRect(sx + 0.5, sy + 0.5, GRID_SIZE - 1, GRID_SIZE - 1, 4); ctx.fill(); ctx.shadowBlur = 0;
            ctx.fillStyle = '#ffffff'; ctx.fillRect(sx + 4, sy + 4, 2, 2); ctx.fillRect(sx + 10, sy + 4, 2, 2);
          } else {
            ctx.fillStyle = `rgba(99, 102, 241, ${1 - index / (s.snake.length + 3)})`;
            ctx.beginPath(); ctx.roundRect(sx + 1, sy + 1, GRID_SIZE - 2, GRID_SIZE - 2, 2); ctx.fill();
          }
        });
      }

      ctx.font = 'bold 10px JetBrains Mono, monospace'; ctx.textAlign = 'center';
      for (const f of s.floaters) {
        ctx.fillStyle = f.color || `rgba(34, 211, 238, ${f.life / 40})`;
        ctx.fillText(f.word, f.x, f.y);
      }

      animRef.current = requestAnimationFrame(gameLoop);
    }

    function updateLogic(s) {
      s.direction = s.nextDirection;
      const head = s.snake[0];
      const newHead = { x: head.x + s.direction.x, y: head.y + s.direction.y };

      if (newHead.x < 0 || newHead.x >= COLS || newHead.y < 0 || newHead.y >= ROWS) {
        loseLife(s); return;
      }
      if (s.snake.some((seg, idx) => idx > 0 && seg.x === newHead.x && seg.y === newHead.y)) {
        loseLife(s); return;
      }

      // Chase bugs 50% speed
      if (s.bugs) {
        for (let i = 0; i < s.bugs.length; i++) {
          const bug = s.bugs[i];
          bug.tickCounter++;
          if (bug.tickCounter >= 2) {
            bug.tickCounter = 0;
            const dx = head.x - bug.x;
            const dy = head.y - bug.y;
            if (Math.abs(dx) > Math.abs(dy)) bug.x += Math.sign(dx);
            else bug.y += Math.sign(dy);

            if (s.invulnerableFrames <= 0 && bug.x === head.x && bug.y === head.y) {
              loseLife(s); return;
            }
          }
        }
      }

      s.snake.unshift(newHead);

      let eatenFoodIdx = -1;
      for (let i = 0; i < s.foods.length; i++) {
        if (newHead.x === s.foods[i].x && newHead.y === s.foods[i].y) {
          eatenFoodIdx = i; break;
        }
      }

      if (eatenFoodIdx !== -1) {
        const food = s.foods[eatenFoodIdx];
        
        if (food.tokenIndex === s.currentTokenIndex) {
          s.score += 200;
          s.currentTokenIndex++;
          setCurrentTokenIdx(s.currentTokenIndex);

          s.floaters.push({ x: food.x * GRID_SIZE + GRID_SIZE / 2, y: food.y * GRID_SIZE, word: `OK: ${food.word}`, life: 30, color: '#10b981' });

          if (s.currentTokenIndex >= s.script.tokens.length) {
            s.score += 1000 * s.level;
            s.level++; setLevel(s.level);

            s.floaters.push({ x: CANVAS_W / 2, y: CANVAS_H / 2, word: `FASE ${s.level} COMPILADA!`, life: 50, color: '#22d3ee' });

            const nextScript = selectScriptForLevel(s.level);
            s.script = nextScript; s.currentTokenIndex = 0;
            setCurrentScript(nextScript); setCurrentTokenIdx(0);

            s.foods = spawnFoodsForTokens(s.snake, nextScript.tokens, 0, 2 * nextScript.lines.length);
            s.bugs = spawnBugsForScript(s.snake, s.foods, nextScript.lines.length);
            s.tickRate = Math.max(90, s.tickRate - 6);
          } else {
            s.foods.splice(eatenFoodIdx, 1);
            replenishFood(s);
          }
        } else {
          s.score = Math.max(0, s.score - 150);
          s.floaters.push({ x: food.x * GRID_SIZE + GRID_SIZE / 2, y: food.y * GRID_SIZE, word: 'SyntaxError!', life: 35, color: '#f43f5e' });

          if (s.snake.length > 3) s.snake.pop();

          s.currentTokenIndex = 0; setCurrentTokenIdx(0);
          s.foods = spawnFoodsForTokens(s.snake, s.script.tokens, 0, 2 * s.script.lines.length);
        }
      } else {
        s.snake.pop();
      }

      if (s.invulnerableFrames <= 0 && s.bugs) {
        const hitBug = s.bugs.some(bug => s.snake.some(seg => seg.x === bug.x && seg.y === bug.y));
        if (hitBug) {
          loseLife(s); return;
        }
      }

      setScore(s.score);
    }

    function loseLife(s) {
      s.lives--; setLives(s.lives);
      if (s.lives <= 0) {
        s.isGameOver = true; onGameOver(s.score);
      } else {
        const snakeReset = [{ x: 12, y: 18 }, { x: 12, y: 19 }, { x: 12, y: 20 }];
        s.snake = snakeReset; s.direction = { x: 0, y: -1 }; s.nextDirection = { x: 0, y: -1 };
        s.currentTokenIndex = 0; setCurrentTokenIdx(0);
        s.foods = spawnFoodsForTokens(snakeReset, s.script.tokens, 0, 2 * s.script.lines.length);
        s.bugs = spawnBugsForScript(snakeReset, s.foods, s.script.lines.length);
        s.invulnerableFrames = 60;
      }
    }

    animRef.current = requestAnimationFrame(gameLoop);
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [initGame, spawnFoodsForTokens, spawnBugsForScript, replenishFood, onGameOver, selectScriptForLevel]);

  const handleVirtualDirection = (dx, dy) => {
    if (!stateRef.current) return;
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused) return;

    if (dx !== 0 && s.direction.x === 0) s.nextDirection = { x: dx, y: 0 };
    if (dy !== 0 && s.direction.y === 0) s.nextDirection = { x: 0, y: dy };
  };

  const handleUnpause = () => {
    if (stateRef.current) {
      stateRef.current.isPaused = false; setIsPaused(false);
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
        <span className="game-score-count">
          Fase: <span className="text-accent">{level}</span> | Score: {score}
        </span>
      </div>

      <CodeDisplay currentScript={currentScript} />

      <div className="canvas-wrapper">
        <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} className="retro-canvas" />

        {isPaused && isProblemReady && (
          <div className="arcade-gameover-overlay animate-fade-in" style={{ zIndex: 100 }}>
            <div className="arcade-gameover-panel card" style={{ borderColor: 'var(--accent-primary)' }}>
              <h2 className="text-accent mb-2 font-mono">CÓDIGO COMPILADO!</h2>
              <p className="text-secondary mb-6" style={{ fontSize: '0.85rem' }}>
                Seu problema de programação foi gerado com sucesso pela IA do Agente.
              </p>
              <div className="flex flex-col gap-3 w-full">
                <button className="btn-primary" onClick={onGoToExercise}>Ir para o Exercício</button>
                <button className="btn-secondary" onClick={handleUnpause}>Continuar Jogando</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <MobileDpad onDirection={handleVirtualDirection} />

      <div className="game-controls-legend hide-on-mobile">
        <span>Setas ou WASD: Controlar a cobrinha</span>
        <span>Apenas ler as linhas de script acima diz qual token comer!</span>
      </div>
    </div>
  );
}

function randomBetween(a, b) { return a + Math.random() * (b - a); }
