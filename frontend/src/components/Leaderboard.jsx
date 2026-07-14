import { useState, useEffect } from 'react';
import { Trophy, Gamepad, Award, Terminal, ArrowLeft } from 'lucide-react';
import { getLeaderboard } from '../services/api';
import './Leaderboard.css';


export default function Leaderboard({ onBack }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const data = await getLeaderboard();
        setLeaderboard(data);
      } catch (err) {
        setError("Nao foi possivel carregar o ranking global. Tente novamente.");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="leaderboard-view animate-fade-in" style={{ width: '100%', maxWidth: 900, margin: '0 auto 40px' }}>
      <div className="arcade-header flex items-center justify-between w-full" style={{ marginBottom: 24 }}>
        <button className="btn-secondary flex items-center gap-2" onClick={onBack}>
          <ArrowLeft size={16} />
          Voltar para o Inicio
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Trophy className="text-accent animate-pulse" size={24} style={{ color: '#f59e0b' }} />
          <h2 style={{ margin: 0, color: '#f8fafc', fontWeight: 600 }}>Placar de Lideres Global</h2>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center card" style={{ padding: 60 }}>
          <div className="spinner" style={{ width: 32, height: 32, borderColor: '#6366f1' }} />
        </div>
      ) : error ? (
        <div className="card text-center" style={{ padding: 40 }}>
          <p style={{ color: '#ef4444' }}>{error}</p>
          <button className="btn-primary" style={{ margin: '12px auto 0' }} onClick={() => window.location.reload()}>
            Tentar Novamente
          </button>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
          {/* Visualizacao Desktop (Tabela) */}
          <div className="table-wrapper hide-on-mobile" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 600 }}>
              <thead>
                <tr style={{ background: 'rgba(30, 41, 59, 0.5)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <th style={{ padding: '16px 20px', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>Posicao</th>
                  <th style={{ padding: '16px 20px', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>Jogador</th>
                  <th style={{ padding: '16px 20px', color: '#a855f7', fontSize: '0.85rem', fontWeight: 600, textAlign: 'center' }}>Pontos Totais</th>
                  <th style={{ padding: '16px 20px', color: '#3b82f6', fontSize: '0.85rem', fontWeight: 600, textAlign: 'center' }}>Doodle Ninja</th>
                  <th style={{ padding: '16px 20px', color: '#10b981', fontSize: '0.85rem', fontWeight: 600, textAlign: 'center' }}>Snake.py</th>
                  <th style={{ padding: '16px 20px', color: '#f59e0b', fontSize: '0.85rem', fontWeight: 600, textAlign: 'center' }}>Bug Invaders</th>
                  <th style={{ padding: '16px 20px', color: '#ec4899', fontSize: '0.85rem', fontWeight: 600, textAlign: 'center' }}>Programacao (XP)</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>
                      Nenhum jogador registrado ainda. Seja o primeiro a pontuar!
                    </td>
                  </tr>
                ) : (
                  leaderboard.map((player, idx) => {
                    const isTop1 = idx === 0;
                    const isTop2 = idx === 1;
                    const isTop3 = idx === 2;
                    
                    let posBg = 'transparent';
                    let posColor = '#94a3b8';
                    if (isTop1) { posBg = 'rgba(245, 158, 11, 0.15)'; posColor = '#f59e0b'; }
                    else if (isTop2) { posBg = 'rgba(148, 163, 184, 0.15)'; posColor = '#cbd5e1'; }
                    else if (isTop3) { posBg = 'rgba(180, 83, 9, 0.15)'; posColor = '#d97706'; }

                    return (
                      <tr 
                        key={player.uid} 
                        className="leaderboard-row"
                        style={{ 
                          borderBottom: '1px solid rgba(255,255,255,0.03)', 
                          background: isTop1 ? 'rgba(99, 102, 241, 0.03)' : 'transparent',
                          transition: 'background 0.2s'
                        }}
                      >
                        <td style={{ padding: '16px 20px' }}>
                          <span 
                            style={{ 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              width: 28, 
                              height: 28, 
                              borderRadius: '50%', 
                              background: posBg, 
                              color: posColor,
                              fontWeight: 'bold',
                              fontSize: '0.85rem',
                              border: isTop1 || isTop2 || isTop3 ? `1px solid ${posColor}` : 'none'
                            }}
                          >
                            {idx + 1}
                          </span>
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div 
                              style={{ 
                                width: 32, 
                                height: 32, 
                                borderRadius: '50%', 
                                background: '#1e293b', 
                                border: '1px solid rgba(99,102,241,0.3)',
                                overflow: 'hidden',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              {player.photo_url || player.email ? (
                                <img 
                                  src={player.photo_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${player.uid}`} 
                                  alt={player.name}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                              ) : (
                                <Trophy size={14} style={{ color: '#64748b' }} />
                              )}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.9rem' }}>
                                {player.name || "Usuario Anonimo"}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                {player.email ? player.email.substring(0, 18) + '...' : ''}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'center', fontWeight: 'bold', color: '#a855f7', fontSize: '1rem' }}>
                          {player.total_score || 0}
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'center', color: '#f8fafc', fontSize: '0.85rem' }}>
                          {player.games?.doodle || 0}
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'center', color: '#f8fafc', fontSize: '0.85rem' }}>
                          {player.games?.snake || 0}
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'center', color: '#f8fafc', fontSize: '0.85rem' }}>
                          {player.games?.invaders || 0}
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'center', color: '#ec4899', fontSize: '0.85rem', fontWeight: 600 }}>
                          {player.coding_points || 0} XP
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Visualizacao Mobile (Cards de Lideres) */}
          <div className="leaderboard-mobile-list show-on-mobile">
            {leaderboard.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#cbd5e1' }}>
                Nenhum jogador registrado ainda. Seja o primeiro a pontuar!
              </div>
            ) : (
              leaderboard.map((player, idx) => {
                const isTop1 = idx === 0;
                const isTop2 = idx === 1;
                const isTop3 = idx === 2;
                
                let posBg = 'transparent';
                let posColor = '#94a3b8';
                if (isTop1) { posBg = 'rgba(245, 158, 11, 0.15)'; posColor = '#f59e0b'; }
                else if (isTop2) { posBg = 'rgba(148, 163, 184, 0.15)'; posColor = '#cbd5e1'; }
                else if (isTop3) { posBg = 'rgba(180, 83, 9, 0.15)'; posColor = '#d97706'; }

                return (
                  <div 
                    key={player.uid} 
                    className="leaderboard-mobile-card"
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      padding: '16px',
                      background: isTop1 ? 'rgba(99, 102, 241, 0.03)' : 'transparent',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span 
                          style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            width: 26, 
                            height: 26, 
                            borderRadius: '50%', 
                            background: posBg, 
                            color: posColor,
                            fontWeight: 'bold',
                            fontSize: '0.8rem',
                            border: isTop1 || isTop2 || isTop3 ? `1px solid ${posColor}` : 'none'
                          }}
                        >
                          {idx + 1}
                        </span>
                        <div 
                          style={{ 
                            width: 32, 
                            height: 32, 
                            borderRadius: '50%', 
                            background: '#1e293b', 
                            border: '1px solid rgba(99, 102, 241, 0.3)',
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <img 
                            src={player.photo_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${player.uid}`} 
                            alt={player.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.88rem' }}>
                            {player.name || "Usuario Anonimo"}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                            {player.email ? player.email.substring(0, 18) + '...' : ''}
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total</div>
                        <div style={{ fontWeight: 'bold', color: '#a855f7', fontSize: '1.1rem' }}>
                          {player.total_score || 0}
                        </div>
                      </div>
                    </div>
                    {/* Grid de Sub-pontuacoes */}
                    <div className="leaderboard-mobile-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', padding: '8px 10px', background: 'rgba(15, 23, 42, 0.3)', borderRadius: '6px' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.6rem', color: '#64748b' }}>Doodle</div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#f8fafc' }}>{player.games?.doodle || 0}</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.6rem', color: '#64748b' }}>Snake</div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#f8fafc' }}>{player.games?.snake || 0}</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.6rem', color: '#64748b' }}>Bug Inv.</div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#f8fafc' }}>{player.games?.invaders || 0}</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.6rem', color: '#64748b' }}>Prog (XP)</div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#ec4899' }}>{player.coding_points || 0}</div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
