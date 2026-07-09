import { useEffect, useRef, useState } from 'react';

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
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}) {
  const fileRef = useRef(null);
  const [imageMenuOpen, setImageMenuOpen] = useState(false);
  const [headingMenuOpen, setHeadingMenuOpen] = useState(false);
  const imageMenuRef = useRef(null);
  const headingMenuRef = useRef(null);

  useEffect(() => {
    function handleOutsideClick(e) {
      if (imageMenuRef.current && !imageMenuRef.current.contains(e.target)) {
        setImageMenuOpen(false);
      }
      if (headingMenuRef.current && !headingMenuRef.current.contains(e.target)) {
        setHeadingMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  function runInline(cmd) {
    onCommand(cmd);
  }

  function runFormatBlock(key, tag) {
    // Se il formato è già attivo dove si trova il cursore, il pulsante
    // lo toglie invece di riapplicarlo (altrimenti sarebbe impossibile
    // tornare a scrivere testo normale).
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

  const activeHeading = HEADING_OPTIONS.find((o) => activeFormats?.[o.key]);

  return (
    <div className="toolbar">
      {INLINE_BUTTONS.map((b) => (
        <button
          key={b.key}
          type="button"
          title={b.title}
          onClick={() => runInline(b.cmd)}
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
