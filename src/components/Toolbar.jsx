import { useEffect, useRef, useState } from 'react';

const FORMAT_BUTTONS = [
  { key: 'bold', cmd: 'bold', label: 'B', title: 'Grassetto' },
  { key: 'italic', cmd: 'italic', label: 'I', title: 'Corsivo' },
  { key: 'underline', cmd: 'underline', label: 'U', title: 'Sottolineato' },
  { key: 'insertUnorderedList', cmd: 'insertUnorderedList', label: '•—', title: 'Elenco puntato' },
  { key: 'h2', cmd: 'formatBlock:H2', label: 'Titolo', title: 'Titolo di paragrafo' },
  { key: 'blockquote', cmd: 'formatBlock:BLOCKQUOTE', label: '" "', title: 'Citazione' },
];

export default function Toolbar({
  activeFormats,
  onCommand,
  onInsertImageFile,
  onInsertChecklist,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}) {
  const fileRef = useRef(null);
  const [imageMenuOpen, setImageMenuOpen] = useState(false);
  const imageMenuRef = useRef(null);

  useEffect(() => {
    function handleOutsideClick(e) {
      if (imageMenuRef.current && !imageMenuRef.current.contains(e.target)) {
        setImageMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  function run(cmd) {
    if (cmd.startsWith('formatBlock:')) {
      onCommand('formatBlock', cmd.split(':')[1]);
    } else {
      onCommand(cmd);
    }
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

  return (
    <div className="toolbar">
      {FORMAT_BUTTONS.map((b) => (
        <button
          key={b.key}
          type="button"
          title={b.title}
          onClick={() => run(b.cmd)}
          className={activeFormats?.[b.key] ? 'active' : ''}
        >
          {b.label}
        </button>
      ))}

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
