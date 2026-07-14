import React from 'react';
import './ApiAcademicSectionCronoMetodo.css';
import {

  Calendar,
  Play,
  FileText,
  Award,
  Users,
  CheckCircle,
  Layers3,
  Clock,
  Layers,
  ArrowRight,
  Activity
} from 'lucide-react';

// Aba 5: Cronograma & Sprints
export function CronogramaSection() {
  return (
    <div className="animate-fade-in academic-section-flow">
      <div className="card">
        <h3 className="section-title">
          <Calendar size={18} className="title-icon" />
          Cronograma de Entregas Ajustado
        </h3>
        <p className="academic-text">
          O cronograma de desenvolvimento do Pygame-APC segue rigorosamente os marcos avaliativos estabelecidos pelo DCC/CIC no semestre acadêmico:
        </p>

        <div className="timeline-horizontal" style={{ marginTop: 24 }}>
          <div className="timeline-node">
            <span className="timeline-date">20/05</span>
            <div className="timeline-dot"><Play size={10} style={{ color: '#fff' }} /></div>
            <span className="timeline-title">Início do Projeto</span>
            <span className="timeline-desc">Definição do escopo da equipe</span>
          </div>
          <div className="timeline-node">
            <span className="timeline-date">27/05</span>
            <div className="timeline-dot"><FileText size={10} style={{ color: '#fff' }} /></div>
            <span className="timeline-title">Especificação</span>
            <span className="timeline-desc">Upload no Moodle dos requisitos</span>
          </div>
          <div className="timeline-node">
            <span className="timeline-date">03/06</span>
            <div className="timeline-dot"><Award size={10} style={{ color: '#fff' }} /></div>
            <span className="timeline-title">Avaliação Intermediária</span>
            <span className="timeline-desc">Pitch do protótipo em andamento</span>
          </div>
          <div className="timeline-node">
            <span className="timeline-date">11/06</span>
            <div className="timeline-dot"><Users size={10} style={{ color: '#fff' }} /></div>
            <span className="timeline-title">Apresentação Poster</span>
            <span className="timeline-desc">1ª Jornada de Extensão do IE</span>
          </div>
          <div className="timeline-node">
            <span className="timeline-date">01/07</span>
            <div className="timeline-dot"><CheckCircle size={10} style={{ color: '#fff' }} /></div>
            <span className="timeline-title">Entrega Final</span>
            <span className="timeline-desc">Código GitHub, vídeo de 7min e slides</span>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="section-title">
          <Layers3 size={18} className="title-icon" />
          Estruturação e Divisão dos Sprints Acadêmicos
        </h3>
        <div className="grid grid-3" style={{ marginTop: 16 }}>
          <div className="card sub-card">
            <h4 style={{ color: 'var(--accent-primary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={14} /> Sprint Inicial
            </h4>
            <ul className="sprint-list" style={{ fontSize: '0.75rem', paddingLeft: 16 }}>
              <li>Definir a Visão do Produto</li>
              <li>Desenhar protótipos de interface</li>
              <li>Modelar a estrutura de dados (NoSQL)</li>
              <li>Especificar algoritmo do sandbox</li>
              <li>Ajustar cronograma de aula</li>
              <li>Criar organização no GitHub</li>
            </ul>
          </div>
          <div className="card sub-card">
            <h4 style={{ color: 'var(--accent-secondary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={14} /> Sprint Intermediário
            </h4>
            <ul className="sprint-list" style={{ fontSize: '0.75rem', paddingLeft: 16 }}>
              <li>Desenvolver frontend em React</li>
              <li>Construir backend em FastAPI Python</li>
              <li>Integrar chamadas com Google Gemini</li>
              <li>Criar documentação e rotas da API</li>
              <li>Elaborar o pitch do protótipo</li>
              <li>Montar experimento piloto com usuários</li>
            </ul>
          </div>
          <div className="card sub-card">
            <h4 style={{ color: 'var(--accent-success)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={14} /> Sprint Final
            </h4>
            <ul className="sprint-list" style={{ fontSize: '0.75rem', paddingLeft: 16 }}>
              <li>Refinar algoritmo com feedbacks</li>
              <li>Sincronizar correções no GitHub</li>
              <li>Consolidar resultados estatísticos</li>
              <li>Gravar vídeo de demonstração (7min)</li>
              <li>Diagramar o poster acadêmico</li>
              <li>Apresentar os slides para a turma</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// Aba 6: Scrum & Metodologia
export function MetodologiaSection() {
  return (
    <div className="animate-fade-in academic-section-flow">
      <div className="card">
        <h3 className="section-title">
          <Layers size={18} className="title-icon" />
          Fluxo de Trabalho: Metodologia Scrum
        </h3>
        <p className="academic-text">
          Utilizamos práticas ágeis adaptadas ao contexto universitário para garantir entregas incrementais frequentes e alinhamento contínuo com os feedbacks dos monitores e professores.
        </p>

        <div className="scrum-legend-box" style={{ marginTop: 12 }}>
          <span className="legend-title">Legenda de Componentes:</span>
          <span className="legend-tag legend-tag--ceremony">Cerimônias</span>
          <span className="legend-tag legend-tag--artifact">Artefatos</span>
          <span className="legend-tag legend-tag--metrics">Métricas / Burndown</span>
        </div>

        <div className="scrum-flow-diagram" style={{ marginTop: 16 }}>
          <div className="scrum-node ceremony">Visão da Aula / Curso / SW</div>
          <div className="scrum-arrow"><ArrowRight size={14} /></div>
          <div className="scrum-node artifact">Backlog da Aula / SW</div>
          <div className="scrum-arrow"><ArrowRight size={14} /></div>
          <div className="scrum-node ceremony">Planejamento do Sprint</div>
          <div className="scrum-arrow"><ArrowRight size={14} /></div>
          <div className="scrum-node artifact">Backlog do Sprint</div>
          <div className="scrum-arrow"><ArrowRight size={14} /></div>
          <div className="scrum-node ceremony">Reunião Diária (15 min por aula)</div>
          <div className="scrum-arrow"><ArrowRight size={14} /></div>
          <div className="scrum-node metrics">Gráfico de Burndown</div>
          <div className="scrum-arrow"><ArrowRight size={14} /></div>
          <div className="scrum-node ceremony">Revisão e Retrospectiva</div>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card text-pane">
          <h3 className="section-title">
            <Activity size={18} className="title-icon" />
            Metodologia Experimental Científica
          </h3>
          <p className="academic-text">
            Para comprovar que o ecossistema do Pygame-APC contribui de forma estatística para a fixação do conteúdo de algoritmos, adotamos uma abordagem científica rigorosa:
          </p>
          <ul className="sprint-list" style={{ fontSize: '0.78rem', paddingLeft: 16 }}>
            <li><strong>Hipótese:</strong> O letramento guiado por IA socrática e gamificação melhora o desempenho na P2 (prova teórica de APC) em comparação com o ensino tradicional.</li>
            <li><strong>Grupo de Teste:</strong> Amostragem de calouros executando submissões em nosso console.</li>
            <li><strong>Métricas:</strong> Quantidade de tentativas necessárias para acerto, tempo gasto de leitura de dicas e pontuação acumulada.</li>
            <li><strong>Análise:</strong> Comparação estatística de progresso e correlação dos Coding Points com as avaliações oficiais.</li>
          </ul>
        </div>

        <div className="card text-pane">
          <h3 className="section-title">
            <Award size={18} className="title-icon" />
            Critérios e Rubricas de Avaliação (CIC - UnB)
          </h3>
          <div style={{ overflowX: 'auto', marginTop: 10 }}>
            <table className="params-table" style={{ fontSize: '0.78rem' }}>
              <thead>
                <tr>
                  <th>Critério / Etapa</th>
                  <th>Peso %</th>
                  <th>Alvo Padrão (Nota 9 a 10)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Especificação do Projeto</strong></td>
                  <td>10%</td>
                  <td>Cobre todos os requisitos funcionais descritos, com diagramas claros.</td>
                </tr>
                <tr>
                  <td><strong>Pitch Intermediário</strong></td>
                  <td>10%</td>
                  <td>Demonstração em slides focada claramente na evolução do escopo definido.</td>
                </tr>
                <tr>
                  <td><strong>Código Fonte (Python)</strong></td>
                  <td>30%</td>
                  <td>Entre 80% e 100% implementado, modularizado e com comentários.</td>
                </tr>
                <tr>
                  <td><strong>Demonstração Prática</strong></td>
                  <td>30%</td>
                  <td>Execução sem falhas, erros de compilação ou vulnerabilidades de entrada.</td>
                </tr>
                <tr>
                  <td><strong>Poster & Apresentação (Jornada)</strong></td>
                  <td>20%</td>
                  <td>Metodologia científica adequada, gráficos lógicos e texto inteligível.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
