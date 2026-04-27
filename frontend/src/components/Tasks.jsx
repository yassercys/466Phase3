import React, { useState, useMemo } from 'react';
import Modal from './Modal.jsx';
import { api } from '../api.js';

const STATUSES = ['pending', 'in-progress', 'completed'];

function fmtMoney(n) {
  return `$${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const emptyForm = {
  name: '',
  description: '',
  duration: 1,
  status: 'pending',
  startDate: '',
  endDate: ''
};

export default function Tasks({ tasks, resources, refresh, showToast }) {
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [assignTask, setAssignTask] = useState(null);
  const [assignForm, setAssignForm] = useState({ resourceId: '', hours: 1 });
  const [filter, setFilter] = useState('all');

  const resourceById = useMemo(() => {
    const map = {};
    resources.forEach((r) => { map[r.id] = r; });
    return map;
  }, [resources]);

  const selectedResource = assignForm.resourceId ? resourceById[assignForm.resourceId] : null;
  const selectedIsCost = selectedResource && selectedResource.type === 'cost';

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (task) => {
    setForm({
      name: task.name,
      description: task.description || '',
      duration: task.duration || 0,
      status: task.status,
      startDate: task.startDate || '',
      endDate: task.endDate || ''
    });
    setEditingId(task.id);
    setModalOpen(true);
  };

  const submitTask = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.updateTask(editingId, form);
        showToast('Task updated', 'success');
      } else {
        await api.createTask(form);
        showToast('Task created', 'success');
      }
      setModalOpen(false);
      await refresh();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const removeTask = async (task) => {
    if (!confirm(`Delete task "${task.name}"?`)) return;
    try {
      await api.deleteTask(task.id);
      showToast('Task deleted', 'success');
      await refresh();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const openAssign = (task) => {
    setAssignTask(task);
    const first = resources[0];
    setAssignForm({
      resourceId: first ? first.id : '',
      hours: 1
    });
  };

  const submitAssign = async (e) => {
    e.preventDefault();
    if (!assignForm.resourceId) {
      showToast('Please select a resource', 'error');
      return;
    }
    try {
      await api.assignResource(assignTask.id, {
        resourceId: assignForm.resourceId,
        hours: Number(assignForm.hours)
      });
      showToast('Resource assigned', 'success');
      const updated = await api.listTasks();
      const next = updated.find((x) => x.id === assignTask.id);
      setAssignTask(next || null);
      setAssignForm({ resourceId: assignForm.resourceId, hours: 1 });
      await refresh();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const removeAssignment = async (resourceId) => {
    try {
      await api.unassignResource(assignTask.id, resourceId);
      showToast('Assignment removed', 'success');
      const updated = await api.listTasks();
      const next = updated.find((x) => x.id === assignTask.id);
      setAssignTask(next || null);
      await refresh();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const filtered =
    filter === 'all' ? tasks : tasks.filter((t) => t.status === filter);

  return (
    <div className="tasks-view">
      <div className="view-head">
        <div>
          <h2>Tasks</h2>
          <p className="muted">Create tasks and assign resources to track cost.</p>
        </div>
        <div className="view-actions">
          <select className="select" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button className="btn btn-primary" onClick={openCreate}>+ New Task</button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <h3>No tasks yet</h3>
          <p>Click "New Task" to add your first task.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>Duration</th>
                <th>Dates</th>
                <th>Resources</th>
                <th>Cost</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id}>
                  <td>
                    <div className="task-name">{t.name}</div>
                    {t.description && (
                      <div className="muted small">{t.description}</div>
                    )}
                  </td>
                  <td>
                    <span className={`pill pill-${t.status === 'in-progress' ? 'progress' : t.status === 'completed' ? 'done' : 'pending'}`}>
                      {t.status}
                    </span>
                  </td>
                  <td>{t.duration} {t.duration === 1 ? 'day' : 'days'}</td>
                  <td className="small muted">
                    {t.startDate || '—'} → {t.endDate || '—'}
                  </td>
                  <td>
                    <div className="assignments-cell">
                      {(t.assignments || []).length === 0 && <span className="muted small">None</span>}
                      {(t.assignments || []).map((a) => {
                        const r = resourceById[a.resourceId];
                        if (!r) {
                          return (
                            <span key={a.resourceId} className="chip">
                              Removed · {a.hours}
                            </span>
                          );
                        }
                        const isCost = r.type === 'cost';
                        return (
                          <span key={a.resourceId} className={`chip ${isCost ? 'chip-cost' : 'chip-work'}`}>
                            {r.name} · {isCost ? `×${a.hours}` : `${a.hours}h`}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td className="cost-cell">{fmtMoney(t.cost)}</td>
                  <td className="row-actions">
                    <button className="btn btn-sm" onClick={() => openAssign(t)}>Assign</button>
                    <button className="btn btn-sm" onClick={() => openEdit(t)}>Edit</button>
                    <button className="btn btn-sm btn-danger" onClick={() => removeTask(t)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <Modal
          title={editingId ? 'Edit Task' : 'New Task'}
          onClose={() => setModalOpen(false)}
        >
          <form onSubmit={submitTask} className="form">
            <label>
              Name *
              <input
                value={form.name}
                required
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>
            <label>
              Description
              <textarea
                rows="3"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </label>
            <div className="form-row">
              <label>
                Duration (days)
                <input
                  type="number"
                  min="0"
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                />
              </label>
              <label>
                Status
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="form-row">
              <label>
                Start Date
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                />
              </label>
              <label>
                End Date
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                />
              </label>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">{editingId ? 'Save' : 'Create'}</button>
            </div>
          </form>
        </Modal>
      )}

      {assignTask && (
        <Modal title={`Assign Resources — ${assignTask.name}`} onClose={() => setAssignTask(null)}>
          <div className="assign-section">
            <h4>Current assignments</h4>
            {(assignTask.assignments || []).length === 0 ? (
              <div className="empty">No resources assigned yet.</div>
            ) : (
              <ul className="assign-list">
                {(assignTask.assignments || []).map((a) => {
                  const r = resourceById[a.resourceId];
                  if (!r) {
                    return (
                      <li key={a.resourceId}>
                        <div className="muted">Removed resource</div>
                        <button className="btn btn-sm btn-danger" onClick={() => removeAssignment(a.resourceId)}>Remove</button>
                      </li>
                    );
                  }
                  const isCost = r.type === 'cost';
                  const unitCost = isCost ? Number(r.cost) : Number(r.costPerHour);
                  const subtotal = unitCost * Number(a.hours);
                  return (
                    <li key={a.resourceId}>
                      <div>
                        <div className="strong">
                          {r.name}{' '}
                          <span className={`type-tag type-tag-sm ${isCost ? 'type-cost' : 'type-work'}`}>
                            {isCost ? 'Cost' : 'Work'}
                          </span>
                        </div>
                        <div className="muted small">
                          {isCost
                            ? `${a.hours} × ${fmtMoney(r.cost)} = ${fmtMoney(subtotal)}`
                            : `${a.hours}h × ${fmtMoney(r.costPerHour)} = ${fmtMoney(subtotal)}`}
                        </div>
                      </div>
                      <button className="btn btn-sm btn-danger" onClick={() => removeAssignment(a.resourceId)}>Remove</button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="divider" />

          {resources.length === 0 ? (
            <div className="empty">No resources exist. Add resources first.</div>
          ) : (
            <form onSubmit={submitAssign} className="form">
              <h4 className="m0">Add / update assignment</h4>
              <div className="form-row">
                <label>
                  Resource
                  <select
                    value={assignForm.resourceId}
                    onChange={(e) => setAssignForm({ ...assignForm, resourceId: e.target.value })}
                  >
                    {resources.map((r) => {
                      const isCost = r.type === 'cost';
                      const rate = isCost
                        ? `${fmtMoney(r.cost)} fixed`
                        : `${fmtMoney(r.costPerHour)}/h`;
                      const tag = isCost ? '[Cost]' : '[Work]';
                      return (
                        <option key={r.id} value={r.id}>
                          {tag} {r.name} ({rate})
                        </option>
                      );
                    })}
                  </select>
                </label>
                <label>
                  {selectedIsCost ? 'Quantity' : 'Hours'}
                  <input
                    type="number"
                    min={selectedIsCost ? '1' : '0.25'}
                    step={selectedIsCost ? '1' : '0.25'}
                    value={assignForm.hours}
                    onChange={(e) => setAssignForm({ ...assignForm, hours: e.target.value })}
                  />
                </label>
              </div>
              {selectedResource && (
                <div className="muted small">
                  {selectedIsCost
                    ? `Total = quantity × ${fmtMoney(selectedResource.cost)}`
                    : `Total = hours × ${fmtMoney(selectedResource.costPerHour)}`}
                </div>
              )}
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">Assign</button>
              </div>
              <p className="muted small">
                Tip: assigning the same resource again updates its hours/quantity.
              </p>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
}
