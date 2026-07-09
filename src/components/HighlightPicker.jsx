import { useRef, useState } from 'react';

const PRESET_COLORS = [
  { name: 'Giallo', hex: '#FFEB3B' },
  { name: 'Verde', hex: '#69F0AE' },
  { name: 'Azzurro', hex: '#80D8FF' },
  { name: 'Rosa', hex: '#FF80AB' },
  { name: 'Arancione', hex: '#FFAB40' },
  { name: 'Viola', hex: '#EA80FC' },
];

export default function HighlightPicker({ savedColors, onApply, onSaveColor, onClose }) {
  const [opacity, setOpacity] = useState(40);
  const [customColor, setCustomColor] = useState('#FFEB3B');
  const popoverRef = useRef(null);

  function apply(hex) {
    onApply(hex, opacity);
  }

  function handleSaveCustom() {
    onSaveColor(customColor);
    apply(customColor);
  }

  return (
    <div className="highlight-popover" ref={popoverRef} onMouseDown={(e) => e.stopPropagation()}>
      <p className="highlight-popover-label">Colori</p>
      <div className="highlight-swatch-row">
        {PRESET_COLORS.map((c) => (
          <button
            key={c.hex}
            className="highlight-swatch"
            style={{ background: c.hex }}
            title={c.name}
            onClick={() => apply(c.hex)}
          />
        ))}
      </div>

      {savedColors.length > 0 && (
        <>
          <p className="highlight-popover-label">Salvati</p>
          <div className="highlight-swatch-row">
            {savedColors.map((hex) => (
              <button
                key={hex}
                className="highlight-swatch"
                style={{ background: hex }}
                title={hex}
                onClick={() => apply(hex)}
              />
            ))}
          </div>
        </>
      )}

      <p className="highlight-popover-label">Colore personalizzato</p>
      <div className="highlight-custom-row">
        <input
          type="color"
          value={customColor}
          onChange={(e) => setCustomColor(e.target.value)}
        />
        <button type="button" className="place-tab-btn" onClick={handleSaveCustom}>
          Salva e usa
        </button>
      </div>

      <p className="highlight-popover-label">Trasparenza</p>
      <div className="highlight-opacity-row">
        <input
          type="number"
          min={10}
          max={100}
          value={opacity}
          onChange={(e) => setOpacity(Math.max(10, Math.min(100, Number(e.target.value) || 0)))}
        />
        <span>%</span>
      </div>

      <button className="modal-cancel" onClick={onClose}>Chiudi</button>
    </div>
  );
}
