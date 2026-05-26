import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Code, Layers, AlignLeft } from 'lucide-react';

const MODES = [
  { id: 'blocks-assembled', label: 'Blocos Montados', icon: Layers },
  { id: 'blocks-free',      label: 'Blocos Livres',   icon: AlignLeft },
  { id: 'free-typing',      label: 'Digitacao Livre',  icon: Code },
];

/* ---------------------- Modo Blocos Montados ---------------------- */
function BlocksAssembledMode({ blocks, onCodeChange }) {
  const [orderedBlocks, setOrderedBlocks] = useState(() => blocks.map((b, i) => ({ id: i, text: b })));
  const [dragging, setDragging] = useState(null);

  const handleDragStart = (id) => setDragging(id);
  const handleDrop = (targetId) => {
    if (dragging === null || dragging === targetId) return;
    setOrderedBlocks((prev) => {
      const next = [...prev];
      const fromIdx = next.findIndex((b) => b.id === dragging);
      const toIdx   = next.findIndex((b) => b.id === targetId);
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      onCodeChange(next.map((b) => b.text).join('\n'));
      return next;
    });
    setDragging(null);
  };

  return (
    <div className="blocks-container">
      <p className="blocks-hint">Arraste os blocos para montar a solucao na ordem correta.</p>
      <div className="blocks-list">
        {orderedBlocks.map((block) => (
          <div
            key={block.id}
            className={`code-block ${dragging === block.id ? 'code-block--dragging' : ''}`}
            draggable
            onDragStart={() => handleDragStart(block.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(block.id)}
          >
            <span className="code-block-handle">::</span>
            <code className="code-block-text">{block.text}</code>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------- Modo Blocos Livres ----------------------- */
const FREE_BLOCKS = [
  'print()', 'input()', 'for i in range():', 'while True:',
  'if :', 'else:', 'def func():', 'return',
  'len()', 'int()', 'str()', 'list()', 'append()',
  'break', 'continue', '    ', '# comentario',
];

function BlocksFreeMode({ onCodeChange }) {
  const [codeLines, setCodeLines] = useState([]);

  const addBlock = (text) => {
    setCodeLines((prev) => {
      const next = [...prev, text];
      onCodeChange(next.join('\n'));
      return next;
    });
  };

  const removeLine = (idx) => {
    setCodeLines((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      onCodeChange(next.join('\n'));
      return next;
    });
  };

  return (
    <div className="blocks-free-container">
      <div className="blocks-palette">
        <p className="blocks-hint">Clique nos blocos para adicionar ao codigo.</p>
        <div className="palette-grid">
          {FREE_BLOCKS.map((b) => (
            <button key={b} className="palette-block" onClick={() => addBlock(b)}>
              <code>{b}</code>
            </button>
          ))}
        </div>
      </div>
      <div className="blocks-editor">
        <p className="blocks-hint">Seu codigo:</p>
        {codeLines.length === 0 && (
          <p className="text-muted" style={{ fontSize: '0.85rem', padding: '12px 0' }}>
            Nenhum bloco adicionado ainda.
          </p>
        )}
        {codeLines.map((line, idx) => (
          <div key={idx} className="code-block code-block--free">
            <code className="code-block-text">{line}</code>
            <button className="code-block-remove" onClick={() => removeLine(idx)}>x</button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------- Modo Digitacao Livre ---------------------- */
function FreeTypingMode({ onCodeChange }) {
  return (
    <div className="editor-container">
      <Editor
        height="380px"
        defaultLanguage="python"
        defaultValue="# Escreva sua solucao aqui\n"
        theme="vs-dark"
        options={{
          fontSize: 14,
          fontFamily: "'JetBrains Mono', monospace",
          minimap: { enabled: false },
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          padding: { top: 12, bottom: 12 },
        }}
        onChange={(value) => onCodeChange(value || '')}
      />
    </div>
  );
}

/* ---------------------- Componente Principal --------------------- */
export default function ProblemSolver({ problem, onSubmit, isSubmitting, result }) {
  const [activeMode, setActiveMode] = useState('free-typing');
  const [code, setCode] = useState('');

  const handleSubmit = () => {
    if (!code.trim()) return;
    onSubmit(code);
  };

  return (
    <div className="solver-container animate-fade-in">
      {/* Cabecalho do problema */}
      <div className="problem-header card">
        <div className="flex items-center justify-between mb-4">
          <span className={`badge badge--${problem.difficulty}`}>{problem.difficulty}</span>
          <span className="badge" style={{ background: 'rgba(34,211,238,0.1)', color: 'var(--accent-secondary)', border: '1px solid rgba(34,211,238,0.3)' }}>
            {problem.topic}
          </span>
        </div>
        <h2>{problem.title}</h2>
        <div className="divider" />
        <p className="problem-description">{problem.description}</p>
        {problem.hints?.length > 0 && (
          <details className="hints-details">
            <summary>Ver dicas</summary>
            <ul className="hints-list">
              {problem.hints.map((h, i) => <li key={i}>{h}</li>)}
            </ul>
          </details>
        )}
      </div>

      {/* Seletor de modo */}
      <div className="mode-tabs">
        {MODES.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`mode-tab ${activeMode === id ? 'mode-tab--active' : ''}`}
            onClick={() => setActiveMode(id)}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Area de resolucao */}
      <div className="card">
        {activeMode === 'blocks-assembled' && (
          <BlocksAssembledMode
            blocks={problem.solution_blocks || []}
            onCodeChange={setCode}
          />
        )}
        {activeMode === 'blocks-free' && (
          <BlocksFreeMode onCodeChange={setCode} />
        )}
        {activeMode === 'free-typing' && (
          <FreeTypingMode onCodeChange={setCode} />
        )}
      </div>

      {/* Botao de submissao */}
      <button
        className="btn-primary w-full mt-4"
        onClick={handleSubmit}
        disabled={isSubmitting || !code.trim()}
      >
        {isSubmitting ? <><span className="spinner" /> Avaliando...</> : 'Submeter Solucao'}
      </button>

      {/* Resultado */}
      {result && (
        <div className={`result-panel card mt-4 ${result.all_passed ? 'result-panel--success' : 'result-panel--partial'}`}>
          <div className="result-header">
            <span className="result-score">{result.score}/100</span>
            <span className={`result-label ${result.all_passed ? 'text-success' : 'text-danger'}`}>
              {result.all_passed ? 'Todos os testes passaram!' : `${result.results.filter(r => r.passed).length}/${result.results.length} testes passaram`}
            </span>
          </div>
          <div className="divider" />
          <div className="test-results">
            {result.results.map((r, i) => (
              <div key={i} className={`test-case ${r.passed ? 'test-case--pass' : 'test-case--fail'}`}>
                <div className="test-case-header">
                  <span className="test-case-status">{r.passed ? 'Passou' : 'Falhou'} - Caso {i + 1}</span>
                </div>
                <div className="test-case-body">
                  <div><span className="label">Entrada:</span><code>{r.input}</code></div>
                  <div><span className="label">Esperado:</span><code>{r.expected_output}</code></div>
                  <div><span className="label">Obtido:</span><code className={!r.passed ? 'text-danger' : ''}>{r.actual_output || '(vazio)'}</code></div>
                  {r.error && <div><span className="label text-danger">Erro:</span><code className="text-danger">{r.error}</code></div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
