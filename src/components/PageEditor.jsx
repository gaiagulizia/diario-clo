import { useEffect, useRef, useState } from 'react';
import Toolbar from './Toolbar';
import { exportPageAsHtml } from '../services/exportService';

export default function PageEditor({ page, onChange, onDelete }) {
  const editableRef = useRef(null);
  const [title, setTitle] = useState(page.title || '');
  const [date, setDate] = useState(page.date?.slice(0, 10) || new Date().toISOString().slice(0, 10));
  const saveTimeout = useRef(null);

  useEffect(() => {
    setTitle(page.title || '');
    setDate(page.date?.slice(0, 10) || new Date().toISOString().slice(0, 10));
    if (editableRef.current) {
      editableRef.current.innerHTML = page.contentHtml || '';
    }
  }, [page.id]);

  function scheduleSave(patch) {
    clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => onChange(patch), 350);
  }

  function handleContentInput() {
    scheduleSave({ contentHtml: editableRef.current.innerHTML });
  }

  function handleTitleChange(e) {
    setTitle(e.target.value);
    scheduleSave({ title: e.target.value });
  }

  function handleDateChange(e) {
    setDate(e.target.value);
    onChange({ date: new Date(e.target.value).toISOString() });
  }

  function runCommand(cmd, value) {
    editableRef.current.focus();
    document.execCommand(cmd, false, value);
    handleContentInput();
  }

  function insertImageFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      editableRef.current.focus();
      document.execCommand('insertImage', false, reader.result);
      handleContentInput();
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="editor-wrap">
      <Toolbar onCommand={runCommand} onInsertImageFile={insertImageFile} />

      <div className="page-sheet">
        <div className="page-sheet-top">
          <input type="date" className="date-input" value={date} onChange={handleDateChange} />
          <div className="page-sheet-actions">
            <button
              className="text-link-btn"
              onClick={() => exportPageAsHtml({ ...page, title, date })}
              title="Esporta questo foglio come HTML"
            >
              Esporta foglio
            </button>
            <button className="text-link-btn" onClick={onDelete} title="Elimina foglio">
              Elimina
            </button>
          </div>
        </div>

        <input
          className="title-input"
          value={title}
          onChange={handleTitleChange}
          placeholder="Titolo del giorno (facoltativo)"
        />

        <div
          ref={editableRef}
          className="journal-editable"
          contentEditable
          suppressContentEditableWarning
          onInput={handleContentInput}
          data-placeholder="Scrivi qui i pensieri di oggi…"
        />
      </div>
    </div>
  );
}
