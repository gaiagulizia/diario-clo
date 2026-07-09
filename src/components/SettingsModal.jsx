import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import * as data from '../services/dataService';

export default function SettingsModal({ onClose, onChanged }) {
  const { user } = useAuth();
  const [tags, setTags] = useState(() => data.getAllTags(user.uid));
  const [editingTag, setEditingTag] = useState(null);
  const [draftName, setDraftName] = useState('');

  function refresh() {
    setTags(data.getAllTags(user.uid));
    onChanged?.();
  }

  function startRename(tag) {
    setEditingTag(tag);
    setDraftName(tag);
  }

  function commitRename() {
    const clean = draftName.trim().replace(/^#/, '').toLowerCase();
    if (clean && clean !== editingTag) {
      data.renameTag(user.uid, editingTag, clean);
    }
    setEditingTag(null);
    refresh();
  }

  function handleDelete(tag) {
    if (!confirm(`Eliminare il tag "#${tag}" da tutti i fogli?`)) return;
    data.deleteTag(user.uid, tag);
    refresh();
  }

  return (
    <div className="modal-overlay">
      <div className="modal-box modal-box-wide">
        <h2 className="modal-title">Impostazioni</h2>
        <p className="modal-subtitle">Gestisci i tag usati nei tuoi fogli.</p>

        {tags.length === 0 ? (
          <p className="modal-subtitle">Non hai ancora usato nessun tag.</p>
        ) : (
          <div className="settings-tag-list">
            {tags.map(({ tag, count }) => (
              <div key={tag} className="settings-tag-row">
                {editingTag === tag ? (
                  <input
                    autoFocus
                    className="notebook-input"
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => e.key === 'Enter' && commitRename()}
                  />
                ) : (
                  <span className="settings-tag-name">#{tag} <span className="settings-tag-count">({count})</span></span>
                )}
                <div className="trash-item-actions">
                  <button className="trash-btn" onClick={() => startRename(tag)}>Rinomina</button>
                  <button className="trash-btn trash-btn-danger" onClick={() => handleDelete(tag)}>Elimina</button>
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
