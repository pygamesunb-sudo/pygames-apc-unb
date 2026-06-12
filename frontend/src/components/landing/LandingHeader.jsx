import { Gamepad2, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const NAV_LINKS = [
  { label: 'Início', href: '/', type: 'route' },
  { label: 'Recursos', href: '/#recursos', type: 'route-hash' },
  { label: 'Como Funciona', href: '/#como-funciona', type: 'route-hash' },
  { label: 'Sobre', href: '/sobre', type: 'route' },
  { label: 'Contato', href: '/#contato', type: 'route-hash' },
];

export default function LandingHeader({ onCtaClick, activePage }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavClick = (link) => {
    setMenuOpen(false);

    if (link.type === 'route') {
      navigate(link.href);
      return;
    }

    if (link.type === 'route-hash') {
      const [pathPart, hash] = link.href.split('#');
      const targetPath = pathPart || '/';
      if (location.pathname !== targetPath) {
        window.location.href = link.href;
        return;
      }
      const el = document.getElementById(hash);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }

    const el = document.querySelector(link.href);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const isActive = (link) => {
    if (activePage === 'sobre' && link.href === '/sobre') return true;
    if (!activePage && link.href === '/' && location.pathname === '/') return true;
    return false;
  };

  return (
    <header className="landing-header">
      <div className="landing-header__inner">
        <button
          type="button"
          className="landing-logo"
          onClick={() => navigate('/')}
        >
          <span className="landing-logo__icon">
            <Gamepad2 size={22} />
          </span>
          <span className="landing-logo__text">
            <span className="retro-neon-purple">Python</span>
            <span className="retro-neon-cyan"> Arcade</span>
          </span>
        </button>

        <nav className={`landing-nav ${menuOpen ? 'landing-nav--open' : ''}`}>
          {NAV_LINKS.map((link) => (
            <button
              key={link.href}
              type="button"
              className={`landing-nav__link ${isActive(link) ? 'landing-nav__link--active' : ''}`}
              onClick={() => handleNavClick(link)}
            >
              {link.label}
            </button>
          ))}
          <button type="button" className="landing-nav__cta landing-nav__cta--mobile" onClick={onCtaClick}>
            Começar Agora
          </button>
        </nav>

        <button type="button" className="landing-header__cta" onClick={onCtaClick}>
          Começar Agora
        </button>

        <button
          type="button"
          className="landing-header__menu-btn"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
    </header>
  );
}
