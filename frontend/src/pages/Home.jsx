import { useState, useEffect } from 'react';
import { Zap, Target, Trophy, Sword } from 'lucide-react';
import { listProblems, saveGeminiConfig } from '../services/api';

const DIFFICULTIES = [
  { id: 'facil',       label: 'Facil',       icon: Zap,    desc: 'Loops e condicionais simples' },
  { id: 'medio',       label: 'Medio',       icon: Target, desc: 'Funcoes, listas, strings' },
  { id: 'dificil',     label: 'Dificil',     icon: Trophy, desc: 'Algoritmos classicos, O(n log n)' },
  { id: 'competitivo', label: 'Competitivo', icon: Sword,  desc: 'Grafos, DP, estruturas avancadas' },
];

const SUGGESTED_TOPICS = [
  'Minecraft e Redstone', 'Super Mario', 'Pokemon', 'Futebol',
  'Receitas de culinaria', 'Viagem no tempo', 'Piratas espaciais',
  'Zumbis e sobrevivencia', 'Musica e ritmo', 'Matematica divertida',
];

/**
 * Pagina inicial. O usuario escolhe o tema e a dificuldade para gerar um problema.
 */
export default function Home({ onGenerate, onSelectProblem, isLoading }) {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('facil');
  const [previousProblems, setPreviousProblems] = useState([]);
  const [useCustomKey, setUseCustomKey] = useState(() => localStorage.getItem('use_custom_key') === 'true');
  const [geminiApiKey, setGeminiApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');

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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!topic.trim()) return;
    onGenerate(topic.trim(), difficulty);
  };

  return (
    <div className="home-container animate-fade-in">
      {/* Hero */}
      <div className="hero">
        <div className="hero-badge">
          <span>Powered by LLM</span>
        </div>
        <h1 className="hero-title">
          Aprenda a programar do seu <span className="text-accent">jeito</span>
        </h1>
        <p className="hero-subtitle">
          Problemas de programacao gerados por inteligencia artificial com base nos seus interesses.
          De iniciante a programacao competitiva.
        </p>
      </div>

      {/* Formulario */}
      <form className="generate-form card animate-fade-in" onSubmit={handleSubmit} style={{ animationDelay: '0.1s' }}>
        <div className="form-group">
          <label className="label" htmlFor="topic-input">
            Qual e o seu interesse?
          </label>
          <input
            id="topic-input"
            className="input"
            type="text"
            placeholder="Ex: Minecraft, Pokemon, Futebol..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={isLoading}
          />
          <div className="topic-suggestions">
            {SUGGESTED_TOPICS.map((t) => (
              <button
                type="button"
                key={t}
                className="topic-chip"
                onClick={() => setTopic(t)}
                disabled={isLoading}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="label">Nivel de dificuldade</label>
          <div className="difficulty-grid">
            {DIFFICULTIES.map(({ id, label, icon: Icon, desc }) => (
              <button
                type="button"
                key={id}
                className={`difficulty-card ${difficulty === id ? 'difficulty-card--active' : ''}`}
                onClick={() => setDifficulty(id)}
                disabled={isLoading}
              >
                <Icon size={20} />
                <span className="difficulty-label">{label}</span>
                <span className="difficulty-desc">{desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Painel da API Key do Gemini (Google AI Studio) */}
        <div className="api-key-section" style={{
          marginTop: '10px',
          padding: '16px',
          background: 'rgba(15, 23, 42, 0.4)',
          borderRadius: '8px',
          border: '1px solid rgba(99, 102, 241, 0.15)',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: '#f8fafc', fontWeight: 600 }}>
              Usar sua própria API Key do Gemini
            </span>
            <label className="switch" style={{ display: 'inline-block', position: 'relative', width: '40px', height: '22px' }}>
              <input 
                type="checkbox" 
                checked={useCustomKey} 
                onChange={async (e) => {
                  const val = e.target.checked;
                  setUseCustomKey(val);
                  localStorage.setItem('use_custom_key', val ? 'true' : 'false');
                  try {
                    await saveGeminiConfig(geminiApiKey || null, val);
                  } catch (err) {
                    console.error("Erro ao sincronizar ativacao do Gemini:", err);
                  }
                }} 
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span className="slider round" style={{
                position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: useCustomKey ? '#6366f1' : '#475569',
                transition: '.4s', borderRadius: '34px',
                boxShadow: useCustomKey ? '0 0 8px rgba(99, 102, 241, 0.5)' : 'none'
              }}>
                <span style={{
                  position: 'absolute', content: '""', height: '16px', width: '16px', left: useCustomKey ? '21px' : '3px', bottom: '3px',
                  backgroundColor: 'white', transition: '.4s', borderRadius: '50%'
                }} />
              </span>
            </label>
          </div>
          
          {useCustomKey && (
            <div className="animate-fade-in" style={{ marginTop: '12px' }}>
              <input
                className="input"
                type="password"
                placeholder="Insira sua Gemini API Key (AI Studio)..."
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
                style={{ fontSize: '0.8rem', padding: '8px 12px', width: '100%', boxSizing: 'border-box' }}
              />
              <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#94a3b8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Modelo Fixo: <strong style={{ color: '#818cf8' }}>gemini-3.1-flash-lite</strong></span>
                <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>Sincronizado na sua conta</span>
              </div>
            </div>
          )}
        </div>

        <button
          id="generate-btn"
          type="submit"
          className="btn-primary w-full animate-glow"
          disabled={isLoading || !topic.trim()}
        >
          {isLoading
            ? <><span className="spinner" /> Gerando problema...</>
            : 'Gerar Problema'}
        </button>
      </form>

      {/* Secao de features */}
      <div className="features-grid animate-fade-in" style={{ animationDelay: '0.2s' }}>
        {[
          { title: 'Temas Personalizados', desc: 'Problemas sobre Minecraft, jogos, culinaria ou qualquer coisa que voce goste.' },
          { title: 'Pipeline com 3 LLMs', desc: 'Um gerador e dois revisores garantem a qualidade de cada problema.' },
          { title: '3 Modos de Resolucao', desc: 'Blocos montados, blocos livres ou editor de codigo profissional.' },
          { title: 'Mini-Game de Espera', desc: 'Jogue um Doodle Jump com comandos Python enquanto o problema e gerado.' },
        ].map(({ title, desc }) => (
          <div key={title} className="feature-card card">
            <h3 className="feature-title">{title}</h3>
            <p className="feature-desc">{desc}</p>
          </div>
        ))}
      </div>

      {/* Galeria de desafios anteriores */}
      {previousProblems.length > 0 && (
        <div style={{ marginTop: 50 }}>
          <h2 className="hero-title" style={{ fontSize: '1.4rem', marginBottom: 24, textAlign: 'left', fontWeight: 600 }}>
            Galeria de Desafios Recentes
          </h2>
          <div className="features-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {previousProblems.map((prob) => {
              const diffInfo = DIFFICULTIES.find(d => d.id === prob.difficulty) || DIFFICULTIES[0];
              const Icon = diffInfo.icon;
              return (
                <div 
                  key={prob.problem_id} 
                  className="feature-card card animate-glow" 
                  style={{ cursor: 'pointer', transition: 'all 0.2s', border: '1px solid rgba(99,102,241,0.1)' }}
                  onClick={() => onSelectProblem(prob)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 8 }}>
                    <Icon size={14} className="text-accent" />
                    <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#818cf8', fontWeight: 600 }}>
                      {prob.difficulty}
                    </span>
                  </div>
                  <h3 className="feature-title" style={{ fontSize: '1rem', margin: '0 0 8px 0', color: '#f8fafc', fontWeight: 600 }}>
                    {prob.title}
                  </h3>
                  <p className="feature-desc" style={{ fontSize: '0.8rem', margin: 0, color: '#64748b' }}>
                    Tema: {prob.topic}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
