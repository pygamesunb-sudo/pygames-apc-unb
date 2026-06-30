import React, { useState } from 'react';
import { 
  Trophy, 
  BookOpen, 
  Search,
  Code,
  GraduationCap
} from 'lucide-react';
import api from '../services/api';
import { API_EXERCISES } from '../services/apiExercisesData';
import { ENDPOINTS_SPEC, EXERCISE_TOPICS } from '../services/apiDocsData';
import ApiSpecsView from '../components/ApiSpecsView';
import ApiExercisesView from '../components/ApiExercisesView';
import ApiAcademicView from '../components/ApiAcademicView';
import './ApiDocs.css';

export default function ApiDocs({ currentUser, userProfile, setUserProfile }) {
  const [activeMainTab, setActiveMainTab] = useState('specs');
  const [searchTerm, setSearchTerm] = useState('');

  // Estados de Controle dos Exercícios Interativos (Vale 50 XP por questão de programação)
  const [solvedExercises, setSolvedExercises] = useState(() => {
    const saved = localStorage.getItem('solved_api_exercises');
    return saved ? JSON.parse(saved) : {};
  });

  const [activeExTopic, setActiveExTopic] = useState('gen-problem');
  const [exAnswers, setExAnswers] = useState({});
  const [exFeedbacks, setExFeedbacks] = useState({});

  const handleAnswerChange = (exId, value) => {
    setExAnswers(prev => ({
      ...prev,
      [exId]: value
    }));
  };

  // Transpilação e Execução de Sandbox Python -> JS no navegador!
  const verifyQuizExercise = (ex) => {
    let allPassed = true;
    const results = [];
    let runtimeError = null;

    try {
      const codeValue = exAnswers[ex.id] !== undefined ? exAnswers[ex.id] : ex.initialCode || '';
      let jsCode = codeValue;
      
      // 1. Limpa comentários
      jsCode = jsCode.replace(/#[^\n]*/g, '');
      
      // 2. Transpilação linha por linha respeitando indentações e colons do Python
      const lines = jsCode.split('\n');
      const transpiledLines = [];
      const indentLevels = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        if (!trimmed) {
          transpiledLines.push('');
          continue;
        }
        
        const indentMatch = line.match(/^(\s*)/);
        const indent = indentMatch ? indentMatch[1].length : 0;
        
        // Fecha blocos em JavaScript quando o recuo diminui
        while (indentLevels.length > 0 && indent < indentLevels[indentLevels.length - 1]) {
          indentLevels.pop();
          transpiledLines.push(' '.repeat(indent) + '}');
        }
        
        let processed = trimmed;
        
        // Assinaturas de funções
        if (processed.startsWith('def ')) {
          processed = processed.replace(/^def\s+(\w+)\s*\(([^)]*)\)\s*:/, 'function $1($2) {');
          indentLevels.push(indent + 4);
        }
        // Condicionais e loops
        else if (processed.startsWith('if ') && processed.endsWith(':')) {
          processed = 'if (' + processed.slice(3, -1).trim() + ') {';
          indentLevels.push(indent + 4);
        }
        else if (processed.startsWith('elif ') && processed.endsWith(':')) {
          processed = 'else if (' + processed.slice(5, -1).trim() + ') {';
          indentLevels.push(indent + 4);
        }
        else if (processed.startsWith('else') && processed.endsWith(':')) {
          processed = 'else {';
          indentLevels.push(indent + 4);
        }
        else if (processed.startsWith('for ') && processed.endsWith(':')) {
          const forMatch = processed.match(/^for\s+(\w+)\s+in\s+([^:]+):/);
          if (forMatch) {
            processed = `for (let ${forMatch[1]} of ${forMatch[2]}) {`;
          } else {
            processed = processed.replace(/^for\s+([^:]+):/, 'for ($1) {');
          }
          indentLevels.push(indent + 4);
        }
        
        // Substitutos de valores e operadores Python
        processed = processed.replace(/\bTrue\b/g, 'true');
        processed = processed.replace(/\bFalse\b/g, 'false');
        processed = processed.replace(/\bNone\b/g, 'null');
        processed = processed.replace(/\band\b/g, '&&');
        processed = processed.replace(/\bor\b/g, '||');
        processed = processed.replace(/\bnot\b/g, '!');
        processed = processed.replace(/len\(([^)]+)\)/g, '($1).length');
        processed = processed.replace(/\.append\(([^)]+)\)/g, '.push($1)');
        
        // f-strings
        processed = processed.replace(/f"([^"\\]*(?:\\.[^"\\]*)*)\{([^}]+)\}([^"\\]*(?:\\.[^"\\]*)*)"/g, '`$1\${$2}$3`');
        processed = processed.replace(/f'([^'\\]*(?:\\.[^'\\]*)*)\{([^}]+)\}([^'\\]*(?:\\.[^'\\]*)*)'/g, '`$1\${$2}$3`');
        
        transpiledLines.push(' '.repeat(indent) + processed);
      }

      // Fecha chaves restantes
      while (indentLevels.length > 0) {
        indentLevels.pop();
        transpiledLines.push('}');
      }

      const finalJsCode = transpiledLines.join('\n');
      
      // Cria instância da função transpilada do usuário dinamicamente
      const userFunction = new Function(finalJsCode + `; return ${ex.functionName};`)();

      // Roda a validação de todos os casos de teste contra o sandbox do usuário
      ex.testCases.forEach((tc, idx) => {
        try {
          const args = JSON.parse(JSON.stringify(tc.input));
          const resultVal = userFunction(...args);
          
          const resultStr = JSON.stringify(resultVal);
          const expectedStr = JSON.stringify(tc.expected);
          const passed = resultStr === expectedStr;
          
          if (!passed) {
            allPassed = false;
          }
          
          results.push({
            id: idx,
            input: tc.inputStr,
            expected: tc.expectedStr,
            actual: resultVal === undefined ? 'None' : (typeof resultVal === 'object' ? JSON.stringify(resultVal) : String(resultVal)),
            passed
          });
        } catch (tcErr) {
          allPassed = false;
          results.push({
            id: idx,
            input: tc.inputStr,
            expected: tc.expectedStr,
            actual: 'Erro na chamada',
            error: tcErr.message,
            passed: false
          });
        }
      });
    } catch (compileErr) {
      allPassed = false;
      runtimeError = compileErr.message;
    }

    setExFeedbacks(prev => ({
      ...prev,
      [ex.id]: {
        success: allPassed,
        results,
        runtimeError,
        msg: allPassed 
          ? 'Excelente! Seu código passou em todos os testes unitários! +50 XP adicionados.' 
          : 'Alguns testes falharam ou houve erro de compilação. Inspecione os resultados abaixo e tente novamente!'
      }
    }));

    if (allPassed && !solvedExercises[ex.id]) {
      const newSolved = { ...solvedExercises, [ex.id]: true };
      setSolvedExercises(newSolved);
      localStorage.setItem('solved_api_exercises', JSON.stringify(newSolved));

      // Sincroniza com o backend para registrar no Firestore e Placar de Líderes!
      api.post('/api/users/exercise', { exercise_id: ex.id })
        .then(response => {
          const data = response.data;
          if (setUserProfile && data.profile) {
            setUserProfile(data.profile);
          }
        })
        .catch(err => {
          console.error("Erro ao sincronizar exercicio com o backend:", err);
          if (setUserProfile) {
            setUserProfile(prev => {
              if (!prev) return prev;
              return {
                ...prev,
                total_score: (prev.total_score || 0) + 50
              };
            });
          }
        });
    }

  };

  const [activeId, setActiveId] = useState('gen-problem');
  const [activeCodeTab, setActiveCodeTab] = useState('python'); // Default is 'python'
  const [copiedId, setCopiedId] = useState(null);
  
  // Estados para inputs do Try It Out
  const [tryPayloads, setTryPayloads] = useState(() => {
    const initial = {};
    ENDPOINTS_SPEC.forEach(ep => {
      if (ep.defaultPayload) {
        initial[ep.id] = JSON.stringify(ep.defaultPayload, null, 2);
      }
    });
    return initial;
  });

  // Estados para resultados de execução da API
  const [loadingExec, setLoadingExec] = useState({});
  const [resultsExec, setResultsExec] = useState({});

  const apiBaseUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? window.location.origin : 'http://localhost:8000');

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handlePayloadChange = (epId, value) => {
    setTryPayloads(prev => ({
      ...prev,
      [epId]: value
    }));
  };

  // Executa chamadas reais contra o backend usando a instância de Axios 'api' já autenticada!
  const handleExecute = async (ep) => {
    setLoadingExec(prev => ({ ...prev, [ep.id]: true }));
    setResultsExec(prev => ({ ...prev, [ep.id]: null }));

    try {
      let response;
      let parsedPayload = null;

      if (ep.defaultPayload) {
        try {
          parsedPayload = JSON.parse(tryPayloads[ep.id] || '{}');
        } catch (jsonErr) {
          throw new Error(`JSON Inválido: ${jsonErr.message}`);
        }
      }

      if (ep.method === 'GET') {
        response = await api.get(ep.path);
      } else if (ep.method === 'POST') {
        response = await api.post(ep.path, parsedPayload);
      }

      setResultsExec(prev => ({
        ...prev,
        [ep.id]: {
          status: response.status || 200,
          statusText: response.statusText || 'OK',
          data: response.data,
          headers: response.headers || {}
        }
      }));
    } catch (err) {
      console.error("Erro na execução da documentação da API:", err);
      const errResponse = err.response;
      setResultsExec(prev => ({
        ...prev,
        [ep.id]: {
          status: errResponse?.status || 500,
          statusText: errResponse?.statusText || 'Erro na requisição',
          data: errResponse?.data || err.message,
          error: true
        }
      }));
    } finally {
      setLoadingExec(prev => ({ ...prev, [ep.id]: false }));
    }
  };

  const handleClearResult = (epId) => {
    setResultsExec(prev => ({ ...prev, [epId]: null }));
  };

  // Filtragem inteligente de endpoints baseada em busca por texto
  const filteredEndpoints = ENDPOINTS_SPEC.filter(ep => 
    ep.path.toLowerCase().includes(searchTerm.toLowerCase()) || 
    ep.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ep.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeEp = ENDPOINTS_SPEC.find(ep => ep.id === activeId) || ENDPOINTS_SPEC[0];

  let currentPayloadValue = tryPayloads[activeEp.id] || '';
  let parsedPayloadSafe = {};
  try {
    parsedPayloadSafe = JSON.parse(currentPayloadValue);
  } catch (e) {
    parsedPayloadSafe = activeEp.defaultPayload || {};
  }

  // Gera o código a ser exibido baseado na aba ativa
  const getActiveCodeSnippet = () => {
    if (activeCodeTab === 'python') {
      return activeEp.pythonSnippet(apiBaseUrl, parsedPayloadSafe);
    } else if (activeCodeTab === 'curl') {
      return activeEp.curlSnippet(apiBaseUrl, parsedPayloadSafe);
    } else {
      return activeEp.jsSnippet(apiBaseUrl, parsedPayloadSafe);
    }
  };

  const completedCount = Object.keys(solvedExercises).filter(k => solvedExercises[k]).length;

  return (
    <div 
      className="apidocs-layout animate-fade-in"
      style={(activeMainTab === 'exercises' || activeMainTab === 'academic') ? { gridTemplateColumns: '1fr' } : {}}
    >
      {activeMainTab === 'specs' && (
        <aside className="apidocs-sidebar">
          <div className="apidocs-sidebar-header">
            <h3>Pygame-APC API</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Documentação Interativa de Rotas
            </p>
          </div>

          <div className="apidocs-search">
            <Search size={14} className="apidocs-search-icon" />
            <input 
              type="text" 
              placeholder="Filtrar rotas..." 
              className="apidocs-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <nav className="apidocs-sidebar-nav">
            {/* Categoria Problems */}
            <div className="apidocs-nav-section">
              <span className="apidocs-section-title">Gerador & Problemas</span>
              {filteredEndpoints.filter(e => e.tag === 'problems').map(ep => (
                <button
                  key={ep.id}
                  className={`apidocs-nav-item ${activeId === ep.id ? 'apidocs-nav-item--active' : ''}`}
                  onClick={() => setActiveId(ep.id)}
                >
                  <span className={`method-badge method-badge--${ep.method.toLowerCase()}`}>{ep.method}</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ep.path}</span>
                </button>
              ))}
            </div>

            {/* Categoria Submissions */}
            <div className="apidocs-nav-section">
              <span className="apidocs-section-title">Submissões & Compilador</span>
              {filteredEndpoints.filter(e => e.tag === 'submissions').map(ep => (
                <button
                  key={ep.id}
                  className={`apidocs-nav-item ${activeId === ep.id ? 'apidocs-nav-item--active' : ''}`}
                  onClick={() => setActiveId(ep.id)}
                >
                  <span className={`method-badge method-badge--${ep.method.toLowerCase()}`}>{ep.method}</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ep.path}</span>
                </button>
              ))}
            </div>

            {/* Categoria Users */}
            <div className="apidocs-nav-section">
              <span className="apidocs-section-title">Estatísticas & Usuários</span>
              {filteredEndpoints.filter(e => e.tag === 'users').map(ep => (
                <button
                  key={ep.id}
                  className={`apidocs-nav-item ${activeId === ep.id ? 'apidocs-nav-item--active' : ''}`}
                  onClick={() => setActiveId(ep.id)}
                >
                  <span className={`method-badge method-badge--${ep.method.toLowerCase()}`}>{ep.method}</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ep.path}</span>
                </button>
              ))}
            </div>
          </nav>
        </aside>
      )}

      {/* Painel Principal de Detalhes */}
      <section className="apidocs-content" style={(activeMainTab === 'exercises' || activeMainTab === 'academic') ? { width: '100%' } : {}}>
        {/* Abas de Navegação Principal */}
        <div className="apidocs-main-tabs">
          <button
            className={`main-tab-btn ${activeMainTab === 'specs' ? 'main-tab-btn--active' : ''}`}
            onClick={() => setActiveMainTab('specs')}
          >
            <BookOpen size={16} />
            Especificação de Rotas (API Docs)
          </button>
          <button
            className={`main-tab-btn ${activeMainTab === 'exercises' ? 'main-tab-btn--active' : ''}`}
            onClick={() => setActiveMainTab('exercises')}
          >
            <Trophy size={16} />
            Exercícios Práticos ({completedCount * 50} / 2000 XP)
          </button>
          <button
            className={`main-tab-btn ${activeMainTab === 'academic' ? 'main-tab-btn--active' : ''}`}
            onClick={() => setActiveMainTab('academic')}
          >
            <GraduationCap size={16} />
            Apresentação Acadêmica (Projeto APC)
          </button>
        </div>

        {activeMainTab === 'specs' && (
          <ApiSpecsView
            activeId={activeId}
            setActiveId={setActiveId}
            activeCodeTab={activeCodeTab}
            setActiveCodeTab={setActiveCodeTab}
            activeEp={activeEp}
            tryPayloads={tryPayloads}
            handlePayloadChange={handlePayloadChange}
            handleExecute={handleExecute}
            loadingExec={loadingExec}
            resultsExec={resultsExec}
            handleClearResult={handleClearResult}
            getActiveCodeSnippet={getActiveCodeSnippet}
            copiedId={copiedId}
            handleCopy={handleCopy}
            endpointsSpec={ENDPOINTS_SPEC}
          />
        )}
        {activeMainTab === 'exercises' && (
          <ApiExercisesView
            solvedExercises={solvedExercises}
            activeExTopic={activeExTopic}
            setActiveExTopic={setActiveExTopic}
            exAnswers={exAnswers}
            handleAnswerChange={handleAnswerChange}
            exFeedbacks={exFeedbacks}
            verifyQuizExercise={verifyQuizExercise}
            currentUser={currentUser}
            exerciseTopics={EXERCISE_TOPICS}
          />
        )}
        {activeMainTab === 'academic' && (
          <ApiAcademicView />
        )}
      </section>
    </div>
  );
}
