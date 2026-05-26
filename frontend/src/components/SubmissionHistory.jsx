import { useState, useEffect } from 'react';
import { History, ArrowLeft, Code, Eye, Clock, CheckCircle2, XCircle } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { getSubmissionsHistory } from '../services/api';

export default function SubmissionHistory({ onBack }) {
  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal de visualização de código
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const data = await getSubmissionsHistory();
        setSubmissions(data);
      } catch (err) {
        setError("Nao foi possivel carregar o historico de submissoes. Tente novamente.");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const formatTime = (isoString) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return "agora mesmo";
      if (diffMins < 60) return `ha ${diffMins} min`;
      if (diffHours < 24) return `ha ${diffHours}h`;
      return `ha ${diffDays} dias`;
    } catch (e) {
      return "recentemente";
    }
  };

  return (
    <div className="submissions-history-view animate-fade-in" style={{ width: '100%', maxWidth: 850, margin: '0 auto 40px' }}>
      <div className="arcade-header flex items-center justify-between w-full" style={{ marginBottom: 24 }}>
        <button className="btn-secondary flex items-center gap-2" onClick={onBack}>
          <ArrowLeft size={16} />
          Voltar para o Inicio
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <History className="text-accent animate-pulse" size={24} style={{ color: '#ec4899' }} />
          <h2 style={{ margin: 0, color: '#f8fafc', fontWeight: 600 }}>Historico de Envios Global</h2>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center card" style={{ padding: 60 }}>
          <div className="spinner" style={{ width: 32, height: 32, borderColor: '#ec4899' }} />
        </div>
      ) : error ? (
        <div className="card text-center" style={{ padding: 40 }}>
          <p style={{ color: '#ef4444' }}>{error}</p>
          <button className="btn-primary" style={{ margin: '12px auto 0' }} onClick={() => window.location.reload()}>
            Tentar Novamente
          </button>
        </div>
      ) : (
        <div className="submissions-timeline" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {submissions.length === 0 ? (
            <div className="card text-center" style={{ padding: 40, color: '#64748b' }}>
              Nenhum codigo submetido ainda. Seja o primeiro a responder a um desafio!
            </div>
          ) : (
            submissions.map((sub) => {
              const allPassed = sub.all_passed || sub.score === 100;
              return (
                <div 
                  key={sub.submission_id} 
                  className="card flex items-center justify-between submission-timeline-card animate-fade-in"
                  style={{ 
                    padding: '20px', 
                    borderLeft: `4px solid ${allPassed ? '#10b981' : '#ef4444'}`,
                    background: 'rgba(30, 41, 59, 0.4)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '16px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 280 }}>
                    <div 
                      style={{ 
                        width: 40, 
                        height: 40, 
                        borderRadius: '50%', 
                        background: '#1e293b', 
                        border: `1px solid ${allPassed ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      {sub.photo_url || sub.email ? (
                        <img 
                          src={sub.photo_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${sub.uid}`} 
                          alt={sub.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <History size={16} style={{ color: '#64748b' }} />
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{sub.name || "Usuario Anonimo"}</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 'normal', color: '#64748b' }}>({sub.email})</span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: 2 }}>
                        Submeteu solucao para: <strong style={{ color: '#a855f7' }}>{sub.problem_title || "Problema de IA"}</strong>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#64748b', marginTop: 6 }}>
                        <Clock size={12} />
                        <span>{formatTime(sub.timestamp)}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexShrink: 0 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: 2 }}>Pontuacao</div>
                      <div 
                        style={{ 
                          fontSize: '1.2rem', 
                          fontWeight: 'bold', 
                          color: allPassed ? '#10b981' : '#f59e0b',
                          fontFamily: 'monospace',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        {allPassed ? (
                          <CheckCircle2 size={16} className="text-success" />
                        ) : (
                          <XCircle size={16} className="text-danger" />
                        )}
                        {sub.score}%
                      </div>
                    </div>

                    <button 
                      className="btn-secondary flex items-center gap-2"
                      style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                      onClick={() => setSelectedSubmission(sub)}
                    >
                      <Code size={14} />
                      Ver Codigo
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Modal de Código Monaco */}
      {selectedSubmission && (
        <div 
          className="arcade-gameover-overlay animate-fade-in" 
          style={{ zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
        >
          <div 
            className="card animate-fade-in" 
            style={{ 
              width: '100%', 
              maxWidth: 700, 
              background: '#090d16', 
              border: '1px solid rgba(99, 102, 241, 0.3)', 
              padding: 0, 
              overflow: 'hidden' 
            }}
          >
            <div 
              style={{ 
                padding: '16px 20px', 
                background: '#0c111e', 
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'between',
                width: '100%',
                boxSizing: 'border-box'
              }}
            >
              <div style={{ textAlign: 'left', flex: 1 }}>
                <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.05rem', fontWeight: 600 }}>
                  Codigo de {selectedSubmission.name || "Usuario"}
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                  Enviado para: {selectedSubmission.problem_title} ({selectedSubmission.score}% correto)
                </p>
              </div>
              <button 
                className="btn-secondary" 
                style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                onClick={() => setSelectedSubmission(null)}
              >
                Fechar
              </button>
            </div>
            <div style={{ height: '350px', width: '100%' }}>
              <Editor
                height="100%"
                defaultLanguage="python"
                value={selectedSubmission.code}
                theme="vs-dark"
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  fontSize: 13,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
