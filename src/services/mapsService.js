/**
 * mapsService.js
 * Piccole utility per passare da coordinate o link di Google Maps a un
 * URL di anteprima (embed, senza bisogno di una API key) e a un URL da
 * aprire in una nuova scheda.
 */

/** Prova a estrarre lat,lng da un link di Google Maps qualsiasi
 *  (es. .../@45.4642,9.1900,15z oppure ?q=45.4642,9.1900). */
export function extractCoordsFromUrl(url) {
  if (!url) return null;
  const patterns = [/@(-?\d+\.\d+),(-?\d+\.\d+)/, /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/, /[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
  }
  return null;
}

/** URL da usare in un <iframe> per l'anteprima (funziona senza API key
 *  solo se abbiamo delle coordinate, dirette o estratte dal link). */
export function getEmbedUrl(place) {
  if (place.lat != null && place.lng != null) {
    return `https://www.google.com/maps?q=${place.lat},${place.lng}&z=15&output=embed`;
  }
  const coords = extractCoordsFromUrl(place.mapsUrl);
  if (coords) {
    return `https://www.google.com/maps?q=${coords.lat},${coords.lng}&z=15&output=embed`;
  }
  return null;
}

/** URL da aprire in una nuova scheda su Google Maps. */
export function getOpenUrl(place) {
  if (place.mapsUrl) return place.mapsUrl;
  if (place.lat != null && place.lng != null) {
    return `https://www.google.com/maps?q=${place.lat},${place.lng}`;
  }
  return null;
}
