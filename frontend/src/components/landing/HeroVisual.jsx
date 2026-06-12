import ProgressCard from './floating/ProgressCard';
import CodeBadge from './floating/CodeBadge';
import XpBadge from './floating/XpBadge';
import RankingCard from './floating/RankingCard';

function RetroMonitor() {
  return (
    <div className="hero-visual__monitor">
      <div className="hero-visual__bezel">
        <div className="hero-visual__screen">
          <div className="hero-visual__scanlines" />
          <div className="hero-visual__screen-content">
            <div className="hero-visual__line hero-visual__line--purple">&gt; python arcade.exe</div>
            <div className="hero-visual__line">&gt; carregando desafios...</div>
            <div className="hero-visual__line hero-visual__line--cyan">&gt; IA pronta [OK]</div>
            <div className="hero-visual__screen-bar">
              <div className="hero-visual__screen-bar-fill" />
            </div>
          </div>
        </div>
      </div>
      <div className="hero-visual__stand" />
    </div>
  );
}

export default function HeroVisual() {
  return (
    <div className="hero-visual" aria-hidden="true">
      <div className="hero-visual__glow hero-visual__glow--purple" />
      <div className="hero-visual__glow hero-visual__glow--cyan" />

      <div className="hero-visual__scene">
        <ProgressCard />
        <CodeBadge />
        <RetroMonitor />
        <XpBadge />
        <RankingCard />
      </div>
    </div>
  );
}
