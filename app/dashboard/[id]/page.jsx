"use client";
import { useParams, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { taskById, updateTask } from "../../services/taskService";

const PRIORITY_COLOR = { high: "#ff2d55", medium: "#ff9500", low: "#30d158" };
const PRIORITY_GLOW  = { high: "rgba(255,45,85,.3)", medium: "rgba(255,149,0,.25)", low: "rgba(48,209,88,.25)" };
const STATUS_ID_MAP  = { standby: 1, "in-progress": 2, done: 3 };
const ID_STATUS_MAP  = { 1: "standby", 2: "in-progress", 3: "done" };
const STATUS_LABEL   = { standby: "TO DO", "in-progress": "IN PROGRESS", done: "DONE" };
const STATUS_MAP = { "ต้องทำ": "standby", "กำลังทำ": "in-progress", "เสร็จ": "done", "To Do": "standby", "In Progress": "in-progress", "Done": "done" };

const SunIcon   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
const MoonIcon  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const BackIcon  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const EditIcon  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const CheckIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><polyline points="20,6 9,17 4,12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const XIcon     = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;

export default function TaskDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [dark, setDark] = useState(true);
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* Edit mode */
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", status_id: 1 });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const stars = useRef(Array.from({ length: 60 }, () => ({
    top: `${Math.random()*100}%`, left: `${Math.random()*100}%`,
    dur: `${2+Math.random()*4}s`, delay: `${Math.random()*4}s`,
    op: `${0.1+Math.random()*0.25}`,
  }))).current;

  const loadTask = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await taskById(id);
      const found = Array.isArray(res?.data) ? res.data[0] : (res?.data ?? res);
      if (!found) { setError("Mission not found"); return; }
      // Map status from description_th or description_en
      found.status = STATUS_MAP[found.description_th] ?? STATUS_MAP[found.description_en] ?? "standby";
      setTask(found);
    } catch (err) {
      setError(err?.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTask(); }, [id]);

  const enterEdit = () => {
    setForm({
      title: task.title ?? "",
      description: task.description ?? "",
      status_id: STATUS_ID_MAP[task.status ?? "standby"] ?? 1,
    });
    setSaveError(null);
    setEditMode(true);
  };

  const cancelEdit = () => { setEditMode(false); setSaveError(null); };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    setSaveError(null);
    try {
      await updateTask({ title: form.title, description: form.description, status_id: Number(form.status_id) }, id);
      // Re-fetch to get fresh data
      await loadTask();
      // Ensure status_id is set from form (API might not return it)
      setTask(prev => ({ ...prev, status_id: Number(form.status_id) }));
      setEditMode(false);
    } catch (err) {
      setSaveError(err?.response?.data?.message ?? err?.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const d = dark;
  const taskStatus = task?.status ?? ID_STATUS_MAP[task?.status_id] ?? "standby";

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&family=Share+Tech+Mono&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    .root { min-height: 100vh; font-family: 'Share Tech Mono', monospace; transition: background .4s, color .4s; position: relative; overflow-x: hidden; }
    .root.dark  { background: #020b14; color: #00f5ff; }
    .root.light { background: linear-gradient(135deg,#f0fdff,#e0f9ff,#ccf5ff); color: #004a5a; }

    .stars { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
    .root.light .stars { display: none; }
    .star { position: absolute; width: 2px; height: 2px; background: white; border-radius: 50%; animation: twinkle var(--dur,3s) ease-in-out infinite; animation-delay: var(--delay,0s); }
    @keyframes twinkle { 0%,100%{opacity:var(--op,.2);transform:scale(1)} 50%{opacity:1;transform:scale(1.6)} }

    .hex-bg { position: fixed; inset: 0; pointer-events: none; z-index: 0;
      background-image: url("data:image/svg+xml,%3Csvg width='60' height='52' viewBox='0 0 60 52' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 2 L58 17 L58 35 L30 50 L2 35 L2 17 Z' fill='none' stroke='%2300f5ff' stroke-width='0.5'/%3E%3C/svg%3E");
      background-size: 60px 52px; }
    .root.dark  .hex-bg { opacity: 0.05; }
    .root.light .hex-bg { opacity: 0.07; }

    .scanline { position: fixed; inset: 0; pointer-events: none; z-index: 0; background: repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,245,255,.008) 2px,rgba(0,245,255,.008) 4px); }
    .root.light .scanline { display: none; }

    .radar { position: fixed; bottom: 24px; right: 24px; width: 80px; height: 80px; z-index: 1; pointer-events: none; }
    .root.light .radar { display: none; }
    .radar-ring  { position:absolute;inset:0px;border:1px solid rgba(0,245,255,.12);border-radius:50%; }
    .radar-ring2 { position:absolute;inset:18px;border:1px solid rgba(0,245,255,.08);border-radius:50%; }
    .radar-ring3 { position:absolute;inset:34px;border:1px solid rgba(0,245,255,.12);border-radius:50%; }
    .radar-sweep { position:absolute;inset:0;border-radius:50%;background:conic-gradient(from 0deg,rgba(0,245,255,.35) 0deg,rgba(0,245,255,.08) 40deg,transparent 60deg);animation:spin 3s linear infinite; }
    .radar-ch { position:absolute;top:50%;left:0;right:0;height:1px;background:rgba(0,245,255,.08);transform:translateY(-50%); }
    .radar-cv { position:absolute;left:50%;top:0;bottom:0;width:1px;background:rgba(0,245,255,.08);transform:translateX(-50%); }
    @keyframes spin { to{transform:rotate(360deg)} }

    .navbar { position: sticky; top: 0; z-index: 50; display: flex; align-items: center; justify-content: space-between; padding: 12px 24px; border-bottom: 1px solid; transition: all .4s; }
    .root.dark  .navbar { background: rgba(2,11,20,.92); border-color: rgba(0,245,255,.15); backdrop-filter: blur(12px); }
    .root.light .navbar { background: rgba(255,255,255,.88); border-color: rgba(0,190,220,.25); backdrop-filter: blur(12px); }

    .nav-brand { font-family: 'Orbitron', monospace; font-size: 14px; font-weight: 700; letter-spacing: 4px; text-transform: uppercase; }
    .root.dark  .nav-brand { color: #00f5ff; text-shadow: 0 0 16px rgba(0,245,255,.5); }
    .root.light .nav-brand { color: #005f73; }
    .nav-right { display: flex; align-items: center; gap: 12px; }

    .mode-btn, .logout-btn, .back-btn, .edit-btn, .save-btn, .cancel-btn {
      display: flex; align-items: center; gap: 6px;
      padding: 7px 12px; border: 1px solid; border-radius: 3px;
      font-size: 10px; letter-spacing: 2px; text-transform: uppercase;
      cursor: pointer; font-family: 'Orbitron', monospace; transition: all .2s; background: none;
    }
    .mode-btn:disabled, .save-btn:disabled { opacity: .5; cursor: not-allowed; }

    .root.dark  .mode-btn   { border-color: rgba(0,245,255,.3);    color: rgba(0,245,255,.6); }
    .root.dark  .mode-btn:hover { border-color: #00f5ff; color: #00f5ff; }
    .root.light .mode-btn   { border-color: rgba(0,180,204,.3);    color: rgba(0,100,130,.6); }
    .root.light .mode-btn:hover { border-color: #00b4cc; color: #00b4cc; }

    .root.dark  .logout-btn { border-color: rgba(255,45,85,.3);    color: rgba(255,45,85,.6); }
    .root.dark  .logout-btn:hover { border-color: #ff2d55; color: #ff2d55; background: rgba(255,45,85,.06); }
    .root.light .logout-btn { border-color: rgba(200,0,40,.25);    color: rgba(180,0,30,.6); }
    .root.light .logout-btn:hover { border-color: #c0002a; color: #c0002a; background: rgba(200,0,40,.05); }

    .root.dark  .back-btn   { border-color: rgba(0,245,255,.2);    color: rgba(0,245,255,.5); }
    .root.dark  .back-btn:hover { border-color: #00f5ff; color: #00f5ff; }
    .root.light .back-btn   { border-color: rgba(0,180,204,.25);   color: rgba(0,100,130,.5); }
    .root.light .back-btn:hover { border-color: #00b4cc; color: #00b4cc; }

    /* Edit / Save / Cancel */
    .root.dark  .edit-btn   { border-color: rgba(0,245,255,.25);   color: rgba(0,245,255,.55); }
    .root.dark  .edit-btn:hover { border-color: #00f5ff; color: #00f5ff; background: rgba(0,245,255,.05); }
    .root.light .edit-btn   { border-color: rgba(0,180,204,.3);    color: rgba(0,100,130,.6); }
    .root.light .edit-btn:hover { border-color: #00b4cc; color: #00b4cc; }

    .root.dark  .save-btn   { border-color: rgba(48,209,88,.4);    color: #30d158; background: rgba(48,209,88,.07); }
    .root.dark  .save-btn:hover:not(:disabled) { background: rgba(48,209,88,.14); border-color: #30d158; }
    .root.light .save-btn   { border-color: rgba(0,160,70,.35);    color: #006030; background: rgba(0,180,80,.06); }
    .root.light .save-btn:hover:not(:disabled) { background: rgba(0,180,80,.12); }

    .root.dark  .cancel-btn { border-color: rgba(0,245,255,.15);   color: rgba(0,245,255,.35); }
    .root.dark  .cancel-btn:hover { border-color: rgba(0,245,255,.35); color: rgba(0,245,255,.7); }
    .root.light .cancel-btn { border-color: rgba(0,180,204,.2);    color: rgba(0,100,130,.45); }
    .root.light .cancel-btn:hover { border-color: #00b4cc; color: #00b4cc; }

    .content { position: relative; z-index: 1; max-width: 760px; margin: 0 auto; padding: 32px 24px; }

    .detail-card { border: 1px solid; border-radius: 4px; padding: 32px; position: relative; overflow: hidden; animation: slideUp .28s cubic-bezier(.4,0,.2,1); }
    @keyframes slideUp { from{transform:translateY(16px);opacity:0} to{transform:translateY(0);opacity:1} }
    .root.dark  .detail-card { background: rgba(0,10,25,.85); border-color: rgba(0,245,255,.2); box-shadow: 0 0 40px rgba(0,245,255,.05); }
    .root.light .detail-card { background: rgba(255,255,255,.9); border-color: rgba(0,190,220,.25); box-shadow: 0 8px 40px rgba(0,190,220,.1); backdrop-filter: blur(12px); }
    .detail-card.editing { }
    .root.dark  .detail-card.editing { border-color: rgba(0,245,255,.4); box-shadow: 0 0 40px rgba(0,245,255,.1); }
    .root.light .detail-card.editing { border-color: rgba(0,190,220,.5); }

    .corner { position:absolute; width:16px; height:16px; border-style:solid; border-width:0; }
    .corner-tl { top:10px; left:10px; border-top-width:2px; border-left-width:2px; }
    .corner-tr { top:10px; right:10px; border-top-width:2px; border-right-width:2px; }
    .corner-bl { bottom:10px; left:10px; border-bottom-width:2px; border-left-width:2px; }
    .corner-br { bottom:10px; right:10px; border-bottom-width:2px; border-right-width:2px; }
    .root.dark  .corner { border-color: rgba(0,245,255,.3); }
    .root.light .corner { border-color: rgba(0,180,204,.3); }
    .editing .corner { }
    .root.dark  .editing .corner { border-color: rgba(0,245,255,.6); }

    .priority-stripe { position: absolute; top: 0; left: 0; width: 4px; height: 100%; border-radius: 4px 0 0 4px; }

    .section-label { font-size: 9px; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px; }
    .root.dark  .section-label { color: rgba(0,245,255,.35); }
    .root.light .section-label { color: rgba(0,100,130,.4); }

    .detail-title { font-family: 'Orbitron', monospace; font-size: 20px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; line-height: 1.3; margin-bottom: 16px; }
    .root.dark  .detail-title { color: #00f5ff; text-shadow: 0 0 20px rgba(0,245,255,.3); }
    .root.light .detail-title { color: #003a4a; }

    .status-badge { display: inline-block; padding: 3px 10px; border: 1px solid; border-radius: 2px; font-size: 9px; letter-spacing: 2px; text-transform: uppercase; }
    .status-standby     { color: rgba(0,245,255,.6); border-color: rgba(0,245,255,.25); background: rgba(0,245,255,.05); }
    .status-in-progress { color: #ff9500; border-color: rgba(255,149,0,.3); background: rgba(255,149,0,.07); }
    .status-done        { color: #30d158; border-color: rgba(48,209,88,.3); background: rgba(48,209,88,.07); }
    .root.light .status-standby { color: #007090; border-color: rgba(0,150,190,.3); background: rgba(0,150,190,.06); }

    .divider { height: 1px; margin: 24px 0; }
    .root.dark  .divider { background: rgba(0,245,255,.08); }
    .root.light .divider { background: rgba(0,190,220,.12); }

    .detail-desc { font-size: 13px; line-height: 1.7; }
    .root.dark  .detail-desc { color: rgba(0,245,255,.6); }
    .root.light .detail-desc { color: rgba(0,80,100,.75); }

    /* Form inputs (edit mode) */
    .edit-input, .edit-textarea, .edit-select {
      width: 100%; padding: 10px 12px; border: 1px solid; border-radius: 3px;
      font-family: 'Share Tech Mono', monospace; font-size: 13px;
      letter-spacing: .5px; outline: none; transition: all .2s;
    }
    .edit-textarea { resize: vertical; min-height: 90px; }
    .root.dark  .edit-input, .root.dark .edit-textarea, .root.dark .edit-select {
      background: rgba(0,245,255,.04); border-color: rgba(0,245,255,.25); color: #00f5ff;
    }
    .root.dark  .edit-input::placeholder, .root.dark .edit-textarea::placeholder { color: rgba(0,245,255,.2); }
    .root.dark  .edit-input:focus, .root.dark .edit-textarea:focus, .root.dark .edit-select:focus {
      border-color: #00f5ff; box-shadow: 0 0 0 2px rgba(0,245,255,.12);
    }
    .root.light .edit-input, .root.light .edit-textarea, .root.light .edit-select {
      background: rgba(240,253,255,.8); border-color: rgba(0,190,220,.35); color: #004a5a;
    }
    .root.light .edit-input:focus, .root.light .edit-textarea:focus, .root.light .edit-select:focus {
      border-color: #00b4cc; box-shadow: 0 0 0 3px rgba(0,180,204,.1);
    }

    /* Edit title — larger */
    .edit-input.title-input { font-family: 'Orbitron', monospace; font-size: 16px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 16px; }
    .root.dark  .edit-input.title-input { color: #00f5ff; }

    .edit-mode-bar { display: flex; align-items: center; gap: 8px; margin-bottom: 20px; padding: 8px 12px; border: 1px solid; border-radius: 3px; }
    .root.dark  .edit-mode-bar { border-color: rgba(0,245,255,.2); background: rgba(0,245,255,.03); }
    .root.light .edit-mode-bar { border-color: rgba(0,190,220,.2); background: rgba(0,190,220,.04); }
    .edit-mode-label { font-size: 9px; letter-spacing: 2px; text-transform: uppercase; flex: 1; }
    .root.dark  .edit-mode-label { color: rgba(0,245,255,.5); }
    .root.light .edit-mode-label { color: rgba(0,100,130,.5); }

    .save-spinner { width: 11px; height: 11px; border: 1.5px solid currentColor; border-top-color: transparent; border-radius: 50%; animation: spin .6s linear infinite; }
    .save-error { font-size: 11px; letter-spacing: .5px; color: #ff2d55; margin-top: 12px; }

    .meta-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 20px; margin-top: 24px; }
    .meta-value { font-size: 13px; margin-top: 4px; }
    .root.dark  .meta-value { color: rgba(0,245,255,.7); }
    .root.light .meta-value { color: #004a5a; }

    .center-state { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; gap: 16px; }
    .loading-spinner { width: 36px; height: 36px; border: 2px solid; border-radius: 50%; border-top-color: transparent; animation: spin .7s linear infinite; }
    .root.dark  .loading-spinner { border-color: rgba(0,245,255,.4); border-top-color: transparent; }
    .root.light .loading-spinner { border-color: rgba(0,190,220,.4); border-top-color: transparent; }
    .state-text { font-family: 'Orbitron', monospace; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; }
    .root.dark  .state-text { color: rgba(0,245,255,.4); }
    .root.light .state-text { color: rgba(0,100,130,.4); }
    .error-text { color: #ff2d55; }

    ::-webkit-scrollbar { width: 5px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(0,245,255,.15); border-radius: 3px; }
    .root.light ::-webkit-scrollbar-thumb { background: rgba(0,190,220,.2); }
  `;

  return (
    <div className={`root ${d ? "dark" : "light"}`}>
      <style>{css}</style>

      <div className="stars">
        {stars.map((s, i) => (
          <div key={i} className="star" style={{ top: s.top, left: s.left, "--dur": s.dur, "--delay": s.delay, "--op": s.op }} />
        ))}
      </div>
      <div className="hex-bg" />
      <div className="scanline" />
      <div className="radar">
        <div className="radar-ring"/><div className="radar-ring2"/><div className="radar-ring3"/>
        <div className="radar-sweep"/><div className="radar-ch"/><div className="radar-cv"/>
      </div>

      {/* Navbar */}
      <nav className="navbar">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button className="back-btn" onClick={() => router.push("/dashboard")}>
            <BackIcon /> {d ? "BACK" : "กลับ"}
          </button>
          <span className="nav-brand">⬡ TASKS CTL</span>
        </div>
        <div className="nav-right">
          <button className="mode-btn" onClick={() => setDark(v => !v)}>
            {dark ? <SunIcon /> : <MoonIcon />}
            {dark ? "LIGHT" : "DARK"}
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

      <div className="content">
        {loading && (
          <div className="center-state">
            <div className="loading-spinner" />
            <div className="state-text">{d ? "LOADING TASKS..." : "กำลังโหลด..."}</div>
          </div>
        )}
        {!loading && error && (
          <div className="center-state">
            <div className="state-text error-text">⚠ {error}</div>
          </div>
        )}
        {!loading && !error && task && (
          <div className={`detail-card${editMode ? " editing" : ""}`}>
            <div className="corner corner-tl"/><div className="corner corner-tr"/>
            <div className="corner corner-bl"/><div className="corner corner-br"/>
            <div className="priority-stripe" style={{ background: PRIORITY_COLOR[task.priority ?? "medium"], boxShadow: `0 0 10px ${PRIORITY_GLOW[task.priority ?? "medium"]}` }} />

            <div style={{ paddingLeft: 16 }}>

              {/* ── Edit mode bar ── */}
              {editMode ? (
                <div className="edit-mode-bar">
                  <span className="edit-mode-label">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" style={{ marginRight: 6, verticalAlign: "middle" }}>
                      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/>
                      <path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                    </svg>
                    {d ? "// EDIT MODE ACTIVE" : "โหมดแก้ไข"}
                  </span>
                  <button className="save-btn" onClick={handleSave} disabled={saving || !form.title.trim()}>
                    {saving ? <span className="save-spinner" /> : <CheckIcon />}
                    {d ? "SAVE" : "บันทึก"}
                  </button>
                  <button className="cancel-btn" onClick={cancelEdit} disabled={saving}>
                    <XIcon /> {d ? "CANCEL" : "ยกเลิก"}
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
                  <button className="edit-btn" onClick={enterEdit}>
                    <EditIcon /> {d ? "EDIT TASKS" : "แก้ไขงาน"}
                  </button>
                </div>
              )}

              {/* ── Badge row (view) / Status select (edit) ── */}
              {!editMode ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
                  <span className={`status-badge status-${taskStatus}`}>
                    {STATUS_LABEL[taskStatus]}
                  </span>
                  <span style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", opacity: .4 }}>
                    ID: {task.id}
                  </span>
                </div>
              ) : (
                <div style={{ marginBottom: 16 }}>
                  <div className="section-label">{d ? "STATUS" : "สถานะ"}</div>
                  <select
                    className="edit-select"
                    value={form.status_id}
                    onChange={e => setForm(p => ({ ...p, status_id: e.target.value }))}
                  >
                    <option value={1}>TO DO</option>
                    <option value={2}>IN PROGRESS</option>
                    <option value={3}>DONE</option>
                  </select>
                </div>
              )}

              {/* ── Title ── */}
              <div className="section-label">{d ? "// TASKS TITLE" : "ชื่องาน"}</div>
              {!editMode ? (
                <div className="detail-title">{task.title}</div>
              ) : (
                <input
                  className="edit-input title-input"
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder={d ? "Tasks title..." : "ชื่องาน..."}
                />
              )}

              <div className="divider" />

              {/* ── Description ── */}
              <div className="section-label">{d ? "// TASKS BRIEF" : "รายละเอียด"}</div>
              {!editMode ? (
                <div className="detail-desc">{task.description || "—"}</div>
              ) : (
                <textarea
                  className="edit-textarea"
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder={d ? "Tasks briefing..." : "รายละเอียดงาน..."}
                />
              )}

              {saveError && <div className="save-error">⚠ {saveError}</div>}

              {/* ── Meta (view only) ── */}
              {!editMode && (
                <div className="meta-grid">
                  <div>
                    <div className="section-label">{d ? "// OPERATOR" : "ผู้รับผิดชอบ"}</div>
                    <div className="meta-value">
                      {[task.first_name, task.last_name].filter(Boolean).join(" ") || "—"}
                    </div>
                  </div>
                  <div>
                    <div className="section-label">{d ? "// CREATED" : "วันที่สร้าง"}</div>
                    <div className="meta-value">
                      {task.created_at ? task.created_at.slice(0, 10) : "—"}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
