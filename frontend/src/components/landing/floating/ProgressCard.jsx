import { Zap } from 'lucide-react';

export default function ProgressCard() {
  return (
    <div className="float-panel float-panel--progress">
      <div className="float-panel__header">
        <Zap size={13} />
        <span>Progresso</span>
      </div>
      <div className="float-panel__value">Nível 12</div>
      <div className="float-panel__bar">
        <div className="float-panel__bar-fill" style={{ width: '72%' }} />
      </div>
      <span className="float-panel__meta">7.200 / 10.000 XP</span>
    </div>
  );
}
