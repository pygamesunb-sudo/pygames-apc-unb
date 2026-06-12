import { GraduationCap, Accessibility, Users, ShieldCheck } from 'lucide-react';

const VALUES = [
  {
    icon: GraduationCap,
    title: 'Aprendizagem',
    text: 'Colocar o desenvolvimento do raciocínio lógico e do pensamento computacional no centro de tudo.',
  },
  {
    icon: Accessibility,
    title: 'Acessibilidade',
    text: 'Tornar o primeiro contato com programação menos intimidador e mais acolhedor para todos.',
  },
  {
    icon: Users,
    title: 'Colaboração',
    text: 'Construir em equipe, compartilhar conhecimento e aprender junto com a comunidade.',
  },
  {
    icon: ShieldCheck,
    title: 'Inovação Responsável',
    text: 'Usar IA como apoio pedagógico, sem substituir professores nem resolver pelos estudantes.',
  },
];

export default function AboutValues() {
  return (
    <div className="about-values-grid">
      {VALUES.map(({ icon: Icon, title, text }) => (
        <article key={title} className="about-glass-card about-glass-card--purple">
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
