import React, { useEffect, useState, useCallback } from 'react';
import Sidebar from './components/Sidebar.jsx';
import Dashboard from './components/Dashboard.jsx';
import Tasks from './components/Tasks.jsx';
import Resources from './components/Resources.jsx';
import Reports from './components/Reports.jsx';
import Toast from './components/Toast.jsx';
import { api } from './api.js';

export default function App() {
  const [view, setView] = useState('dashboard');
  const [project, setProject] = useState({ name: 'My Project', description: '' });
  const [tasks, setTasks] = useState([]);
  const [resources, setResources] = useState([]);
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
  }, []);

  const loadAll = useCallback(async () => {
    try {
      const [p, t, r, rep] = await Promise.all([
        api.getProject(),
        api.listTasks(),
        api.listResources(),
        api.getReports()
      ]);
      setProject(p);
      setTasks(t);
      setResources(r);
      setReports(rep);
    } catch (e) {
      showToast(`Failed to load data: ${e.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const refresh = useCallback(async () => {
    try {
      const [t, r, rep] = await Promise.all([
        api.listTasks(),
        api.listResources(),
        api.getReports()
      ]);
      setTasks(t);
      setResources(r);
      setReports(rep);
    } catch (e) {
      showToast(`Refresh failed: ${e.message}`, 'error');
    }
  }, [showToast]);

  const updateProjectName = async (name, description) => {
    try {
      const updated = await api.updateProject({ name, description });
      setProject(updated);
      showToast('Project updated', 'success');
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Loading project...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <Sidebar view={view} setView={setView} project={project} />
      <main className="main">
        <header className="topbar">
          <div>
            <h1>{project.name}</h1>
            <p className="muted">{project.description || 'Project Management Dashboard'}</p>
          </div>
          <button className="btn btn-ghost" onClick={refresh} title="Reload data">
            ⟳ Refresh
          </button>
        </header>
        <section className="content">
          {view === 'dashboard' && (
            <Dashboard
              tasks={tasks}
              resources={resources}
              reports={reports}
              project={project}
              onSaveProject={updateProjectName}
              onJump={setView}
            />
          )}
          {view === 'tasks' && (
            <Tasks
              tasks={tasks}
              resources={resources}
              refresh={refresh}
              showToast={showToast}
            />
          )}
          {view === 'resources' && (
            <Resources
              resources={resources}
              refresh={refresh}
              showToast={showToast}
            />
          )}
          {view === 'reports' && <Reports reports={reports} />}
        </section>
      </main>
      {toast && <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
