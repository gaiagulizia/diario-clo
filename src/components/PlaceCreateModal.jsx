import { useState } from 'react';

export default function PlaceCreateModal({ selectedText, onCreate, onClose }) {
  const [mode, setMode] = useState('link'); // 'link' | 'coords'
  const [mapsUrl, setMapsUrl] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [hours, setHours] = useState('');
  const [price, setPrice] = useState('');
  const [status, setStatus] = useState('to_see');
  const [error, setError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !description.trim()) {
      setError('Nome e descrizione sono obbligatori.');
      return;
    }
    if (mode === 'link' && !mapsUrl.trim()) {
      setError('Incolla il link di Google Maps, oppure passa a "Coordinate".');
      return;
    }
    if (mode === 'coords' && (lat.trim() === '' || lng.trim() === '')) {
      setError('Inserisci sia la latitudine che la longitudine.');
      return;
    }

    onCreate({
      name: name.trim(),
      description: description.trim(),
      hours: hours.trim(),
      price: price.trim(),
      status,
      mapsUrl: mode === 'link' ? mapsUrl.trim() : '',
      lat: mode === 'coords' ? parseFloat(lat) : null,
      lng: mode === 'coords' ? parseFloat(lng) : null,
    });
  }

  return (
    <div className="modal-overlay">
      <div className="modal-box modal-box-wide">
        <h2 className="modal-title">Collega un luogo</h2>
        <p className="modal-subtitle">
          Testo selezionato: <em>“{selectedText}”</em>
        </p>

        <form onSubmit={handleSubmit}>
          <div className="place-tab-switch">
            <button
              type="button"
              className={`place-tab-btn ${mode === 'link' ? 'active' : ''}`}
              onClick={() => setMode('link')}
            >
              Link Google Maps
            </button>
            <button
              type="button"
              className={`place-tab-btn ${mode === 'coords' ? 'active' : ''}`}
              onClick={() => setMode('coords')}
            >
              Coordinate
            </button>
          </div>

          {mode === 'link' ? (
            <div className="field">
              <label>Link di Google Maps</label>
              <input
                type="text"
                value={mapsUrl}
                onChange={(e) => setMapsUrl(e.target.value)}
                placeholder="https://maps.google.com/..."
              />
            </div>
          ) : (
            <div className="place-coords-row">
              <div className="field">
                <label>Latitudine</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  placeholder="45.4642"
                />
              </div>
              <div className="field">
                <label>Longitudine</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  placeholder="9.1900"
                />
              </div>
            </div>
          )}

          <div className="field">
            <label>Nome *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome del luogo" />
          </div>

          <div className="field">
            <label>Descrizione *</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Qualche riga su questo posto…"
            />
          </div>

          <div className="place-coords-row">
            <div className="field">
              <label>Orario (facoltativo)</label>
              <input value={hours} onChange={(e) => setHours(e.target.value)} placeholder="es. 9:00–19:00" />
            </div>
            <div className="field">
              <label>Prezzo (facoltativo)</label>
              <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="es. €12" />
            </div>
          </div>

          <div className="field">
            <label>Stato (facoltativo)</label>
            <div className="place-status-toggle">
              <button
                type="button"
                className={status === 'to_see' ? 'active' : ''}
                onClick={() => setStatus('to_see')}
              >
                Da vedere
              </button>
              <button
                type="button"
                className={status === 'seen' ? 'active' : ''}
                onClick={() => setStatus('seen')}
              >
                Già visto
              </button>
              <button type="button" className={status === null ? 'active' : ''} onClick={() => setStatus(null)}>
                Nessuno
              </button>
            </div>
          </div>

          {error && <p className="error-text">{error}</p>}

          <button type="submit" className="btn btn-primary">
            Collega luogo
          </button>
        </form>

        <button className="modal-cancel" onClick={onClose}>Annulla</button>
      </div>
    </div>
  );
}
