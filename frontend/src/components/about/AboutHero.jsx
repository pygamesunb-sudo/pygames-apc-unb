import { ArrowDown, GraduationCap } from 'lucide-react';

export default function AboutHero({ onCtaClick }) {
  return (
    <header className="about-hero">
      <div className="about-hero__inner animate-fade-in">
        <span className="about-badge">
          <GraduationCap size={14} />
          Projeto acadêmico APC
        </span>
        <h1 className="about-hero__title">
          Uma ideia que nasceu dentro da sala de aula.
        </h1>
        <p className="about-hero__subtitle">
          Quatro estudantes de APC transformaram uma dificuldade comum em uma plataforma
          que une programação, gamificação e Inteligência Artificial.
        </p>
        <button type="button" className="landing-btn landing-btn--primary" onClick={onCtaClick}>
          Conheça nossa história
          <ArrowDown size={18} />
        </button>
      </div>
    </header>
  );
}
