import {
  BookOpen,
  Sparkles,
  Gamepad2,
  TrendingUp,
  Trophy,
  LineChart,
} from 'lucide-react';

const ITEMS = [
  {
    icon: BookOpen,
    title: 'Exercícios Personalizados',
    text: 'Desafios adaptados ao seu nível e aos tópicos que você precisa praticar.',
    accent: 'purple',
  },
  {
    icon: Sparkles,
    title: 'IA Educacional',
    text: 'Geração e validação de exercícios com apoio de agentes inteligentes.',
    accent: 'cyan',
  },
  {
    icon: Gamepad2,
    title: 'Mini-games Retrô',
    text: 'Pratique lógica enquanto aguarda ou relaxa com jogos inspirados no arcade.',
    accent: 'purple',
  },
  {
    icon: TrendingUp,
    title: 'Sistema de Progressão',
    text: 'Acompanhe sua evolução com níveis, metas e feedback contínuo.',
    accent: 'cyan',
  },
  {
    icon: Trophy,
    title: 'Ranking e Conquistas',
    text: 'Motivação extra com placar, recordes e marcos de aprendizado.',
    accent: 'purple',
  },
  {
    icon: LineChart,
    title: 'Histórico de Evolução',
    text: 'Revise submissões anteriores e entenda como seu raciocínio melhorou.',
    accent: 'cyan',
  },
];

export default function AboutHowItWorks() {
  return (
    <div className="about-how-grid">
      {ITEMS.map(({ icon: Icon, title, text, accent }) => (
        <article key={title} className={`about-glass-card about-glass-card--${accent}`}>
          <span className="about-glass-card__icon">
            <Icon size={22} />
          </span>
          <h3>{title}</h3>
          <p>{text}</p>
        </article>
      ))}
    </div>
  );
}
