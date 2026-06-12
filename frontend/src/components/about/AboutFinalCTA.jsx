import { ArrowRight, Sparkles } from 'lucide-react';

export default function AboutFinalCTA({ onCtaClick }) {
  return (
    <section className="about-final-cta">
      <div className="about-final-cta__card animate-fade-in">
        <span className="about-badge">
          <Sparkles size={14} />
          APRENDA. PRATIQUE. EVOLUA.
        </span>
        <h2>Aprenda. Pratique. Evolua.</h2>
        <p>
          Python Arcade é um projeto criado por estudantes para estudantes, com o objetivo
          de tornar o aprendizado de programação mais acessível, motivador e significativo.
        </p>
        <button type="button" className="landing-btn landing-btn--primary" onClick={onCtaClick}>
          Começar Agora
          <ArrowRight size={18} />
        </button>
      </div>
    </section>
  );
}
