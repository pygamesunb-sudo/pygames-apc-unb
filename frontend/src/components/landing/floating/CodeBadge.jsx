import { Code2 } from 'lucide-react';

export default function CodeBadge() {
  return (
    <div className="float-panel float-panel--badge float-panel--code">
      <Code2 size={14} />
      <span>def solve():</span>
    </div>
  );
}
