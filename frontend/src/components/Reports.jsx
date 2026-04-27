import React from 'react';

function fmtMoney(n) {
  return `$${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function Reports({ reports }) {
  if (!reports) {
    return <div className="empty">Loading reports...</div>;
  }

  const { summary, tasks, resources, project } = reports;

  return (
    <div className="reports-view">
      <div className="view-head">
        <div>
          <h2>Reports</h2>
          <p className="muted">Read-only summary auto-calculated from your tasks and resources.</p>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Project</div>
          <div className="kpi-value small-value">{project.name}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Tasks</div>
          <div className="kpi-value">{summary.totalTasks}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Resources</div>
          <div className="kpi-value">{summary.totalResources}</div>
        </div>
        <div className="kpi-card highlight">
          <div className="kpi-label">Total Project Cost</div>
          <div className="kpi-value">{fmtMoney(summary.totalProjectCost)}</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3>Cost by Task</h3>
        </div>
        {tasks.length === 0 ? (
          <div className="empty">No tasks to report.</div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Status</th>
                  <th>Work Hours</th>
                  <th>Resources</th>
                  <th>Cost</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((t) => (
                  <tr key={t.id}>
                    <td><strong>{t.name}</strong></td>
                    <td>
                      <span className={`pill pill-${t.status === 'in-progress' ? 'progress' : t.status === 'completed' ? 'done' : 'pending'}`}>
                        {t.status}
                      </span>
                    </td>
                    <td>{t.totalHours}h</td>
                    <td>
                      {t.assignments.length === 0 ? (
                        <span className="muted small">None</span>
                      ) : (
                        <ul className="report-assign-list">
                          {t.assignments.map((a) => {
                            const isCost = a.resourceType === 'cost';
                            return (
                              <li key={a.resourceId}>
                                {a.resourceName}{' '}
                                <span className={`type-tag type-tag-sm ${isCost ? 'type-cost' : 'type-work'}`}>
                                  {isCost ? 'Cost' : 'Work'}
                                </span>{' '}
                                — {isCost
                                  ? `${a.units} × ${fmtMoney(a.unitCost)}`
                                  : `${a.units}h × ${fmtMoney(a.unitCost)}`} = <strong>{fmtMoney(a.subtotal)}</strong>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </td>
                    <td className="cost-cell"><strong>{fmtMoney(t.cost)}</strong></td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="4" style={{ textAlign: 'right' }}><strong>Total</strong></td>
                  <td className="cost-cell"><strong>{fmtMoney(summary.totalProjectCost)}</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3>Resource Utilization</h3>
        </div>
        {resources.length === 0 ? (
          <div className="empty">No resources to report.</div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Resource</th>
                  <th>Type</th>
                  <th>Role / —</th>
                  <th>Rate</th>
                  <th>Used</th>
                  <th>Tasks</th>
                  <th>Total Cost</th>
                </tr>
              </thead>
              <tbody>
                {resources.map((r) => {
                  const isCost = r.type === 'cost';
                  return (
                    <tr key={r.id}>
                      <td><strong>{r.name}</strong></td>
                      <td>
                        <span className={`type-tag type-tag-sm ${isCost ? 'type-cost' : 'type-work'}`}>
                          {isCost ? 'Cost' : 'Work'}
                        </span>
                      </td>
                      <td>{isCost ? <span className="muted">—</span> : (r.role || <span className="muted">—</span>)}</td>
                      <td>
                        {isCost
                          ? `${fmtMoney(r.cost)} / unit`
                          : `${fmtMoney(r.costPerHour)} / h`}
                      </td>
                      <td>{isCost ? `×${r.totalUnits}` : `${r.totalUnits}h`}</td>
                      <td>
                        {r.tasks.length === 0 ? (
                          <span className="muted small">Not assigned</span>
                        ) : (
                          <ul className="report-assign-list">
                            {r.tasks.map((t) => (
                              <li key={t.taskId}>
                                {t.taskName} — {isCost ? `×${t.units}` : `${t.units}h`}
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                      <td className="cost-cell"><strong>{fmtMoney(r.totalEarnings)}</strong></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3>Status Breakdown</h3>
        </div>
        <div className="status-row">
          {['pending', 'in-progress', 'completed'].map((s) => (
            <div key={s} className="status-tile">
              <div className="muted small">{s}</div>
              <div className="status-num">{summary.statusCounts[s] || 0}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
