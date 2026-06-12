import {
  BrainCircuit,
  Bot,
  Gamepad2,
  TrendingUp,
  Trophy,
  Award,
  History,
  ShieldCheck,
  Cpu,
} from 'lucide-react';

const RESOURCES = [
  {
    icon: BrainCircuit,
    title: 'Desafios Personalizados',
    text: 'Exercícios de programação gerados para apoiar diferentes níveis de aprendizagem.',
    accent: 'purple',
  },
  {
    icon: Bot,
    title: 'Aprendizagem com IA',
    text: 'A Inteligência Artificial é utilizada como recurso educacional para apoiar a prática e o desenvolvimento do raciocínio lógico.',
    accent: 'cyan',
  },
  {
    icon: Gamepad2,
    title: 'Mini-games Educacionais',
    text: 'Jogos simples ajudam a manter o engajamento enquanto o estudante aprende programação.',
    accent: 'purple',
  },
  {
    icon: TrendingUp,
    title: 'Sistema de Progressão',
    text: 'Acompanhe sua evolução através de níveis, experiência e histórico de atividades.',
    accent: 'cyan',
  },
  {
    icon: Trophy,
    title: 'Ranking',
    text: 'Compare seu desempenho e acompanhe sua posição entre os participantes.',
    accent: 'purple',
  },
  {
    icon: Award,
    title: 'Conquistas',
    text: 'Desbloqueie recompensas conforme avança em sua jornada de aprendizagem.',
    accent: 'cyan',
  },
  {
    icon: History,
    title: 'Histórico de Aprendizagem',
    text: 'Visualize desafios resolvidos, progresso e desempenho ao longo do tempo.',
    accent: 'purple',
  },
  {
    icon: ShieldCheck,
    title: 'Uso Responsável da IA',
    text: 'A plataforma incentiva o uso consciente da Inteligência Artificial como ferramenta de apoio ao aprendizado, sem substituir o estudante.',
    accent: 'cyan',
  },
];

export default function LandingResources() {
  return (
    <section id="recursos" className="landing-resources">
      <div className="landing-resources__inner">
        <div className="landing-resources__header">
          <h2 className="landing-resources__title">Recursos da Plataforma</h2>
          <p className="landing-resources__subtitle">
            Conheça as principais ferramentas desenvolvidas para tornar o aprendizado de
            programação mais interativo, acessível e motivador.
          </p>
        </div>

        <div className="landing-resources__grid">
          {RESOURCES.map(({ icon: Icon, title, text, accent }) => (
            <article
              key={title}
              className={`landing-resource-card landing-resource-card--${accent}`}
            >
              <span className="landing-resource-card__icon">
                <Icon size={22} />
              </span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>

        <div className="landing-resources__highlight">
          <span className="landing-resources__highlight-icon">
            <Cpu size={24} />
          </span>
          <div>
            <h3>Tecnologia para Aprender</h3>
            <p>
              O Python Arcade utiliza Inteligência Artificial, gamificação e prática contínua
              para apoiar o desenvolvimento do pensamento computacional. A tecnologia atua como
              ferramenta educacional, incentivando a autonomia, a experimentação e a resolução
              de problemas.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
