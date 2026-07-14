import React from 'react';
import MiniGame from './MiniGame';
import './LoadingView.css';

export default function LoadingView({
  isProblemReady,
  phase,
  eta,
  userProfile,
  setView,
  VIEW,
  setIsProblemReady
}) {
  return (
    <div className="loading-view animate-fade-in" style={{ width: '100%' }}>
      <div className="loading-container card" style={{ width: '100%', maxWidth: 500, margin: '0 auto 24px', padding: 24, border: '1px solid rgba(99,102,241,0.2)' }}>
        {isProblemReady ? (
          <div className="text-center animate-fade-in">
            <span className="badge badge--facil" style={{ padding: '6px 14px', fontSize: '0.85rem', marginBottom: 12 }}>
              COMPILADO COM SUCESSO!
            </span>
            <h3 style={{ margin: '0 0 12px 0', color: '#f8fafc' }}>Seu desafio de programação está pronto!</h3>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: 20 }}>
              Você pode continuar se divertindo no fliperama abaixo ou clicar no botão para resolver o exercício de Python.
            </p>
            <button 
              className="btn-primary w-full justify-center" 
              onClick={() => {
                setView(VIEW.EXERCISE);
                setIsProblemReady(false);
              }}
            >
              Iniciar Desafio de Programação
            </button>
          </div>
        ) : (
          <>
            <div className="loading-header-wrapper">
              <div className="loading-phase-container">
                <div className="spinner" style={{ width: 16, height: 16, flexShrink: 0 }} />
                <span className="loading-phase-text">{phase}</span>
              </div>
              <span className="loading-eta-text">
                ETA: {eta}s
              </span>
            </div>
            {/* Progress bar */}
            <div style={{ background: '#1e293b', borderRadius: 999, height: 6, overflow: 'hidden', width: '100%', marginBottom: 12 }}>
              <div 
                style={{ 
                  background: 'linear-gradient(90deg, #6366f1 0%, #a855f7 100%)', 
                  height: '100%', 
                  width: `${Math.min(100, ((180 - eta) / 180) * 100)}%`,
                  transition: 'width 1s linear'
                }} 
              />
            </div>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', textAlign: 'center' }}>
              Enquanto a IA trabalha, divirta-se jogando mini-games retrô no fliperama abaixo!
            </p>
          </>
        )}
      </div>
      <MiniGame 
        visible={true} 
        isProblemReady={isProblemReady}
        userProfile={userProfile}
        onGoToExercise={() => {
          setView(VIEW.EXERCISE);
          setIsProblemReady(false);
        }}
      />
    </div>
  );
}
