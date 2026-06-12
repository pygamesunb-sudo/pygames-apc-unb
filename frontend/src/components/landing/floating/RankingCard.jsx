import { Trophy, ChevronUp } from 'lucide-react';

const RANKINGS = [
  { pos: 1, name: 'dev_ninja', rising: true },
  { pos: 2, name: 'py_master', rising: false },
  { pos: 3, name: 'code_hero', rising: false },
];

export default function RankingCard() {
  return (
    <div className="float-panel float-panel--ranking">
      <div className="float-panel__header">
        <Trophy size={13} />
        <span>Ranking</span>
      </div>
      <ul className="float-panel__rank-list">
        {RANKINGS.map(({ pos, name, rising }) => (
          <li key={pos}>
            <span className="float-panel__rank-pos">{pos}</span>
            {name}
            {rising && <ChevronUp size={11} className="float-panel__rank-up" />}
          </li>
        ))}
      </ul>
    </div>
  );
}
