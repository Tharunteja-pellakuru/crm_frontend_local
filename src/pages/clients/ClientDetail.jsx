import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-hot-toast";
import { useScrollLock } from "../../hooks/useScrollLock";
import { addToGoogleCalendar } from "../../utils/calendar";
import { validateForm } from "../../utils/validation";
import { extractCountryAndPhone } from "../../utils/leadUtils";
import { formatBudget } from "../../utils/formatters";
import DatePicker from "../../components/ui/DatePicker";
import SearchableDropdown from "../../components/common/SearchableDropdown";
import { countries } from "../../utils/countries";
import { indianStates, commonCurrencies, countryToCurrency } from "../../utils/locationData";
import { CATEGORY_MAP, REVERSE_CATEGORY_MAP } from "../../constants/categoryConstants";
import { BASE_URL } from "../../constants/config";
import { MOCK_ACTIVITIES } from "../../constants/mockData";
import { generateClientSummary, suggestNextAction } from "../../services/aiService";
import {
  ArrowLeft, Mail, Phone, MapPin, Sparkles, Send, Clock, FileText,
  Plus, MessageSquare, Briefcase, Calendar, X, ChevronLeft,
  ChevronRight, Zap, Target, Pencil, RotateCcw, Flame,
  Sun, Snowflake, Search, Check, CheckCircle2, ChevronDown,
  Globe, UserCheck, UserX, Tag, DollarSign, Bell
} from "lucide-react";

// --- UTILS ---
const parseLocalDate = (dateStr) => {
  if (!dateStr) return new Date();
  if (dateStr instanceof Date) return dateStr;
  if (typeof dateStr === 'string' && dateStr.includes('T') && dateStr.endsWith('Z')) {
    const normalized = dateStr.replace('T', ' ').replace('Z', '').split('.')[0];
    const date = new Date(normalized);
    if (!isNaN(date.getTime())) return date;
  }
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? new Date() : date;
};

const formatDateDMY = (date) => {
  if (!date || isNaN(date.getTime())) return "";
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${d}-${m}-${y}`;
};

const getModeBadge = (mode) => {
  switch (mode?.toLowerCase()) {
    case "call": return "bg-green-100 text-green-700 border-green-200";
    case "email": return "bg-blue-100 text-blue-700 border-blue-200";
    case "meeting": return "bg-purple-100 text-purple-700 border-purple-200";
    case "whatsapp": return "bg-emerald-100 text-emerald-700 border-emerald-200";
    default: return "bg-gray-100 text-gray-600 border-gray-200";
  }
};

// --- SUB-COMPONENTS ---
const ConversationCard = ({ conv, onAddToCalendar }) => {
  const type = conv.source === "followup" ? (conv.type || conv.followup_mode || "call").toLowerCase() : (conv.type || "call").toLowerCase();
  const createdDate = parseLocalDate(conv.created_at || conv.createdAt || conv.joinedDate || conv.date || conv.dueDate);
  const completedDate = conv.completed_at ? parseLocalDate(conv.completed_at) : null;
  const dueDate = conv.followup_date ? parseLocalDate(conv.followup_date) : conv.dueDate ? parseLocalDate(conv.dueDate) : createdDate;
  const isFollowup = conv.source === "followup";
  const isPending = conv.source === "pending";

  const getCardStyle = () => {
    if (isFollowup) return "bg-emerald-50/50 border-emerald-100 hover:border-emerald-200";
    switch (conv.priority) {
      case "High": return "bg-red-50/50 border-red-100 hover:border-red-200";
      case "Medium": return "bg-amber-50/50 border-amber-100 hover:border-amber-200";
      case "Low": return "bg-blue-50/50 border-blue-100 hover:border-blue-200";
      default: return "bg-white border-slate-200 hover:border-slate-300";
    }
  };

  const getIconColor = () => {
    if (isPending) return "bg-amber-500";
    if (isFollowup) return "bg-emerald-500";
    switch(type) {
      case "email": return "bg-blue-500";
      case "meeting": return "bg-purple-500";
      case "whatsapp": return "bg-[#25D366]";
      default: return "bg-green-500"; // call
    }
  };

  return (
    <div className={`group min-w-full w-full shrink-0 snap-start rounded-2xl p-5 flex flex-col transition-all border ${getCardStyle()}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm ${getIconColor()}`}>
            {type === "call" ? <Phone size={18} /> : type === "meeting" ? <Calendar size={18} /> : type === "whatsapp" ? <MessageSquare size={18} /> : <Mail size={18} />}
          </div>
          <span className={`text-[10px] sm:text-xs font-bold tracking-wider px-2.5 py-1 rounded-md border uppercase ${
            isPending ? "bg-amber-100 text-amber-700 border-amber-200" :
            isFollowup ? "bg-emerald-100 text-emerald-700 border-emerald-200" : getModeBadge(type)
          }`}>
            {isPending ? "PENDING" : isFollowup ? "FOLLOW-UP COMPLETED" : type}
          </span>
        </div>

        {isPending && (
          <button
            onClick={(e) => { e.stopPropagation(); onAddToCalendar(conv); }}
            className="opacity-0 group-hover:opacity-100 p-2 bg-white border border-slate-200 text-slate-400 rounded-lg hover:text-blue-600 hover:border-blue-300 transition-all shadow-sm"
            title="Add to Google Calendar"
          >
            <Calendar size={16} />
          </button>
        )}
      </div>

      {conv.title && (
        <h5 className="text-base font-bold text-slate-800 mb-2 line-clamp-1">{conv.title}</h5>
      )}

      <div className="flex-1 space-y-3 mb-5">
        {isFollowup && conv.originalDescription && (
          <div className="p-3 bg-white/60 border border-slate-200/60 rounded-xl">
            <p className="text-xs text-slate-500 font-medium line-clamp-2">{conv.originalDescription}</p>
          </div>
        )}
        <div>
          {isFollowup && (
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Summary
            </p>
          )}
          <p className="text-sm text-slate-700 leading-relaxed line-clamp-3">
            {conv.description || conv.follow_brief}
          </p>
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-slate-200/60 flex flex-col gap-2 text-xs font-medium text-slate-500">
        {isFollowup ? (
          <>
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-slate-400" />
              <span>Scheduled: {formatDateDMY(dueDate)} · {dueDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 size={14} />
              <span>Completed: {completedDate ? `${formatDateDMY(completedDate)} · ${completedDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "N/A"}</span>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-slate-400" />
            <span>Interaction: {formatDateDMY(createdDate)} · {createdDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
        )}
        
        {((isFollowup && conv.completed_by) || conv.completedBy) && (
          <p className={`mt-1 text-xs ${isFollowup ? "text-emerald-600/80" : "text-slate-400"}`}>
            By: <span className="font-semibold">{conv.completed_by || conv.completedBy}</span>
          </p>
        )}
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---
const ClientDetail = ({
  client, onBack, onUpdateClient, onAddActivity, activities, followUps = [],
  onAddFollowUp, initialTab = "overview", onSelectProject, projects = [],
  onDismissLead, onRestoreLead, onToggleStatus,
}) => {
  const isLead = client.status === "Lead" || client.status === "Dismissed";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [nextAction, setNextAction] = useState("");
  
  // States - Unchanged
  const [editFormData, setEditFormData] = useState({
    name: "", email: "", phone: "", countryCode: "", leadType: "Warm",
    notes: "", website: "", projectCategory: 1, country: "India",
    state: "", currency: "INR", organisationName: "", clientStatus: "Active",
  });
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isEditCategoryDropdownOpen, setIsEditCategoryDropdownOpen] = useState(false);
  const [isEditStatusDropdownOpen, setIsEditStatusDropdownOpen] = useState(false);
  const countryButtonRef = useRef(null);
  const [countryDropdownStyle, setCountryDropdownStyle] = useState({});

  const [showAddFollowUpModal, setShowAddFollowUpModal] = useState(false);
  const [followUpFormData, setFollowUpFormData] = useState({
    title: "", description: "", followup_date: new Date().toLocaleDateString("en-CA"),
    timeHour: "12", timeMinute: "00", timePeriod: "PM", priority: "Medium",
    followup_mode: "Call", followup_status: "Pending", projectId: "",
  });

  const [isFollowHourOpen, setIsFollowHourOpen] = useState(false);
  const [isFollowMinOpen, setIsFollowMinOpen] = useState(false);
  const [isFollowPeriodOpen, setIsFollowPeriodOpen] = useState(false);
  const [isFollowModeOpen, setIsFollowModeOpen] = useState(false);
  const [isFollowPriorityOpen, setIsFollowPriorityOpen] = useState(false);
  const [isFollowStatusOpen, setIsFollowStatusOpen] = useState(false);
  const [isFollowProjectOpen, setIsFollowProjectOpen] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionBrief, setCompletionBrief] = useState("");
  const [completingFollowUpId, setCompletingFollowUpId] = useState(null);
  const [completionDate, setCompletionDate] = useState(new Date().toLocaleDateString("en-CA"));
  const [completionHour, setCompletionHour] = useState((new Date().getHours() % 12 || 12).toString());
  const [completionMinute, setCompletionMinute] = useState(new Date().getMinutes().toString().padStart(2, "0"));
  const [completionPeriod, setCompletionPeriod] = useState(new Date().getHours() >= 12 ? "PM" : "AM");
  const [completedBy, setCompletedBy] = useState(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user.full_name || "";
  });
  const [isCompHourOpen, setIsCompHourOpen] = useState(false);
  const [isCompMinOpen, setIsCompMinOpen] = useState(false);
  const [isCompPeriodOpen, setIsCompPeriodOpen] = useState(false);

  const [logData, setLogData] = useState({
    type: "call", description: "", projectId: "",
    date: new Date().toISOString().split("T")[0],
    time: new Date().toTimeString().split(" ")[0].substring(0, 5),
  });
  const [clientFollowUps, setClientFollowUps] = useState([]);
  const [isLeadConvOpen, setIsLeadConvOpen] = useState(true);
  const [expandedProjectIndex, setExpandedProjectIndex] = useState(0);

  useScrollLock(showEditModal || showAddFollowUpModal || isLogging || showCompletionModal);

  // Effects & Handlers - Unchanged
  useEffect(() => {
    if (isCountryDropdownOpen && countryButtonRef.current) {
      const rect = countryButtonRef.current.getBoundingClientRect();
      setCountryDropdownStyle({
        position: "fixed", top: `${rect.bottom + 8}px`, left: `${rect.left}px`,
        width: `${rect.width}px`, zIndex: 9999,
      });
    }
  }, [isCountryDropdownOpen]);

  useEffect(() => setActiveTab(initialTab), [initialTab]);

  useEffect(() => {
    if (showEditModal && client) {
      const dialCode = client.country_code || "";
      const phone = client.phone || "";
      const countryName = client.country || "";
      setEditFormData({
        name: client.name || "", email: client.email || "", phone: phone,
        countryCode: dialCode.replace("+", ""), leadType: client.leadType || "Hot",
        notes: client.notes || "", website: client.website || "",
        projectCategory: client.projectCategory || REVERSE_CATEGORY_MAP[client.industry] || 1,
        country: countryName, state: client.state || "", currency: client.currency || "",
        organisationName: client.organisationName || "", clientStatus: client.clientStatus || "Active",
      });
    }
  }, [showEditModal, client]);

  useEffect(() => {
    if (client && client.id) fetchClientFollowups();
  }, [client]);

  const fetchClientFollowups = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/client-followups/${client.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (response.ok) {
        const data = await response.json();
        setClientFollowUps(data);
      }
    } catch (error) { console.error("Error fetching client followups:", error); }
  };

  const handleAddFollowUpSubmit = async (e) => {
    e.preventDefault();
    if (!followUpFormData.title || !followUpFormData.description) {
      toast.error("Please fill in title and description"); return;
    }
    let hour = parseInt(followUpFormData.timeHour);
    if (followUpFormData.timePeriod === "PM" && hour < 12) hour += 12;
    if (followUpFormData.timePeriod === "AM" && hour === 12) hour = 0;
    const time24 = `${hour.toString().padStart(2, "0")}:${followUpFormData.timeMinute}`;
    const combinedDateTime = `${followUpFormData.followup_date} ${time24}:00`;
    const finalClientId = followUpFormData.projectId ? null : (!isLead && client.lead_id ? client.lead_id : client.id);

    try {
      const formattedStatus = followUpFormData.followup_status.charAt(0).toUpperCase() + followUpFormData.followup_status.slice(1).toLowerCase();
      if (onAddFollowUp) {
        await onAddFollowUp({
          ...followUpFormData, clientId: finalClientId, dueDate: combinedDateTime,
          followup_date: combinedDateTime, followup_status: formattedStatus,
        });
      }
      setShowAddFollowUpModal(false);
      setFollowUpFormData({
        title: "", description: "", followup_date: new Date().toLocaleDateString("en-CA"),
        timeHour: "12", timeMinute: "00", timePeriod: "PM", priority: "Medium",
        followup_mode: "Call", followup_status: "Pending", projectId: "",
      });
    } catch (error) {
      console.error("Error adding follow-up:", error); toast.error("Failed to add follow-up");
    }
  };

  const handleLogInteraction = (e) => {
    e.preventDefault();
    const isValid = validateForm(logData, {
      description: { required: true, minLength: 5, label: "Interaction Details" },
      date: { required: true, label: "Date" },
      time: { required: true, label: "Time" },
    });
    if (!isValid) return;

    if (onAddActivity && logData.description) {
      const combinedDateTime = new Date(`${logData.date}T${logData.time}`);
      onAddActivity({
        clientId: client.id, type: logData.type, description: logData.description,
        projectName: clientProjects.find((p) => p.id === logData.projectId)?.name || "",
        projectId: logData.projectId, date: combinedDateTime.toISOString(),
      });
      setLogData({
        ...logData, description: "", projectId: "",
        date: new Date().toISOString().split("T")[0],
        time: new Date().toTimeString().split(" ")[0].substring(0, 5),
      });
    }
  };

  const handleAddToCalendar = async (f) => {
    try {
      const dueDate = f.followup_date ? parseLocalDate(f.followup_date) : f.dueDate ? parseLocalDate(f.dueDate) : new Date();
      const startTime = dueDate;
      const endTime = new Date(startTime.getTime() + 30 * 60000); 
      
      const eventData = {
        title: `Follow-up: ${f.title}`,
        description: `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n 📋 Follow-up Title\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n 📌 TITLE:     ${f.title}\n 👤 CLIENT:    ${client?.name || "N/A"}\n 🏢 COMPANY:   ${client?.company || "N/A"}\n 📞 MODE:      ${f.followup_mode || "Call"}\n\n ──────────────────────────────\n 📝 DESCRIPTION:\n ${f.description || "No description provided."}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nGenerated via Parivartan CRM`,
        start: startTime, end: endTime
      };
      toast.promise(addToGoogleCalendar(eventData), {
        loading: 'Connecting to Google Calendar...', success: 'Event added to your calendar!', error: 'Failed to add event to calendar.'
      });
    } catch (error) { toast.error("Could not sync with Google Calendar."); }
  };

  const toggleProject = (idx) => setExpandedProjectIndex((prev) => (prev === idx ? null : idx));

  // Data processing - Unchanged
  const clientProjects = projects.filter((p) => p.clientId == client.id);
  const clientProjectIds = clientProjects.map((p) => p.id);
  const clientActivities = activities.filter(a => a.clientId == client.id || (client.lead_id && a.clientId == client.lead_id) || clientProjectIds.includes(a.projectId || a.project_id));
  
  const completedFollowUps = [...followUps.filter((f) => f.clientId == client.id || (client.lead_id && f.clientId == client.lead_id) || clientProjectIds.includes(f.projectId || f.project_id)), ...clientFollowUps]
    .filter((f, index, self) => (f.status === "completed" || f.followup_status === "completed") && index === self.findIndex((t) => t.id === f.id));

  const upcomingFollowUps = [...followUps.filter((f) => f.clientId == client.id || (client.lead_id && f.clientId == client.lead_id) || clientProjectIds.includes(f.projectId || f.project_id)), ...clientFollowUps]
    .filter((f, index, self) => f.status?.toLowerCase() !== "completed" && f.followup_status?.toLowerCase() !== "completed" && index === self.findIndex((t) => t.id === f.id))
    .sort((a, b) => {
      const diff = parseLocalDate(a.followup_date || a.dueDate) - parseLocalDate(b.followup_date || b.dueDate);
      if (diff !== 0) return diff;
      const priorityMap = { 'High': 1, 'Medium': 2, 'Low': 3 };
      return (priorityMap[a.priority] || 4) - (priorityMap[b.priority] || 4);
    });

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrowStart = new Date(todayStart); tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  const overdueFUs = upcomingFollowUps.filter(f => parseLocalDate(f.followup_date || f.dueDate) < todayStart);
  const todayFUs = upcomingFollowUps.filter(f => {
    const d = parseLocalDate(f.followup_date || f.dueDate); return d >= todayStart && d < tomorrowStart;
  });
  const futureFUs = upcomingFollowUps.filter(f => parseLocalDate(f.followup_date || f.dueDate) >= tomorrowStart);

  const scrollContainer = (id, dir) => {
    const container = document.getElementById(id);
    if (container) {
      const scrollAmount = container.clientWidth;
      container.scrollBy({ left: dir === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  const getFollowUpStatusLabel = (date) => {
    if (!date) return null;
    const fuDate = parseLocalDate(date);
    const today = new Date();
    if (fuDate < today) return { label: "Overdue", className: "bg-red-100 text-red-700 border-red-200" };
    const fuDay = new Date(fuDate.getFullYear(), fuDate.getMonth(), fuDate.getDate());
    const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (fuDay.getTime() === todayDay.getTime()) return { label: "Today", className: "bg-amber-100 text-amber-700 border-amber-200" };
    return { label: "Upcoming", className: "bg-blue-100 text-blue-700 border-blue-200" };
  };

  // UI RENDERING STARTS HERE (Redesigned)
  return (
    <div className="w-full  min-h-screen text-slate-800">
      
      {/* Top Navigation & Header */}
      <div className=" border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Left: Back & Profile Info */}
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-500 hover:text-slate-900 transition-colors shrink-0"
              >
                <ArrowLeft className="w-5 h-5" strokeWidth={2} />
              </button>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-xl shadow-sm shrink-0">
                  {client.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight leading-tight capitalize">
                    {client.name}
                  </h1>
                  <p className="text-sm font-medium text-slate-500 flex items-center gap-2">
                    {isLead ? (client.company && <span>{client.company}</span>) : (<span>{client.projectName || client.company || "Global Project"}</span>)}
                    <span className="w-1 h-1 rounded-full bg-slate-300 inline-block" />
                    <span className="text-slate-400">{isLead ? "Lead" : "Client"}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowEditModal(true)}
                className="px-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-2 shadow-sm"
              >
                <Pencil size={16} /> 
              </button>

              {client.status !== "Dismissed" ? (
                <button
                  onClick={() => {
                    if (isLead) { onDismissLead && onDismissLead(client.lead_id || client.id); } 
                    else { onUpdateClient && onUpdateClient(client.id, { ...client, status: "Dismissed", clientStatus: "Dismissed" }); }
                  }}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-semibold text-red-600 hover:bg-red-50 hover:border-red-200 transition-all flex items-center gap-2 shadow-sm"
                >
                  <UserX size={16} /> 
                </button>
              ) : (
                <button
                  onClick={() => onRestoreLead && onRestoreLead(client.lead_id || client.id)}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-all flex items-center gap-2 shadow-sm"
                >
                  <RotateCcw size={16} /> <span className="hidden sm:inline">Restore</span>
                </button>
              )}
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-[-1px]">
            {[
              { id: "overview", label: "Overview", icon: <Target size={16}/> },
              { id: "activity", label: "Conversations", icon: <MessageSquare size={16}/> },
              ...(!isLead ? [{ id: "projects", label: "Projects", icon: <Briefcase size={16}/> }] : []),
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 border-b-2 text-sm font-semibold transition-all whitespace-nowrap ${
                  activeTab === tab.id 
                    ? "border-slate-900 text-slate-900" 
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT SIDEBAR: Contact Details Card */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-5">Contact Information</h3>
              <div className="space-y-4">
                {client.organisationName && (
                  <div className="flex items-start gap-3">
                    <Briefcase className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-slate-500">Organization</p>
                      <p className="text-sm font-semibold text-slate-900">{client.organisationName}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-slate-500">Email Address</p>
                    <a href={`mailto:${client.email}`} className="text-sm font-semibold text-blue-600 hover:underline break-all">{client.email}</a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-slate-500">Phone Number</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {(() => {
                        let dialCode = client.country_code || "";
                        if (dialCode && /^\d+$/.test(dialCode)) dialCode = `+${dialCode}`;
                        if (!dialCode && client.country) {
                          const match = client.country.trim().match(/\(([^)]+)\)/);
                          if (match && match[1]) dialCode = match[1];
                        }
                        return dialCode ? `${dialCode} ${client.phone}` : client.phone;
                      })()}
                    </p>
                  </div>
                </div>
                {!isLead && (client.state || client.country) && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-slate-500">Location</p>
                      <p className="text-sm font-semibold text-slate-900">{client.state ? `${client.state}, ` : ""}{client.country}</p>
                    </div>
                  </div>
                )}
                {client.website && (
                  <div className="flex items-start gap-3">
                    <Globe className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-slate-500">Website</p>
                      <a 
                        href={client.website.startsWith("http") ? client.website : `https://${client.website}`} 
                        target="_blank" rel="noopener noreferrer" 
                        className="text-sm font-semibold text-blue-600 hover:underline break-all"
                      >
                        {client.website.replace(/^https?:\/\//, "")}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {client.notes && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Notes & Message</h3>
                <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                  {client.notes}
                </p>
              </div>
            )}
          </div>

          {/* RIGHT CONTENT AREA */}
          <div className="lg:col-span-8 space-y-6">
            
            {activeTab === "overview" && (
              <div className="space-y-8 animate-fade-in">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {isLead ? (
                    <>
                      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                          <Zap size={24} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Lead Status</p>
                          <p className={`text-xl font-bold ${client.leadType === "Hot" ? "text-red-600" : client.leadType === "Warm" ? "text-amber-500" : "text-blue-500"}`}>
                            {client.leadType || "Warm"}
                          </p>
                        </div>
                      </div>
                      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                          <UserCheck size={24} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Created By</p>
                          <p className="text-xl font-bold text-slate-900 truncate">{client.createdByName || "System"}</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                          <UserCheck size={24} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Client Status</p>
                          <p className={`text-xl font-bold ${client.clientStatus === "Active" || client.status === "Active" ? "text-emerald-600" : "text-slate-500"}`}>
                            {client.clientStatus || client.status || "Active"}
                          </p>
                        </div>
                      </div>
                      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                          <DollarSign size={24} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Billing Currency</p>
                          <p className="text-xl font-bold text-slate-900">{client.currency || client.client_currency || "N/A"}</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Follow-ups Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Clock size={20} className="text-slate-500" /> Upcoming Follow-ups
                    </h2>
                  </div>

                  <div className="space-y-6">
                    {[
                      { title: "Overdue", icon: <Bell size={16} />, tasks: overdueFUs, style: "text-red-600 bg-red-50 border-red-200" },
                      { title: "Today", icon: <Clock size={16} />, tasks: todayFUs, style: "text-amber-600 bg-amber-50 border-amber-200" },
                      { title: "Upcoming", icon: <Calendar size={16} />, tasks: futureFUs, style: "text-blue-600 bg-blue-50 border-blue-200" }
                    ].map((section) => section.tasks.length > 0 && (
                      <div key={section.title}>
                        <div className="flex items-center gap-3 mb-4">
                          <div className={`p-1.5 rounded-lg border ${section.style}`}>
                            {section.icon}
                          </div>
                          <h3 className={`text-sm font-bold uppercase tracking-wider ${section.title === 'Overdue' ? 'text-red-600' : section.title === 'Today' ? 'text-amber-600' : 'text-blue-600'}`}>
                            {section.title} ({section.tasks.length})
                          </h3>
                          <div className="flex-1 h-px bg-slate-100"></div>
                        </div>

                        <div className="space-y-4 pl-[11px] border-l-2 border-slate-100 ml-3">
                          {section.tasks.map((fu, idx) => {
                            const fuDate = parseLocalDate(fu.followup_date || fu.dueDate);
                            const prevFu = section.tasks[idx - 1];
                            const prevFuDate = prevFu ? parseLocalDate(prevFu.followup_date || prevFu.dueDate) : null;
                            const hasConflict = prevFuDate && (fuDate - prevFuDate) < 30 * 60 * 1000;
                            
                            return (
                              <div key={fu.id} className="relative pl-6">
                                {/* Timeline Dot */}
                                <div className={`absolute -left-[35px] top-5 w-3 h-3 rounded-full border-2 border-white shadow-sm ${fu.priority === 'High' ? 'bg-red-500' : 'bg-slate-300'}`}></div>
                                
                                <div className={`p-4 rounded-xl border bg-white transition-shadow hover:shadow-md ${hasConflict ? 'ring-2 ring-amber-400 ring-offset-1' : 'border-slate-200'}`}>
                                  {hasConflict && (
                                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 text-[10px] font-bold uppercase rounded-md mb-2">
                                      <Clock size={12} /> Time Conflict
                                    </div>
                                  )}
                                  
                                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                    <div>
                                      <div className="flex flex-wrap items-center gap-2 mb-2">
                                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${fu.priority === 'High' ? 'bg-red-100 text-red-700' : fu.priority === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                                          {fu.priority} Priority
                                        </span>
                                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${getModeBadge(fu.followup_mode)}`}>
                                          {fu.followup_mode}
                                        </span>
                                      </div>
                                      <h4 className="text-base font-bold text-slate-900 mb-1">
                                        {fu.title} {fu.projectName && <span className="text-sm font-medium text-slate-500 ml-2">| {fu.projectName}</span>}
                                      </h4>
                                      {fu.description && <p className="text-sm text-slate-600 line-clamp-2 mb-3">{fu.description}</p>}
                                      
                                      <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                                        <span className="flex items-center gap-1.5"><Calendar size={14}/> {formatDateDMY(fuDate)}</span>
                                        <span className="flex items-center gap-1.5 text-slate-700"><Clock size={14}/> {fuDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                      </div>
                                    </div>

                                    <div className="flex gap-2 shrink-0 mt-2 sm:mt-0">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const now = new Date();
                                          setCompletionDate(now.toLocaleDateString("en-CA"));
                                          setCompletionHour((now.getHours() % 12 || 12).toString());
                                          setCompletionMinute(now.getMinutes().toString().padStart(2, "0"));
                                          setCompletionPeriod(now.getHours() >= 12 ? "PM" : "AM");
                                          setCompletingFollowUpId(fu.id); setCompletionBrief(""); setShowCompletionModal(true);
                                        }}
                                        className="p-2 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 text-slate-500 hover:text-emerald-600 rounded-lg transition-colors"
                                        title="Mark as Completed"
                                      >
                                        <CheckCircle2 size={18} />
                                      </button>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleAddToCalendar(fu); }}
                                        className="p-2 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-slate-500 hover:text-blue-600 rounded-lg transition-colors"
                                        title="Add to Google Calendar"
                                      >
                                        <Calendar size={18} />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    {upcomingFollowUps.length === 0 && (
                      <div className="text-center py-12 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-slate-100">
                          <Check className="text-emerald-500 w-6 h-6" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-700 mb-1">All caught up!</h3>
                        <p className="text-xs text-slate-500">No pending follow-ups right now.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "activity" && (
              <div className="space-y-6 animate-fade-in">
                {isLead ? (
                  /* Lead Conversations */
                  (() => {
                    const leadConversations = [
                      ...completedFollowUps.map(fu => ({
                        ...fu, source: "followup", originalDescription: fu.description,
                        description: fu.follow_brief || "No summary provided", completedBy: fu.completed_by
                      })),
                      ...clientActivities.map(a => ({ ...a, source: "activity", originalDescription: null }))
                    ].sort((a, b) => parseLocalDate(b.date || b.completed_at || b.dueDate || b.created_at || b.createdAt) - parseLocalDate(a.date || a.completed_at || a.dueDate || a.created_at || a.createdAt));

                    return (
                      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="flex items-center justify-between p-5 bg-slate-50 border-b border-slate-200 cursor-pointer" onClick={() => setIsLeadConvOpen(!isLeadConvOpen)}>
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                              <MessageSquare size={20} />
                            </div>
                            <div>
                              <h3 className="text-base font-bold text-slate-900">All Conversations</h3>
                              <p className="text-sm font-medium text-slate-500">{leadConversations.length} logged interactions</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {leadConversations.length > 1 && isLeadConvOpen && (
                              <div className="flex gap-2 mr-4" onClick={e => e.stopPropagation()}>
                                <button onClick={() => scrollContainer('lead-conv-carousel', 'left')} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-600"><ChevronLeft size={16}/></button>
                                <button onClick={() => scrollContainer('lead-conv-carousel', 'right')} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-600"><ChevronRight size={16}/></button>
                              </div>
                            )}
                            <ChevronDown size={20} className={`text-slate-400 transition-transform ${isLeadConvOpen ? "rotate-180" : ""}`} />
                          </div>
                        </div>

                        {isLeadConvOpen && (
                          <div className="p-6 bg-slate-50/30">
                            {leadConversations.length === 0 ? (
                              <div className="text-center py-8 text-sm font-semibold text-slate-400">No conversations logged yet</div>
                            ) : (
                              <div id="lead-conv-carousel" className="flex overflow-x-auto gap-6 pb-2 snap-x snap-mandatory no-scrollbar scroll-smooth">
                                {leadConversations.map((conv, idx) => (
                                  <div key={`lead-conv-${conv.id || idx}`} className="w-full sm:w-[400px] shrink-0 snap-start">
                                    <ConversationCard conv={conv} onAddToCalendar={handleAddToCalendar} />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()
                ) : (
                  /* Client Project Conversations */
                  (() => {
                    const projectGroups = clientProjects.map((p) => ({
                      id: p.id, projectName: p.name, projectStatus: p.status, interactions: [],
                    }));
                    const generalInteractions = [];
                    const leadHistoryInteractions = [];

                    const addToGroup = (interaction) => {
                      const targetProject = projectGroups.find((p) => (interaction.projectId && p.id == interaction.projectId) || (interaction.projectName && p.projectName === interaction.projectName));
                      if (targetProject) targetProject.interactions.push(interaction);
                      else if (client.lead_id && interaction.clientId == client.lead_id) leadHistoryInteractions.push(interaction);
                      else generalInteractions.push(interaction);
                    };

                    clientActivities.forEach((a) => addToGroup({ ...a, source: "activity" }));
                    completedFollowUps.forEach((f) => addToGroup({
                      ...f, id: `fu-${f.id}`, type: (f.followup_mode || "call").toLowerCase(),
                      date: f.completed_at || f.dueDate, description: f.follow_brief || "No summary provided",
                      originalDescription: f.description, source: "followup"
                    }));

                    const allGroups = [
                      ...projectGroups,
                      ...(generalInteractions.length > 0 ? [{ projectName: "Other Conversations", projectStatus: "N/A", interactions: generalInteractions }] : []),
                      ...(leadHistoryInteractions.length > 0 ? [{ projectName: "Lead History", projectStatus: "Archived", interactions: leadHistoryInteractions }] : []),
                    ];

                    return (
                      <div className="space-y-6">
                        {allGroups.length === 0 ? (
                          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 text-slate-500 font-semibold">No conversations logged yet</div>
                        ) : (
                          allGroups.map((group, groupIdx) => (
                            <div key={`group-${groupIdx}`} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                              <div className="flex items-center justify-between p-5 bg-slate-50 border-b border-slate-200 cursor-pointer" onClick={() => toggleProject(groupIdx)}>
                                <div className="flex items-center gap-4">
                                  <div className={`w-10 h-10 rounded-xl text-white flex items-center justify-center ${group.projectStatus === 'Active' ? 'bg-blue-600' : group.projectStatus === 'Completed' ? 'bg-emerald-500' : 'bg-slate-400'}`}>
                                    <Briefcase size={20} />
                                  </div>
                                  <div>
                                    <h3 className="text-base font-bold text-slate-900">{group.projectName}</h3>
                                    <p className="text-sm font-medium text-slate-500">{group.interactions.length} interactions</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  {group.projectStatus !== "N/A" && (
                                    <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-600 hidden sm:block">
                                      {group.projectStatus}
                                    </span>
                                  )}
                                  {group.interactions.length > 1 && expandedProjectIndex === groupIdx && (
                                    <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                                      <button onClick={() => scrollContainer(`client-conv-carousel-${groupIdx}`, 'left')} className="p-2 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 text-slate-600"><ChevronLeft size={16}/></button>
                                      <button onClick={() => scrollContainer(`client-conv-carousel-${groupIdx}`, 'right')} className="p-2 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 text-slate-600"><ChevronRight size={16}/></button>
                                    </div>
                                  )}
                                  <ChevronDown size={20} className={`text-slate-400 transition-transform ${expandedProjectIndex === groupIdx ? "rotate-180" : ""}`} />
                                </div>
                              </div>

                              {expandedProjectIndex === groupIdx && (
                                <div className="p-6 bg-slate-50/30">
                                  {group.interactions.length === 0 ? (
                                    <div className="text-center py-6 text-sm font-semibold text-slate-400">No interactions</div>
                                  ) : (
                                    <div id={`client-conv-carousel-${groupIdx}`} className="flex overflow-x-auto gap-6 pb-2 snap-x snap-mandatory no-scrollbar scroll-smooth">
                                      {group.interactions
                                        .sort((a, b) => parseLocalDate(b.date || b.completed_at || b.dueDate || b.created_at || b.createdAt) - parseLocalDate(a.date || a.completed_at || a.dueDate || a.created_at || a.createdAt))
                                        .map((conv, idx) => (
                                          <div key={`conv-${conv.id || idx}`} className="w-full sm:w-[400px] shrink-0 snap-start">
                                            <ConversationCard conv={conv} onAddToCalendar={handleAddToCalendar}/>
                                          </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    );
                  })()
                )}
              </div>
            )}

            {activeTab === "projects" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-fade-in">
                {clientProjects.map((project) => (
                  <div
                    key={project.id}
                    onClick={() => onSelectProject && onSelectProject(project)}
                    className="p-6 bg-white border border-slate-200 rounded-2xl hover:border-slate-400 hover:shadow-lg cursor-pointer transition-all flex flex-col justify-between"
                  >
                    <div className="mb-6">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-lg font-bold text-slate-900 line-clamp-1 pr-4">{project.name}</h4>
                        <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full whitespace-nowrap">
                          {project.status}
                        </span>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-slate-100 flex items-end justify-between">
                      <div>
                        <p className="text-xs font-medium text-slate-500 mb-1">Budget</p>
                        <p className="text-base font-bold text-slate-900">
                          {(() => {
                            const currencyObj = commonCurrencies.find((c) => c.code === client.currency);
                            return currencyObj ? `${currencyObj.code} (${currencyObj.symbol})` : (client.currency || "$");
                          })()}{" "}
                          {formatBudget(project.budget, client.currency)}
                        </p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                        <ChevronRight size={20} />
                      </div>
                    </div>
                  </div>
                ))}
                {clientProjects.length === 0 && (
                  <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-dashed border-slate-300">
                     <p className="text-slate-500 font-semibold">No active projects found.</p>
                  </div>
                )}
              </div>
            )}
            
          </div>
        </div>
      </div>

      {/* --- MODALS (Portals) --- */}
      
      {/* Edit Form Modal */}
      {showEditModal && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-zoom-in flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 p-6 text-white relative shrink-0">
              <button onClick={() => setShowEditModal(false)} className="absolute top-6 right-6 p-1.5 hover:bg-white/20 rounded-full transition-colors">
                <X size={20} strokeWidth={2.5} />
              </button>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
                  <Pencil size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Edit {isLead ? "Lead" : "Client"}</h3>
                  <p className="text-slate-400 text-sm font-medium mt-1">Update primary contact information</p>
                </div>
              </div>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const isValid = validateForm(editFormData, {
                  name: { required: true, minLength: 2, label: "Full Name" },
                  email: { required: true, pattern: /^\S+@\S+\.\S+$/, label: "Email" },
                  phone: { required: true, minLength: 10, label: "Phone Number" },
                });
                if (!isValid) return;

                if (onUpdateClient) {
                  try {
                    await onUpdateClient(client.lead_id || client.id, editFormData);
                    setShowEditModal(false);
                  } catch (error) {
                    toast.error("Failed to update lead. Please try again.");
                  }
                }
              }}
              className="flex-1 min-h-0 p-6 space-y-5 overflow-y-auto custom-scrollbar"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Full Name</label>
                  <input required type="text" placeholder="e.g. Sameer Kapoor" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none text-sm font-medium" value={editFormData.name} onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Email Address</label>
                  <input required type="email" placeholder="sameer@fintech.com" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none text-sm font-medium" value={editFormData.email} onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <SearchableDropdown label="Country Code" options={countries.map((c) => ({ name: `${c.name} (${c.code})`, code: c.code }))} value={editFormData.countryCode} onChange={(val) => { const selectedCountry = countries.find((c) => c.code === val); setEditFormData({ ...editFormData, countryCode: val, country: selectedCountry ? selectedCountry.name : editFormData.country }); }} placeholder="Code" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Phone Number</label>
                  <input required type="tel" placeholder="98765 43210" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none text-sm font-medium" value={editFormData.phone} onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value.replace(/\D/g, "") })} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Website URL (Optional)</label>
                <input type="text" placeholder="www.example.com" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none text-sm font-medium" value={editFormData.website} onChange={(e) => setEditFormData({ ...editFormData, website: e.target.value })} />
              </div>

              {!isLead && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Organisation Name</label>
                    <input type="text" placeholder="Acme Corp" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none text-sm font-medium" value={editFormData.organisationName} onChange={(e) => setEditFormData({ ...editFormData, organisationName: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {editFormData.country === "India" ? (
                      <SearchableDropdown label="State" options={indianStates} value={editFormData.state} onChange={(val) => setEditFormData({ ...editFormData, state: val })} placeholder="Select State" />
                    ) : (
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">State/Province</label>
                        <input type="text" placeholder="California" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none text-sm font-medium" value={editFormData.state} onChange={(e) => setEditFormData({ ...editFormData, state: e.target.value })} />
                      </div>
                    )}
                    <SearchableDropdown label="Currency" options={commonCurrencies.map((c) => ({ name: `${c.code} (${c.symbol})`, code: c.code }))} value={editFormData.currency} onChange={(val) => setEditFormData({ ...editFormData, currency: val })} placeholder="Currency" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Client Status</label>
                    <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none text-sm font-semibold" value={editFormData.clientStatus} onChange={(e) => setEditFormData({ ...editFormData, clientStatus: e.target.value })}>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </>
              )}

              <div className="space-y-1.5 relative">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">{isLead ? "Lead Status" : "Project Status"}</label>
                <button type="button" onClick={() => setIsEditStatusDropdownOpen(!isEditStatusDropdownOpen)} className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold hover:border-slate-400 transition-all">
                  <span className="text-slate-800">{editFormData.leadType || "Select Status"}</span>
                  <ChevronDown size={18} className={`text-slate-500 transition-transform ${isEditStatusDropdownOpen ? "rotate-180" : ""}`} />
                </button>
                {isEditStatusDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-[90]">
                    {(client.isConverted ? ["Hot", "Warm", "Cold", "Converted"] : ["Hot", "Warm", "Cold"]).map((status) => (
                      <button key={status} type="button" onClick={() => { setEditFormData({ ...editFormData, leadType: status }); setIsEditStatusDropdownOpen(false); }} className={`w-full text-left px-5 py-3 text-sm font-semibold transition-colors ${editFormData.leadType === status ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50"}`}>
                        <div className="flex items-center gap-3">
                          {status === "Hot" && <Flame size={16} className="text-red-500" />}
                          {status === "Warm" && <Sun size={16} className="text-amber-500" />}
                          {status === "Cold" && <Snowflake size={16} className="text-blue-500" />}
                          {status === "Converted" && <UserCheck size={16} className="text-emerald-500" />}
                          <span>{status}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Notes</label>
                <textarea rows={4} placeholder="Additional details..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none text-sm font-medium resize-none" value={editFormData.notes} onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })} />
              </div>

              <div className="pt-4 shrink-0">
                <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-xl text-sm font-bold tracking-wide shadow-md active:scale-[0.98] transition-transform hover:bg-slate-800">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Log Activity Modal */}
      {isLogging && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in py-10">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-zoom-in my-auto flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 p-6 text-white relative shrink-0">
              <button onClick={() => setIsLogging(false)} className="absolute top-6 right-6 p-1.5 hover:bg-white/20 rounded-full transition-colors">
                <X size={20} strokeWidth={2.5} />
              </button>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
                  <MessageSquare size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Log Conversation</h3>
                  <p className="text-slate-400 text-sm font-medium mt-1">Record interaction details</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleLogInteraction} className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Date</label>
                  <DatePicker value={logData.date} onChange={(val) => setLogData({ ...logData, date: val })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Time</label>
                  <input required type="time" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none text-sm font-medium" value={logData.time} onChange={(e) => setLogData({ ...logData, time: e.target.value })} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">{isLead ? "Subject" : "Project Name"}</label>
                {!isLead && (
                  <div className="relative">
                    <select required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none text-sm font-medium appearance-none cursor-pointer" value={logData.projectId} onChange={(e) => setLogData({ ...logData, projectId: e.target.value })}>
                      <option value="" disabled>Select a project...</option>
                      {clientProjects.length > 0 ? (
                        clientProjects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)
                      ) : (
                        <>
                          <option value="Website Redesign">Website Redesign</option>
                          <option value="SEO Optimization">SEO Optimization</option>
                          <option value="Brand Identity">Brand Identity</option>
                        </>
                      )}
                    </select>
                    <ChevronDown className="absolute right-4 top-3.5 text-slate-400 pointer-events-none" size={18} />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Interaction Type</label>
                <div className="grid grid-cols-3 gap-3">
                  {["call", "email", "meeting"].map((type) => (
                    <button key={type} type="button" onClick={() => setLogData({ ...logData, type: type })} className={`py-3 px-4 rounded-xl border text-sm font-bold uppercase tracking-wider transition-all ${logData.type === type ? "bg-slate-900 border-slate-900 text-white shadow-md" : "bg-white border-slate-200 text-slate-500 hover:border-slate-400"}`}>
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Conversation Details</label>
                <textarea required placeholder="Discussed new service package..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none text-sm font-medium min-h-[120px] resize-none" value={logData.description} onChange={(e) => setLogData({ ...logData, description: e.target.value })} />
              </div>

              <div className="pt-4 shrink-0">
                <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-xl text-sm font-bold tracking-wide shadow-md active:scale-[0.98] transition-transform hover:bg-slate-800">
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Completion Modal */}
      {showCompletionModal && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-zoom-in">
            <div className="bg-emerald-600 p-6 text-white relative">
              <button onClick={() => setShowCompletionModal(false)} className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors">
                <X size={20} />
              </button>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl border border-white/20 flex items-center justify-center bg-white/10">
                  <CheckCircle2 size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Mark Completed</h3>
                  <p className="text-emerald-100 text-sm font-medium mt-1">Follow-up Conclusion</p>
                </div>
              </div>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                let compHour = parseInt(completionHour || "12");
                if (completionPeriod === "PM" && compHour < 12) compHour += 12;
                if (completionPeriod === "AM" && compHour === 12) compHour = 0;
                const compTime24 = `${compHour.toString().padStart(2, "0")}:${completionMinute || "00"}`;
                const combinedCompletionStr = `${completionDate} ${compTime24}:00`;
                if (onToggleStatus) {
                  await onToggleStatus(completingFollowUpId, completionBrief, combinedCompletionStr, completedBy);
                  fetchClientFollowups();
                }
                setShowCompletionModal(false);
              }}
              className="p-6 space-y-5"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Conclusion Brief <span className="text-red-500">*</span></label>
                <textarea required rows={4} placeholder="Write a brief conclusion..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm font-medium resize-none placeholder:text-slate-400" value={completionBrief} onChange={(e) => setCompletionBrief(e.target.value)} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Completion Date <span className="text-red-500">*</span></label>
                  <DatePicker value={completionDate} onChange={setCompletionDate} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Completion Time <span className="text-red-500">*</span></label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <button type="button" onClick={() => setIsCompHourOpen(!isCompHourOpen)} className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold flex items-center justify-between">
                        {completionHour.padStart(2, '0')} <ChevronDown size={14} className="text-slate-500" />
                      </button>
                      {isCompHourOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-[100] max-h-40 overflow-y-auto">
                          {Array.from({ length: 12 }, (_, i) => (i + 1).toString()).map(h => (
                            <button key={h} type="button" onClick={() => { setCompletionHour(h); setIsCompHourOpen(false); }} className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-sm font-semibold">
                              {h.padStart(2, '0')}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="relative flex-1">
                      <button type="button" onClick={() => setIsCompMinOpen(!isCompMinOpen)} className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold flex items-center justify-between">
                        {completionMinute} <ChevronDown size={14} className="text-slate-500" />
                      </button>
                      {isCompMinOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-[100] max-h-40 overflow-y-auto">
                          {Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0')).map(m => (
                            <button key={m} type="button" onClick={() => { setCompletionMinute(m); setIsCompMinOpen(false); }} className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-sm font-semibold">
                              {m}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="relative flex-1">
                      <button type="button" onClick={() => setIsCompPeriodOpen(!isCompPeriodOpen)} className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold flex items-center justify-between">
                        {completionPeriod} <ChevronDown size={14} className="text-slate-500" />
                      </button>
                      {isCompPeriodOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-[100] overflow-hidden">
                          {["AM", "PM"].map(p => (
                            <button key={p} type="button" onClick={() => { setCompletionPeriod(p); setIsCompPeriodOpen(false); }} className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-sm font-semibold">
                              {p}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Completed By <span className="text-red-500">*</span></label>
                <input required type="text" className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm font-bold" value={completedBy} onChange={(e) => setCompletedBy(e.target.value)} />
              </div>

              <div className="pt-4">
                <button type="submit" className="w-full h-12 bg-emerald-600 text-white rounded-xl text-sm font-bold tracking-wide shadow-md active:scale-[0.98] transition-transform hover:bg-emerald-700">
                  Confirm Completion
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default ClientDetail;