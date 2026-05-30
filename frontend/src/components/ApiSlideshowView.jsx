import React, { useState, useEffect } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  BookOpen,
  Layout,
  Database,
  Cpu,
  Calendar,
  Layers,
  GraduationCap,
  Sparkles,
  Play,
  FileText,
  Award,
  Users,
  GitBranch,
  Shield,
  Activity,
  Terminal,
  TrendingUp,
  Layers3,
  CheckCircle,
  HelpCircle,
  Code
} from 'lucide-react';
import './ApiSlideshowView.css';

export default function ApiSlideshowView({ isOpen, onClose, initialSlideId = 'visao' }) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const slides = [
    { id: 'visao', label: 'Visão & Letramento', icon: BookOpen },
    { id: 'interface', label: 'Design & Interface', icon: Layout },
    { id: 'dados', label: 'Estrutura de Dados', icon: Database },
    { id: 'algoritmo', label: 'Pipeline & Sandbox', icon: Cpu },
    { id: 'cronograma', label: 'Sprints & Cronograma', icon: Calendar },
    { id: 'metodologia', label: 'Scrum & Experimento', icon: Layers }
  ];

  const [currentIndex, setCurrentIndex] = useState(() => {
    const idx = slides.findIndex(s => s.id === initialSlideId);
    return idx !== -1 ? idx : 0;
  });

  // Navegação por teclado
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevSlide();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex]);

  // Sincroniza escuta de alteração de tela cheia nativa
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (!isOpen) return null;

  const nextSlide = () => setCurrentIndex((prev) => (prev < slides.length - 1 ? prev + 1 : 0));
  const prevSlide = () => setCurrentIndex((prev) => (prev > 0 ? prev - 1 : slides.length - 1));

  const handleClose = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    onClose();
  };

  const toggleFullscreen = () => {
    const docEl = document.documentElement;
    if (!document.fullscreenElement) {
      docEl.requestFullscreen().catch((err) => console.error(`Erro ao ativar tela cheia: ${err.message}`));
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const currentSlide = slides[currentIndex];

  return (
    <div className="slideshow-overlay">
      {/* Círculos de Fundo com Blur Animado */}
      <div className="bg-deco-circle bg-deco-circle--1 loop-float" />
      <div className="bg-deco-circle bg-deco-circle--2 loop-float" style={{ animationDelay: '-3s' }} />

      {/* Barra Superior de Controle */}
      <header className="slideshow-header">
        <div className="slideshow-header-info">
          <span className="slideshow-logo-icon">
            <GraduationCap size={20} />
          </span>
          <div>
            <h3>Projeto Pygame-APC</h3>
            <p>Apresentação de Requisitos e Arquitetura de API</p>
          </div>
        </div>

        {/* Indicador de Slide */}
        <div className="slideshow-indicator">
          <span>SLIDE {currentIndex + 1} DE {slides.length}</span>
          <span className="slideshow-title-badge">{currentSlide.label}</span>
        </div>

        <div className="slideshow-controls-right">
          <button className="slideshow-icon-btn" onClick={toggleFullscreen} title="Tela Cheia (F11)">
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
          <button className="slideshow-icon-btn slideshow-icon-btn--close" onClick={handleClose} title="Sair (Esc)">
            <X size={18} />
          </button>
        </div>
      </header>

      {/* Corpo do Slide Ativo - Remounts para acionar transições CSS */}
      <main className="slideshow-body slide-enter-active" key={currentSlide.id}>
        {currentSlide.id === 'visao' && (
          <div className="slide-content-layout">
            <div className="slide-two-columns">
              <div className="slide-card loop-pulse-purple">
                <h3 className="slide-card-title purple-text">
                  <Shield size={24} className="title-icon" />
                  Premissas de Letramento Crítico em IAG
                </h3>
                <p className="slide-text font-lg">
                  Como criar conhecimento com a IAG considerando que ela dá respostas questionáveis e não referenciáveis?
                </p>
                <div className="slide-features-list" style={{ marginTop: 20 }}>
                  <div className="feature-item">
                    <span className="badge-bullet">01</span>
                    <div>
                      <strong>Sensemaking:</strong> Estudantes constroem significado ativamente analisando a semântica e complexidade de algoritmos gerados por IA.
                    </div>
                  </div>
                  <div className="feature-item">
                    <span className="badge-bullet">02</span>
                    <div>
                      <strong>Diálogos Críticos:</strong> Testes empíricos sistemáticos das saídas da IA através de uma abordagem hipotético-dedutiva.
                    </div>
                  </div>
                  <div className="feature-item">
                    <span className="badge-bullet">03</span>
                    <div>
                      <strong>Método Socrático:</strong> IA como tutora socrática que fornece pistas guiadas sem entregar a solução pronta instantaneamente.
                    </div>
                  </div>
                </div>
              </div>

              <div className="slide-card loop-pulse-cyan">
                <h3 className="slide-card-title cyan-text">
                  <TrendingUp size={24} className="title-icon" />
                  Redefinição do Ensino (Prof. Rodrigo Duran)
                </h3>
                <p className="slide-text">
                  A IA generativa reduz significativamente o custo cognitivo da escrita de sintaxe mecânica bruta. O foco pedagógico migra do desenvolvimento simples de código para a engenharia de software integral:
                </p>
                <div className="slide-boxes-grid" style={{ marginTop: 24 }}>
                  <div className="mini-feature-box">
                    <Code size={18} className="mini-icon cyan-text" />
                    <strong>Validação</strong>
                    <span>Análise profunda e testes de consistência.</span>
                  </div>
                  <div className="mini-feature-box">
                    <Sparkles size={18} className="mini-icon purple-text" />
                    <strong>Engenharia de Prompts</strong>
                    <span>Orquestração lógica refinada e contextualizada.</span>
                  </div>
                  <div className="mini-feature-box">
                    <Users size={18} className="mini-icon yellow-text" />
                    <strong>Entendimento Crítico</strong>
                    <span>Autonomia e raciocínio analítico profundo.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Declaração de Visão */}
            <div className="slide-card loop-pulse-purple" style={{ marginTop: 24 }}>
              <h4 className="slide-card-title" style={{ fontSize: '1.1rem', marginBottom: 16 }}>
                <Sparkles size={16} className="title-icon" />
                Fórmula de Visão de Sucesso do Produto (Pygame-APC)
              </h4>
              <div className="slide-vision-grid">
                <div className="vision-part"><span className="label">PARA</span> <span className="val">estudantes e calouros de computação (APC).</span></div>
                <div className="vision-part"><span className="label">QUE</span> <span className="val">precisam consolidar o raciocínio algorítmico Python sem copiar passivamente respostas.</span></div>
                <div className="vision-part"><span className="label">O</span> <span className="val"><strong>Pygame-APC</strong> é um ecossistema gamificado com mini-games e IA socrática.</span></div>
                <div className="vision-part"><span className="label">QUE</span> <span className="val">alinha diversão arcade retro a um compilador de testes unitários robusto em tempo real.</span></div>
                <div className="vision-part"><span className="label">AO CONTRÁRIO</span> <span className="val">de listas de exercícios estáticas que incentivam o plágio mecânico.</span></div>
                <div className="vision-part"><span className="label">NOSSO SW</span> <span className="val">adiciona letramento crítico em IA, fixando conceitos ativamente.</span></div>
              </div>
            </div>
          </div>
        )}

        {currentSlide.id === 'interface' && (
          <div className="slide-content-layout">
            <div className="slide-card text-center" style={{ padding: '30px 40px' }}>
              <h3 className="slide-card-title justify-center font-xl">
                <Layout size={28} className="title-icon loop-float" />
                Design do Sistema: Interface e Fluxos
              </h3>
              <p className="slide-text max-w-xl text-center" style={{ margin: '0 auto 30px' }}>
                Desenvolvemos quatro módulos estruturados no frontend para prender a atenção do aluno e motivá-lo através de mecanismos clássicos de gamificação.
              </p>

              <div className="slide-four-cards-grid">
                <div className="slide-mini-card">
                  <Play size={24} style={{ color: 'var(--accent-primary)', marginBottom: 12 }} />
                  <h4>Fliperama Retro</h4>
                  <p>Snake, Doodle Ninja e Bug Invaders criados em JS que mantém o engajamento e a diversão ativa do calouro.</p>
                </div>
                <div className="slide-mini-card">
                  <Cpu size={24} style={{ color: 'var(--accent-secondary)', marginBottom: 12 }} />
                  <h4>Configurador de IA</h4>
                  <p>Controle estratégico de temperatura e prompts para que o aluno regule a geração socrática dos desafios.</p>
                </div>
                <div className="slide-mini-card">
                  <Code size={24} style={{ color: 'var(--accent-success)', marginBottom: 12 }} />
                  <h4>Arena de Código</h4>
                  <p>Console rico para digitação do script em Python, com avaliação assíncrona instantânea de testes.</p>
                </div>
                <div className="slide-mini-card">
                  <Users size={24} style={{ color: 'var(--accent-warning)', marginBottom: 12 }} />
                  <h4>Leaderboard</h4>
                  <p>Ranking social e estatísticas em tempo real, integrando pontuações arcade e Coding Points.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentSlide.id === 'dados' && (
          <div className="slide-content-layout">
            <div className="slide-card">
              <h3 className="slide-card-title justify-center font-xl">
                <Database size={28} className="title-icon loop-float" />
                Representação das Estruturas de Dados do Banco
              </h3>
              <p className="slide-text text-center" style={{ marginBottom: 24 }}>
                Modelagem estruturada NoSQL (Firestore) com coleções independentes para manter o isolamento de perfis e a agilidade nas consultas da API.
              </p>
              
              <div className="slide-two-columns">
                <div className="slide-sub-card">
                  <h4 style={{ color: 'var(--accent-primary)', marginBottom: 10 }}>1. Desafios (Problems Schema)</h4>
                  <pre className="slide-pre">
{`{
  "problem_id": "string (UUID)",
  "title": "string",
  "difficulty": "facil" | "medio" | "dificil",
  "test_cases": [{"input": "string", "expected_output": "string"}],
  "solution": "string (código)",
  "solution_blocks": ["string"]
}`}
                  </pre>
                </div>
                <div className="slide-sub-card">
                  <h4 style={{ color: 'var(--accent-success)', marginBottom: 10 }}>2. Perfis & Tentativas (Profiles & Submissions)</h4>
                  <pre className="slide-pre">
{`{
  "uid": "string (Firebase ID)",
  "coding_points": "integer",
  "total_score": "integer",
  "games": {"snake": "int", "doodle": "int", "invaders": "int"}
}
{
  "submission_id": "string",
  "problem_id": "string",
  "code": "string",
  "score": "integer",
  "all_passed": "boolean"
}`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentSlide.id === 'algoritmo' && (
          <div className="slide-content-layout">
            <div className="slide-two-columns">
              <div className="slide-card">
                <h3 className="slide-card-title">
                  <Sparkles size={22} className="title-icon" />
                  Pipeline Multi-Agente LLM (Gemini 3.1)
                </h3>
                <p className="slide-text">
                  A plataforma gera problemas socráticos didáticos coordenando três agentes autônomos de Inteligência Artificial paralelamente:
                </p>
                <div className="slide-steps-container">
                  <div className="slide-step">
                    <span className="step-num">1</span>
                    <div>
                      <strong>Gerador:</strong> Cria o enunciado mesclando temas de APC e meio ambiente, e gera os blocos didáticos (`solution_blocks`).
                    </div>
                  </div>
                  <div className="slide-step">
                    <span className="step-num">2</span>
                    <div>
                      <strong>Solucionador:</strong> Executa a solução proposta no sandbox garantindo a integridade dos casos de teste.
                    </div>
                  </div>
                  <div className="slide-step">
                    <span className="step-num">3</span>
                    <div>
                      <strong>Revisor:</strong> Valida a didática, complexidade e afasta erros lógicos ou falhas de formatação.
                    </div>
                  </div>
                </div>
              </div>

              <div className="slide-card">
                <h3 className="slide-card-title">
                  <Terminal size={22} className="title-icon" />
                  Executor Isolado Sandbox Python (submissions.py)
                </h3>
                <p className="slide-text">
                  Garante a segurança e a corretude de códigos escritos através da criação ágil de arquivos temporários executados de forma isolada por subprocesso com limite de tempo:
                </p>
                <pre className="slide-pre" style={{ height: '220px', fontSize: '0.7rem' }}>
{`# Criação e execução segura no backend
with tempfile.NamedTemporaryFile(
    mode="w", suffix=".py", delete=False, encoding="utf-8"
) as tmp:
    tmp.write(code)
    tmp_path = tmp.name

# Limita a execução a 5 segundos de timeout
proc = subprocess.run(
    [sys.executable, tmp_path],
    input=test_input,
    capture_output=True,
    text=True,
    timeout=5
)
return proc.stdout.strip(), proc.stderr.strip() or None`}
                </pre>
              </div>
            </div>
          </div>
        )}

        {currentSlide.id === 'cronograma' && (
          <div className="slide-content-layout">
            <div className="slide-card text-center" style={{ padding: '30px 40px' }}>
              <h3 className="slide-card-title justify-center font-xl">
                <Calendar size={28} className="title-icon loop-float" />
                Cronograma Acadêmico & Sprints
              </h3>
              <p className="slide-text max-w-xl text-center" style={{ margin: '0 auto 30px' }}>
                Desenvolvimento incremental faseado e integrado aos prazos oficiais do semestre universitário para auditoria periódica dos professores.
              </p>

              {/* Sprints horizontais */}
              <div className="slide-three-cards-grid">
                <div className="slide-mini-card">
                  <h4 className="purple-text font-lg" style={{ marginBottom: 12 }}>Sprint Inicial</h4>
                  <ul style={{ textAlign: 'left', fontSize: '0.78rem', margin: 0, paddingLeft: 16 }}>
                    <li>Definir a Visão do Produto</li>
                    <li>Desenhar Mockups de Interface</li>
                    <li>Modelagem das tabelas Firestore</li>
                    <li>Criação de organização no Git</li>
                  </ul>
                </div>
                <div className="slide-mini-card">
                  <h4 className="cyan-text font-lg" style={{ marginBottom: 12 }}>Sprint Intermediário</h4>
                  <ul style={{ textAlign: 'left', fontSize: '0.78rem', margin: 0, paddingLeft: 16 }}>
                    <li>Escrever frontend React e rotas</li>
                    <li>Integrar IA Gemini 3.1 Flash</li>
                    <li>Criar documentação e rotas</li>
                    <li>Pitch e experimentos de usabilidade</li>
                  </ul>
                </div>
                <div className="slide-mini-card">
                  <h4 className="green-text font-lg" style={{ marginBottom: 12 }}>Sprint Final</h4>
                  <ul style={{ textAlign: 'left', fontSize: '0.78rem', margin: 0, paddingLeft: 16 }}>
                    <li>Refinamento baseado em feedback</li>
                    <li>Diagramar pôster para a Jornada</li>
                    <li>Gravar vídeo explicativo (7min)</li>
                    <li>Apresentação final para a turma</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentSlide.id === 'metodologia' && (
          <div className="slide-content-layout">
            <div className="slide-two-columns">
              <div className="slide-card loop-pulse-purple">
                <h3 className="slide-card-title">
                  <Layers size={22} className="title-icon" />
                  Metodologia Ágil (Scrum)
                </h3>
                <p className="slide-text">
                  Alinhamento contínuo através de ciclos ágeis baseados nas cerimônias e artefatos clássicos do Scrum adaptados às aulas de laboratório de APC:
                </p>
                <div className="slide-scrum-badges" style={{ marginTop: 16 }}>
                  <div className="scrum-badge ceremony">Sprints de 2 a 3 Aulas</div>
                  <div className="scrum-badge ceremony">Reunião Diária de Alinhamento</div>
                  <div className="scrum-badge artifact">Backlog de Produto (Aulas)</div>
                  <div className="scrum-badge artifact">Sprint Backlog</div>
                  <div className="scrum-badge metrics">Gráficos de Burndown</div>
                  <div className="scrum-badge ceremony">Sprint Review & Retrospectiva</div>
                </div>
              </div>

              <div className="slide-card loop-pulse-cyan">
                <h3 className="slide-card-title">
                  <Activity size={22} className="title-icon" />
                  Metodologia Experimental & Rubricas
                </h3>
                <p className="slide-text">
                  Investigação sustentável através do método científico. Testamos a eficácia do Pygame-APC medindo a correlação de desempenho e fixação algorítmica:
                </p>
                <div className="slide-scrum-badges" style={{ marginTop: 16 }}>
                  <div className="scrum-badge metrics">Experimento de Grupo Piloto</div>
                  <div className="scrum-badge metrics">Taxa de Acerto e Tempo de Escrita</div>
                  <div className="scrum-badge metrics">Evolução Analítica de Pontos</div>
                  <div className="scrum-badge metrics">Correlação com Desempenho na P2</div>
                </div>

                <div style={{ marginTop: 20, background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 6, border: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4, fontWeight: 700 }}>
                    Rubricas de Peso CIC - UnB:
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Especificação: 10% | Pitch: 10% | Demonstração Prática: 30% | Código Fonte: 30% | Apresentação Pôster na Jornada: 20%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Barra Inferior de Navegação */}
      <footer className="slideshow-footer">
        <button className="slideshow-nav-btn" onClick={prevSlide}>
          <ChevronLeft size={20} />
          <span>Anterior</span>
        </button>

        {/* Visual Dots */}
        <div className="slideshow-dots">
          {slides.map((s, idx) => (
            <button
              key={s.id}
              className={`slideshow-dot ${currentIndex === idx ? 'slideshow-dot--active' : ''}`}
              onClick={() => setCurrentIndex(idx)}
              title={s.label}
            />
          ))}
        </div>

        <button className="slideshow-nav-btn" onClick={nextSlide}>
          <span>Próximo</span>
          <ChevronRight size={20} />
        </button>
      </footer>

      {/* Barra de Progresso do Slideshow */}
      <div className="slideshow-progress-bar">
        <div 
          className="slideshow-progress-fill" 
          style={{ width: `${((currentIndex + 1) / slides.length) * 100}%` }}
        />
      </div>
    </div>
  );
}
