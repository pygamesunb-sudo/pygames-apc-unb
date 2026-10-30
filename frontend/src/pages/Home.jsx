import { useState, useEffect } from 'react';
import { 
  Zap, 
  Target, 
  Trophy, 
  Sword, 
  Award, 
  Sparkles, 
  Search, 
  Check, 
  Play,
  Code2,
  CheckCircle2,
  Gamepad2,
  Cpu
} from 'lucide-react';
import { listProblems, saveGeminiConfig } from '../services/api';
import './Home.css';

const DIFFICULTIES = [
  { id: 'facil',       label: 'Fácil',       icon: Zap,    desc: 'Loops e condicionais simples' },
  { id: 'medio',       label: 'Médio',       icon: Target, desc: 'Funções, listas, strings' },
  { id: 'dificil',     label: 'Difícil',     icon: Trophy, desc: 'Algoritmos clássicos, O(n log n)' },
  { id: 'competitivo', label: 'Competitivo', icon: Sword,  desc: 'Grafos, DP, estruturas avançadas' },
];

const CATEGORIZED_SUGGESTIONS = {
  'Jogos': ['Minecraft e Redstone', 'Super Mario', 'Pokemon', 'Flappy Bird', 'Pac-man', 'Cyberpunk 2077'],
  'Aventura': ['Viagem no tempo', 'Piratas espaciais', 'Zumbis e sobrevivencia', 'Exploradores de cavernas', 'Segredos de Atlantida'],
  'Ciência & Desafios': ['Futebol', 'Receitas de culinaria', 'Musica e ritmo', 'Matematica divertida', 'Mercado Financeiro', 'Astronomia']
};

/**
 * Página inicial. O usuário escolhe o tema e a dificuldade para gerar um problema.
 * Layout atualizado para Dashboard de duas colunas com catálogo de questões interativo (cartuchos físicos).
 */
export default function Home({ onGenerate, onSelectProblem, isLoading, hasActiveProblem, onContinue, userProfile }) {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('facil');
  const [previousProblems, setPreviousProblems] = useState([]);
  const [useCustomKey, setUseCustomKey] = useState(() => localStorage.getItem('use_custom_key') === 'true');
  const [geminiApiKey, setGeminiApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  
  // Categorized suggestions state
  const [selectedCategory, setSelectedCategory] = useState('Jogos');
  
  // Gallery search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('todos');

  // WOW interactive states
  const [isRolling, setIsRolling] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    async function fetchProblems() {
      try {
        const data = await listProblems();
        setPreviousProblems(data);
      } catch (err) {
        console.error('Erro ao buscar problemas anteriores:', err);
      }
    }
    fetchProblems();
  }, []);

  const handleMouseMove = (e) => {
    const { clientX, clientY, currentTarget } = e;
    const rect = currentTarget.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((clientY - rect.top) / rect.height - 0.5) * 2;
    setMousePos({ x, y });
  };

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
        gain.gain.setValueAtTime(0.03, ctx.currentTime);
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
      } else if (type === 'roll') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300 + Math.random() * 300, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.02, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
      }
    } catch (e) {
      console.warn("AudioContext failed", e);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!topic.trim() || isRolling) return;
    playSound('click');
    onGenerate(topic.trim(), difficulty);
  };

  const handleSurpriseMe = () => {
    if (isRolling) return;
    setIsRolling(true);
    playSound('click');
    const allTopics = Object.values(CATEGORIZED_SUGGESTIONS).flat();
    let count = 0;
    const maxRolls = 14;

    const roll = () => {
      const randomTopic = allTopics[Math.floor(Math.random() * allTopics.length)];
      setTopic(randomTopic);
      playSound('roll');
      count++;

      if (count < maxRolls) {
        setTimeout(roll, 50 + count * 12);
      } else {
        setIsRolling(false);
        playSound('success');
      }
    };

    roll();
  };

  // Filter gallery items
  const filteredProblems = previousProblems.filter(prob => {
    const matchesSearch = prob.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          prob.topic.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDifficulty = filterDifficulty === 'todos' || prob.difficulty === filterDifficulty;
    return matchesSearch && matchesDifficulty;
  });

  // Calculate difficulty counts for the tabs
  const getDifficultyCount = (diff) => {
    if (diff === 'todos') return previousProblems.length;
    return previousProblems.filter(p => p.difficulty === diff).length;
  };

  // Calculate gamer profile level data
  const totalXP = userProfile?.coding_points || 0;
  const level = Math.floor(totalXP / 100) + 1;
  const currentLevelXP = totalXP % 100;
  const xpPercent = Math.min((currentLevelXP / 100) * 100, 100);

  return (
    <div className="home-dashboard-layout">
      
      {/* Coluna Esquerda: Controle do Jogador & Configurações (Sidebar) */}
      <aside className="home-sidebar animate-fade-in">
        
        {/* RPG Gamer Status Widget */}
        <div className="sidebar-widget profile-hud-widget">
          <div className="avatar-glow-wrapper">
            <img 
              src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${userProfile?.email || 'arcade'}`} 
              alt="Player Avatar"
              className="player-avatar-pixel"
            />
            <div className="avatar-online-dot" />
          </div>
          <div className="profile-hud-info">
            <span className="profile-hud-user-email">
              {userProfile?.email?.split('@')[0] || 'Jogador'}
            </span>
            <div className="player-rank-row">
              <span className="player-level-badge">LVL {level}</span>
              <span className="player-title">{level >= 5 ? 'GigaBrain' : level >= 3 ? 'Hacker' : 'Iniciante'}</span>
            </div>
            <div className="xp-bar-container">
              <div className="xp-bar-fill" style={{ width: `${xpPercent}%` }} />
              <span className="xp-text">{currentLevelXP}/100 XP</span>
            </div>
          </div>
        </div>

        {/* Global Statistics Summary */}
        <div className="sidebar-widget global-stats-widget">
          <div className="widget-header">
            <Trophy size={15} style={{ color: '#f59e0b' }} />
            <span>ESTATÍSTICAS GERAIS</span>
          </div>
          <div className="stats-hud-summary">
            <div className="stat-summary-box">
              <span className="stat-label">PONTOS</span>
              <strong className="stat-value glow-text-orange">{userProfile?.total_score || 0}</strong>
            </div>
            <div className="stat-summary-box">
              <span className="stat-label">CONCLUÍDOS</span>
              <strong className="stat-value glow-text-green">{userProfile?.solved_problems?.length || 0}</strong>
            </div>
          </div>
        </div>

        {/* Arcade Minigames Recordes Widget */}
        {userProfile?.games && (
          <div className="sidebar-widget arcade-scores-widget">
            <div className="widget-header">
              <Gamepad2 size={15} style={{ color: '#ec4899' }} />
              <span>RECORDES NO ARCADE</span>
            </div>
            <div className="scores-list">
              <div className="score-row-item">
                <span>Doodle Jump</span>
                <strong style={{ color: '#818cf8' }}>{userProfile.games.doodle || 0} pts</strong>
              </div>
              <div className="score-row-item">
                <span>Snake.py</span>
                <strong style={{ color: '#22d3ee' }}>{userProfile.games.snake || 0} pts</strong>
              </div>
              <div className="score-row-item">
                <span>Bug Invaders</span>
                <strong style={{ color: '#f43f5e' }}>{userProfile.games.invaders || 0} pts</strong>
              </div>
            </div>
          </div>
        )}

        {/* Gemini Engine Configuration Widget */}
        <div className="sidebar-widget api-key-widget">
          <div className="api-key-header">
            <div className="widget-header" style={{ margin: 0 }}>
              <Cpu size={15} style={{ color: '#c084fc' }} />
              <span className="cyber-label-text">CUSTOM AI KEY</span>
            </div>
            <label className="switch" style={{ display: 'inline-block', position: 'relative', width: '38px', height: '20px' }}>
              <input 
                type="checkbox" 
                checked={useCustomKey} 
                onChange={async (e) => {
                  const val = e.target.checked;
                  setUseCustomKey(val);
                  playSound('click');
                  localStorage.setItem('use_custom_key', val ? 'true' : 'false');
                  try {
                    await saveGeminiConfig(geminiApiKey || null, val);
                  } catch (err) {
                    console.error("Erro ao sincronizar ativacao do Gemini:", err);
                  }
                }} 
                disabled={isRolling}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span className="slider round" style={{
                position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: useCustomKey ? '#7c3aed' : '#475569',
                transition: '.4s', borderRadius: '34px',
                boxShadow: useCustomKey ? '0 0 8px rgba(124, 58, 237, 0.5)' : 'none'
              }}>
                <span style={{
                  position: 'absolute', content: '""', height: '14px', width: '14px', left: useCustomKey ? '21px' : '3px', bottom: '3px',
                  backgroundColor: 'white', transition: '.4s', borderRadius: '50%'
                }} />
              </span>
            </label>
          </div>
          
          {useCustomKey && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input
                className="input cyber-input-field"
                type="password"
                placeholder="Gemini API Key..."
                value={geminiApiKey}
                onChange={(e) => {
                  const val = e.target.value;
                  setGeminiApiKey(val);
                  localStorage.setItem('gemini_api_key', val);
                }}
                onBlur={async () => {
                  try {
                    await saveGeminiConfig(geminiApiKey || null, useCustomKey);
                  } catch (err) {
                    console.error("Erro ao salvar API Key do Gemini no servidor:", err);
                  }
                }}
                style={{ fontSize: '0.75rem', padding: '6px 10px', width: '100%', boxSizing: 'border-box' }}
              />
              <span style={{ fontSize: '0.62rem', color: '#64748b', fontFamily: 'monospace' }}>
                MODELO: gemini-3.1-flash-lite
              </span>
            </div>
          )}
        </div>
      </aside>

      {/* Coluna Direita: Centro de Comando (Main Content) */}
      <main className="home-main-content">
        
        {/* Interactive Cyberpunk Perspective Grid Hero */}
        <div 
          className="hero-perspective-wrapper animate-fade-in"
          onMouseMove={handleMouseMove}
          style={{
            '--mouse-x': mousePos.x,
            '--mouse-y': mousePos.y
          }}
        >
          <div className="hero-perspective-grid" />
          <div className="cyber-bracket cyber-bracket--top-left" />
          <div className="cyber-bracket cyber-bracket--top-right" />
          <div className="cyber-bracket cyber-bracket--bottom-left" />
          <div className="cyber-bracket cyber-bracket--bottom-right" />
          <div className="hero-perspective-content">
            <span className="cyber-banner-tag">SECURE_HOST: ONLINE // MISSION: CODE_LEARN</span>
            <h1 className="hero-title glitch-title" data-text="APRENDA A PROGRAMAR DO SEU JEITO">
              Aprenda a programar do seu <span className="landing-title__purple text-shadow-glow">jeito</span>
            </h1>
            <p className="hero-subtitle">
              Problemas de programação baseados nos seus interesses e criados na hora por inteligência artificial.
            </p>
          </div>
        </div>

        {hasActiveProblem && (
          <button
            onClick={() => { onContinue(); playSound('click'); }}
            className="btn-primary w-full animate-glow active-challenge-btn"
            style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <Play size={14} /> Continuar Desafio em Andamento
          </button>
        )}

        {/* Generation Form */}
        <form className="generate-form card cyber-panel-form animate-fade-in" onSubmit={handleSubmit}>
          <div className="cyber-bracket cyber-bracket--top-left" />
          <div className="cyber-bracket cyber-bracket--top-right" />
          <div className="cyber-bracket cyber-bracket--bottom-left" />
          <div className="cyber-bracket cyber-bracket--bottom-right" />
          <div className="cyber-grid-overlay" />

          <div className="form-group" style={{ position: 'relative', zIndex: 2 }}>
            <label className="label cyber-label-text" htmlFor="topic-input">
              Qual é o seu interesse ou tema favorito?
            </label>
            <div className="input-with-button-row">
              <input
                id="topic-input"
                className="input cyber-input-field"
                type="text"
                placeholder="Ex: Minecraft, Star Wars, Culinária..."
                value={topic}
                onChange={(e) => { setTopic(e.target.value); playSound('type'); }}
                disabled={isLoading || isRolling}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className={`btn-surprise cyber-surprise-btn ${isRolling ? 'rolling' : ''}`}
                onClick={handleSurpriseMe}
                disabled={isLoading || isRolling}
              >
                <Sparkles size={16} className={isRolling ? 'animate-spin' : ''} />
                <span>{isRolling ? 'Sorteando...' : 'Surpreenda-me'}</span>
              </button>
            </div>

            {/* Suggestion tabs and chips */}
            <div style={{ marginTop: '16px' }}>
              <div className="suggestion-category-row">
                {Object.keys(CATEGORIZED_SUGGESTIONS).map((cat) => (
                  <button
                    type="button"
                    key={cat}
                    className={`suggestion-filter-btn ${selectedCategory === cat ? 'suggestion-filter-btn--active' : ''}`}
                    onClick={() => { setSelectedCategory(cat); playSound('click'); }}
                    disabled={isLoading || isRolling}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <div className="topic-suggestions" style={{ marginTop: '8px' }}>
                {CATEGORIZED_SUGGESTIONS[selectedCategory].map((t) => (
                  <button
                    type="button"
                    key={t}
                    className="topic-chip"
                    onClick={() => { setTopic(t); playSound('click'); }}
                    disabled={isLoading || isRolling}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="form-group" style={{ position: 'relative', zIndex: 2 }}>
            <label className="label cyber-label-text">Nível de Dificuldade</label>
            <div className="difficulty-grid">
              {DIFFICULTIES.map(({ id, label, icon: Icon, desc }) => (
                <button
                  type="button"
                  key={id}
                  className={`difficulty-card difficulty-card--${id} ${difficulty === id ? 'difficulty-card--active' : ''}`}
                  onClick={() => { setDifficulty(id); playSound('click'); }}
                  disabled={isLoading || isRolling}
                >
                  <div className="difficulty-card-header">
                    <Icon size={18} className="difficulty-icon" />
                    <span className="difficulty-tech-code">
                      {id === 'facil' ? '[O(1)]' : id === 'medio' ? '[O(N)]' : id === 'dificil' ? '[O(N LOG N)]' : '[O(2^N)]'}
                    </span>
                  </div>
                  <span className="difficulty-label">{label}</span>
                  <span className="difficulty-desc">{desc}</span>
                  <div className="difficulty-laser-glow" />
                </button>
              ))}
            </div>
          </div>

          <button
            id="generate-btn"
            type="submit"
            className="btn-primary w-full animate-glow cyber-submit-button"
            disabled={isLoading || !topic.trim() || isRolling}
            style={{ position: 'relative', zIndex: 2 }}
          >
            {isLoading ? (
              <div className="btn-loader">
                <span className="spinner" />
                <span>GENERATING_LEVEL.EXE...</span>
              </div>
            ) : (
              'START_CHALLENGE.EXE'
            )}
          </button>
        </form>

        {/* Features Showcase */}
        <div className="features-grid animate-fade-in" style={{ animationDelay: '0.2s' }}>
          {[
            { title: 'Temas Personalizados', desc: 'Problemas gerados na hora sobre qualquer interesse que você digitar.' },
            { title: 'Pipeline de LLMs', desc: 'Um gerador e dois revisores garantem enunciados e testes de alta qualidade.' },
            { title: 'Modos de Resolução', desc: 'Edição livre ou no editor profissional com feedbacks imediatos.' },
            { title: 'Modo Arcade', desc: 'Jogue mini-games retrô divertidos no console enquanto a IA gera o código.' },
          ].map(({ title, desc }) => (
            <div key={title} className="feature-card card cyber-feature-card" style={{ padding: '20px' }}>
              <h3 className="feature-title" style={{ fontSize: '0.95rem', fontWeight: 700 }}>{title}</h3>
              <p className="feature-desc" style={{ fontSize: '0.8rem', margin: 0 }}>{desc}</p>
              <div className="feature-card-glow" />
            </div>
          ))}
        </div>

        {/* Recent Challenges Gallery (Question Catalog) */}
        {previousProblems.length > 0 && (
          <div style={{ marginTop: '24px' }} className="animate-fade-in question-catalog-section">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
              <h2 className="hero-title gallery-section-title" style={{ fontSize: '1.4rem', margin: 0, textAlign: 'left', fontWeight: 700 }}>
                Catálogo de Questões Geradas
              </h2>
              
              {/* Gallery Filters HUD */}
              <div className="gallery-filter-bar">
                <div className="gallery-search-box cyber-search-box">
                  <Search size={16} className="gallery-search-icon" />
                  <input
                    type="text"
                    placeholder="Pesquisar catálogo..."
                    className="input gallery-search-input cyber-input-field"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ fontSize: '0.85rem', padding: '10px 16px 10px 40px' }}
                  />
                </div>

                <div className="gallery-tabs">
                  {[
                    { id: 'todos', label: 'Todos' },
                    { id: 'facil', label: 'Fácil' },
                    { id: 'medio', label: 'Médio' },
                    { id: 'dificil', label: 'Difícil' },
                    { id: 'competitivo', label: 'Competitivo' }
                  ].map((tab) => (
                    <button
                      type="button"
                      key={tab.id}
                      className={`gallery-tab-btn ${filterDifficulty === tab.id ? 'gallery-tab-btn--active' : ''}`}
                      onClick={() => { setFilterDifficulty(tab.id); playSound('click'); }}
                    >
                      <span>{tab.label}</span>
                      <span className="tab-count-badge">{getDifficultyCount(tab.id)}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Interactive Arcade Cartridges Shelf Cabinet */}
            <div className="arcade-shelf-cabinet">
              <div className="shelf-decor-top">
                <span className="shelf-decor-indicator">REGISTRY // VOL.01</span>
                <span className="shelf-laser-bar" />
              </div>
              
              <div className="features-grid cartridge-shelf-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 285px), 1fr))', gap: '24px 20px' }}>
                {filteredProblems.length === 0 ? (
                  <div style={{ gridColumn: '1 / -1', padding: '60px 40px', textAlign: 'center', color: '#475569', fontSize: '0.85rem', fontFamily: 'monospace', background: 'rgba(255,255,255,0.01)', border: '1px dashed rgba(255,255,255,0.04)', borderRadius: '12px' }}>
                    &gt; NENHUM CARTUCHO DE DESAFIO ENCONTRADO NO BANCO DE DADOS
                  </div>
                ) : (
                  filteredProblems.map((prob) => {
                    const diffInfo = DIFFICULTIES.find(d => d.id === prob.difficulty) || DIFFICULTIES[0];
                    const Icon = diffInfo.icon;
                    
                    // Real completion check (resolved if problem ID is inside the solved_problems list)
                    const isResolved = userProfile?.solved_problems?.includes(prob.problem_id);
                    const xpReward = prob.difficulty === 'facil' ? '50' : prob.difficulty === 'medio' ? '100' : prob.difficulty === 'dificil' ? '200' : '400';

                    return (
                      <div 
                        key={prob.problem_id} 
                        className="feature-card card arcade-cartridge" 
                        style={{ cursor: 'pointer', position: 'relative' }}
                        onClick={() => { onSelectProblem(prob); playSound('click'); }}
                      >
                        <div className="cartridge-laser-scanner" />
                        <div className="cartridge-label-glow" style={{ background: diffInfo.id === 'facil' ? '#10b981' : diffInfo.id === 'medio' ? '#f59e0b' : diffInfo.id === 'dificil' ? '#f43f5e' : '#7c3aed' }} />
                        
                        {/* Completion Status Stamp */}
                        <div className={`card-status-badge ${isResolved ? 'card-status-badge--resolved' : 'card-status-badge--pending'}`}>
                          <span className={`led-indicator-dot ${isResolved ? 'online' : 'pulse-amber'}`} />
                          <span>{isResolved ? 'COMPILADO' : 'PLAY'}</span>
                        </div>

                        <div className="cartridge-header">
                          <Icon size={14} style={{ color: diffInfo.id === 'facil' ? '#10b981' : diffInfo.id === 'medio' ? '#f59e0b' : diffInfo.id === 'dificil' ? '#f43f5e' : '#7c3aed' }} />
                          <span className="cartridge-difficulty">
                            {prob.difficulty.toUpperCase()}
                          </span>
                        </div>
                        <h3 className="feature-title cartridge-title">
                          {prob.title}
                        </h3>
                        
                        <div className="cartridge-footer">
                          <span className="cartridge-tag">TEMA: {prob.topic.toUpperCase()}</span>
                          <span className="cartridge-xp-reward">+{xpReward} XP</span>
                        </div>

                        {/* Physical Cartridge connector pins mock */}
                        <div className="cartridge-connector-pins">
                          <span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
