export default function MobileDpad({ onDirection }) {
  const handlePress = (e, dx, dy) => {
    // Evita zoom, rolagem e outros comportamentos indesejados no celular
    if (e.cancelable) e.preventDefault();
    onDirection(dx, dy);
  };

  return (
    <div className="mobile-dpad-container" style={{ userSelect: 'none' }}>
      <button 
        className="dpad-btn dpad-up" 
        onTouchStart={(e) => handlePress(e, 0, -1)}
        onMouseDown={(e) => onDirection(0, -1)}
      >
        ▲
      </button>
      <div className="dpad-row">
        <button 
          className="dpad-btn dpad-left" 
          onTouchStart={(e) => handlePress(e, -1, 0)}
          onMouseDown={(e) => onDirection(-1, 0)}
        >
          ◀
        </button>
        <div className="dpad-center"></div>
        <button 
          className="dpad-btn dpad-right" 
          onTouchStart={(e) => handlePress(e, 1, 0)}
          onMouseDown={(e) => onDirection(1, 0)}
        >
          ▶
        </button>
      </div>
      <button 
        className="dpad-btn dpad-down" 
        onTouchStart={(e) => handlePress(e, 0, 1)}
        onMouseDown={(e) => onDirection(0, 1)}
      >
        ▼
      </button>
    </div>
  );
}
