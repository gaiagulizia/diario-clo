import { useEffect, useRef, useState } from 'react';
import Toolbar from './Toolbar';
import PlaceCreateModal from './PlaceCreateModal';
import PlaceCardModal from './PlaceCardModal';
import SubcardComposerModal from './SubcardComposerModal';
import SubcardModal from './SubcardModal';
import { exportPageAsHtml } from '../services/exportService';
import { useAuth } from '../context/AuthContext';
import * as data from '../services/dataService';
import { getDisplayAddress } from '../services/mapsService';

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function hexToRgba(hex, opacityPercent) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  const a = Math.max(0, Math.min(100, opacityPercent)) / 100;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
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

function placeCaretAtStart(node) {
  const range = document.createRange();
  range.setStart(node, 0);
  range.collapse(true);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

/** Esce da un "blocco fatto in casa" (luogo o sottoscheda) collegato
 *  inline: mette il cursore in una nuova riga vuota subito dopo. */
function exitInlineLink(linkEl) {
  const p = document.createElement('div');
  p.innerHTML = '<br>';
  linkEl.after(p);
  placeCaretAtStart(p);
}

export default function PageEditor({ page, onChange, onDelete, siblingPages, onNavigate, onSubcardsChanged }) {
  const { user } = useAuth();
  const editableRef = useRef(null);
  const [title, setTitle] = useState(page.title || '');
  const [date, setDate] = useState(page.date?.slice(0, 10) || new Date().toISOString().slice(0, 10));
  const [activeFormats, setActiveFormats] = useState({});
  const [historyState, setHistoryState] = useState({ canUndo: false, canRedo: false });
  const [placeModalOpen, setPlaceModalOpen] = useState(false);
  const [openPlace, setOpenPlace] = useState(null);
  const [hoverPreview, setHoverPreview] = useState(null);
  const [subcardComposer, setSubcardComposer] = useState(null);
  const [openSubcard, setOpenSubcard] = useState(null);
  const [savedHighlightColors, setSavedHighlightColors] = useState(() => data.getSavedHighlightColors(user.uid));

  const saveTimeout = useRef(null);
  const historyTimeout = useRef(null);
  const historyRef = useRef({ stack: [''], index: 0 });
  const isRestoringRef = useRef(false);
  const savedRangeRef = useRef(null);
  const savedTextRef = useRef('');
  const hoverTimeoutRef = useRef(null);

  useEffect(() => {
    setTitle(page.title || '');
    setDate(page.date?.slice(0, 10) || new Date().toISOString().slice(0, 10));
    if (editableRef.current) {
      editableRef.current.innerHTML = page.contentHtml || '';
    }
    historyRef.current = { stack: [page.contentHtml || ''], index: 0 };
    setHistoryState({ canUndo: false, canRedo: false });
    setOpenPlace(null);
    setOpenSubcard(null);
    setHoverPreview(null);
  }, [page.id]);

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
      let hiliteVal = '';
      try {
        hiliteVal = document.queryCommandValue('hiliteColor');
      } catch {
        hiliteVal = '';
      }
      const hasHighlight = !!hiliteVal && hiliteVal !== 'transparent' && !/rgba?\(0,\s*0,\s*0,\s*0\)/.test(hiliteVal);

      const inChecklist = !!closestWithin(sel.anchorNode, editable, (n) => n.classList?.contains('checklist-item'));
      const inPlace = !!closestWithin(sel.anchorNode, editable, (n) => n.classList?.contains('place-link'));
      const inSubcard = !!closestWithin(sel.anchorNode, editable, (n) => n.classList?.contains('subcard-link'));

      setActiveFormats({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        insertUnorderedList: document.queryCommandState('insertUnorderedList'),
        h1: block === 'h1',
        h2: block === 'h2',
        h3: block === 'h3',
        blockquote: block === 'blockquote',
        checklist: inChecklist,
        place: inPlace,
        subcard: inSubcard,
        highlight: hasHighlight,
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

  function handleEditableKeyDown(e) {
    if (e.key !== 'Enter') return;
    const editable = editableRef.current;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const inlineLink = closestWithin(
      sel.anchorNode,
      editable,
      (n) => n.classList?.contains('place-link') || n.classList?.contains('subcard-link')
    );
    if (inlineLink) {
      e.preventDefault();
      exitInlineLink(inlineLink);
      handleContentInput();
      return;
    }

    const bq = closestWithin(sel.anchorNode, editable, (n) => n.tagName === 'BLOCKQUOTE');
    if (bq) {
      e.preventDefault();
      const range = sel.getRangeAt(0);
      const lineEmpty = currentLineTextBeforeCursor(bq, range) === '';
      if (lineEmpty) {
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
      setHoverPreview(null);
      const place = data.getPlace(user.uid, placeEl.dataset.placeId);
      if (place) setOpenPlace(place);
      return;
    }

    const subcardEl = e.target.closest('.subcard-link');
    if (subcardEl) {
      e.preventDefault();
      const subcard = data.getSubcard(user.uid, subcardEl.dataset.subcardId);
      if (subcard) setOpenSubcard(subcard);
    }
  }

  function handleEditableMouseOver(e) {
    const placeEl = e.target.closest('.place-link');
    if (!placeEl) return;
    clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      const place = data.getPlace(user.uid, placeEl.dataset.placeId);
      if (!place) return;
      const rect = placeEl.getBoundingClientRect();
      setHoverPreview({ place, x: rect.left, y: rect.bottom + 8 });
    }, 500);
  }

  function handleEditableMouseOut(e) {
    const placeEl = e.target.closest('.place-link');
    if (!placeEl) return;
    if (placeEl.contains(e.relatedTarget)) return;
    clearTimeout(hoverTimeoutRef.current);
    setHoverPreview(null);
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

  function captureSelectionForInsert() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed || !editableRef.current.contains(sel.anchorNode)) {
      return false;
    }
    savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    savedTextRef.current = sel.toString();
    return true;
  }

  function restoreSelection() {
    const sel = window.getSelection();
    sel.removeAllRanges();
    if (savedRangeRef.current) sel.addRange(savedRangeRef.current);
    editableRef.current.focus();
  }

  function handleOpenPlaceModal() {
    if (!captureSelectionForInsert()) {
      alert('Prima seleziona il testo a cui vuoi collegare un luogo.');
      return;
    }
    setPlaceModalOpen(true);
  }

  function handleCreatePlace(fields) {
    const place = data.createPlace(user.uid, fields);
    restoreSelection();
    const html = `<span class="place-link" data-place-id="${place.id}">${escapeHtml(savedTextRef.current)}</span>`;
    document.execCommand('insertHTML', false, html);
    handleContentInput();
    setPlaceModalOpen(false);
  }

  function handleSavePlace(placeId, patch) {
    const updated = data.updatePlace(user.uid, placeId, patch);
    setOpenPlace(updated);
    const span = editableRef.current.querySelector(`.place-link[data-place-id="${placeId}"]`);
    if (span && patch.name && span.textContent !== patch.name) {
      span.textContent = patch.name;
      handleContentInput();
    }
  }

  function handleUnlinkPlace(placeId) {
    const span = editableRef.current.querySelector(`.place-link[data-place-id="${placeId}"]`);
    if (span) {
      span.replaceWith(document.createTextNode(span.textContent));
      handleContentInput();
    }
    data.deletePlace(user.uid, placeId);
    setOpenPlace(null);
  }

  function handleOpenSubcardComposer(mode) {
    if (!captureSelectionForInsert()) {
      alert('Prima seleziona il testo a cui vuoi collegare una sottoscheda.');
      return;
    }
    setSubcardComposer(mode);
  }

  function insertSubcardLink(subcardId) {
    restoreSelection();
    const html = `<span class="subcard-link" data-subcard-id="${subcardId}">${escapeHtml(savedTextRef.current)}</span>`;
    document.execCommand('insertHTML', false, html);
    handleContentInput();
    setSubcardComposer(null);
    onSubcardsChanged?.();
  }

  function handleCreateSubcard(fields) {
    const subcard = data.createSubcard(user.uid, fields);
    insertSubcardLink(subcard.id);
  }

  function handleLinkExistingSubcard(subcardId) {
    insertSubcardLink(subcardId);
  }

  function handleSaveSubcard(subcardId, patch) {
    const updated = data.updateSubcard(user.uid, subcardId, patch);
    setOpenSubcard(updated);
    onSubcardsChanged?.();
  }

  function handleUnlinkSubcard(subcardId) {
    const span = editableRef.current.querySelector(`.subcard-link[data-subcard-id="${subcardId}"]`);
    if (span) {
      span.replaceWith(document.createTextNode(span.textContent));
      handleContentInput();
    }
    setOpenSubcard(null);
  }

  function handleBeforeOpenHighlight() {
    captureSelectionForInsert();
  }

  function handleApplyHighlight(hex, opacityPercent) {
    if (!savedRangeRef.current) {
      alert('Prima seleziona il testo da evidenziare.');
      return;
    }
    restoreSelection();
    document.execCommand('hiliteColor', false, hexToRgba(hex, opacityPercent));
    handleContentInput();
  }

  function handleSaveHighlightColor(hex) {
    data.saveHighlightColor(user.uid, hex);
    setSavedHighlightColors(data.getSavedHighlightColors(user.uid));
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
        onOpenSubcardComposer={handleOpenSubcardComposer}
        onBeforeOpenHighlight={handleBeforeOpenHighlight}
        savedHighlightColors={savedHighlightColors}
        onApplyHighlight={handleApplyHighlight}
        onSaveHighlightColor={handleSaveHighlightColor}
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
          onMouseOver={handleEditableMouseOver}
          onMouseOut={handleEditableMouseOut}
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
        <PlaceCardModal
          place={openPlace}
          onSave={handleSavePlace}
          onUnlink={handleUnlinkPlace}
          onClose={() => setOpenPlace(null)}
        />
      )}

      {subcardComposer && (
        <SubcardComposerModal
          mode={subcardComposer}
          selectedText={savedTextRef.current}
          existingSubcards={data.getAllSubcards(user.uid)}
          onCreate={handleCreateSubcard}
          onLink={handleLinkExistingSubcard}
          onClose={() => setSubcardComposer(null)}
        />
      )}

      {openSubcard && (
        <SubcardModal
          subcard={openSubcard}
          allowUnlink
          onSave={handleSaveSubcard}
          onUnlink={handleUnlinkSubcard}
          onClose={() => setOpenSubcard(null)}
        />
      )}

      {hoverPreview && (
        <div className="place-hover-preview" style={{ left: hoverPreview.x, top: hoverPreview.y }}>
          {hoverPreview.place.photoUrl && (
            <img src={hoverPreview.place.photoUrl} alt="" className="place-hover-photo" />
          )}
          <div className="place-hover-body">
            <p className="place-hover-name">{hoverPreview.place.name}</p>
            <p className="place-hover-address">{getDisplayAddress(hoverPreview.place) || 'Nessun indirizzo'}</p>
          </div>
        </div>
      )}
    </div>
  );
}
