import React from 'react';
import { Sparkles, Trophy, History, LogOut, BookOpen, Code2 } from 'lucide-react';
import './Navbar.css';


export default function Navbar({ 
  view, 
  setView, 
  VIEW, 
  currentUser, 
  userProfile, 
  onLogout, 
  onBack, 
  setError, 
  setResult 
}) {
  const handleNavClick = (targetView) => {
    setError(null);
    setResult(null);
    setView(targetView);
  };

  return (
    <header className="navbar">
      <div className="container flex items-center justify-between">
        <button className="navbar-brand" onClick={onBack}>
          <span className="landing-logo__icon">
            <Code2 size={16} />
          </span>
          <span className="landing-logo__text">
            <span className="landing-logo__python">PYTHON</span>
            <span className="landing-logo__arcade">ARCADE</span>
          </span>
        </button>
        
        <div className="navbar-right-side flex items-center gap-2">
          {/* Informações Rápidas do Usuário */}
          {userProfile && currentUser && (
            <div 
              className="user-badge" 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                background: 'rgba(8, 8, 20, 0.85)', 
                padding: '4px 12px 4px 6px', 
                borderRadius: '999px',
                border: '1px solid rgba(139, 92, 246, 0.3)',
              }}
            >
              <div style={{ width: 24, height: 24, borderRadius: '50%', overflow: 'hidden', border: '1px solid #7c3aed' }}>
                <img 
                  src={currentUser.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${currentUser.uid}`} 
                  alt={currentUser.displayName || 'Jogador'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <span style={{ fontSize: '0.8rem', color: '#f8fafc', fontWeight: 500 }}>
                {userProfile.total_score || 0} pts
              </span>
            </div>
          )}

          <nav className="navbar-links hide-on-mobile" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              className={`btn-secondary ${view === VIEW.MINIGAME ? 'btn-active' : ''}`}
              style={{ padding: '8px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={() => handleNavClick(VIEW.MINIGAME)}
            >
              <Sparkles size={14} style={{ color: '#10b981' }} />
              Fliperama
            </button>

            <button
              className={`btn-secondary ${view === VIEW.LEADERBOARD ? 'btn-active' : ''}`}
              style={{ padding: '8px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={() => handleNavClick(VIEW.LEADERBOARD)}
            >
              <Trophy size={14} style={{ color: '#f59e0b' }} />
              Ranking
            </button>

            <button
              className={`btn-secondary ${view === VIEW.HISTORY ? 'btn-active' : ''}`}
              style={{ padding: '8px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={() => handleNavClick(VIEW.HISTORY)}
            >
              <History size={14} style={{ color: '#ec4899' }} />
              Historico
            </button>

            {/* Nova Rota: Documentação Interativa de API */}
            <button
              className={`btn-secondary ${view === VIEW.DOCS ? 'btn-active' : ''}`}
              style={{ padding: '8px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={() => handleNavClick(VIEW.DOCS)}
            >
              <BookOpen size={14} style={{ color: '#6366f1' }} />
              Docs API
            </button>

            <button
              className="btn-secondary"
              style={{ padding: '8px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', borderColor: 'rgba(239, 68, 68, 0.4)' }}
              onClick={onLogout}
            >
              <LogOut size={14} style={{ color: '#ef4444' }} />
              Sair
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
