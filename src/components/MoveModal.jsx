export default function MoveModal({ notebooks, currentNotebookId, count, onMove, onClose }) {
  const targets = notebooks.filter((n) => n.id !== currentNotebookId);

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h2 className="modal-title">Sposta {count} foglio/i</h2>
        <p className="modal-subtitle">Scegli il quaderno di destinazione.</p>

        {targets.length === 0 ? (
          <p className="modal-subtitle">
            Non hai altri quaderni. Creane uno prima di spostare i fogli.
          </p>
        ) : (
          <div className="modal-target-list">
            {targets.map((n) => (
              <button key={n.id} className="modal-target" onClick={() => onMove(n.id)}>
                <span className="color-dot" style={{ background: n.color }} />
                <span>{n.name}</span>
              </button>
            ))}
          </div>
        )}

        <button className="modal-cancel" onClick={onClose}>Annulla</button>
      </div>
    </div>
  );
}
