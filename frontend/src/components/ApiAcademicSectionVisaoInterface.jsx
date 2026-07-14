import React from 'react';
import './ApiAcademicSectionVisaoInterface.css';
import {

  Shield,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Play,
  Cpu,
  Code,
  Users,
  CheckSquare
} from 'lucide-react';

// Aba 1: Visão & Letramento
export function VisaoSection() {
  return (
    <div className="animate-fade-in academic-section-flow">
      <div className="grid grid-2">
        <div className="card text-pane">
          <h3 className="section-title">
            <Shield size={18} className="title-icon" />
            Premissas de Letramento em IAG (Ishikawa, 2026)
          </h3>
          <p className="academic-text">
            Na era da Inteligência Artificial Generativa, o letramento digital no ensino superior exige uma mudança drástica. O estudante não deve ser apenas um consumidor passivo de códigos gerados, mas sim um criador crítico de conhecimento.
          </p>
          <div className="premissas-list">
            <div className="premissa-item">
              <CheckSquare size={14} className="list-icon" />
              <span><strong>Sensemaking:</strong> Construção ativa de significados e análise de algoritmos fornecidos por IA.</span>
            </div>
            <div className="premissa-item">
              <CheckSquare size={14} className="list-icon" />
              <span><strong>Diálogos Críticos:</strong> Abordagem hipotético-dedutiva no teste sistemático de respostas da IA.</span>
            </div>
            <div className="premissa-item">
              <CheckSquare size={14} className="list-icon" />
              <span><strong>Método Socrático:</strong> Questionamento das respostas e validação de consistência.</span>
            </div>
          </div>
        </div>

        <div className="card text-pane">
          <h3 className="section-title">
            <TrendingUp size={18} className="title-icon" />
            Proposta de Engenharia e Ensino (Prof. Rodrigo Duran)
          </h3>
          <p className="academic-text">
            A codificação não morreu: transformou-se a forma como ensinamos e aprendemos a programar. Com o baixo custo cognitivo para gerar código bruto via IAG, o foco pedagógico deve migrar de sintaxe simples para engenharia e orquestração de software.
          </p>
          <div className="premissas-list">
            <div className="premissa-item">
              <ArrowRight size={14} className="list-icon" />
              <span>Análise profunda de problemas e especificação de requisitos.</span>
            </div>
            <div className="premissa-item">
              <ArrowRight size={14} className="list-icon" />
              <span>Elaboração estratégica de prompts para modelagem.</span>
            </div>
            <div className="premissa-item">
              <ArrowRight size={14} className="list-icon" />
              <span>Validação rigorosa de resultados e testes estatísticos.</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card vision-statement-card">
        <h3 className="vision-title">
          <Sparkles size={18} className="vision-title-icon" />
          Declaração de Visão do Produto (Fórmula de Sucesso)
        </h3>
        <div className="vision-formula-grid">
          <div className="formula-row">
            <span className="formula-label">PARA</span>
            <span className="formula-value">estudantes e calouros de computação matriculados na disciplina de APC.</span>
          </div>
          <div className="formula-row">
            <span className="formula-label">QUE</span>
            <span className="formula-value">precisam desenvolver raciocínio algorítmico sólido e compreender os conceitos básicos de Python de maneira ativa e contextualizada.</span>
          </div>
          <div className="formula-row">
            <span className="formula-label">O</span>
            <span className="formula-value"><strong>Pygame-APC</strong> é um ecossistema gamificado inteligente de desafios de programação e fliperama digital.</span>
          </div>
          <div className="formula-row">
            <span className="formula-label">QUE</span>
            <span className="formula-value">une o engajamento de minijogos dinâmicos em JavaScript e um compilador Python isolado com geração socrática de desafios por múltiplos agentes LLM.</span>
          </div>
          <div className="formula-row">
            <span className="formula-label">AO CONTRÁRIO</span>
            <span className="formula-value">de listas de exercícios repetitivas, descontextualizadas e facilmente burladas por geradores automáticos de código.</span>
          </div>
          <div className="formula-row">
            <span className="formula-label">A NOSSA SOLUÇÃO</span>
            <span className="formula-value">desperta o interesse prático do aluno no letramento computacional e promove o pensamento analítico na validação de algoritmos.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Aba 2: Design & Interface
export function InterfaceSection() {
  return (
    <div className="animate-fade-in academic-section-flow">
      <div className="card">
        <h3 className="section-title">
          <Code size={18} className="title-icon" />
          Arquitetura de Navegação & Fluxos de Entrada e Saída
        </h3>
        <p className="academic-text">
          O design de interface do Pygame-APC foi pensado de forma a integrar gamificação arcade clássica e áreas dedicadas ao desenvolvimento de habilidades computacionais complexas em Python.
        </p>

        <div className="grid grid-4" style={{ marginTop: 20 }}>
          <div className="card sub-card text-center">
            <Play size={20} style={{ color: 'var(--accent-primary)', marginBottom: 8 }} />
            <h4 style={{ color: 'var(--text-primary)', marginBottom: 6 }}>Arcade Retro</h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Mini-jogos em JavaScript (Snake, Doodle, Invaders) com envio assíncrono de recordes ao servidor para engajamento e integração do calouro.
            </p>
          </div>
          <div className="card sub-card text-center">
            <Cpu size={20} style={{ color: 'var(--accent-secondary)', marginBottom: 8 }} />
            <h4 style={{ color: 'var(--text-primary)', marginBottom: 6 }}>Pipeline de IA</h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Configurador de prompts e parâmetros de IA (Gemini 3.1) para geração socrática personalizada de enunciados didáticos.
            </p>
          </div>
          <div className="card sub-card text-center">
            <Code size={20} style={{ color: 'var(--accent-success)', marginBottom: 8 }} />
            <h4 style={{ color: 'var(--text-primary)', marginBottom: 6 }}>Arena de Código</h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Console iterativo com feedback de compilador isolado Python e testes unitários com saídas normalizadas de stdout/stderr.
            </p>
          </div>
          <div className="card sub-card text-center">
            <Users size={20} style={{ color: 'var(--accent-warning)', marginBottom: 8 }} />
            <h4 style={{ color: 'var(--text-primary)', marginBottom: 6 }}>Leaderboard</h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Estatísticas consolidadas agregando pontos de codificação Python (Coding Points) e conquistas nos jogos arcade retrô.
            </p>
          </div>
        </div>

        <div className="architecture-diagram" style={{ marginTop: 24, padding: 16, background: '#090d16', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
          <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--accent-secondary)', marginBottom: 12 }}>
            Fluxo de Dados: Frontend React & Backend Python API
          </h4>
          <div className="flow-diagram-horizontal">
            <div className="flow-node">
              <span className="node-title">Navegador (React)</span>
              <span className="node-desc">Requisição POST com token Bearer Firebase</span>
            </div>
            <div className="flow-arrow"><ArrowRight size={16} /></div>
            <div className="flow-node">
              <span className="node-title">FastAPI Router</span>
              <span className="node-desc">Verificação JWT e injeção do modelo de segurança</span>
            </div>
            <div className="flow-arrow"><ArrowRight size={16} /></div>
            <div className="flow-node">
              <span className="node-title">Executor Sandbox</span>
              <span className="node-desc">subprocess.run local e checagem de erros</span>
            </div>
            <div className="flow-arrow"><ArrowRight size={16} /></div>
            <div className="flow-node">
              <span className="node-title">Firestore</span>
              <span className="node-desc">Persistência da submissão e atualização do score</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
