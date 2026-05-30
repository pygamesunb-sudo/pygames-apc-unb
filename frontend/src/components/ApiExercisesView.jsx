import React, { useState } from 'react';
import { 
  Award, 
  Check, 
  Code, 
  Trophy, 
  Play 
} from 'lucide-react';
import Editor from '@monaco-editor/react';
import { API_EXERCISES } from '../services/apiExercisesData';

export default function ApiExercisesView({
  solvedExercises,
  activeExTopic,
  setActiveExTopic,
  exAnswers,
  handleAnswerChange,
  exFeedbacks,
  verifyQuizExercise,
  currentUser,
  exerciseTopics
}) {
  const [evaluatingExId, setEvaluatingExId] = useState(null);

  // Calcula o total resolvido de todos os 40
  const completedCount = Object.keys(solvedExercises).filter(k => solvedExercises[k]).length;

  const handleSubmissao = (ex) => {
    setEvaluatingExId(ex.id);
    // Adiciona um pequeno atraso de 300ms para simular a compilação retro-arcade
    setTimeout(() => {
      verifyQuizExercise(ex);
      setEvaluatingExId(null);
    }, 400);
  };

  return (
    <div className="api-exercises-container animate-fade-in" style={{ width: '100%' }}>
      
      {/* Grid de Seletor de Tópicos (8 Tópicos) */}
      <div className="exercise-topics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 24 }}>
        {exerciseTopics.map(topic => {
          const topicExercises = API_EXERCISES[topic.id] || [];
          const solvedInTopic = topicExercises.filter(ex => solvedExercises[ex.id]).length;
          const isTopicCompleted = solvedInTopic === 5;
          
          return (
            <button
              key={topic.id}
              className={`btn-topic-selector ${activeExTopic === topic.id ? 'btn-topic-selector--active' : ''} ${isTopicCompleted ? 'btn-topic-selector--completed' : ''}`}
              onClick={() => setActiveExTopic(topic.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                background: activeExTopic === topic.id 
                  ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(99, 102, 241, 0.1) 100%)' 
                  : 'var(--bg-card)',
                border: activeExTopic === topic.id 
                  ? '1px solid var(--accent-primary)' 
                  : '1px solid rgba(255, 255, 255, 0.05)',
                color: 'var(--text-primary)',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', marginBottom: 6 }}>
                {isTopicCompleted ? (
                  <Check size={16} style={{ color: 'var(--accent-success)' }} />
                ) : (
                  <Code size={16} style={{ color: activeExTopic === topic.id ? 'var(--accent-primary)' : 'var(--text-muted)' }} />
                )}
                <span style={{ fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {topic.label}
                </span>
              </div>
              <span style={{ fontSize: '0.75rem', color: isTopicCompleted ? 'var(--accent-success)' : 'var(--text-secondary)' }}>
                {solvedInTopic} de 5 concluídos ({solvedInTopic * 50} XP)
              </span>
            </button>
          );
        })}
      </div>

      {/* Painel de Progresso Geral */}
      <div className="exercise-progress-panel">
        <div className="progress-header">
          <span style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
            <Award size={18} style={{ color: '#eab308' }} />
            Progresso Geral nos Exercícios de Programação API
          </span>
          <span style={{ color: '#10b981', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
            {completedCount * 50} / 2000 XP
          </span>
        </div>
        <div className="progress-bar-bg">
          <div 
            className="progress-bar-fill" 
            style={{ width: `${(completedCount / 40) * 100}%` }}
          />
        </div>
        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Cada desafio de programação correto garante <strong>50 XP</strong> em tempo real ao seu perfil! Submeta códigos que passem nos testes unitários e desbloqueie seu certificado.
        </p>
      </div>

      {/* Certificado de Proficiência Retro Gold - Abre quando todos os 40/40 são resolvidos */}
      {completedCount === 40 && (
        <div className="certificate-card card animate-fade-in" style={{ border: '2px solid #eab308', background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.08) 0%, rgba(0, 0, 0, 0.4) 100%)', textAlign: 'center', padding: '40px 24px', position: 'relative', marginTop: 24, marginBottom: 24 }}>
          <div className="certificate-seal" style={{ fontSize: '2rem', color: '#eab308', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #eab308', borderRadius: '50%', width: 70, height: 70, margin: '0 auto 16px', background: 'rgba(234, 179, 8, 0.1)' }}>
            <Trophy size={36} />
          </div>
          <h2 className="certificate-title" style={{ color: '#eab308', fontFamily: 'var(--font-heading)', fontSize: '1.8rem', letterSpacing: '1px', marginBottom: 16 }}>
            Certificado de API Integrator
          </h2>
          <p className="certificate-text" style={{ fontSize: '1rem', lineHeight: '1.6', color: 'var(--text-primary)', maxWidth: '700px', margin: '0 auto 24px' }}>
            Certificamos com distinção que o jogador <strong>{currentUser?.displayName || 'Desenvolvedor APC'}</strong> concluiu com sucesso todos os <strong>40 desafios de integração e validação da API</strong> em <strong>Python</strong> do ecossistema <strong>Pygame-APC</strong>, demonstrando excelente proficiência em requisições seguras, manipulação de payloads JSON e automação de testes.
          </p>
          <div style={{ display: 'inline-block', background: 'rgba(234, 179, 8, 0.15)', border: '1px solid #eab308', color: '#eab308', padding: '6px 16px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 }}>
            Conquistou +2000 XP Globais
          </div>
        </div>
      )}

      {/* Cartões dos 5 Exercícios do Tópico Ativo */}
      <div className="exercises-list-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {(API_EXERCISES[activeExTopic] || []).map((ex) => {
          const isSolved = !!solvedExercises[ex.id];
          const feedback = exFeedbacks[ex.id];
          const isCurrentlyEvaluating = evaluatingExId === ex.id;
          
          return (
            <div 
              key={ex.id} 
              className={`api-exercise-card card ${isSolved ? 'api-exercise-card--completed' : ''}`}
              style={isSolved ? { borderColor: 'var(--accent-success)', boxShadow: '0 0 15px rgba(16, 185, 129, 0.08)' } : {}}
            >
              <div className="exercise-title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 className="exercise-title" style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>
                  {isSolved ? (
                    <Check size={18} style={{ color: 'var(--accent-success)' }} />
                  ) : (
                    <Code size={18} style={{ color: 'var(--accent-primary)' }} />
                  )}
                  {ex.title}
                </h3>
                <span className="exercise-points" style={{ 
                  background: isSolved ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                  border: isSolved ? '1px solid var(--accent-success)' : '1px solid var(--accent-primary)',
                  color: isSolved ? 'var(--accent-success)' : 'var(--text-primary)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '12px'
                }}>
                  {isSolved ? 'CONCLUÍDO' : '50 XP'}
                </span>
              </div>
              
              <p className="exercise-desc" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
                {ex.desc}
              </p>

              {/* Tabela de Exemplos de Entrada e Saída (Slice de 2 Casos de Teste) */}
              <div className="examples-section" style={{ marginBottom: 16 }}>
                <h4 className="examples-title" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>
                  Exemplos de Chamada
                </h4>
                <table className="examples-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', textAlign: 'left' }}>
                      <th style={{ padding: '6px 10px', color: 'var(--text-muted)', fontWeight: 600 }}>Parâmetros de Entrada</th>
                      <th style={{ padding: '6px 10px', color: 'var(--text-muted)', fontWeight: 600 }}>Retorno Esperado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ex.testCases.slice(0, 2).map((tc, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '8px 10px' }}>
                          <pre style={{ margin: 0, background: 'rgba(0,0,0,0.2)', padding: '4px 8px', borderRadius: 4, fontFamily: 'var(--font-mono)', color: 'var(--accent-secondary)' }}>{tc.inputStr}</pre>
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          <pre style={{ margin: 0, background: 'rgba(0,0,0,0.2)', padding: '4px 8px', borderRadius: 4, fontFamily: 'var(--font-mono)', color: 'var(--accent-success)' }}>{tc.expectedStr}</pre>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Editor Monaco Integrado */}
              <div className="editor-container" style={{ border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', marginBottom: 16 }}>
                <Editor
                  height="160px"
                  defaultLanguage="python"
                  value={exAnswers[ex.id] !== undefined ? exAnswers[ex.id] : (ex.initialCode || '# Escreva seu código aqui\n')}
                  theme="vs-dark"
                  options={{
                    fontSize: 13,
                    fontFamily: "'JetBrains Mono', monospace",
                    minimap: { enabled: false },
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    readOnly: isSolved,
                    padding: { top: 8, bottom: 8 },
                  }}
                  onChange={(val) => handleAnswerChange(ex.id, val || '')}
                />
              </div>

              {/* Botão de Validação Sandbox */}
              {!isSolved && (
                <button 
                  className="btn-primary" 
                  onClick={() => handleSubmissao(ex)}
                  disabled={isCurrentlyEvaluating}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: '0.85rem', width: 'fit-content' }}
                >
                  {isCurrentlyEvaluating ? (
                    <>
                      <div className="spinner" style={{ width: 14, height: 14, borderColor: '#ffffff' }} />
                      <span>Compilando...</span>
                    </>
                  ) : (
                    <>
                      <Play size={14} />
                      <span>Submeter Código</span>
                    </>
                  )}
                </button>
              )}

              {/* Console de Resultados dos Unit Tests - Exibição no mesmo estilo do ProblemSolver */}
              {feedback && (
                <div className={`result-panel card mt-3 ${feedback.success ? 'result-panel--success' : 'result-panel--partial'}`} style={{ marginTop: 16, padding: 16, border: feedback.success ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(244, 63, 94, 0.3)' }}>
                  <div className="result-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span className="result-score" style={{ fontWeight: 700, fontSize: '1rem', color: feedback.success ? 'var(--accent-success)' : '#f43f5e' }}>
                      {feedback.success ? '100/100' : `${feedback.results ? feedback.results.filter(r => r.passed).length : 0}/3 Casos Passed`}
                    </span>
                    <span className={`result-label ${feedback.success ? 'text-success' : 'text-danger'}`} style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                      {feedback.success ? 'Parabéns! Todos os testes unitários passaram!' : 'Alguns testes falharam ou erro de compilação.'}
                    </span>
                  </div>
                  <div className="divider" style={{ height: 1, background: 'rgba(255,255,255,0.05)', marginBottom: 12 }} />
                  
                  {feedback.runtimeError && (
                    <div style={{ color: '#f43f5e', background: 'rgba(244, 63, 94, 0.08)', padding: 12, borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: '0.8rem', border: '1px solid rgba(244, 63, 94, 0.2)' }}>
                      <strong>Erro de Compilação / Sintaxe:</strong>
                      <pre style={{ margin: '6px 0 0 0', whiteSpace: 'pre-wrap', color: '#f43f5e' }}>{feedback.runtimeError}</pre>
                    </div>
                  )}

                  {feedback.results && feedback.results.length > 0 && (
                    <div className="test-results" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {feedback.results.map((r, i) => (
                        <div 
                          key={r.id} 
                          className={`test-case ${r.passed ? 'test-case--pass' : 'test-case--fail'}`}
                          style={{
                            padding: 10,
                            borderRadius: 'var(--radius-sm)',
                            background: r.passed ? 'rgba(16, 185, 129, 0.04)' : 'rgba(244, 63, 94, 0.04)',
                            border: r.passed ? '1px solid rgba(16, 185, 129, 0.15)' : '1px solid rgba(244, 63, 94, 0.15)',
                            fontSize: '0.8rem'
                          }}
                        >
                          <div className="test-case-header" style={{ fontWeight: 700, color: r.passed ? 'var(--accent-success)' : '#f43f5e', marginBottom: 6 }}>
                            {r.passed ? '✓ Passou' : '✗ Falhou'} — Caso de Teste {i + 1}
                          </div>
                          <div className="test-case-body" style={{ display: 'flex', flexDirection: 'column', gap: 4, fontFamily: 'var(--font-mono)' }}>
                            <div><span style={{ color: 'var(--text-muted)', marginRight: 6 }}>Entrada:</span><code>{r.input}</code></div>
                            <div><span style={{ color: 'var(--text-muted)', marginRight: 6 }}>Esperado:</span><code>{r.expected}</code></div>
                            <div><span style={{ color: 'var(--text-muted)', marginRight: 6 }}>Obtido:</span><code className={!r.passed ? 'text-danger' : ''} style={!r.passed ? { color: '#f43f5e' } : {}}>{r.actual}</code></div>
                            {r.error && <div style={{ color: '#f43f5e', marginTop: 2 }}><span>Erro:</span><code>{r.error}</code></div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
