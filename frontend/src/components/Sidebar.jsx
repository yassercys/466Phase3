import React from 'react';

const items = [
  { key: 'dashboard', label: 'Dashboard', icon: '◆' },
  { key: 'tasks', label: 'Tasks', icon: '☰' },
  { key: 'resources', label: 'Resources', icon: '◉' },
  { key: 'reports', label: 'Reports', icon: '◈' }
];

export default function Sidebar({ view, setView, project }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">PM</div>
        <div>
          <div className="brand-title">Project Manager</div>
          <div className="brand-sub">{project?.name || 'Project'}</div>
        </div>
      </div>
      <nav className="nav">
        {items.map((item) => (
          <button
            key={item.key}
            className={`nav-item ${view === item.key ? 'active' : ''}`}
            onClick={() => setView(item.key)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar-foot">
        <div className="muted small">v1.0 · data.json</div>
      </div>
    </aside>
  );
}
