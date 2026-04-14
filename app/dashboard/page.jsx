"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { task as fetchTasks, createTask, deleteTask as apiDeleteTask } from "../services/taskService";

/* ─── API response mapper ───────────────────────────────── */
const STATUS_MAP = { "ต้องทำ": "standby", "กำลังทำ": "in-progress", "เสร็จ": "done", "To Do": "standby", "In Progress": "in-progress", "Done": "done" };

const mapApiTask = (t) => ({
  id: t.id,
  title: t.title,
  desc: t.description || "",
  status: STATUS_MAP[t.description_th] ?? STATUS_MAP[t.description_en] ?? "standby",
  priority: "medium",
  tags: [],
  dueDate: t.created_at ? t.created_at.slice(0, 10) : "",
  subtasks: [],
  assignee: `${t.first_name ?? ""} ${t.last_name ?? ""}`.trim(),
});

let nextId = 100;
const genId = () => ++nextId;

const PRIORITY_COLOR = { high: "#ff2d55", medium: "#ff9500", low: "#30d158" };
const PRIORITY_GLOW  = { high: "rgba(255,45,85,.3)", medium: "rgba(255,149,0,.25)", low: "rgba(48,209,88,.25)" };
const STATUS_CYCLE   = ["standby", "in-progress", "done"];
const STATUS_LABEL   = { standby: "TO DO", "in-progress": "IN PROGRESS", done: "DONE" };

/* ─── SVG Icons ──────────────────────────────────────────── */
const SunIcon  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
const MoonIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const PlusIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
const SearchIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.8"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
const XIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
const ChevronDown = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const EditIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const TrashIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><polyline points="3,6 5,6 21,6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const CheckIcon = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><polyline points="20,6 9,17 4,12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;

/* ─── Main Component ─────────────────────────────────────── */
export default function TodoDashboard() {
  const router = useRouter();
  const [dark, setDark] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");

  /* Create modal */
  const emptyForm = { title: "", description: "", status_id: 1 };
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const loadTasks = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetchTasks();
      const data = Array.isArray(res) ? res : (res?.data ?? []);
      setTasks(data.map(mapApiTask));
    } catch (err) {
      setFetchError(err?.message ?? "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!form.title.trim()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await createTask({ title: form.title, description: form.description, status_id: Number(form.status_id) });
      setShowModal(false);
      setForm(emptyForm);
      await loadTasks();
    } catch (err) {
      setSubmitError(err?.response?.data?.message ?? err?.message ?? "Failed to create task");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => { loadTasks(); }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const stars = useRef(Array.from({ length: 60 }, () => ({
    top: `${Math.random()*100}%`, left: `${Math.random()*100}%`,
    dur: `${2+Math.random()*4}s`, delay: `${Math.random()*4}s`,
    op: `${0.1+Math.random()*0.25}`,
  }))).current;

  /* Derived */
  const filtered = tasks.filter(t => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.tags.some(tg => tg.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = filterStatus === "all" || t.status === filterStatus;
    const matchPriority = filterPriority === "all" || t.priority === filterPriority;
    return matchSearch && matchStatus && matchPriority;
  });
  const total = tasks.length;
  const standby = tasks.filter(t => t.status === "standby").length;
  const inProgress = tasks.filter(t => t.status === "in-progress").length;
  const done = tasks.filter(t => t.status === "done").length;

  const handleDeleteTask = async (id, e) => {
    e.stopPropagation();
    try {
      await apiDeleteTask(id);
      await loadTasks();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const d = dark;

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&family=Share+Tech+Mono&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    .root {
      min-height: 100vh;
      font-family: 'Share Tech Mono', monospace;
      transition: background .4s, color .4s;
      position: relative; overflow-x: hidden;
    }
    .root.dark  { background: #020b14; color: #00f5ff; }
    .root.light { background: linear-gradient(135deg,#f0fdff,#e0f9ff,#ccf5ff); color: #004a5a; }

    .stars { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
    .root.light .stars { display: none; }
    .star { position: absolute; width: 2px; height: 2px; background: white; border-radius: 50%; animation: twinkle var(--dur,3s) ease-in-out infinite; animation-delay: var(--delay,0s); }
    @keyframes twinkle { 0%,100%{opacity:var(--op,.2);transform:scale(1)} 50%{opacity:1;transform:scale(1.6)} }

    .hex-bg {
      position: fixed; inset: 0; pointer-events: none; z-index: 0;
      background-image: url("data:image/svg+xml,%3Csvg width='60' height='52' viewBox='0 0 60 52' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 2 L58 17 L58 35 L30 50 L2 35 L2 17 Z' fill='none' stroke='%2300f5ff' stroke-width='0.5'/%3E%3C/svg%3E");
      background-size: 60px 52px;
    }
    .root.dark  .hex-bg { opacity: 0.05; }
    .root.light .hex-bg { opacity: 0.07; }

    /* ── Navbar ── */
    .navbar {
      position: sticky; top: 0; z-index: 50;
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 24px;
      border-bottom: 1px solid;
      transition: all .4s;
    }
    .root.dark  .navbar { background: rgba(2,11,20,.92); border-color: rgba(0,245,255,.15); backdrop-filter: blur(12px); }
    .root.light .navbar { background: rgba(255,255,255,.88); border-color: rgba(0,190,220,.25); backdrop-filter: blur(12px); }

    .nav-brand {
      font-family: 'Orbitron', monospace; font-size: 14px; font-weight: 700;
      letter-spacing: 4px; text-transform: uppercase;
    }
    .root.dark  .nav-brand { color: #00f5ff; text-shadow: 0 0 16px rgba(0,245,255,.5); }
    .root.light .nav-brand { color: #005f73; }

    .nav-right { display: flex; align-items: center; gap: 12px; }

    .badge-live {
      display: inline-flex; align-items: center; gap: 6px;
      border: 1px solid; padding: 3px 10px; border-radius: 2px;
      font-size: 9px; letter-spacing: 2px; text-transform: uppercase;
    }
    .root.dark  .badge-live { border-color: rgba(0,245,255,.3); color: rgba(0,245,255,.5); }
    .root.light .badge-live { border-color: rgba(0,180,204,.3); color: rgba(0,100,130,.6); }
    .badge-dot { width: 5px; height: 5px; border-radius: 50%; background: #00ff88; animation: pulse 1.5s ease-in-out infinite; }
    @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.3;transform:scale(.7)} }

    .mode-btn {
      display: flex; align-items: center; gap: 6px;
      padding: 7px 12px; border: 1px solid; border-radius: 3px;
      font-size: 10px; letter-spacing: 2px; text-transform: uppercase;
      cursor: pointer; font-family: 'Orbitron', monospace;
      transition: all .2s; background: none;
    }
    .root.dark  .mode-btn { border-color: rgba(0,245,255,.3); color: rgba(0,245,255,.6); }
    .root.dark  .mode-btn:hover { border-color: #00f5ff; color: #00f5ff; }
    .root.light .mode-btn { border-color: rgba(0,180,204,.3); color: rgba(0,100,130,.6); }
    .root.light .mode-btn:hover { border-color: #00b4cc; color: #00b4cc; }

    /* ── Layout ── */
    .layout {
      display: flex; position: relative; z-index: 1;
    }
    .main-content {
      flex: 1; min-width: 0;
      padding: 24px;
    }

    /* ── Stats bar ── */
    .stats-bar {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;
      margin-bottom: 24px;
    }
    .stat-card {
      border: 1px solid; border-radius: 4px; padding: 14px 16px;
      position: relative; overflow: hidden;
      transition: all .25s;
    }
    .root.dark  .stat-card { background: rgba(0,10,25,.7); border-color: rgba(0,245,255,.12); }
    .root.light .stat-card { background: rgba(255,255,255,.8); border-color: rgba(0,190,220,.2); }
    .stat-card:hover { transform: translateY(-2px); }
    .root.dark  .stat-card:hover { border-color: rgba(0,245,255,.3); box-shadow: 0 4px 20px rgba(0,245,255,.08); }
    .root.light .stat-card:hover { box-shadow: 0 4px 20px rgba(0,190,220,.15); }

    .stat-label {
      font-size: 9px; letter-spacing: 2px; text-transform: uppercase;
      margin-bottom: 6px;
    }
    .root.dark  .stat-label { color: rgba(0,245,255,.45); }
    .root.light .stat-label { color: rgba(0,100,130,.5); }

    .stat-value {
      font-family: 'Orbitron', monospace; font-size: 26px; font-weight: 700;
      line-height: 1;
    }
    .root.dark  .stat-value { color: #00f5ff; }
    .root.light .stat-value { color: #005f73; }

    .stat-fill {
      position: absolute; bottom: 0; left: 0; height: 3px;
      background: currentColor; border-radius: 0 2px 2px 0;
      transition: width .6s cubic-bezier(.4,0,.2,1);
    }
    .root.dark  .stat-fill { opacity: .5; }
    .root.light .stat-fill { opacity: .6; }

    /* ── Toolbar ── */
    .toolbar {
      display: flex; align-items: center; gap: 10px;
      flex-wrap: wrap; margin-bottom: 20px;
    }
    .search-wrap {
      position: relative; flex: 1; min-width: 200px;
    }
    .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); pointer-events: none; }
    .root.dark  .search-icon { color: rgba(0,245,255,.4); }
    .root.light .search-icon { color: rgba(0,100,130,.4); }

    .search-input {
      width: 100%; padding: 9px 12px 9px 36px;
      border: 1px solid; border-radius: 3px;
      font-family: 'Share Tech Mono', monospace; font-size: 12px;
      letter-spacing: .5px; outline: none; transition: all .2s;
    }
    .root.dark  .search-input { background: rgba(0,245,255,.04); border-color: rgba(0,245,255,.2); color: #00f5ff; }
    .root.dark  .search-input::placeholder { color: rgba(0,245,255,.25); }
    .root.dark  .search-input:focus { border-color: #00f5ff; box-shadow: 0 0 0 2px rgba(0,245,255,.1); }
    .root.light .search-input { background: rgba(240,253,255,.8); border-color: rgba(0,190,220,.3); color: #004a5a; }
    .root.light .search-input::placeholder { color: rgba(0,100,130,.3); }
    .root.light .search-input:focus { border-color: #00b4cc; box-shadow: 0 0 0 3px rgba(0,180,204,.12); }

    .filter-select {
      padding: 9px 12px; border: 1px solid; border-radius: 3px;
      font-family: 'Share Tech Mono', monospace; font-size: 11px;
      letter-spacing: 1px; text-transform: uppercase; outline: none;
      cursor: pointer; transition: all .2s;
    }
    .root.dark  .filter-select { background: rgba(0,245,255,.04); border-color: rgba(0,245,255,.2); color: rgba(0,245,255,.7); }
    .root.dark  .filter-select:focus { border-color: #00f5ff; }
    .root.light .filter-select { background: rgba(240,253,255,.8); border-color: rgba(0,190,220,.3); color: #004a5a; }
    .root.light .filter-select:focus { border-color: #00b4cc; }

    .add-btn {
      display: flex; align-items: center; gap: 7px;
      padding: 9px 18px; border: 1px solid; border-radius: 3px;
      font-family: 'Orbitron', monospace; font-size: 10px;
      letter-spacing: 2px; text-transform: uppercase;
      cursor: pointer; transition: all .2s; white-space: nowrap;
    }
    .root.dark  .add-btn {
      background: linear-gradient(135deg,rgba(0,245,255,.12),rgba(0,100,200,.15));
      border-color: rgba(0,245,255,.4); color: #00f5ff;
      box-shadow: 0 0 16px rgba(0,245,255,.08);
    }
    .root.dark  .add-btn:hover {
      background: linear-gradient(135deg,rgba(0,245,255,.2),rgba(0,150,255,.22));
      box-shadow: 0 0 24px rgba(0,245,255,.18);
    }
    .root.light .add-btn {
      background: linear-gradient(135deg,#00c8e0,#0096b4);
      border: none; color: #fff;
      box-shadow: 0 4px 16px rgba(0,180,210,.3);
    }
    .root.light .add-btn:hover { background: linear-gradient(135deg,#00d8f0,#00aacc); transform: translateY(-1px); }

    /* ── Task Grid ── */
    .task-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 14px;
    }

    /* ── Task Card ── */
    .task-card {
      border: 1px solid; border-radius: 4px;
      padding: 16px; cursor: pointer;
      transition: all .22s; position: relative;
      overflow: hidden;
    }
    .root.dark  .task-card {
      background: rgba(0,10,25,.75);
      border-color: rgba(0,245,255,.1);
    }
    .root.light .task-card {
      background: rgba(255,255,255,.85);
      border-color: rgba(0,190,220,.18);
    }
    .task-card:hover { transform: translateY(-3px); }
    .root.dark  .task-card:hover { border-color: rgba(0,245,255,.3); box-shadow: 0 8px 30px rgba(0,245,255,.07); }
    .root.light .task-card:hover { box-shadow: 0 8px 30px rgba(0,190,220,.14); border-color: rgba(0,190,220,.35); }
    .task-card.active-card {
      border-color: rgba(0,245,255,.5) !important;
      box-shadow: 0 0 0 1px rgba(0,245,255,.2), 0 8px 30px rgba(0,245,255,.1) !important;
    }
    .root.light .task-card.active-card {
      border-color: rgba(0,180,210,.6) !important;
      box-shadow: 0 0 0 1px rgba(0,180,210,.2), 0 8px 30px rgba(0,180,210,.12) !important;
    }

    .priority-bar {
      position: absolute; top: 0; left: 0; width: 3px; height: 100%;
      border-radius: 4px 0 0 4px;
    }

    .card-top {
      display: flex; align-items: flex-start; justify-content: space-between;
      gap: 8px; margin-bottom: 8px;
    }
    .card-title-text {
      font-family: 'Orbitron', monospace; font-size: 12px; font-weight: 600;
      letter-spacing: 1.5px; text-transform: uppercase; line-height: 1.4;
      flex: 1;
    }
    .root.dark  .card-title-text { color: #c8f8ff; }
    .root.light .card-title-text { color: #003a4a; }

    .card-actions { display: flex; gap: 6px; flex-shrink: 0; }
    .icon-btn {
      display: flex; align-items: center; justify-content: center;
      width: 26px; height: 26px; border: 1px solid; border-radius: 3px;
      cursor: pointer; background: none; transition: all .18s;
    }
    .root.dark  .icon-btn       { border-color: rgba(0,245,255,.15); color: rgba(0,245,255,.4); }
    .root.dark  .icon-btn:hover { border-color: rgba(0,245,255,.4); color: #00f5ff; background: rgba(0,245,255,.06); }
    .root.light .icon-btn       { border-color: rgba(0,190,220,.2); color: rgba(0,100,130,.5); }
    .root.light .icon-btn:hover { border-color: #00b4cc; color: #00b4cc; }
    .icon-btn.danger:hover { border-color: #ff2d55 !important; color: #ff2d55 !important; background: rgba(255,45,85,.06) !important; }

    .status-badge {
      display: inline-block; padding: 2px 8px; border: 1px solid; border-radius: 2px;
      font-size: 9px; letter-spacing: 2px; text-transform: uppercase;
      cursor: pointer; transition: all .18s; user-select: none;
      white-space: nowrap;
    }
    .status-badge:hover { transform: scale(1.04); }
    .status-standby     { color: rgba(0,245,255,.6); border-color: rgba(0,245,255,.25); background: rgba(0,245,255,.05); }
    .status-in-progress { color: #ff9500; border-color: rgba(255,149,0,.3); background: rgba(255,149,0,.07); }
    .status-done        { color: #30d158; border-color: rgba(48,209,88,.3); background: rgba(48,209,88,.07); }
    .root.light .status-standby { color: #007090; border-color: rgba(0,150,190,.3); background: rgba(0,150,190,.06); }

    .card-desc {
      font-size: 11px; line-height: 1.5; margin-bottom: 10px;
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
    }
    .root.dark  .card-desc { color: rgba(0,245,255,.4); }
    .root.light .card-desc { color: rgba(0,80,100,.6); }

    .card-tags { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 10px; }
    .tag {
      display: inline-flex; padding: 2px 7px; border: 1px solid; border-radius: 2px;
      font-size: 9px; letter-spacing: 1px; text-transform: uppercase;
    }
    .root.dark  .tag { border-color: rgba(0,245,255,.15); color: rgba(0,245,255,.45); background: rgba(0,245,255,.03); }
    .root.light .tag { border-color: rgba(0,190,220,.25); color: rgba(0,100,130,.6); background: rgba(0,190,220,.05); }

    .card-meta {
      display: flex; align-items: center; justify-content: space-between;
      font-size: 10px; letter-spacing: .5px;
    }
    .root.dark  .card-meta { color: rgba(0,245,255,.35); }
    .root.light .card-meta { color: rgba(0,100,130,.5); }

    .due-date { display: flex; align-items: center; gap: 5px; }

    /* ── Subtasks collapse ── */
    .subtask-toggle {
      display: flex; align-items: center; gap: 6px;
      font-size: 10px; letter-spacing: 1px; cursor: pointer;
      border: none; background: none; margin-top: 10px;
      padding: 5px 0; transition: color .18s; width: 100%;
    }
    .root.dark  .subtask-toggle { color: rgba(0,245,255,.45); }
    .root.dark  .subtask-toggle:hover { color: #00f5ff; }
    .root.light .subtask-toggle { color: rgba(0,120,150,.5); }
    .root.light .subtask-toggle:hover { color: #00b4cc; }

    .subtask-progress-bar {
      height: 3px; border-radius: 2px; margin-top: 5px; overflow: hidden;
    }
    .root.dark  .subtask-progress-bar { background: rgba(0,245,255,.1); }
    .root.light .subtask-progress-bar { background: rgba(0,190,220,.12); }
    .subtask-progress-fill {
      height: 100%; border-radius: 2px; background: #30d158;
      transition: width .5s cubic-bezier(.4,0,.2,1);
    }

    .subtask-list { margin-top: 8px; display: flex; flex-direction: column; gap: 5px; }
    .subtask-item {
      display: flex; align-items: center; gap: 8px;
      font-size: 11px; padding: 4px 6px; border-radius: 2px;
      transition: background .15s;
    }
    .root.dark  .subtask-item:hover { background: rgba(0,245,255,.04); }
    .root.light .subtask-item:hover { background: rgba(0,190,220,.06); }

    .subtask-check {
      width: 16px; height: 16px; border: 1px solid; border-radius: 2px;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; flex-shrink: 0; transition: all .18s;
    }
    .root.dark  .subtask-check { border-color: rgba(0,245,255,.3); }
    .root.dark  .subtask-check.checked { background: #30d158; border-color: #30d158; color: #020b14; }
    .root.dark  .subtask-check:hover { border-color: #00f5ff; }
    .root.light .subtask-check { border-color: rgba(0,190,220,.35); }
    .root.light .subtask-check.checked { background: #30d158; border-color: #30d158; color: #fff; }

    .subtask-text { flex: 1; }
    .subtask-text.done-text {
      text-decoration: line-through; opacity: .4;
    }
    .root.dark  .subtask-text { color: rgba(0,245,255,.6); }
    .root.light .subtask-text { color: rgba(0,80,100,.7); }

    .subtask-del {
      background: none; border: none; cursor: pointer; opacity: 0;
      transition: opacity .15s; display: flex; align-items: center;
    }
    .subtask-item:hover .subtask-del { opacity: 1; }
    .root.dark  .subtask-del { color: rgba(255,45,85,.5); }
    .root.light .subtask-del { color: rgba(200,0,40,.4); }
    .subtask-del:hover { color: #ff2d55 !important; }

    .chevron { display: inline-block; transition: transform .2s; }
    .chevron.open { transform: rotate(180deg); }

    /* ── Logout button ── */
    .logout-btn {
      display: flex; align-items: center; gap: 6px;
      padding: 7px 12px; border: 1px solid; border-radius: 3px;
      font-size: 10px; letter-spacing: 2px; text-transform: uppercase;
      cursor: pointer; font-family: 'Orbitron', monospace;
      transition: all .2s; background: none;
    }
    .root.dark  .logout-btn { border-color: rgba(255,45,85,.3); color: rgba(255,45,85,.6); }
    .root.dark  .logout-btn:hover { border-color: #ff2d55; color: #ff2d55; background: rgba(255,45,85,.06); }
    .root.light .logout-btn { border-color: rgba(200,0,40,.25); color: rgba(180,0,30,.6); }
    .root.light .logout-btn:hover { border-color: #c0002a; color: #c0002a; background: rgba(200,0,40,.05); }

    /* ── Modal ── */
    .modal-overlay {
      position: fixed; inset: 0; z-index: 60;
      display: flex; align-items: center; justify-content: center;
      padding: 20px;
      animation: fadeIn .2s ease;
    }
    @keyframes fadeIn { from{opacity:0} to{opacity:1} }
    .root.dark  .modal-overlay { background: rgba(2,11,20,.7); backdrop-filter: blur(6px); }
    .root.light .modal-overlay { background: rgba(0,80,100,.15); backdrop-filter: blur(6px); }

    .modal {
      width: 100%; max-width: 480px; border: 1px solid; border-radius: 4px;
      position: relative; overflow: hidden;
      animation: slideUp .28s cubic-bezier(.4,0,.2,1);
    }
    @keyframes slideUp { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }
    .root.dark  .modal { background: rgba(2,11,25,.97); border-color: rgba(0,245,255,.25); box-shadow: 0 0 60px rgba(0,245,255,.08); }
    .root.light .modal { background: #fff; border-color: rgba(0,190,220,.35); box-shadow: 0 20px 60px rgba(0,190,220,.15); }

    .modal-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 18px 20px 14px; border-bottom: 1px solid;
    }
    .root.dark  .modal-header { border-color: rgba(0,245,255,.1); }
    .root.light .modal-header { border-color: rgba(0,190,220,.15); }

    .modal-title {
      font-family: 'Orbitron', monospace; font-size: 12px; font-weight: 600;
      letter-spacing: 2.5px; text-transform: uppercase;
    }
    .root.dark  .modal-title { color: #00f5ff; }
    .root.light .modal-title { color: #005f73; }

    .modal-body { padding: 20px; display: flex; flex-direction: column; gap: 14px; }

    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

    .form-label {
      font-size: 9px; letter-spacing: 2px; text-transform: uppercase;
    }
    .root.dark  .form-label { color: rgba(0,245,255,.5); }
    .root.light .form-label { color: rgba(0,80,110,.6); }

    .form-input, .form-select, .form-textarea {
      padding: 9px 12px; border: 1px solid; border-radius: 3px;
      font-family: 'Share Tech Mono', monospace; font-size: 12px;
      letter-spacing: .5px; outline: none; transition: all .2s;
    }
    .form-textarea { resize: vertical; min-height: 72px; }
    .root.dark  .form-input, .root.dark  .form-select, .root.dark  .form-textarea {
      background: rgba(0,245,255,.04); border-color: rgba(0,245,255,.2); color: #00f5ff;
    }
    .root.dark  .form-input::placeholder, .root.dark  .form-textarea::placeholder { color: rgba(0,245,255,.2); }
    .root.dark  .form-input:focus, .root.dark  .form-select:focus, .root.dark  .form-textarea:focus {
      border-color: #00f5ff; box-shadow: 0 0 0 2px rgba(0,245,255,.1);
    }
    .root.light .form-input, .root.light .form-select, .root.light .form-textarea {
      background: rgba(240,253,255,.8); border-color: rgba(0,190,220,.3); color: #004a5a;
    }
    .root.light .form-input:focus, .root.light .form-select:focus, .root.light .form-textarea:focus {
      border-color: #00b4cc; box-shadow: 0 0 0 3px rgba(0,180,204,.1);
    }

    .tag-input-wrap {
      display: flex; flex-wrap: wrap; gap: 5px; align-items: center;
      padding: 7px 10px; border: 1px solid; border-radius: 3px; min-height: 40px;
    }
    .root.dark  .tag-input-wrap { background: rgba(0,245,255,.04); border-color: rgba(0,245,255,.2); }
    .root.light .tag-input-wrap { background: rgba(240,253,255,.8); border-color: rgba(0,190,220,.3); }
    .tag-chip {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 2px 7px; border: 1px solid; border-radius: 2px; font-size: 10px; letter-spacing: 1px;
    }
    .root.dark  .tag-chip { border-color: rgba(0,245,255,.25); color: rgba(0,245,255,.7); background: rgba(0,245,255,.06); }
    .root.light .tag-chip { border-color: rgba(0,190,220,.3); color: #006070; background: rgba(0,190,220,.07); }
    .tag-chip-del { cursor: pointer; display: flex; align-items: center; opacity: .6; transition: opacity .15s; }
    .tag-chip-del:hover { opacity: 1; }
    .tag-text-input {
      border: none; background: none; outline: none; font-family: 'Share Tech Mono'; font-size: 11px;
      min-width: 80px; flex: 1;
    }
    .root.dark  .tag-text-input { color: #00f5ff; }
    .root.dark  .tag-text-input::placeholder { color: rgba(0,245,255,.2); }
    .root.light .tag-text-input { color: #004a5a; }

    .modal-footer {
      display: flex; justify-content: flex-end; gap: 8px;
      padding: 14px 20px; border-top: 1px solid;
    }
    .root.dark  .modal-footer { border-color: rgba(0,245,255,.1); }
    .root.light .modal-footer { border-color: rgba(0,190,220,.15); }

    .btn-cancel {
      padding: 9px 18px; border: 1px solid; border-radius: 3px;
      font-family: 'Orbitron', monospace; font-size: 10px; letter-spacing: 2px;
      cursor: pointer; background: none; transition: all .18s;
    }
    .root.dark  .btn-cancel { border-color: rgba(0,245,255,.2); color: rgba(0,245,255,.4); }
    .root.dark  .btn-cancel:hover { border-color: rgba(0,245,255,.4); color: #00f5ff; }
    .root.light .btn-cancel { border-color: rgba(0,190,220,.25); color: rgba(0,120,150,.5); }
    .root.light .btn-cancel:hover { border-color: #00b4cc; color: #00b4cc; }

    .btn-submit {
      padding: 9px 22px; border-radius: 3px;
      font-family: 'Orbitron', monospace; font-size: 10px; letter-spacing: 2px;
      cursor: pointer; border: none; transition: all .2s;
    }
    .root.dark  .btn-submit {
      background: linear-gradient(135deg,rgba(0,245,255,.2),rgba(0,100,200,.25));
      border: 1px solid rgba(0,245,255,.45); color: #00f5ff;
      box-shadow: 0 0 16px rgba(0,245,255,.1);
    }
    .root.dark  .btn-submit:hover { box-shadow: 0 0 24px rgba(0,245,255,.2); transform: translateY(-1px); }
    .root.light .btn-submit {
      background: linear-gradient(135deg,#00c8e0,#0096b4); color: #fff;
      box-shadow: 0 4px 16px rgba(0,180,210,.3);
    }
    .root.light .btn-submit:hover { transform: translateY(-1px); }

    /* ── Empty state ── */
    .empty-state {
      grid-column: 1/-1; text-align: center; padding: 48px 20px;
    }
    .root.dark  .empty-state { color: rgba(0,245,255,.3); }
    .root.light .empty-state { color: rgba(0,100,130,.3); }
    .empty-icon { font-size: 36px; margin-bottom: 12px; }
    .empty-text { font-family: 'Orbitron', monospace; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; }

    /* ── Loading state ── */
    .loading-state {
      grid-column: 1/-1; text-align: center; padding: 48px 20px;
      display: flex; flex-direction: column; align-items: center; gap: 14px;
    }
    .loading-spinner {
      width: 36px; height: 36px; border: 2px solid;
      border-radius: 50%; border-top-color: transparent;
      animation: spin .7s linear infinite;
    }
    .root.dark  .loading-spinner { border-color: rgba(0,245,255,.4); border-top-color: transparent; }
    .root.light .loading-spinner { border-color: rgba(0,190,220,.4); border-top-color: transparent; }
    .loading-text { font-family: 'Orbitron', monospace; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; }
    .root.dark  .loading-text { color: rgba(0,245,255,.4); }
    .root.light .loading-text { color: rgba(0,100,130,.4); }
    .error-text { font-family: 'Orbitron', monospace; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #ff2d55; grid-column: 1/-1; text-align: center; padding: 48px 20px; }

    /* ── Scan line ── */
    .scanline {
      position: fixed; inset: 0; pointer-events: none; z-index: 0;
      background: repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,245,255,.008) 2px,rgba(0,245,255,.008) 4px);
    }
    .root.light .scanline { display: none; }

    /* Scrollbar */
    ::-webkit-scrollbar { width: 5px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(0,245,255,.15); border-radius: 3px; }
    .root.light ::-webkit-scrollbar-thumb { background: rgba(0,190,220,.2); }

    /* ── Radar (decorative) ── */
    .radar { position: fixed; bottom: 24px; right: 24px; width: 80px; height: 80px; z-index: 1; pointer-events: none; }
    .root.light .radar { display: none; }
    .radar-ring  { position:absolute;inset:0px;border:1px solid rgba(0,245,255,.12);border-radius:50%; }
    .radar-ring2 { position:absolute;inset:18px;border:1px solid rgba(0,245,255,.08);border-radius:50%; }
    .radar-ring3 { position:absolute;inset:34px;border:1px solid rgba(0,245,255,.12);border-radius:50%; }
    .radar-sweep { position:absolute;inset:0;border-radius:50%;background:conic-gradient(from 0deg,rgba(0,245,255,.35) 0deg,rgba(0,245,255,.08) 40deg,transparent 60deg);animation:spin 3s linear infinite; }
    .radar-ch { position:absolute;top:50%;left:0;right:0;height:1px;background:rgba(0,245,255,.08);transform:translateY(-50%); }
    .radar-cv { position:absolute;left:50%;top:0;bottom:0;width:1px;background:rgba(0,245,255,.08);transform:translateX(-50%); }
    @keyframes spin { to{transform:rotate(360deg)} }

    @media (max-width: 640px) {
      .stats-bar { grid-template-columns: repeat(2,1fr); }
      .task-grid  { grid-template-columns: 1fr; }
      .form-row { grid-template-columns: 1fr; }
    }

    /* ── Modal ── */
    .modal-overlay {
      position: fixed; inset: 0; z-index: 60;
      display: flex; align-items: center; justify-content: center; padding: 20px;
      animation: fadeIn .2s ease;
    }
    @keyframes fadeIn { from{opacity:0} to{opacity:1} }
    .root.dark  .modal-overlay { background: rgba(2,11,20,.75); backdrop-filter: blur(6px); }
    .root.light .modal-overlay { background: rgba(0,80,100,.15); backdrop-filter: blur(6px); }

    .modal {
      width: 100%; max-width: 460px; border: 1px solid; border-radius: 4px;
      position: relative; overflow: hidden;
      animation: slideUp .28s cubic-bezier(.4,0,.2,1);
    }
    @keyframes slideUp { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }
    .root.dark  .modal { background: rgba(2,11,25,.97); border-color: rgba(0,245,255,.25); box-shadow: 0 0 60px rgba(0,245,255,.08); }
    .root.light .modal { background: #fff; border-color: rgba(0,190,220,.35); box-shadow: 0 20px 60px rgba(0,190,220,.15); }

    .modal-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 18px 20px 14px; border-bottom: 1px solid;
    }
    .root.dark  .modal-header { border-color: rgba(0,245,255,.1); }
    .root.light .modal-header { border-color: rgba(0,190,220,.15); }

    .modal-title { font-family: 'Orbitron', monospace; font-size: 12px; font-weight: 600; letter-spacing: 2.5px; text-transform: uppercase; }
    .root.dark  .modal-title { color: #00f5ff; }
    .root.light .modal-title { color: #005f73; }

    .modal-close {
      display: flex; align-items: center; justify-content: center;
      width: 28px; height: 28px; border: 1px solid; border-radius: 3px;
      cursor: pointer; background: none; transition: all .18s;
    }
    .root.dark  .modal-close { border-color: rgba(0,245,255,.2); color: rgba(0,245,255,.5); }
    .root.dark  .modal-close:hover { border-color: #ff2d55; color: #ff2d55; }
    .root.light .modal-close { border-color: rgba(0,190,220,.25); color: rgba(0,120,150,.5); }
    .root.light .modal-close:hover { border-color: #ff2d55; color: #ff2d55; }

    .modal-body { padding: 20px; display: flex; flex-direction: column; gap: 14px; }

    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-label { font-size: 9px; letter-spacing: 2px; text-transform: uppercase; }
    .root.dark  .form-label { color: rgba(0,245,255,.5); }
    .root.light .form-label { color: rgba(0,80,110,.6); }

    .form-input, .form-select, .form-textarea {
      padding: 9px 12px; border: 1px solid; border-radius: 3px;
      font-family: 'Share Tech Mono', monospace; font-size: 12px;
      letter-spacing: .5px; outline: none; transition: all .2s;
    }
    .form-textarea { resize: vertical; min-height: 80px; }
    .root.dark  .form-input, .root.dark .form-select, .root.dark .form-textarea {
      background: rgba(0,245,255,.04); border-color: rgba(0,245,255,.2); color: #00f5ff;
    }
    .root.dark  .form-input::placeholder, .root.dark .form-textarea::placeholder { color: rgba(0,245,255,.2); }
    .root.dark  .form-input:focus, .root.dark .form-select:focus, .root.dark .form-textarea:focus {
      border-color: #00f5ff; box-shadow: 0 0 0 2px rgba(0,245,255,.1);
    }
    .root.light .form-input, .root.light .form-select, .root.light .form-textarea {
      background: rgba(240,253,255,.8); border-color: rgba(0,190,220,.3); color: #004a5a;
    }
    .root.light .form-input:focus, .root.light .form-select:focus, .root.light .form-textarea:focus {
      border-color: #00b4cc; box-shadow: 0 0 0 3px rgba(0,180,204,.1);
    }

    .modal-footer { display: flex; justify-content: flex-end; gap: 8px; padding: 14px 20px; border-top: 1px solid; }
    .root.dark  .modal-footer { border-color: rgba(0,245,255,.1); }
    .root.light .modal-footer { border-color: rgba(0,190,220,.15); }

    .btn-cancel {
      padding: 9px 18px; border: 1px solid; border-radius: 3px;
      font-family: 'Orbitron', monospace; font-size: 10px; letter-spacing: 2px;
      cursor: pointer; background: none; transition: all .18s;
    }
    .root.dark  .btn-cancel { border-color: rgba(0,245,255,.2); color: rgba(0,245,255,.4); }
    .root.dark  .btn-cancel:hover { border-color: rgba(0,245,255,.4); color: #00f5ff; }
    .root.light .btn-cancel { border-color: rgba(0,190,220,.25); color: rgba(0,120,150,.5); }
    .root.light .btn-cancel:hover { border-color: #00b4cc; color: #00b4cc; }

    .btn-submit {
      padding: 9px 22px; border-radius: 3px;
      font-family: 'Orbitron', monospace; font-size: 10px; letter-spacing: 2px;
      cursor: pointer; border: none; transition: all .2s; display: flex; align-items: center; gap: 6px;
    }
    .btn-submit:disabled { opacity: .5; cursor: not-allowed; }
    .root.dark  .btn-submit { background: linear-gradient(135deg,rgba(0,245,255,.2),rgba(0,100,200,.25)); border: 1px solid rgba(0,245,255,.45); color: #00f5ff; box-shadow: 0 0 16px rgba(0,245,255,.1); }
    .root.dark  .btn-submit:hover:not(:disabled) { box-shadow: 0 0 24px rgba(0,245,255,.2); transform: translateY(-1px); }
    .root.light .btn-submit { background: linear-gradient(135deg,#00c8e0,#0096b4); color: #fff; box-shadow: 0 4px 16px rgba(0,180,210,.3); }
    .root.light .btn-submit:hover:not(:disabled) { transform: translateY(-1px); }

    .submit-spinner { width: 12px; height: 12px; border: 1.5px solid currentColor; border-top-color: transparent; border-radius: 50%; animation: spin .6s linear infinite; }
    .modal-error { font-size: 11px; letter-spacing: .5px; color: #ff2d55; padding: 0 20px 14px; }
  `

  /* ── Stat color helpers ── */
  const statMeta = [
    { label: d ? "TOTAL TASKS" : "ทั้งหมด", value: total, color: "#00f5ff", pct: 100 },
    { label: d ? "TO DO" : "รอดำเนินการ", value: standby, color: "#00d4f5", pct: total ? (standby/total)*100 : 0 },
    { label: d ? "IN PROGRESS" : "กำลังดำเนินการ", value: inProgress, color: "#ff9500", pct: total ? (inProgress/total)*100 : 0 },
    { label: d ? "COMPLETE" : "เสร็จสิ้น", value: done, color: "#30d158", pct: total ? (done/total)*100 : 0 },
  ];

  return (
    <div className={`root ${dark ? "dark" : "light"}`}>
      <style>{css}</style>

      {/* Bg layers */}
      <div className="stars">
        {stars.map((s, i) => (
          <div key={i} className="star" style={{ top: s.top, left: s.left, "--dur": s.dur, "--delay": s.delay, "--op": s.op }} />
        ))}
      </div>
      <div className="hex-bg" />
      <div className="scanline" />
      <div className="radar">
        <div className="radar-ring"/><div className="radar-ring2"/><div className="radar-ring3"/>
        <div className="radar-sweep"/>
        <div className="radar-ch"/><div className="radar-cv"/>
      </div>

      {/* Navbar */}
      <nav className="navbar">
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span className="nav-brand">⬡ TASKS CTL</span>
          <span className="badge-live">
            <span className="badge-dot" />
            {d ? "OPERATOR ONLINE" : "ออนไลน์"}
          </span>
        </div>
        <div className="nav-right">
          <button className="mode-btn" onClick={() => setDark(v => !v)}>
            {dark ? <SunIcon /> : <MoonIcon />}
            {dark ? (d ? "LIGHT" : "สว่าง") : (d ? "DARK" : "มืด")}
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="16,17 21,12 16,7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            {d ? "LOGOUT" : "ออกจากระบบ"}
          </button>
        </div>
      </nav>

      {/* Main layout */}
      <div className="layout">
        <div className="main-content">

          {/* Stats bar */}
          <div className="stats-bar">
            {statMeta.map((s, i) => (
              <div className="stat-card" key={i}>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                <div className="stat-fill" style={{ width: `${s.pct}%`, color: s.color }} />
              </div>
            ))}
          </div>

          {/* Toolbar */}
          <div className="toolbar">
            <div className="search-wrap">
              <span className="search-icon"><SearchIcon /></span>
              <input
                className="search-input"
                placeholder={d ? "SEARCH TASKS..." : "ค้นหา..."}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="all">{d ? "ALL STATUS" : "ทุกสถานะ"}</option>
              <option value="standby">TO DO</option>
              <option value="in-progress">IN PROGRESS</option>
              <option value="done">DONE</option>
            </select>
            <select className="filter-select" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
              <option value="all">{d ? "ALL PRIORITY" : "ทุกความสำคัญ"}</option>
              <option value="high">HIGH</option>
              <option value="medium">MEDIUM</option>
              <option value="low">LOW</option>
            </select>
            <button className="add-btn" onClick={() => { setForm(emptyForm); setSubmitError(null); setShowModal(true); }}>
              <PlusIcon />
              {d ? "NEW TASKS" : "เพิ่มงาน"}
            </button>
          </div>

          {/* Task grid */}
          <div className="task-grid">
            {loading && (
              <div className="loading-state">
                <div className="loading-spinner" />
                <div className="loading-text">{d ? "LOADING TASKS..." : "กำลังโหลด..."}</div>
              </div>
            )}
            {!loading && fetchError && (
              <div className="error-text">⚠ {fetchError}</div>
            )}
            {!loading && !fetchError && filtered.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">⬡</div>
                <div className="empty-text">{d ? "NO TASKS FOUND" : "ไม่พบงาน"}</div>
              </div>
            )}
            {!loading && !fetchError && filtered.map(task => {
              return (
                <div
                  key={task.id}
                  className="task-card"
                  onClick={() => router.push(`/dashboard/${task.id}`)}
                >
                  {/* Priority bar */}
                  <div className="priority-bar" style={{ background: PRIORITY_COLOR[task.priority], boxShadow: `0 0 8px ${PRIORITY_GLOW[task.priority]}` }} />

                  <div style={{ paddingLeft: 10 }}>
                    <div className="card-top">
                      <span className="card-title-text">{task.title}</span>
                      <div className="card-actions" onClick={e => e.stopPropagation()}>
                        <button className="icon-btn danger" title="Delete" onClick={e => handleDeleteTask(task.id, e)}><TrashIcon /></button>
                      </div>
                    </div>

                    <div style={{ marginBottom: 8 }}>
                      <span className={`status-badge status-${task.status}`}>
                        {STATUS_LABEL[task.status]}
                      </span>
                    </div>

                    <div className="card-desc">{task.desc}</div>

                    {task.tags.length > 0 && (
                      <div className="card-tags">
                        {task.tags.map(tg => <span key={tg} className="tag">{tg}</span>)}
                      </div>
                    )}

                    <div className="card-meta">
                      <span className="due-date">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                        {task.dueDate || "—"}
                      </span>
                      {task.assignee && <span>{task.assignee}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Create Modal ── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            {["tl","tr","bl","br"].map(c => (
              <div key={c} style={{
                position:"absolute", width:14, height:14, borderStyle:"solid", borderWidth:0,
                ...(c.includes("t") ? { top:8, borderTopWidth:2 } : { bottom:8, borderBottomWidth:2 }),
                ...(c.includes("l") ? { left:8, borderLeftWidth:2 } : { right:8, borderRightWidth:2 }),
                borderColor: dark ? "rgba(0,245,255,.3)" : "rgba(0,180,204,.3)",
              }} />
            ))}

            <div className="modal-header">
              <span className="modal-title">{d ? "// NEW TASKS" : "สร้างงานใหม่"}</span>
              <button className="modal-close" onClick={() => setShowModal(false)}><XIcon /></button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">{d ? "TASKS TITLE *" : "ชื่องาน *"}</label>
                <input
                  className="form-input"
                  placeholder={d ? "Enter tasks name..." : "ชื่องาน..."}
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{d ? "DESCRIPTION" : "รายละเอียด"}</label>
                <textarea
                  className="form-textarea"
                  placeholder={d ? "Tasks briefing..." : "รายละเอียดงาน..."}
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{d ? "STATUS" : "สถานะ"}</label>
                <select className="form-select" value={form.status_id} onChange={e => setForm(p => ({ ...p, status_id: e.target.value }))}>
                  <option value={1}>TO DO</option>
                  <option value={2}>IN PROGRESS</option>
                  <option value={3}>DONE</option>
                </select>
              </div>
            </div>

            {submitError && <div className="modal-error">⚠ {submitError}</div>}

            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowModal(false)} disabled={submitting}>
                {d ? "ABORT" : "ยกเลิก"}
              </button>
              <button className="btn-submit" onClick={handleCreate} disabled={submitting || !form.title.trim()}>
                {submitting && <span className="submit-spinner" />}
                {d ? "DEPLOY" : "สร้าง"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
