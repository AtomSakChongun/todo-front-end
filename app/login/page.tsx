"use client";

import { useState, FormEvent, ChangeEvent, useRef } from "react";
import axios from "axios";
import {register, login} from "../services/authService"

/* ─── Types ──────────────────────────────────────────────── */
type Mode = "login" | "register";

interface LoginForm { username: string; password: string; }
interface RegisterForm {
  first_name: string; last_name: string;
  username: string; email: string;
  password: string; confirmPassword: string;
}
interface LoginErrors  { username?: string;  password?: string; general?: string; }
interface RegisterErrors {
  first_name?: string; last_name?: string; username?: string;
  email?: string; password?: string; confirmPassword?: string; general?: string;
}

/* ─── Shared SVGs ────────────────────────────────────────── */
const EyeOpen = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
    <path d="M2 8s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z" stroke="currentColor" strokeWidth="1.4"/>
    <circle cx="8" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.4"/>
  </svg>
);
const EyeOff = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
    <path d="M2 8s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z" stroke="currentColor" strokeWidth="1.4"/>
    <circle cx="8" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.4"/>
    <path d="M3 3L13 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);
const Spinner = () => (
  <svg className="spin-anim" width="16" height="16" viewBox="0 0 24 24" fill="none">
    <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
    <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
  </svg>
);
const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
);

/* ─── Main Component ─────────────────────────────────────── */
export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [darkMode, setDarkMode] = useState(true);
  const [animating, setAnimating] = useState(false);
  const [slideDir, setSlideDir] = useState<"left" | "right">("right");

  /* Login state */
  const [loginForm, setLoginForm] = useState<LoginForm>({ username: "", password: "" });
  const [loginErrors, setLoginErrors] = useState<LoginErrors>({});
  const [loginLoading, setLoginLoading] = useState(false);
  const [showLoginPw, setShowLoginPw] = useState(false);

  /* Register state */
  const [regForm, setRegForm] = useState<RegisterForm>({
    first_name: "", last_name: "", username: "", email: "", password: "", confirmPassword: "",
  });
  const [regErrors, setRegErrors] = useState<RegisterErrors>({});
  const [regLoading, setRegLoading] = useState(false);
  const [showRegPw, setShowRegPw] = useState(false);
  const [showRegCPw, setShowRegCPw] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);

  const switchMode = (to: Mode) => {
    if (to === mode || animating) return;
    setSlideDir(to === "register" ? "left" : "right");
    setAnimating(true);
    setTimeout(() => {
      setMode(to);
      setAnimating(false);
    }, 320);
  };

  /* ── Login handlers ── */
  const validateLogin = (): LoginErrors => {
    const e: LoginErrors = {};
    if (!loginForm.username.trim()) e.username = "กรุณากรอก Operator ID";
    if (!loginForm.password) e.password = "กรุณากรอกรหัสผ่าน";
    else if (loginForm.password.length < 6) e.password = "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร";
    return e;
  };
  const handleLoginChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginForm(p => ({ ...p, [name]: value }));
    if (loginErrors[name as keyof LoginErrors]) setLoginErrors(p => ({ ...p, [name]: undefined }));
  };
  const handleLoginSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errs = validateLogin();
    if (Object.keys(errs).length > 0) { setLoginErrors(errs); return; }
    setLoginLoading(true); setLoginErrors({});
    try {
      await login({ username: loginForm.username, password: loginForm.password });
      window.location.href = "/";
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.message || err.response?.data?.detail || "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
        setLoginErrors({ general: msg });
      } else {
        setLoginErrors({ general: "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่" });
      }
    } finally {
      setLoginLoading(false);
    }
  };

  /* ── Register handlers ── */
  const validateReg = (): RegisterErrors => {
    const e: RegisterErrors = {};
    if (!regForm.first_name.trim()) e.first_name = "กรุณากรอกชื่อ";
    if (!regForm.last_name.trim()) e.last_name = "กรุณากรอกนามสกุล";
    if (!regForm.username.trim()) e.username = "กรุณากรอก Username";
    else if (regForm.username.length < 3) e.username = "Username ต้องมีอย่างน้อย 3 ตัวอักษร";
    else if (!/^[a-zA-Z0-9_]+$/.test(regForm.username)) e.username = "Username ใช้ได้เฉพาะ a-z, 0-9 และ _";
    if (!regForm.email) e.email = "กรุณากรอกอีเมล";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regForm.email)) e.email = "รูปแบบอีเมลไม่ถูกต้อง";
    if (!regForm.password) e.password = "กรุณากรอกรหัสผ่าน";
    else if (regForm.password.length < 6) e.password = "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร";
    if (!regForm.confirmPassword) e.confirmPassword = "กรุณายืนยันรหัสผ่าน";
    else if (regForm.password !== regForm.confirmPassword) e.confirmPassword = "รหัสผ่านไม่ตรงกัน";
    return e;
  };
  const handleRegChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRegForm(p => ({ ...p, [name]: value }));
    if (regErrors[name as keyof RegisterErrors]) setRegErrors(p => ({ ...p, [name]: undefined }));
  };
  const handleRegSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errs = validateReg();
    if (Object.keys(errs).length > 0) { setRegErrors(errs); return; }
    setRegLoading(true); setRegErrors({});
    try {
      await register({
        first_name: regForm.first_name,
        last_name: regForm.last_name,
        username: regForm.username,
        email: regForm.email,
        password: regForm.password,
      });
      setRegSuccess(true);
    } catch (err) {
      console.log(err)
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.message || err.response?.data?.detail || "สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่";
        setRegErrors({ general: msg });
      } else {
        setRegErrors({ general: "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่" });
      }
    } finally {
      setRegLoading(false);
    }
  };

  /* Password strength */
  const pwStrength = (pw: string) => {
    if (!pw) return 0;
    return (pw.length >= 8 ? 1 : 0)
      + (/[A-Z]/.test(pw) ? 1 : 0)
      + (/[0-9]/.test(pw) ? 1 : 0)
      + (/[^a-zA-Z0-9]/.test(pw) ? 1 : 0);
  };
  const strengthLabel = ["", "WEAK", "FAIR", "GOOD", "STRONG"];
  const strengthCls   = ["", "weak", "fair", "good", "strong"];

  const d = darkMode;

  /* ── Stars (memoised positions) ── */
  const stars = useRef(
    Array.from({ length: 80 }, () => ({
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      dur: `${2 + Math.random() * 4}s`,
      delay: `${Math.random() * 4}s`,
      op: `${0.1 + Math.random() * 0.3}`,
      big: Math.random() > 0.8,
    }))
  ).current;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&family=Share+Tech+Mono&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        /* ── Root ── */
        .auth-root {
          min-height: 100vh;
          display: flex; align-items: center; justify-content: center;
          padding: 2rem 1rem;
          position: relative; overflow: hidden;
          font-family: 'Share Tech Mono', monospace;
          transition: background 0.4s ease, color 0.4s ease;
        }
        .auth-root.dark  { background: #020b14; color: #00f5ff; }
        .auth-root.light { background: linear-gradient(135deg,#f0fdff 0%,#e0f9ff 40%,#ccf5ff 100%); color: #004a5a; }

        /* ── Background layers ── */
        .stars { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
        .auth-root.light .stars { display: none; }
        .star {
          position: absolute; width: 2px; height: 2px;
          background: white; border-radius: 50%;
          animation: twinkle var(--dur,3s) ease-in-out infinite;
          animation-delay: var(--delay,0s);
        }
        @keyframes twinkle {
          0%,100% { opacity: var(--min-op,.2); transform: scale(1); }
          50%      { opacity: 1; transform: scale(1.5); }
        }
        .hex-bg {
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background-image: url("data:image/svg+xml,%3Csvg width='60' height='52' viewBox='0 0 60 52' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 2 L58 17 L58 35 L30 50 L2 35 L2 17 Z' fill='none' stroke='%2300f5ff' stroke-width='0.5'/%3E%3C/svg%3E");
          background-size: 60px 52px;
        }
        .auth-root.dark  .hex-bg { opacity: 0.06; }
        .auth-root.light .hex-bg { opacity: 0.08; }

        /* ── Radar ── */
        .radar { position: fixed; bottom: 30px; right: 30px; width: 90px; height: 90px; z-index: 1; pointer-events: none; }
        .auth-root.light .radar { display: none; }
        .radar-ring  { position: absolute; inset:  0px; border: 1px solid rgba(0,245,255,.15); border-radius: 50%; }
        .radar-ring2 { position: absolute; inset: 20px; border: 1px solid rgba(0,245,255,.10); border-radius: 50%; }
        .radar-ring3 { position: absolute; inset: 38px; border: 1px solid rgba(0,245,255,.15); border-radius: 50%; }
        .radar-sweep {
          position: absolute; inset: 0; border-radius: 50%;
          background: conic-gradient(from 0deg, rgba(0,245,255,.4) 0deg, rgba(0,245,255,.1) 40deg, transparent 60deg);
          animation: radarSpin 3s linear infinite;
        }
        @keyframes radarSpin { to { transform: rotate(360deg); } }
        .radar-ch { position: absolute; top:50%; left:0; right:0; height:1px; background:rgba(0,245,255,.1); transform:translateY(-50%); }
        .radar-cv { position: absolute; left:50%; top:0; bottom:0; width:1px; background:rgba(0,245,255,.1); transform:translateX(-50%); }

        /* ── Side HUD ── */
        .side-hud { position: fixed; left:20px; top:50%; transform:translateY(-50%); flex-direction:column; gap:6px; z-index:1; pointer-events:none; }
        .auth-root.dark  .side-hud { display: flex; }
        .auth-root.light .side-hud { display: none; }
        .hud-bar { width:3px; border-radius:2px; background:rgba(0,245,255,.2); animation:hudPulse var(--dur,2s) ease-in-out infinite; }
        @keyframes hudPulse { 0%,100%{opacity:.2} 50%{opacity:.7} }

        /* ── Mode toggle button ── */
        .mode-btn {
          position: fixed; top: 20px; right: 20px; z-index: 100;
          display: flex; align-items: center; gap: 6px;
          padding: 8px 14px; border: 1px solid; border-radius: 3px;
          font-size: 10px; letter-spacing: 2px; text-transform: uppercase;
          cursor: pointer; font-family: 'Orbitron', monospace;
          transition: all .2s ease; background: none;
        }
        .auth-root.dark  .mode-btn { border-color:rgba(0,245,255,.3); color:rgba(0,245,255,.6); background:rgba(0,245,255,.05); }
        .auth-root.dark  .mode-btn:hover { border-color:#00f5ff; color:#00f5ff; }
        .auth-root.light .mode-btn { border-color:rgba(0,180,204,.3); color:rgba(0,100,130,.6); background:rgba(0,190,220,.06); }
        .auth-root.light .mode-btn:hover { border-color:#00b4cc; color:#00b4cc; }

        /* ── Card ── */
        .card {
          position: relative; z-index: 2;
          width: 100%; max-width: 460px;
          border-radius: 4px; padding: 2rem;
          transition: all .4s ease; overflow: hidden;
        }
        .auth-root.dark .card {
          background: rgba(0,10,25,.92);
          border: 1px solid rgba(0,245,255,.3);
          box-shadow: 0 0 0 1px rgba(0,245,255,.08), 0 0 40px rgba(0,245,255,.07), inset 0 0 60px rgba(0,10,40,.6);
        }
        .auth-root.light .card {
          background: rgba(255,255,255,.88);
          border: 1px solid rgba(0,190,220,.35);
          box-shadow: 0 0 0 1px rgba(0,190,220,.1), 0 4px 40px rgba(0,190,220,.12), 0 20px 60px rgba(0,190,220,.06);
          backdrop-filter: blur(16px);
        }
        .scanline {
          position: absolute; inset: 0; pointer-events: none; z-index: 10; border-radius: inherit;
          background: repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,245,255,.012) 2px,rgba(0,245,255,.012) 4px);
        }
        .auth-root.light .scanline { display: none; }

        /* Corners */
        .corner { position:absolute; width:16px; height:16px; border-style:solid; border-width:0; transition:border-color .4s; }
        .corner-tl { top:8px;    left:8px;  border-top-width:2px;    border-left-width:2px; }
        .corner-tr { top:8px;    right:8px; border-top-width:2px;    border-right-width:2px; }
        .corner-bl { bottom:8px; left:8px;  border-bottom-width:2px; border-left-width:2px; }
        .corner-br { bottom:8px; right:8px; border-bottom-width:2px; border-right-width:2px; }
        .auth-root.dark  .corner { border-color:#00f5ff; }
        .auth-root.light .corner { border-color:#00b4cc; }

        /* ── Tab switcher ── */
        .tab-bar {
          display: flex; border-radius: 3px; overflow: hidden;
          margin-bottom: 1.5rem;
          border: 1px solid;
        }
        .auth-root.dark  .tab-bar { border-color: rgba(0,245,255,.2); background: rgba(0,245,255,.03); }
        .auth-root.light .tab-bar { border-color: rgba(0,190,220,.25); background: rgba(0,190,220,.04); }

        .tab-btn {
          flex: 1; padding: 9px 0;
          font-family: 'Orbitron', monospace;
          font-size: 10px; letter-spacing: 2px; text-transform: uppercase;
          cursor: pointer; border: none; background: none;
          transition: all .25s ease; position: relative;
        }
        .auth-root.dark  .tab-btn        { color: rgba(0,245,255,.4); }
        .auth-root.dark  .tab-btn.active { color: #020b14; background: #00f5ff; text-shadow: none; }
        .auth-root.light .tab-btn        { color: rgba(0,120,150,.5); }
        .auth-root.light .tab-btn.active { color: #fff; background: #00b4cc; }
        .tab-btn:not(.active):hover {
          opacity: 0.8;
        }

        /* ── Slide animation wrapper ── */
        .form-slide-wrap { overflow: hidden; }
        .form-slide {
          transition: transform .32s cubic-bezier(.4,0,.2,1), opacity .32s ease;
        }
        .form-slide.slide-out-left  { transform: translateX(-40px); opacity: 0; }
        .form-slide.slide-out-right { transform: translateX(40px);  opacity: 0; }
        .form-slide.slide-in        { transform: translateX(0);     opacity: 1; }

        /* ── Badge ── */
        .badge {
          display: inline-flex; align-items: center; gap: 6px;
          border: 1px solid; padding: 2px 10px; border-radius: 2px;
          font-size: 10px; letter-spacing: 2px; text-transform: uppercase;
          margin-bottom: 1rem;
        }
        .badge-dot { width:5px; height:5px; border-radius:50%; background:currentColor; animation: pulse 1.5s ease-in-out infinite; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.3;transform:scale(.7)} }
        .auth-root.dark  .badge { border-color:rgba(0,245,255,.3); color:rgba(0,245,255,.4); }
        .auth-root.light .badge { border-color:rgba(0,180,204,.3); color:rgba(0,130,160,.6); }

        /* ── Titles ── */
        .card-title {
          font-family: 'Orbitron', monospace; font-size: 1.4rem; font-weight: 700;
          letter-spacing: 3px; text-transform: uppercase; transition: color .4s, text-shadow .4s;
        }
        .card-title:hover { animation: glitch .3s steps(2,jump-none); }
        @keyframes glitch {
          0%   { text-shadow:  2px 0 #ff0055,-2px 0 #00f5ff; }
          33%  { text-shadow: -2px 0 #ff0055, 2px 0 #00f5ff; }
          66%  { text-shadow:  2px 2px #ff0055,-2px -2px #00f5ff; }
          100% { text-shadow: 0 0 20px rgba(0,245,255,.6); }
        }
        .card-sub { font-size:11px; letter-spacing:1.5px; margin-top:4px; transition:color .4s; }
        .auth-root.dark  .card-title { color:#00f5ff; text-shadow:0 0 20px rgba(0,245,255,.6); }
        .auth-root.light .card-title { color:#005f73; text-shadow:none; }
        .auth-root.dark  .card-sub   { color:rgba(0,245,255,.5); }
        .auth-root.light .card-sub   { color:#4a8fa0; }

        /* ── Labels & Inputs ── */
        label {
          display:block; font-size:11px; letter-spacing:1.5px;
          text-transform:uppercase; margin-bottom:6px; transition:color .4s;
        }
        .auth-root.dark  label { color:rgba(0,245,255,.7); }
        .auth-root.light label { color:#006070; }

        .input-field {
          width:100%; border:1px solid; border-radius:3px; padding:10px 12px;
          font-size:13px; font-family:'Share Tech Mono',monospace;
          outline:none; transition:all .2s ease; letter-spacing:.5px;
        }
        .auth-root.dark  .input-field { background:rgba(0,245,255,.04); border-color:rgba(0,245,255,.2); color:#00f5ff; }
        .auth-root.dark  .input-field::placeholder { color:rgba(0,245,255,.25); }
        .auth-root.dark  .input-field:focus { border-color:#00f5ff; box-shadow:0 0 0 2px rgba(0,245,255,.15),0 0 20px rgba(0,245,255,.1); background:rgba(0,245,255,.06); }
        .auth-root.light .input-field { background:rgba(240,253,255,.8); border-color:rgba(0,190,220,.3); color:#004a5a; }
        .auth-root.light .input-field::placeholder { color:rgba(0,100,130,.3); }
        .auth-root.light .input-field:focus { border-color:#00b4cc; box-shadow:0 0 0 3px rgba(0,180,204,.12); background:#fff; }

        .input-error { border-color:#ff2d55 !important; box-shadow:0 0 0 2px rgba(255,45,85,.15) !important; }
        .auth-root.dark  .input-error { background:rgba(255,45,85,.05) !important; }
        .auth-root.light .input-error { background:rgba(255,230,236,.5) !important; }

        .input-wrap { position:relative; }
        .input-wrap .input-field { padding-right:40px; }

        .eye-btn {
          position:absolute; right:10px; top:50%; transform:translateY(-50%);
          background:none; border:none; cursor:pointer; transition:color .2s;
          padding:4px; display:flex; align-items:center;
        }
        .auth-root.dark  .eye-btn       { color:rgba(0,245,255,.4); }
        .auth-root.dark  .eye-btn:hover { color:#00f5ff; }
        .auth-root.light .eye-btn       { color:rgba(0,100,130,.4); }
        .auth-root.light .eye-btn:hover { color:#00b4cc; }

        /* ── Error / Success banners ── */
        .err-text { font-size:11px; margin-top:5px; letter-spacing:.5px; }
        .auth-root.dark  .err-text { color:#ff2d55; }
        .auth-root.light .err-text { color:#c0002a; }

        .banner {
          display:flex; align-items:center; gap:8px;
          border:1px solid; border-radius:3px;
          padding:10px 14px; font-size:12px; margin-bottom:1rem; letter-spacing:.5px;
        }
        .banner.error   { }
        .banner.success { }
        .auth-root.dark  .banner.error   { background:rgba(255,45,85,.1);  border-color:rgba(255,45,85,.4);  color:#ff4d6a; }
        .auth-root.dark  .banner.success { background:rgba(0,255,100,.08); border-color:rgba(0,255,100,.35); color:#00ff88; }
        .auth-root.light .banner.error   { background:rgba(255,0,60,.06);  border-color:rgba(200,0,40,.3);   color:#c0002a; }
        .auth-root.light .banner.success { background:rgba(0,180,80,.07);  border-color:rgba(0,160,70,.3);   color:#006030; }

        /* ── Submit button ── */
        .submit-btn {
          width:100%; display:flex; align-items:center; justify-content:center; gap:8px;
          padding:12px 20px; font-family:'Orbitron',monospace;
          font-size:12px; font-weight:600; letter-spacing:3px; text-transform:uppercase;
          border-radius:3px; cursor:pointer; transition:all .2s ease;
          position:relative; overflow:hidden;
        }
        .submit-btn::before {
          content:''; position:absolute; top:0; left:-100%;
          width:100%; height:100%;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,.08),transparent);
          transition:left .5s ease;
        }
        .submit-btn:hover::before { left:100%; }
        .auth-root.dark  .submit-btn {
          background:linear-gradient(135deg,rgba(0,245,255,.15),rgba(0,100,200,.2));
          border:1px solid rgba(0,245,255,.5); color:#00f5ff;
          text-shadow:0 0 10px rgba(0,245,255,.6);
          box-shadow:0 0 20px rgba(0,245,255,.1),inset 0 1px 0 rgba(0,245,255,.1);
        }
        .auth-root.dark  .submit-btn:hover:not(:disabled) {
          background:linear-gradient(135deg,rgba(0,245,255,.25),rgba(0,150,255,.3));
          box-shadow:0 0 30px rgba(0,245,255,.25),inset 0 1px 0 rgba(0,245,255,.2);
        }
        .auth-root.light .submit-btn {
          background:linear-gradient(135deg,#00c8e0,#0096b4); border:none;
          color:#fff; text-shadow:0 1px 3px rgba(0,80,100,.4);
          box-shadow:0 4px 20px rgba(0,180,210,.35),inset 0 1px 0 rgba(255,255,255,.25);
        }
        .auth-root.light .submit-btn:hover:not(:disabled) {
          background:linear-gradient(135deg,#00d8f0,#00aacc);
          box-shadow:0 6px 28px rgba(0,200,230,.45); transform:translateY(-1px);
        }
        .submit-btn:disabled { opacity:.5; cursor:not-allowed; }

        /* ── Divider ── */
        .divider { display:flex; align-items:center; gap:12px; margin:1.5rem 0; }
        .divider-line { flex:1; height:1px; transition:background .4s; }
        .divider-text { font-size:10px; letter-spacing:2px; text-transform:uppercase; transition:color .4s; }
        .auth-root.dark  .divider-line { background:rgba(0,245,255,.12); }
        .auth-root.dark  .divider-text { color:rgba(0,245,255,.3); }
        .auth-root.light .divider-line { background:rgba(0,190,220,.15); }
        .auth-root.light .divider-text { color:rgba(0,130,160,.4); }

        /* ── Google button ── */
        .google-btn {
          width:100%; display:flex; align-items:center; justify-content:center; gap:10px;
          padding:10px 20px; border-radius:3px; font-size:12px; letter-spacing:1px;
          cursor:pointer; transition:all .2s ease; font-family:'Share Tech Mono',monospace;
        }
        .auth-root.dark  .google-btn { background:rgba(0,245,255,.03); border:1px solid rgba(0,245,255,.15); color:rgba(0,245,255,.6); }
        .auth-root.dark  .google-btn:hover { background:rgba(0,245,255,.07); border-color:rgba(0,245,255,.3); color:#00f5ff; }
        .auth-root.light .google-btn { background:rgba(240,253,255,.9); border:1px solid rgba(0,190,220,.25); color:#006070; }
        .auth-root.light .google-btn:hover { background:rgba(0,190,220,.06); border-color:rgba(0,190,220,.5); }

        /* ── Forgot link ── */
        .forgot { font-size:10px; letter-spacing:1px; text-decoration:none; transition:color .2s; }
        .auth-root.dark  .forgot { color:rgba(0,245,255,.5); }
        .auth-root.dark  .forgot:hover { color:#00f5ff; }
        .auth-root.light .forgot { color:#008faa; }
        .auth-root.light .forgot:hover { color:#00b4cc; }
        a { text-decoration:none; transition:color .2s; }
        a:hover { text-decoration:underline; }

        /* ── Checkbox ── */
        .check-label { font-size:12px; letter-spacing:.5px; margin-bottom:0 !important; text-transform:none !important; }
        .auth-root.dark  .check-label { color:rgba(0,245,255,.5); }
        .auth-root.light .check-label { color:#5a8a9a; }
        .auth-root.dark  input[type="checkbox"] { accent-color:#00f5ff; }
        .auth-root.light input[type="checkbox"] { accent-color:#00b4cc; }

        /* ── Footer text ── */
        .footer-text { font-size:12px; letter-spacing:.5px; }
        .footer-link { font-size:12px; }
        .auth-root.dark  .footer-text { color:rgba(0,245,255,.4); }
        .auth-root.dark  .footer-link { color:#00f5ff; }
        .auth-root.light .footer-text { color:#6a9eae; }
        .auth-root.light .footer-link { color:#007a90; font-weight:600; }

        /* ── Two-column row ── */
        .field-row { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
        @media (max-width:480px) { .field-row { grid-template-columns:1fr; } }

        /* ── Password strength ── */
        .strength-bar-wrap { display:flex; gap:4px; margin-top:6px; }
        .strength-seg { flex:1; height:3px; border-radius:2px; background:rgba(128,128,128,.2); transition:background .3s; }
        .strength-seg.s-weak   { background:#ff2d55; }
        .strength-seg.s-fair   { background:#ff9500; }
        .strength-seg.s-good   { background:#34c759; }
        .strength-seg.s-strong { background:#00f5ff; }
        .strength-text { font-size:11px; margin-top:4px; letter-spacing:.5px; }
        .auth-root.dark  .strength-text { color:rgba(0,245,255,.5); }
        .auth-root.light .strength-text { color:#5a8a9a; }

        /* ── Spinner ── */
        @keyframes spin { to { transform:rotate(360deg); } }
        .spin-anim { animation:spin .8s linear infinite; }

        /* ── Utilities ── */
        .mb-1{margin-bottom:4px} .mb-3{margin-bottom:12px} .mb-4{margin-bottom:1rem}
        .mb-6{margin-bottom:1.5rem} .mt-6{margin-top:1.5rem}
        .flex{display:flex} .items-center{align-items:center}
        .justify-between{justify-content:space-between}
        .gap-2{gap:8px} .text-center{text-align:center}
      `}</style>

      <div className={`auth-root ${d ? "dark" : "light"}`}>

        {/* ── Mode toggle ── */}
        <button className="mode-btn" onClick={() => setDarkMode(!d)}>
          {d ? (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
              DAY MODE
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
              COMBAT MODE
            </>
          )}
        </button>

        {/* ── Stars ── */}
        <div className="stars" aria-hidden="true">
          {stars.map((s, i) => (
            <div key={i} className="star" style={{
              top: s.top, left: s.left,
              "--dur": s.dur, "--delay": s.delay, "--min-op": s.op,
              width: s.big ? "3px" : "2px", height: s.big ? "3px" : "2px",
            } as React.CSSProperties} />
          ))}
        </div>

        <div className="hex-bg" aria-hidden="true"/>

        {/* ── Radar ── */}
        <div className="radar" aria-hidden="true">
          <div className="radar-ring"/><div className="radar-ring2"/><div className="radar-ring3"/>
          <div className="radar-sweep"/><div className="radar-ch"/><div className="radar-cv"/>
        </div>

        {/* ── Side HUD ── */}
        <div className="side-hud" aria-hidden="true">
          {[80,50,90,30,70,40,60,85,45,65].map((h,i) => (
            <div key={i} className="hud-bar" style={{ height:`${h*.3}px`, "--dur":`${1.5+i*.3}s` } as React.CSSProperties}/>
          ))}
        </div>

        {/* ── Card ── */}
        <div className="card">
          <div className="scanline" aria-hidden="true"/>
          <div className="corner corner-tl"/><div className="corner corner-tr"/>
          <div className="corner corner-bl"/><div className="corner corner-br"/>

          {/* Header */}
          <div className="text-center mb-6">
            <div style={{ display:"flex", justifyContent:"center", marginBottom:"12px" }}>
              <span className="badge">
                <span className="badge-dot"/>
                {mode === "login"
                  ? (d ? "SECURE CHANNEL" : "MISSION CONTROL")
                  : (d ? "NEW RECRUIT"    : "สมัครสมาชิก")}
              </span>
            </div>
            <h1 className="card-title">
              {mode === "login"
                ? (d ? "COMBAT LOGIN" : "เข้าสู่ระบบ")
                : (d ? "ENLIST NOW"   : "ลงทะเบียน")}
            </h1>
            <p className="card-sub">
              {mode === "login"
                ? (d ? "AUTHENTICATE · OPERATOR ACCESS" : "MISSION COMMAND PORTAL")
                : (d ? "CREATE IDENTITY · GAIN CLEARANCE" : "REGISTER OPERATOR PROFILE")}
            </p>
          </div>

          {/* ── Tab switcher ── */}
          <div className="tab-bar" role="tablist">
            <button
              role="tab"
              aria-selected={mode === "login"}
              className={`tab-btn ${mode === "login" ? "active" : ""}`}
              onClick={() => switchMode("login")}
            >
              {d ? "// LOGIN" : "เข้าสู่ระบบ"}
            </button>
            <button
              role="tab"
              aria-selected={mode === "register"}
              className={`tab-btn ${mode === "register" ? "active" : ""}`}
              onClick={() => switchMode("register")}
            >
              {d ? "// REGISTER" : "สมัครสมาชิก"}
            </button>
          </div>

          {/* ── Slide wrapper ── */}
          <div className="form-slide-wrap">
            <div className={`form-slide ${
              animating
                ? (slideDir === "left" ? "slide-out-left" : "slide-out-right")
                : "slide-in"
            }`}>

              {/* ════════ LOGIN FORM ════════ */}
              {mode === "login" && (
                <>
                  {loginErrors.general && (
                    <div className="banner error">
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M8 5v3.5M8 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                      {d ? "⚠ AUTH FAILED — " : ""}{loginErrors.general}
                    </div>
                  )}
                  <form onSubmit={handleLoginSubmit} noValidate>
                    {/* Operator ID (Username) */}
                    <div className="mb-4">
                      <label htmlFor="login-username">{d ? "// OPERATOR ID" : "Operator ID (Username)"}</label>
                      <input
                        id="login-username" name="username" type="text" autoComplete="username"
                        placeholder={d ? "ghost_operator" : "your_username"}
                        value={loginForm.username} onChange={handleLoginChange}
                        className={`input-field ${loginErrors.username ? "input-error" : ""}`}
                      />
                      {loginErrors.username && <p className="err-text">⚠ {loginErrors.username}</p>}
                    </div>
                    
                    {/* Password */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1">
                        <label htmlFor="login-pw" style={{ marginBottom:0 }}>{d ? "// ACCESS KEY" : "รหัสผ่าน"}</label>
                        <a href="#" className="forgot">{d ? "RECOVER KEY" : "ลืมรหัสผ่าน?"}</a>
                      </div>
                      <div className="input-wrap">
                        <input
                          id="login-pw" name="password"
                          type={showLoginPw ? "text" : "password"}
                          autoComplete="current-password"
                          placeholder={d ? "••••••••••••" : "••••••••"}
                          value={loginForm.password} onChange={handleLoginChange}
                          className={`input-field ${loginErrors.password ? "input-error" : ""}`}
                        />
                        <button type="button" className="eye-btn" onClick={() => setShowLoginPw(v => !v)}>
                          {showLoginPw ? <EyeOff/> : <EyeOpen/>}
                        </button>
                      </div>
                      {loginErrors.password && <p className="err-text">⚠ {loginErrors.password}</p>}
                    </div>
                    {/* Remember */}
                    <div className="mb-6 flex items-center gap-2">
                      <input id="remember" type="checkbox" style={{ width:14, height:14 }}/>
                      <label htmlFor="remember" className="check-label">
                        {d ? "KEEP SESSION ACTIVE" : "จดจำฉัน"}
                      </label>
                    </div>
                    {/* Submit */}
                    <button type="submit" disabled={loginLoading} className="submit-btn">
                      {loginLoading ? <Spinner/> : (
                        <>
                          {d ? "AUTHENTICATE" : "เข้าสู่ระบบ"}
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}

              {/* ════════ REGISTER FORM ════════ */}
              {mode === "register" && (
                <>
                  {regSuccess && (
                    <div className="banner success">
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {d ? "✓ ENLISTMENT COMPLETE — WELCOME, OPERATOR" : "✓ สมัครสมาชิกสำเร็จ"}
                    </div>
                  )}
                  {regErrors.general && (
                    <div className="banner error">
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M8 5v3.5M8 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                      {regErrors.general}
                    </div>
                  )}
                  <form onSubmit={handleRegSubmit} noValidate>
                    {/* First / Last Name */}
                    <div className="field-row mb-4">
                      <div>
                        <label htmlFor="first_name">{d ? "// FIRST NAME" : "ชื่อ"}</label>
                        <input
                          id="first_name" name="first_name" type="text" autoComplete="given-name"
                          placeholder={d ? "John" : "ชื่อจริง"}
                          value={regForm.first_name} onChange={handleRegChange}
                          className={`input-field ${regErrors.first_name ? "input-error" : ""}`}
                        />
                        {regErrors.first_name && <p className="err-text">⚠ {regErrors.first_name}</p>}
                      </div>
                      <div>
                        <label htmlFor="last_name">{d ? "// LAST NAME" : "นามสกุล"}</label>
                        <input
                          id="last_name" name="last_name" type="text" autoComplete="family-name"
                          placeholder={d ? "Doe" : "นามสกุล"}
                          value={regForm.last_name} onChange={handleRegChange}
                          className={`input-field ${regErrors.last_name ? "input-error" : ""}`}
                        />
                        {regErrors.last_name && <p className="err-text">⚠ {regErrors.last_name}</p>}
                      </div>
                    </div>
                    {/* Username */}
                    <div className="mb-4">
                      <label htmlFor="username">{d ? "// CALL SIGN" : "Username"}</label>
                      <input
                        id="username" name="username" type="text" autoComplete="username"
                        placeholder={d ? "ghost_operator" : "your_username"}
                        value={regForm.username} onChange={handleRegChange}
                        className={`input-field ${regErrors.username ? "input-error" : ""}`}
                      />
                      {regErrors.username && <p className="err-text">⚠ {regErrors.username}</p>}
                    </div>
                    {/* Email */}
                    <div className="mb-4">
                      <label htmlFor="reg-email">{d ? "// OPERATOR ID" : "อีเมล"}</label>
                      <input
                        id="reg-email" name="email" type="email" autoComplete="email"
                        placeholder={d ? "operator@fleet.net" : "your@email.com"}
                        value={regForm.email} onChange={handleRegChange}
                        className={`input-field ${regErrors.email ? "input-error" : ""}`}
                      />
                      {regErrors.email && <p className="err-text">⚠ {regErrors.email}</p>}
                    </div>
                    {/* Password */}
                    <div className="mb-4">
                      <label htmlFor="reg-pw">{d ? "// ACCESS KEY" : "รหัสผ่าน"}</label>
                      <div className="input-wrap">
                        <input
                          id="reg-pw" name="password"
                          type={showRegPw ? "text" : "password"}
                          autoComplete="new-password"
                          placeholder={d ? "••••••••••••" : "••••••••"}
                          value={regForm.password} onChange={handleRegChange}
                          className={`input-field ${regErrors.password ? "input-error" : ""}`}
                        />
                        <button type="button" className="eye-btn" onClick={() => setShowRegPw(v => !v)}>
                          {showRegPw ? <EyeOff/> : <EyeOpen/>}
                        </button>
                      </div>
                      {regForm.password.length > 0 && (() => {
                        const s = pwStrength(regForm.password);
                        return (
                          <>
                            <div className="strength-bar-wrap">
                              {[1,2,3,4].map(i => (
                                <div key={i} className={`strength-seg ${i <= s ? `s-${strengthCls[s]}` : ""}`}/>
                              ))}
                            </div>
                            <p className="strength-text">
                              {d ? `KEY STRENGTH: ${strengthLabel[s]}` : `ความแข็งแกร่ง: ${strengthLabel[s]}`}
                            </p>
                          </>
                        );
                      })()}
                      {regErrors.password && <p className="err-text">⚠ {regErrors.password}</p>}
                    </div>
                    {/* Confirm Password */}
                    <div className="mb-6">
                      <label htmlFor="reg-cpw">{d ? "// CONFIRM KEY" : "ยืนยันรหัสผ่าน"}</label>
                      <div className="input-wrap">
                        <input
                          id="reg-cpw" name="confirmPassword"
                          type={showRegCPw ? "text" : "password"}
                          autoComplete="new-password"
                          placeholder={d ? "••••••••••••" : "••••••••"}
                          value={regForm.confirmPassword} onChange={handleRegChange}
                          className={`input-field ${regErrors.confirmPassword ? "input-error" : ""}`}
                        />
                        <button type="button" className="eye-btn" onClick={() => setShowRegCPw(v => !v)}>
                          {showRegCPw ? <EyeOff/> : <EyeOpen/>}
                        </button>
                      </div>
                      {regErrors.confirmPassword && <p className="err-text">⚠ {regErrors.confirmPassword}</p>}
                    </div>
                    {/* Submit */}
                    <button type="submit" disabled={regLoading || regSuccess} className="submit-btn">
                      {regLoading ? <Spinner/> : (
                        <>
                          {d ? "ENLIST" : "สมัครสมาชิก"}
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                            <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                          </svg>
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}

            </div>{/* /form-slide */}
          </div>{/* /form-slide-wrap */}

          {/* ── Footer switch link ── */}
          <p className="footer-text text-center mt-6">
            {mode === "login"
              ? (d ? "NO CLEARANCE? " : "ยังไม่มีบัญชี? ")
              : (d ? "ALREADY CLEARED? " : "มีบัญชีแล้ว? ")}
            <a
              href="#"
              className="footer-link"
              onClick={(e) => { e.preventDefault(); switchMode(mode === "login" ? "register" : "login"); }}
            >
              {mode === "login"
                ? (d ? "REQUEST ACCESS" : "สมัครสมาชิก")
                : (d ? "ACCESS TERMINAL" : "เข้าสู่ระบบ")}
            </a>
          </p>
        </div>
      </div>
    </>
  );
}
