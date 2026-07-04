/**
 * exportService.js
 * Esporta fogli singoli o interi quaderni come file .html autonomi
 * (apribili e stampabili/salvabili in PDF da qualunque browser),
 * oppure come .json per un backup completo dei dati.
 */

function formatDate(dateStr) {
  try {
    return new Date(dateStr).toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function pageTemplate({ title, date, contentHtml }) {
  return `
    <article class="page">
      <header>
        <p class="date">${formatDate(date)}</p>
        ${title ? `<h1>${title}</h1>` : ''}
      </header>
      <div class="content">${contentHtml || ''}</div>
    </article>
  `;
}

function wrapDocument(title, bodyHtml) {
  return `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8" />
<title>${title}</title>
<style>
  body {
    background: #EAE1CB;
    font-family: Georgia, 'Times New Roman', serif;
    color: #2A2118;
    margin: 0;
    padding: 40px 16px;
  }
  .page {
    max-width: 720px;
    margin: 0 auto 40px auto;
    background: #F5EFE0;
    padding: 48px 56px;
    border-radius: 3px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  }
  .page header { margin-bottom: 24px; border-bottom: 1px solid #d8cba9; padding-bottom: 12px; }
  .page .date { font-family: 'Courier New', monospace; font-size: 12px; letter-spacing: 0.06em; text-transform: uppercase; color: #6B6153; margin: 0 0 6px 0; }
  .page h1 { font-size: 26px; margin: 0; }
  .content { line-height: 1.8; font-size: 17px; }
  .content img { max-width: 100%; border-radius: 2px; }
  .content a { color: #8B2635; }
  @media print {
    body { background: #fff; padding: 0; }
    .page { box-shadow: none; margin: 0; page-break-after: always; }
  }
</style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
}

function download(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportPageAsHtml(page) {
  const body = pageTemplate(page);
  const html = wrapDocument(page.title || 'Foglio del diario', body);
  const safeName = (page.title || 'foglio').replace(/[^\w\- ]/g, '').trim() || 'foglio';
  download(`${safeName}.html`, html, 'text/html');
}

export function exportNotebookAsHtml(notebook, pages) {
  const body = pages.map(pageTemplate).join('\n');
  const html = wrapDocument(notebook.name, body);
  const safeName = notebook.name.replace(/[^\w\- ]/g, '').trim() || 'quaderno';
  download(`${safeName}.html`, html, 'text/html');
}

export function exportNotebookAsJson(notebook, pages) {
  const payload = { notebook, pages, exportedAt: new Date().toISOString() };
  const safeName = notebook.name.replace(/[^\w\- ]/g, '').trim() || 'quaderno';
  download(`${safeName}.json`, JSON.stringify(payload, null, 2), 'application/json');
}
