import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import { createPortal } from "react-dom";
import { useScrollLock } from "../../hooks/useScrollLock";
import DatePicker from "../../components/ui/DatePicker";
import {
  Clock,
  Bell,
  CheckCircle2,
  Plus,
  MessageSquare,
  Phone,
  Check,
  X,
  ChevronDown,
  UserPlus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import SearchableDropdown from "../../components/common/SearchableDropdown";
import {
  CATEGORY_MAP,
  REVERSE_CATEGORY_MAP,
} from "../../constants/categoryConstants";
import { validateForm } from "../../utils/validation";

const FollowUpList = ({
  followUps,
  clients,
  projects,
  onToggleStatus,
  onAddFollowUp,
  onEditFollowUp,
  onDeleteFollowUp,
  onNavigate,
  onSelectClient,
  typeFilter = "All",
  loading = false,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFilterPopupOpen, setIsFilterPopupOpen] = useState(false);
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [isPriorityDropdownOpen, setIsPriorityDropdownOpen] = useState(false);
  const [isHourDropdownOpen, setIsHourDropdownOpen] = useState(false);
  const [isMinuteDropdownOpen, setIsMinuteDropdownOpen] = useState(false);
  const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [projectSearchTerm, setProjectSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    clientId: "",
    projectId: "",
    title: "",
    description: "",
    followup_date: new Date().toLocaleDateString("en-CA"),
    followup_mode: "Call",
    followup_status: "pending",
    follow_brief: "",
    priority: "Medium",
    timeHour: "12",
    timeMinute: "00",
    timePeriod: "PM",
    completed_by: "",
    completionDate: new Date().toLocaleDateString("en-CA"),
    completionHour: "12",
    completionMinute: "00",
    completionPeriod: "PM",
  });
  const [startDate, setStartDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const RECORDS_PER_PAGE = 10;
  const [endDate, setEndDate] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [isModeDropdownOpen, setIsModeDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionBrief, setCompletionBrief] = useState("");
  const [completingFollowUpId, setCompletingFollowUpId] = useState(null);
  const [completionDate, setCompletionDate] = useState(
    new Date().toLocaleDateString("en-CA"),
  );
  const [completionHour, setCompletionHour] = useState(
    (new Date().getHours() % 12 || 12).toString(),
  );
  const [completionMinute, setCompletionMinute] = useState(
    new Date().getMinutes().toString().padStart(2, "0"),
  );
  const [completionPeriod, setCompletionPeriod] = useState(
    new Date().getHours() >= 12 ? "PM" : "AM",
  );
  const [completedBy, setCompletedBy] = useState(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user.full_name || "";
  });
  const [isCompHourOpen, setIsCompHourOpen] = useState(false);
  const [isCompMinOpen, setIsCompMinOpen] = useState(false);
  const [isCompPeriodOpen, setIsCompPeriodOpen] = useState(false);
  const filterButtonRef = useRef(null);
  const [filterPopupStyle, setFilterPopupStyle] = useState({});

  useEffect(() => {
    if (isFilterPopupOpen && filterButtonRef.current) {
      const rect = filterButtonRef.current.getBoundingClientRect();
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const isMobile = windowWidth < 1024;
      
      const style = {
        position: "fixed",
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
      };

      if (isMobile) {
        // Mobile styles: Centering handled by the Flexbox wrapper in JSX
        const popupWidth = Math.min(windowWidth - 32, 400);
        style.width = `${popupWidth}px`;
        style.maxHeight = "calc(100dvh - 32px)";
        style.borderRadius = "24px";
      } else {
        const popupWidth = 384; 
        let left = rect.right - popupWidth;
        if (left < 16) left = 16;
        if (left + popupWidth > windowWidth - 16) left = windowWidth - popupWidth - 16;

        const spaceBelow = windowHeight - rect.bottom - 24;
        const spaceAbove = rect.top - 24;
        
        style.left = `${left}px`;
        style.width = `${popupWidth}px`;

        if (spaceBelow < 400 && spaceAbove > spaceBelow) {
          style.bottom = `${windowHeight - rect.top + 8}px`;
          style.maxHeight = `calc(${spaceAbove}px - 16px)`;
          style.transformOrigin = "bottom right";
        } else {
          style.top = `${rect.bottom + 8}px`;
          style.maxHeight = `calc(${spaceBelow}px - 16px)`;
          style.transformOrigin = "top right";
        }
      }
      setFilterPopupStyle(style);
    }
  }, [isFilterPopupOpen]);

  useEffect(() => {
    const handleScrollResize = () => {
      if (isFilterPopupOpen) setIsFilterPopupOpen(false);
    };
    if (isFilterPopupOpen) {
      window.addEventListener("scroll", handleScrollResize, true);
      window.addEventListener("resize", handleScrollResize);
    }
    return () => {
      window.removeEventListener("scroll", handleScrollResize, true);
      window.removeEventListener("resize", handleScrollResize);
    };
  }, [isFilterPopupOpen]);

  // Lock scroll when any modal is open
  useScrollLock(showAddModal || showCompletionModal);

  const getClientById = (id, leadId, projectId) => {
    if (!id && !leadId && !projectId) return null;
    let client = clients.find(
      (c) =>
        (id && (c.id == id || c.client_id == id)) ||
        (leadId && (c.lead_id == leadId || c.id == leadId)),
    );
    if (!client && projectId) {
      const project = projects.find((p) => p.id == projectId || p.project_id == projectId);
      if (project) {
        client = clients.find((c) => c.id == project.clientId || c.client_id == project.clientId);
      }
    }
    return client;
  };
  const isOverdue = (date) =>
    new Date(date) < new Date(new Date().setHours(0, 0, 0, 0));
  const isToday = (date) => {
    const d = new Date(date);
    const today = new Date();
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  };

  // Base filtering (type + category + search) — before status tab filter
  const baseFiltered = followUps.filter((f) => {
    const client = getClientById(f.clientId, f.leadId, f.projectId);
    if (typeFilter !== "All") {
      // New reference Follow-ups -> Leads focus (specifically lead-level history)
      if (typeFilter === "Lead") {
        if (!f.leadId || f.projectId) return false;
      }
      
      // Reference Follow-ups -> Active/Project focus
      if (typeFilter === "Active") {
        if (!f.projectId) return false;
      }
    }

    // Search filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchesTitle = f.title?.toLowerCase().includes(q);
      const matchesClient = client?.name?.toLowerCase().includes(q);
      const matchesCompany = client?.company?.toLowerCase().includes(q);
      if (!matchesTitle && !matchesClient && !matchesCompany) return false;
    }

    // Date Range Filter
    if (startDate || endDate) {
      const datePart = f.dueDate.split("T")[0];
      if (startDate && datePart < startDate) return false;
      if (endDate && datePart > endDate) return false;
    }

    // Category Filter
    if (categoryFilter !== "All") {
      const categoryNum = parseInt(REVERSE_CATEGORY_MAP[categoryFilter]);
      const entityCategory = client?.category || client?.projectCategory || client?.leadCategory || 1;
      if (entityCategory !== categoryNum) return false;
    }

    return true;
  });

  // Tab counts
  const tabCounts = {
    All: baseFiltered.filter((f) => f.status !== "completed").length,
    Overdue: baseFiltered.filter(
      (f) => isOverdue(f.dueDate) && f.status === "pending",
    ).length,
    Today: baseFiltered.filter(
      (f) => isToday(f.dueDate) && f.status === "pending",
    ).length,
    Upcoming: baseFiltered.filter(
      (f) =>
        !isOverdue(f.dueDate) && !isToday(f.dueDate) && f.status === "pending",
    ).length,
  };

  const filteredFollowUps = baseFiltered
    .filter((f) => {
      if (f.status === "completed" && activeFilter !== "All") return false;
      if (activeFilter === "Overdue")
        return isOverdue(f.dueDate) && f.status === "pending";
      if (activeFilter === "Today")
        return isToday(f.dueDate) && f.status === "pending";
      if (activeFilter === "Upcoming")
        return (
          !isOverdue(f.dueDate) && !isToday(f.dueDate) && f.status === "pending"
        );
      return true;
    })
    .sort((a, b) => {
      const sA = (a.status || a.followup_status || "").toLowerCase();
      const sB = (b.status || b.followup_status || "").toLowerCase();

      const isCompletedA = sA === "completed";
      const isCompletedB = sB === "completed";

      if (isCompletedA && !isCompletedB) return 1;
      if (!isCompletedA && isCompletedB) return -1;

      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

  const totalPages = Math.ceil(filteredFollowUps.length / RECORDS_PER_PAGE);
  const currentFollowUps = filteredFollowUps.slice(
    (currentPage - 1) * RECORDS_PER_PAGE,
    currentPage * RECORDS_PER_PAGE,
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    const isValid = validateForm(formData, {
      title: { required: true, minLength: 2, label: "Title" },
      description: { required: true, label: "Description" },
      clientId: { required: true, label: "Client/Lead Name" },
      followup_date: { required: true, label: "Follow-up Date" },
      timeHour: { required: true, label: "Follow-up Hour" },
      timeMinute: { required: true, label: "Follow-up Minute" },
      timePeriod: { required: true, label: "Follow-up Period" },
      priority: { required: true, label: "Priority" },
      followup_mode: { required: true, label: "Follow-up Mode" },
      followup_status: { required: true, label: "Follow-up Status" },
    });

    if (!isValid) return;

    setIsSubmitting(true); // Start submitting

    // Convert 12h to 24h for backend
    let hour = parseInt(formData.timeHour);
    if (formData.timePeriod === "PM" && hour < 12) hour += 12;
    if (formData.timePeriod === "AM" && hour === 12) hour = 0;
    const time24 = `${hour.toString().padStart(2, "0")}:${formData.timeMinute}`;

    // Combine date and time into MySQL-friendly local format
    const combinedDateTime = `${formData.followup_date} ${time24}:00`;

    let compHour = parseInt(formData.completionHour || "12");
    if (formData.completionPeriod === "PM" && compHour < 12) compHour += 12;
    if (formData.completionPeriod === "AM" && compHour === 12) compHour = 0;
    const compTime24 = `${compHour.toString().padStart(2, "0")}:${formData.completionMinute || "00"}`;
    const combinedCompletionStr = `${formData.completionDate || new Date().toLocaleDateString("en-CA")} ${compTime24}:00`;

    const selectedClient = clients.find((c) => c.id == formData.clientId);
    const finalClientId =
      selectedClient?.status === "Active" && selectedClient.lead_id
        ? selectedClient.lead_id
        : formData.clientId;

    try {
      const formattedStatus = formData.followup_status
        ? formData.followup_status.charAt(0).toUpperCase() +
          formData.followup_status.slice(1).toLowerCase()
        : "Pending";

      if (formData.id) {
        if (onEditFollowUp) {
          await onEditFollowUp({
            ...formData,
            clientId: finalClientId,
            dueDate: combinedDateTime,
            followup_date: combinedDateTime,
            completed_at: combinedCompletionStr,
            followup_status: formattedStatus,
          });
        }
      } else {
        if (onAddFollowUp) {
          await onAddFollowUp({
            ...formData,
            clientId: finalClientId,
            dueDate: combinedDateTime,
            followup_date: combinedDateTime,
            followup_status: formattedStatus,
          });
          setCurrentPage(1);
        }
      }
      setShowAddModal(false);
      setFormData({
        clientId: "",
        title: "",
        description: "",
        followup_date: new Date().toLocaleDateString("en-CA"),
        followup_mode: "Call",
        followup_status: "pending",
        follow_brief: "",
        priority: "Medium",
        timeHour: "12",
        timeMinute: "00",
        timePeriod: "PM",
        completed_by: "",
        completionDate: new Date().toLocaleDateString("en-CA"),
        completionHour: "12",
        completionMinute: "00",
        completionPeriod: "PM",
      });
    } catch (error) {
      toast.error("Failed to save follow-up.");
      console.error(error);
    } finally {
      setIsSubmitting(false); // End submitting
    }
  };

  const getPriorityBadge = (p) => {
    switch (p) {
      case "High":
        return "bg-error/10 text-error border-error/20";
      case "Medium":
        return "bg-warning/10 text-warning border-warning/20";
      case "Low":
        return "bg-info/10 text-info border-info/20";
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="w-full flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <p className="text-sm text-slate-500">Loading follow-ups...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full relative">
      <div className="space-y-5 animate-fade-in w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="flex flex-col items-start max-w-2xl text-left">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-primary tracking-tight mb-2">
              {typeFilter === "Active"
                ? "Reference Follow-Ups"
                : typeFilter === "Lead"
                  ? "New Follow-ups"
                  : "Follow-Ups"}
            </h2>
            <p className="text-xs md:text-sm text-textMuted font-medium leading-relaxed max-w-md">
              {typeFilter === "Active"
                ? "Manage communications with your reference clients."
                : typeFilter === "Lead"
                  ? "Track interactions with your new reference follow-ups."
                  : "Stay on top of your client and lead communications."}
            </p>
          </div>
          <div className="w-full sm:w-auto">
            <button
              onClick={() => {
                setFormData({
                  clientId: "",
                  title: "",
                  description: "",
                  followup_date: new Date().toLocaleDateString("en-CA"),
                  timeHour: "12",
                  timeMinute: "00",
                  timePeriod: "PM",
                  followup_status: "pending",
                  priority: "Medium",
                  followup_mode: "Call",
                  completionBrief: "",
                  completionDate: new Date().toLocaleDateString("en-CA"),
                  completionHour: "12",
                  completionMinute: "00",
                  completionPeriod: "PM",
                  completed_by: "",
                });
                setShowAddModal(true);
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-2xl hover:bg-slate-800 transition-all text-[13px] font-bold  tracking-wider shadow-lg active:scale-95 group"
            >
              <Plus
                size={16}
                strokeWidth={2.5}
                className="group-hover:rotate-90 transition-transform"
              />
              Add Follow-Up
            </button>
          </div>
        </div>

        {/* Control Bar: Filters */}
        <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm relative z-[60]">
          <div className="flex flex-col md:flex-row md:justify-between gap-4 w-full items-center">
            {/* 1. Search Bar */}
            <div className="relative w-full md:w-64 flex-none transition-all duration-300">
              <Search
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#18254D]/40"
              />
              <input
                type="text"
                placeholder="Search follow-ups..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-[38px] pl-11 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium text-[#18254D] focus:outline-none focus:ring-4 focus:ring-[#18254D]/10 focus:border-[#18254D]/20 transition-all placeholder:text-[#18254D]/30"
              />
            </div>

            {/* 2. Filters Button */}
            <div className="relative w-full md:w-auto flex-none" ref={filterButtonRef}>
              <button
                onClick={() => setIsFilterPopupOpen(!isFilterPopupOpen)}
                className={`w-full md:w-auto h-[38px] flex items-center justify-center gap-2.5 px-6 py-2 rounded-xl text-[12px] font-bold tracking-widest transition-all shadow-sm active:scale-95 group border ${
                  startDate || endDate || (typeFilter === "Active" && categoryFilter !== "All")
                    ? "bg-secondary/5 border-secondary text-secondary"
                    : "bg-slate-50 border-slate-100 text-[#18254D] hover:bg-white hover:border-slate-200 shadow-slate-200/50"
                }`}
              >
                <Filter
                  size={14}
                  className={(startDate || endDate || (typeFilter === "Active" && categoryFilter !== "All")) ? "text-secondary" : "text-slate-400"}
                />
                <span>FILTERS</span>
                {(startDate || endDate || (typeFilter === "Active" && categoryFilter !== "All")) && (
                  <span className="flex items-center justify-center w-5 h-5 bg-secondary text-white text-[10px] font-black rounded-full ml-1 shadow-sm">
                    {[
                      !!startDate,
                      !!endDate,
                      (typeFilter === "Active" && categoryFilter !== "All")
                    ].filter(Boolean).length}
                  </span>
                )}
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-300 ${isFilterPopupOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* Filters Popup - Portaled for perfect layering */}
              {isFilterPopupOpen &&
                createPortal(
                  <>
                    <div
                      className="fixed inset-0 z-[99998] bg-slate-900/20 backdrop-blur-[2px] animate-fade-in"
                      onClick={() => setIsFilterPopupOpen(false)}
                    />
                    <div
                      className={`${window.innerWidth < 1024 ? "fixed inset-0 flex items-center justify-center p-4 z-[99999] pointer-events-none" : ""}`}
                    >
                      <div
                        className="bg-white border border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden animate-fade-in-up ring-1 ring-black/5 rounded-3xl pointer-events-auto"
                        style={filterPopupStyle}
                      >
                      {/* Sticky Header */}
                      <div className="flex-none p-4 border-b border-slate-50 flex items-center justify-between bg-white relative z-10">
                        <div className="flex items-center gap-2">
                          <Filter size={14} className="text-secondary" />
                          <h3 className="text-[11px] font-black text-[#18254D] tracking-[0.2em] uppercase">
                            Filter Follow-ups
                          </h3>
                        </div>
                        {(startDate || endDate || (typeFilter === "Active" && categoryFilter !== "All")) && (
                          <button
                            onClick={() => {
                              setStartDate("");
                              setEndDate("");
                              setCategoryFilter("All");
                              setIsFilterPopupOpen(false);
                            }}
                            className="text-[10px] font-black text-rose-500 hover:text-rose-600 tracking-widest uppercase transition-colors"
                          >
                            Clear All
                          </button>
                        )}
                      </div>

                      {/* Scrollable Body */}
                      <div className="flex-1 p-5 space-y-4 overflow-y-auto custom-scrollbar">
                        {/* Category Filter (ONLY visible for Active/Project view) */}
                        {typeFilter === "Active" && (
                          <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase ml-1">
                              Project Category
                            </label>
                            <SearchableDropdown
                              placeholder="Select Category..."
                              options={["All", "Tech", "Social Media"].map(cat => ({
                                label: cat.toUpperCase(),
                                value: cat
                              }))}
                              value={categoryFilter}
                              onChange={setCategoryFilter}
                            />
                          </div>
                        )}

                        <div className="h-px bg-slate-100/50" />

                        {/* Date Range Section */}
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase ml-1">
                            Follow-up Date Range
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                            <DatePicker
                              label="From"
                              value={startDate}
                              onChange={setStartDate}
                            />
                            <DatePicker
                              label="To"
                              value={endDate}
                              onChange={setEndDate}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Sticky Footer */}
                      <div className="flex-none p-4 bg-white border-t border-slate-50 relative z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
                        <button
                          onClick={() => setIsFilterPopupOpen(false)}
                          className="w-full py-2.5 bg-[#18254D] text-white rounded-2xl text-[11px] font-black tracking-[0.2em] uppercase hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                        >
                          Apply Filters
                        </button>
                      </div>
                    </div>
                  </div>
                </>,
                  document.body,
                )}
            </div>
          </div>
        </div>
        <div className="flex justify-center my-4 w-full px-1 sm:px-0">
          <div className="relative flex flex-nowrap bg-slate-100/50 p-0.5 rounded-[14px] border border-slate-200 shadow-sm leading-none w-full sm:w-auto items-center gap-0 overflow-hidden">
            {/* Moving Indicator */}
            <div
              className="absolute top-[2px] bottom-[2px] left-[2px] bg-white rounded-[11px] shadow-sm transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] border border-white/20 z-0"
              style={{
                width: "calc(25% - 2px)",
                transform: `translateX(${["All", "Overdue", "Today", "Upcoming"].indexOf(activeFilter) * 100}%)`,
              }}
            />

            {["All", "Overdue", "Today", "Upcoming"].map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`relative z-10 flex-1 sm:flex-none px-2 sm:px-5 py-2.5 sm:py-2 rounded-xl text-[10px] sm:text-[12px] font-bold tracking-wider transition-all duration-300 flex items-center justify-center gap-1.5 min-w-[75px] sm:min-w-[110px] h-[30px] sm:h-[36px] whitespace-nowrap active:scale-95 ${
                  activeFilter === f
                    ? "text-[#18254D] scale-[1.02]"
                    : "text-slate-400 hover:text-[#18254D]/60"
                }`}
              >
                <span>{f}</span>
                <span
                  className={`min-w-[18px] h-4.5 px-1.5 rounded-full text-[10px] sm:text-[12px] font-black flex items-center justify-center transition-colors duration-300 ${
                    activeFilter === f
                      ? "bg-[#18254D] text-white"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {tabCounts[f]}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 w-full">
          {filteredFollowUps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm w-full">
              <Bell size={24} className="text-slate-100 mb-3" />
              <p className="text-[13px] font-bold text-primary  tracking-wider">
                No Active Tasks
              </p>
            </div>
          ) : (
            currentFollowUps.map((f) => {
              const client = getClientById(f.clientId, f.leadId, f.projectId);
              const overdue = isOverdue(f.dueDate) && f.status === "pending";
              return (
                <div
                  key={f.id}
                  className={`group bg-white rounded-xl border transition-all hover:shadow-md flex flex-col md:flex-row items-start p-3 gap-3 ${f.status === "completed" ? "opacity-50 grayscale" : overdue ? "border-error/20 bg-error/[0.01]" : "border-slate-200 hover:border-secondary/30"}`}
                >
                  <button
                    onClick={() => {
                      if (f.status === "completed") {
                        onToggleStatus(f.id);
                      } else {
                        setCompletingFollowUpId(f.id);
                        setCompletionBrief("");
                        setShowCompletionModal(true);
                      }
                    }}
                    className={`w-8 h-8 rounded-lg border-2 transition-all flex items-center justify-center shrink-0 mt-1 ${f.status === "completed" ? "bg-success border-success text-white" : "bg-white border-slate-200 text-slate-300 hover:border-success hover:text-success hover:bg-success/5"}`}
                    title={
                      f.status === "completed"
                        ? "Mark as Pending"
                        : "Mark as Completed"
                    }
                  >
                    {f.status === "completed" ? (
                      <Check size={16} strokeWidth={4} />
                    ) : (
                      <CheckCircle2 size={14} strokeWidth={3} />
                    )}
                  </button>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-[14px] font-bold  tracking-wider border ${getPriorityBadge(f.priority)}`}
                      >
                        {f.priority}
                      </span>
                      {f.followup_mode && (
                        <span className="px-2.5 py-0.5 rounded-md text-[14px] font-bold  tracking-wider border border-slate-200 bg-slate-50 text-slate-500">
                          {f.followup_mode}
                        </span>
                      )}
                      {overdue && (
                        <span className="text-[14px] font-bold  tracking-wider text-error bg-error/10 px-2.5 py-0.5 rounded-md border border-error/20">
                          Overdue
                        </span>
                      )}
                    </div>
                    <h4
                      className={`text-sm font-bold text-primary tracking-tight ${f.status === "completed" ? "line-through opacity-50" : ""}`}
                    >
                      {f.title}
                    </h4>
                    {f.description && (
                      <p className="text-[13px] text-slate-400 font-medium mt-1 line-clamp-2">
                        {f.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                      <div className="flex items-center gap-1.5 text-[12px] text-textMuted font-bold  tracking-widest">
                        <Clock size={12} className="text-secondary" />
                        {new Date(f.dueDate).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                        })}
                        {" · "}
                        {new Date(f.dueDate).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </div>
                      {f.projectName && (
                        <div className="flex items-center gap-1.5 text-[12px] text-textMuted font-bold  tracking-widest">
                          <span className="text-secondary">•</span>
                          {f.projectName}
                        </div>
                      )}
                      <button
                        onClick={() =>
                          client && onSelectClient && onSelectClient(client)
                        }
                        className="flex items-center gap-1.5 text-[12px] text-textMuted font-bold  tracking-widest hover:text-secondary hover:underline transition-all"
                      >
                        <span className="text-secondary">•</span>
                        {client?.name}
                      </button>
                    </div>
                    {f.status === "completed" && f.follow_brief && (
                      <div className="mt-2 px-3 py-2 bg-success/5 border border-success/20 rounded-lg">
                        <p className="text-[12px] font-bold text-success  tracking-wider mb-0.5">
                          Conclusion
                        </p>
                        <p className="text-[13px] text-slate-600 font-medium">
                          {f.follow_brief}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        let compDate = new Date().toISOString().split("T")[0];
                        let compHr = "12";
                        let compMin = "00";
                        let compPrd = "PM";

                        if (f.status === "completed" && f.completed_at) {
                          const cd = new Date(f.completed_at);
                          if (!isNaN(cd.getTime())) {
                            compDate = `${cd.getFullYear()}-${(cd.getMonth() + 1).toString().padStart(2, "0")}-${cd.getDate().toString().padStart(2, "0")}`;
                            compHr = (cd.getHours() % 12 || 12).toString();
                            compMin = cd
                              .getMinutes()
                              .toString()
                              .padStart(2, "0");
                            compPrd = cd.getHours() >= 12 ? "PM" : "AM";
                          }
                        }

                        const d = f.dueDate ? new Date(f.dueDate) : new Date();
                        const localDate = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
                        const localHour24 = d.getHours();
                        const localHour12 = (localHour24 % 12 || 12).toString();
                        const localMinute = d
                          .getMinutes()
                          .toString()
                          .padStart(2, "0");
                        const localPeriod = localHour24 >= 12 ? "PM" : "AM";

                        setFormData({
                          ...f,
                          followup_status:
                            f.status || f.followup_status || "pending",
                          followup_date: localDate,
                          timeHour: localHour12,
                          timeMinute: localMinute,
                          timePeriod: localPeriod,
                          completed_by: f.completed_by || "",
                          completionDate: compDate,
                          completionHour: compHr,
                          completionMinute: compMin,
                          completionPeriod: compPrd,
                        });
                        setShowAddModal(true);
                      }}
                      className="p-2.5 bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-primary transition-all active:scale-90 hover:shadow-sm"
                      title="Edit Follow-up"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteFollowUp && onDeleteFollowUp(f.id);
                      }}
                      className="p-2.5 bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-error hover:border-error/30 transition-all active:scale-90 hover:shadow-sm"
                      title="Delete Follow-up"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8 mb-4">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-primary hover:border-primary disabled:opacity-30 disabled:hover:border-slate-200 disabled:hover:text-slate-400 transition-all shadow-sm active:scale-95"
            >
              <ChevronLeft size={16} strokeWidth={2.5} />
            </button>

            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-2xl shadow-inner mx-2">
              {[...Array(totalPages)].map((_, i) => {
                const pageNum = i + 1;
                if (
                  totalPages > 7 &&
                  pageNum !== 1 &&
                  pageNum !== totalPages &&
                  Math.abs(pageNum - currentPage) > 1
                ) {
                  if (pageNum === 2 || pageNum === totalPages - 1) {
                    return (
                      <span
                        key={pageNum}
                        className="text-slate-300 px-1 font-bold"
                      >
                        .
                      </span>
                    );
                  }
                  return null;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`min-w-[32px] h-8 flex items-center justify-center rounded-lg text-sm font-black transition-all ${
                      currentPage === pageNum
                        ? "bg-[#18254D] text-white shadow-lg shadow-slate-300 scale-110"
                        : "text-slate-400 hover:text-primary hover:bg-white"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-primary hover:border-primary disabled:opacity-30 disabled:hover:border-slate-200 disabled:hover:text-slate-400 transition-all shadow-sm active:scale-95"
            >
              <ChevronRight size={16} strokeWidth={2.5} />
            </button>
          </div>
        )}

        {/* Completion Brief Modal */}
        {showCompletionModal &&
          createPortal(
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[99999] flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-md rounded-xl shadow-2xl border border-slate-200 animate-fade-in relative z-[100000]">
                <div className="bg-primary p-4 text-white relative rounded-t-xl">
                  <button
                    onClick={() => {
                      setShowCompletionModal(false);
                      setCompletingFollowUpId(null);
                      setCompletionBrief("");
                    }}
                    className="absolute top-4 right-4 p-1.5 hover:bg-white/10 rounded-xl transition-colors"
                  >
                    <X size={18} strokeWidth={3} />
                  </button>
                  <div className="flex items-center gap-3 pr-8">
                    <div className="w-8 h-8 bg-secondary/20 rounded-xl flex items-center justify-center border border-secondary/30">
                      <CheckCircle2
                        size={18}
                        strokeWidth={3}
                        className="text-secondary"
                      />
                    </div>
                    <div>
                      <h3 className="text-base font-bold tracking-tighter leading-none">
                        Mark as Completed
                      </h3>
                      <p className="text-secondary text-[14px] font-bold  tracking-widest mt-0.5">
                        Follow-up Conclusion
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                  <div className="space-y-1.5">
                    <label className="text-[14px] font-bold text-primary  tracking-widest ml-1">
                      Conclusion Brief <span className="text-error">*</span>
                    </label>
                    <textarea
                      autoFocus
                      placeholder="Write a brief conclusion about this follow-up..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium shadow-sm focus:ring-4 focus:ring-secondary/10 focus:border-secondary focus:outline-none resize-none"
                      value={completionBrief}
                      onChange={(e) => setCompletionBrief(e.target.value)}
                      rows="3"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[14px] font-bold text-primary tracking-widest ml-1">
                        Completion Date <span className="text-error">*</span>
                      </label>
                      <input
                        type="date"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium shadow-sm focus:ring-4 focus:ring-secondary/10 focus:border-secondary focus:outline-none"
                        value={completionDate}
                        onChange={(e) => setCompletionDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[14px] font-bold text-primary tracking-widest ml-1">
                        Completion Time <span className="text-error">*</span>
                      </label>
                      <div className="flex gap-2">
                        {/* Hour */}
                        <div className="flex-1 relative">
                          <button
                            type="button"
                            onClick={() => setIsCompHourOpen(!isCompHourOpen)}
                            className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold shadow-sm"
                          >
                            <span>{completionHour.padStart(2, "0")}</span>
                            <ChevronDown size={12} />
                          </button>
                          {isCompHourOpen && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-100 rounded-lg shadow-xl z-[100] max-h-32 overflow-y-auto">
                              {Array.from({ length: 12 }, (_, i) => i + 1).map(
                                (h) => (
                                  <button
                                    key={h}
                                    type="button"
                                    onClick={() => {
                                      setCompletionHour(
                                        h.toString().padStart(2, "0"),
                                      );
                                      setIsCompHourOpen(false);
                                    }}
                                    className="w-full text-left px-3 py-1.5 text-[12px] hover:bg-slate-50"
                                  >
                                    {h.toString().padStart(2, "0")}
                                  </button>
                                ),
                              )}
                            </div>
                          )}
                        </div>
                        {/* Minute */}
                        <div className="flex-1 relative">
                          <button
                            type="button"
                            onClick={() => setIsCompMinOpen(!isCompMinOpen)}
                            className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold shadow-sm"
                          >
                            <span>{completionMinute}</span>
                            <ChevronDown size={12} />
                          </button>
                          {isCompMinOpen && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-100 rounded-lg shadow-xl z-[100] max-h-32 overflow-y-auto">
                              {Array.from({ length: 12 }, (_, i) => i * 5).map(
                                (m) => (
                                  <button
                                    key={m}
                                    type="button"
                                    onClick={() => {
                                      setCompletionMinute(
                                        m.toString().padStart(2, "0"),
                                      );
                                      setIsCompMinOpen(false);
                                    }}
                                    className="w-full text-left px-3 py-1.5 text-[12px] hover:bg-slate-50"
                                  >
                                    {m.toString().padStart(2, "0")}
                                  </button>
                                ),
                              )}
                            </div>
                          )}
                        </div>
                        {/* Period */}
                        <div className="w-14 relative">
                          <button
                            type="button"
                            onClick={() =>
                              setIsCompPeriodOpen(!isCompPeriodOpen)
                            }
                            className="w-full flex items-center justify-between px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold shadow-sm"
                          >
                            <span>{completionPeriod}</span>
                            <ChevronDown size={12} />
                          </button>
                          {isCompPeriodOpen && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-100 rounded-lg shadow-xl z-[100]">
                              {["AM", "PM"].map((p) => (
                                <button
                                  key={p}
                                  type="button"
                                  onClick={() => {
                                    setCompletionPeriod(p);
                                    setIsCompPeriodOpen(false);
                                  }}
                                  className="w-full text-left px-3 py-1.5 text-[12px] hover:bg-slate-50"
                                >
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
                    <label className="text-[14px] font-bold text-primary  tracking-widest ml-1">
                      Completed By <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium shadow-sm focus:ring-4 focus:ring-secondary/10 focus:border-secondary focus:outline-none"
                      value={completedBy}
                      onChange={(e) => setCompletedBy(e.target.value)}
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (!completionBrief.trim()) {
                          toast.error("Conclusion Brief is required.");
                          return;
                        }
                        if (!completionDate) {
                          toast.error("Completion Date is required.");
                          return;
                        }
                        if (!completedBy.trim()) {
                          toast.error("Completed By is required.");
                          return;
                        }

                        if (completingFollowUpId) {
                          let hour = parseInt(completionHour);
                          if (completionPeriod === "PM" && hour < 12)
                            hour += 12;
                          if (completionPeriod === "AM" && hour === 12)
                            hour = 0;
                          const time24 = `${hour.toString().padStart(2, "0")}:${completionMinute}:00`;
                          const completedAt = `${completionDate} ${time24}`;

                          onToggleStatus(
                            completingFollowUpId,
                            completionBrief,
                            completedAt,
                            completedBy,
                          );
                        }
                        setShowCompletionModal(false);
                        setCompletingFollowUpId(null);
                        setCompletionBrief("");
                      }}
                      className="w-full py-3 bg-[#18254D] text-white rounded-xl text-[13px] font-bold  tracking-[0.25em] shadow-xl active:scale-[0.97] transition-all hover:bg-[#1e2e5e] hover:shadow-2xl flex items-center justify-center gap-3"
                    >
                      Complete
                    </button>
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )}
      </div>

      {showAddModal &&
        createPortal(
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[99999] flex items-center justify-center p-4 overflow-y-auto custom-scrollbar">
            <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl border border-slate-200 animate-fade-in my-auto max-h-[90vh] flex flex-col">
              <div className="bg-primary p-4 text-white relative rounded-t-xl">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({
                      clientId: "",
                      title: "",
                      description: "",
                      followup_date: new Date().toLocaleDateString("en-CA"),
                      followup_mode: "call",
                      followup_status: "pending",
                      follow_brief: "",
                      priority: "Medium",
                      timeHour: "12",
                      timeMinute: "00",
                      timePeriod: "PM",
                    });
                  }}
                  className="absolute top-4 right-4 p-1.5 hover:bg-white/10 rounded-xl transition-colors"
                >
                  <X size={18} strokeWidth={3} />
                </button>
                <h3 className="text-base font-bold tracking-tighter mb-0.5">
                  {formData.id ? "Edit Follow Up" : "Add Follow Up"}
                </h3>
                <p className="text-slate-400 text-[14px] font-bold  tracking-widest">
                  {formData.id
                    ? "Update follow-up details"
                    : "Create a new follow-up task"}
                </p>
              </div>
              <form onSubmit={handleSubmit} className="p-4 space-y-2 overflow-y-auto no-scrollbar">
                <div className="space-y-2">
                  {typeFilter === "Active" ? (
                    <div className="space-y-1.5">
                      <label className="text-[14px] font-bold text-primary tracking-widest ml-1">
                        Select Project
                      </label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setIsProjectDropdownOpen(!isProjectDropdownOpen)
                          }
                          className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium shadow-sm hover:border-secondary transition-all"
                        >
                          <span className="text-primary truncate max-w-[90%]">
                            {formData.projectId
                              ? projects.find((p) => p.id == formData.projectId)
                                  ?.name
                              : "Select a project..."}
                          </span>
                          <ChevronDown
                            size={16}
                            className={`text-slate-400 transition-transform flex-shrink-0 ${isProjectDropdownOpen ? "rotate-180" : ""}`}
                          />
                        </button>

                        {isProjectDropdownOpen && (
                          <>
                            <div
                              className="fixed inset-0 z-[80] pointer-events-none"
                              onClick={() => setIsProjectDropdownOpen(false)}
                            />
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden z-[90] animate-fade-in-up origin-top max-h-80 flex flex-col">
                              <div className="sticky top-0 bg-[#18254D] z-10">
                                <div className="px-4 py-3 border-b border-white/10">
                                  <p className="text-[14px] font-bold text-white/50 tracking-widest">
                                    Select Project
                                  </p>
                                </div>
                                <div className="p-2 border-b border-slate-100 bg-slate-50">
                                  <div className="relative">
                                    <Search
                                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                      size={14}
                                    />
                                    <input
                                      type="text"
                                      placeholder="Search projects..."
                                      className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-secondary transition-colors"
                                      value={projectSearchTerm}
                                      onChange={(e) =>
                                        setProjectSearchTerm(e.target.value)
                                      }
                                      autoFocus
                                    />
                                  </div>
                                </div>
                              </div>
                              <div className="overflow-y-auto max-h-60">
                                {projects
                                  .filter((p) => {
                                    // Only show active/in-progress/hold projects (exclude completed)
                                    if (p.status === "Completed") return false;

                                    // Search filtering
                                    if (!projectSearchTerm.trim()) return true;
                                    const q = projectSearchTerm.toLowerCase();
                                    return (
                                      p.name?.toLowerCase().includes(q) ||
                                      p.clientName?.toLowerCase().includes(q)
                                    );
                                  })
                                  .map((p) => (
                                    <button
                                      key={p.id}
                                      type="button"
                                      onClick={() => {
                                        setFormData({
                                          ...formData,
                                          projectId: p.id,
                                          clientId: p.clientId,
                                          projectName: p.name,
                                        });
                                        setIsProjectDropdownOpen(false);
                                        setProjectSearchTerm("");
                                      }}
                                      className={`w-full text-left px-4 py-2.5 text-[12px] font-bold tracking-widest transition-colors ${
                                        formData.projectId == p.id
                                          ? "bg-slate-100 text-secondary"
                                          : "text-[#18254D] hover:bg-slate-50"
                                      }`}
                                    >
                                      <div className="flex flex-col">
                                        <span>{p.name}</span>
                                        <span className="text-[13px] opacity-50">
                                          {p.clientName}
                                        </span>
                                      </div>
                                    </button>
                                  ))}
                                {projects.filter((p) => {
                                  if (p.status === "Completed") return false;
                                  if (!projectSearchTerm.trim()) return true;
                                  const q = projectSearchTerm.toLowerCase();
                                  return (
                                    p.name?.toLowerCase().includes(q) ||
                                    p.clientName?.toLowerCase().includes(q)
                                  );
                                }).length === 0 && (
                                  <div className="px-4 py-6 text-center">
                                    <p className="text-[12px] font-bold text-slate-400 italic">
                                      No active projects found
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <label className="text-[14px] font-bold text-primary tracking-widest ml-1">
                        {typeFilter === "Lead"
                          ? "Lead Name"
                          : "Target Identity"}{" "}
                        <span className="text-error">*</span>
                      </label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setIsClientDropdownOpen(!isClientDropdownOpen)
                          }
                          className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium shadow-sm hover:border-secondary transition-all"
                        >
                          <span className="text-primary truncate max-w-[90%]">
                            {formData.clientId
                              ? clients.find((c) => c.id == formData.clientId)
                                  ?.name
                              : typeFilter === "Lead"
                                ? "Select a lead..."
                                : "Select a client or lead..."}
                          </span>
                          <ChevronDown
                            size={16}
                            className={`text-slate-400 transition-transform flex-shrink-0 ${isClientDropdownOpen ? "rotate-180" : ""}`}
                          />
                        </button>

                        {isClientDropdownOpen && (
                          <>
                            <div
                              className="fixed inset-0 z-[80] pointer-events-none"
                              onClick={() => setIsClientDropdownOpen(false)}
                            />
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden z-[90] animate-fade-in-up origin-top max-h-80 flex flex-col">
                              <div className="sticky top-0 bg-[#18254D] z-10">
                                <div className="px-4 py-3 border-b border-white/10">
                                  <p className="text-[14px] font-bold text-white/50 tracking-widest">
                                    Select{" "}
                                    {typeFilter === "Lead"
                                      ? "Lead"
                                      : "Client/Lead"}
                                  </p>
                                </div>
                                <div className="p-2 border-b border-slate-100 bg-slate-50">
                                  <div className="relative">
                                    <Search
                                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                      size={14}
                                    />
                                    <input
                                      type="text"
                                      placeholder="Search..."
                                      className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-secondary transition-colors"
                                      value={clientSearchTerm}
                                      onChange={(e) =>
                                        setClientSearchTerm(e.target.value)
                                      }
                                      autoFocus
                                    />
                                  </div>
                                </div>
                              </div>
                              <div className="overflow-y-auto max-h-60">
                                {clients
                                  .filter((c) => {
                                    if (
                                      typeFilter === "Lead" &&
                                      (c.status !== "Lead" || c.isConverted)
                                    )
                                      return false;
                                    if (!clientSearchTerm.trim()) return true;
                                    const q = clientSearchTerm.toLowerCase();
                                    return (
                                      c.name?.toLowerCase().includes(q) ||
                                      c.company?.toLowerCase().includes(q)
                                    );
                                  })
                                  .map((c) => (
                                    <button
                                      key={`client-opt-${c.id}`}
                                      type="button"
                                      onClick={() => {
                                        setFormData({
                                          ...formData,
                                          clientId: c.id,
                                        });
                                        setIsClientDropdownOpen(false);
                                        setClientSearchTerm("");
                                      }}
                                      className={`w-full text-left px-4 py-2.5 text-[12px] font-bold tracking-widest transition-colors ${
                                        formData.clientId == c.id
                                          ? "bg-slate-100 text-secondary"
                                          : "text-[#18254D] hover:bg-slate-50"
                                      }`}
                                    >
                                      <div className="flex flex-col">
                                        <span>{c.name}</span>
                                        {c.company && (
                                          <span className="text-[13px] opacity-50">
                                            {c.company}
                                          </span>
                                        )}
                                      </div>
                                    </button>
                                  ))}
                                {clients.filter((c) => {
                                  if (
                                    typeFilter === "Lead" &&
                                    (c.status !== "Lead" || c.isConverted)
                                  )
                                    return false;
                                  if (!clientSearchTerm.trim()) return true;
                                  const q = clientSearchTerm.toLowerCase();
                                  return (
                                    c.name?.toLowerCase().includes(q) ||
                                    c.company?.toLowerCase().includes(q)
                                  );
                                }).length === 0 && (
                                  <div className="px-4 py-6 text-center">
                                    <p className="text-[12px] font-bold text-slate-400 italic">
                                      No results found
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-[14px] font-bold text-primary  tracking-widest ml-1">
                      Task Title <span className="text-error">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      disabled={formData.followup_status === "completed"}
                      placeholder="e.g. Discuss project scope"
                      className={`w-full px-3.5 py-2.5 border rounded-xl text-sm font-medium shadow-sm focus:ring-4 focus:ring-secondary/10 focus:border-secondary focus:outline-none ${formData.followup_status === "completed" ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed" : "bg-slate-50 border-slate-200"}`}
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[14px] font-bold text-primary  tracking-widest ml-1">
                      Description <span className="text-error">*</span>
                    </label>
                    <textarea
                      disabled={formData.followup_status === "completed"}
                      placeholder="Add details about your follow-up..."
                      className={`w-full px-3.5 py-2.5 border rounded-xl text-sm font-medium shadow-sm focus:ring-4 focus:ring-secondary/10 focus:border-secondary focus:outline-none resize-none ${formData.followup_status === "completed" ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed" : "bg-slate-50 border-slate-200"}`}
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      rows="3"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[14px] font-bold text-primary  tracking-widest ml-1">
                        Follow-up Date <span className="text-error">*</span>
                      </label>
                      <DatePicker
                        value={formData.followup_date}
                        disabled={formData.followup_status === "completed"}
                        onChange={(val) =>
                          setFormData({ ...formData, followup_date: val })
                        }
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[14px] font-bold text-primary  tracking-widest ml-1">
                        Follow-up Time (12h){" "}
                        <span className="text-error">*</span>
                      </label>
                      <div className="flex gap-2 relative">
                        {/* Hour Dropdown */}
                        <div className="flex-1 relative">
                          <button
                            type="button"
                            disabled={formData.followup_status === "completed"}
                            onClick={() =>
                              setIsHourDropdownOpen(!isHourDropdownOpen)
                            }
                            className={`w-full flex items-center justify-between px-3 py-2.5 border rounded-xl text-sm font-bold shadow-sm transition-all ${formData.followup_status === "completed" ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed" : "bg-slate-50 border-slate-200 hover:border-secondary"}`}
                          >
                            <span>{formData.timeHour.padStart(2, "0")}</span>
                            {formData.followup_status !== "completed" && (
                              <ChevronDown
                                size={14}
                                className={`text-slate-400 transition-transform ${isHourDropdownOpen ? "rotate-180" : ""}`}
                              />
                            )}
                          </button>
                          {isHourDropdownOpen && (
                            <>
                              <div
                                className="fixed inset-0 z-[80] pointer-events-none"
                                onClick={() => setIsHourDropdownOpen(false)}
                              />
                              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-y-auto max-h-48 z-[90] animate-fade-in-up origin-top">
                                {Array.from(
                                  { length: 12 },
                                  (_, i) => i + 1,
                                ).map((h) => (
                                  <button
                                    key={`hour-${h}`}
                                    type="button"
                                    onClick={() => {
                                      setFormData({
                                        ...formData,
                                        timeHour: h.toString(),
                                      });
                                      setIsHourDropdownOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-2 text-[12px] font-bold tracking-widest transition-colors ${formData.timeHour === h.toString() ? "bg-slate-100 text-secondary" : "text-[#18254D] hover:bg-slate-50"}`}
                                  >
                                    {h.toString().padStart(2, "0")}
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>

                        {/* Minute Dropdown */}
                        <div className="flex-1 relative">
                          <button
                            type="button"
                            disabled={formData.followup_status === "completed"}
                            onClick={() =>
                              setIsMinuteDropdownOpen(!isMinuteDropdownOpen)
                            }
                            className={`w-full flex items-center justify-between px-3 py-2.5 border rounded-xl text-sm font-bold shadow-sm transition-all ${formData.followup_status === "completed" ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed" : "bg-slate-50 border-slate-200 hover:border-secondary"}`}
                          >
                            <span>{formData.timeMinute}</span>
                            {formData.followup_status !== "completed" && (
                              <ChevronDown
                                size={14}
                                className={`text-slate-400 transition-transform ${isMinuteDropdownOpen ? "rotate-180" : ""}`}
                              />
                            )}
                          </button>
                          {isMinuteDropdownOpen && (
                            <>
                              <div
                                className="fixed inset-0 z-[80] pointer-events-none"
                                onClick={() => setIsMinuteDropdownOpen(false)}
                              />
                              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-y-auto max-h-48 z-[90] animate-fade-in-up origin-top">
                                {Array.from({ length: 60 }, (_, i) => i).map(
                                  (m) => (
                                    <button
                                      key={`min-${m}`}
                                      type="button"
                                      onClick={() => {
                                        setFormData({
                                          ...formData,
                                          timeMinute: m
                                            .toString()
                                            .padStart(2, "0"),
                                        });
                                        setIsMinuteDropdownOpen(false);
                                      }}
                                      className={`w-full text-left px-4 py-2 text-[12px] font-bold tracking-widest transition-colors ${formData.timeMinute === m.toString().padStart(2, "0") ? "bg-slate-100 text-secondary" : "text-[#18254D] hover:bg-slate-50"}`}
                                    >
                                      {m.toString().padStart(2, "0")}
                                    </button>
                                  ),
                                )}
                              </div>
                            </>
                          )}
                        </div>

                        {/* Period Dropdown */}
                        <div className="w-20 relative">
                          <button
                            type="button"
                            disabled={formData.followup_status === "completed"}
                            onClick={() =>
                              setIsPeriodDropdownOpen(!isPeriodDropdownOpen)
                            }
                            className={`w-full flex items-center justify-between px-3 py-2.5 border rounded-xl text-sm font-bold shadow-sm transition-all ${formData.followup_status === "completed" ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed" : "bg-slate-50 border-slate-200 hover:border-secondary"}`}
                          >
                            <span>{formData.timePeriod}</span>
                            {formData.followup_status !== "completed" && (
                              <ChevronDown
                                size={14}
                                className={`text-slate-400 transition-transform ${isPeriodDropdownOpen ? "rotate-180" : ""}`}
                              />
                            )}
                          </button>
                          {isPeriodDropdownOpen && (
                            <>
                              <div
                                className="fixed inset-0 z-[80] pointer-events-none"
                                onClick={() => setIsPeriodDropdownOpen(false)}
                              />
                              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden z-[90] animate-fade-in-up origin-top">
                                {["AM", "PM"].map((p) => (
                                  <button
                                    key={`period-${p}`}
                                    type="button"
                                    onClick={() => {
                                      setFormData({
                                        ...formData,
                                        timePeriod: p,
                                      });
                                      setIsPeriodDropdownOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-2.5 text-[12px] font-bold tracking-widest transition-colors ${formData.timePeriod === p ? "bg-slate-100 text-secondary" : "text-[#18254D] hover:bg-slate-50"}`}
                                  >
                                    {p}
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[14px] font-bold text-primary  tracking-widest ml-1">
                      Priority <span className="text-error">*</span>
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setIsPriorityDropdownOpen(!isPriorityDropdownOpen)
                        }
                        className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold shadow-sm hover:border-secondary transition-all"
                      >
                        <span
                          className={`capitalize ${getPriorityBadge(formData.priority)} px-2 py-0.5 rounded text-[12px]`}
                        >
                          {formData.priority}
                        </span>
                        <ChevronDown
                          size={16}
                          className={`text-slate-400 transition-transform ${isPriorityDropdownOpen ? "rotate-180" : ""}`}
                        />
                      </button>
                      {isPriorityDropdownOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-[80] pointer-events-none"
                            onClick={() => setIsPriorityDropdownOpen(false)}
                          />
                          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden z-[90] animate-fade-in-up origin-top">
                            {["Low", "Medium", "High"].map((p) => (
                              <button
                                key={`priority-${p}`}
                                type="button"
                                onClick={() => {
                                  setFormData({ ...formData, priority: p });
                                  setIsPriorityDropdownOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-[12px] font-bold tracking-widest transition-colors ${formData.priority === p ? "bg-slate-100 text-secondary" : "text-[#18254D] hover:bg-slate-50"}`}
                              >
                                {p}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[14px] font-bold text-primary  tracking-widest ml-1">
                      Follow-up Mode <span className="text-error">*</span>
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setIsModeDropdownOpen(!isModeDropdownOpen)
                        }
                        className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold shadow-sm hover:border-secondary transition-all"
                      >
                        <span className="text-primary capitalize">
                          {formData.followup_mode}
                        </span>
                        <ChevronDown
                          size={16}
                          className={`text-slate-400 transition-transform ${isModeDropdownOpen ? "rotate-180" : ""}`}
                        />
                      </button>

                      {isModeDropdownOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-[80] pointer-events-none"
                            onClick={() => setIsModeDropdownOpen(false)}
                          />
                          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden z-[90] animate-fade-in-up origin-top">
                            <div className="bg-[#18254D] px-4 py-3 border-b border-white/10">
                              <p className="text-[14px] font-bold text-white  tracking-widest">
                                Select Mode
                              </p>
                            </div>
                            {["Call", "Email", "Meeting", "Whatsapp"].map(
                              (mode) => (
                                <button
                                  key={`mode-${mode}`}
                                  type="button"
                                  onClick={() => {
                                    setFormData({
                                      ...formData,
                                      followup_mode: mode,
                                    });
                                    setIsModeDropdownOpen(false);
                                  }}
                                  className={`w-full text-left px-4 py-2.5 text-[12px] font-bold  tracking-widest transition-colors capitalize ${
                                    formData.followup_mode === mode
                                      ? "bg-slate-100 text-secondary"
                                      : "text-[#18254D] hover:bg-slate-50"
                                  }`}
                                >
                                  {mode}
                                </button>
                              ),
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {formData.followup_status === "completed" && (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-[14px] font-bold text-primary tracking-widest ml-1">
                          Follow Conclusion Brief
                        </label>
                        <textarea
                          placeholder="Update the conclusion brief..."
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium shadow-sm focus:ring-4 focus:ring-secondary/10 focus:border-secondary focus:outline-none resize-none"
                          value={formData.follow_brief || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              follow_brief: e.target.value,
                            })
                          }
                          rows="3"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[14px] font-bold text-primary tracking-widest ml-1">
                          Completed By
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. John Doe"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium shadow-sm focus:ring-4 focus:ring-secondary/10 focus:border-secondary focus:outline-none"
                          value={formData.completed_by || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              completed_by: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-[14px] font-bold text-primary tracking-widest ml-1">
                            Completion Date
                          </label>
                          <DatePicker
                            value={formData.completionDate}
                            onChange={(val) =>
                              setFormData({ ...formData, completionDate: val })
                            }
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[14px] font-bold text-primary tracking-widest ml-1">
                            Completion Time
                          </label>
                          <div className="flex gap-2 relative">
                            {/* Hour Dropdown */}
                            <div className="flex-1 relative">
                              <button
                                type="button"
                                onClick={() =>
                                  setIsCompHourOpen(!isCompHourOpen)
                                }
                                className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold shadow-sm hover:border-secondary transition-all"
                              >
                                <span>
                                  {formData.completionHour.padStart(2, "0")}
                                </span>
                                <ChevronDown
                                  size={14}
                                  className={`text-slate-400 transition-transform ${isCompHourOpen ? "rotate-180" : ""}`}
                                />
                              </button>
                              {isCompHourOpen && (
                                <>
                                  <div
                                    className="fixed inset-0 z-[80] pointer-events-none"
                                    onClick={() => setIsCompHourOpen(false)}
                                  />
                                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-y-auto max-h-48 z-[90] animate-fade-in-up origin-top">
                                    {Array.from(
                                      { length: 12 },
                                      (_, i) => i + 1,
                                    ).map((h) => (
                                      <button
                                        key={h}
                                        type="button"
                                        onClick={() => {
                                          setFormData({
                                            ...formData,
                                            completionHour: h.toString(),
                                          });
                                          setIsCompHourOpen(false);
                                        }}
                                        className={`w-full text-left px-4 py-2 text-[12px] font-bold tracking-widest transition-colors ${formData.completionHour === h.toString() ? "bg-slate-100 text-secondary" : "text-[#18254D] hover:bg-slate-50"}`}
                                      >
                                        {h.toString().padStart(2, "0")}
                                      </button>
                                    ))}
                                  </div>
                                </>
                              )}
                            </div>

                            {/* Minute Dropdown */}
                            <div className="flex-1 relative">
                              <button
                                type="button"
                                onClick={() => setIsCompMinOpen(!isCompMinOpen)}
                                className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold shadow-sm hover:border-secondary transition-all"
                              >
                                <span>{formData.completionMinute}</span>
                                <ChevronDown
                                  size={14}
                                  className={`text-slate-400 transition-transform ${isCompMinOpen ? "rotate-180" : ""}`}
                                />
                              </button>
                              {isCompMinOpen && (
                                <>
                                  <div
                                    className="fixed inset-0 z-[80] pointer-events-none"
                                    onClick={() => setIsCompMinOpen(false)}
                                  />
                                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-y-auto max-h-48 z-[90] animate-fade-in-up origin-top">
                                    {Array.from(
                                      { length: 60 },
                                      (_, i) => i,
                                    ).map((m) => (
                                      <button
                                        key={m}
                                        type="button"
                                        onClick={() => {
                                          setFormData({
                                            ...formData,
                                            completionMinute: m
                                              .toString()
                                              .padStart(2, "0"),
                                          });
                                          setIsCompMinOpen(false);
                                        }}
                                        className={`w-full text-left px-4 py-2 text-[12px] font-bold tracking-widest transition-colors ${formData.completionMinute === m.toString().padStart(2, "0") ? "bg-slate-100 text-secondary" : "text-[#18254D] hover:bg-slate-50"}`}
                                      >
                                        {m.toString().padStart(2, "0")}
                                      </button>
                                    ))}
                                  </div>
                                </>
                              )}
                            </div>

                            {/* Period Dropdown */}
                            <div className="w-20 relative">
                              <button
                                type="button"
                                onClick={() =>
                                  setIsCompPeriodOpen(!isCompPeriodOpen)
                                }
                                className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold shadow-sm hover:border-secondary transition-all"
                              >
                                <span>{formData.completionPeriod}</span>
                                <ChevronDown
                                  size={14}
                                  className={`text-slate-400 transition-transform ${isCompPeriodOpen ? "rotate-180" : ""}`}
                                />
                              </button>
                              {isCompPeriodOpen && (
                                <>
                                  <div
                                    className="fixed inset-0 z-[80] pointer-events-none"
                                    onClick={() => setIsCompPeriodOpen(false)}
                                  />
                                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden z-[90] animate-fade-in-up origin-top">
                                    {["AM", "PM"].map((p) => (
                                      <button
                                        key={p}
                                        type="button"
                                        onClick={() => {
                                          setFormData({
                                            ...formData,
                                            completionPeriod: p,
                                          });
                                          setIsCompPeriodOpen(false);
                                        }}
                                        className={`w-full text-left px-4 py-2.5 text-[12px] font-bold tracking-widest transition-colors ${formData.completionPeriod === p ? "bg-slate-100 text-secondary" : "text-[#18254D] hover:bg-slate-50"}`}
                                      >
                                        {p}
                                      </button>
                                    ))}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-[14px] font-bold text-primary  tracking-widest ml-1">
                      Follow-up Status <span className="text-error">*</span>
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setIsStatusDropdownOpen(!isStatusDropdownOpen)
                        }
                        className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold shadow-sm hover:border-secondary transition-all"
                      >
                        <span className="text-primary capitalize">
                          {formData.followup_status}
                        </span>
                        <ChevronDown
                          size={16}
                          className={`text-slate-400 transition-transform ${isStatusDropdownOpen ? "rotate-180" : ""}`}
                        />
                      </button>

                      {isStatusDropdownOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-[80] pointer-events-none"
                            onClick={() => setIsStatusDropdownOpen(false)}
                          />
                          <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden z-[90] animate-fade-in-down origin-bottom">
                            <div className="bg-[#18254D] px-4 py-3 border-b border-white/10">
                              <p className="text-[14px] font-bold text-white/50  tracking-widest">
                                Select Status
                              </p>
                            </div>
                            {["pending", "completed", "reschedule", "cancelled"]
                              .filter((status) => {
                                if (formData.id) {
                                  const originalFollowup = followUps.find(
                                    (f) => f.id == formData.id,
                                  );
                                  if (
                                    originalFollowup?.status === "completed"
                                  ) {
                                    return status === "completed";
                                  }
                                }
                                return true;
                              })
                              .map((status) => (
                                <button
                                  key={status}
                                  type="button"
                                  onClick={() => {
                                    const updates = { followup_status: status };

                                    // If switching TO completed, and it's currently empty, pre-fill with defaults
                                    if (status === "completed") {
                                      if (!formData.completed_by) {
                                        const user = JSON.parse(
                                          localStorage.getItem("user") || "{}",
                                        );
                                        updates.completed_by =
                                          user.full_name || "";
                                      }
                                      if (!formData.completionDate) {
                                        updates.completionDate = new Date()
                                          .toISOString()
                                          .split("T")[0];
                                      }
                                      if (!formData.completionHour) {
                                        const now = new Date();
                                        updates.completionHour = (
                                          now.getHours() % 12 || 12
                                        ).toString();
                                        updates.completionMinute = now
                                          .getMinutes()
                                          .toString()
                                          .padStart(2, "0");
                                        updates.completionPeriod =
                                          now.getHours() >= 12 ? "PM" : "AM";
                                      }
                                    }

                                    setFormData({
                                      ...formData,
                                      ...updates,
                                    });
                                    setIsStatusDropdownOpen(false);
                                  }}
                                  className={`w-full text-left px-4 py-2.5 text-[12px] font-bold  tracking-widest transition-colors capitalize ${
                                    formData.followup_status === status
                                      ? "bg-slate-100 text-secondary"
                                      : "text-[#18254D] hover:bg-slate-50"
                                  }`}
                                >
                                  {status === "reschedule"
                                    ? "Rescheduled"
                                    : status}
                                </button>
                              ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="pt-1 shrink-0">
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[#18254D] text-white rounded-xl text-[13px] font-bold tracking-[0.2em] shadow-lg active:scale-[0.97] transition-all hover:bg-[#1e2e5e] flex items-center justify-center gap-2"
                  >
                    {formData.id ? "Save Changes" : "Create Follow-up"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default FollowUpList;
