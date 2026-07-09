/**
 * mapsService.js
 * Costruisce gli URL di anteprima (embed, senza bisogno di una API key)
 * e di apertura su Google Maps, a partire da un indirizzo testuale o da
 * coordinate lat/lng.
 */

/** Testo da mostrare come "indirizzo" sotto l'anteprima. */
export function getDisplayAddress(place) {
  if (place.address) return place.address;
  if (place.lat != null && place.lng != null) {
    return `${place.lat.toFixed(5)}, ${place.lng.toFixed(5)}`;
  }
  return '';
}

/** URL da usare in un <iframe> per l'anteprima (funziona senza API key,
 *  sia con un indirizzo testuale sia con delle coordinate). */
export function getEmbedUrl(place) {
  const query = place.lat != null && place.lng != null ? `${place.lat},${place.lng}` : place.address;
  if (!query) return null;
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed`;
}

/** URL da aprire in una nuova scheda su Google Maps. */
export function getOpenUrl(place) {
  const query = place.lat != null && place.lng != null ? `${place.lat},${place.lng}` : place.address;
  if (!query) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
