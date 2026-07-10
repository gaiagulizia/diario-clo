import { useState } from 'react';
import RichTextSurface from './RichTextSurface';
import { exportPageAsHtml } from '../services/exportService';

export default function PageEditor({ page, onChange, onDelete, siblingPages, onNavigate, onNavigateToSubcard, onSubcardsChanged }) {
  const [date, setDate] = useState(page.date?.slice(0, 10) || new Date().toISOString().slice(0, 10));

  function handleDateChange(e) {
    setDate(e.target.value);
    onChange({ date: new Date(e.target.value).toISOString() });
  }

  const siblings = siblingPages || [];
  const idx = siblings.findIndex((p) => p.id === page.id);
  const prevPage = idx > 0 ? siblings[idx - 1] : null;
  const nextPage = idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null;

  const topRow = (
    <div className="page-sheet-top">
      <input type="date" className="date-input" value={date} onChange={handleDateChange} />
      <div className="page-sheet-actions">
        <button
          className="text-link-btn"
          onClick={() => exportPageAsHtml({ ...page, date })}
          title="Esporta questo foglio come HTML"
        >
          Esporta foglio
        </button>
        <button className="text-link-btn" onClick={onDelete} title="Sposta nel cestino">
          Elimina
        </button>
      </div>
    </div>
  );

  const bottomRow = (
    <div className="book-nav">
      <button className="book-nav-btn" disabled={!prevPage} onClick={() => prevPage && onNavigate(prevPage.id)}>
        ◀ Pagina precedente
      </button>
      <span className="book-nav-position">{idx >= 0 ? `${idx + 1} / ${siblings.length}` : ''}</span>
      <button className="book-nav-btn" disabled={!nextPage} onClick={() => nextPage && onNavigate(nextPage.id)}>
        Pagina successiva ▶
      </button>
    </div>
  );

  return (
    <RichTextSurface
      documentId={page.id}
      title={page.title}
      contentHtml={page.contentHtml}
      titlePlaceholder="Titolo del giorno (facoltativo)"
      onChange={onChange}
      onNavigateToSubcard={onNavigateToSubcard}
      onSubcardsChanged={onSubcardsChanged}
      topRow={topRow}
      bottomRow={bottomRow}
    />
  );
}
