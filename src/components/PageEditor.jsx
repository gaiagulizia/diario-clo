import { useEffect, useRef, useState } from 'react';
import Toolbar from './Toolbar';
import { exportPageAsHtml } from '../services/exportService';

export default function PageEditor({ page, onChange, onDelete, siblingPages, onNavigate }) {
  const editableRef = useRef(null);
  const [title, setTitle] = useState(page.title || '');
  const [date, setDate] = useState(page.date?.slice(0, 10) || new Date().toISOString().slice(0, 10));
  const [activeFormats, setActiveFormats] = useState({});
  const [historyState, setHistoryState] = useState({ canUndo: false, canRedo: false });

  const saveTimeout = useRef(null);
  const historyTimeout = useRef(null);
  const historyRef = useRef({ stack: [''], index: 0 });
  const isRestoringRef = useRef(false);

  // Quando cambio pagina, ricarico contenuto ed è la cronologia annulla/ripristina
  useEffect(() => {
    setTitle(page.title || '');
    setDate(page.date?.slice(0, 10) || new Date().toISOString().slice(0, 10));
    if (editableRef.current) {
      editableRef.current.innerHTML = page.contentHtml || '';
    }
    historyRef.current = { stack: [page.contentHtml || ''], index: 0 };
    setHistoryState({ canUndo: false, canRedo: false });
  }, [page.id]);

  // Rileva quali formattazioni sono attive nel punto in cui si trova il cursore
  useEffect(() => {
    function updateActiveFormats() {
      const editable = editableRef.current;
      if (!editable) return;
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0 || !sel.anchorNode) return;
      if (!editable.contains(sel.anchorNode)) return;

      let block = '';
      try {
        block = (document.queryCommandValue('formatBlock') || '').toLowerCase();
      } catch {
        block = '';
      }

      let node = sel.anchorNode;
      let inChecklist = false;
      while (node && node !== editable) {
        if (node.nodeType === 1 && node.classList?.contains('checklist-item')) {
          inChecklist = true;
          break;
        }
        node = node.parentNode;
      }

      setActiveFormats({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        insertUnorderedList: document.queryCommandState('insertUnorderedList'),
        h2: block === 'h2',
        blockquote: block === 'blockquote',
        checklist: inChecklist,
      });
    }
    document.addEventListener('selectionchange', updateActiveFormats);
    return () => document.removeEventListener('selectionchange', updateActiveFormats);
  }, []);

  function scheduleSave(patch) {
    clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => onChange(patch), 350);
  }

  function pushHistory(html) {
    const h = historyRef.current;
    if (h.stack[h.index] === html) return;
    const trimmed = h.stack.slice(0, h.index + 1);
    trimmed.push(html);
    if (trimmed.length > 100) trimmed.shift();
    historyRef.current = { stack: trimmed, index: trimmed.length - 1 };
    setHistoryState({ canUndo: historyRef.current.index > 0, canRedo: false });
  }

  function scheduleHistoryPush() {
    clearTimeout(historyTimeout.current);
    historyTimeout.current = setTimeout(() => {
      if (isRestoringRef.current || !editableRef.current) return;
      pushHistory(editableRef.current.innerHTML);
    }, 500);
  }

  function handleContentInput() {
    scheduleSave({ contentHtml: editableRef.current.innerHTML });
    scheduleHistoryPush();
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

  function insertChecklistItem() {
    editableRef.current.focus();
    const html =
      '<div class="checklist-item"><span class="checklist-box" contenteditable="false">☐</span>' +
      '<span class="checklist-text">Nuovo elemento</span></div>';
    document.execCommand('insertHTML', false, html);
    handleContentInput();
  }

  function handleEditableClick(e) {
    const box = e.target.closest('.checklist-box');
    if (!box) return;
    e.preventDefault();
    const item = box.closest('.checklist-item');
    if (!item) return;
    const checked = item.classList.toggle('checked');
    box.textContent = checked ? '☑' : '☐';
    handleContentInput();
  }

  function restoreHtml(html) {
    isRestoringRef.current = true;
    editableRef.current.innerHTML = html;
    isRestoringRef.current = false;
    onChange({ contentHtml: html });
  }

  function handleUndo() {
    const h = historyRef.current;
    if (h.index <= 0) return;
    h.index -= 1;
    restoreHtml(h.stack[h.index]);
    setHistoryState({ canUndo: h.index > 0, canRedo: true });
  }

  function handleRedo() {
    const h = historyRef.current;
    if (h.index >= h.stack.length - 1) return;
    h.index += 1;
    restoreHtml(h.stack[h.index]);
    setHistoryState({ canUndo: true, canRedo: h.index < h.stack.length - 1 });
  }

  const siblings = siblingPages || [];
  const idx = siblings.findIndex((p) => p.id === page.id);
  const prevPage = idx > 0 ? siblings[idx - 1] : null;
  const nextPage = idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null;

  return (
    <div className="editor-wrap">
      <Toolbar
        activeFormats={activeFormats}
        onCommand={runCommand}
        onInsertImageFile={insertImageFile}
        onInsertChecklist={insertChecklistItem}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyState.canUndo}
        canRedo={historyState.canRedo}
      />

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
            <button className="text-link-btn" onClick={onDelete} title="Sposta nel cestino">
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
          onClick={handleEditableClick}
          data-placeholder="Scrivi qui i pensieri di oggi…"
        />
      </div>

      <div className="book-nav">
        <button
          className="book-nav-btn"
          disabled={!prevPage}
          onClick={() => prevPage && onNavigate(prevPage.id)}
        >
          ◀ Pagina precedente
        </button>
        <span className="book-nav-position">
          {idx >= 0 ? `${idx + 1} / ${siblings.length}` : ''}
        </span>
        <button
          className="book-nav-btn"
          disabled={!nextPage}
          onClick={() => nextPage && onNavigate(nextPage.id)}
        >
          Pagina successiva ▶
        </button>
      </div>
    </div>
  );
}
