const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 4000;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(cors());
app.use(express.json());

// ---------- Data layer ----------

function ensureDataFile() {
  if (!fs.existsSync(DATA_FILE)) {
    const initial = {
      project: { name: 'My Project', description: 'A sample project' },
      tasks: [],
      resources: []
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2));
  }
}

function readData() {
  ensureDataFile();
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    parsed = {};
  }
  if (!parsed.project) parsed.project = { name: 'My Project', description: '' };
  if (!Array.isArray(parsed.tasks)) parsed.tasks = [];
  if (!Array.isArray(parsed.resources)) parsed.resources = [];
  // Backward-compat: any resource without `type` is a "work" resource.
  parsed.resources = parsed.resources.map((r) => ({
    type: r.type || 'work',
    ...r,
    type: r.type || 'work'
  }));
  return parsed;
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function genId(prefix) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

function calcTaskCost(task, resources) {
  if (!task.assignments) return 0;
  return task.assignments.reduce((sum, a) => {
    const r = resources.find((x) => x.id === a.resourceId);
    if (!r) return sum;
    const units = Number(a.hours || 0);
    if (r.type === 'cost') {
      return sum + Number(r.cost || 0) * units;
    }
    return sum + units * Number(r.costPerHour || 0);
  }, 0);
}

function resourceUnitCost(resource) {
  if (resource.type === 'cost') return Number(resource.cost || 0);
  return Number(resource.costPerHour || 0);
}

// ---------- Project ----------

app.get('/api/project', (req, res) => {
  const data = readData();
  res.json(data.project);
});

app.put('/api/project', (req, res) => {
  const data = readData();
  data.project = {
    name: req.body.name || data.project.name,
    description: req.body.description ?? data.project.description
  };
  writeData(data);
  res.json(data.project);
});

// ---------- Tasks ----------

app.get('/api/tasks', (req, res) => {
  const data = readData();
  const enriched = data.tasks.map((t) => ({
    ...t,
    cost: calcTaskCost(t, data.resources)
  }));
  res.json(enriched);
});

app.post('/api/tasks', (req, res) => {
  const data = readData();
  const { name, description, duration, status, startDate, endDate } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Task name is required' });
  }
  const task = {
    id: genId('t'),
    name: name.trim(),
    description: description || '',
    duration: Number(duration) || 0,
    status: status || 'pending',
    startDate: startDate || '',
    endDate: endDate || '',
    assignments: []
  };
  data.tasks.push(task);
  writeData(data);
  res.status(201).json({ ...task, cost: 0 });
});

app.put('/api/tasks/:id', (req, res) => {
  const data = readData();
  const idx = data.tasks.findIndex((t) => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Task not found' });

  const current = data.tasks[idx];
  const updated = {
    ...current,
    name: req.body.name !== undefined ? String(req.body.name).trim() : current.name,
    description: req.body.description !== undefined ? req.body.description : current.description,
    duration: req.body.duration !== undefined ? Number(req.body.duration) || 0 : current.duration,
    status: req.body.status !== undefined ? req.body.status : current.status,
    startDate: req.body.startDate !== undefined ? req.body.startDate : current.startDate,
    endDate: req.body.endDate !== undefined ? req.body.endDate : current.endDate
  };
  data.tasks[idx] = updated;
  writeData(data);
  res.json({ ...updated, cost: calcTaskCost(updated, data.resources) });
});

app.delete('/api/tasks/:id', (req, res) => {
  const data = readData();
  const before = data.tasks.length;
  data.tasks = data.tasks.filter((t) => t.id !== req.params.id);
  if (data.tasks.length === before) {
    return res.status(404).json({ error: 'Task not found' });
  }
  writeData(data);
  res.json({ ok: true });
});

// ---------- Assignments (resources -> tasks) ----------

app.post('/api/tasks/:id/assignments', (req, res) => {
  const data = readData();
  const task = data.tasks.find((t) => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const { resourceId, hours } = req.body;
  const resource = data.resources.find((r) => r.id === resourceId);
  if (!resource) return res.status(400).json({ error: 'Resource not found' });

  const h = Number(hours);
  if (!Number.isFinite(h) || h <= 0) {
    const label = resource.type === 'cost' ? 'Quantity' : 'Hours';
    return res.status(400).json({ error: `${label} must be a positive number` });
  }

  if (!task.assignments) task.assignments = [];
  const existing = task.assignments.find((a) => a.resourceId === resourceId);
  if (existing) {
    existing.hours = h;
  } else {
    task.assignments.push({ resourceId, hours: h });
  }
  writeData(data);
  res.json({ ...task, cost: calcTaskCost(task, data.resources) });
});

app.delete('/api/tasks/:id/assignments/:resourceId', (req, res) => {
  const data = readData();
  const task = data.tasks.find((t) => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  task.assignments = (task.assignments || []).filter(
    (a) => a.resourceId !== req.params.resourceId
  );
  writeData(data);
  res.json({ ...task, cost: calcTaskCost(task, data.resources) });
});

// ---------- Resources ----------

function buildResourceFromBody(body, fallback) {
  const type = body.type || (fallback && fallback.type) || 'work';
  if (type !== 'work' && type !== 'cost') {
    throw Object.assign(new Error('Resource type must be "work" or "cost"'), { status: 400 });
  }

  const name = body.name !== undefined ? String(body.name).trim() : (fallback ? fallback.name : '');
  if (!name) {
    throw Object.assign(new Error('Resource name is required'), { status: 400 });
  }

  if (type === 'work') {
    let costPerHour =
      body.costPerHour !== undefined
        ? Number(body.costPerHour)
        : fallback
        ? Number(fallback.costPerHour || 0)
        : NaN;
    if (!Number.isFinite(costPerHour) || costPerHour < 0) {
      throw Object.assign(new Error('Cost per hour must be a non-negative number'), { status: 400 });
    }
    const role =
      body.role !== undefined ? String(body.role) : fallback ? fallback.role || '' : '';
    return { type: 'work', name, role, costPerHour };
  }

  // type === 'cost'
  let cost =
    body.cost !== undefined
      ? Number(body.cost)
      : fallback
      ? Number(fallback.cost || 0)
      : NaN;
  if (!Number.isFinite(cost) || cost < 0) {
    throw Object.assign(new Error('Cost must be a non-negative number'), { status: 400 });
  }
  return { type: 'cost', name, cost };
}

app.get('/api/resources', (req, res) => {
  const data = readData();
  res.json(data.resources);
});

app.post('/api/resources', (req, res) => {
  const data = readData();
  let built;
  try {
    built = buildResourceFromBody(req.body, null);
  } catch (e) {
    return res.status(e.status || 400).json({ error: e.message });
  }
  const resource = { id: genId('r'), ...built };
  data.resources.push(resource);
  writeData(data);
  res.status(201).json(resource);
});

app.put('/api/resources/:id', (req, res) => {
  const data = readData();
  const idx = data.resources.findIndex((r) => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Resource not found' });

  const current = data.resources[idx];
  // Type is immutable to keep cost calculations consistent with existing assignments.
  const body = { ...req.body, type: current.type };

  let built;
  try {
    built = buildResourceFromBody(body, current);
  } catch (e) {
    return res.status(e.status || 400).json({ error: e.message });
  }
  const updated = { id: current.id, ...built };
  data.resources[idx] = updated;
  writeData(data);
  res.json(updated);
});

app.delete('/api/resources/:id', (req, res) => {
  const data = readData();
  const before = data.resources.length;
  data.resources = data.resources.filter((r) => r.id !== req.params.id);
  if (data.resources.length === before) {
    return res.status(404).json({ error: 'Resource not found' });
  }
  // Also remove any assignments that reference this resource
  data.tasks.forEach((t) => {
    t.assignments = (t.assignments || []).filter((a) => a.resourceId !== req.params.id);
  });
  writeData(data);
  res.json({ ok: true });
});

// ---------- Reports (read-only) ----------

app.get('/api/reports', (req, res) => {
  const data = readData();
  const resources = data.resources;

  const tasksReport = data.tasks.map((t) => {
    const cost = calcTaskCost(t, resources);
    const totalHours = (t.assignments || [])
      .filter((a) => {
        const r = resources.find((x) => x.id === a.resourceId);
        return r && r.type !== 'cost';
      })
      .reduce((s, a) => s + Number(a.hours || 0), 0);
    return {
      id: t.id,
      name: t.name,
      status: t.status,
      duration: t.duration,
      totalHours,
      cost,
      assignments: (t.assignments || []).map((a) => {
        const r = resources.find((x) => x.id === a.resourceId);
        const units = Number(a.hours || 0);
        const unitCost = r ? resourceUnitCost(r) : 0;
        return {
          resourceId: a.resourceId,
          resourceName: r ? r.name : 'Unknown',
          resourceType: r ? r.type : 'work',
          units,
          unitCost,
          subtotal: units * unitCost
        };
      })
    };
  });

  const resourceReport = resources.map((r) => {
    let totalUnits = 0;
    let totalEarnings = 0;
    const taskList = [];
    data.tasks.forEach((t) => {
      const a = (t.assignments || []).find((x) => x.resourceId === r.id);
      if (a) {
        const units = Number(a.hours || 0);
        totalUnits += units;
        totalEarnings += units * resourceUnitCost(r);
        taskList.push({ taskId: t.id, taskName: t.name, units });
      }
    });
    return {
      id: r.id,
      type: r.type,
      name: r.name,
      role: r.role,
      costPerHour: r.costPerHour,
      cost: r.cost,
      totalUnits,
      totalEarnings,
      tasks: taskList
    };
  });

  const totalProjectCost = tasksReport.reduce((s, t) => s + t.cost, 0);
  const statusCounts = data.tasks.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});

  res.json({
    project: data.project,
    summary: {
      totalTasks: data.tasks.length,
      totalResources: resources.length,
      totalProjectCost,
      statusCounts
    },
    tasks: tasksReport,
    resources: resourceReport
  });
});

// ---------- Health ----------
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

ensureDataFile();
app.listen(PORT, () => {
  console.log(`PM backend running at http://localhost:${PORT}`);
  console.log(`Data file: ${DATA_FILE}`);
});
