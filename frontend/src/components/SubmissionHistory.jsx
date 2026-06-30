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
                  className={`card submission-timeline-card animate-fade-in ${allPassed ? 'submission-card--passed' : 'submission-card--failed'}`}
                >
                  <div className="submission-card-header">
                    <div 
                      className="submission-user-avatar"
                      style={{ 
                        border: `1px solid ${allPassed ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`
                      }}
                    >
                      {sub.photo_url || sub.email ? (
                        <img 
                          src={sub.photo_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${sub.uid}`} 
                          alt={sub.name}
                          className="submission-user-img"
                        />
                      ) : (
                        <History size={16} style={{ color: '#64748b' }} />
                      )}
                    </div>
                    <div className="submission-user-info">
                      <div className="submission-user-name-row">
                        <span className="submission-player-name">{sub.name || "Usuario Anonimo"}</span>
                        <span className="submission-player-email">({sub.email})</span>
                      </div>
                      <div className="submission-problem-title">
                        Submeteu solucao para: <strong style={{ color: '#a855f7' }}>{sub.problem_title || "Problema de IA"}</strong>
                      </div>
                      <div className="submission-time-row">
                        <Clock size={12} />
                        <span>{formatTime(sub.timestamp)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="submission-card-actions">
                    <div className="submission-score-block">
                      <div className="submission-score-label">Pontuacao</div>
                      <div 
                        className="submission-score-value"
                        style={{ 
                          color: allPassed ? '#10b981' : '#f59e0b'
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
                      className="btn-secondary flex items-center gap-2 submission-view-code-btn"
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
          className="arcade-gameover-overlay submission-modal-overlay animate-fade-in" 
        >
          <div 
            className="card submission-code-modal animate-fade-in" 
          >
            <div 
              className="submission-modal-header"
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
            <div className="submission-modal-editor-container">
              <Editor
                height="400px"
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
