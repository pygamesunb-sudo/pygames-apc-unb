import React from 'react';
import './ApiSpecsView.css';
import { 

  Terminal, 
  Send, 
  Play, 
  BookOpen, 
  Copy, 
  Check, 
  Code,
  ArrowRight,
  Database,
  Shield,
  HelpCircle
} from 'lucide-react';

export default function ApiSpecsView({
  activeId,
  setActiveId,
  activeCodeTab,
  setActiveCodeTab,
  activeEp,
  tryPayloads,
  handlePayloadChange,
  handleExecute,
  loadingExec,
  resultsExec,
  handleClearResult,
  getActiveCodeSnippet,
  copiedId,
  handleCopy,
  endpointsSpec
}) {
  return (
    <div className="apidocs-specs-view animate-fade-in" style={{ width: '100%', minWidth: 0 }}>
      {/* Mobile Selector - visível apenas em telas pequenas */}
      <div className="apidocs-mobile-selector">
        <label className="label" style={{ color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <Code size={14} style={{ color: 'var(--accent-primary)' }} />
          Selecione o Endpoint da API:
        </label>
        <select
          className="select"
          value={activeId}
          onChange={(e) => setActiveId(e.target.value)}
          style={{ 
            background: 'var(--bg-card)', 
            borderColor: 'rgba(99, 102, 241, 0.4)',
            fontWeight: 600,
            fontSize: '0.9rem',
            color: 'var(--text-primary)',
            marginBottom: 16,
            width: '100%'
          }}
        >
          <optgroup label="Gerador & Problemas" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>
            {endpointsSpec.filter(e => e.tag === 'problems').map(ep => (
              <option key={ep.id} value={ep.id} style={{ background: 'var(--bg-card)' }}>
                {ep.method} {ep.path} — {ep.summary}
              </option>
            ))}
          </optgroup>
          <optgroup label="Submissões & Compilador" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>
            {endpointsSpec.filter(e => e.tag === 'submissions').map(ep => (
              <option key={ep.id} value={ep.id} style={{ background: 'var(--bg-card)' }}>
                {ep.method} {ep.path} — {ep.summary}
              </option>
            ))}
          </optgroup>
          <optgroup label="Estatísticas & Usuários" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>
            {endpointsSpec.filter(e => e.tag === 'users').map(ep => (
              <option key={ep.id} value={ep.id} style={{ background: 'var(--bg-card)' }}>
                {ep.method} {ep.path} — {ep.summary}
              </option>
            ))}
          </optgroup>
        </select>
      </div>

      {/* Card de introdução com design futurista */}
      <div className="card apidocs-intro-card animate-fade-in">
        <div className="apidocs-intro-title">
          <span style={{ color: '#6366f1', background: 'rgba(99, 102, 241, 0.1)', padding: 8, borderRadius: 8, display: 'inline-flex' }}>
            <BookOpen size={24} />
          </span>
          <h2>Especificação da API Backend</h2>
        </div>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Navegue pelos endpoints do ecossistema Pygame-APC. Todos os códigos geradores e exemplos de integração
          foram arquitetados em <strong>Python</strong> para dar suporte a automação de testes e desenvolvimento rápido.
        </p>

        <div className="apidocs-auth-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
            <Shield size={14} style={{ color: '#6366f1' }} />
            Autenticação Integrada do Usuário
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>
            Todas as requisições exigem segurança através do padrão <strong>Bearer Token</strong> (Firebase JWT). 
            Abaixo, você pode testar em tempo real; seu token da sessão do Google Chrome ativa será anexado automaticamente!
          </p>
        </div>
      </div>

      {/* Bloco de Endpoint Expandido */}
      <div className="endpoint-block endpoint-block--active animate-fade-in">
        <div className="endpoint-header">
          <div className="endpoint-identity">
            <span className={`method-badge method-badge--${activeEp.method.toLowerCase()}`}>{activeEp.method}</span>
            <span className="endpoint-path">{activeEp.path}</span>
          </div>
          <span className="endpoint-summary">{activeEp.summary}</span>
        </div>

        <div className="endpoint-details">
          {/* Coluna da Esquerda: Docs e Parâmetros */}
          <div className="endpoint-info-pane">
            <div>
              <h4 className="endpoint-section-subtitle">Descrição Geral</h4>
              <p className="endpoint-description">{activeEp.description}</p>
            </div>

            {activeEp.params.length > 0 && (
              <div>
                <h4 className="endpoint-section-subtitle">Parâmetros do Payload</h4>
                <div style={{ overflowX: 'auto' }}>
                  <table className="params-table">
                    <thead>
                      <tr>
                        <th>Campo</th>
                        <th>Tipo</th>
                        <th>Obrigatoriedade</th>
                        <th>Descrição</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeEp.params.map(p => (
                        <tr key={p.name}>
                          <td className="param-name">{p.name}</td>
                          <td><span className="param-type">{p.type}</span></td>
                          <td>
                            {p.required ? (
                              <span className="param-required">Obrigatório</span>
                            ) : (
                              <span className="param-optional">Opcional</span>
                            )}
                          </td>
                          <td style={{ color: 'var(--text-secondary)' }}>{p.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Console Interativo "Try it Out" */}
            <div className="interactive-console">
              <h4 className="endpoint-section-subtitle" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent-success)' }}>
                <Play size={12} />
                Console de Testes Interativo ("Try it out")
              </h4>

              <div className="interactive-form-grid">
                {activeEp.defaultPayload ? (
                  <div className="form-group">
                    <label className="form-input-label">
                      <Database size={12} />
                      Corpo da Requisição (JSON Payload)
                    </label>
                    <span className="form-input-desc">Edite o JSON abaixo para modificar o envio da API:</span>
                    <textarea
                      className="input form-field-textarea"
                      value={tryPayloads[activeEp.id] || ''}
                      onChange={(e) => handlePayloadChange(activeEp.id, e.target.value)}
                      placeholder='{\n  "campo": "valor"\n}'
                    />
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Este endpoint não exige corpo de requisição de envio (Payload). Utiliza apenas autenticação.
                  </p>
                )}

                <div className="action-buttons">
                  <button
                    className="btn-primary btn-execute"
                    onClick={() => handleExecute(activeEp)}
                    disabled={loadingExec[activeEp.id]}
                  >
                    {loadingExec[activeEp.id] ? (
                      <>
                        <div className="spinner" style={{ width: 14, height: 14, borderColor: '#ffffff' }} />
                        <span>Executando...</span>
                      </>
                    ) : (
                      <>
                        <Send size={14} />
                        <span>Enviar Requisição Real</span>
                      </>
                    )}
                  </button>
                  {resultsExec[activeEp.id] && (
                    <button
                      className="btn-secondary btn-cancel-try"
                      onClick={() => handleClearResult(activeEp.id)}
                    >
                      Limpar
                    </button>
                  )}
                </div>
              </div>

              {/* Exibição da Resposta Executada */}
              {resultsExec[activeEp.id] && (
                <div className="console-result-box animate-fade-in">
                  <div className="result-status-header">
                    <span>Resultado da Execução</span>
                    <span className={`status-badge ${resultsExec[activeEp.id].error ? 'status-badge--error' : 'status-badge--success'}`}>
                      {resultsExec[activeEp.id].status} {resultsExec[activeEp.id].statusText}
                    </span>
                  </div>
                  <pre className="result-body">
                    {JSON.stringify(resultsExec[activeEp.id].data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* Coluna da Direita: Snippets de Código */}
          <div className="endpoint-code-pane">
            <div>
              <h4 className="endpoint-section-subtitle">Exemplo de Implementação de Chamada</h4>
              <div className="code-tabs-header">
                <button 
                  className={`code-tab-btn python-tab ${activeCodeTab === 'python' ? 'code-tab-btn--active' : ''}`}
                  onClick={() => setActiveCodeTab('python')}
                >
                  <Code size={12} />
                  Python (requests)
                </button>
                <button 
                  className={`code-tab-btn ${activeCodeTab === 'curl' ? 'code-tab-btn--active' : ''}`}
                  onClick={() => setActiveCodeTab('curl')}
                >
                  <Terminal size={12} />
                  cURL (bash)
                </button>
                <button 
                  className={`code-tab-btn ${activeCodeTab === 'javascript' ? 'code-tab-btn--active' : ''}`}
                  onClick={() => setActiveCodeTab('javascript')}
                >
                  <ArrowRight size={12} />
                  JavaScript
                </button>
              </div>
            </div>

            {/* Visualizador de Código */}
            <div className="code-viewer-container">
              <div className="code-viewer-header">
                <span>EXEMPLO DE CÓDIGO</span>
                <button
                  className="copy-btn"
                  onClick={() => handleCopy(getActiveCodeSnippet(), activeEp.id)}
                >
                  {copiedId === activeEp.id ? (
                    <>
                      <Check size={12} style={{ color: 'var(--accent-success)' }} />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      <span>Copiar código</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="code-viewer-body">
                <code>{getActiveCodeSnippet()}</code>
              </pre>
            </div>

            {/* Nota Adicional */}
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: 12, borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255, 255, 255, 0.03)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 2 }}>
                <HelpCircle size={12} />
                Dica de Integração em Python
              </div>
              Em scripts automatizados de Python, certifique-se de realizar o login Firebase prévio para obter o ID Token de segurança temporário e enviá-lo nas chaves do dicionário de headers.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
