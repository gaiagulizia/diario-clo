import { useMemo, useState } from 'react';
import MoveModal from './MoveModal';
import TagAssignModal from './TagAssignModal';

function stripHtml(html) {
  return (html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function preview(html) {
  const text = stripHtml(html);
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
  onDeletePages,
  onAssignTags,
}) {
  const [editMode, setEditMode] = useState(false);
  const [selected, setSelected] = useState([]);
  const [showMove, setShowMove] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [search, setSearch] = useState('');
  const [filterTags, setFilterTags] = useState([]);

  const allTagsHere = useMemo(() => {
    const set = new Set();
    pages.forEach((p) => (p.tags || []).forEach((t) => set.add(t)));
    return [...set].sort();
  }, [pages]);

  const filteredPages = useMemo(() => {
    const q = search.trim().toLowerCase();
    return pages.filter((p) => {
      if (filterTags.length > 0) {
        const pageTags = p.tags || [];
        if (!filterTags.some((t) => pageTags.includes(t))) return false;
      }
      if (!q) return true;
      const haystack = `${p.title || ''} ${stripHtml(p.contentHtml)} ${(p.tags || []).join(' ')}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [pages, search, filterTags]);

  function toggleSelect(id) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  function toggleFilterTag(tag) {
    setFilterTags((t) => (t.includes(tag) ? t.filter((x) => x !== tag) : [...t, tag]));
  }

  function exitEditMode() {
    setEditMode(false);
    setSelected([]);
  }

  function handleMove(targetNotebookId) {
    onMovePages(selected, targetNotebookId);
    setSelected([]);
    setShowMove(false);
  }

  function handleBulkDelete() {
    if (!confirm(`Spostare ${selected.length} foglio/i nel cestino?`)) return;
    onDeletePages(selected);
    setSelected([]);
  }

  function handleAssignTags(tags) {
    onAssignTags(selected, tags);
    setShowTagModal(false);
  }

  return (
    <div className="page-list">
      <div className="page-list-header">
        <h3 className="page-list-title">Fogli</h3>
        <button
          className={`icon-btn ${editMode ? 'active' : ''}`}
          title={editMode ? 'Esci dalla modifica' : 'Seleziona fogli'}
          onClick={() => (editMode ? exitEditMode() : setEditMode(true))}
        >
          ✎
        </button>
      </div>

      <div className="page-list-search">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cerca nei fogli o nei tag…"
        />
      </div>

      {allTagsHere.length > 0 && (
        <div className="tag-filter-row">
          {allTagsHere.map((t) => (
            <button
              key={t}
              className={`tag-chip ${filterTags.includes(t) ? 'active' : ''}`}
              onClick={() => toggleFilterTag(t)}
            >
              #{t}
            </button>
          ))}
        </div>
      )}

      {editMode && selected.length > 0 && (
        <div className="bulk-action-bar">
          <button className="move-btn" onClick={() => setShowMove(true)}>Sposta ({selected.length})</button>
          <button className="move-btn" onClick={() => setShowTagModal(true)}>Tag</button>
          <button className="move-btn move-btn-danger" onClick={handleBulkDelete}>Elimina</button>
        </div>
      )}

      <div className="page-list-scroll">
        {filteredPages.length === 0 && (
          <p className="page-list-empty">
            {pages.length === 0 ? 'Ancora nessun foglio scritto in questo quaderno.' : 'Nessun foglio corrisponde alla ricerca.'}
          </p>
        )}
        {filteredPages.map((p) => (
          <div
            key={p.id}
            className={`page-item ${p.id === activePageId ? 'active' : ''}`}
          >
            {editMode && (
              <input
                type="checkbox"
                checked={selected.includes(p.id)}
                onChange={() => toggleSelect(p.id)}
                onClick={(e) => e.stopPropagation()}
              />
            )}
            <div className="page-item-body" onClick={() => onSelectPage(p.id)}>
              <p className="page-item-date">{formatDate(p.date)}</p>
              <p className="page-item-title">{p.title || 'Senza titolo'}</p>
              <p className="page-item-preview">{preview(p.contentHtml) || 'Pagina vuota…'}</p>
              {(p.tags || []).length > 0 && (
                <div className="page-item-tags">
                  {p.tags.map((t) => (
                    <span key={t} className="tag-chip-small">#{t}</span>
                  ))}
                </div>
              )}
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

      {showTagModal && (
        <TagAssignModal
          count={selected.length}
          onAssign={handleAssignTags}
          onClose={() => setShowTagModal(false)}
        />
      )}
    </div>
  );
}
