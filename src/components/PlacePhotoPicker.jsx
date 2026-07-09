import { useRef } from 'react';

export default function PlacePhotoPicker({ photoUrl, onChange }) {
  const fileRef = useRef(null);

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  function handleUrlPrompt() {
    const url = window.prompt("URL della foto di copertina");
    if (url) onChange(url.trim());
  }

  return (
    <div className="field">
      <label>Foto di copertina (facoltativa)</label>
      {photoUrl ? (
        <div className="place-photo-preview">
          <img src={photoUrl} alt="Anteprima" />
          <button type="button" className="text-link-btn danger" onClick={() => onChange('')}>
            Rimuovi foto
          </button>
        </div>
      ) : (
        <div className="place-photo-actions">
          <button type="button" className="place-tab-btn" onClick={handleUrlPrompt}>Da URL</button>
          <button type="button" className="place-tab-btn" onClick={() => fileRef.current?.click()}>
            Carica dal dispositivo
          </button>
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFile} />
    </div>
  );
}
