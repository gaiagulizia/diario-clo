# Diario — il tuo quaderno online

Un diario personale nel browser: quaderni multipli, fogli con testo
formattato (grassetto, corsivo, link, immagini), ordinati automaticamente
per data (le pagine bianche non vengono mai mostrate), con possibilità di
spostare uno o più fogli tra quaderni ed esportare singoli fogli o interi
quaderni.

> **Nota su questa versione:** rispetto alla prima, qui **non si usa più
> Tailwind CSS** — tutto lo stile è scritto a mano in `src/index.css`.
> Questo elimina un'intera classe di problemi (purge/compilazione delle
> classi che in produzione può comportarsi diversamente che in locale) ed
> è stato fatto per risolvere un caso di pagina "vuota" dopo il deploy su
> GitHub Pages, dovuto a testo che ereditava un colore scuro su sfondo
> scuro. C'è anche un `ErrorBoundary` che mostra un messaggio leggibile
> invece di una pagina bianca se qualcosa va storto in fase di
> esecuzione.

I dati sono salvati **in locale, nel browser** (localStorage). Il codice è
già pronto per collegare **Firebase** (piano gratuito: Authentication +
Firestore) come prossimo passo — vedi in fondo.

## Avvio in locale

```bash
npm install
npm run dev
```

Apri l'indirizzo che compare in console (di solito `http://localhost:5173`).

## Build di produzione

```bash
npm run build
npm run preview
```

## Struttura del progetto

```
src/
  context/AuthContext.jsx     -> login/registrazione (oggi finti, in localStorage)
  services/dataService.js     -> tutte le operazioni sui quaderni/fogli
  services/exportService.js   -> esportazione HTML/JSON di fogli e quaderni
  components/
    ErrorBoundary.jsx          -> mostra un errore leggibile invece di una pagina bianca
    Login.jsx                  -> schermata di accesso
    NotebookSidebar.jsx        -> elenco quaderni, crea/rinomina/elimina, export
    PageList.jsx               -> elenco fogli del quaderno corrente, selezione multipla
    MoveModal.jsx               -> finestra per spostare i fogli selezionati
    PageEditor.jsx              -> foglio con editor di testo formattato
    Toolbar.jsx                  -> barra degli strumenti di formattazione
  index.css                    -> tutto lo stile dell'app (CSS puro, niente Tailwind)
  App.jsx
  main.jsx
```

## Pubblicare su GitHub Pages

Il repository include già `.github/workflows/deploy.yml`, che ad ogni
push su `main` (o avviato manualmente dalla tab **Actions** del repo)
compila l'app e la pubblica su GitHub Pages.

Perché funzioni:
1. Su GitHub, vai su **Settings → Pages** e imposta **Source: GitHub
   Actions**.
2. Il file `vite.config.js` ha `base: '/Diario/'` — deve corrispondere
   **esattamente** (maiuscole comprese) al nome del repository. Se rinomini
   il repository, aggiorna anche questa riga.
3. Dopo il push, controlla la tab **Actions**: il workflow deve concludersi
   con la spunta verde. Il sito sarà su
   `https://<tuo-utente>.github.io/Diario/`.

## Come funziona l'ordinamento e le "pagine bianche"

Ogni foglio ha una data. `dataService.getPages()` restituisce i fogli di
un quaderno **ordinati per data** e **filtra automaticamente i fogli senza
contenuto reale** (nessun testo, titolo, immagine o link).

## Spostare i fogli tra quaderni

Nell'elenco dei fogli (colonna centrale) seleziona più fogli con le
checkbox: appare il pulsante "Sposta (n)" che apre una finestra per
scegliere il quaderno di destinazione.

## Esportazione

- **Foglio singolo**: pulsante "Esporta foglio" nell'editor → scarica un
  file `.html` autonomo, apribile in qualunque browser e stampabile/
  salvabile in PDF con "Stampa → Salva come PDF".
- **Quaderno intero**: pulsanti in fondo alla barra laterale, per HTML o
  backup JSON completo.

## Prossimo passo: collegare Firebase (piano gratuito)

1. Crea un progetto su [Firebase Console](https://console.firebase.google.com),
   attiva **Authentication** (email/password) e **Firestore Database**
   (piano Spark/gratuito).
2. `npm install firebase`
3. Crea `src/services/firebase.js` con la tua configurazione e inizializza
   `getAuth`/`getFirestore`.
4. In `src/context/AuthContext.jsx`, sostituisci login/register/logout con
   le funzioni equivalenti di `firebase/auth`.
5. In `src/services/dataService.js`, sostituisci le funzioni con letture/
   scritture su Firestore (collezioni `notebooks` e `pages`, filtrate per
   `ownerId`). Le firme delle funzioni restano identiche, quindi i
   componenti React non cambiano.
