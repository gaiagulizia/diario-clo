import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function NotebookSidebar({
  notebooks,
  currentNotebookId,
  onSelect,
  onCreate,
  onRename,
  onDelete,
  onExportHtml,
  onExportJson,
}) {
  const { user, logout } = useAuth();
  const [editingId, setEditingId] = useState(null);
  const [draftName, setDraftName] = useState('');

  function startEdit(n) {
    setEditingId(n.id);
    setDraftName(n.name);
  }

  function commitEdit() {
    if (draftName.trim()) onRename(editingId, draftName.trim());
    setEditingId(null);
  }

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <p className="sidebar-email">{user?.email}</p>
        <h1 className="sidebar-title">Diario</h1>
      </div>

      <div className="notebook-list">
        {notebooks.map((n) => {
          const active = n.id === currentNotebookId;
          return (
            <div
              key={n.id}
              className={`notebook-item ${active ? 'active' : ''}`}
              style={{ borderLeftColor: n.color }}
              onClick={() => onSelect(n.id)}
            >
              {editingId === n.id ? (
                <input
                  autoFocus
                  className="notebook-input"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={(e) => e.key === 'Enter' && commitEdit()}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="notebook-name">{n.name}</span>
              )}

              <div className="notebook-actions">
                <button
                  className="icon-btn"
                  title="Rinomina"
                  onClick={(e) => {
                    e.stopPropagation();
                    startEdit(n);
                  }}
                >
                  ✎
                </button>
                <button
                  className="icon-btn"
                  title="Elimina quaderno"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Eliminare "${n.name}" e tutti i suoi fogli?`)) onDelete(n.id);
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}

        <button className="new-notebook-btn" onClick={onCreate}>
          + Nuovo quaderno
        </button>
      </div>

      <div className="sidebar-footer">
        <button className="footer-btn" disabled={!currentNotebookId} onClick={onExportHtml}>
          Esporta quaderno (HTML)
        </button>
        <button className="footer-btn" disabled={!currentNotebookId} onClick={onExportJson}>
          Backup quaderno (JSON)
        </button>
        <button className="footer-btn danger" onClick={logout}>
          Esci
        </button>
      </div>
    </div>
  );
}
