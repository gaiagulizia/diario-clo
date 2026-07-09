import { useEffect, useState } from 'react';

export default function SubcardModal({ subcard, allowUnlink = true, onSave, onUnlink, onClose }) {
  const [mode, setMode] = useState('view');
  const [title, setTitle] = useState(subcard.title);
  const [body, setBody] = useState(subcard.body);
  const [error, setError] = useState('');

  useEffect(() => {
    setTitle(subcard.title);
    setBody(subcard.body);
    setMode('view');
    setError('');
  }, [subcard.id]);

  function handleSave() {
    if (!title.trim()) {
      setError('Il titolo non può essere vuoto.');
      return;
    }
    onSave(subcard.id, { title: title.trim(), body: body.trim() });
    setMode('view');
  }

  function handleCancelEdit() {
    setTitle(subcard.title);
    setBody(subcard.body);
    setError('');
    setMode('view');
  }

  return (
    <div className="modal-overlay">
      <div className="place-card-modal">
        <div className="place-card-body">
          {mode === 'view' ? (
            <>
              <div className="place-card-top-row">
                <h2 className="place-card-name">{subcard.title}</h2>
                <button className="icon-btn" title="Modifica" onClick={() => setMode('edit')}>✎</button>
              </div>
              <p className="subcard-body-text">{subcard.body || 'Nessun testo.'}</p>
              <button className="modal-cancel" onClick={onClose}>Chiudi</button>
            </>
          ) : (
            <>
              <h2 className="place-card-name" style={{ marginBottom: 14 }}>Modifica sottoscheda</h2>
              <div className="field">
                <label>Titolo *</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="field">
                <label>Testo</label>
                <textarea rows={6} value={body} onChange={(e) => setBody(e.target.value)} />
              </div>
              {error && <p className="error-text">{error}</p>}
              <div className="place-drawer-actions">
                <button className="btn btn-primary" onClick={handleSave}>Salva</button>
                <button className="modal-cancel" onClick={handleCancelEdit}>Annulla modifiche</button>
                {allowUnlink && (
                  <button
                    className="text-link-btn danger"
                    onClick={() => {
                      if (confirm('Rimuovere il collegamento a questa sottoscheda da questo foglio? La sottoscheda resterà disponibile per altri fogli.')) {
                        onUnlink(subcard.id);
                      }
                    }}
                  >
                    Rimuovi collegamento da questo foglio
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
