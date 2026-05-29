import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useScrollLock } from "../../hooks/useScrollLock";
import { toast as hotToast } from "react-hot-toast";
import {
  User, Lock, Save, Camera, Check, ChevronRight, Mail, ChevronDown,
  Users, Plus, Trash2, Edit2, Bot, X, Loader2, Download, Inbox,
  UserPlus, BellRing, FolderKanban, Eye, Key, EyeOff,
  Briefcase, Shield, Database, AlertTriangle, Pencil,
  Settings as SettingsIcon, Activity, ArrowRight,
} from "lucide-react";
import { BASE_URL } from "../../constants/config";
import { getAuthHeaders } from "../../utils/auth";
import openaiLogo from "../../assets/openai_logo.png";
import geminiLogo from "../../assets/gemini_logo.png";
import grokLogo from "../../assets/grok_logo.png";
import anthropicLogo from "../../assets/anthropic_logo.png";
import mistralLogo from "../../assets/mistral_logo.png";
import deepseekLogo from "../../assets/deepseek_logo.png";
import llamaLogo from "../../assets/llama_logo.png";
import groqLogo from "../../assets/groq_logo.png";

const TABS = [
  { id: "profile",  label: "My Profile",   icon: User,     desc: "Personal info & avatar"   },
  { id: "security", label: "Security",      icon: Shield,   desc: "Password & sessions"      },
  { id: "ai",       label: "AI Settings",   icon: Bot,      desc: "Configure AI models"      },
  { id: "team",     label: "Admins",        icon: Users,    desc: "Manage team members"      },
  { id: "export",   label: "Data Export",   icon: Database, desc: "Download CRM data"        },
];

// ─── CustomDropdown ────────────────────────────────────────────────────────────
const CustomDropdown = ({ label, value, options, field, icon: Icon, onChange, activeDropdown, setActiveDropdown }) => {
  const buttonRef = useRef(null);
  const [dropdownStyles, setDropdownStyles] = useState({});

  const updatePos = () => {
    if (!buttonRef.current) return;
    const r = buttonRef.current.getBoundingClientRect();
    const menuW = r.width;
    const vw = window.innerWidth;
    let left = r.left;
    if (left + menuW > vw - 8) left = vw - menuW - 8;
    setDropdownStyles({ position: "fixed", bottom: `${window.innerHeight - r.top + 6}px`, left: `${Math.max(8, left)}px`, width: `${menuW}px`, zIndex: 100001 });
  };

  useEffect(() => {
    if (activeDropdown === field) {
      updatePos();
      window.addEventListener("scroll", updatePos, true);
      window.addEventListener("resize", updatePos);
    }
    return () => {
      window.removeEventListener("scroll", updatePos, true);
      window.removeEventListener("resize", updatePos);
    };
  }, [activeDropdown, field]);

  const isOpen = activeDropdown === field;

  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">{label}</label>
      <button
        ref={buttonRef} type="button"
        onClick={() => setActiveDropdown(isOpen ? null : field)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:border-[#18254D]/30 transition-all text-sm font-semibold text-[#18254D] shadow-sm"
      >
        <div className="flex items-center gap-2 min-w-0">
          {Icon && <Icon size={14} className="text-slate-400 shrink-0" />}
          <span className="truncate">
            {options.find(o => (typeof o === "string" ? o : o.value) === value)?.label ||
              (typeof options[0] === "string" ? value : options.find(o => o.value === value)?.label || value)}
          </span>
        </div>
        <ChevronDown size={14} className={`text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && createPortal(
        <>
          <div className="fixed inset-0 z-[100000]" onClick={() => setActiveDropdown(null)} />
          <div style={dropdownStyles} className="bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden z-[100001] animate-pop origin-bottom max-h-[260px] overflow-y-auto">
            <div className="bg-[#18254D] px-4 py-2 sticky top-0 z-10">
              <p className="text-[10px] font-bold text-white/50 tracking-wider uppercase">Select {label}</p>
            </div>
            {options.map(opt => {
              const v = typeof opt === "string" ? opt : opt.value;
              const l = typeof opt === "string" ? opt : opt.label;
              return (
                <button key={v} type="button"
                  onClick={() => { onChange(v); setActiveDropdown(null); }}
                  className={`w-full text-left px-4 py-2.5 text-xs font-semibold tracking-wider transition-colors flex items-center justify-between gap-2 ${v === value ? "bg-slate-100 text-indigo-600" : "text-[#18254D] hover:bg-slate-50"}`}
                >
                  <span className="truncate">{l}</span>
                  {v === value && <Check size={12} className="text-indigo-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        </>,
        document.body,
      )}
    </div>
  );
};

// ─── Reusable helpers ──────────────────────────────────────────────────────────
const SectionHeading = ({ label }) => (
  <div className="flex items-center gap-2">
    <div className="h-[2px] w-5 bg-indigo-500 rounded-full shrink-0" />
    <h4 className="text-[11px] font-black text-[#18254D] tracking-widest uppercase whitespace-nowrap">{label}</h4>
    <div className="h-[2px] flex-1 bg-slate-100 rounded-full" />
  </div>
);

const FieldLabel = ({ children, required }) => (
  <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">
    {children}{required && <span className="text-rose-500 ml-0.5">*</span>}
  </label>
);

const InputField = ({ label, required, ...props }) => (
  <div className="space-y-1.5">
    {label && <FieldLabel required={required}>{label}</FieldLabel>}
    <input
      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all"
      {...props}
    />
  </div>
);

const SubmitButton = ({ loading, loadingText, children, disabled, className = "", ...props }) => (
  <button type="button" disabled={loading || disabled}
    className={`min-h-[44px] bg-[#18254D] text-white rounded-xl text-xs font-bold tracking-wider shadow-lg active:scale-[0.97] transition-all hover:bg-[#1e2e5e] flex items-center justify-center gap-2 disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none disabled:cursor-not-allowed ${className || "w-full h-11"}`}
    {...props}
  >
    {loading
      ? <><span>{loadingText || "SAVING..."}</span><Loader2 size={16} className="animate-spin" /></>
      : children}
  </button>
);

const ActionBtn = ({ onClick, variant = "edit", title, children }) => {
  const styles = variant === "edit"
    ? "bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100"
    : "bg-[#FEF2F2] border-[#FECACA] text-[#EF4444] hover:border-[#FCA5A5]";
  return (
    <button onClick={onClick} title={title}
      className={`w-[34px] h-[34px] flex items-center justify-center border rounded-[10px] transition-all active:scale-90 shadow-sm relative group/ab ${styles}`}
    >
      {children}
      <span className="absolute bottom-[calc(100%+6px)] left-1/2 -translate-x-1/2 opacity-0 group-hover/ab:opacity-100 transition-opacity bg-[#18254D] text-white text-[10px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap pointer-events-none z-[100] shadow-md">
        {title}
      </span>
    </button>
  );
};

const ModalShell = ({ title, subtitle, icon: Icon, onClose, children, footer }) =>
  createPortal(
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[99999] flex items-center justify-center p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative z-10 bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] animate-pop overflow-hidden">
        <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0 rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#EFF6FF] text-[#3B82F6] rounded-xl flex items-center justify-center border border-[#DBEAFE] shadow-sm shrink-0">
              <Icon size={15} />
            </div>
            <div className="min-w-0">
              <h3 className="text-[15px] font-bold text-[#18254D] tracking-tight leading-none">{title}</h3>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-0.5">{subtitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-xl text-slate-400 transition-all shrink-0 ml-2">
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-5 sm:p-6 space-y-4 overflow-y-auto flex-1">{children}</div>
        {footer && (
          <div className="px-5 py-4 sm:px-6 sm:py-5 border-t border-slate-100 bg-slate-50/50 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );

// ─── Provider map ──────────────────────────────────────────────────────────────
const PROVIDER_MAP = {
  openai:    { label: "OpenAI",        color: "bg-emerald-100 text-emerald-700", logo: openaiLogo    },
  gemini:    { label: "Gemini",        color: "bg-blue-100 text-blue-700",       logo: geminiLogo    },
  grok:      { label: "xAI Grok",      color: "bg-orange-100 text-orange-700",   logo: grokLogo      },
  anthropic: { label: "Anthropic",     color: "bg-amber-100 text-amber-700",     logo: anthropicLogo },
  mistral:   { label: "Mistral",       color: "bg-cyan-100 text-cyan-700",       logo: mistralLogo   },
  deepseek:  { label: "DeepSeek",      color: "bg-indigo-100 text-indigo-700",   logo: deepseekLogo  },
  llama:     { label: "Llama (Groq)",  color: "bg-orange-100 text-orange-800",   logo: llamaLogo     },
  groq:      { label: "Groq",          color: "bg-orange-50 text-orange-600",    logo: groqLogo      },
  other:     { label: "Other",         color: "bg-slate-100 text-slate-700",     logo: null          },
};

const AI_PROVIDERS = [
  { value: "openai",    label: "OpenAI (ChatGPT)"      },
  { value: "gemini",    label: "Google Gemini"          },
  { value: "grok",      label: "xAI (Grok)"             },
  { value: "anthropic", label: "Anthropic (Claude)"     },
  { value: "mistral",   label: "Mistral AI"             },
  { value: "deepseek",  label: "DeepSeek"               },
  { value: "llama",     label: "Meta Llama (Groq)"      },
  { value: "groq",      label: "Groq (Ultra Fast)"      },
  { value: "other",     label: "Other"                  },
];

// ══════════════════════════════════════════════════════════════════════════════
const Settings = ({ aiModels = [], onAddAiModel, onUpdateAiModel, onDeleteAiModel }) => {
  const [activeTab, setActiveTab]           = useState("profile");
  const [isSubmitting, setIsSubmitting]     = useState(false);
  const [exportingType, setExportingType]   = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);

  const [profile, setProfile]               = useState(JSON.parse(localStorage.getItem("user")) || null);
  const [isProfileEditing, setIsProfileEditing] = useState(false);
  const [isProfileSaved, setIsProfileSaved] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState(null);

  const [showAddModelModal, setShowAddModelModal]   = useState(false);
  const [newModel, setNewModel]                     = useState({ name: "", provider: "openai", modelId: "", apiKey: "" });
  const [editingModelId, setEditingModelId]         = useState(null);
  const [editModelData, setEditModelData]           = useState({});

  const [admins, setAdmins]                 = useState([]);
  const [loadingAdmins, setLoadingAdmins]   = useState(false);
  const [adminToDelete, setAdminToDelete]   = useState(null);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [showAddAdminPwd, setShowAddAdminPwd]     = useState(false);
  const [newAdmin, setNewAdmin]             = useState({ name: "", email: "", password: "", role: "Admin", status: "Active" });
  const [editingAdminId, setEditingAdminId] = useState(null);
  const [editAdminData, setEditAdminData]   = useState({ name: "", email: "", role: "Admin", status: "Active" });
  const [addAdminErrors, setAddAdminErrors] = useState({});

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData]     = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showPwd, setShowPwd]               = useState({ current: false, new: false, confirm: false });

  const [showFollowupModal, setShowFollowupModal] = useState(false);

  useScrollLock(showFollowupModal || showAddModelModal || !!editingModelId || showAddAdminModal || !!editingAdminId || showPasswordForm || !!adminToDelete);

  useEffect(() => { if (activeTab === "team") fetchAdmins(); }, [activeTab]);

  const toast = (msg, type = "success") => type === "success" ? hotToast.success(msg) : hotToast.error(msg);

  const getImageUrl = (p) => {
    if (!p) return null;
    if (p.startsWith("http") || p.startsWith("data:")) return p;
    return p.startsWith("/") ? BASE_URL + p : BASE_URL + "/" + p;
  };

  const fetchAdmins = async () => {
    setLoadingAdmins(true);
    try {
      const u = JSON.parse(localStorage.getItem("user"));
      const ex = u?.uuid || u?.admin_id;
      const res = await fetch(`${BASE_URL}/api/admin-users${ex ? `?excludeUuid=${ex}` : ""}`, { headers: getAuthHeaders() });
      if (res.ok) { const d = await res.json(); setAdmins(d.users || []); }
    } catch (e) { console.error(e); } finally { setLoadingAdmins(false); }
  };

  const handleProfileSave = async () => {
    setIsSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("full_name", profile.full_name || "");
      fd.append("role", profile.role || "");
      fd.append("email", profile.email || "");
      fd.append("status", profile.status ?? 1);
      if (selectedImageFile) fd.append("image", selectedImageFile);
      const userId = profile.uuid || profile.admin_id;
      const res = await fetch(`${BASE_URL}/api/admin-users/update/${userId}`, {
        method: "POST", headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }, body: fd,
      });
      const ct = res.headers.get("content-type");
      const data = ct?.includes("application/json") ? await res.json() : null;
      if (!data) { toast(`Server error: ${res.status}`, "error"); return; }
      if (res.ok) {
        const up = { ...profile, image: data.image || profile.image };
        setProfile(up); localStorage.setItem("user", JSON.stringify(up));
        setSelectedImageFile(null); setIsProfileEditing(false);
        setIsProfileSaved(true); setTimeout(() => setIsProfileSaved(false), 3000);
        toast("Profile updated successfully");
      } else { toast(data.message || "Failed to update profile", "error"); }
    } catch { toast("Server error while updating profile.", "error"); }
    finally { setIsSubmitting(false); }
  };

  const handleUpdatePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) { toast("Passwords do not match", "error"); return; }
    const errs = [];
    if (passwordData.newPassword.length < 8) errs.push("8+ characters");
    if (!/[A-Z]/.test(passwordData.newPassword)) errs.push("uppercase letter");
    if (!/[0-9]/.test(passwordData.newPassword)) errs.push("number");
    if (!/[!@#$%^&*]/.test(passwordData.newPassword)) errs.push("special character");
    if (errs.length) { toast(`Password needs: ${errs.join(", ")}`, "error"); return; }
    setIsSubmitting(true);
    try {
      const uid = profile?.uuid || profile?.admin_id;
      const res = await fetch(`${BASE_URL}/api/admin-users/update-password/${uid}`, {
        method: "POST", headers: getAuthHeaders(),
        body: JSON.stringify({ currentPassword: passwordData.currentPassword, newPassword: passwordData.newPassword }),
      });
      const data = await res.json();
      if (res.ok) { toast("Password updated successfully"); setShowPasswordForm(false); setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" }); }
      else { toast(data.message || "Failed to update password", "error"); }
    } catch { toast("Server error.", "error"); } finally { setIsSubmitting(false); }
  };

  const validateAddAdmin = () => {
    const e = {};
    if (!newAdmin.name.trim() || newAdmin.name.trim().length < 2) e.name = "Name must be at least 2 characters";
    if (!newAdmin.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newAdmin.email)) e.email = "Valid email required";
    if (!newAdmin.password || newAdmin.password.length < 8) e.password = "Password must be at least 8 characters";
    setAddAdminErrors(e); return Object.keys(e).length === 0;
  };

  const handleAddAdmin = async () => {
    if (!validateAddAdmin()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`${BASE_URL}/api/admin-users`, {
        method: "POST", headers: getAuthHeaders(),
        body: JSON.stringify({ full_name: newAdmin.name, email: newAdmin.email, password: newAdmin.password, role: newAdmin.role }),
      });
      const data = await res.json();
      if (res.ok) {
        setNewAdmin({ name: "", email: "", password: "", role: "Admin", status: "Active" });
        setShowAddAdminModal(false); toast("Admin created successfully!"); fetchAdmins();
      } else { toast(data.message || "Failed to create admin", "error"); }
    } catch { toast("Server error.", "error"); } finally { setIsSubmitting(false); }
  };

  const handleDeleteAdmin = async (id) => {
    try {
      const res = await fetch(`${BASE_URL}/api/admin-users/${id}`, { method: "DELETE", headers: getAuthHeaders() });
      const data = await res.json();
      if (res.ok) { setAdmins(a => a.filter(x => x.id !== id)); toast("User deleted successfully"); }
      else { toast(data.message || "Failed to delete", "error"); }
    } catch { toast("Server error.", "error"); }
    setAdminToDelete(null);
  };

  const handleSaveEditAdmin = async (id) => {
    if (!editAdminData.name || !editAdminData.email) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`${BASE_URL}/api/admin-users/update/${id}`, {
        method: "POST", headers: getAuthHeaders(),
        body: JSON.stringify({ full_name: editAdminData.name, email: editAdminData.email, role: editAdminData.role, status: editAdminData.status === "Active" ? 1 : 0 }),
      });
      const data = await res.json();
      if (res.ok) {
        setAdmins(a => a.map(x => x.id === id ? { ...x, ...editAdminData } : x));
        setEditingAdminId(null); toast("Admin updated successfully");
      } else { toast(data.message || "Failed to update", "error"); }
    } catch { toast("Server error.", "error"); } finally { setIsSubmitting(false); }
  };

  const handleExport = async (exportType, filename) => {
    setExportingType(exportType);
    try {
      const res = await fetch(`${BASE_URL}/api/export/${exportType}`, { headers: getAuthHeaders() });
      if (res.status === 404) { hotToast.error("Empty records"); return; }
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
        const labels = { enquiries: "Enquiries", leads: "Leads", followups: "Follow-ups", clients: "Clients", projects: "Projects" };
        hotToast.success(`${labels[exportType.split("?")[0]] || "File"} Downloaded!`);
      } else { hotToast.error(`Failed to export`); }
    } catch { hotToast.error(`Error downloading ${filename}`); } finally { setExportingType(null); }
  };

  const activeTabInfo = TABS.find(t => t.id === activeTab);

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="w-full min-h-screen relative">
      <div className="space-y-4 sm:space-y-5 lg:space-y-6 animate-fade-in">

        {/* ── Page Header ─────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Banner */}
          <div className="h-24 sm:h-32 w-full bg-gradient-to-r from-[#18254D] via-[#24376b] to-[#1a2952] relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_120%,rgba(99,102,241,0.3),transparent_70%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:20px_20px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,#000_70%,transparent_100%)]" />
            <div className="absolute bottom-4 left-6 sm:left-8 flex items-end gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Settings</h2>
                <p className="text-white/50 text-xs font-medium mt-0.5">Manage your profile, security, AI models & team</p>
              </div>
            </div>
            {/* Right decorative badge */}
            <div className="absolute top-4 right-6 flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1.5">
              <SettingsIcon size={12} className="text-white/70" />
              <span className="text-white/70 text-[10px] font-bold tracking-wider uppercase">System Settings</span>
            </div>
          </div>

          {/* Stat cards row */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-px bg-slate-100">
            {[
              { label: "Team Members",   value: admins.length,   icon: Users,    color: "bg-blue-50 text-blue-500",      bg: "bg-blue-500"    },
              { label: "AI Models",      value: aiModels.length, icon: Bot,      color: "bg-violet-50 text-violet-500",  bg: "bg-violet-500"  },
              { label: "Active Sessions",value: 1,               icon: Activity, color: "bg-emerald-50 text-emerald-500",bg: "bg-emerald-500" },
              { label: "Export Formats", value: 5,               icon: Database, color: "bg-amber-50 text-amber-500",   bg: "bg-amber-500"   },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white px-5 py-4 flex items-center gap-3 hover:bg-slate-50/50 transition-colors">
                <div className={`p-2.5 rounded-xl ${color} shrink-0`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider truncate">{label}</p>
                  <p className="text-xl font-bold text-[#18254D] leading-none mt-0.5">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Main Layout: Sidebar + Content ──────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-5 lg:gap-6">

          {/* ── Left Sidebar Nav ─────────────────────────────────────────────── */}
          <div className="w-full lg:w-56 xl:w-64 shrink-0">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Navigation</p>
              </div>
              <nav className="p-2 space-y-0.5">
                {TABS.map(({ id, label, icon: Icon, desc }) => {
                  const active = activeTab === id;
                  return (
                    <button key={id} onClick={() => setActiveTab(id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all group
                        ${active
                          ? "bg-[#18254D] text-white shadow-sm"
                          : "text-slate-600 hover:bg-slate-50 hover:text-[#18254D]"
                        }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors
                        ${active ? "bg-white/15" : "bg-slate-100 group-hover:bg-[#18254D]/5"}`}>
                        <Icon size={15} className={active ? "text-white" : "text-slate-500 group-hover:text-[#18254D]"} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-[13px] font-bold leading-tight ${active ? "text-white" : "text-[#18254D]"}`}>{label}</p>
                        <p className={`text-[10px] font-medium truncate mt-0.5 ${active ? "text-white/50" : "text-slate-400"}`}>{desc}</p>
                      </div>
                      {active && <ChevronRight size={14} className="text-white/50 shrink-0" />}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* ── Right Content ─────────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

              {/* Content Header */}
              <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-100 bg-slate-50/30 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  activeTab === "profile"  ? "bg-blue-50 text-blue-600 border border-blue-100" :
                  activeTab === "security" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                  activeTab === "ai"       ? "bg-violet-50 text-violet-600 border border-violet-100" :
                  activeTab === "team"     ? "bg-amber-50 text-amber-600 border border-amber-100" :
                  "bg-slate-50 text-slate-600 border border-slate-200"
                }`}>
                  {activeTabInfo && <activeTabInfo.icon size={16} />}
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-[#18254D]">{activeTabInfo?.label}</h3>
                  <p className="text-[11px] text-slate-400 font-medium">{activeTabInfo?.desc}</p>
                </div>
              </div>

              {/* ━━━ PROFILE ━━━ */}
              {activeTab === "profile" && (
                <div className="space-y-0">
                  {/* Avatar overlap section */}
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 p-5 sm:p-6 border-b border-slate-100">
                    <label htmlFor="pfp-upload" className={`group relative shrink-0 block ${isProfileEditing ? "cursor-pointer" : "cursor-default"}`}>
                      <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white p-1 shadow-md border border-slate-200">
                        {profile?.image ? (
                          <img src={getImageUrl(profile.image)} alt="Profile" className="w-full h-full rounded-xl object-cover"
                            onError={e => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
                          />
                        ) : null}
                        <div className={`w-full h-full rounded-xl bg-[#EFF6FF] items-center justify-center border border-[#DBEAFE] shadow-inner ${profile?.image ? "hidden" : "flex"}`}>
                          <span className="text-2xl sm:text-3xl font-black text-[#3B82F6]">{profile?.full_name?.charAt(0).toUpperCase() || "U"}</span>
                        </div>
                        {isProfileEditing && (
                          <div className="absolute inset-1 bg-black/45 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                            <Camera className="text-white" size={20} />
                          </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow animate-pulse" />
                      </div>
                    </label>
                    <input type="file" id="pfp-upload" accept="image/*" className="hidden" disabled={!isProfileEditing}
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setSelectedImageFile(file);
                          const r = new FileReader();
                          r.onloadend = () => setProfile(p => ({ ...p, image: r.result }));
                          r.readAsDataURL(file);
                        }
                      }}
                    />
                    <div className="flex-1 min-w-0 text-center sm:text-left">
                      <h3 className="text-lg sm:text-xl font-bold text-[#18254D] flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                        {profile?.full_name}
                        {isProfileEditing && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-full text-[9px] font-extrabold uppercase tracking-wider animate-pulse">Editing</span>
                        )}
                      </h3>
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE] rounded-full text-[10px] font-extrabold uppercase tracking-wider">{profile?.role || "User"}</span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 text-slate-500 border border-slate-200 rounded-full text-[10px] font-bold">
                          <Mail size={10} />{profile?.email}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full text-[10px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />Active
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (isProfileEditing) { setProfile(JSON.parse(localStorage.getItem("user"))); setSelectedImageFile(null); }
                        setIsProfileEditing(!isProfileEditing);
                      }}
                      className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold tracking-wider transition-all border active:scale-95
                        ${isProfileEditing ? "bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100" : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"}`}
                    >
                      {isProfileEditing ? <X size={12} /> : <Pencil size={12} />}
                      <span>{isProfileEditing ? "CANCEL" : "EDIT PROFILE"}</span>
                    </button>
                  </div>

                  {/* Form Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 p-5 sm:p-6">
                    <div className="lg:col-span-2 space-y-4">
                      <div className="bg-slate-50/50 p-4 sm:p-5 rounded-2xl border border-slate-100 space-y-4">
                        <h4 className="text-xs font-bold text-[#18254D] uppercase tracking-wider">Personal Details</h4>
                        {/* Full Name */}
                        <div className="space-y-1.5">
                          <FieldLabel required={isProfileEditing}>Full Name</FieldLabel>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                              <User className={`h-4 w-4 ${isProfileEditing ? "text-[#2563EB]" : "text-slate-400"}`} />
                            </div>
                            <input type="text" value={profile?.full_name || ""} onChange={e => setProfile({ ...profile, full_name: e.target.value })}
                              disabled={!isProfileEditing} placeholder="Enter full name"
                              className={`w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm font-semibold outline-none transition-all
                                ${isProfileEditing ? "bg-white border-slate-200 text-[#18254D] focus:border-[#2563EB]/40 focus:ring-4 focus:ring-[#2563EB]/5 shadow-sm" : "bg-slate-50 border-slate-200/60 text-slate-500 cursor-not-allowed"}`}
                            />
                          </div>
                        </div>
                        {/* Designation */}
                        <div className="space-y-1.5">
                          <FieldLabel>Designation</FieldLabel>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><Briefcase className="h-4 w-4 text-slate-400" /></div>
                            <input type="text" value={profile?.role || ""} disabled className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-sm font-semibold text-slate-500 cursor-not-allowed" />
                          </div>
                        </div>
                        {/* Email */}
                        <div className="space-y-1.5">
                          <FieldLabel>Email Address</FieldLabel>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><Mail className="h-4 w-4 text-slate-400" /></div>
                            <input type="email" value={profile?.email || ""} readOnly className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-sm font-semibold text-slate-500 cursor-not-allowed" />
                          </div>
                        </div>
                      </div>
                      {isProfileEditing && (
                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                          <SubmitButton className="w-full sm:w-auto px-8 h-12" loading={isSubmitting} loadingText="SAVING..." onClick={handleProfileSave}>
                            <Save size={15} strokeWidth={2.5} /><span>SAVE CHANGES</span>
                          </SubmitButton>
                          <button type="button"
                            onClick={() => { setProfile(JSON.parse(localStorage.getItem("user"))); setSelectedImageFile(null); setIsProfileEditing(false); }}
                            className="w-full sm:w-auto px-8 h-12 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold tracking-wider hover:bg-slate-200 transition-all active:scale-[0.97] uppercase flex items-center justify-center gap-2 border border-slate-200"
                          >Cancel</button>
                        </div>
                      )}
                    </div>
                    <div className="space-y-3">
                      <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 space-y-3">
                        <h4 className="text-xs font-bold text-[#18254D] uppercase tracking-wider">Account Status</h4>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                          </div>
                          <div>
                            <p className="text-xs font-extrabold text-[#18254D]">Active & Verified</p>
                            <p className="text-[10px] text-slate-400 font-semibold uppercase">Status Indicator</p>
                          </div>
                        </div>
                        <div className="p-3 bg-white rounded-xl border border-slate-100 space-y-1.5">
                          <div className="flex justify-between text-[11px] font-semibold text-slate-400">
                            <span>Account Level</span>
                            <span className="text-[#18254D] font-bold">Administrator</span>
                          </div>
                          <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full w-full bg-[#18254D] rounded-full" />
                          </div>
                        </div>
                      </div>
                      <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 space-y-3">
                        <h4 className="text-xs font-bold text-[#18254D] uppercase tracking-wider">Security Info</h4>
                        <div className="space-y-2.5">
                          <div className="flex items-start gap-2 text-[11px] font-semibold text-slate-500">
                            <Shield size={13} className="text-emerald-500 mt-0.5 shrink-0" />
                            <span>Sessions secured with JWT encryption.</span>
                          </div>
                          <div className="flex items-start gap-2 text-[11px] font-semibold text-slate-500">
                            <Lock size={13} className="text-indigo-500 mt-0.5 shrink-0" />
                            <span>Password requirements enforced for all admins.</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ━━━ SECURITY ━━━ */}
              {activeTab === "security" && (
                <div className="p-5 sm:p-6 space-y-5">
                  <SectionHeading label="Password Management" />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { icon: Key,   color: "bg-blue-50 text-blue-600 border-blue-100",      title: "Strong Password", desc: "8+ chars, mixed case, numbers & symbols" },
                      { icon: Check, color: "bg-emerald-50 text-emerald-600 border-emerald-100", title: "Regular Updates", desc: "Change every 3–6 months for better security" },
                      { icon: Eye,   color: "bg-amber-50 text-amber-600 border-amber-100",    title: "Stay Private",    desc: "Never share your password or reuse it" },
                    ].map(({ icon: Ic, color, title, desc }) => (
                      <div key={title} className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${color}`}><Ic size={16} /></div>
                        <div>
                          <p className="text-[12px] font-bold text-[#18254D]">{title}</p>
                          <p className="text-[11px] text-slate-400 font-medium mt-0.5 leading-relaxed">{desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <SubmitButton className="w-full sm:w-auto px-6" onClick={() => setShowPasswordForm(true)}>
                    <Lock size={14} strokeWidth={2.5} /><span>UPDATE PASSWORD</span>
                  </SubmitButton>
                </div>
              )}

              {/* ━━━ AI SETTINGS ━━━ */}
              {activeTab === "ai" && (
                <div className="p-5 sm:p-6 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <SectionHeading label={`AI Models (${aiModels.length})`} />
                    <button onClick={() => setShowAddModelModal(true)}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-[#18254D] text-white rounded-xl hover:bg-slate-800 transition-all text-[12px] font-bold tracking-wider shadow-sm active:scale-95 group shrink-0">
                      <Plus size={14} strokeWidth={2.5} className="group-hover:rotate-90 transition-transform" />Add AI Model
                    </button>
                  </div>

                  {aiModels.length === 0 ? (
                    <div className="text-center py-16 sm:py-20 border border-dashed border-slate-200 rounded-2xl">
                      <Bot size={32} strokeWidth={1.5} className="text-slate-300 mx-auto mb-3" />
                      <p className="text-[13px] font-bold text-[#18254D]">No AI Models Configured</p>
                      <p className="text-[11px] text-slate-400 mt-1">Add a model above to get started</p>
                    </div>
                  ) : (
                    <>
                      {/* Desktop table */}
                      <div className="hidden sm:block border border-slate-200 rounded-2xl overflow-hidden">
                        <div className="grid grid-cols-[1fr_120px_1fr_100px] gap-3 px-5 py-3 bg-slate-50/50 border-b border-slate-200">
                          {["Model", "Provider", "Model ID", "Actions"].map((h, i) => (
                            <div key={h} className={`text-[10px] font-bold text-slate-400 uppercase tracking-wider ${i === 3 ? "text-right" : ""}`}>{h}</div>
                          ))}
                        </div>
                        {aiModels.map((model, idx) => {
                          const prov = PROVIDER_MAP[model.provider] || PROVIDER_MAP.other;
                          return (
                            <div key={model.aimodel_id} className={`grid grid-cols-[1fr_120px_1fr_100px] gap-3 px-5 py-3.5 items-center hover:bg-slate-50/50 transition-colors ${idx < aiModels.length - 1 ? "border-b border-slate-100" : ""}`}>
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                                  {prov.logo ? <img src={prov.logo} alt="" className="w-5 h-5 object-contain opacity-80" /> : <Bot size={14} className="text-slate-400" />}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[13px] font-bold text-[#18254D] truncate">{model.name}</p>
                                  {!!model.isDefault && <span className="text-[9px] px-1.5 py-0.5 bg-[#18254D] text-white rounded-full font-bold">DEFAULT</span>}
                                </div>
                              </div>
                              <div>
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${prov.color}`}>{prov.label}</span>
                              </div>
                              <div>
                                <span className="text-[11px] font-mono font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg">{model.modelId}</span>
                              </div>
                              <div className="flex justify-end gap-1.5">
                                <ActionBtn variant="edit" title="Edit" onClick={() => { setEditingModelId(model.aimodel_id); setEditModelData({ ...model }); }}>
                                  <Pencil size={13} />
                                </ActionBtn>
                                {!model.isDefault && (
                                  <ActionBtn variant="delete" title="Delete" onClick={() => onDeleteAiModel(model.aimodel_id)}>
                                    <Trash2 size={13} />
                                  </ActionBtn>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {/* Mobile cards */}
                      <div className="sm:hidden space-y-3">
                        {aiModels.map(model => {
                          const prov = PROVIDER_MAP[model.provider] || PROVIDER_MAP.other;
                          return (
                            <div key={model.aimodel_id} className="bg-slate-50 rounded-2xl border border-slate-100 p-4">
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center border border-slate-200 shrink-0">
                                    {prov.logo ? <img src={prov.logo} alt="" className="w-6 h-6 object-contain opacity-80" /> : <Bot size={16} className="text-slate-400" />}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-[13px] font-bold text-[#18254D] truncate">{model.name}</p>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold ${prov.color}`}>{prov.label}</span>
                                  </div>
                                </div>
                                <div className="flex gap-1.5 shrink-0">
                                  <ActionBtn variant="edit" title="Edit" onClick={() => { setEditingModelId(model.aimodel_id); setEditModelData({ ...model }); }}><Pencil size={13} /></ActionBtn>
                                  {!model.isDefault && <ActionBtn variant="delete" title="Delete" onClick={() => onDeleteAiModel(model.aimodel_id)}><Trash2 size={13} /></ActionBtn>}
                                </div>
                              </div>
                              <div className="mt-3 pt-3 border-t border-slate-200">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Model ID</p>
                                <span className="text-[11px] font-mono font-semibold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-lg">{model.modelId}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ━━━ TEAM / ADMINS ━━━ */}
              {activeTab === "team" && (
                <div className="p-5 sm:p-6 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <SectionHeading label={`Admin Users (${admins.length})`} />
                    {profile?.role !== "Admin" && (
                      <button onClick={() => setShowAddAdminModal(true)}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-[#18254D] text-white rounded-xl hover:bg-slate-800 transition-all text-[12px] font-bold tracking-wider shadow-sm active:scale-95 group shrink-0">
                        <Plus size={14} strokeWidth={2.5} className="group-hover:rotate-90 transition-transform" />Add Admin
                      </button>
                    )}
                  </div>

                  {loadingAdmins ? (
                    <div className="flex items-center justify-center py-16"><Loader2 size={28} className="animate-spin text-slate-300" /></div>
                  ) : admins.length === 0 ? (
                    <div className="text-center py-16 border border-dashed border-slate-200 rounded-2xl">
                      <Users size={32} strokeWidth={1.5} className="text-slate-300 mx-auto mb-3" />
                      <p className="text-[13px] font-bold text-[#18254D]">No Team Members Found</p>
                    </div>
                  ) : (
                    <>
                      {/* Desktop table */}
                      <div className="hidden sm:block border border-slate-200 rounded-2xl overflow-hidden">
                        <div className="grid grid-cols-[1fr_1fr_120px_100px_100px] gap-3 px-5 py-3 bg-slate-50/50 border-b border-slate-200">
                          {["Member", "Email", "Role", "Status", "Actions"].map((h, i) => (
                            <div key={h} className={`text-[10px] font-bold text-slate-400 uppercase tracking-wider ${i === 4 ? "text-right" : ""}`}>{h}</div>
                          ))}
                        </div>
                        {admins.map((admin, idx) => (
                          <div key={admin.id} className={`grid grid-cols-[1fr_1fr_120px_100px_100px] gap-3 px-5 py-3.5 items-center hover:bg-slate-50/50 transition-colors ${idx < admins.length - 1 ? "border-b border-slate-100" : ""}`}>
                            <div className="flex items-center gap-3">
                              {admin.image
                                ? <img src={getImageUrl(admin.image)} alt="" className="w-8 h-8 rounded-xl object-cover border border-slate-200 shrink-0" />
                                : <div className="w-8 h-8 rounded-xl bg-[#EFF6FF] flex items-center justify-center border border-[#DBEAFE] shrink-0">
                                    <span className="text-xs font-black text-[#3B82F6]">{admin.name?.charAt(0).toUpperCase()}</span>
                                  </div>}
                              <span className="text-[13px] font-bold text-[#18254D] truncate">{admin.name}</span>
                            </div>
                            <span className="text-[12px] font-semibold text-slate-500 truncate">{admin.email}</span>
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border bg-slate-100 text-slate-600 border-slate-200 uppercase tracking-wider w-fit">{admin.role}</span>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider w-fit
                              ${admin.status === "Active" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${admin.status === "Active" ? "bg-emerald-500" : "bg-rose-500"}`} />
                              {admin.status}
                            </span>
                            <div className="flex justify-end gap-1.5">
                              {admin.role !== "Root Admin" && (
                                <>
                                  <ActionBtn variant="edit" title="Edit Admin" onClick={() => { setEditingAdminId(admin.id); setEditAdminData({ name: admin.name, email: admin.email, role: admin.role, status: admin.status }); }}>
                                    <Pencil size={13} />
                                  </ActionBtn>
                                  <ActionBtn variant="delete" title="Delete Admin" onClick={() => setAdminToDelete(admin)}>
                                    <Trash2 size={13} />
                                  </ActionBtn>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      {/* Mobile cards */}
                      <div className="sm:hidden space-y-3">
                        {admins.map(admin => (
                          <div key={admin.id} className="bg-slate-50 rounded-2xl border border-slate-100 p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                {admin.image
                                  ? <img src={getImageUrl(admin.image)} alt="" className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0" />
                                  : <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center border border-[#DBEAFE] shrink-0">
                                      <span className="text-base font-black text-[#3B82F6]">{admin.name?.charAt(0).toUpperCase()}</span>
                                    </div>}
                                <div className="min-w-0">
                                  <p className="text-[13px] font-bold text-[#18254D] truncate">{admin.name}</p>
                                  <p className="text-[11px] text-slate-400 font-medium truncate">{admin.email}</p>
                                </div>
                              </div>
                              {admin.role !== "Root Admin" && (
                                <div className="flex gap-1.5 shrink-0">
                                  <ActionBtn variant="edit" title="Edit" onClick={() => { setEditingAdminId(admin.id); setEditAdminData({ name: admin.name, email: admin.email, role: admin.role, status: admin.status }); }}><Pencil size={13} /></ActionBtn>
                                  <ActionBtn variant="delete" title="Delete" onClick={() => setAdminToDelete(admin)}><Trash2 size={13} /></ActionBtn>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-200">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border bg-slate-100 text-slate-600 border-slate-200 uppercase tracking-wider">{admin.role}</span>
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider
                                ${admin.status === "Active" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${admin.status === "Active" ? "bg-emerald-500" : "bg-rose-500"}`} />
                                {admin.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ━━━ EXPORT ━━━ */}
              {activeTab === "export" && (
                <div className="p-5 sm:p-6 space-y-4">
                  <div>
                    <SectionHeading label="Data Export Center" />
                    <p className="text-sm text-slate-500 font-medium leading-relaxed mt-2">Download your CRM data in Excel format for analysis and reporting.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { type: "enquiries", label: "Enquiries",  desc: "Incoming enquiries before lead conversion.",         icon: Inbox,        tag: "Raw Data",  tagColor: "bg-blue-50 text-blue-600 border-blue-100"        },
                      { type: "leads",     label: "Leads",       desc: "Converted leads with enquiry & contact details.",    icon: UserPlus,     tag: "Converted", tagColor: "bg-emerald-50 text-emerald-700 border-emerald-100"},
                      { type: "followups", label: "Follow-ups",  desc: "Follow-up activities with lead & project details.",  icon: BellRing,     tag: "Activity",  tagColor: "bg-violet-50 text-violet-700 border-violet-100"  },
                      { type: "clients",   label: "Clients",     desc: "Converted businesses with organisation details.",    icon: Users,        tag: "Business",  tagColor: "bg-amber-50 text-amber-700 border-amber-100"     },
                      { type: "projects",  label: "Projects",    desc: "Active projects with budget, deadlines & clients.",  icon: FolderKanban, tag: "Revenue",   tagColor: "bg-rose-50 text-rose-600 border-rose-100"        },
                    ].map(({ type, label, desc, icon: Ic, tag, tagColor }) => (
                      <div key={type} className="bg-white rounded-2xl border border-slate-200 p-4 hover:border-slate-300 hover:shadow-md transition-all flex items-center justify-between gap-4 group">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 group-hover:bg-[#18254D]/5 transition-colors">
                            <Ic size={17} className="text-[#18254D]" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-bold text-[#18254D] flex items-center gap-2">
                              {label}
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 hidden sm:inline-flex ${tagColor}`}>{tag}</span>
                            </p>
                            <p className="text-[11px] text-slate-400 font-medium leading-relaxed mt-0.5">{desc}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => type === "followups" ? setShowFollowupModal(true) : handleExport(type, `${type}_export.xlsx`)}
                          disabled={exportingType === type}
                          className="w-9 h-9 flex items-center justify-center bg-[#18254D] text-white rounded-xl hover:bg-slate-800 transition-all shadow-sm active:scale-95 disabled:bg-slate-100 disabled:text-slate-400 shrink-0"
                          title="Download Excel"
                        >
                          {exportingType === type ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ════════ MODALS ════════ */}

      {/* Update Password */}
      {showPasswordForm && (
        <ModalShell title="Update Password" subtitle="Change Your Account Password" icon={Lock} onClose={() => setShowPasswordForm(false)}
          footer={
            <div className="flex justify-end">
              <SubmitButton className="w-full sm:w-auto px-6" loading={isSubmitting} loadingText="UPDATING..." onClick={handleUpdatePassword}>
                <Save size={14} strokeWidth={2.5} /><span>UPDATE PASSWORD</span>
              </SubmitButton>
            </div>
          }
        >
          <SectionHeading label="New Credentials" />
          {[
            { key: "currentPassword", label: "Current Password", placeholder: "Enter current password", pwdKey: "current" },
            { key: "newPassword",     label: "New Password",     placeholder: "Enter new password",     pwdKey: "new"     },
            { key: "confirmPassword", label: "Confirm Password", placeholder: "Confirm new password",   pwdKey: "confirm" },
          ].map(({ key, label, placeholder, pwdKey }) => (
            <div key={key} className="space-y-1.5">
              <FieldLabel required>{label}</FieldLabel>
              <div className="relative">
                <input type={showPwd[pwdKey] ? "text" : "password"} value={passwordData[key]} placeholder={placeholder}
                  onChange={e => setPasswordData({ ...passwordData, [key]: e.target.value })}
                  className="w-full px-4 py-2.5 pr-11 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all" />
                <button type="button" onClick={() => setShowPwd(p => ({ ...p, [pwdKey]: !p[pwdKey] }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-[#18254D]">
                  {showPwd[pwdKey] ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          ))}
        </ModalShell>
      )}

      {/* Add AI Model */}
      {showAddModelModal && (
        <ModalShell title="New AI Model" subtitle="Configure & Connect AI Provider" icon={Bot} onClose={() => setShowAddModelModal(false)}
          footer={
            <div className="flex justify-end">
              <SubmitButton className="w-full sm:w-auto px-6" disabled={!newModel.name || !newModel.modelId || !newModel.apiKey}
                onClick={() => { onAddAiModel(newModel); setNewModel({ name: "", provider: "openai", modelId: "", apiKey: "" }); setShowAddModelModal(false); }}>
                <Check size={14} strokeWidth={2.5} /><span>ADD MODEL</span>
              </SubmitButton>
            </div>
          }
        >
          <SectionHeading label="Model Configuration" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField label="Display Name" required placeholder="e.g. GPT-4o Mini" value={newModel.name} onChange={e => setNewModel({ ...newModel, name: e.target.value })} />
            <CustomDropdown label="Provider" value={newModel.provider} field="add_ai_provider" icon={Bot} options={AI_PROVIDERS}
              onChange={val => setNewModel({ ...newModel, provider: val })} activeDropdown={activeDropdown} setActiveDropdown={setActiveDropdown} />
            <InputField label="Model ID (exact)" required placeholder="e.g. gpt-4o-mini" value={newModel.modelId} onChange={e => setNewModel({ ...newModel, modelId: e.target.value })} />
            <div className="space-y-1.5">
              <FieldLabel required>API Key</FieldLabel>
              <input type="password" placeholder="Enter API key" value={newModel.apiKey} onChange={e => setNewModel({ ...newModel, apiKey: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all" />
            </div>
          </div>
        </ModalShell>
      )}

      {/* Edit AI Model */}
      {editingModelId && (
        <ModalShell title="Edit AI Model" subtitle="Update Model Configuration" icon={Bot} onClose={() => setEditingModelId(null)}
          footer={
            <div className="flex justify-end">
              <SubmitButton className="w-full sm:w-auto px-6" disabled={!editModelData.name || !editModelData.modelId || !editModelData.apiKey}
                onClick={() => { onUpdateAiModel(editModelData); setEditingModelId(null); }}>
                <Save size={14} strokeWidth={2.5} /><span>SAVE CHANGES</span>
              </SubmitButton>
            </div>
          }
        >
          <SectionHeading label="Model Configuration" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField label="Display Name" required placeholder="e.g. GPT-4o Mini" value={editModelData.name || ""} onChange={e => setEditModelData({ ...editModelData, name: e.target.value })} />
            <CustomDropdown label="Provider" value={editModelData.provider} field="edit_ai_provider" icon={Bot} options={AI_PROVIDERS}
              onChange={val => setEditModelData({ ...editModelData, provider: val })} activeDropdown={activeDropdown} setActiveDropdown={setActiveDropdown} />
            <InputField label="Model ID (exact)" required placeholder="e.g. gpt-4o-mini" value={editModelData.modelId || ""} onChange={e => setEditModelData({ ...editModelData, modelId: e.target.value })} />
            <div className="space-y-1.5">
              <FieldLabel required>API Key</FieldLabel>
              <input type="password" placeholder="Enter API key" value={editModelData.apiKey || ""} onChange={e => setEditModelData({ ...editModelData, apiKey: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all" />
            </div>
          </div>
        </ModalShell>
      )}

      {/* Add Admin */}
      {showAddAdminModal && (
        <ModalShell title="New Admin" subtitle="Create Admin Account" icon={UserPlus} onClose={() => setShowAddAdminModal(false)}
          footer={
            <div className="flex justify-end">
              <SubmitButton className="w-full sm:w-auto px-6" loading={isSubmitting} loadingText="CREATING..." onClick={handleAddAdmin}>
                <Check size={14} strokeWidth={2.5} /><span>CREATE ADMIN</span>
              </SubmitButton>
            </div>
          }
        >
          <SectionHeading label="Account Details" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <FieldLabel required>Full Name</FieldLabel>
              <input type="text" placeholder="Enter full name" value={newAdmin.name}
                onChange={e => { setNewAdmin({ ...newAdmin, name: e.target.value }); if (addAdminErrors.name) setAddAdminErrors({ ...addAdminErrors, name: null }); }}
                className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all ${addAdminErrors.name ? "border-rose-300" : "border-slate-200 focus:border-[#18254D]/30"}`} />
              {addAdminErrors.name && <p className="text-[10px] text-rose-500 font-medium ml-1">{addAdminErrors.name}</p>}
            </div>
            <div className="space-y-1.5">
              <FieldLabel required>Email Address</FieldLabel>
              <input type="email" placeholder="Enter email" value={newAdmin.email}
                onChange={e => { setNewAdmin({ ...newAdmin, email: e.target.value }); if (addAdminErrors.email) setAddAdminErrors({ ...addAdminErrors, email: null }); }}
                className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all ${addAdminErrors.email ? "border-rose-300" : "border-slate-200 focus:border-[#18254D]/30"}`} />
              {addAdminErrors.email && <p className="text-[10px] text-rose-500 font-medium ml-1">{addAdminErrors.email}</p>}
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <FieldLabel required>Password</FieldLabel>
              <div className="relative">
                <input type={showAddAdminPwd ? "text" : "password"} placeholder="Set a secure password" value={newAdmin.password}
                  onChange={e => { setNewAdmin({ ...newAdmin, password: e.target.value }); if (addAdminErrors.password) setAddAdminErrors({ ...addAdminErrors, password: null }); }}
                  className={`w-full px-4 py-2.5 pr-11 bg-slate-50 border rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all ${addAdminErrors.password ? "border-rose-300" : "border-slate-200 focus:border-[#18254D]/30"}`} />
                <button type="button" onClick={() => setShowAddAdminPwd(!showAddAdminPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-[#18254D]">
                  {showAddAdminPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {addAdminErrors.password ? <p className="text-[10px] text-rose-500 font-medium ml-1">{addAdminErrors.password}</p>
                : <p className="text-[10px] text-slate-400 font-medium ml-1">Minimum 8 characters required</p>}
            </div>
            <CustomDropdown label="Role" value={newAdmin.role} field="add_admin_role" icon={Briefcase} options={["BDM", "Admin", "Manager"]}
              onChange={val => setNewAdmin({ ...newAdmin, role: val })} activeDropdown={activeDropdown} setActiveDropdown={setActiveDropdown} />
            <CustomDropdown label="Status" value={newAdmin.status} field="add_admin_status" icon={Check} options={["Active", "Inactive"]}
              onChange={val => setNewAdmin({ ...newAdmin, status: val })} activeDropdown={activeDropdown} setActiveDropdown={setActiveDropdown} />
          </div>
        </ModalShell>
      )}

      {/* Edit Admin */}
      {editingAdminId && (
        <ModalShell title="Edit Admin" subtitle="Update Account Details" icon={Pencil} onClose={() => setEditingAdminId(null)}
          footer={
            <div className="flex justify-end">
              <SubmitButton className="w-full sm:w-auto px-6" loading={isSubmitting} loadingText="SAVING..." onClick={() => handleSaveEditAdmin(editingAdminId)}>
                <Save size={14} strokeWidth={2.5} /><span>SAVE CHANGES</span>
              </SubmitButton>
            </div>
          }
        >
          <SectionHeading label="Account Details" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField label="Full Name" required placeholder="Enter full name" value={editAdminData.name} onChange={e => setEditAdminData({ ...editAdminData, name: e.target.value })} />
            <InputField label="Email Address" required type="email" placeholder="Enter email" value={editAdminData.email} onChange={e => setEditAdminData({ ...editAdminData, email: e.target.value })} />
            <CustomDropdown label="Role" value={editAdminData.role} field="edit_admin_role" icon={Briefcase} options={["BDM", "Admin", "Manager"]}
              onChange={val => setEditAdminData({ ...editAdminData, role: val })} activeDropdown={activeDropdown} setActiveDropdown={setActiveDropdown} />
            <CustomDropdown label="Status" value={editAdminData.status} field="edit_admin_status" icon={Check} options={["Active", "Inactive"]}
              onChange={val => setEditAdminData({ ...editAdminData, status: val })} activeDropdown={activeDropdown} setActiveDropdown={setActiveDropdown} />
          </div>
        </ModalShell>
      )}

      {/* Delete Admin Confirm */}
      {adminToDelete && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[99999] flex items-center justify-center p-4">
          <div className="absolute inset-0" onClick={() => setAdminToDelete(null)} />
          <div className="relative z-10 bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-pop">
            <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#FFF1F2] text-[#F43F5E] rounded-xl flex items-center justify-center border border-[#FFE4E6] shadow-sm shrink-0">
                  <AlertTriangle size={15} />
                </div>
                <h3 className="text-[15px] font-bold text-[#18254D]">Confirm Deletion</h3>
              </div>
              <button onClick={() => setAdminToDelete(null)} className="p-1.5 hover:bg-slate-200 rounded-xl text-slate-400"><X size={18} /></button>
            </div>
            <div className="p-5 sm:p-6 space-y-5">
              <p className="text-sm text-slate-600 font-semibold leading-relaxed">
                Are you sure you want to delete <span className="text-[#F43F5E] font-bold underline underline-offset-4">"{adminToDelete.name}"</span>? This cannot be undone.
              </p>
              <div className="flex flex-col-reverse sm:flex-row gap-3">
                <button onClick={() => setAdminToDelete(null)} className="flex-1 h-11 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold tracking-wider hover:bg-slate-200 transition-all active:scale-[0.98] uppercase">Cancel</button>
                <button onClick={() => handleDeleteAdmin(adminToDelete.id)} className="flex-1 h-11 bg-[#F43F5E] text-white rounded-xl text-xs font-bold tracking-wider hover:bg-[#E11D48] transition-all active:scale-[0.98] flex items-center justify-center gap-2 uppercase shadow-md">
                  Delete Admin <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {/* Follow-up Export Type */}
      {showFollowupModal && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowFollowupModal(false)} />
          <div className="relative z-10 bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-pop">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#EFF6FF] text-[#3B82F6] rounded-xl flex items-center justify-center border border-[#DBEAFE] shadow-sm shrink-0"><Download size={15} /></div>
                <div>
                  <h3 className="text-[15px] font-bold text-[#18254D]">Follow-up Export</h3>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-0.5">Choose Export Type</p>
                </div>
              </div>
              <button onClick={() => setShowFollowupModal(false)} className="p-1.5 hover:bg-slate-200 rounded-xl text-slate-400"><X size={18} /></button>
            </div>
            <div className="p-4 sm:p-5 space-y-3">
              {[
                { type: "followups?type=new",       label: "New Follow-ups",       desc: "Focused on leads and prospects",      icon: UserPlus  },
                { type: "followups?type=reference", label: "Reference Follow-ups", desc: "Focused on active clients & projects", icon: Briefcase },
              ].map(({ type, label, desc, icon: Ic }) => (
                <button key={type}
                  onClick={() => { handleExport(type, `${label.toLowerCase().replace(/ /g, "_")}.xlsx`); setShowFollowupModal(false); }}
                  className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-[#18254D] hover:text-white transition-all group border border-slate-100 active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 group-hover:bg-white/10 group-hover:border-transparent">
                      <Ic size={16} className="text-[#18254D] group-hover:text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold">{label}</p>
                      <p className="text-[11px] opacity-60 font-medium">{desc}</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
};

export default Settings;