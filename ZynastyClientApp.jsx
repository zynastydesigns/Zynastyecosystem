import React, { useState, useEffect, useRef, createContext, useContext, useCallback } from "react";
import {
  Bell, Menu, ChevronRight, MessageCircle, CalendarClock, Wallet, FolderOpen,
  Home, Layers, User, CheckCircle2, Clock, ArrowLeft, ShieldCheck, RefreshCw,
} from "lucide-react";

/* ============================================================================
   SHARED DATA LAYER
   In production this hook would call the same CRM / Studio Portal API that
   powers the internal studio dashboard (e.g. GET /api/projects/:id).
   Every screen in this app reads from ONE context, so project status,
   payments, documents and updates are never duplicated or hand-copied —
   they always reflect whatever the studio side last wrote to the CRM.
   A lightweight polling interval simulates the CRM pushing live updates.
   ============================================================================ */

const ProjectDataContext = createContext(null);

function fetchFromStudioCRM() {
  // Simulated network payload — same shape the real CRM endpoint returns.
  return {
    client: { name: "Mr. Raman", initials: "MR" },
    project: {
      id: "ZYN-2025-0142",
      name: "Raman Residence",
      type: "3 BHK Apartment",
      progress: 72,
      status: "On Track",
      currentStage: "Design Development",
      stageIndex: 5,
      totalStages: 8,
      expectedHandover: "28 Sep 2025",
      nextActivity: { title: "Designer Visit", when: "Tomorrow, 10:00 AM" },
    },
    payments: { total: 360000, paid: 240000, balance: 120000 },
    documents: 5,
    updates: [
      { id: 1, time: "10:33 AM", title: "Designer visit confirmed", body: "Confirmed for tomorrow at 10:00 AM with our lead designer.", tag: "Schedule" },
      { id: 2, time: "9:12 AM", title: "Design Version 3 approved", body: "Your latest living room concept was marked approved.", tag: "Design" },
      { id: 3, time: "8:05 AM", title: "Material delivery scheduled", body: "ModuCraft confirmed delivery for the selected laminates.", tag: "Materials" },
    ],
    tasks: [
      { id: 1, title: "Approve final material palette", due: "Due tomorrow", done: false },
      { id: 2, title: "Review Design Version 3 notes", due: "Due 20 Jul 2025", done: false },
      { id: 3, title: "Clear 40% pre-installation payment", due: "Due 10 Aug 2025", done: false },
      { id: 4, title: "Site visit acknowledgement", due: "Completed", done: true },
    ],
  };
}

function ProjectDataProvider({ children }) {
  const [data, setData] = useState(null);
  const [lastSynced, setLastSynced] = useState(null);
  const [syncing, setSyncing] = useState(false);

  const sync = useCallback(() => {
    setSyncing(true);
    setTimeout(() => {
      setData(fetchFromStudioCRM());
      setLastSynced(new Date());
      setSyncing(false);
    }, 400);
  }, []);

  useEffect(() => {
    sync();
    const interval = setInterval(sync, 45000); // periodic CRM refresh
    return () => clearInterval(interval);
  }, [sync]);

  return (
    <ProjectDataContext.Provider value={{ data, lastSynced, syncing, refresh: sync }}>
      {children}
    </ProjectDataContext.Provider>
  );
}

function useProjectData() {
  return useContext(ProjectDataContext);
}

/* ============================================================================
   STYLE TOKENS
   ============================================================================ */

const styleSheet = `
@keyframes riseIn { from { opacity:0; transform:translateY(14px);} to {opacity:1; transform:translateY(0);} }
@keyframes fadeIn { from {opacity:0;} to {opacity:1;} }
@keyframes growBar { from {width:0%;} }
@keyframes pulseDot { 0%,100%{opacity:1;} 50%{opacity:.35;} }
@keyframes shakeX { 10%,90%{transform:translateX(-1px);} 20%,80%{transform:translateX(2px);} 30%,50%,70%{transform:translateX(-4px);} 40%,60%{transform:translateX(4px);} }
.rise { animation: riseIn .5s cubic-bezier(.16,1,.3,1) both; }
.fade { animation: fadeIn .4s ease both; }
.grow-bar { animation: growBar 1.1s cubic-bezier(.16,1,.3,1) both; }
.pulse-dot { animation: pulseDot 1.6s ease-in-out infinite; }
.shake { animation: shakeX .5s; }
.tap { transition: transform .15s ease, box-shadow .15s ease; }
.tap:active { transform: scale(0.96); }
.no-scrollbar::-webkit-scrollbar{ display:none; }
`;

const NAVY_GRADIENT = "linear-gradient(135deg, #0B2A63 0%, #133E8F 60%, #1750B4 100%)";

/* ============================================================================
   OTP LOGIN FLOW
   ============================================================================ */

function OTPLogin({ onSuccess }) {
  const [stage, setStage] = useState("phone"); // phone | otp
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [error, setError] = useState(false);
  const [timer, setTimer] = useState(30);
  const [verifying, setVerifying] = useState(false);
  const inputsRef = useRef([]);

  useEffect(() => {
    if (stage !== "otp") return;
    if (timer <= 0) return;
    const t = setTimeout(() => setTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timer, stage]);

  const sendOtp = () => {
    if (phone.replace(/\D/g, "").length < 10) {
      setError(true);
      setTimeout(() => setError(false), 500);
      return;
    }
    setStage("otp");
    setTimer(30);
    setTimeout(() => inputsRef.current[0]?.focus(), 300);
  };

  const handleOtpChange = (idx, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < 3) inputsRef.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    }
  };

  const verify = () => {
    const code = otp.join("");
    if (code.length < 4) {
      setError(true);
      setTimeout(() => setError(false), 500);
      return;
    }
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      onSuccess();
    }, 900);
  };

  return (
    <div
      className="min-h-full flex flex-col justify-between px-6 pb-8 pt-14 text-white relative overflow-hidden"
      style={{ background: NAVY_GRADIENT }}
    >
      <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/5" />
      <div className="absolute top-40 -left-20 w-48 h-48 rounded-full bg-white/5" />

      <div className="rise relative">
        <div className="tracking-[0.3em] text-2xl font-extrabold">ZYNASTY</div>
        <div className="tracking-[0.35em] text-xs font-medium text-blue-200 mt-1">DESIGN</div>
        <div className="tracking-[0.4em] text-[10px] text-blue-300 mt-0.5">CLIENT PORTAL</div>
      </div>

      <div className="relative mt-10 flex-1 flex flex-col">
        {stage === "phone" ? (
          <div key="phone" className="rise">
            <h1 className="text-2xl font-bold leading-snug">Welcome back.</h1>
            <p className="text-blue-200 text-sm mt-1.5">
              Enter your registered mobile number to receive a one-time code.
            </p>

            <div className={`mt-8 ${error ? "shake" : ""}`}>
              <label className="text-xs text-blue-200 font-medium">Mobile number</label>
              <div className="mt-2 flex items-center bg-white/10 border border-white/20 rounded-2xl px-4 py-3.5 backdrop-blur-sm">
                <span className="text-sm text-blue-100 pr-3 border-r border-white/20 mr-3">+91</span>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="98765 43210"
                  inputMode="numeric"
                  className="bg-transparent outline-none text-white placeholder-blue-300 text-base w-full tracking-wide"
                />
              </div>
            </div>

            <button
              onClick={sendOtp}
              className="tap mt-8 w-full bg-white text-[#123E8F] font-semibold py-3.5 rounded-2xl shadow-lg shadow-black/20"
            >
              Send OTP
            </button>

            <p className="text-[11px] text-blue-300 text-center mt-6 leading-relaxed">
              By continuing you agree to Zynasty Design's Terms of Service and Privacy Policy.
            </p>
          </div>
        ) : (
          <div key="otp" className="rise">
            <button
              onClick={() => setStage("phone")}
              className="tap flex items-center gap-1.5 text-blue-200 text-sm mb-6"
            >
              <ArrowLeft size={16} /> Change number
            </button>
            <h1 className="text-2xl font-bold leading-snug">Enter the code</h1>
            <p className="text-blue-200 text-sm mt-1.5">
              We've sent a 4-digit code to +91 {phone}
            </p>

            <div className={`mt-8 flex gap-3 ${error ? "shake" : ""}`}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => (inputsRef.current[i] = el)}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  inputMode="numeric"
                  maxLength={1}
                  className="w-14 h-14 text-center text-xl font-bold bg-white/10 border border-white/25 rounded-2xl outline-none focus:border-white text-white"
                />
              ))}
            </div>

            <div className="mt-5 text-sm text-blue-200">
              {timer > 0 ? (
                <span>Resend code in {timer}s</span>
              ) : (
                <button onClick={() => setTimer(30)} className="text-white font-semibold underline underline-offset-2">
                  Resend OTP
                </button>
              )}
            </div>

            <button
              onClick={verify}
              disabled={verifying}
              className="tap mt-8 w-full bg-white text-[#123E8F] font-semibold py-3.5 rounded-2xl shadow-lg shadow-black/20 flex items-center justify-center gap-2 disabled:opacity-80"
            >
              {verifying ? (
                <>
                  <RefreshCw size={16} className="animate-spin" /> Verifying…
                </>
              ) : (
                <>
                  <ShieldCheck size={16} /> Verify &amp; Continue
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================================
   REUSABLE DASHBOARD PIECES
   ============================================================================ */

function InfoCard({ icon, iconBg, label, children, action, onClick, delay = 0 }) {
  return (
    <div
      onClick={onClick}
      style={{ animationDelay: `${delay}ms` }}
      className="rise tap bg-white rounded-2xl p-4 shadow-sm shadow-blue-900/5 border border-blue-50 cursor-pointer flex flex-col justify-between min-h-[120px]"
    >
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${iconBg}`}>{icon}</div>
        <span className="text-[13px] text-slate-500 font-medium">{label}</span>
      </div>
      <div className="mt-2">{children}</div>
      {action && (
        <div className="mt-2 text-[13px] text-[#1750B4] font-semibold flex items-center gap-0.5">
          {action} <ChevronRight size={14} />
        </div>
      )}
    </div>
  );
}

function QuickAction({ icon, label, delay, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{ animationDelay: `${delay}ms` }}
      className="rise tap flex flex-col items-center gap-2 flex-1"
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-md shadow-blue-900/20"
        style={{ background: NAVY_GRADIENT }}
      >
        {icon}
      </div>
      <span className="text-xs font-medium text-slate-700 text-center">{label}</span>
    </button>
  );
}

function SyncBadge({ syncing, lastSynced }) {
  return (
    <div className="flex items-center gap-1.5 text-[11px] text-blue-200">
      <span className={`w-1.5 h-1.5 rounded-full bg-emerald-400 ${syncing ? "pulse-dot" : ""}`} />
      {syncing
        ? "Syncing with Studio Portal…"
        : lastSynced
        ? `Synced ${lastSynced.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
        : ""}
    </div>
  );
}

/* ============================================================================
   DASHBOARD (HOME)
   ============================================================================ */

function Dashboard({ onNavigate }) {
  const { data, syncing, lastSynced } = useProjectData();

  if (!data) {
    return (
      <div className="min-h-full flex items-center justify-center bg-[#F4F7FC]">
        <RefreshCw className="animate-spin text-[#1750B4]" size={28} />
      </div>
    );
  }

  const { client, project, payments, documents, updates, tasks } = data;

  return (
    <div className="min-h-full bg-[#F4F7FC] pb-28">
      {/* Header */}
      <div className="text-white px-5 pt-14 pb-8 rounded-b-[28px]" style={{ background: NAVY_GRADIENT }}>
        <div className="flex items-center justify-between fade">
          <Menu size={22} />
          <div className="text-center">
            <div className="tracking-[0.25em] text-sm font-extrabold">ZYNASTY</div>
            <div className="tracking-[0.3em] text-[8px] text-blue-200 -mt-0.5">DESIGN · CLIENT PORTAL</div>
          </div>
          <div className="relative">
            <Bell size={20} />
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">3</span>
          </div>
        </div>

        <div className="mt-6 fade" style={{ animationDelay: "80ms" }}>
          <p className="text-blue-200 text-sm">Good Morning,</p>
          <h1 className="text-2xl font-bold mt-0.5">{client.name}</h1>
          <div className="flex items-center justify-between mt-1">
            <p className="text-blue-200 text-sm">Here's your project overview</p>
            <SyncBadge syncing={syncing} lastSynced={lastSynced} />
          </div>
        </div>

        {/* Progress card */}
        <div className="rise mt-5 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4" style={{ animationDelay: "140ms" }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-200 text-xs">{project.name} · {project.id}</p>
              <p className="text-3xl font-extrabold mt-1">{project.progress}%</p>
            </div>
            <span className="bg-emerald-400/20 text-emerald-300 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> {project.status}
            </span>
          </div>
          <div className="mt-3 h-2 bg-white/15 rounded-full overflow-hidden">
            <div
              className="grow-bar h-full rounded-full bg-white"
              style={{ width: `${project.progress}%` }}
            />
          </div>
          <div className="flex items-center gap-1.5 mt-2.5 text-blue-200 text-xs">
            <CalendarClock size={13} /> Expected Handover: {project.expectedHandover}
          </div>
        </div>
      </div>

      {/* Info grid */}
      <div className="px-5 mt-5 grid grid-cols-2 gap-3.5">
        <InfoCard
          icon={<Layers size={16} className="text-[#1750B4]" />}
          iconBg="bg-blue-50"
          label="Current Stage"
          action="View Timeline"
          onClick={() => onNavigate("project")}
          delay={0}
        >
          <p className="font-semibold text-slate-800 text-sm leading-snug">{project.currentStage}</p>
          <p className="text-xs text-slate-400 mt-0.5">Stage {project.stageIndex} of {project.totalStages}</p>
        </InfoCard>

        <InfoCard
          icon={<Clock size={16} className="text-[#1750B4]" />}
          iconBg="bg-blue-50"
          label="Next Activity"
          action="View Details"
          onClick={() => onNavigate("project")}
          delay={60}
        >
          <p className="font-semibold text-slate-800 text-sm leading-snug">{project.nextActivity.title}</p>
          <p className="text-xs text-slate-400 mt-0.5">{project.nextActivity.when}</p>
        </InfoCard>

        <InfoCard
          icon={<Wallet size={16} className="text-[#1750B4]" />}
          iconBg="bg-blue-50"
          label="Payment Status"
          onClick={() => onNavigate("payments")}
          delay={120}
        >
          <p className="font-semibold text-slate-800 text-sm">₹{payments.paid.toLocaleString("en-IN")}</p>
          <p className="text-xs text-red-500 mt-0.5 font-medium">Balance ₹{payments.balance.toLocaleString("en-IN")}</p>
        </InfoCard>

        <InfoCard
          icon={<FolderOpen size={16} className="text-[#1750B4]" />}
          iconBg="bg-blue-50"
          label="Documents"
          action="View All"
          onClick={() => onNavigate("documents")}
          delay={180}
        >
          <p className="font-semibold text-slate-800 text-sm">{documents} files</p>
          <p className="text-xs text-slate-400 mt-0.5">Agreement, Invoices &amp; more</p>
        </InfoCard>
      </div>

      {/* Quick actions */}
      <div className="px-5 mt-7">
        <h2 className="text-sm font-bold text-slate-800 mb-3.5">Quick Actions</h2>
        <div className="flex justify-between gap-2">
          <QuickAction icon={<MessageCircle size={20} />} label="Chat" delay={0} onClick={() => onNavigate("chat")} />
          <QuickAction icon={<CalendarClock size={20} />} label="Book Meeting" delay={60} onClick={() => onNavigate("meeting")} />
          <QuickAction icon={<Wallet size={20} />} label="Payments" delay={120} onClick={() => onNavigate("payments")} />
          <QuickAction icon={<FolderOpen size={20} />} label="Documents" delay={180} onClick={() => onNavigate("documents")} />
        </div>
      </div>

      {/* Today's updates */}
      <div className="px-5 mt-7">
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-sm font-bold text-slate-800">Today's Project Updates</h2>
          <span className="text-[11px] text-slate-400">Live from Studio Portal</span>
        </div>
        <div className="space-y-3">
          {updates.map((u, i) => (
            <div
              key={u.id}
              style={{ animationDelay: `${i * 70}ms` }}
              className="rise tap bg-white rounded-2xl p-3.5 border border-blue-50 shadow-sm shadow-blue-900/5 flex gap-3"
            >
              <div className="w-2 h-2 rounded-full bg-[#1750B4] mt-1.5 shrink-0" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-800">{u.title}</p>
                  <span className="text-[11px] text-slate-400 shrink-0 ml-2">{u.time}</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{u.body}</p>
                <span className="inline-block mt-1.5 text-[10px] font-semibold text-[#1750B4] bg-blue-50 px-2 py-0.5 rounded-full">
                  {u.tag}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming tasks */}
      <div className="px-5 mt-7">
        <h2 className="text-sm font-bold text-slate-800 mb-3.5">Upcoming Tasks</h2>
        <div className="bg-white rounded-2xl border border-blue-50 shadow-sm shadow-blue-900/5 divide-y divide-blue-50">
          {tasks.map((t, i) => (
            <div key={t.id} style={{ animationDelay: `${i * 60}ms` }} className="rise flex items-center gap-3 p-3.5">
              <CheckCircle2
                size={20}
                className={t.done ? "text-emerald-500" : "text-slate-300"}
                fill={t.done ? "#ecfdf5" : "none"}
              />
              <div className="flex-1">
                <p className={`text-sm font-medium ${t.done ? "text-slate-400 line-through" : "text-slate-800"}`}>
                  {t.title}
                </p>
                <p className={`text-xs mt-0.5 ${t.done ? "text-emerald-500" : "text-slate-400"}`}>{t.due}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   SIMPLE PLACEHOLDER SCREENS (also fed by the same shared context)
   ============================================================================ */

function SimpleScreen({ title, onBack, children }) {
  return (
    <div className="min-h-full bg-[#F4F7FC] pb-28">
      <div className="text-white px-5 pt-14 pb-6 flex items-center gap-3 rounded-b-[28px]" style={{ background: NAVY_GRADIENT }}>
        <button onClick={onBack} className="tap"><ArrowLeft size={20} /></button>
        <h1 className="text-lg font-bold">{title}</h1>
      </div>
      <div className="px-5 mt-5 fade">{children}</div>
    </div>
  );
}

function ProjectScreen({ onBack }) {
  const { data } = useProjectData();
  if (!data) return null;
  const { project } = data;
  return (
    <SimpleScreen title="Project Timeline" onBack={onBack}>
      <div className="bg-white rounded-2xl p-4 border border-blue-50 shadow-sm">
        <p className="text-xs text-slate-400">{project.id}</p>
        <p className="font-bold text-slate-800 mt-0.5">{project.name}</p>
        <p className="text-sm text-slate-500">{project.type}</p>
        <p className="text-sm text-[#1750B4] font-semibold mt-2">Stage {project.stageIndex} of {project.totalStages} · {project.currentStage}</p>
      </div>
    </SimpleScreen>
  );
}

function PaymentsScreen({ onBack }) {
  const { data } = useProjectData();
  if (!data) return null;
  const { payments } = data;
  return (
    <SimpleScreen title="Payments" onBack={onBack}>
      <div className="bg-white rounded-2xl p-4 border border-blue-50 shadow-sm space-y-2">
        <div className="flex justify-between text-sm"><span className="text-slate-500">Total Project Value</span><span className="font-semibold">₹{payments.total.toLocaleString("en-IN")}</span></div>
        <div className="flex justify-between text-sm"><span className="text-slate-500">Paid Amount</span><span className="font-semibold text-emerald-600">₹{payments.paid.toLocaleString("en-IN")}</span></div>
        <div className="flex justify-between text-sm"><span className="text-slate-500">Balance</span><span className="font-semibold text-red-500">₹{payments.balance.toLocaleString("en-IN")}</span></div>
        <button className="tap w-full mt-2 bg-[#1750B4] text-white py-3 rounded-xl font-semibold">Pay Now</button>
      </div>
    </SimpleScreen>
  );
}

function ChatScreen({ onBack }) {
  return (
    <SimpleScreen title="Chat" onBack={onBack}>
      <div className="bg-white rounded-2xl p-4 border border-blue-50 shadow-sm text-sm text-slate-500">
        Your Zynasty Design team's conversation will appear here — synced with Studio Portal messaging.
      </div>
    </SimpleScreen>
  );
}

function ProfileScreen({ onBack }) {
  const { data } = useProjectData();
  if (!data) return null;
  return (
    <SimpleScreen title="Profile" onBack={onBack}>
      <div className="bg-white rounded-2xl p-4 border border-blue-50 shadow-sm flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-[#1750B4] text-white flex items-center justify-center font-bold">
          {data.client.initials}
        </div>
        <div>
          <p className="font-semibold text-slate-800">{data.client.name}</p>
          <p className="text-xs text-slate-400">{data.project.id}</p>
        </div>
      </div>
    </SimpleScreen>
  );
}

function DocumentsScreen({ onBack }) {
  const { data } = useProjectData();
  if (!data) return null;
  const docs = ["Agreement", "Quotation", "Invoices", "Warranty"];
  return (
    <SimpleScreen title="Documents" onBack={onBack}>
      <div className="bg-white rounded-2xl border border-blue-50 shadow-sm divide-y divide-blue-50">
        {docs.map((d) => (
          <div key={d} className="p-3.5 flex items-center justify-between text-sm">
            <span className="text-slate-700 font-medium">{d}</span>
            <ChevronRight size={16} className="text-slate-300" />
          </div>
        ))}
      </div>
    </SimpleScreen>
  );
}

function MeetingScreen({ onBack }) {
  return (
    <SimpleScreen title="Book Meeting" onBack={onBack}>
      <div className="bg-white rounded-2xl p-4 border border-blue-50 shadow-sm text-sm text-slate-500">
        Request a call or in-person visit with your designer — slots sync from the Studio Portal calendar.
      </div>
    </SimpleScreen>
  );
}

/* ============================================================================
   BOTTOM NAVIGATION
   ============================================================================ */

function BottomNav({ active, onNavigate }) {
  const items = [
    { key: "home", icon: Home, label: "Home" },
    { key: "project", icon: Layers, label: "Project" },
    { key: "chat", icon: MessageCircle, label: "Chat" },
    { key: "payments", icon: Wallet, label: "Payments" },
    { key: "profile", icon: User, label: "Profile" },
  ];
  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-blue-50 px-2 pt-2 pb-safe shadow-[0_-4px_20px_rgba(11,42,99,0.06)]">
      <div className="flex items-stretch justify-between px-2 pb-2">
        {items.map(({ key, icon: Icon, label }) => {
          const isActive = active === key;
          return (
            <button
              key={key}
              onClick={() => onNavigate(key)}
              className="tap flex flex-col items-center gap-1 flex-1 py-1"
            >
              <Icon size={20} className={isActive ? "text-[#1750B4]" : "text-slate-400"} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-[10px] font-medium ${isActive ? "text-[#1750B4]" : "text-slate-400"}`}>{label}</span>
              {isActive && <span className="w-1 h-1 rounded-full bg-[#1750B4] mt-0.5" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================================
   ROOT APP
   ============================================================================ */

export default function ZynastyClientApp() {
  const [authed, setAuthed] = useState(false);
  const [screen, setScreen] = useState("home");

  const renderScreen = () => {
    switch (screen) {
      case "project":
        return <ProjectScreen onBack={() => setScreen("home")} />;
      case "payments":
        return <PaymentsScreen onBack={() => setScreen("home")} />;
      case "chat":
        return <ChatScreen onBack={() => setScreen("home")} />;
      case "profile":
        return <ProfileScreen onBack={() => setScreen("home")} />;
      case "documents":
        return <DocumentsScreen onBack={() => setScreen("home")} />;
      case "meeting":
        return <MeetingScreen onBack={() => setScreen("home")} />;
      default:
        return <Dashboard onNavigate={setScreen} />;
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-200 flex items-center justify-center font-sans">
      <style>{styleSheet}</style>
      <div className="w-full max-w-md h-[844px] bg-white relative overflow-hidden shadow-2xl sm:rounded-[36px] sm:my-4">
        <div className="w-full h-full overflow-y-auto no-scrollbar relative">
          {!authed ? (
            <OTPLogin onSuccess={() => setAuthed(true)} />
          ) : (
            <>
              {renderScreen()}
              <BottomNav active={screen === "home" ? "home" : screen} onNavigate={setScreen} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
