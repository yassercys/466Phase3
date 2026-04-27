# Project Management Mini App

A small but complete Project Management web application:

- **Backend:** Node.js + Express, persists everything to `backend/data.json`.
- **Frontend:** React + Vite, modern dashboard UI.
- **Features:** Tasks (CRUD), Resources (CRUD), Resource→Task assignments, automatic cost calculation, read-only Reports.

---

## 1. Project Layout

Place the files exactly like this:

```
466Phase3/
├── backend/
│   ├── package.json
│   ├── server.js
│   └── data.json          ← persistent storage (auto-created if missing)
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── api.js
│       ├── styles.css
│       └── components/
│           ├── Sidebar.jsx
│           ├── Dashboard.jsx
│           ├── Tasks.jsx
│           ├── Resources.jsx
│           ├── Reports.jsx
│           ├── Modal.jsx
│           └── Toast.jsx
└── README.md
```

---

## 2. Prerequisites

- **Node.js 18+** (https://nodejs.org)
- **npm** (comes with Node)

Check:
```
node -v
npm -v
```

---

## 3. Install Dependencies

Open **two terminals**.

**Terminal 1 — backend:**
```
cd backend
npm install
```

**Terminal 2 — frontend:**
```
cd frontend
npm install
```

---

## 4. Run the Project

**Terminal 1 — start the backend** (port 4000):
```
cd backend
npm start
```
You should see:
```
PM backend running at http://localhost:4000
Data file: .../backend/data.json
```

**Terminal 2 — start the frontend** (port 5173):
```
cd frontend
npm run dev
```
You should see a local URL like:
```
➜  Local:   http://localhost:5173/
```

Open **http://localhost:5173** in your browser. The frontend automatically proxies `/api/*` to the backend on port 4000 (configured in `frontend/vite.config.js`).

---

## 5. Data Storage (`backend/data.json`)

All app data lives in one file: **`backend/data.json`**. Its structure:

```json
{
  "project": {
    "name": "My Project",
    "description": "..."
  },
  "tasks": [
    {
      "id": "t_1700000000000_123",
      "name": "Design login page",
      "description": "...",
      "duration": 5,
      "status": "in-progress",
      "startDate": "2026-05-01",
      "endDate": "2026-05-05",
      "assignments": [
        { "resourceId": "r_1700000000000_456", "hours": 8 }
      ]
    }
  ],
  "resources": [
    {
      "id": "r_1700000000000_456",
      "name": "Alice Johnson",
      "role": "Frontend Developer",
      "costPerHour": 50
    }
  ]
}
```

- The file is **created automatically** the first time the backend starts if it does not exist.
- Every create / update / delete operation **immediately writes the full JSON back to disk**, so data survives:
  - browser refresh,
  - frontend restart,
  - backend restart,
  - server reboot.

---

## 6. How Cost Is Calculated

There are two cost numbers, both derived live (never stored).

**Task cost** — for one task:
```
taskCost = Σ ( assignment.hours × resource.costPerHour )   over all assignments of that task
```
Example: a task with assignments
- Alice — 8h, $50/h → 400
- Bob   — 4h, $40/h → 160
→ Task cost = **$560.00**

**Total project cost:**
```
totalProjectCost = Σ taskCost   over all tasks
```

The backend recomputes both whenever you call `GET /api/tasks` or `GET /api/reports`, so the **Reports view always shows up-to-date numbers** without any manual refresh.

---

## 7. API Reference (used internally by the frontend)

| Method | URL | Purpose |
|--------|-----|---------|
| GET    | `/api/project` | Get project metadata |
| PUT    | `/api/project` | Update project name / description |
| GET    | `/api/tasks` | List tasks (each enriched with computed `cost`) |
| POST   | `/api/tasks` | Create a task |
| PUT    | `/api/tasks/:id` | Update a task |
| DELETE | `/api/tasks/:id` | Delete a task |
| POST   | `/api/tasks/:id/assignments` | Assign / update a resource on a task |
| DELETE | `/api/tasks/:id/assignments/:resourceId` | Remove an assignment |
| GET    | `/api/resources` | List resources |
| POST   | `/api/resources` | Create a resource |
| PUT    | `/api/resources/:id` | Update a resource |
| DELETE | `/api/resources/:id` | Delete a resource (also removes its assignments) |
| GET    | `/api/reports` | Read-only computed report (project totals, per-task cost, resource utilization) |

---

## 8. Example Usage Walkthrough

1. Start backend and frontend (see step 4).
2. Open http://localhost:5173 .
3. Click **Resources → + New Resource**, add:
   - Name: `Alice Johnson`, Role: `Frontend Developer`, Cost/hour: `50`
   - Name: `Bob Smith`, Role: `Backend Developer`, Cost/hour: `40`
4. Click **Tasks → + New Task**, add:
   - Name: `Design login page`, Status: `in-progress`, Duration: `5`
5. On that task row, click **Assign**:
   - Choose `Alice Johnson`, hours `8` → **Assign**
   - Choose `Bob Smith`, hours `4` → **Assign**
6. The task row now shows `Cost = $560.00` automatically.
7. Open **Reports** — you will see:
   - Total Project Cost: `$560.00`
   - Cost-by-task table with the breakdown.
   - Resource utilization with hours and earnings per person.
8. Stop the backend (Ctrl+C) and start it again — your data is still there because it was saved to `backend/data.json`. Refresh the browser; everything reloads.

---

## 9. Troubleshooting

- **Port 4000 already in use** — change `PORT` in `backend/server.js` and the proxy target in `frontend/vite.config.js`.
- **Port 5173 already in use** — Vite will pick the next free port automatically; just open whichever URL it prints.
- **Frontend cannot reach backend** — make sure the backend terminal is still running and that you started it from the `backend/` folder.
- **Data looks wrong** — you can stop the backend and edit `backend/data.json` by hand, or delete it to start fresh (it will be recreated empty).
