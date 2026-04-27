const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data && data.error) message = data.error;
    } catch (_) {}
    throw new Error(message);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  // Project
  getProject: () => request('/project'),
  updateProject: (body) => request('/project', { method: 'PUT', body: JSON.stringify(body) }),

  // Tasks
  listTasks: () => request('/tasks'),
  createTask: (body) => request('/tasks', { method: 'POST', body: JSON.stringify(body) }),
  updateTask: (id, body) =>
    request(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),

  // Assignments
  assignResource: (taskId, body) =>
    request(`/tasks/${taskId}/assignments`, {
      method: 'POST',
      body: JSON.stringify(body)
    }),
  unassignResource: (taskId, resourceId) =>
    request(`/tasks/${taskId}/assignments/${resourceId}`, { method: 'DELETE' }),

  // Resources
  listResources: () => request('/resources'),
  createResource: (body) =>
    request('/resources', { method: 'POST', body: JSON.stringify(body) }),
  updateResource: (id, body) =>
    request(`/resources/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteResource: (id) => request(`/resources/${id}`, { method: 'DELETE' }),

  // Reports
  getReports: () => request('/reports')
};
