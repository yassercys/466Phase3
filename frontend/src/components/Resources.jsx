import React, { useState } from 'react';
import Modal from './Modal.jsx';
import { api } from '../api.js';

const emptyForm = {
  type: 'work',
  name: '',
  role: '',
  costPerHour: 0,
  cost: 0
};

function fmtMoney(n) {
  return `$${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function Resources({ resources, refresh, showToast }) {
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [filter, setFilter] = useState('all');

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (r) => {
    setForm({
      type: r.type || 'work',
      name: r.name,
      role: r.role || '',
      costPerHour: r.costPerHour ?? 0,
      cost: r.cost ?? 0
    });
    setEditingId(r.id);
    setModalOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    let payload;
    if (form.type === 'cost') {
      payload = {
        type: 'cost',
        name: form.name,
        cost: Number(form.cost)
      };
    } else {
      payload = {
        type: 'work',
        name: form.name,
        role: form.role,
        costPerHour: Number(form.costPerHour)
      };
    }
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

  const filtered =
    filter === 'all' ? resources : resources.filter((r) => (r.type || 'work') === filter);

  const workCount = resources.filter((r) => (r.type || 'work') === 'work').length;
  const costCount = resources.filter((r) => r.type === 'cost').length;

  return (
    <div className="resources-view">
      <div className="view-head">
        <div>
          <h2>Resources</h2>
          <p className="muted">
            <strong>Work</strong> resources have an hourly rate (people, services).{' '}
            <strong>Cost</strong> resources have a fixed unit cost (materials, equipment).
          </p>
        </div>
        <div className="view-actions">
          <select className="select" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All ({resources.length})</option>
            <option value="work">Work ({workCount})</option>
            <option value="cost">Cost ({costCount})</option>
          </select>
          <button className="btn btn-primary" onClick={openCreate}>+ New Resource</button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <h3>No resources yet</h3>
          <p>Add a Work or Cost resource to start assigning it to tasks.</p>
        </div>
      ) : (
        <div className="cards-grid">
          {filtered.map((r) => {
            const type = r.type || 'work';
            const isCost = type === 'cost';
            return (
              <div key={r.id} className={`resource-card ${isCost ? 'is-cost' : 'is-work'}`}>
                <div className={`avatar ${isCost ? 'avatar-cost' : ''}`}>
                  {isCost
                    ? '$'
                    : r.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
                </div>
                <div className="resource-info">
                  <div className="resource-head">
                    <div className="resource-name">{r.name}</div>
                    <span className={`type-tag ${isCost ? 'type-cost' : 'type-work'}`}>
                      {isCost ? 'Cost' : 'Work'}
                    </span>
                  </div>
                  {isCost ? (
                    <div className="muted small">Fixed unit cost</div>
                  ) : (
                    <div className="muted small">{r.role || 'No role'}</div>
                  )}
                  <div className="resource-rate">
                    {isCost
                      ? `${fmtMoney(r.cost)} per unit`
                      : `${fmtMoney(r.costPerHour)} per hour`}
                  </div>
                </div>
                <div className="resource-actions">
                  <button className="btn btn-sm" onClick={() => openEdit(r)}>Edit</button>
                  <button className="btn btn-sm btn-danger" onClick={() => remove(r)}>Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <Modal title={editingId ? 'Edit Resource' : 'New Resource'} onClose={() => setModalOpen(false)}>
          <form onSubmit={submit} className="form">
            <div>
              <div className="label-text">Type *</div>
              <div className={`type-toggle ${editingId ? 'disabled' : ''}`}>
                <label className={`type-option ${form.type === 'work' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="type"
                    value="work"
                    checked={form.type === 'work'}
                    disabled={!!editingId}
                    onChange={() => setForm({ ...form, type: 'work' })}
                  />
                  <div>
                    <div className="strong">Work</div>
                    <div className="muted small">Person / hourly</div>
                  </div>
                </label>
                <label className={`type-option ${form.type === 'cost' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="type"
                    value="cost"
                    checked={form.type === 'cost'}
                    disabled={!!editingId}
                    onChange={() => setForm({ ...form, type: 'cost' })}
                  />
                  <div>
                    <div className="strong">Cost</div>
                    <div className="muted small">Material / fixed</div>
                  </div>
                </label>
              </div>
              {editingId && (
                <p className="muted small" style={{ marginTop: 6 }}>
                  Type cannot be changed after creation.
                </p>
              )}
            </div>

            <label>
              Name *
              <input
                value={form.name}
                required
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>

            {form.type === 'work' ? (
              <>
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
              </>
            ) : (
              <label>
                Cost ($) *
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={form.cost}
                  onChange={(e) => setForm({ ...form, cost: e.target.value })}
                />
              </label>
            )}

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
