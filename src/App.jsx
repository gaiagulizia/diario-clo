import { useEffect, useMemo, useState } from 'react';
import { useAuth } from './context/AuthContext';
import Login from './components/Login';
import NotebookSidebar from './components/NotebookSidebar';
import PageList from './components/PageList';
import PageEditor from './components/PageEditor';
import * as data from './services/dataService';
import { exportNotebookAsHtml, exportNotebookAsJson } from './services/exportService';

function DiaryApp() {
  const { user } = useAuth();
  const [notebooks, setNotebooks] = useState([]);
  const [currentNotebookId, setCurrentNotebookId] = useState(null);
  const [pages, setPages] = useState([]);
  const [activePageId, setActivePageId] = useState(null);

  useEffect(() => {
    let nbs = data.getNotebooks(user.uid);
    if (nbs.length === 0) {
      nbs = [data.createNotebook(user.uid, 'Il mio primo quaderno')];
    }
    setNotebooks(nbs);
    setCurrentNotebookId(nbs[0].id);
  }, [user.uid]);

  useEffect(() => {
    if (!currentNotebookId) return;
    refreshPages();
    setActivePageId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentNotebookId]);

  function refreshPages() {
    const p = data.getPages(user.uid, currentNotebookId);
    setPages(p);
    return p;
  }

  const activePage = useMemo(
    () => pages.find((p) => p.id === activePageId) || null,
    [pages, activePageId]
  );

  function handleCreateNotebook() {
    const n = data.createNotebook(user.uid, 'Nuovo quaderno');
    setNotebooks(data.getNotebooks(user.uid));
    setCurrentNotebookId(n.id);
  }

  function handleRenameNotebook(id, name) {
    data.renameNotebook(user.uid, id, name);
    setNotebooks(data.getNotebooks(user.uid));
  }

  function handleDeleteNotebook(id) {
    data.deleteNotebook(user.uid, id);
    const remaining = data.getNotebooks(user.uid);
    const list = remaining.length ? remaining : [data.createNotebook(user.uid, 'Il mio primo quaderno')];
    setNotebooks(list);
    setCurrentNotebookId(list[0].id);
  }

  function handleNewPage() {
    const page = data.createPage(user.uid, currentNotebookId);
    setActivePageId(page.id);
    setPages((prev) => [...prev, page]);
  }

  function handlePageChange(patch) {
    if (!activePage) return;
    data.updatePage(user.uid, activePage.id, patch);
    refreshPages();
  }

  function handleDeletePage() {
    if (!activePage) return;
    if (!confirm('Eliminare questo foglio?')) return;
    data.deletePage(user.uid, activePage.id);
    setActivePageId(null);
    refreshPages();
  }

  function handleMovePages(pageIds, targetNotebookId) {
    data.movePages(user.uid, pageIds, targetNotebookId);
    if (pageIds.includes(activePageId)) setActivePageId(null);
    refreshPages();
  }

  function handleExportHtml() {
    const notebook = notebooks.find((n) => n.id === currentNotebookId);
    exportNotebookAsHtml(notebook, pages);
  }

  function handleExportJson() {
    const notebook = notebooks.find((n) => n.id === currentNotebookId);
    exportNotebookAsJson(notebook, pages);
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
        onExportHtml={handleExportHtml}
        onExportJson={handleExportJson}
      />

      <PageList
        pages={pages}
        notebooks={notebooks}
        currentNotebookId={currentNotebookId}
        activePageId={activePageId}
        onSelectPage={setActivePageId}
        onMovePages={handleMovePages}
      />

      <div className="editor-area">
        {activePage ? (
          <PageEditor page={activePage} onChange={handlePageChange} onDelete={handleDeletePage} />
        ) : (
          <div className="editor-empty">
            <p>Scegli un foglio, oppure iniziane uno nuovo</p>
            <button className="btn btn-cta" onClick={handleNewPage}>
              + Nuovo foglio di oggi
            </button>
          </div>
        )}
      </div>

      {activePage && (
        <button className="fab" title="Nuovo foglio" onClick={handleNewPage}>
          +
        </button>
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
