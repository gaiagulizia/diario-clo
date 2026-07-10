import { useEffect, useMemo, useState } from 'react';
import { useAuth } from './context/AuthContext';
import Login from './components/Login';
import NotebookSidebar from './components/NotebookSidebar';
import PageList from './components/PageList';
import PageEditor from './components/PageEditor';
import SubcardEditor from './components/SubcardEditor';
import TrashModal from './components/TrashModal';
import SettingsModal from './components/SettingsModal';
import * as data from './services/dataService';
import { exportNotebookAsHtml, exportNotebookAsJson } from './services/exportService';

function DiaryApp() {
  const { user } = useAuth();
  const [notebooks, setNotebooks] = useState([]);
  const [currentNotebookId, setCurrentNotebookId] = useState(null);
  const [pages, setPages] = useState([]); // raw: include anche i fogli ancora bianchi
  const [activePageId, setActivePageId] = useState(null);
  const [trashOpen, setTrashOpen] = useState(false);
  const [trashItems, setTrashItems] = useState([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [allSubcards, setAllSubcards] = useState([]);
  // Pila delle sottoschede aperte in sequenza (una sottoscheda può
  // contenere il collegamento a un'altra sottoscheda): l'ultima è quella
  // visibile, "torna alla pagina" toglie l'ultima.
  const [subcardStack, setSubcardStack] = useState([]);

  // All'avvio: elimina dal cestino ciò che ha più di 60 giorni, poi carica i quaderni
  useEffect(() => {
    data.purgeOldTrash(user.uid);
    refreshTrash();
    refreshSubcards();

    let nbs = data.getNotebooks(user.uid);
    if (nbs.length === 0) {
      nbs = [data.createNotebook(user.uid, 'Il mio primo quaderno')];
    }
    setNotebooks(nbs);
    setCurrentNotebookId(nbs[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.uid]);

  useEffect(() => {
    if (!currentNotebookId) return;
    refreshPages();
    setActivePageId(null);
    setSubcardStack([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentNotebookId]);

  function refreshPages() {
    const p = data.getAllPagesRaw(user.uid, currentNotebookId);
    setPages(p);
    return p;
  }

  function refreshTrash() {
    setTrashItems(data.getTrash(user.uid));
  }

  function refreshSubcards() {
    setAllSubcards(data.getAllSubcards(user.uid));
  }

  const subcardsById = useMemo(
    () => Object.fromEntries(allSubcards.map((s) => [s.id, s.title])),
    [allSubcards]
  );

  const openSubcardId = subcardStack[subcardStack.length - 1] || null;

  function pushSubcard(subcardId) {
    setSubcardStack((s) => [...s, subcardId]);
  }

  function popSubcard() {
    setSubcardStack((s) => s.slice(0, -1));
  }

  const activePage = useMemo(
    () => pages.find((p) => p.id === activePageId) || null,
    [pages, activePageId]
  );

  // Fogli mostrati nell'elenco: nascondi quelli senza contenuto reale,
  // TRANNE quello che si sta scrivendo in questo momento (così cancellare
  // il titolo o il testo non fa "sparire" la pagina che si sta modificando).
  const visiblePages = useMemo(
    () => pages.filter((p) => data.isPageNonEmpty(p) || p.id === activePageId),
    [pages, activePageId]
  );

  /** Se il foglio che si sta abbandonando è ancora completamente vuoto,
   *  lo scarta silenziosamente invece di lasciarlo in giro come bozza fantasma. */
  function discardIfBlank(pageId) {
    if (!pageId) return;
    const p = pages.find((pg) => pg.id === pageId);
    if (p && !data.isPageNonEmpty(p)) {
      data.discardBlankPage(user.uid, pageId);
    }
  }

  function selectPage(pageId) {
    setSubcardStack([]);
    if (pageId === activePageId) return;
    discardIfBlank(activePageId);
    setActivePageId(pageId);
    refreshPages();
  }

  function handleCreateNotebook() {
    const n = data.createNotebook(user.uid, 'Nuovo quaderno');
    setNotebooks(data.getNotebooks(user.uid));
    setCurrentNotebookId(n.id);
  }

  function handleRenameNotebook(id, name) {
    data.renameNotebook(user.uid, id, name);
    setNotebooks(data.getNotebooks(user.uid));
  }

  function handleSetNotebookColor(id, color) {
    data.setNotebookColor(user.uid, id, color);
    setNotebooks(data.getNotebooks(user.uid));
  }

  function handleDeleteNotebook(id) {
    discardIfBlank(activePageId);
    data.deleteNotebook(user.uid, id);
    const remaining = data.getNotebooks(user.uid);
    const list = remaining.length ? remaining : [data.createNotebook(user.uid, 'Il mio primo quaderno')];
    setNotebooks(list);
    setCurrentNotebookId(list[0].id);
    refreshTrash();
  }

  function handleNewPage() {
    setSubcardStack([]);
    discardIfBlank(activePageId);
    const page = data.createPage(user.uid, currentNotebookId);
    setPages((prev) => [...prev, page]);
    setActivePageId(page.id);
  }

  function handlePageChange(patch) {
    if (!activePage) return;
    data.updatePage(user.uid, activePage.id, patch);
    refreshPages();
  }

  function handleDeletePage() {
    if (!activePage) return;
    if (!confirm('Spostare questo foglio nel cestino?')) return;
    data.deletePage(user.uid, activePage.id);
    setActivePageId(null);
    refreshPages();
    refreshTrash();
  }

  function handleMovePages(pageIds, targetNotebookId) {
    data.movePages(user.uid, pageIds, targetNotebookId);
    if (pageIds.includes(activePageId)) setActivePageId(null);
    refreshPages();
  }

  function handleBulkDeletePages(pageIds) {
    data.deletePages(user.uid, pageIds);
    if (pageIds.includes(activePageId)) setActivePageId(null);
    refreshPages();
    refreshTrash();
  }

  function handleAssignTags(pageIds, tags) {
    data.addTagsToPages(user.uid, pageIds, tags);
    refreshPages();
  }

  function handleExportHtml() {
    const notebook = notebooks.find((n) => n.id === currentNotebookId);
    exportNotebookAsHtml(notebook, visiblePages);
  }

  function handleExportJson() {
    const notebook = notebooks.find((n) => n.id === currentNotebookId);
    exportNotebookAsJson(notebook, visiblePages);
  }

  function handleRestoreFromTrash(pageId) {
    data.restorePage(user.uid, pageId);
    refreshTrash();
    refreshPages();
  }

  function handleDeleteForever(pageId) {
    data.permanentlyDeletePage(user.uid, pageId);
    refreshTrash();
  }

  function handleEmptyTrash() {
    data.emptyTrash(user.uid);
    refreshTrash();
  }

  return (
    <div className="app">
      <NotebookSidebar
        notebooks={notebooks}
        currentNotebookId={currentNotebookId}
        onSelect={setCurrentNotebookId}
        onCreate={handleCreateNotebook}
        onRename={handleRenameNotebook}
        onDelete={handleDeleteNotebook}
        onSetColor={handleSetNotebookColor}
        onExportHtml={handleExportHtml}
        onExportJson={handleExportJson}
        onOpenTrash={() => {
          refreshTrash();
          setTrashOpen(true);
        }}
        trashCount={trashItems.length}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <PageList
        pages={visiblePages}
        notebooks={notebooks}
        currentNotebookId={currentNotebookId}
        activePageId={activePageId}
        onSelectPage={selectPage}
        onMovePages={handleMovePages}
        onDeletePages={handleBulkDeletePages}
        onAssignTags={handleAssignTags}
        subcardsById={subcardsById}
        onOpenSubcard={pushSubcard}
      />

      <div className="editor-area">
        {openSubcardId ? (
          <SubcardEditor
            subcardId={openSubcardId}
            backLabel={subcardStack.length > 1 ? 'Torna alla sottoscheda precedente' : 'Torna alla pagina'}
            onBack={popSubcard}
            onNavigateToSubcard={pushSubcard}
            onSubcardsChanged={refreshSubcards}
            onDeleted={popSubcard}
          />
        ) : activePage ? (
          <PageEditor
            page={activePage}
            onChange={handlePageChange}
            onDelete={handleDeletePage}
            siblingPages={pages}
            onNavigate={selectPage}
            onNavigateToSubcard={pushSubcard}
            onSubcardsChanged={refreshSubcards}
          />
        ) : (
          <div className="editor-empty">
            <p>Scegli un foglio, oppure iniziane uno nuovo</p>
            <button className="btn btn-cta" onClick={handleNewPage}>
              + Nuovo foglio di oggi
            </button>
          </div>
        )}
      </div>

      {activePage && !openSubcardId && (
        <button className="fab" title="Nuovo foglio" onClick={handleNewPage}>
          +
        </button>
      )}

      {trashOpen && (
        <TrashModal
          items={trashItems}
          onRestore={handleRestoreFromTrash}
          onDeleteForever={handleDeleteForever}
          onEmpty={handleEmptyTrash}
          onClose={() => setTrashOpen(false)}
        />
      )}

      {settingsOpen && (
        <SettingsModal onClose={() => setSettingsOpen(false)} onChanged={refreshPages} />
      )}
    </div>
  );
}

export default function App() {
  const { user, ready } = useAuth();

  if (!ready) return null;
  if (!user) return <Login />;
  return <DiaryApp />;
}
