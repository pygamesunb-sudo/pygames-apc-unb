import { useCallback, useRef } from 'react';
import LandingHeader from '../components/landing/LandingHeader';
import LandingHero from '../components/landing/LandingHero';
import LandingResources from '../components/landing/LandingResources';
import HeroVisual from '../components/landing/HeroVisual';
import LoginCard from '../components/LoginCard';
import './LandingPage.css';

export default function LandingPage({ error, setError, onLogin }) {
  const loginRef = useRef(null);

  const scrollToLogin = useCallback(() => {
    loginRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  const scrollToResources = useCallback(() => {
    document.getElementById('recursos')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <div className="landing-page">
      <div className="landing-page__bg" />
      <LandingHeader onCtaClick={scrollToLogin} />

      <section id="inicio" className="landing-page__hero-fold">
        <div className="landing-page__hero-container">
          <LandingHero onExplore={scrollToLogin} onLearnMore={scrollToResources} />

          <div className="landing-hero__visual">
            <HeroVisual />
          </div>

          <div className="landing-page__login" ref={loginRef}>
            <LoginCard error={error} setError={setError} onLogin={onLogin} />
          </div>
        </div>
        <div className="landing-page__hero-fade" aria-hidden="true" />
      </section>

      <LandingResources />
    </div>
  );
}
