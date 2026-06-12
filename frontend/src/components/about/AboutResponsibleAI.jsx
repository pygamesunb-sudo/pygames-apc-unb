import {
  PenLine,
  Brain,
  RefreshCw,
  Compass,
  HeartHandshake,
  ShieldCheck,
  Scale,
} from 'lucide-react';

const PRINCIPLES = [
  {
    icon: PenLine,
    title: 'Aprendizagem Ativa',
    text: 'A plataforma incentiva o estudante a resolver problemas e construir soluções próprias.',
    accent: 'purple',
  },
  {
    icon: Brain,
    title: 'Pensamento Computacional',
    text: 'A IA apoia atividades que desenvolvem lógica, análise de problemas e tomada de decisões.',
    accent: 'cyan',
  },
  {
    icon: RefreshCw,
    title: 'Prática Contínua',
    text: 'Novos desafios podem ser gerados para ampliar as oportunidades de treino e aprendizagem.',
    accent: 'purple',
  },
  {
    icon: Compass,
    title: 'Autonomia',
    text: 'O estudante mantém o controle do processo de aprendizagem e da construção do conhecimento.',
    accent: 'cyan',
  },
  {
    icon: HeartHandshake,
    title: 'Tecnologia com Propósito',
    text: 'A Inteligência Artificial é utilizada para apoiar a educação e tornar a aprendizagem mais acessível.',
    accent: 'purple',
  },
  {
    icon: ShieldCheck,
    title: 'Uso Ético da IA',
    text: 'O projeto incentiva o uso consciente, crítico e responsável das tecnologias baseadas em Inteligência Artificial.',
    accent: 'cyan',
  },
];

export default function AboutResponsibleAI() {
  return (
    <>
      <p className="about-lead">
        A tecnologia deve ampliar oportunidades de aprendizagem e não substituir o processo de
        construção do conhecimento.
      </p>

      <p className="about-ai-principle">
        A IA apoia o aprendizado, mas o estudante continua sendo o protagonista.
      </p>

      <div className="about-ai-institutional about-ai-institutional--spaced">
        <p>
          No Python Arcade, a Inteligência Artificial é utilizada como ferramenta de apoio à aprendizagem.
          Seu papel é auxiliar na criação de experiências mais personalizadas, incentivar a prática e
          ampliar as oportunidades de desenvolvimento do raciocínio lógico e do pensamento computacional.
        </p>
        <p>
          Acreditamos que aprender programação envolve experimentar, errar, testar hipóteses e construir
          soluções. Por isso, a IA atua como recurso complementar ao processo educacional, incentivando
          a autonomia do estudante e o uso consciente da tecnologia.
        </p>
      </div>

      <div className="about-how-grid">
        {PRINCIPLES.map(({ icon: Icon, title, text, accent }) => (
          <article key={title} className={`about-glass-card about-glass-card--${accent}`}>
            <span className="about-glass-card__icon">
              <Icon size={22} />
            </span>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </div>

      <div className="about-ai-highlight about-ai-highlight--final">
        <span className="about-ai-highlight__icon">
          <Scale size={22} />
        </span>
        <p>
          Acreditamos que a melhor forma de utilizar Inteligência Artificial na educação é fortalecer
          a capacidade humana de aprender, criar e resolver problemas.
        </p>
      </div>
    </>
  );
}
