import React, { useState } from 'react';
import Modal from './Modal.jsx';
import { api } from '../api.js';

const emptyForm = { name: '', role: '', costPerHour: 0 };

function fmtMoney(n) {
  return `$${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function Resources({ resources, refresh, showToast }) {
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (r) => {
    setForm({ name: r.name, role: r.role || '', costPerHour: r.costPerHour });
    setEditingId(r.id);
    setModalOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      role: form.role,
      costPerHour: Number(form.costPerHour)
    };
    try {
      if (editingId) {
        await api.updateResource(editingId, payload);
        showToast('Resource updated', 'success');
      } else {
        await api.createResource(payload);
        showToast('Resource added', 'success');
      }
      setModalOpen(false);
      await refresh();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const remove = async (r) => {
    if (!confirm(`Delete resource "${r.name}"? Any task assignments will be removed.`)) return;
    try {
      await api.deleteResource(r.id);
      showToast('Resource deleted', 'success');
      await refresh();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="resources-view">
      <div className="view-head">
        <div>
          <h2>Resources</h2>
          <p className="muted">People or assets used by tasks. Cost per hour drives task cost.</p>
        </div>
        <div className="view-actions">
          <button className="btn btn-primary" onClick={openCreate}>+ New Resource</button>
        </div>
      </div>

      {resources.length === 0 ? (
        <div className="empty-state">
          <h3>No resources yet</h3>
          <p>Add a resource to start assigning it to tasks.</p>
        </div>
      ) : (
        <div className="cards-grid">
          {resources.map((r) => (
            <div key={r.id} className="resource-card">
              <div className="avatar">
                {r.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
              </div>
              <div className="resource-info">
                <div className="resource-name">{r.name}</div>
                <div className="muted small">{r.role || 'No role'}</div>
                <div className="resource-rate">{fmtMoney(r.costPerHour)}/hour</div>
              </div>
              <div className="resource-actions">
                <button className="btn btn-sm" onClick={() => openEdit(r)}>Edit</button>
                <button className="btn btn-sm btn-danger" onClick={() => remove(r)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <Modal title={editingId ? 'Edit Resource' : 'New Resource'} onClose={() => setModalOpen(false)}>
          <form onSubmit={submit} className="form">
            <label>
              Name *
              <input
                value={form.name}
                required
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>
            <label>
              Role
              <input
                value={form.role}
                placeholder="e.g. Frontend Developer"
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              />
            </label>
            <label>
              Cost per hour ($) *
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={form.costPerHour}
                onChange={(e) => setForm({ ...form, costPerHour: e.target.value })}
              />
            </label>
            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">{editingId ? 'Save' : 'Create'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
