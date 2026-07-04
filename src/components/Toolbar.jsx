import { useRef } from 'react';

const BUTTONS = [
  { cmd: 'bold', label: 'B', title: 'Grassetto' },
  { cmd: 'italic', label: 'I', title: 'Corsivo' },
  { cmd: 'underline', label: 'U', title: 'Sottolineato' },
  { cmd: 'insertUnorderedList', label: '•—', title: 'Elenco puntato' },
  { cmd: 'formatBlock:H2', label: 'Titolo', title: 'Titolo di paragrafo' },
  { cmd: 'formatBlock:BLOCKQUOTE', label: '" "', title: 'Citazione' },
];

export default function Toolbar({ onCommand, onInsertImageFile }) {
  const fileRef = useRef(null);

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
      {BUTTONS.map((b) => (
        <button key={b.label} type="button" title={b.title} onClick={() => run(b.cmd)}>
          {b.label}
        </button>
      ))}
      <span className="toolbar-sep" />
      <button type="button" title="Inserisci link" onClick={handleLink}>🔗 Link</button>
      <button type="button" title="Inserisci immagine da URL" onClick={handleImageUrl}>🖼 URL</button>
      <button type="button" title="Carica immagine dal dispositivo" onClick={() => fileRef.current?.click()}>
        📁 Carica
      </button>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleImageFile} />
    </div>
  );
}
