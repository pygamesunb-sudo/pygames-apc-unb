export default function CodeDisplay({ currentScript, currentTokenIdx }) {
  return (
    <div className="snake-code-display" style={{ userSelect: 'none', width: '100%', overflow: 'hidden' }}>
      <div className="editor-tab" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: '12px' }}>
        <span className="editor-tab-title font-mono text-muted">script.py</span>
        {currentScript.tokens && (
          <span className="text-accent font-mono" style={{ fontSize: '0.8rem' }}>
            Token: {currentTokenIdx + 1}/{currentScript.tokens.length}
          </span>
        )}
      </div>
      <div className="editor-lines font-mono" style={{ overflowX: 'auto', width: '100%', whiteSpace: 'nowrap', padding: '10px' }}>
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

      {/* Indicador de progresso horizontal do código (Token Flow) */}
      {currentScript.tokens && (
        <div className="token-flow-container" style={{
          padding: '8px 12px',
          background: 'rgba(9, 13, 22, 0.65)',
          borderTop: '1px solid rgba(34, 211, 238, 0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          overflowX: 'auto',
          whiteSpace: 'nowrap'
        }}>
          <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 'bold', marginRight: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Fila:</span>
          {currentScript.tokens.map((token, idx) => {
            const isCompleted = idx < currentTokenIdx;
            const isCurrent = idx === currentTokenIdx;
            
            let border = '1px solid rgba(255, 255, 255, 0.08)';
            let color = '#64748b';
            let bg = 'transparent';
            let shadow = 'none';
            
            if (isCompleted) {
              color = '#10b981';
              border = '1px solid rgba(16, 185, 129, 0.3)';
              bg = 'rgba(16, 185, 129, 0.05)';
            } else if (isCurrent) {
              color = '#22d3ee';
              border = '1px solid #22d3ee';
              bg = 'rgba(34, 211, 238, 0.15)';
              shadow = '0 0 8px rgba(34, 211, 238, 0.4)';
            }
            
            return (
              <span 
                key={idx} 
                className={`font-mono ${isCurrent ? 'animate-pulse' : ''}`}
                style={{
                  fontSize: '0.8rem',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  border,
                  color,
                  background: bg,
                  boxShadow: shadow,
                  fontWeight: isCurrent ? 'bold' : 'normal',
                  transition: 'all 0.15s ease-in-out'
                }}
              >
                {token}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
