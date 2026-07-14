import React from 'react';
import { Terminal, Play, Trophy } from 'lucide-react';
import './LoginCard.css';


export default function LoginCard({ error, setError, onLogin }) {
  return (
    <div className="login-page">
      <div className="login-card card">
        <div className="arcade-hub-neon-title" style={{ marginBottom: 12 }}>
          <span className="retro-neon-purple">PYTHON</span>
          <span className="retro-neon-cyan">ARCADE</span>
        </div>
        <p className="login-subtitle text-secondary">
          Aprenda Python jogando em um fliperama retro gamificado alimentado por IA!
        </p>
        
        <div className="login-features">
          <div className="feature-item">
            <span className="feature-icon" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>
              <Terminal size={18} />
            </span>
            <div>
              <strong>Desafios Gerados por IA</strong>
              <p>Estude tópicos customizados com códigos revisados e validados por agentes inteligentes.</p>
            </div>
          </div>
          <div className="feature-item">
            <span className="feature-icon" style={{ background: 'rgba(236,72,153,0.1)', color: '#ec4899' }}>
              <Play size={18} />
            </span>
            <div>
              <strong>Retro Mini-games</strong>
              <p>Jogue Doodle Ninja, Snake.py ou Bug Invaders enquanto a IA constrói seu compilador.</p>
            </div>
          </div>
          <div className="feature-item">
            <span className="feature-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
              <Trophy size={18} />
            </span>
            <div>
              <strong>Scoreboard & Placar Geral</strong>
              <p>Acumule pontos resolvendo códigos ou quebrando recordes e alcance o topo do ranking.</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="error-banner animate-fade-in" style={{ margin: '16px 0 0' }}>
            <span>{error}</span>
            <button onClick={() => setError(null)} className="error-close">x</button>
          </div>
        )}

        <button 
          className="btn-primary w-full justify-center" 
          style={{ 
            marginTop: 24, 
            padding: '12px', 
            fontSize: '1rem', 
            gap: '12px',
            background: 'linear-gradient(90deg, #6366f1 0%, #a855f7 100%)',
            border: 'none',
            boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)'
          }}
          onClick={onLogin}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" style={{ fill: '#ffffff' }}>
            <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-6.887 4.114-4.664 0-8.443-3.778-8.443-8.443s3.778-8.443 8.443-8.443c2.25 0 4.18.81 5.67 2.22l3.17-3.17C18.91 1.91 15.9 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.478 0 10.793-4.537 10.793-10.978 0-.74-.067-1.422-.19-2.22H12.24z"/>
          </svg>
          Entrar com o Google
        </button>

        <p style={{ fontSize: '0.7rem', color: '#475569', textAlign: 'center', marginTop: 20 }}>
          Autenticação segura provida pelo Google Firebase.
        </p>
      </div>
    </div>
  );
}
