import { useState } from 'react';
import MoveModal from './MoveModal';

function preview(html) {
  const text = (html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.length > 90 ? text.slice(0, 90) + '…' : text;
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('it-IT', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function PageList({
  pages,
  notebooks,
  currentNotebookId,
  activePageId,
  onSelectPage,
  onMovePages,
}) {
  const [selected, setSelected] = useState([]);
  const [showMove, setShowMove] = useState(false);

  function toggle(id) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  function handleMove(targetNotebookId) {
    onMovePages(selected, targetNotebookId);
    setSelected([]);
    setShowMove(false);
  }

  return (
    <div className="page-list">
      <div className="page-list-header">
        <h3 className="page-list-title">Fogli</h3>
        {selected.length > 0 && (
          <button className="move-btn" onClick={() => setShowMove(true)}>
            Sposta ({selected.length})
          </button>
        )}
      </div>

      <div className="page-list-scroll">
        {pages.length === 0 && (
          <p className="page-list-empty">Ancora nessun foglio scritto in questo quaderno.</p>
        )}
        {pages.map((p) => (
          <div
            key={p.id}
            className={`page-item ${p.id === activePageId ? 'active' : ''}`}
          >
            <input
              type="checkbox"
              checked={selected.includes(p.id)}
              onChange={() => toggle(p.id)}
              onClick={(e) => e.stopPropagation()}
            />
            <div className="page-item-body" onClick={() => onSelectPage(p.id)}>
              <p className="page-item-date">{formatDate(p.date)}</p>
              <p className="page-item-title">{p.title || 'Senza titolo'}</p>
              <p className="page-item-preview">{preview(p.contentHtml) || 'Pagina vuota…'}</p>
            </div>
          </div>
        ))}
      </div>

      {showMove && (
        <MoveModal
          notebooks={notebooks}
          currentNotebookId={currentNotebookId}
          count={selected.length}
          onMove={handleMove}
          onClose={() => setShowMove(false)}
        />
      )}
    </div>
  );
}
