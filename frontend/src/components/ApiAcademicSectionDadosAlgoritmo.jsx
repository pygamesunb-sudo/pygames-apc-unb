import React from 'react';
import {
  Database,
  Code,
  Users,
  Activity,
  Sparkles,
  Terminal
} from 'lucide-react';

// Aba 3: Estrutura de Dados
export function DadosSection() {
  return (
    <div className="animate-fade-in academic-section-flow">
      <div className="card">
        <h3 className="section-title">
          <Database size={18} className="title-icon" />
          Estrutura de Dados Acadêmica do Software
        </h3>
        <p className="academic-text">
          Para dar suporte ao fluxo de execução ágil e flexível, modelamos o banco de dados NoSQL do Firestore utilizando três coleções nucleares. Abaixo estão descritos os modelos e campos em Python e JSON.
        </p>

        <div className="grid grid-3" style={{ marginTop: 20 }}>
          <div className="card sub-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, color: 'var(--accent-primary)' }}>
              <Code size={16} />
              <strong style={{ fontSize: '0.85rem' }}>Desafio (Problems)</strong>
            </div>
            <pre className="schema-pre">
{`{
  "problem_id": "string",
  "title": "string",
  "description": "string",
  "difficulty": "facil" | "medio" | "dificil",
  "test_cases": [
    {
      "input": "string",
      "expected_output": "string"
    }
  ],
  "solution": "string (código)",
  "hints": ["string"],
  "solution_blocks": ["string"]
}`}
            </pre>
          </div>

          <div className="card sub-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, color: 'var(--accent-secondary)' }}>
              <Users size={16} />
              <strong style={{ fontSize: '0.85rem' }}>Perfil (User Profile)</strong>
            </div>
            <pre className="schema-pre">
{`{
  "uid": "string (Firebase ID)",
  "name": "string",
  "email": "string",
  "coding_points": "integer",
  "total_score": "integer",
  "games": {
    "snake": "integer (highscore)",
    "doodle": "integer (highscore)",
    "invaders": "integer (highscore)"
  },
  "created_at": "timestamp"
}`}
            </pre>
          </div>

          <div className="card sub-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, color: 'var(--accent-success)' }}>
              <Activity size={16} />
              <strong style={{ fontSize: '0.85rem' }}>Tentativa (Submissions)</strong>
            </div>
            <pre className="schema-pre">
{`{
  "submission_id": "string",
  "user_id": "string",
  "user_name": "string",
  "problem_id": "string",
  "problem_title": "string",
  "code": "string (solução enviada)",
  "score": "integer (0 a 100)",
  "all_passed": "boolean",
  "timestamp": "timestamp"
}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

// Aba 4: Algoritmo & Sandbox
export function AlgoritmoSection() {
  return (
    <div className="animate-fade-in academic-section-flow">
      <div className="card">
        <h3 className="section-title">
          <Sparkles size={18} className="title-icon" />
          Pipeline Multi-Agente de Geração Socrática
        </h3>
        <p className="academic-text">
          A geração inteligente de problemas didáticos utiliza três agentes de IA autônomos baseados em prompts de sistema customizados para o letramento computacional:
        </p>
        <div className="pipeline-steps-vertical" style={{ margin: '16px 0' }}>
          <div className="pipeline-step-item">
            <div className="step-badge">Agente 1</div>
            <div>
              <strong>Gerador Pedagógico:</strong> Elabora o enunciado da questão correlacionando o assunto de APC solicitado com elementos cotidianos ou meio ambiente. Divide a solução ótima de programação em blocos didáticos (`solution_blocks`) para o minijogo dinâmico.
            </div>
          </div>
          <div className="pipeline-step-item">
            <div className="step-badge">Agente 2</div>
            <div>
              <strong>Solucionador de Validação:</strong> Executa as entradas geradas e tenta solucionar o problema proposto de forma isolada, gerando os outputs reais para certificar a consistência dos casos de teste.
            </div>
          </div>
          <div className="pipeline-step-item">
            <div className="step-badge">Agente 3</div>
            <div>
              <strong>Revisor de Qualidade:</strong> Atua como um revisor por pares, descartando problemas com enunciados confusos, redundantes ou com estruturas que firam a didática ou a segurança do interpretador Python.
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="section-title">
          <Terminal size={18} className="title-icon" />
          Algoritmo Python de Execução Isolada (Sandbox)
        </h3>
        <p className="academic-text">
          O backend do Pygame-APC executa scripts enviados de forma isolada. O algoritmo realiza a criação temporária do arquivo, injeção de entradas via pipe `stdin`, monitoramento de erros e timeout de segurança (5 segundos) para evitar loops infinitos.
        </p>

        <div className="code-viewer-container" style={{ marginTop: 12 }}>
          <div className="code-viewer-header">
            <span>ALGORITMO REAL DE SANDBOX PYTHON (submissions.py)</span>
          </div>
          <pre className="code-viewer-body" style={{ maxHeight: '250px' }}>
<code>{`def _run_user_code(code: str, test_input: str) -> tuple[str, str | None]:
    """
    Executa o código do usuário em um subprocesso isolado com limite de tempo.
    Retorna uma tupla (stdout, stderr).
    """
    tmp_path = None
    try:
        # Cria um arquivo temporário com segurança
        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".py", delete=False, encoding="utf-8"
        ) as tmp:
            tmp.write(code)
            tmp_path = tmp.name

        # Invoca o subprocesso passando a entrada padrão (stdin)
        proc = subprocess.run(
            [sys.executable, tmp_path],
            input=test_input,
            capture_output=True,
            text=True,
            timeout=5, # Proteção contra loop infinito
        )
        return proc.stdout.strip(), proc.stderr.strip() or None
    except subprocess.TimeoutExpired:
        return "", "Tempo limite excedido (5 segundos de execução)."
    except Exception as e:
        return "", str(e)
    finally:
        # Remove o arquivo temporário da máquina
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)`}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
