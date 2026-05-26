export default function MobileDpad({ onDirection }) {
  return (
    <div className="mobile-dpad-container" style={{ userSelect: 'none' }}>
      <button className="dpad-btn dpad-up" onClick={() => onDirection(0, -1)}>▲</button>
      <div className="dpad-row">
        <button className="dpad-btn dpad-left" onClick={() => onDirection(-1, 0)}>◀</button>
        <div className="dpad-center"></div>
        <button className="dpad-btn dpad-right" onClick={() => onDirection(1, 0)}>▶</button>
      </div>
      <button className="dpad-btn dpad-down" onClick={() => onDirection(0, 1)}>▼</button>
    </div>
  );
}
