import { useState } from 'react';
import { parseTagsInput } from '../services/dataService';

export default function TagAssignModal({ count, onAssign, onClose }) {
  const [input, setInput] = useState('');

  const parsed = parseTagsInput(input);

  function handleSubmit(e) {
    e.preventDefault();
    if (parsed.length === 0) return;
    onAssign(parsed.slice(0, 10));
  }

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h2 className="modal-title">Assegna tag</h2>
        <p className="modal-subtitle">
          A {count} foglio/i selezionato/i. Scrivi i tag come hashtag, separati da spazio (max 10 per foglio).
        </p>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <input
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="#studio #lavoro #viaggio"
            />
          </div>

          {parsed.length > 0 && (
            <div className="tag-filter-row" style={{ marginBottom: 16 }}>
              {parsed.map((t) => (
                <span key={t} className="tag-chip-small">#{t}</span>
              ))}
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={parsed.length === 0}>
            Aggiungi tag
          </button>
        </form>

        <button className="modal-cancel" onClick={onClose}>Annulla</button>
      </div>
    </div>
  );
}
