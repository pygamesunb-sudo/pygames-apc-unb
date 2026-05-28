export default function CodeDisplay({ currentScript }) {
  return (
    <div className="snake-code-display" style={{ userSelect: 'none', width: '100%', overflow: 'hidden' }}>
      <div className="editor-tab">
        <span className="editor-tab-title font-mono text-muted">script.py</span>
      </div>
      <div className="editor-lines font-mono" style={{ overflowX: 'auto', width: '100%', whiteSpace: 'nowrap' }}>
        {currentScript.lines.map((line, idx) => {
          return (
            <div key={idx} className="editor-line">
              <span className="line-num">{idx + 1}</span>
              <span className="line-text">
                {line}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
