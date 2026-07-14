import React from 'react';
import { Code, Sparkles, Trophy, History, LogOut, BookOpen } from 'lucide-react';
import './BottomNav.css';


export default function BottomNav({ 
  view, 
  setView, 
  VIEW, 
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
    <nav className="bottom-nav show-on-mobile-flex">
      <button 
        className={`bottom-nav-item ${view === VIEW.HOME || view === VIEW.EXERCISE || view === VIEW.LOADING ? 'bottom-nav-item--active' : ''}`}
        onClick={onBack}
      >
        <Code size={20} />
        <span>Inicio</span>
      </button>
      
      <button 
        className={`bottom-nav-item ${view === VIEW.MINIGAME ? 'bottom-nav-item--active' : ''}`}
        onClick={() => handleNavClick(VIEW.MINIGAME)}
      >
        <Sparkles size={20} style={{ color: '#10b981' }} />
        <span>Fliperama</span>
      </button>

      <button 
        className={`bottom-nav-item ${view === VIEW.LEADERBOARD ? 'bottom-nav-item--active' : ''}`}
        onClick={() => handleNavClick(VIEW.LEADERBOARD)}
      >
        <Trophy size={20} style={{ color: '#f59e0b' }} />
        <span>Ranking</span>
      </button>

      <button 
        className={`bottom-nav-item ${view === VIEW.HISTORY ? 'bottom-nav-item--active' : ''}`}
        onClick={() => handleNavClick(VIEW.HISTORY)}
      >
        <History size={20} style={{ color: '#ec4899' }} />
        <span>Historico</span>
      </button>

      {/* Docs Mobile Link */}
      <button 
        className={`bottom-nav-item ${view === VIEW.DOCS ? 'bottom-nav-item--active' : ''}`}
        onClick={() => handleNavClick(VIEW.DOCS)}
      >
        <BookOpen size={20} style={{ color: '#6366f1' }} />
        <span>Docs</span>
      </button>

      <button 
        className="bottom-nav-item"
        style={{ color: '#ef4444' }}
        onClick={onLogout}
      >
        <LogOut size={20} />
        <span>Sair</span>
      </button>
    </nav>
  );
}
