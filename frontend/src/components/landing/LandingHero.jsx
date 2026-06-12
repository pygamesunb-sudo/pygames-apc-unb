import { Sparkles, ArrowRight, ChevronRight } from 'lucide-react';

export default function LandingHero({ onExplore, onLearnMore }) {
  return (
    <div className="landing-hero">
      <span className="landing-badge">
        <Sparkles size={14} />
        APRENDA. PRATIQUE. EVOLUA.
      </span>

      <h1 className="landing-hero__title">
        Aprenda Python de forma divertida e inteligente.
      </h1>

      <p className="landing-hero__text">
        Exercícios personalizados gerados por IA, mini-games retrô e um sistema de
        gamificação para transformar seu aprendizado em uma jornada prática.
      </p>

      <div className="landing-hero__actions">
        <button type="button" className="landing-btn landing-btn--primary" onClick={onExplore}>
          Explorar Plataforma
          <ArrowRight size={18} />
        </button>
        <button type="button" className="landing-btn landing-btn--secondary" onClick={onLearnMore}>
          Saiba mais
          <ChevronRight size={18} />
        </button>
      </div>

      <div id="como-funciona" className="landing-section-anchor" />
      <div id="sobre" className="landing-section-anchor" />
      <div id="contato" className="landing-section-anchor" />
    </div>
  );
}
