import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Lightbulb,
  Rocket,
  Code2,
  Brain,
  Heart,
} from 'lucide-react';
import LandingHeader from '../components/landing/LandingHeader';
import AboutHero from '../components/about/AboutHero';
import AboutSection from '../components/about/AboutSection';
import AboutHowItWorks from '../components/about/AboutHowItWorks';
import AboutAI from '../components/about/AboutAI';
import AboutResponsibleAI from '../components/about/AboutResponsibleAI';
import AboutValues from '../components/about/AboutValues';
import AboutFinalCTA from '../components/about/AboutFinalCTA';
import './About.css';
import './LandingPage.css';

const CHALLENGES = [
  'Exercícios repetitivos que não dialogavam com o ritmo de cada aluno',
  'Dificuldade em receber feedback rápido e construtivo',
  'Desmotivação ao longo das primeiras semanas de curso',
  'Medo de errar e vergonha de pedir ajuda em público',
];

const PROBLEM_POINTS = [
  'Muitos estudantes enfrentam barreiras para compreender lógica e abstração',
  'É comum ficar preso nos primeiros conteúdos sem perceber evolução',
  'A desistência precoce aparece quando o aprendizado parece distante da prática',
  'O acompanhamento individualizado nem sempre alcança toda a turma',
];

const IDEA_POINTS = [
  'Inteligência Artificial para gerar desafios sob medida',
  'Gamificação para transformar prática em jornada',
  'Mini-games que mantêm o engajamento entre os estudos',
  'Progressão visível para mostrar que errar faz parte do processo',
  'Prática constante com feedback automatizado',
];

const VISION_BLOCKS = [
  {
    icon: Code2,
    title: 'Programar é resolver problemas',
    text: 'Cada exercício é uma oportunidade de decompor desafios e testar soluções.',
  },
  {
    icon: Brain,
    title: 'Programar é desenvolver autonomia',
    text: 'O estudante aprende a investigar, corrigir e persistir diante dos erros.',
  },
  {
    icon: Heart,
    title: 'Programar é criar soluções',
    text: 'A lógica vira ferramenta para impactar contextos reais com criatividade.',
  },
];

const FUTURE_ITEMS = [
  'Apoiar disciplinas introdutórias de programação em outros cursos',
  'Evoluir como projeto de extensão universitária',
  'Explorar parcerias com escolas públicas e projetos de inclusão digital',
  'Contribuir para a permanência e o engajamento estudantil',
];

export default function About() {
  const navigate = useNavigate();

  const goHome = useCallback(() => navigate('/'), [navigate]);

  const scrollToStory = useCallback(() => {
    document.getElementById('historia')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <div className="about-page">
      <div className="about-page__bg" />
      <LandingHeader onCtaClick={goHome} activePage="sobre" />

      <main className="about-page__main">
        <AboutHero onCtaClick={scrollToStory} />

        <AboutSection id="historia" badge="Capítulo 1" title="Como tudo começou">
          <p className="about-lead">
            O Python Arcade surgiu durante a disciplina de <strong>Algoritmos e Programação de Computadores (APC)</strong>.
            Quatro integrantes, ainda no início da jornada acadêmica, começaram a observar um padrão: muitos colegas
            compartilhavam as mesmas dificuldades ao dar os primeiros passos em Python.
          </p>
          <p>
            Não era falta de vontade. Era falta de ferramentas que conversassem com a realidade de quem está
            aprendendo. Foi nesse ambiente — entre códigos, provas e conversas depois da aula — que nasceu a
            vontade de construir algo diferente.
          </p>
          <ul className="about-list">
            {CHALLENGES.map((item) => (
              <li key={item}>
                <AlertCircle size={16} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </AboutSection>

        <AboutSection id="problema" badge="Capítulo 2" title="Uma realidade que conhecíamos bem">
          <p className="about-lead">
            Vivíamos de perto as frustrações de quem tenta aprender programação pela primeira vez.
            A sala de aula reunia perfis diversos, mas os obstáculos se repetiam.
          </p>
          <ul className="about-list about-list--plain">
            {PROBLEM_POINTS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="about-note">
            Não se trata de um único momento difícil, mas de um processo em que o estudante precisa de apoio,
            feedback e motivação para continuar — especialmente nos primeiros módulos da grade.
          </p>
        </AboutSection>

        <AboutSection id="ideia" badge="Capítulo 3" title="E se aprender programação pudesse ser mais divertido?">
          <p className="about-lead">
            Da pergunta nasceu o conceito <strong>Python Arcade</strong>: uma plataforma que mistura rigor
            acadêmico com experiência lúdica, sem perder o foco pedagógico.
          </p>
          <p>
            A proposta não é entregar respostas prontas. É criar um ambiente onde praticar Python faça sentido,
            onde errar faz parte da trilha e onde a tecnologia amplia — e não substitui — o papel do professor.
          </p>
          <div className="about-idea-grid">
            {IDEA_POINTS.map((item) => (
              <div key={item} className="about-idea-pill">
                <Lightbulb size={15} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </AboutSection>

        <AboutSection
          id="ia-educacional"
          badge="Tecnologia a serviço da aprendizagem"
          title="Como a Inteligência Artificial é utilizada"
        >
          <AboutAI />
        </AboutSection>

        <AboutSection id="visao" badge="Nossa visão" title="Mais do que uma plataforma">
          <p className="about-lead">
            Acreditamos que aprender a programar é desenvolver uma forma de pensar. A Inteligência Artificial
            entra como ferramenta de apoio para fortalecer o raciocínio lógico e o pensamento computacional —
            nunca para fazer o trabalho pelo estudante.
          </p>
          <div className="about-vision-grid">
            {VISION_BLOCKS.map(({ icon: Icon, title, text }) => (
              <article key={title} className="about-glass-card about-glass-card--cyan">
                <span className="about-glass-card__icon">
                  <Icon size={22} />
                </span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </AboutSection>

        <AboutSection id="como-funciona" badge="Na prática" title="Como funciona">
          <p className="about-lead">
            Cada parte do Python Arcade foi pensada para apoiar a jornada de quem está construindo sua base em Python.
          </p>
          <AboutHowItWorks />
        </AboutSection>

        <AboutSection
          id="uso-responsavel-ia"
          badge="Recursos"
          title="Uso Responsável da Inteligência Artificial"
        >
          <AboutResponsibleAI />
        </AboutSection>

        <AboutSection id="futuro" badge="Horizonte" title="Onde queremos chegar">
          <p className="about-lead">
            O projeto ainda está em evolução, mas já enxergamos caminhos concretos para ampliar seu impacto
            dentro e fora da universidade.
          </p>
          <ul className="about-future-list">
            {FUTURE_ITEMS.map((item) => (
              <li key={item}>
                <Rocket size={16} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="about-note">
            Avançamos com responsabilidade: testando, ouvindo feedback e priorizando o que realmente ajuda
            quem está aprendendo — sem promessas vazias.
          </p>
        </AboutSection>

        <AboutSection id="valores" badge="O que nos guia" title="Nossos valores">
          <AboutValues />
        </AboutSection>

        <AboutFinalCTA onCtaClick={goHome} />
      </main>

      <footer className="about-footer">
        <p>Python Arcade — Projeto acadêmico de Algoritmos e Programação de Computadores</p>
      </footer>
    </div>
  );
}
