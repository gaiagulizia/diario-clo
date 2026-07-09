import { useMemo, useState } from 'react';

export default function SubcardComposerModal({ mode, selectedText, existingSubcards, onCreate, onLink, onClose }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return existingSubcards;
    return existingSubcards.filter((s) => s.title.toLowerCase().includes(q));
  }, [existingSubcards, search]);

  function handleCreateSubmit(e) {
    e.preventDefault();
    if (!title.trim()) {
      setError('Il titolo della sottoscheda è obbligatorio.');
      return;
    }
    onCreate({ title: title.trim(), body: body.trim() });
  }

  return (
    <div className="modal-overlay">
      <div className="modal-box modal-box-wide">
        <h2 className="modal-title">{mode === 'create' ? 'Nuova sottoscheda' : 'Collega una sottoscheda'}</h2>
        <p className="modal-subtitle">
          Testo selezionato: <em>“{selectedText}”</em>
        </p>

        {mode === 'create' ? (
          <form onSubmit={handleCreateSubmit}>
            <div className="field">
              <label>Titolo della sottoscheda *</label>
              <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Es. Il ristorante di cui parlo sempre"
              />
            </div>
            <div className="field">
              <label>Testo della sottoscheda</label>
              <textarea
                rows={6}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Scrivi qui il contenuto…"
              />
            </div>
            {error && <p className="error-text">{error}</p>}
            <button type="submit" className="btn btn-primary">Crea e collega</button>
          </form>
        ) : (
          <>
            <div className="field">
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cerca una sottoscheda per titolo…"
              />
            </div>
            {filtered.length === 0 ? (
              <p className="modal-subtitle">Nessuna sottoscheda trovata. Creane una nuova.</p>
            ) : (
              <div className="modal-target-list">
                {filtered.map((s) => (
                  <button key={s.id} className="modal-target" onClick={() => onLink(s.id)}>
                    <span>{s.title}</span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        <button className="modal-cancel" onClick={onClose}>Annulla</button>
      </div>
    </div>
  );
}
