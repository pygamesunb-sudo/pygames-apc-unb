import {
  Sparkles,
  MessageCircle,
  RefreshCw,
  LineChart,
  Trophy,
  Gamepad2,
  GraduationCap,
} from 'lucide-react';

const AI_FEATURES = [
  {
    icon: Sparkles,
    title: 'Desafios Personalizados',
    text: 'A IA pode gerar exercícios adequados ao nível de conhecimento e à evolução do estudante.',
    accent: 'purple',
  },
  {
    icon: MessageCircle,
    title: 'Feedback Educacional',
    text: 'O sistema auxilia na interpretação dos desafios e incentiva a reflexão sobre possíveis soluções.',
    accent: 'cyan',
  },
  {
    icon: RefreshCw,
    title: 'Prática Contínua',
    text: 'Novos desafios podem ser criados para ampliar as oportunidades de treino e reforço dos conteúdos.',
    accent: 'purple',
  },
  {
    icon: LineChart,
    title: 'Progressão de Aprendizagem',
    text: 'O histórico de atividades permite acompanhar a evolução do estudante ao longo da plataforma.',
    accent: 'cyan',
  },
  {
    icon: Trophy,
    title: 'Gamificação',
    text: 'Pontuações, conquistas e desafios tornam a experiência mais motivadora e estimulam a prática constante.',
    accent: 'purple',
  },
  {
    icon: Gamepad2,
    title: 'Mini-games Educacionais',
    text: 'Jogos simples ajudam a manter o engajamento enquanto reforçam a experiência de aprendizagem.',
    accent: 'cyan',
  },
];

export default function AboutAI() {
  return (
    <>
      <p className="about-lead">
        No Python Arcade, a Inteligência Artificial é utilizada como ferramenta de apoio à aprendizagem,
        ajudando estudantes a praticar programação de forma mais personalizada e interativa.
      </p>

      <p className="about-ai-principle">
        A IA auxilia o aprendizado, mas o estudante continua sendo o protagonista.
      </p>

      <div className="about-how-grid">
        {AI_FEATURES.map(({ icon: Icon, title, text, accent }) => (
          <article key={title} className={`about-glass-card about-glass-card--${accent}`}>
            <span className="about-glass-card__icon">
              <Icon size={22} />
            </span>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </div>

      <div className="about-ai-institutional">
        <h3 className="about-ai-institutional__title">IA como recurso de aprendizagem</h3>
        <p>
          Acreditamos que a Inteligência Artificial deve ser utilizada para ampliar oportunidades
          de aprendizagem e não para substituir o desenvolvimento do raciocínio lógico. Por isso,
          o Python Arcade utiliza IA como uma ferramenta de apoio, incentivando a prática, a autonomia
          e o pensamento computacional.
        </p>

        <div className="about-ai-highlight">
          <span className="about-ai-highlight__icon">
            <GraduationCap size={22} />
          </span>
          <p>O estudante continua sendo o protagonista do processo de aprendizagem.</p>
        </div>
      </div>
    </>
  );
}
