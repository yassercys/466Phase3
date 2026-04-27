import React, { useState } from 'react';

function fmtMoney(n) {
  return `$${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function Dashboard({ tasks, resources, reports, project, onSaveProject, onJump }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || '');

  const totalCost = reports?.summary?.totalProjectCost || 0;
  const statusCounts = reports?.summary?.statusCounts || {};
  const totalTasks = tasks.length;
  const totalResources = resources.length;

  const recentTasks = [...tasks].slice(-5).reverse();

  const handleSave = async (e) => {
    e.preventDefault();
    await onSaveProject(name.trim() || 'Untitled Project', description.trim());
    setEditing(false);
  };

  return (
    <div className="dashboard">
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Total Tasks</div>
          <div className="kpi-value">{totalTasks}</div>
          <button className="kpi-link" onClick={() => onJump('tasks')}>View tasks →</button>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Resources</div>
          <div className="kpi-value">{totalResources}</div>
          <button className="kpi-link" onClick={() => onJump('resources')}>Manage →</button>
        </div>
        <div className="kpi-card highlight">
          <div className="kpi-label">Total Project Cost</div>
          <div className="kpi-value">{fmtMoney(totalCost)}</div>
          <button className="kpi-link" onClick={() => onJump('reports')}>See report →</button>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Status</div>
          <div className="status-mini">
            <span className="pill pill-pending">{statusCounts.pending || 0} pending</span>
            <span className="pill pill-progress">{statusCounts['in-progress'] || 0} in progress</span>
            <span className="pill pill-done">{statusCounts.completed || 0} done</span>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="panel">
          <div className="panel-head">
            <h2>Project Info</h2>
            {!editing && (
              <button className="btn btn-ghost" onClick={() => setEditing(true)}>Edit</button>
            )}
          </div>
          {editing ? (
            <form onSubmit={handleSave} className="form">
              <label>
                Project Name
                <input value={name} onChange={(e) => setName(e.target.value)} required />
              </label>
              <label>
                Description
                <textarea
                  rows="3"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </label>
              <div className="form-actions">
                <button type="button" className="btn btn-ghost" onClick={() => {
                  setEditing(false);
                  setName(project.name);
                  setDescription(project.description || '');
                }}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save</button>
              </div>
            </form>
          ) : (
            <div className="info-block">
              <div><strong>Name:</strong> {project.name}</div>
              <div><strong>Description:</strong> {project.description || <span className="muted">No description</span>}</div>
            </div>
          )}
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2>Recent Tasks</h2>
            <button className="btn btn-ghost" onClick={() => onJump('tasks')}>All tasks</button>
          </div>
          {recentTasks.length === 0 ? (
            <div className="empty">No tasks yet. Create one in the Tasks view.</div>
          ) : (
            <ul className="recent-list">
              {recentTasks.map((t) => (
                <li key={t.id}>
                  <div>
                    <div className="recent-name">{t.name}</div>
                    <div className="muted small">{t.description || 'No description'}</div>
                  </div>
                  <div className="recent-right">
                    <span className={`pill pill-${t.status === 'in-progress' ? 'progress' : t.status === 'completed' ? 'done' : 'pending'}`}>
                      {t.status}
                    </span>
                    <div className="recent-cost">{fmtMoney(t.cost)}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
