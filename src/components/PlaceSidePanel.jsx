import { useEffect, useState } from 'react';
import { getEmbedUrl, getOpenUrl } from '../services/mapsService';
import PlacePhotoPicker from './PlacePhotoPicker';

export default function PlaceSidePanel({ place, onSave, onUnlink, onClose }) {
  const [form, setForm] = useState(place);
  const [error, setError] = useState('');

  useEffect(() => {
    setForm(place);
    setError('');
  }, [place.id]);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSave() {
    if (!form.name.trim()) {
      setError('Il nome non può essere vuoto.');
      return;
    }
    onSave(place.id, {
      name: form.name.trim(),
      description: form.description?.trim() || '',
      address: form.address?.trim() || '',
      photoUrl: form.photoUrl || '',
      hours: form.hours?.trim() || '',
      price: form.price?.trim() || '',
      status: form.status || null,
    });
  }

  const embedUrl = getEmbedUrl(form);
  const openUrl = getOpenUrl(form);

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="place-drawer">
        <div className="place-drawer-header">
          <h2>Luogo</h2>
          <button className="icon-btn" onClick={onClose} title="Chiudi">✕</button>
        </div>

        <div className="place-map-card">
          {embedUrl ? (
            <>
              <iframe
                className="place-map-iframe"
                src={embedUrl}
                title={form.name || 'Mappa'}
                loading="lazy"
              />
              {openUrl && (
                <button
                  className="place-map-overlay"
                  title="Apri su Google Maps"
                  onClick={() => window.open(openUrl, '_blank', 'noopener')}
                />
              )}
            </>
          ) : (
            <div className="place-map-fallback">
              <p>Aggiungi un indirizzo o delle coordinate per vedere l'anteprima.</p>
            </div>
          )}
          {openUrl && (
            <a className="place-map-link" href={openUrl} target="_blank" rel="noopener noreferrer">
              Apri su Google Maps ↗
            </a>
          )}
        </div>

        <div className="field">
          <label>Nome *</label>
          <input value={form.name} onChange={(e) => set('name', e.target.value)} />
        </div>

        <div className="field">
          <label>Indirizzo</label>
          <input
            value={form.address || ''}
            onChange={(e) => set('address', e.target.value)}
            placeholder="Via Roma 1, Milano"
          />
        </div>

        <PlacePhotoPicker photoUrl={form.photoUrl} onChange={(url) => set('photoUrl', url)} />

        <div className="field">
          <label>Descrizione (facoltativa)</label>
          <textarea rows={3} value={form.description || ''} onChange={(e) => set('description', e.target.value)} />
        </div>

        <div className="place-coords-row">
          <div className="field">
            <label>Orario</label>
            <input value={form.hours || ''} onChange={(e) => set('hours', e.target.value)} placeholder="—" />
          </div>
          <div className="field">
            <label>Prezzo</label>
            <input value={form.price || ''} onChange={(e) => set('price', e.target.value)} placeholder="—" />
          </div>
        </div>

        <div className="field">
          <label>Stato</label>
          <div className="place-status-toggle">
            <button
              type="button"
              className={form.status === 'to_see' ? 'active' : ''}
              onClick={() => set('status', 'to_see')}
            >
              Da vedere
            </button>
            <button
              type="button"
              className={form.status === 'seen' ? 'active' : ''}
              onClick={() => set('status', 'seen')}
            >
              Già visto
            </button>
            <button type="button" className={!form.status ? 'active' : ''} onClick={() => set('status', null)}>
              Nessuno
            </button>
          </div>
        </div>

        {error && <p className="error-text">{error}</p>}

        <div className="place-drawer-actions">
          <button className="btn btn-primary" onClick={handleSave}>Salva</button>
          <button
            className="text-link-btn danger"
            onClick={() => {
              if (confirm('Rimuovere il collegamento a questo luogo dal testo?')) onUnlink(place.id);
            }}
          >
            Rimuovi collegamento
          </button>
        </div>
      </div>
    </>
  );
}
