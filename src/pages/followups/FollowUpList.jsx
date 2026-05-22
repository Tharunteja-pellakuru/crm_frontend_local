import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import { createPortal } from "react-dom";
import { useScrollLock } from "../../hooks/useScrollLock";
import { useSearch } from "../../hooks/useSearch";
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
  User,
  Mail,
  LayoutGrid,
  AlertTriangle,
  Folder,
  AlignLeft,
} from "lucide-react";
import SearchableDropdown from "../../components/common/SearchableDropdown";
import {
  CATEGORY_MAP,
  REVERSE_CATEGORY_MAP,
} from "../../constants/categoryConstants";
import { validateForm } from "../../utils/validation";
import { addToGoogleCalendar } from "../../utils/calendar";


const parseLocalDate = (dateStr) => {
  if (!dateStr) return new Date();
  if (dateStr instanceof Date) return dateStr;
  
  // - [x] 2. Add Desktop Table Wrapper (`hidden lg:block`)
  // - [x] 3. Implement Table Header matching Leads page
  // - [x] 4. Map Follow-up data to Table Rows (`<tr>`)
  // - [x] 5. Migrate Action Buttons to Table Rows
  // - [x] 6. Verify layout responsiveness
  // If the date string contains a 'T' but ends with 'Z', it might be treated as UTC.
  // If we want to treat it as local time, we should replace T with a space and remove Z.
  // This is a common fix when backends return local times as ISO UTC strings.
  if (typeof dateStr === 'string' && dateStr.includes('T') && dateStr.endsWith('Z')) {
    const normalized = dateStr.replace('T', ' ').replace('Z', '').split('.')[0];
    const date = new Date(normalized);
    if (!isNaN(date.getTime())) return date;
  }
  
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? new Date() : date;
};

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
  const [currentPage, setCurrentPage] = useState(1);
  const RECORDS_PER_PAGE = 10;
  const { searchTerm, setSearchTerm } = useSearch(setCurrentPage);
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
    priority: "High",
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
  const [endDate, setEndDate] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [modeFilter, setModeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isModeDropdownOpen, setIsModeDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedFollowUpForDetails, setSelectedFollowUpForDetails] = useState(null);
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
  const filterPopupRef = useRef(null);
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
        // - [x] 1. Preserve Mobile Layout (Wrap existing cards in `lg:hidden`)
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
    const handleScrollResize = (e) => {
      // Ignore scroll events that originate from inside the filter popup
      if (filterPopupRef.current && filterPopupRef.current.contains(e.target)) {
        return;
      }
      if (isFilterPopupOpen) setIsFilterPopupOpen(false);
    };
    const handleResize = () => {
      if (isFilterPopupOpen) setIsFilterPopupOpen(false);
    };
    if (isFilterPopupOpen) {
      window.addEventListener("scroll", handleScrollResize, true);
      window.addEventListener("resize", handleResize);
    }
    return () => {
      window.removeEventListener("scroll", handleScrollResize, true);
      window.removeEventListener("resize", handleResize);
    };
  }, [isFilterPopupOpen]);

  // Lock scroll when any modal is open
  useScrollLock(showAddModal || showCompletionModal || showDetailsModal);

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
    parseLocalDate(date) < new Date();
  const isToday = (date) => {
    const d = parseLocalDate(date);
    const today = new Date();
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  };

  // Base filtering (type + category + search + priority + mode + status) — before status tab filter
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

    // Priority Filter
    if (priorityFilter !== "All") {
      if (f.priority !== priorityFilter) return false;
    }

    // Meeting Mode Filter
    if (modeFilter !== "All") {
      if ((f.followup_mode || "").toLowerCase() !== modeFilter.toLowerCase()) return false;
    }

    // Follow Status Filter
    if (statusFilter !== "All") {
      const fStatus = (f.status || f.followup_status || "").toLowerCase();
      if (fStatus !== statusFilter.toLowerCase()) return false;
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

  // Priority sort order: High first, then Medium, then Low
  const priorityOrder = { High: 0, Medium: 1, Low: 2 };

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

      // Completed items always go to the bottom
      if (isCompletedA && !isCompletedB) return 1;
      if (!isCompletedA && isCompletedB) return -1;

      // If both are completed, sort descending (newest first) by completed_at (or dueDate)
      if (isCompletedA && isCompletedB) {
        const timeA = parseLocalDate(a.completed_at || a.dueDate).getTime();
        const timeB = parseLocalDate(b.completed_at || b.dueDate).getTime();
        return timeB - timeA;
      }

      // Sort purely by date and time (closest first) for pending items
      const timeA = parseLocalDate(a.dueDate).getTime();
      const timeB = parseLocalDate(b.dueDate).getTime();
      if (timeA !== timeB) return timeA - timeB;

      // If time is same, sort by priority (High -> Medium -> Low)
      const pA = priorityOrder[a.priority] ?? 1;
      const pB = priorityOrder[b.priority] ?? 1;
      return pA - pB;
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
          // Get current user for updated_by field
          const user = JSON.parse(localStorage.getItem("user") || "{}");
          await onEditFollowUp({
            ...formData,
            clientId: finalClientId,
            dueDate: combinedDateTime,
            followup_date: combinedDateTime,
            completed_at: combinedCompletionStr,
            followup_status: formattedStatus,
            updated_by: user.full_name || user.username || "System",
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
        priority: "High",
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

  const handleAddToCalendar = async (f) => {
    try {
      const startTime = parseLocalDate(f.dueDate);
      const endTime = new Date(startTime.getTime() + 30 * 60000); // 30 mins later
      
      const client = getClientById(f.clientId, f.leadId, f.projectId);
      const eventData = {
        title: `Follow-up: ${f.title}`,
        description: `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n 📋 Follow-up Title\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n 📌 TITLE:     ${f.title}\n 👤 CLIENT:    ${client?.name || "N/A"}\n 🏢 COMPANY:   ${client?.company || "N/A"}\n 📞 MODE:      ${f.followup_mode || "Call"}\n\n ──────────────────────────────\n 📝 DESCRIPTION:\n ${f.description || "No description provided."}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nGenerated via Parivartan CRM`,
        start: startTime,
        end: endTime
      };

      toast.promise(addToGoogleCalendar(eventData), {
        loading: 'Connecting to Google Calendar...',
        success: 'Event added to your calendar!',
        error: 'Failed to add event to calendar.'
      });
    } catch (error) {
      console.error(error);
      toast.error("Could not sync with Google Calendar.");
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

  const getModeBadge = (mode) => {
    switch (mode?.toLowerCase()) {
      case "call":
        return "bg-success/10 text-success border-success/20";
      case "email":
        return "bg-info/10 text-info border-info/20";
      case "meeting":
        return "bg-secondary/10 text-secondary border-secondary/20";
      case "whatsapp":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      default:
        return "bg-slate-50 text-slate-500 border-slate-200";
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
                  priority: "High",
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

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Total Card */}
          <div className="bg-white p-3 sm:p-5 rounded-2xl shadow-sm border border-slate-200 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="p-2 sm:p-3 rounded-full bg-blue-50 text-blue-500 shrink-0">
                <LayoutGrid className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="text-slate-500 text-[10px] sm:text-xs font-semibold truncate">Total Pending</h3>
                <p className="text-lg sm:text-2xl font-bold text-[#18254D] leading-none mt-1">{tabCounts.All}</p>
              </div>
            </div>
          </div>
          {/* Overdue Card */}
          <div className="bg-white p-3 sm:p-5 rounded-2xl shadow-sm border border-slate-200 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="p-2 sm:p-3 rounded-full bg-rose-50 text-rose-500 shrink-0">
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="text-slate-500 text-[10px] sm:text-xs font-semibold truncate">Overdue</h3>
                <p className="text-lg sm:text-2xl font-bold text-[#18254D] leading-none mt-1">{tabCounts.Overdue}</p>
              </div>
            </div>
          </div>
          {/* Today Card */}
          <div className="bg-white p-3 sm:p-5 rounded-2xl shadow-sm border border-slate-200 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="p-2 sm:p-3 rounded-full bg-amber-50 text-amber-500 shrink-0">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="text-slate-500 text-[10px] sm:text-xs font-semibold truncate">Today</h3>
                <p className="text-lg sm:text-2xl font-bold text-[#18254D] leading-none mt-1">{tabCounts.Today}</p>
              </div>
            </div>
          </div>
          {/* Upcoming Card */}
          <div className="bg-white p-3 sm:p-5 rounded-2xl shadow-sm border border-slate-200 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="p-2 sm:p-3 rounded-full bg-sky-50 text-sky-500 shrink-0">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="text-slate-500 text-[10px] sm:text-xs font-semibold truncate">Upcoming</h3>
                <p className="text-lg sm:text-2xl font-bold text-[#18254D] leading-none mt-1">{tabCounts.Upcoming}</p>
              </div>
            </div>
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
                  startDate || endDate || (typeFilter === "Active" && categoryFilter !== "All") || priorityFilter !== "All" || modeFilter !== "All" || statusFilter !== "All"
                    ? "bg-secondary/5 border-secondary text-secondary"
                    : "bg-slate-50 border-slate-100 text-[#18254D] hover:bg-white hover:border-slate-200 shadow-slate-200/50"
                }`}
              >
                <Filter
                  size={14}
                  className={(startDate || endDate || (typeFilter === "Active" && categoryFilter !== "All") || priorityFilter !== "All" || modeFilter !== "All" || statusFilter !== "All") ? "text-secondary" : "text-slate-400"}
                />
                <span>FILTERS</span>
                {(startDate || endDate || (typeFilter === "Active" && categoryFilter !== "All") || priorityFilter !== "All" || modeFilter !== "All" || statusFilter !== "All") && (
                  <span className="flex items-center justify-center w-5 h-5 bg-secondary text-white text-[10px] font-black rounded-full ml-1 shadow-sm">
                    {[
                      !!startDate,
                      !!endDate,
                      (typeFilter === "Active" && categoryFilter !== "All"),
                      priorityFilter !== "All",
                      modeFilter !== "All",
                      statusFilter !== "All",
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
                        ref={filterPopupRef}
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
                        {(startDate || endDate || (typeFilter === "Active" && categoryFilter !== "All") || priorityFilter !== "All" || modeFilter !== "All" || statusFilter !== "All") && (
                          <button
                            onClick={() => {
                              setStartDate("");
                              setEndDate("");
                              setCategoryFilter("All");
                              setPriorityFilter("All");
                              setModeFilter("All");
                              setStatusFilter("All");
                              setIsFilterPopupOpen(false);
                            }}
                            className="text-[10px] font-black text-rose-500 hover:text-rose-600 tracking-widest uppercase transition-colors"
                          >
                            Clear All
                          </button>
                        )}
                      </div>

                      {/* Scrollable Body */}
                      <div className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">

                        {/* Priority Filter */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase ml-1">
                            Priority
                          </label>
                          <SearchableDropdown
                            placeholder="Select Priority..."
                            options={["All", "High", "Medium", "Low"].map(p => ({
                              label: p.toUpperCase(),
                              value: p
                            }))}
                            value={priorityFilter}
                            onChange={setPriorityFilter}
                          />
                        </div>

                        {/* Meeting Mode Filter */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase ml-1">
                            Meeting Mode
                          </label>
                          <SearchableDropdown
                            placeholder="Select Mode..."
                            options={["All", "Call", "Email", "Meeting", "Whatsapp"].map(m => ({
                              label: m.toUpperCase(),
                              value: m
                            }))}
                            value={modeFilter}
                            onChange={setModeFilter}
                          />
                        </div>

                        {/* Follow Status Filter */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase ml-1">
                            Follow Status
                          </label>
                          <SearchableDropdown
                            placeholder="Select Status..."
                            options={["All", "Pending", "Completed"].map(s => ({
                              label: s.toUpperCase(),
                              value: s
                            }))}
                            value={statusFilter}
                            onChange={setStatusFilter}
                          />
                        </div>

                        {/* Date Range Section */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase ml-1">
                            Follow-up Date Range
                          </label>
                          <div className="grid grid-cols-2 gap-2">
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
        {/* View Toggles (Pill Style) */}
        <div className="flex flex-wrap justify-center sm:justify-start gap-2 sm:gap-3 my-4 w-full px-1 sm:px-0">
          <button onClick={() => setActiveFilter("All")} className={`px-4 py-2 sm:px-5 sm:py-2 rounded-full text-[12px] sm:text-[13px] font-bold flex items-center gap-2 transition-all cursor-pointer border ${activeFilter === "All" || !["Overdue","Today","Upcoming"].includes(activeFilter) ? "bg-[#0F172A] text-white border-[#0F172A]" : "bg-white text-[#0F172A] border-slate-200 hover:bg-slate-50"}`}>
             <LayoutGrid size={16} /> All
          </button>
          <button onClick={() => setActiveFilter("Overdue")} className={`px-4 py-2 sm:px-5 sm:py-2 rounded-full text-[12px] sm:text-[13px] font-bold flex items-center gap-2 transition-all cursor-pointer border ${activeFilter === "Overdue" ? "bg-[#FEF2F2] text-[#E11D48] border-[#FECACA]" : "bg-white text-[#E11D48] border-[#FECACA] hover:bg-[#FEF2F2]"}`}>
             <AlertTriangle size={16} /> Overdue
          </button>
          <button onClick={() => setActiveFilter("Today")} className={`px-4 py-2 sm:px-5 sm:py-2 rounded-full text-[12px] sm:text-[13px] font-bold flex items-center gap-2 transition-all cursor-pointer border ${activeFilter === "Today" ? "bg-[#FFF9ED] text-[#B45309] border-[#FDE68A]" : "bg-white text-[#B45309] border-[#FDE68A] hover:bg-[#FFF9ED]"}`}>
             <Clock size={16} /> Today
          </button>
          <button onClick={() => setActiveFilter("Upcoming")} className={`px-4 py-2 sm:px-5 sm:py-2 rounded-full text-[12px] sm:text-[13px] font-bold flex items-center gap-2 transition-all cursor-pointer border ${activeFilter === "Upcoming" ? "bg-[#F0F9FF] text-[#0284C7] border-[#BAE6FD]" : "bg-white text-[#0284C7] border-[#BAE6FD] hover:bg-[#F0F9FF]"}`}>
             <Calendar size={16} /> Upcoming
          </button>
        </div>

        {/* Mobile/Tablet Card List View */}
        <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          {filteredFollowUps.length === 0 ? (
            <div className="col-span-1 md:col-span-2 flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm w-full">
              <Bell size={24} className="text-slate-100 mb-3" />
              <p className="text-[13px] font-bold text-primary tracking-wider">
                No Active Tasks
              </p>
            </div>
          ) : (
            currentFollowUps.map((f, index) => {
              const client = getClientById(f.clientId, f.leadId, f.projectId);
              const overdue = isOverdue(f.dueDate) && f.status === "pending";
              const isFToday = isToday(f.dueDate) && f.status === "pending";
              const timeframe = f.status === "completed" ? "Completed" : (overdue ? "Overdue" : (isFToday ? "Today" : "Upcoming"));
              
              return (
                <div
                  key={`mobile-${f.id}`}
                  onClick={() => {
                    setSelectedFollowUpForDetails(f);
                    setShowDetailsModal(true);
                  }}
                  className={`bg-white p-4 rounded-2xl border transition-all ${
                    f.status === "completed"
                      ? "border-slate-100 opacity-80 shadow-none cursor-pointer"
                      : "border-slate-200 shadow-sm hover:shadow-md active:scale-[0.98] cursor-pointer"
                  }`}
                >
                  {/* Top row: Icon, Title, Status */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg border-2 border-slate-50 shadow-md shrink-0 ${
                        f.status === 'completed' ? 'bg-success' : f.priority === 'High' ? 'bg-error' : f.priority === 'Medium' ? 'bg-warning' : 'bg-info'
                      }`}>
                        {f.title.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className={`font-bold text-sm truncate ${f.status === 'completed' ? 'text-slate-400 line-through' : 'text-primary'}`}>
                          {f.title}
                        </div>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border flex items-center gap-1.5 shadow-sm ${getPriorityBadge(f.priority)}`}>
                      {f.priority} Priority
                    </span>
                  </div>

                  {/* Second Row: Lead Name */}
                  <div className="mb-4 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-[12px] font-medium text-slate-500">
                    Lead Name: <span className="font-semibold text-slate-700">{client?.name || "No Client"}</span>
                  </div>

                  {/* Third Row: Due Date and Mode */}
                  <div className="space-y-3 mb-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2 text-[12px] font-medium text-slate-600 bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                        <Calendar size={14} className="text-slate-400" />
                        {parseLocalDate(f.dueDate).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                      </div>
                      <div className="flex items-center gap-2 text-[12px] font-medium text-slate-600 bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                        <Clock size={14} className="text-slate-400" />
                        {parseLocalDate(f.dueDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between px-1">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black tracking-widest uppercase border ${getModeBadge(f.followup_mode)}`}>
                        {f.followup_mode}
                      </span>
                      {f.status === "completed" && f.completed_at && (
                        <span className="text-[10px] font-black tracking-widest uppercase text-success">
                          Completed
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bottom row: View Details and Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFollowUpForDetails(f);
                        setShowDetailsModal(true);
                      }}
                      className="flex items-center gap-1 text-[12px] font-bold text-secondary uppercase tracking-widest hover:text-secondary/80 transition-colors"
                    >
                      View Details
                      <ChevronRight size={14} />
                    </button>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (f.status === "completed") {
                            onToggleStatus(f.id);
                          } else {
                            const now = new Date();
                            setCompletionDate(now.toLocaleDateString("en-CA"));
                            setCompletionHour((now.getHours() % 12 || 12).toString());
                            setCompletionMinute(now.getMinutes().toString().padStart(2, "0"));
                            setCompletionPeriod(now.getHours() >= 12 ? "PM" : "AM");
                            setCompletingFollowUpId(f.id);
                            setCompletionBrief("");
                            setShowCompletionModal(true);
                          }
                        }}
                        className={`w-8 h-8 rounded-[8px] border transition-all flex items-center justify-center shrink-0 active:scale-90 shadow-sm ${
                          f.status === "completed" 
                            ? "bg-amber-50/50 border-amber-100 text-amber-500 hover:bg-amber-100" 
                            : "bg-emerald-50/50 border-emerald-100 text-emerald-500 hover:bg-emerald-100"
                        }`}
                      >
                        {f.status === "completed" ? <Clock size={14} strokeWidth={2.5} /> : <CheckCircle2 size={14} strokeWidth={2.5} />}
                      </button>

                      {f.status !== "completed" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCalendar(f);
                          }}
                          className="w-8 h-8 flex items-center justify-center bg-indigo-50/50 border border-indigo-100 rounded-[8px] text-indigo-500 hover:bg-indigo-100 transition-all active:scale-90 shadow-sm"
                        >
                          <Calendar size={14} strokeWidth={2.5} />
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          let compDate = new Date().toISOString().split("T")[0];
                          let compHr = "12";
                          let compMin = "00";
                          let compPrd = "PM";

                          if (f.status === "completed" && f.completed_at) {
                            const cd = parseLocalDate(f.completed_at);
                            if (!isNaN(cd.getTime())) {
                              compDate = `${cd.getFullYear()}-${(cd.getMonth() + 1).toString().padStart(2, "0")}-${cd.getDate().toString().padStart(2, "0")}`;
                              compHr = (cd.getHours() % 12 || 12).toString();
                              compMin = cd.getMinutes().toString().padStart(2, "0");
                              compPrd = cd.getHours() >= 12 ? "PM" : "AM";
                            }
                          }

                          const d = f.dueDate ? parseLocalDate(f.dueDate) : new Date();
                          setFormData({
                            ...f,
                            followup_status: f.status || f.followup_status || "pending",
                            followup_date: `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`,
                            timeHour: (d.getHours() % 12 || 12).toString(),
                            timeMinute: d.getMinutes().toString().padStart(2, "0"),
                            timePeriod: d.getHours() >= 12 ? "PM" : "AM",
                            completed_by: f.completed_by || "",
                            completionDate: compDate,
                            completionHour: compHr,
                            completionMinute: compMin,
                            completionPeriod: compPrd,
                          });
                          setShowAddModal(true);
                        }}
                        className="w-8 h-8 flex items-center justify-center bg-blue-50/50 border border-blue-100 rounded-[8px] text-blue-500 hover:bg-blue-100 transition-all active:scale-90 shadow-sm"
                      >
                        <Edit2 size={14} />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteFollowUp && onDeleteFollowUp(f.id);
                        }}
                        className="w-8 h-8 flex items-center justify-center bg-rose-50/50 border border-rose-100 rounded-[8px] text-rose-500 hover:bg-rose-100 transition-all active:scale-90 shadow-sm"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop View: Table List */}
        <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden w-full">
          <div className="w-full">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 w-[25%]">
                    Follow-up Title
                  </th>
                  <th className="px-6 py-5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 w-[20%]">
                    Lead Name
                  </th>
                  <th className="px-6 py-5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 w-[20%]">
                    Status & Mode
                  </th>
                  <th className="px-6 py-5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 w-[15%]">
                    Due Date
                  </th>
                  <th className="px-6 py-5 text-right text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 w-[20%]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredFollowUps.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <Bell size={24} className="text-slate-200 mb-3" />
                        <p className="text-[13px] font-bold text-slate-400 tracking-wider">
                          No Active Tasks
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentFollowUps.map((f, index) => {
                    const client = getClientById(f.clientId, f.leadId, f.projectId);
                    const overdue = isOverdue(f.dueDate) && f.status === "pending";
                    const isFToday = isToday(f.dueDate) && f.status === "pending";
                    const timeframe = f.status === "completed" ? "Completed" : (overdue ? "Overdue" : (isFToday ? "Today" : "Upcoming"));

                    return (
                      <tr 
                        key={`desktop-${f.id}`} 
                        onClick={() => {
                          setSelectedFollowUpForDetails(f);
                          setShowDetailsModal(true);
                        }}
                        className={`group transition-all hover:bg-slate-50/50 cursor-pointer ${f.status === "completed" ? "opacity-70 bg-slate-50/30" : ""}`}
                      >
                        {/* Col 1: Details */}
                        <td className="px-6 py-4 align-top">
                          <h4
                            className={`text-[13px] font-bold text-primary tracking-tight mb-1 cursor-pointer hover:text-secondary transition-colors ${f.status === "completed" ? "line-through opacity-60" : ""}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              client && onSelectClient && onSelectClient(client);
                            }}
                          >
                            {f.title}
                          </h4>

                        </td>

                        {/* Col 2: Lead Name */}
                        <td className="px-6 py-4 align-top">
                          <div className="flex flex-col gap-1">
                            <span className="text-[13px] font-bold text-secondary">
                              {client?.name || "No Client"}
                            </span>
                            {client?.status !== "Lead" && client?.status !== "Dismissed" && f.projectName && (
                              <span className="text-[12px] font-medium text-slate-400">
                                {f.projectName}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Col 3: Status & Mode */}
                        <td className="px-6 py-4 align-top">
                          <div className="flex flex-col items-start gap-2">
                            <span className={`text-[10px] font-black tracking-widest px-2 py-0.5 rounded-md border uppercase ${getPriorityBadge(f.priority)}`}>
                              {f.priority} Priority
                            </span>
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                              {f.followup_mode?.toLowerCase() === 'call' ? <Phone size={12} strokeWidth={2.5} /> : 
                               f.followup_mode?.toLowerCase() === 'meeting' ? <Calendar size={12} strokeWidth={2.5} /> : 
                               f.followup_mode?.toLowerCase() === 'whatsapp' ? <MessageSquare size={12} strokeWidth={2.5} /> :
                               <Mail size={12} strokeWidth={2.5} />}
                              <span>{f.followup_mode}</span>
                            </div>
                          </div>
                        </td>

                        {/* Col 4: Due Date */}
                        <td className="px-6 py-4 align-top">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-widest uppercase text-slate-400">
                              <Calendar size={12} className="opacity-70" />
                              <span>{parseLocalDate(f.dueDate).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-widest uppercase text-secondary">
                              <Clock size={12} className="opacity-70" />
                              <span>{parseLocalDate(f.dueDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })}</span>
                            </div>

                            {f.status === "completed" && f.completed_at && (
                              <span className="text-[10px] font-black tracking-widest uppercase text-success w-fit mt-1">
                                Completed
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Col 5: Actions */}
                        <td className="px-6 py-4 align-top">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                if (f.status === "completed") {
                                  onToggleStatus(f.id);
                                } else {
                                  const now = new Date();
                                  setCompletionDate(now.toLocaleDateString("en-CA"));
                                  setCompletionHour((now.getHours() % 12 || 12).toString());
                                  setCompletionMinute(now.getMinutes().toString().padStart(2, "0"));
                                  setCompletionPeriod(now.getHours() >= 12 ? "PM" : "AM");
                                  setCompletingFollowUpId(f.id);
                                  setCompletionBrief("");
                                  setShowCompletionModal(true);
                                }
                              }}
                              className={`w-[34px] h-[34px] rounded-[10px] border transition-all flex items-center justify-center shrink-0 active:scale-90 shadow-sm relative group/btn ${
                                f.status === "completed" 
                                  ? "bg-amber-50/50 border-amber-100 text-amber-500 hover:bg-amber-100" 
                                  : "bg-emerald-50/50 border-emerald-100 text-emerald-500 hover:bg-emerald-100"
                              }`}
                            >
                              {f.status === "completed" ? <Clock size={16} strokeWidth={2.5} /> : <CheckCircle2 size={16} strokeWidth={2.5} />}
                              <div className="absolute bottom-[calc(100%+8px)] right-0 opacity-0 group-hover/btn:opacity-100 transition-opacity bg-[#18254D] text-white text-[10px] font-bold px-2.5 py-1 rounded-[6px] whitespace-nowrap pointer-events-none z-[100] shadow-md">
                                {f.status === "completed" ? "Mark as Pending" : "Mark as Completed"}
                              </div>
                            </button>

                            {f.status !== "completed" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddToCalendar(f);
                                }}
                                className="w-[34px] h-[34px] flex items-center justify-center bg-indigo-50/50 border border-indigo-100 rounded-[10px] text-indigo-500 hover:bg-indigo-100 transition-all active:scale-90 shadow-sm relative group/btn"
                              >
                                <Calendar size={16} strokeWidth={2.5} />
                                <div className="absolute bottom-[calc(100%+8px)] right-0 opacity-0 group-hover/btn:opacity-100 transition-opacity bg-[#18254D] text-white text-[10px] font-bold px-2.5 py-1 rounded-[6px] whitespace-nowrap pointer-events-none z-[100] shadow-md">
                                  Add to Google Calendar
                                </div>
                              </button>
                            )}

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                let compDate = new Date().toISOString().split("T")[0];
                                let compHr = "12";
                                let compMin = "00";
                                let compPrd = "PM";

                                if (f.status === "completed" && f.completed_at) {
                                  const cd = parseLocalDate(f.completed_at);
                                  if (!isNaN(cd.getTime())) {
                                    compDate = `${cd.getFullYear()}-${(cd.getMonth() + 1).toString().padStart(2, "0")}-${cd.getDate().toString().padStart(2, "0")}`;
                                    compHr = (cd.getHours() % 12 || 12).toString();
                                    compMin = cd.getMinutes().toString().padStart(2, "0");
                                    compPrd = cd.getHours() >= 12 ? "PM" : "AM";
                                  }
                                }

                                const d = f.dueDate ? parseLocalDate(f.dueDate) : new Date();
                                setFormData({
                                  ...f,
                                  followup_status: f.status || f.followup_status || "pending",
                                  followup_date: `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`,
                                  timeHour: (d.getHours() % 12 || 12).toString(),
                                  timeMinute: d.getMinutes().toString().padStart(2, "0"),
                                  timePeriod: d.getHours() >= 12 ? "PM" : "AM",
                                  completed_by: f.completed_by || "",
                                  completionDate: compDate,
                                  completionHour: compHr,
                                  completionMinute: compMin,
                                  completionPeriod: compPrd,
                                });
                                setShowAddModal(true);
                              }}
                              className="w-[34px] h-[34px] flex items-center justify-center bg-blue-50/50 border border-blue-100 rounded-[10px] text-blue-500 hover:bg-blue-100 transition-all active:scale-90 shadow-sm relative group/btn"
                            >
                              <Edit2 size={16} />
                              <div className="absolute bottom-[calc(100%+8px)] right-0 opacity-0 group-hover/btn:opacity-100 transition-opacity bg-[#18254D] text-white text-[10px] font-bold px-2.5 py-1 rounded-[6px] whitespace-nowrap pointer-events-none z-[100] shadow-md">
                                Edit
                              </div>
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteFollowUp && onDeleteFollowUp(f.id);
                              }}
                              className="w-[34px] h-[34px] flex items-center justify-center bg-rose-50/50 border border-rose-100 rounded-[10px] text-rose-500 hover:bg-rose-100 transition-all active:scale-90 shadow-sm relative group/btn"
                            >
                              <Trash2 size={16} />
                              <div className="absolute bottom-[calc(100%+8px)] right-0 opacity-0 group-hover/btn:opacity-100 transition-opacity bg-[#18254D] text-white text-[10px] font-bold px-2.5 py-1 rounded-[6px] whitespace-nowrap pointer-events-none z-[100] shadow-md">
                                Delete
                              </div>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
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

        {/* Details Modal */}
        {showDetailsModal && selectedFollowUpForDetails && createPortal(
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl border border-slate-200 animate-fade-in relative z-[100000] overflow-hidden flex flex-col max-h-[90vh]">
              <div className="bg-primary p-5 text-white relative flex items-center justify-between shrink-0">
                <h3 className="text-base font-bold tracking-wide">
                  Follow-up Title
                </h3>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedFollowUpForDetails(null);
                  }}
                  className="p-1 hover:bg-white/10 rounded-md transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 overflow-y-auto space-y-6">
                {(() => {
                  const modalClient = getClientById(selectedFollowUpForDetails.clientId, selectedFollowUpForDetails.leadId, selectedFollowUpForDetails.projectId);
                  return (
                    <>
                      {/* Header Section */}
                      <div className="flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-4">
                          <h4 className="text-xl font-black text-primary leading-tight">
                            {selectedFollowUpForDetails.title}
                          </h4>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-[10px] font-black tracking-widest px-2.5 py-1 rounded-md border uppercase shadow-sm ${getPriorityBadge(selectedFollowUpForDetails.priority)}`}>
                            {selectedFollowUpForDetails.priority} Priority
                          </span>
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-black tracking-widest uppercase border shadow-sm ${getModeBadge(selectedFollowUpForDetails.followup_mode)}`}>
                            {selectedFollowUpForDetails.followup_mode}
                          </span>
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-black tracking-widest uppercase border shadow-sm ${selectedFollowUpForDetails.status === "completed" ? "bg-success/10 text-success border-success/20" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                            {selectedFollowUpForDetails.status}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Schedule Card */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
                          <div className="absolute -top-4 -right-4 p-3 opacity-5 text-slate-800">
                            <Calendar size={80} />
                          </div>
                          <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-3">Schedule Info</p>
                          <div className="space-y-3 relative z-10">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 shrink-0">
                                <Calendar size={14} />
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Date</p>
                                <p className="text-[13px] font-bold text-slate-700">
                                  {selectedFollowUpForDetails.dueDate ? parseLocalDate(selectedFollowUpForDetails.dueDate).toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" }) : "N/A"}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
                                <Clock size={14} />
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Time</p>
                                <p className="text-[13px] font-bold text-slate-700">
                                  {selectedFollowUpForDetails.dueDate ? parseLocalDate(selectedFollowUpForDetails.dueDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true }) : "N/A"}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Client Card */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
                          <div className="absolute -top-4 -right-4 p-3 opacity-5 text-slate-800">
                            <User size={80} />
                          </div>
                          <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-3">Client Details</p>
                          <div className="space-y-3 relative z-10">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 font-bold text-xs shrink-0 border border-blue-100">
                                {modalClient?.name?.charAt(0).toUpperCase() || "?"}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Name</p>
                                <p className="text-[13px] font-bold text-slate-700 truncate" title={modalClient?.name || "No Client"}>
                                  {modalClient?.name || "No Client"}
                                </p>
                              </div>
                            </div>
                            {(modalClient?.phone || modalClient?.email) && (
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 shrink-0 border border-slate-100">
                                  <Phone size={14} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase">Contact</p>
                                  <p className="text-[12px] font-bold text-slate-700 truncate" title={modalClient?.phone || modalClient?.email}>
                                    {modalClient?.phone || modalClient?.email}
                                  </p>
                                </div>
                              </div>
                            )}
                            {selectedFollowUpForDetails.projectName && (
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-500 shrink-0 border border-purple-100">
                                  <Folder size={14} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase">Project</p>
                                  <p className="text-[12px] font-bold text-slate-700 truncate" title={selectedFollowUpForDetails.projectName}>
                                    {selectedFollowUpForDetails.projectName}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Description block */}
                      {selectedFollowUpForDetails.description && (
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative">
                          <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-3 flex items-center gap-2">
                            <AlignLeft size={14} /> Description
                          </p>
                          <p className="text-[13px] text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">
                            {selectedFollowUpForDetails.description}
                          </p>
                        </div>
                      )}

                      {/* Completion Block */}
                      {selectedFollowUpForDetails.status === "completed" && (
                        <div className="bg-success/5 border border-success/20 rounded-xl p-5 shadow-sm">
                          <div className="flex items-center gap-2 mb-4">
                            <CheckCircle2 size={16} className="text-success" strokeWidth={3} />
                            <h5 className="text-[12px] font-black tracking-widest text-success uppercase">Completion Report</h5>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                            {selectedFollowUpForDetails.completed_at && (
                              <div>
                                <p className="text-[10px] font-bold text-success/70 uppercase mb-1">Completed On</p>
                                <p className="text-[12px] font-bold text-success">
                                  {parseLocalDate(selectedFollowUpForDetails.completed_at).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })} at {parseLocalDate(selectedFollowUpForDetails.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                                </p>
                              </div>
                            )}
                            {selectedFollowUpForDetails.completed_by && (
                              <div>
                                <p className="text-[10px] font-bold text-success/70 uppercase mb-1">Completed By</p>
                                <p className="text-[12px] font-bold text-success">
                                  {selectedFollowUpForDetails.completed_by}
                                </p>
                              </div>
                            )}
                          </div>

                          {selectedFollowUpForDetails.follow_brief && (
                            <div className="bg-white/60 p-4 rounded-lg border border-success/10 mt-2">
                              <p className="text-[10px] font-black tracking-widest text-success/70 uppercase mb-2">Conclusion Brief</p>
                              <p className="text-[13px] text-slate-800 font-medium leading-relaxed whitespace-pre-wrap">
                                {selectedFollowUpForDetails.follow_brief}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
              {/* <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedFollowUpForDetails(null);
                  }}
                  className="px-5 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div> */}
            </div>
          </div>
        , document.body)}

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
                      <DatePicker
                        value={completionDate}
                        onChange={setCompletionDate}
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
                              {Array.from({ length: 60 }, (_, i) => i).map(
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
                                    className={`w-full text-left px-3 py-1.5 text-[12px] hover:bg-slate-50 ${completionMinute === m.toString().padStart(2, "0") ? "bg-slate-100 text-secondary font-bold" : ""}`}
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
                    ? "Update Follow-up Title"
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
                                    
                                    // For Clients (typeFilter !== "Lead"), only show Active clients
                                    if (typeFilter !== "Lead" && c.status !== "Active" && c.status !== "Lead")
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
                          <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden z-[90] animate-fade-in-down origin-bottom">
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
                            {["pending", "completed"]
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
