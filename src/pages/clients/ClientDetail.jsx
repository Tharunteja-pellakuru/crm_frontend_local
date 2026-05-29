import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-hot-toast";
import { useScrollLock } from "../../hooks/useScrollLock";
import { addToGoogleCalendar } from "../../utils/calendar";
import { validateForm } from "../../utils/validation";
import { extractCountryAndPhone } from "../../utils/leadUtils";
import { formatBudget, parseBudget } from "../../utils/formatters";
import DatePicker from "../../components/ui/DatePicker";
import { countries } from "../../utils/countries";
import { commonCurrencies, countryToCurrency, countryToStates } from "../../utils/locationData";
import { CATEGORY_MAP, REVERSE_CATEGORY_MAP } from "../../constants/categoryConstants";
import { BASE_URL } from "../../constants/config";
import { generateClientSummary, suggestNextAction } from "../../services/aiService";
import {
  ArrowLeft, Mail, Phone, MapPin, Sparkles, Send, Clock, FileText,
  Plus, MessageSquare, Briefcase, Calendar, X, ChevronLeft,
  ChevronRight, Zap, Target, Pencil, RotateCcw, Flame,
  Sun, Snowflake, Search, Check, CheckCircle2, ChevronDown,
  Globe, UserCheck, UserX, Tag, DollarSign, Bell,
  Loader2, Upload,
} from "lucide-react";
import SearchableDropdown from "../../components/common/SearchableDropdown";


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

const getClientId = (client) => {
  return client?._id || client?.id || client?.lead_id || null;
};

const getOrganisationName = (client) => {
  return client?.organisation_name ||
         client?.organization ||
         client?.org_name ||
         client?.business_name ||
         '';
};

// --- CUSTOM DROPDOWN COMPONENT WITH SEARCH & KEYBOARD NAVIGATION ---
const Dropdown = ({
  label,
  options,
  value,
  onChange,
  placeholder = "Select...",
  required = false,
  searchable = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef(null);
  const listRef = useRef(null);

  const filteredOptions = searchable
    ? options.filter(opt =>
        (opt.name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (opt.code?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (opt.value?.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : options;

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSelectedIndex(-1);
        setSearchQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    function handleKeyDown(e) {
      if (!isOpen) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => prev < filteredOptions.length - 1 ? prev + 1 : 0);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : filteredOptions.length - 1);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filteredOptions.length) {
          const selectedOpt = filteredOptions[selectedIndex];
          onChange(selectedOpt.code || selectedOpt.name || selectedOpt.value);
          setIsOpen(false);
          setSelectedIndex(-1);
          setSearchQuery("");
        }
      } else if (e.key === 'Escape') {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredOptions, selectedIndex]);

  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[data-index]');
      if (items[selectedIndex]) {
        items[selectedIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  const selectedOption = options.find(opt =>
    opt.code === value || opt.name === value || opt.value === value
  );

  return (
    <div className="space-y-1.5" ref={containerRef}>
      {/* ✅ Only render label if label prop is provided */}
      {label && (
        <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsOpen(true);
              e.stopPropagation();
            }
          }}
          className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 bg-white border rounded-xl text-sm font-semibold transition-all min-h-[42px] shadow-sm outline-none ${
            isOpen
              ? "border-[#18254D]/30 ring-4 ring-[#18254D]/5"
              : "border-slate-200/70 hover:border-slate-300 hover:bg-slate-50"
          }`}
        >
          <span className={`${selectedOption ? "text-[#18254D]" : "text-slate-400"}`}>
            {selectedOption?.name || selectedOption?.code || selectedOption?.value || placeholder}
          </span>
          <ChevronDown
            size={14}
            strokeWidth={2.5}
            className={`transition-transform duration-300 text-slate-500 shrink-0 ${isOpen ? "rotate-180" : ""}`}
          />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100/85 rounded-2xl shadow-[0_12px_30px_-6px_rgba(24,37,77,0.12)] overflow-hidden z-[90] animate-pop origin-top max-h-[300px] flex flex-col">
            {searchable && (
              <div className="p-2 border-b border-slate-100 sticky top-0 bg-white z-10">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Escape') setIsOpen(false); }}
                    autoFocus
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#18254D]/5 focus:border-[#18254D]/30"
                  />
                </div>
              </div>
            )}
            <div ref={listRef} className="overflow-y-auto max-h-[200px] p-1 space-y-0.5">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-3 text-xs text-slate-400 text-center italic">No results found</div>
              ) : (
                filteredOptions.map((opt, idx) => {
                  const optionValue = opt.code || opt.name || opt.value;
                  const isActive = optionValue === value;
                  const isSelected = idx === selectedIndex;
                  return (
                    <button
                      key={`${label}-${optionValue}`}
                      data-index={idx}
                      type="button"
                      onClick={() => { onChange(optionValue); setIsOpen(false); setSelectedIndex(-1); setSearchQuery(""); }}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full text-left px-4 py-2.5 text-xs font-semibold transition-all rounded-lg flex items-center justify-between ${
                        isActive ? "bg-[#18254D] text-white shadow-sm" : isSelected ? "bg-slate-100 text-[#18254D]" : "text-[#18254D] hover:bg-slate-50"
                      }`}
                    >
                      <span>{opt.name || opt.code || opt.value}</span>
                      {isActive && <Check size={14} strokeWidth={3} />}
                    </button>
                  );
                })
              )}
            </div>
            {searchable && (
              <div className="px-3 py-2 text-[10px] text-slate-400 border-t border-slate-100 bg-slate-50/50">
                Use ↑↓ to navigate, Enter to select
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
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
      default: return "bg-green-500";
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
  client,
  onBack,
  onUpdateClient,
  onAddActivity,
  activities,
  followUps = [],
  onAddFollowUp,
  initialTab = "overview",
  onSelectProject,
  projects = [],
  onDismissLead,
  onRestoreLead,
  onToggleStatus,
  onOnboardClient,
  clients = [],
}) => {
  const isLead = client.status === "Lead" || client.status === "Dismissed";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isLeadConvOpen, setIsLeadConvOpen] = useState(true);

  const clientId = getClientId(client);
  const leadId = client?.lead_id || client?.id || client?._id;
  const orgName = getOrganisationName(client);

  // ── Onboard Modal State ──────────────────────────────────────────────────────
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedExistingClientId, setSelectedExistingClientId] = useState(null);
  const [existingClientSearch, setExistingClientSearch] = useState("");
  const [isExistingClientDropdownOpen, setIsExistingClientDropdownOpen] = useState(false);
  const [isOnboardClientStatusDropdownOpen, setIsOnboardClientStatusDropdownOpen] = useState(false);
  const [isOnboardCategoryDropdownOpen, setIsOnboardCategoryDropdownOpen] = useState(false);
  const [isOnboardStatusDropdownOpen, setIsOnboardStatusDropdownOpen] = useState(false);
  const [isOnboardPriorityDropdownOpen, setIsOnboardPriorityDropdownOpen] = useState(false);

  // ── Edit Follow-Up Modal State ───────────────────────────────────────────────
  const [showEditFollowUpModal, setShowEditFollowUpModal] = useState(false);
  const [editingFollowUp, setEditingFollowUp] = useState(null);
  const [editFollowUpFormData, setEditFollowUpFormData] = useState({
    title: "", description: "", followup_date: "",
    timeHour: "12", timeMinute: "00", timePeriod: "PM",
    priority: "Medium", followup_mode: "Call",
    followup_status: "Pending", projectId: "",
  });

  const [onboardingData, setOnboardingData] = useState({
    name: client.name || "",
    email: client.email || "",
    phone: client.phone || "",
    organisationName: client.organisationName || client.organization || client.company || "",
    website: client.website || "",
    clientType: "New",
    status: "Active",
    projectName: "",
    projectStatus: "In Progress",
    projectCategory: client.projectCategory || 1,
    projectPriority: "High",
    projectDescription: "",
    projectBudget: "",
    country: client.country || "India",
    state: client.state || "",
    currency: client.currency || "INR",
    clientStatus: "Active",
    onboardingDate: new Date().toISOString().split("T")[0],
    deadline: "",
    scopeDocument: null,
  });

  const handleOnboardSubmit = async (e) => {
    e.preventDefault();
    if (onboardingData.clientType === "Existing") {
      if (!selectedExistingClientId) {
        toast.error("Please select an existing client.");
        return;
      }
      const isValid = validateForm(onboardingData, {
        projectName:        { required: true, label: "Project Name" },
        projectDescription: { required: true, label: "Project Description" },
        projectCategory:    { required: true, label: "Project Category" },
        projectStatus:      { required: true, label: "Project Status" },
        projectPriority:    { required: true, label: "Project Priority" },
        projectBudget:      { required: true, type: "number", label: "Project Budget" },
        onboardingDate:     { required: true, label: "Onboarding Date" },
        deadline:           { required: true, label: "Deadline" },
        scopeDocument:      { required: true, label: "Scope Document" },
      });
      if (!isValid) return;
    } else {
      const isValid = validateForm(onboardingData, {
        name:               { required: true, minLength: 2, label: "Full Name" },
        email:              { required: true, pattern: /^\S+@\S+\.\S+$/, label: "Email" },
        phone:              { required: true, minLength: 10, label: "Phone Number" },
        organisationName:   { required: true, label: "Organisation Name" },
        country:            { required: true, label: "Client Country" },
        state:              { required: false, label: "Client State" },
        currency:           { required: true, label: "Client Currency" },
        clientStatus:       { required: true, label: "Client Status" },
        projectName:        { required: true, label: "Project Name" },
        projectDescription: { required: true, label: "Project Description" },
        projectCategory:    { required: true, label: "Project Category" },
        projectStatus:      { required: true, label: "Project Status" },
        projectPriority:    { required: true, label: "Project Priority" },
        projectBudget:      { required: true, type: "number", label: "Project Budget" },
        onboardingDate:     { required: true, label: "Onboarding Date" },
        deadline:           { required: true, label: "Deadline" },
        scopeDocument:      { required: true, label: "Scope Document" },
      });
      if (!isValid) return;
    }
    setIsSubmitting(true);
    try {
      if (onOnboardClient) {
        const dataToPass = { ...onboardingData };
        if (onboardingData.clientType === "Existing") {
          dataToPass.existingClientId = selectedExistingClientId;
        }
        await onOnboardClient(leadId, dataToPass);
        toast.success("Lead converted successfully");
        setShowOnboardModal(false);
        setOnboardingData({
          name: "", email: "", phone: "",
          organisationName: "", website: "",
          clientType: "New", status: "Active",
          projectName: "", projectStatus: "In Progress",
          projectCategory: 1, projectPriority: "High",
          projectDescription: "", projectBudget: "",
          country: "India", state: "", currency: "INR",
          clientStatus: "Active",
          onboardingDate: new Date().toISOString().split("T")[0],
          deadline: "", scopeDocument: null,
        });
        setSelectedExistingClientId(null);
        setExistingClientSearch("");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to convert lead");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Edit Modal State ─────────────────────────────────────────────────────────
  const [editFormData, setEditFormData] = useState({
    name: "", email: "", phone: "", countryCode: "", leadType: "Warm",
    notes: "", website: "", projectCategory: 1, country: "India",
    state: "", currency: "INR", organisationName: "", clientStatus: "Active",
  });
  const [showEditModal, setShowEditModal] = useState(false);

  // ── Completion Modal State ───────────────────────────────────────────────────
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showAddAnotherPrompt, setShowAddAnotherPrompt] = useState(false);
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

  // ── Activity / Follow-up State ───────────────────────────────────────────────
  const [logData, setLogData] = useState({
    type: "call", description: "", projectId: "",
    date: new Date().toISOString().split("T")[0],
    time: new Date().toTimeString().split(" ")[0].substring(0, 5),
  });
  const [clientFollowUps, setClientFollowUps] = useState([]);
  const [isLogging, setIsLogging] = useState(false);
  const [expandedProjectIndex, setExpandedProjectIndex] = useState(0);
  const [showAddFollowUpModal, setShowAddFollowUpModal] = useState(false);
  const [followUpFormData, setFollowUpFormData] = useState({
    title: "", description: "", followup_date: new Date().toLocaleDateString("en-CA"),
    timeHour: "12", timeMinute: "00", timePeriod: "PM", priority: "Medium",
    followup_mode: "Call", followup_status: "Pending", projectId: "",
  });

  useScrollLock(
    showEditModal || showAddFollowUpModal || isLogging ||
    showCompletionModal || showOnboardModal || showEditFollowUpModal || showAddAnotherPrompt
  );

  useEffect(() => setActiveTab(initialTab), [initialTab]);

  useEffect(() => {
    if (showEditModal && client) {
      const dialCode = client.country_code || "";
      const phone = client.phone || "";
      const countryName = client.country || "";
      setEditFormData({
        name: client.name || "",
        email: client.email || "",
        phone: phone,
        countryCode: dialCode.startsWith('+') ? dialCode.slice(1) : dialCode,
        leadType: client.leadType || "Hot",
        notes: client.notes || "",
        website: client.website || "",
        projectCategory: client.projectCategory || REVERSE_CATEGORY_MAP[client.industry] || 1,
        country: countryName,
        state: client.state || "",
        currency: client.currency || "",
        organisationName: getOrganisationName(client),
        clientStatus: client.clientStatus || "Active",
      });
    }
  }, [showEditModal, client]);

  useEffect(() => {
    if (client && clientId) fetchClientFollowups();
  }, [client, clientId]);

  const fetchClientFollowups = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/client-followups/${clientId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (response.ok) {
        const data = await response.json();
        setClientFollowUps(data);
      }
    } catch (error) {
      console.error("Error fetching client followups:", error);
    }
  };

  const handleAddFollowUpSubmit = async (e) => {
    e.preventDefault();
    if (!followUpFormData.title || !followUpFormData.description) {
      toast.error("Please fill in title and description"); return;
    }
    let hour = parseInt(followUpFormData.timeHour);
    if (followUpFormData.timePeriod === "PM" && hour < 12) hour += 12;
    if (followUpFormData.timePeriod === "AM" && hour === 12) hour = 0;
    const time24 = `${hour.toString().padStart(2, "00")}:${followUpFormData.timeMinute}`;
    const combinedDateTime = `${followUpFormData.followup_date} ${time24}:00`;
    const finalClientId = followUpFormData.projectId ? null : (!isLead && client.lead_id ? client.lead_id : clientId);
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
      console.error("Error adding follow-up:", error);
      toast.error("Failed to add follow-up");
    }
  };

const handleEditFollowUpSubmit = async (e) => {
  e.preventDefault();
  if (!editFollowUpFormData.title || !editFollowUpFormData.description) {
    toast.error("Please fill in title and description");
    return;
  }

  const followUpId = editingFollowUp?.id || editingFollowUp?._id;
  if (!followUpId) {
    toast.error("Follow-up ID is missing. Please try again.");
    console.error("editingFollowUp has no id:", editingFollowUp);
    return;
  }

  let hour = parseInt(editFollowUpFormData.timeHour);
  if (editFollowUpFormData.timePeriod === "PM" && hour < 12) hour += 12;
  if (editFollowUpFormData.timePeriod === "AM" && hour === 12) hour = 0;
  const time24 = `${hour.toString().padStart(2, "0")}:${editFollowUpFormData.timeMinute}`;
  const combinedDateTime = `${editFollowUpFormData.followup_date} ${time24}:00`;

  // ✅ Normalize mode to match backend enum exactly: "Whatsapp" not "WhatsApp"
  const normalizeMode = (mode) => {
    if (!mode) return "Call";
    const map = {
      "whatsapp": "Whatsapp",
      "call": "Call",
      "email": "Email",
      "meeting": "Meeting",
    };
    return map[mode.toLowerCase()] || mode;
  };

  try {
    // ✅ Correct endpoint: /api/followups/:id (not /api/client-followups/:id)
    const response = await fetch(
      `${BASE_URL}/api/update-followup/${followUpId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          title: editFollowUpFormData.title,
          description: editFollowUpFormData.description,
          followup_date: combinedDateTime,
          dueDate: combinedDateTime,
          followup_mode: normalizeMode(editFollowUpFormData.followup_mode),
          followup_status: editFollowUpFormData.followup_status,
          priority: editFollowUpFormData.priority,
          projectId: editFollowUpFormData.projectId || null,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Server error:", errorText);
      throw new Error("Failed to update");
    }

    toast.success("Follow-up updated successfully");
    setShowEditFollowUpModal(false);
    setEditingFollowUp(null);
    fetchClientFollowups();
  } catch (error) {
    console.error(error);
    toast.error("Failed to update follow-up");
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
        clientId: clientId, type: logData.type, description: logData.description,
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
    } catch (error) {
      toast.error("Could not sync with Google Calendar.");
    }
  };

  const toggleProject = (idx) => setExpandedProjectIndex((prev) => (prev === idx ? null : idx));

  const clientProjects = projects.filter((p) => p.clientId == clientId);
  const clientProjectIds = clientProjects.map((p) => p.id);
  const clientActivities = activities.filter(a =>
    a.clientId == clientId ||
    (client.lead_id && a.clientId == client.lead_id) ||
    clientProjectIds.includes(a.projectId || a.project_id)
  );

  const completedFollowUps = [
    ...followUps.filter((f) =>
      f.clientId == clientId ||
      (client.lead_id && f.clientId == client.lead_id) ||
      clientProjectIds.includes(f.projectId || f.project_id)
    ),
    ...clientFollowUps
  ].filter((f, index, self) =>
    (f.status === "completed" || f.followup_status === "completed") &&
    index === self.findIndex((t) => t.id === f.id)
  );

  const upcomingFollowUps = [
    ...followUps.filter((f) =>
      f.clientId == clientId ||
      (client.lead_id && f.clientId == client.lead_id) ||
      clientProjectIds.includes(f.projectId || f.project_id)
    ),
    ...clientFollowUps
  ].filter((f, index, self) =>
    f.status?.toLowerCase() !== "completed" &&
    f.followup_status?.toLowerCase() !== "completed" &&
    index === self.findIndex((t) => t.id === f.id)
  ).sort((a, b) => {
    const diff = parseLocalDate(a.followup_date || a.dueDate) - parseLocalDate(b.followup_date || b.dueDate);
    if (diff !== 0) return diff;
    const priorityMap = { 'High': 1, 'Medium': 2, 'Low': 3 };
    return (priorityMap[a.priority] || 4) - (priorityMap[b.priority] || 4);
  });

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  const overdueFUs = upcomingFollowUps.filter(f => parseLocalDate(f.followup_date || f.dueDate) < todayStart);
  const todayFUs = upcomingFollowUps.filter(f => {
    const d = parseLocalDate(f.followup_date || f.dueDate);
    return d >= todayStart && d < tomorrowStart;
  });
  const futureFUs = upcomingFollowUps.filter(f => parseLocalDate(f.followup_date || f.dueDate) >= tomorrowStart);

  const scrollContainer = (id, dir) => {
    const container = document.getElementById(id);
    if (container) {
      const scrollAmount = container.clientWidth;
      container.scrollBy({ left: dir === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full h-full relative space-y-6 pb-12">

      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-white hover:shadow-md bg-white rounded-full text-slate-500 hover:text-slate-900 transition-colors shrink-0"
              >
                <ArrowLeft className="w-5 h-5" strokeWidth={2} />
              </button>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-xl shadow-sm shrink-0">
                  {client.name?.charAt(0).toUpperCase() || "?"}
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight leading-tight capitalize">
                    {client.name}
                  </h1>
                  <p className="text-sm font-medium text-slate-500 flex items-center gap-2">
                    {isLead
                      ? (client.company && <span>{client.company}</span>)
                      : (<span>{client.projectName || orgName || "Global Project"}</span>)
                    }
                    <span className="w-1 h-1 rounded-full bg-slate-300 inline-block" />
                    <span className="text-slate-400">{isLead ? "Lead" : "Client"}</span>
                  </p>
                </div>
              </div>
            </div>

<div className="flex items-center gap-2.5">
  {/* Edit Button */}
  <button
    onClick={() => setShowEditModal(true)}
    className="w-11 h-11 flex items-center justify-center bg-white border border-slate-200 rounded-2xl text-slate-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/60 transition-all shadow-sm hover:shadow-md active:scale-95 group"
    title="Edit"
  >
    <Pencil size={17} strokeWidth={1.8} className="group-hover:scale-110 transition-transform duration-200" />
  </button>

  {client.status !== "Dismissed" ? (
    /* Dismiss Button */
    <button
      onClick={() => {
        if (isLead) { onDismissLead && onDismissLead(leadId); }
        else { onUpdateClient && onUpdateClient(clientId, { ...client, status: "Dismissed", clientStatus: "Dismissed",  organisationName:
      client.organisationName ||
      client.organization ||
      client.organisation_name ||
      client.client_organisation ||
      client.org_name ||
      client.business_name ||
      client.company ||
      "", }); }
      }}
      className="w-11 h-11 flex items-center justify-center bg-white border border-slate-200 rounded-2xl text-red-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50/60 transition-all shadow-sm hover:shadow-md active:scale-95 group"
      title="Dismiss"
    >
      <UserX size={17} strokeWidth={1.8} className="group-hover:scale-110 transition-transform duration-200" />
    </button>
  ) : (
    /* Restore Button */
    <button
      onClick={() => onRestoreLead && onRestoreLead(leadId)}
      className="w-11 h-11 flex items-center justify-center bg-white border border-slate-200 rounded-2xl text-blue-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50/60 transition-all shadow-sm hover:shadow-md active:scale-95 group"
      title="Restore"
    >
      <RotateCcw size={17} strokeWidth={1.8} className="group-hover:scale-110 transition-transform duration-200" />
    </button>
  )}
</div>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {/* Pill container */}
            <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60 shadow-inner">
              {[
                { id: "overview",  label: "Overview",       icon: <Target size={14}/>      },
                { id: "activity",  label: "Conversations",  icon: <MessageSquare size={14}/> },
                ...(!isLead ? [{ id: "projects", label: "Projects", icon: <Briefcase size={14}/> }] : []),
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      relative flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-bold
                      whitespace-nowrap transition-all duration-200 outline-none
                      ${isActive
                        ? "bg-white text-[#18254D] shadow-sm border border-slate-200/80"
                        : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                      }
                    `}
                  >
                    {/* Icon with color shift */}
                    <span className={`transition-colors duration-200 ${isActive ? "text-[#18254D]" : "text-slate-400"}`}>
                      {tab.icon}
                    </span>
                    {tab.label}

                    {/* Active dot indicator */}
                    {isActive && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#18254D] rounded-full border-2 border-slate-100 shadow-sm" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

      {/* Main Content Area */}
      <div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-5">Contact Information</h3>
              <div className="space-y-4">
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

          {/* Right Content */}
          <div className="lg:col-span-8 space-y-6">

            {activeTab === "overview" && (
              <div className="space-y-8 animate-fade-in">
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
                      {client.status !== "Dismissed" && (
                        <div className="col-span-1 sm:col-span-2 bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Quick Actions</p>
                            <p className="text-sm font-medium text-slate-600">Manage next steps for this lead</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-3">
                            <button
                              onClick={() => setShowAddFollowUpModal(true)}
                              className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-xl font-semibold transition-colors text-sm"
                            >
                              <Bell size={18} /> Add Follow Up
                            </button>
                            <button
                              onClick={() => setShowOnboardModal(true)}
                              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl font-semibold transition-colors text-sm shadow-sm"
                            >
                              <UserCheck size={18} /> Convert to Client
                            </button>
                          </div>
                        </div>
                      )}
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

                {/* Upcoming Follow-ups */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Clock size={20} className="text-slate-500" /> Upcoming Follow-ups
                    </h2>
                  </div>
                  <div className="space-y-6">
                    {[
                      { title: "Overdue", icon: <Bell size={16} />, tasks: overdueFUs, style: "text-red-600 bg-red-50 border-red-200" },
                      { title: "Today",   icon: <Clock size={16} />, tasks: todayFUs,  style: "text-amber-600 bg-amber-50 border-amber-200" },
                      { title: "Upcoming",icon: <Calendar size={16} />, tasks: futureFUs, style: "text-blue-600 bg-blue-50 border-blue-200" }
                    ].map((section) => section.tasks.length > 0 && (
                      <div key={section.title}>
                        <div className="flex items-center gap-3 mb-4">
                          <div className={`p-1.5 rounded-lg border ${section.style}`}>{section.icon}</div>
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
                                      {/* Edit Button */}
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const fuDate = parseLocalDate(fu.followup_date || fu.dueDate);
                                          let hours = fuDate.getHours();
                                          const period = hours >= 12 ? "PM" : "AM";
                                          hours = hours % 12 || 12;
                                          const normalize = (str) =>
                                            str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "";
                                          setEditingFollowUp(fu);
                                          setEditFollowUpFormData({
                                            title: fu.title || "",
                                            description: fu.description || "",
                                            followup_date: fuDate.toLocaleDateString("en-CA"),
                                            timeHour: String(hours),
                                            timeMinute: String(fuDate.getMinutes()).padStart(2, "0"),
                                            timePeriod: period,
                                            priority: normalize(fu.priority) || "Medium",
                                            followup_mode: normalize(fu.followup_mode) || "Call",
                                            followup_status: normalize(fu.followup_status || fu.status) || "Pending",
                                            projectId: fu.projectId || fu.project_id || "",
                                          });
                                          setShowEditFollowUpModal(true);
                                        }}
                                        className="p-2 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-slate-500 hover:text-blue-600 rounded-lg transition-colors"
                                        title="Edit Follow-up"
                                      >
                                        <Pencil size={18} />
                                      </button>
                                      {/* Complete Button */}
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const now = new Date();
                                          setCompletionDate(now.toLocaleDateString("en-CA"));
                                          setCompletionHour((now.getHours() % 12 || 12).toString());
                                          setCompletionMinute(now.getMinutes().toString().padStart(2, "0"));
                                          setCompletionPeriod(now.getHours() >= 12 ? "PM" : "AM");
                                          setCompletingFollowUpId(fu.id);
                                          setCompletionBrief("");
                                          setShowCompletionModal(true);
                                        }}
                                        className="p-2 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 text-slate-500 hover:text-emerald-600 rounded-lg transition-colors"
                                        title="Mark as Completed"
                                      >
                                        <CheckCircle2 size={18} />
                                      </button>
                                      {/* Calendar Button */}
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
                  (() => {
                    const leadConversations = [
                      ...completedFollowUps.map(fu => ({
                        ...fu, source: "followup",
                        originalDescription: fu.description,
                        description: fu.follow_brief || "No summary provided",
                        completedBy: fu.completed_by
                      })),
                      ...clientActivities.map(a => ({ ...a, source: "activity", originalDescription: null }))
                    ].sort((a, b) =>
                      parseLocalDate(b.date || b.completed_at || b.dueDate || b.created_at || b.createdAt) -
                      parseLocalDate(a.date || a.completed_at || a.dueDate || a.created_at || a.createdAt)
                    );
                    return (
                      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div
                          className="flex items-center justify-between p-5 bg-slate-50 border-b border-slate-200 cursor-pointer"
                          onClick={() => setIsLeadConvOpen(!isLeadConvOpen)}
                        >
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
                  (() => {
                    const projectGroups = clientProjects.map((p) => ({
                      id: p.id, projectName: p.name, projectStatus: p.status, interactions: [],
                    }));
                    const generalInteractions = [];
                    const leadHistoryInteractions = [];

                    const addToGroup = (interaction) => {
                      const targetProject = projectGroups.find((p) =>
                        (interaction.projectId && p.id == interaction.projectId) ||
                        (interaction.projectName && p.projectName === interaction.projectName)
                      );
                      if (targetProject) targetProject.interactions.push(interaction);
                      else if (client.lead_id && interaction.clientId == client.lead_id) leadHistoryInteractions.push(interaction);
                      else generalInteractions.push(interaction);
                    };

                    clientActivities.forEach((a) => addToGroup({ ...a, source: "activity" }));
                    completedFollowUps.forEach((f) => addToGroup({
                      ...f, id: `fu-${f.id}`,
                      type: (f.followup_mode || "call").toLowerCase(),
                      date: f.completed_at || f.dueDate,
                      description: f.follow_brief || "No summary provided",
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
                              <div
                                className="flex items-center justify-between p-5 bg-slate-50 border-b border-slate-200 cursor-pointer"
                                onClick={() => toggleProject(groupIdx)}
                              >
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
                                        .sort((a, b) =>
                                          parseLocalDate(b.date || b.completed_at || b.dueDate || b.created_at || b.createdAt) -
                                          parseLocalDate(a.date || a.completed_at || a.dueDate || a.created_at || a.createdAt)
                                        )
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

      {/* ══════════════════════ MODALS ══════════════════════ */}

      {/* Edit Modal */}
      {showEditModal && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[99999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="absolute inset-0" onClick={() => setShowEditModal(false)} />
          <div className="relative z-10 bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-pop flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center border border-blue-100 shadow-sm">
                  <Pencil size={16} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#18254D] tracking-tight">Edit {isLead ? "Lead" : "Client"}</h3>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-0.5">Update Details</p>
                </div>
              </div>
              <button onClick={() => setShowEditModal(false)} className="p-1.5 hover:bg-slate-200 rounded-xl text-slate-400 transition-all">
                <X size={18} />
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!clientId) { toast.error('Client ID is missing. Please refresh the page.'); return; }
                const validationRules = isLead
                  ? {
                      name: { required: true, minLength: 2, label: "Full Name" },
                      email: { required: true, pattern: /^\S+@\S+\.\S+$/, label: "Email" },
                      phone: { required: true, minLength: 10, label: "Phone Number" },
                      countryCode: { required: true, label: "Country Code" },
                    }
                  : {
                      name: { required: true, minLength: 2, label: "Client Name" },
                      organisationName: { required: true, minLength: 2, label: "Organisation Name" },
                    };
                const isValid = validateForm(editFormData, validationRules);
                if (!isValid) return;
                try {
                  await onUpdateClient(clientId, editFormData);
                  setShowEditModal(false);
                  toast.success(`${isLead ? "Lead" : "Client"} updated successfully`);
                } catch (error) {
                  toast.error(error.message || "Failed to update details");
                }
              }}
              className="p-6 space-y-4 overflow-y-auto no-scrollbar"
            >
              {isLead && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Full Name <span className="text-rose-500">*</span></label>
                    <input required type="text" placeholder="e.g. Sameer Kapoor" className="w-full px-4 py-2.5 bg-white border border-slate-200/70 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200 shadow-sm" value={editFormData.name} onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Email <span className="text-rose-500">*</span></label>
                    <input required type="email" placeholder="e.g. sameer@fintech.com" className="w-full px-4 py-2.5 bg-white border border-slate-200/70 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200 shadow-sm" value={editFormData.email} onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Dropdown
                      label="Country Code" required searchable
                      options={countries.map((c) => ({ name: `${c.name} (${c.code})`, code: c.code }))}
                      value={editFormData.countryCode}
                      onChange={(val) => {
                        const selectedCountry = countries.find((c) => c.code === val);
                        setEditFormData({ ...editFormData, countryCode: val, country: selectedCountry ? selectedCountry.name : editFormData.country });
                      }}
                      placeholder="Search country..."
                    />
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Phone Number <span className="text-rose-500">*</span></label>
                      <input required type="tel" placeholder="e.g. 9876543210" className="w-full px-4 py-2.5 bg-white border border-slate-200/70 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200 shadow-sm" value={editFormData.phone} onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value.replace(/\D/g, "") })} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Website URL (Optional)</label>
                    <input type="text" placeholder="e.g. www.company.com" className="w-full px-4 py-2.5 bg-white border border-slate-200/70 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200 shadow-sm" value={editFormData.website} onChange={(e) => setEditFormData({ ...editFormData, website: e.target.value })} />
                  </div>
                  <Dropdown
                    label="Lead Status"
                    options={[{ name: "Hot", value: "Hot" }, { name: "Warm", value: "Warm" }, { name: "Cold", value: "Cold" }]}
                    value={editFormData.leadType}
                    onChange={(val) => setEditFormData({ ...editFormData, leadType: val })}
                    placeholder="Select Status"
                  />
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Note / Message</label>
                    <textarea rows={3} value={editFormData.notes} onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-slate-200/70 rounded-xl resize-none text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200 shadow-sm" />
                  </div>
                </>
              )}
              {!isLead && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Organisation Name <span className="text-rose-500">*</span></label>
                    <input type="text" required value={editFormData.organisationName} onChange={(e) => setEditFormData({ ...editFormData, organisationName: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-slate-200/70 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200 shadow-sm" placeholder="Acme Technologies" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Client Name <span className="text-rose-500">*</span></label>
                    <input type="text" required value={editFormData.name} onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-slate-200/70 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200 shadow-sm" placeholder="John Doe" />
                  </div>
                  <Dropdown label="Client Country" searchable options={countries.map((c) => ({ name: c.name, code: c.name }))} value={editFormData.country} onChange={(val) => setEditFormData({ ...editFormData, country: val })} placeholder="Search country..." />
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Client State</label>
                    <input type="text" value={editFormData.state} onChange={(e) => setEditFormData({ ...editFormData, state: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-slate-200/70 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200 shadow-sm" placeholder="State" />
                  </div>
                  <Dropdown label="Client Currency" searchable options={commonCurrencies.map((c) => ({ name: `${c.code} (${c.symbol})`, code: c.code }))} value={editFormData.currency} onChange={(val) => setEditFormData({ ...editFormData, currency: val })} placeholder="Search currency..." />
                  <Dropdown label="Client Status" options={[{ name: "Active", value: "Active" }, { name: "Inactive", value: "Inactive" }]} value={editFormData.clientStatus} onChange={(val) => setEditFormData({ ...editFormData, clientStatus: val })} placeholder="Select Status" />
                </>
              )}
              <div className="pt-2">
                <button type="submit" className="w-full h-12 bg-[#18254D] text-white rounded-xl text-xs font-bold tracking-wider shadow-lg active:scale-[0.97] transition-all hover:bg-[#1e2e5e] hover:shadow-xl flex items-center justify-center gap-2 btn-animated">
                  <Send size={14} strokeWidth={2.5} className="rotate-[-45deg]" />
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
                  <input required type="time" className="w-full px-4 py-3 bg-white border border-slate-200/70 rounded-xl focus:ring-2 focus:ring-[#18254D]/5 focus:outline-none text-sm font-medium shadow-sm" value={logData.time} onChange={(e) => setLogData({ ...logData, time: e.target.value })} />
                </div>
              </div>
              {!isLead && (
                <Dropdown
                  label="Project Name" required
                  options={clientProjects.length > 0
                    ? clientProjects.map((project) => ({ name: project.name, value: project.id }))
                    : [
                        { name: "Website Redesign", value: "Website Redesign" },
                        { name: "SEO Optimization", value: "SEO Optimization" },
                        { name: "Brand Identity", value: "Brand Identity" },
                      ]}
                  value={logData.projectId}
                  onChange={(val) => setLogData({ ...logData, projectId: val })}
                  placeholder="Select project..."
                />
              )}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Interaction Type</label>
                <div className="grid grid-cols-3 gap-3">
                  {["call", "email", "meeting"].map((type) => (
                    <button key={type} type="button" onClick={() => setLogData({ ...logData, type: type })} className={`py-3 px-4 rounded-xl border text-sm font-bold uppercase tracking-wider transition-all ${logData.type === type ? "bg-[#18254D] border-[#18254D] text-white shadow-md" : "bg-white border-slate-200 text-slate-500 hover:border-slate-400"}`}>
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Conversation Details</label>
                <textarea required placeholder="Discussed new service package..." className="w-full px-4 py-3 bg-white border border-slate-200/70 rounded-xl focus:ring-2 focus:ring-[#18254D]/5 focus:outline-none text-sm font-medium min-h-[120px] resize-none shadow-sm" value={logData.description} onChange={(e) => setLogData({ ...logData, description: e.target.value })} />
              </div>
              <div className="pt-4 shrink-0">
                <button type="submit" className="w-full py-4 bg-[#18254D] text-white rounded-xl text-sm font-bold tracking-wide shadow-md active:scale-[0.98] transition-transform hover:bg-[#1e2e5e]">
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[99999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="absolute inset-0" onClick={() => setShowCompletionModal(false)} />
          <div className="relative z-10 bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-pop flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center border border-emerald-100 shadow-sm">
                  <CheckCircle2 size={16} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#18254D] tracking-tight">Mark as Completed</h3>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-0.5">Follow-up Conclusion</p>
                </div>
              </div>
              <button onClick={() => setShowCompletionModal(false)} className="p-1.5 hover:bg-slate-200 rounded-xl text-slate-400 transition-all">
                <X size={18} />
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                let compHour = parseInt(completionHour || "12");
                if (completionPeriod === "PM" && compHour < 12) compHour += 12;
                if (completionPeriod === "AM" && compHour === 12) compHour = 0;
                const compTime24 = `${compHour.toString().padStart(2, "00")}:${completionMinute || "00"}`;
                const combinedCompletionStr = `${completionDate} ${compTime24}:00`;
                if (onToggleStatus) {
                  await onToggleStatus(completingFollowUpId, completionBrief, combinedCompletionStr, completedBy);
                  fetchClientFollowups();
                }
                setShowCompletionModal(false);
                setShowAddAnotherPrompt(true);
              }}
              className="p-6 space-y-4 overflow-y-auto no-scrollbar"
            >
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Follow Conclusion Brief</label>
                <textarea rows={3} placeholder="Update the conclusion brief..." className="w-full px-4 py-2.5 bg-white border border-slate-200/70 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200 resize-none shadow-sm" value={completionBrief} onChange={(e) => setCompletionBrief(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Completed By</label>
                <input type="text" placeholder="e.g. John Doe" className="w-full px-4 py-2.5 bg-white border border-slate-200/70 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200 shadow-sm" value={completedBy} onChange={(e) => setCompletedBy(e.target.value)} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Completion Date</label>
                  <DatePicker value={completionDate} onChange={setCompletionDate} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Completion Time</label>
                  <div className="flex gap-2">
                    <Dropdown options={Array.from({ length: 12 }, (_, i) => i + 1).map((h) => ({ name: String(h).padStart(2, "0"), value: String(h).padStart(2, "0") }))} value={completionHour} onChange={setCompletionHour} placeholder="Hour" />
                    <Dropdown options={Array.from({ length: 60 }, (_, i) => ({ name: String(i).padStart(2, "0"), value: String(i).padStart(2, "0") }))} value={completionMinute} onChange={setCompletionMinute} placeholder="Min" />
                    <Dropdown options={[{ name: "AM", value: "AM" }, { name: "PM", value: "PM" }]} value={completionPeriod} onChange={setCompletionPeriod} placeholder="AM/PM" />
                  </div>
                </div>
              </div>
              <div className="pt-2">
                <button type="submit" className="w-full h-12 bg-[#18254D] text-white rounded-xl text-xs font-bold tracking-wider shadow-lg active:scale-[0.97] transition-all hover:bg-[#1e2e5e] hover:shadow-xl flex items-center justify-center gap-2 btn-animated">
                  <CheckCircle2 size={14} strokeWidth={2.5} />
                  Confirm Completion
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Add Another Prompt */}
      {showAddAnotherPrompt && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[99999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-pop text-center">
            <h3 className="text-lg font-bold text-[#18254D] mb-2">Follow-up Completed</h3>
            <p className="text-sm text-slate-500 mb-6">Want to add another follow up or close?</p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAddAnotherPrompt(false);
                  setCompletingFollowUpId(null);
                  setCompletionBrief("");
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowAddAnotherPrompt(false);
                  setCompletingFollowUpId(null);
                  setCompletionBrief("");
                  setFollowUpFormData({
                    title: "", description: "", followup_date: new Date().toLocaleDateString("en-CA"),
                    timeHour: "12", timeMinute: "00", timePeriod: "PM", priority: "Medium",
                    followup_mode: "Call", followup_status: "Pending", projectId: "",
                  });
                  setShowAddFollowUpModal(true);
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#18254D] text-white font-semibold text-sm hover:bg-[#1e2e5e] transition-colors"
              >
                Add Another
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Add Follow-up Modal */}
      {showAddFollowUpModal && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[99999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="absolute inset-0" onClick={() => setShowAddFollowUpModal(false)} />
          <div className="relative z-10 bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-pop flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-teal-50 text-teal-500 rounded-xl flex items-center justify-center border border-teal-100 shadow-sm">
                  <Plus size={16} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#18254D] tracking-tight">Add Follow-Up</h3>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-0.5">Create New Task</p>
                </div>
              </div>
              <button onClick={() => setShowAddFollowUpModal(false)} className="p-1.5 hover:bg-slate-200 rounded-xl text-slate-400 transition-all">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddFollowUpSubmit} className="p-6 space-y-4 overflow-y-auto no-scrollbar">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Title <span className="text-rose-500">*</span></label>
                <input required type="text" value={followUpFormData.title} onChange={(e) => setFollowUpFormData({ ...followUpFormData, title: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-slate-200/70 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200 shadow-sm" placeholder="Follow-up with client" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Description <span className="text-rose-500">*</span></label>
                <textarea required rows={3} value={followUpFormData.description} onChange={(e) => setFollowUpFormData({ ...followUpFormData, description: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-slate-200/70 rounded-xl resize-none text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200 shadow-sm" placeholder="What will you discuss?" />
              </div>
              {/* Due Date + Time */}
<div className="grid grid-cols-2 gap-4">
  <div className="space-y-1.5">
    <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">
      Due Date <span className="text-rose-500">*</span>
    </label>
    <input
      required
      type="date"
      value={followUpFormData.followup_date}
      onChange={(e) => setFollowUpFormData({ ...followUpFormData, followup_date: e.target.value })}
      className="w-full h-[42px] px-4 bg-white border border-slate-200/70 rounded-xl text-sm font-semibold text-[#18254D] focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200 shadow-sm"
    />
  </div>
  <div className="space-y-1.5">
    <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">
      Time
    </label>
    <div className="grid grid-cols-3 gap-1.5">
      <Dropdown
        options={Array.from({ length: 12 }, (_, i) => i + 1).map((h) => ({
          name: String(h).padStart(2, "0"),
          value: String(h),
        }))}
        value={followUpFormData.timeHour}
        onChange={(val) => setFollowUpFormData({ ...followUpFormData, timeHour: val })}
        placeholder="Hr"
      />
      <Dropdown
        options={Array.from({ length: 60 }, (_, i) => ({
          name: String(i).padStart(2, "0"),
          value: String(i).padStart(2, "0"),
        }))}
        value={followUpFormData.timeMinute}
        onChange={(val) => setFollowUpFormData({ ...followUpFormData, timeMinute: val })}
        placeholder="Min"
      />
      <Dropdown
        options={[
          { name: "AM", value: "AM" },
          { name: "PM", value: "PM" },
        ]}
        value={followUpFormData.timePeriod}
        onChange={(val) => setFollowUpFormData({ ...followUpFormData, timePeriod: val })}
        placeholder="AM/PM"
      />
    </div>
  </div>
</div>

{/* Priority + Mode */}
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <Dropdown
    label="Priority"
    options={[{ name: "High", value: "High" }, { name: "Medium", value: "Medium" }, { name: "Low", value: "Low" }]}
    value={followUpFormData.priority}
    onChange={(val) => setFollowUpFormData({ ...followUpFormData, priority: val })}
  />
  <Dropdown
    label="Mode"
    options={[{ name: "Call", value: "Call" }, { name: "Email", value: "Email" }, { name: "Meeting", value: "Meeting" }, { name: "WhatsApp", value: "Whatsapp" }]}
    value={followUpFormData.followup_mode}
    onChange={(val) => setFollowUpFormData({ ...followUpFormData, followup_mode: val })}
  />
</div>

{/* Status */}
<Dropdown
  label="Status"
  options={[{ name: "Pending", value: "Pending" }, { name: "Completed", value: "Completed" }]}
  value={followUpFormData.followup_status}
  onChange={(val) => setFollowUpFormData({ ...followUpFormData, followup_status: val })}
/>
              <div className="pt-2">
                <button type="submit" className="w-full h-12 bg-[#18254D] text-white rounded-xl text-xs font-bold tracking-wider shadow-lg active:scale-[0.97] transition-all hover:bg-[#1e2e5e] hover:shadow-xl flex items-center justify-center gap-2 btn-animated">
                  <Plus size={14} strokeWidth={2.5} />
                  Add Follow-Up
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ══════════════════════ EDIT FOLLOW-UP MODAL ══════════════════════ */}
      {showEditFollowUpModal && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[99999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="absolute inset-0" onClick={() => setShowEditFollowUpModal(false)} />
          <div className="relative z-10 bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-pop flex flex-col max-h-[90vh]">

            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center border border-blue-100 shadow-sm">
                  <Pencil size={16} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#18254D] tracking-tight">Edit Follow-Up</h3>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-0.5">Update Task Details</p>
                </div>
              </div>
              <button onClick={() => setShowEditFollowUpModal(false)} className="p-1.5 hover:bg-slate-200 rounded-xl text-slate-400 transition-all">
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleEditFollowUpSubmit} className="p-6 space-y-4 overflow-y-auto no-scrollbar">

              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                  Title <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={editFollowUpFormData.title}
                  onChange={(e) => setEditFollowUpFormData({ ...editFollowUpFormData, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200/70 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200 shadow-sm"
                  placeholder="Follow-up with client"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                  Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={editFollowUpFormData.description}
                  onChange={(e) => setEditFollowUpFormData({ ...editFollowUpFormData, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200/70 rounded-xl resize-none text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200 shadow-sm"
                  placeholder="What will you discuss?"
                />
              </div>

              {/* ✅ FIXED: Date + Time - clean two-column layout, no nesting, no duplication */}
              <div className="grid grid-cols-2 gap-4">
                {/* Due Date */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                    Due Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    required
                    type="date"
                    value={editFollowUpFormData.followup_date}
                    onChange={(e) =>
                      setEditFollowUpFormData({ ...editFollowUpFormData, followup_date: e.target.value })
                    }
                    className="w-full h-[42px] px-4 bg-white border border-slate-200/70 rounded-xl text-sm font-semibold text-[#18254D] focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200 shadow-sm"
                  />
                </div>

                {/* Time — using Dropdown without label prop so no internal label renders */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                    Time
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <Dropdown
                      options={Array.from({ length: 12 }, (_, i) => i + 1).map((h) => ({
                        name: String(h).padStart(2, "0"),
                        value: String(h),
                      }))}
                      value={editFollowUpFormData.timeHour}
                      onChange={(val) =>
                        setEditFollowUpFormData({ ...editFollowUpFormData, timeHour: val })
                      }
                      placeholder="Hr"
                    />
                    <Dropdown
                      options={Array.from({ length: 60 }, (_, i) => ({
                        name: String(i).padStart(2, "0"),
                        value: String(i).padStart(2, "0"),
                      }))}
                      value={editFollowUpFormData.timeMinute}
                      onChange={(val) =>
                        setEditFollowUpFormData({ ...editFollowUpFormData, timeMinute: val })
                      }
                      placeholder="Min"
                    />
                    <Dropdown
                      options={[
                        { name: "AM", value: "AM" },
                        { name: "PM", value: "PM" },
                      ]}
                      value={editFollowUpFormData.timePeriod}
                      onChange={(val) =>
                        setEditFollowUpFormData({ ...editFollowUpFormData, timePeriod: val })
                      }
                      placeholder="AM/PM"
                    />
                  </div>
                </div>
              </div>

              {/* Priority + Mode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Dropdown
                  label="Priority"
                  options={[
                    { name: "High", value: "High" },
                    { name: "Medium", value: "Medium" },
                    { name: "Low", value: "Low" },
                  ]}
                  value={editFollowUpFormData.priority}
                  onChange={(val) => setEditFollowUpFormData({ ...editFollowUpFormData, priority: val })}
                />
                <Dropdown
                  label="Mode"
                  options={[
                    { name: "Call", value: "Call" },
                    { name: "Email", value: "Email" },
                    { name: "Meeting", value: "Meeting" },
                    { name: "WhatsApp", value: "Whatsapp" }
                  ]}
                  value={editFollowUpFormData.followup_mode}
                  onChange={(val) => setEditFollowUpFormData({ ...editFollowUpFormData, followup_mode: val })}
                />
              </div>

              {/* Status */}
              <Dropdown
                label="Status"
                options={[
                  { name: "Pending", value: "Pending" },
                  { name: "Completed", value: "Completed" },
                ]}
                value={editFollowUpFormData.followup_status}
                onChange={(val) => setEditFollowUpFormData({ ...editFollowUpFormData, followup_status: val })}
              />

              {/* Submit */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full h-12 bg-[#18254D] text-white rounded-xl text-xs font-bold tracking-wider shadow-lg active:scale-[0.97] transition-all hover:bg-[#1e2e5e] hover:shadow-xl flex items-center justify-center gap-2 btn-animated"
                >
                  <Pencil size={14} strokeWidth={2.5} />
                  Save Changes
                </button>
              </div>

            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── CONVERT TO CLIENT (ONBOARD) MODAL ── */}
      {showOnboardModal && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[99999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="absolute inset-0" onClick={() => setShowOnboardModal(false)} />
          <div className="relative z-10 bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-pop flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#ECFDF5] text-[#10B981] rounded-xl flex items-center justify-center border border-[#A7F3D0] shadow-sm">
                  <UserCheck size={16} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#18254D] tracking-tight">Convert to Client</h3>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-0.5">Onboard Lead to Active Status</p>
                </div>
              </div>
              <button onClick={() => setShowOnboardModal(false)} className="p-1.5 hover:bg-slate-200 rounded-xl text-slate-400 transition-all">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleOnboardSubmit} className="p-6 space-y-5 overflow-y-auto no-scrollbar">

              {/* Client Type Toggle */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Client Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {["New", "Existing"].map((type) => (
                    <label
                      key={type}
                      className={`flex items-center gap-3 p-3.5 bg-white border-2 rounded-xl cursor-pointer transition-all shadow-sm ${onboardingData.clientType === type ? "border-[#18254D]" : "border-slate-200 hover:border-slate-300"}`}
                      onClick={() => {
                        setOnboardingData({ ...onboardingData, clientType: type });
                        if (type === "New") { setSelectedExistingClientId(null); setExistingClientSearch(""); }
                      }}
                    >
                      <div className="relative flex items-center justify-center">
                        <input type="radio" name="clientType" checked={onboardingData.clientType === type} readOnly className="peer appearance-none w-5 h-5 border-2 border-[#18254D] rounded-full transition-all" />
                        {onboardingData.clientType === type && <div className="absolute w-2.5 h-2.5 bg-[#18254D] rounded-full" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#18254D] leading-none">{type} Client</p>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{type === "New" ? "First-time engagement" : "Select from client list"}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Existing Client Search */}
              {onboardingData.clientType === "Existing" && (
                <div className="space-y-3">
                  <div className="space-y-1.5 relative">
                    <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Client Name <span className="text-rose-500">*</span></label>
                    <div className="relative">
                      <input
                        type="text" placeholder="Search existing clients..."
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200"
                        value={existingClientSearch}
                        onChange={(e) => {
                          setExistingClientSearch(e.target.value);
                          setIsExistingClientDropdownOpen(true);
                          if (!e.target.value) setSelectedExistingClientId(null);
                        }}
                        onFocus={() => setIsExistingClientDropdownOpen(true)}
                      />
                      <ChevronDown size={14} className={`absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-transform ${isExistingClientDropdownOpen ? "rotate-180" : ""}`} />
                      {isExistingClientDropdownOpen && (
                        <>
                          <div className="fixed inset-0 z-[80]" onClick={() => setIsExistingClientDropdownOpen(false)} />
                          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden z-[90] animate-pop origin-top max-h-[200px] overflow-y-auto">
                            <div className="bg-[#18254D] px-4 py-2.5 border-b border-white/10 sticky top-0">
                              <p className="text-[10px] font-bold text-white/50 tracking-wider uppercase">Select Client</p>
                            </div>
                            {clients
                              .filter((c) =>
                                c.status === "Active" &&
                                (!existingClientSearch ||
                                  c.name?.toLowerCase().includes(existingClientSearch.toLowerCase()) ||
                                  c.company?.toLowerCase().includes(existingClientSearch.toLowerCase()) ||
                                  c.email?.toLowerCase().includes(existingClientSearch.toLowerCase()))
                              )
                              .map((c) => (
                                <button
                                  key={`onboard-client-${c.id}`}
                                  type="button"
                                  onClick={() => {
                                    setSelectedExistingClientId(c.id);
                                    setExistingClientSearch(c.name);
                                    setIsExistingClientDropdownOpen(false);
                                    setOnboardingData((prev) => ({
                                      ...prev,
                                      organisationName: c.company || "",
                                      country: c.country || "",
                                      state: c.state || "",
                                      currency: c.currency || "INR",
                                      clientStatus: c.status || "Active",
                                      projectCategory: c.projectCategory || 1,
                                    }));
                                  }}
                                  className={`w-full text-left px-4 py-3 transition-colors ${selectedExistingClientId === c.id ? "bg-slate-100 border-l-4 border-[#18254D]" : "hover:bg-slate-50"}`}
                                >
                                  <p className="text-[13px] font-bold text-[#18254D]">{c.name}</p>
                                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">{c.email}{c.company ? ` · ${c.company}` : ""}</p>
                                </button>
                              ))}
                            {clients.filter((c) =>
                              c.status === "Active" &&
                              (!existingClientSearch || c.name?.toLowerCase().includes(existingClientSearch.toLowerCase()))
                            ).length === 0 && (
                              <p className="px-4 py-3 text-[12px] text-slate-400 font-bold text-center">No clients found</p>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {selectedExistingClientId && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2 space-y-1">
                        <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Organisation</label>
                        <p className="px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold text-[#18254D] truncate">{onboardingData.organisationName || "—"}</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Country</label>
                        <p className="px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold text-[#18254D] truncate">{onboardingData.country || "—"}</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Currency</label>
                        <p className="px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold text-[#18254D] truncate">{onboardingData.currency || "—"}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* New Client Fields */}
              {onboardingData.clientType === "New" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-[2px] w-6 bg-slate-300 rounded-full" />
                    <h4 className="text-[11px] font-black text-slate-400 tracking-wider uppercase">Client Details</h4>
                    <div className="h-[2px] flex-1 bg-slate-100 rounded-full" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Client Name <span className="text-rose-500">*</span></label>
                      <input disabled readOnly type="text" className="w-full px-4 py-2.5 bg-slate-100 text-slate-500 cursor-not-allowed border border-slate-200 rounded-xl text-sm font-semibold outline-none" value={onboardingData.name} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Email <span className="text-rose-500">*</span></label>
                      <input disabled readOnly type="email" className="w-full px-4 py-2.5 bg-slate-100 text-slate-500 cursor-not-allowed border border-slate-200 rounded-xl text-sm font-semibold outline-none" value={onboardingData.email} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Phone <span className="text-rose-500">*</span></label>
                      <input disabled readOnly type="tel" className="w-full px-4 py-2.5 bg-slate-100 text-slate-500 cursor-not-allowed border border-slate-200 rounded-xl text-sm font-semibold outline-none" value={onboardingData.phone} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Organisation Name <span className="text-rose-500">*</span></label>
                      <input type="text" placeholder="e.g. Acme Corp" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200" value={onboardingData.organisationName} onChange={(e) => setOnboardingData({ ...onboardingData, organisationName: e.target.value })} />
                    </div>

                    <SearchableDropdown
                      label={<span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Client Country <span className="text-rose-500">*</span></span>}
                      required
                      options={countries.map((c) => ({ name: c.name, value: c.name, code: c.code }))}
                      value={onboardingData.country}
                      onChange={(val) => {
                        const selectedCountry = countries.find(c => c.name === val || c.code === val);
                        const countryCurrency = countryToCurrency[val] || (selectedCountry ? countryToCurrency[selectedCountry.name] : null);
                        setOnboardingData({
                          ...onboardingData,
                          country: selectedCountry ? selectedCountry.name : val,
                          currency: countryCurrency ? countryCurrency.code : onboardingData.currency,
                          state: "",
                        });
                      }}
                      placeholder="Select Country"
                    />

                    {countryToStates[onboardingData.country] ? (
                      <SearchableDropdown
                        label={<span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Client State <span className="text-rose-500">*</span></span>}
                        required
                        options={countryToStates[onboardingData.country]}
                        value={onboardingData.state}
                        onChange={(val) => setOnboardingData({ ...onboardingData, state: val })}
                        placeholder="Select State"
                      />
                    ) : (
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Client State</label>
                        <input type="text" placeholder="e.g. State/Province" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200" value={onboardingData.state} onChange={(e) => setOnboardingData({ ...onboardingData, state: e.target.value })} />
                      </div>
                    )}

                    <SearchableDropdown
                      label={<span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Client Currency <span className="text-rose-500">*</span></span>}
                      required
                      options={commonCurrencies.map((c) => ({ name: `${c.code} (${c.symbol})`, code: c.code }))}
                      value={onboardingData.currency}
                      onChange={(val) => setOnboardingData({ ...onboardingData, currency: val })}
                      placeholder="Select Currency"
                    />

                    {/* Client Status */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Client Status <span className="text-rose-500">*</span></label>
                      <div className="relative">
                        <button type="button" onClick={() => setIsOnboardClientStatusDropdownOpen(!isOnboardClientStatusDropdownOpen)} className="w-full h-10 flex items-center justify-between px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold shadow-sm hover:border-[#18254D]/30 transition-all text-[#18254D]">
                          <span>{onboardingData.clientStatus}</span>
                          <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isOnboardClientStatusDropdownOpen ? "rotate-180" : ""}`} />
                        </button>
                        {isOnboardClientStatusDropdownOpen && (
                          <>
                            <div className="fixed inset-0 z-[80]" onClick={() => setIsOnboardClientStatusDropdownOpen(false)} />
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden z-[90] animate-pop origin-top">
                              <div className="bg-[#18254D] px-4 py-2.5 border-b border-white/10"><p className="text-[10px] font-bold text-white/50 tracking-wider uppercase">Select Status</p></div>
                              {["Active", "Inactive"].map((status) => (
                                <button key={status} type="button" onClick={() => { setOnboardingData({ ...onboardingData, clientStatus: status }); setIsOnboardClientStatusDropdownOpen(false); }} className={`w-full text-left px-4 py-2.5 text-xs font-semibold tracking-wider transition-colors ${onboardingData.clientStatus === status ? "bg-indigo-50 text-indigo-700" : "text-[#18254D] hover:bg-slate-50"}`}>{status}</button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Project Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 pt-2">
                  <div className="h-[2px] w-6 bg-slate-300 rounded-full" />
                  <h4 className="text-[11px] font-black text-slate-400 tracking-wider uppercase">Project Details</h4>
                  <div className="h-[2px] flex-1 bg-slate-100 rounded-full" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Project Name <span className="text-rose-500">*</span></label>
                    <input type="text" placeholder="e.g. Route Optimization Platform" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200" value={onboardingData.projectName} onChange={(e) => setOnboardingData({ ...onboardingData, projectName: e.target.value })} />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Project Description <span className="text-rose-500">*</span></label>
                    <textarea rows={3} placeholder="e.g. Focus on UI/UX redesign..." className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200 resize-none" value={onboardingData.projectDescription} onChange={(e) => setOnboardingData({ ...onboardingData, projectDescription: e.target.value })} />
                  </div>

                  {/* Project Category */}
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Project Category <span className="text-rose-500">*</span></label>
                    <div className="relative">
                      <button type="button" onClick={() => setIsOnboardCategoryDropdownOpen(!isOnboardCategoryDropdownOpen)} className="w-full h-10 flex items-center justify-between px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold shadow-sm hover:border-[#18254D]/30 transition-all text-[#18254D]">
                        <span>{CATEGORY_MAP[onboardingData.projectCategory] || "Select Category"}</span>
                        <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isOnboardCategoryDropdownOpen ? "rotate-180" : ""}`} />
                      </button>
                      {isOnboardCategoryDropdownOpen && (
                        <>
                          <div className="fixed inset-0 z-[80]" onClick={() => setIsOnboardCategoryDropdownOpen(false)} />
                          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden z-[90] animate-pop origin-top">
                            <div className="bg-[#18254D] px-4 py-2.5 border-b border-white/10"><p className="text-[10px] font-bold text-white/50 tracking-wider uppercase">Select Category</p></div>
                            {[1, 2].map((catId) => (
                              <button key={`cat-${catId}`} type="button" onClick={() => { setOnboardingData({ ...onboardingData, projectCategory: catId }); setIsOnboardCategoryDropdownOpen(false); }} className={`w-full text-left px-4 py-2.5 text-xs font-semibold tracking-wider transition-colors ${onboardingData.projectCategory === catId ? "bg-indigo-50 text-indigo-700" : "text-[#18254D] hover:bg-slate-50"}`}>{CATEGORY_MAP[catId]}</button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Project Status */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Project Status <span className="text-rose-500">*</span></label>
                    <div className="relative">
                      <button type="button" onClick={() => setIsOnboardStatusDropdownOpen(!isOnboardStatusDropdownOpen)} className="w-full h-10 flex items-center justify-between px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold shadow-sm hover:border-[#18254D]/30 transition-all text-[#18254D]">
                        <span>{onboardingData.projectStatus}</span>
                        <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isOnboardStatusDropdownOpen ? "rotate-180" : ""}`} />
                      </button>
                      {isOnboardStatusDropdownOpen && (
                        <>
                          <div className="fixed inset-0 z-[80]" onClick={() => setIsOnboardStatusDropdownOpen(false)} />
                          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden z-[90] animate-pop origin-top">
                            <div className="bg-[#18254D] px-4 py-2.5 border-b border-white/10"><p className="text-[10px] font-bold text-white/50 tracking-wider uppercase">Select Status</p></div>
                            {["Hold", "In Progress", "Completed"].map((status) => (
                              <button key={status} type="button" onClick={() => { setOnboardingData({ ...onboardingData, projectStatus: status }); setIsOnboardStatusDropdownOpen(false); }} className={`w-full text-left px-4 py-2.5 text-xs font-semibold tracking-wider transition-colors ${onboardingData.projectStatus === status ? "bg-indigo-50 text-indigo-700" : "text-[#18254D] hover:bg-slate-50"}`}>{status}</button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Project Priority */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Project Priority <span className="text-rose-500">*</span></label>
                    <div className="relative">
                      <button type="button" onClick={() => setIsOnboardPriorityDropdownOpen(!isOnboardPriorityDropdownOpen)} className="w-full h-10 flex items-center justify-between px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold shadow-sm hover:border-[#18254D]/30 transition-all text-[#18254D]">
                        <span>{onboardingData.projectPriority}</span>
                        <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isOnboardPriorityDropdownOpen ? "rotate-180" : ""}`} />
                      </button>
                      {isOnboardPriorityDropdownOpen && (
                        <>
                          <div className="fixed inset-0 z-[80]" onClick={() => setIsOnboardPriorityDropdownOpen(false)} />
                          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden z-[90] animate-pop origin-top">
                            <div className="bg-[#18254D] px-4 py-2.5 border-b border-white/10"><p className="text-[10px] font-bold text-white/50 tracking-wider uppercase">Select Priority</p></div>
                            {["High", "Medium", "Low"].map((level) => (
                              <button key={level} type="button" onClick={() => { setOnboardingData({ ...onboardingData, projectPriority: level }); setIsOnboardPriorityDropdownOpen(false); }} className={`w-full text-left px-4 py-2.5 text-xs font-semibold tracking-wider transition-colors ${onboardingData.projectPriority === level ? "bg-indigo-50 text-indigo-700" : "text-[#18254D] hover:bg-slate-50"}`}>{level}</button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Budget */}
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                      Project Budget ({onboardingData.currency || "INR"}) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                        {commonCurrencies.find((c) => c.code === onboardingData.currency)?.symbol || "₹"}
                      </div>
                      <input
                        type="text"
                        placeholder={onboardingData.currency === "USD" ? "e.g. 5,000" : "e.g. 5,00,000"}
                        className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200"
                        value={formatBudget(onboardingData.projectBudget, onboardingData.currency)}
                        onChange={(e) => setOnboardingData({ ...onboardingData, projectBudget: parseBudget(e.target.value) })}
                      />
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Onboarding Date <span className="text-rose-500">*</span></label>
                    <DatePicker value={onboardingData.onboardingDate} onChange={(val) => setOnboardingData({ ...onboardingData, onboardingDate: val })} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Deadline (Tentative) <span className="text-rose-500">*</span></label>
                    <DatePicker value={onboardingData.deadline} onChange={(val) => setOnboardingData({ ...onboardingData, deadline: val })} />
                  </div>

                  {/* Scope Document */}
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Scope Document <span className="text-rose-500">*</span></label>
                    <div className="relative group">
                      <input
                        required
                        type="file"
                        accept="application/pdf"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            if (file.type !== "application/pdf") {
                              toast.error("Please upload only PDF documents.");
                              e.target.value = "";
                              return;
                            }
                            setOnboardingData({ ...onboardingData, scopeDocument: file });
                          }
                        }}
                      />
                      <div className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl group-hover:border-[#18254D]/30 group-hover:bg-white transition-all flex items-center gap-3">
                        <div className="p-2 bg-white border border-slate-200 rounded-lg shadow-sm">
                          <Upload size={16} className="text-slate-500" />
                        </div>
                        <span className={`text-sm font-semibold ${onboardingData.scopeDocument ? "text-[#18254D]" : "text-slate-400"}`}>
                          {onboardingData.scopeDocument instanceof File
                            ? onboardingData.scopeDocument.name
                            : typeof onboardingData.scopeDocument === "string" && onboardingData.scopeDocument
                            ? onboardingData.scopeDocument
                            : "Upload scope document (PDF)"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 bg-[#18254D] text-white rounded-xl text-xs font-bold tracking-wider shadow-lg active:scale-[0.97] transition-all hover:bg-[#1e2e5e] hover:shadow-xl flex items-center justify-center gap-2 group/btn disabled:opacity-70 disabled:cursor-not-allowed btn-animated"
                >
                  {isSubmitting
                    ? (<><span>Converting...</span><Loader2 size={16} className="animate-spin" /></>)
                    : (<><UserCheck size={14} strokeWidth={2.5} className="group-hover/btn:translate-x-0.5 transition-transform" /><span>Convert to Client</span></>)
                  }
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