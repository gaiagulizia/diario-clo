import { useEffect, useRef, useState } from 'react';
import HighlightPicker from './HighlightPicker';

const INLINE_BUTTONS = [
  { key: 'bold', cmd: 'bold', label: 'B', title: 'Grassetto' },
  { key: 'italic', cmd: 'italic', label: 'I', title: 'Corsivo' },
  { key: 'underline', cmd: 'underline', label: 'U', title: 'Sottolineato' },
  { key: 'insertUnorderedList', cmd: 'insertUnorderedList', label: '•—', title: 'Elenco puntato' },
];

const HEADING_OPTIONS = [
  { key: 'h1', tag: 'H1', label: 'Titolo grande' },
  { key: 'h2', tag: 'H2', label: 'Titolo medio' },
  { key: 'h3', tag: 'H3', label: 'Titolo piccolo' },
];

export default function Toolbar({
  activeFormats,
  onCommand,
  onInsertImageFile,
  onInsertChecklist,
  onOpenPlaceModal,
  onOpenSubcardComposer,
  onBeforeOpenHighlight,
  savedHighlightColors,
  onApplyHighlight,
  onSaveHighlightColor,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}) {
  const fileRef = useRef(null);
  const [imageMenuOpen, setImageMenuOpen] = useState(false);
  const [headingMenuOpen, setHeadingMenuOpen] = useState(false);
  const [subcardMenuOpen, setSubcardMenuOpen] = useState(false);
  const [highlightOpen, setHighlightOpen] = useState(false);
  const imageMenuRef = useRef(null);
  const headingMenuRef = useRef(null);
  const subcardMenuRef = useRef(null);
  const highlightRef = useRef(null);

  useEffect(() => {
    function handleOutsideClick(e) {
      if (imageMenuRef.current && !imageMenuRef.current.contains(e.target)) setImageMenuOpen(false);
      if (headingMenuRef.current && !headingMenuRef.current.contains(e.target)) setHeadingMenuOpen(false);
      if (subcardMenuRef.current && !subcardMenuRef.current.contains(e.target)) setSubcardMenuOpen(false);
      if (highlightRef.current && !highlightRef.current.contains(e.target)) setHighlightOpen(false);
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  function runFormatBlock(key, tag) {
    if (activeFormats?.[key]) {
      onCommand('formatBlock', 'DIV');
    } else {
      onCommand('formatBlock', tag);
    }
  }

  function handleHeadingClick(opt) {
    setHeadingMenuOpen(false);
    runFormatBlock(opt.key, opt.tag);
  }

  function handleQuoteClick() {
    runFormatBlock('blockquote', 'BLOCKQUOTE');
  }

  function handleLink() {
    const url = window.prompt("Incolla il link (https://...)");
    if (url) onCommand('createLink', url);
  }

  function handleImageUrl() {
    setImageMenuOpen(false);
    const url = window.prompt("URL dell'immagine");
    if (url) onCommand('insertImage', url);
  }

  function handleImageFile(e) {
    const file = e.target.files?.[0];
    if (file) onInsertImageFile(file);
    e.target.value = '';
  }

  function handleApplyHighlight(hex, opacity) {
    setHighlightOpen(false);
    onApplyHighlight(hex, opacity);
  }

  const activeHeading = HEADING_OPTIONS.find((o) => activeFormats?.[o.key]);

  return (
    <div className="toolbar">
      {INLINE_BUTTONS.map((b) => (
        <button
          key={b.key}
          type="button"
          title={b.title}
          onClick={() => onCommand(b.cmd)}
          className={activeFormats?.[b.key] ? 'active' : ''}
        >
          {b.label}
        </button>
      ))}

      <div className="toolbar-dropdown" ref={headingMenuRef}>
        <button
          type="button"
          title="Titolo"
          onClick={() => setHeadingMenuOpen((v) => !v)}
          className={activeHeading ? 'active' : ''}
        >
          {activeHeading ? activeHeading.label : 'Titolo'} ▾
        </button>
        {headingMenuOpen && (
          <div className="toolbar-dropdown-menu">
            {HEADING_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                className={activeFormats?.[opt.key] ? 'active' : ''}
                onClick={() => handleHeadingClick(opt)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        title="Citazione"
        onClick={handleQuoteClick}
        className={activeFormats?.blockquote ? 'active' : ''}
      >
        " "
      </button>

      <button
        type="button"
        title="Elenco da spuntare"
        onClick={onInsertChecklist}
        className={activeFormats?.checklist ? 'active' : ''}
      >
        ☑ Lista
      </button>

      <div className="toolbar-dropdown" ref={highlightRef}>
        <button
          type="button"
          title="Evidenzia"
          onClick={() => {
            if (!highlightOpen) onBeforeOpenHighlight?.();
            setHighlightOpen((v) => !v);
          }}
          className={activeFormats?.highlight ? 'active' : ''}
        >
          🖍 Evidenzia
        </button>
        {highlightOpen && (
          <HighlightPicker
            savedColors={savedHighlightColors}
            onApply={handleApplyHighlight}
            onSaveColor={onSaveHighlightColor}
            onClose={() => setHighlightOpen(false)}
          />
        )}
      </div>

      <span className="toolbar-sep" />

      <button type="button" title="Inserisci link" onClick={handleLink}>🔗 Link</button>

      <button
        type="button"
        title="Collega un luogo al testo selezionato"
        onClick={onOpenPlaceModal}
        className={activeFormats?.place ? 'active' : ''}
      >
        📍 Luogo
      </button>

      <div className="toolbar-dropdown" ref={subcardMenuRef}>
        <button
          type="button"
          title="Sottoscheda"
          onClick={() => setSubcardMenuOpen((v) => !v)}
          className={activeFormats?.subcard ? 'active' : ''}
        >
          📑 Sottoscheda
        </button>
        {subcardMenuOpen && (
          <div className="toolbar-dropdown-menu">
            <button type="button" onClick={() => { setSubcardMenuOpen(false); onOpenSubcardComposer('create'); }}>
              Crea
            </button>
            <button type="button" onClick={() => { setSubcardMenuOpen(false); onOpenSubcardComposer('link'); }}>
              Collega
            </button>
          </div>
        )}
      </div>

      <div className="toolbar-dropdown" ref={imageMenuRef}>
        <button type="button" title="Inserisci immagine" onClick={() => setImageMenuOpen((v) => !v)}>
          🖼 Immagine
        </button>
        {imageMenuOpen && (
          <div className="toolbar-dropdown-menu">
            <button type="button" onClick={handleImageUrl}>Da URL</button>
            <button type="button" onClick={() => { setImageMenuOpen(false); fileRef.current?.click(); }}>
              Carica dal dispositivo
            </button>
          </div>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleImageFile} />

      <span className="toolbar-sep" />

      <button type="button" title="Annulla" onClick={onUndo} disabled={!canUndo}>↺</button>
      <button type="button" title="Ripristina" onClick={onRedo} disabled={!canRedo}>↻</button>
    </div>
  );
}
