function formatDate(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function TrashModal({ items, onRestore, onDeleteForever, onEmpty, onClose }) {
  return (
    <div className="modal-overlay">
      <div className="modal-box modal-box-wide">
        <div className="trash-header">
          <h2 className="modal-title">Cestino</h2>
          {items.length > 0 && (
            <button
              className="text-link-btn"
              onClick={() => {
                if (confirm('Svuotare il cestino? I fogli non saranno più recuperabili.')) onEmpty();
              }}
            >
              Svuota cestino
            </button>
          )}
        </div>
        <p className="modal-subtitle">
          I fogli restano qui 60 giorni, poi vengono eliminati automaticamente.
        </p>

        {items.length === 0 ? (
          <p className="modal-subtitle">Il cestino è vuoto.</p>
        ) : (
          <div className="trash-list">
            {items.map((p) => (
              <div key={p.id} className="trash-item">
                <div className="trash-item-body">
                  <p className="trash-item-title">{p.title || 'Senza titolo'}</p>
                  <p className="trash-item-meta">
                    {p.notebookName} · eliminato il {formatDate(p.deletedAt)}
                  </p>
                </div>
                <div className="trash-item-actions">
                  <button className="text-link-btn" onClick={() => onRestore(p.id)}>
                    Ripristina
                  </button>
                  <button
                    className="text-link-btn danger"
                    onClick={() => {
                      if (confirm('Eliminare per sempre questo foglio?')) onDeleteForever(p.id);
                    }}
                  >
                    Elimina per sempre
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <button className="modal-cancel" onClick={onClose}>Chiudi</button>
      </div>
    </div>
  );
}
