import { Zap } from 'lucide-react';

export default function XpBadge() {
  return (
    <div className="float-panel float-panel--badge float-panel--xp">
      <Zap size={14} />
      <span>+250 XP</span>
    </div>
  );
}
