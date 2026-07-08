import { useEffect, useRef, useState } from 'react';
import Toolbar from './Toolbar';
import PlaceCreateModal from './PlaceCreateModal';
import PlaceSidePanel from './PlaceSidePanel';
import { exportPageAsHtml } from '../services/exportService';
import { useAuth } from '../context/AuthContext';
import * as data from '../services/dataService';

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/** Trova l'antenato più vicino (fino a `root`) che soddisfa `test`. */
function closestWithin(node, root, test) {
  while (node && node !== root) {
    if (node.nodeType === 1 && test(node)) return node;
    node = node.parentNode;
  }
  return null;
}

/** Testo della "riga corrente" dentro `container`, cioè da dopo l'ultimo
 *  <br> (o dall'inizio) fino al cursore. Serve a capire se la riga dove
 *  si trova il cursore è vuota. */
function currentLineTextBeforeCursor(container, range) {
  const preRange = document.createRange();
  preRange.setStart(container, 0);
  preRange.setEnd(range.startContainer, range.startOffset);
  const div = document.createElement('div');
  div.appendChild(preRange.cloneContents());
  const parts = div.innerHTML.split(/<br\s*\/?>/i);
  const lastPart = parts[parts.length - 1];
  const tmp = document.createElement('div');
  tmp.innerHTML = lastPart;
  return tmp.textContent.trim();
}

export default function PageEditor({ page, onChange, onDelete, siblingPages, onNavigate }) {
  const { user } = useAuth();
  const editableRef = useRef(null);
  const [title, setTitle] = useState(page.title || '');
  const [date, setDate] = useState(page.date?.slice(0, 10) || new Date().toISOString().slice(0, 10));
  const [activeFormats, setActiveFormats] = useState({});
  const [historyState, setHistoryState] = useState({ canUndo: false, canRedo: false });
  const [placeModalOpen, setPlaceModalOpen] = useState(false);
  const [openPlace, setOpenPlace] = useState(null);

  const saveTimeout = useRef(null);
  const historyTimeout = useRef(null);
  const historyRef = useRef({ stack: [''], index: 0 });
  const isRestoringRef = useRef(false);
  const savedRangeRef = useRef(null);
  const savedTextRef = useRef('');

  useEffect(() => {
    setTitle(page.title || '');
    setDate(page.date?.slice(0, 10) || new Date().toISOString().slice(0, 10));
    if (editableRef.current) {
      editableRef.current.innerHTML = page.contentHtml || '';
    }
    historyRef.current = { stack: [page.contentHtml || ''], index: 0 };
    setHistoryState({ canUndo: false, canRedo: false });
    setOpenPlace(null);
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

      const inChecklist = !!closestWithin(sel.anchorNode, editable, (n) => n.classList?.contains('checklist-item'));
      const inPlace = !!closestWithin(sel.anchorNode, editable, (n) => n.classList?.contains('place-link'));

      setActiveFormats({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        insertUnorderedList: document.queryCommandState('insertUnorderedList'),
        h2: block === 'h2',
        blockquote: block === 'blockquote',
        checklist: inChecklist,
        place: inPlace,
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
      '<span class="checklist-text"><br></span></div>';
    document.execCommand('insertHTML', false, html);
    handleContentInput();
    requestAnimationFrame(() => placeCaretInLastChecklistText());
  }

  function placeCaretInLastChecklistText() {
    const items = editableRef.current?.querySelectorAll('.checklist-item');
    if (!items || items.length === 0) return;
    const textEl = items[items.length - 1].querySelector('.checklist-text');
    if (!textEl) return;
    const range = document.createRange();
    range.selectNodeContents(textEl);
    range.collapse(false);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  function placeCaretAtStart(node) {
    const range = document.createRange();
    range.setStart(node, 0);
    range.collapse(true);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  /** Gestisce Invio dentro citazioni ed elenchi da spuntare, che sono
   *  blocchi "fatti in casa" e non hanno un comportamento nativo utile. */
  function handleEditableKeyDown(e) {
    if (e.key !== 'Enter') return;
    const editable = editableRef.current;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const bq = closestWithin(sel.anchorNode, editable, (n) => n.tagName === 'BLOCKQUOTE');
    if (bq) {
      e.preventDefault();
      const range = sel.getRangeAt(0);
      const lineEmpty = currentLineTextBeforeCursor(bq, range) === '';
      if (lineEmpty) {
        // Doppio invio su riga vuota: esci dalla citazione
        while (bq.lastChild && bq.lastChild.nodeName === 'BR') {
          bq.removeChild(bq.lastChild);
        }
        const p = document.createElement('div');
        p.innerHTML = '<br>';
        bq.after(p);
        placeCaretAtStart(p);
      } else {
        document.execCommand('insertLineBreak');
      }
      handleContentInput();
      return;
    }

    const item = closestWithin(sel.anchorNode, editable, (n) => n.classList?.contains('checklist-item'));
    if (item) {
      e.preventDefault();
      const textEl = item.querySelector('.checklist-text');
      const isEmpty = !textEl || textEl.textContent.trim() === '';
      if (isEmpty) {
        const p = document.createElement('div');
        p.innerHTML = '<br>';
        item.after(p);
        item.remove();
        placeCaretAtStart(p);
      } else {
        const newItem = document.createElement('div');
        newItem.className = 'checklist-item';
        newItem.innerHTML =
          '<span class="checklist-box" contenteditable="false">☐</span><span class="checklist-text"><br></span>';
        item.after(newItem);
        placeCaretInLastChecklistText();
      }
      handleContentInput();
    }
  }

  function handleEditableClick(e) {
    const box = e.target.closest('.checklist-box');
    if (box) {
      e.preventDefault();
      const item = box.closest('.checklist-item');
      if (!item) return;
      const checked = item.classList.toggle('checked');
      box.textContent = checked ? '☑' : '☐';
      handleContentInput();
      return;
    }

    const placeEl = e.target.closest('.place-link');
    if (placeEl) {
      e.preventDefault();
      const placeId = placeEl.dataset.placeId;
      const place = data.getPlace(user.uid, placeId);
      if (place) setOpenPlace(place);
    }
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

  function handleOpenPlaceModal() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed || !editableRef.current.contains(sel.anchorNode)) {
      alert('Prima seleziona il testo a cui vuoi collegare un luogo.');
      return;
    }
    savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    savedTextRef.current = sel.toString();
    setPlaceModalOpen(true);
  }

  function handleCreatePlace(fields) {
    const place = data.createPlace(user.uid, fields);
    const sel = window.getSelection();
    sel.removeAllRanges();
    if (savedRangeRef.current) sel.addRange(savedRangeRef.current);
    editableRef.current.focus();
    const html = `<span class="place-link" data-place-id="${place.id}">${escapeHtml(savedTextRef.current)}</span>`;
    document.execCommand('insertHTML', false, html);
    handleContentInput();
    setPlaceModalOpen(false);
  }

  function handleSavePlace(placeId, patch) {
    const updated = data.updatePlace(user.uid, placeId, patch);
    setOpenPlace(updated);
  }

  function handleUnlinkPlace(placeId) {
    const span = editableRef.current.querySelector(`.place-link[data-place-id="${placeId}"]`);
    if (span) {
      const text = document.createTextNode(span.textContent);
      span.replaceWith(text);
      handleContentInput();
    }
    data.deletePlace(user.uid, placeId);
    setOpenPlace(null);
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
        onOpenPlaceModal={handleOpenPlaceModal}
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
          onKeyDown={handleEditableKeyDown}
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

      {placeModalOpen && (
        <PlaceCreateModal
          selectedText={savedTextRef.current}
          onCreate={handleCreatePlace}
          onClose={() => setPlaceModalOpen(false)}
        />
      )}

      {openPlace && (
        <PlaceSidePanel
          place={openPlace}
          onSave={handleSavePlace}
          onUnlink={handleUnlinkPlace}
          onClose={() => setOpenPlace(null)}
        />
      )}
    </div>
  );
}
