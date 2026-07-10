import { useEffect, useState } from 'react';
import RichTextSurface from './RichTextSurface';
import { useAuth } from '../context/AuthContext';
import * as data from '../services/dataService';

export default function SubcardEditor({ subcardId, backLabel, onBack, onNavigateToSubcard, onSubcardsChanged, onDeleted }) {
  const { user } = useAuth();
  const [subcard, setSubcard] = useState(() => data.getSubcard(user.uid, subcardId));

  useEffect(() => {
    setSubcard(data.getSubcard(user.uid, subcardId));
  }, [subcardId, user.uid]);

  function handleChange(patch) {
    const updated = data.updateSubcard(user.uid, subcardId, patch);
    setSubcard(updated);
    onSubcardsChanged?.();
  }

  function handleDelete() {
    if (!confirm('Eliminare definitivamente questa sottoscheda? Se è collegata in altri fogli, quei collegamenti smetteranno di funzionare.')) {
      return;
    }
    data.deleteSubcard(user.uid, subcardId);
    onSubcardsChanged?.();
    onDeleted?.();
  }

  if (!subcard) {
    return (
      <div className="editor-wrap">
        <p className="modal-subtitle">Questa sottoscheda non esiste più.</p>
        <button className="book-nav-btn" onClick={onBack}>◀ {backLabel || 'Torna alla pagina'}</button>
      </div>
    );
  }

  const topRow = (
    <div className="page-sheet-top">
      <button className="text-link-btn" onClick={onBack}>◀ {backLabel || 'Torna alla pagina'}</button>
      <div className="page-sheet-actions">
        <span className="subcard-tag">📑 Sottoscheda</span>
        <button className="text-link-btn danger" onClick={handleDelete} title="Elimina sottoscheda">
          Elimina
        </button>
      </div>
    </div>
  );

  return (
    <RichTextSurface
      documentId={subcard.id}
      title={subcard.title}
      contentHtml={subcard.body}
      titlePlaceholder="Titolo della sottoscheda"
      onChange={(patch) => {
        // Nella sottoscheda il "contenuto" si chiama `body`, non `contentHtml`
        if ('contentHtml' in patch) handleChange({ body: patch.contentHtml });
        if ('title' in patch) handleChange({ title: patch.title });
      }}
      onNavigateToSubcard={onNavigateToSubcard}
      onSubcardsChanged={onSubcardsChanged}
      topRow={topRow}
    />
  );
}
