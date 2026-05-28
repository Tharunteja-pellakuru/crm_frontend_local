import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import { createPortal } from "react-dom";
import { useSearchParams } from "react-router-dom";
import { useScrollLock } from "../../hooks/useScrollLock";
import { useSearch } from "../../hooks/useSearch";
import {
  Search,
  Filter,
  Mail,
  Phone,
  ChevronRight,
  ChevronLeft,
  Flame,
  Sun,
  Snowflake,
  Plus,
  X,
  UserPlus,
  Briefcase,
  Tag,
  Globe,
  MoreHorizontal,
  Trash2,
  ChevronDown,
  UserCheck,
  Users,
  LayoutGrid,
  BellRing,
  UserMinus,
  Upload,
  Paperclip,
  UserX,
  RotateCcw,
  MessageSquare,
  Clock,
  Calendar,
  Zap,
  AlertTriangle,
  Loader2,
  Pencil,
} from "lucide-react";
import DatePicker from "../../components/ui/DatePicker";
import {
  CATEGORY_MAP,
  REVERSE_CATEGORY_MAP,
} from "../../constants/categoryConstants";
import { countries } from "../../utils/countries";
import {
  indianStates,
  commonCurrencies,
  countryToCurrency,
  countryToStates,
} from "../../utils/locationData";
import SearchableDropdown from "../../components/common/SearchableDropdown";
import { validateForm } from "../../utils/validation";
import { formatBudget, parseBudget } from "../../utils/formatters";

const ClientList = ({
  clients,
  onSelectClient,
  onAddClient,
  onDeleteClient,
  onOnboardClient,
  onDismissLead,
  onRestoreLead,
  onAddActivity,
  allClients = [],
  title = "Clients",
  loading = false,
  onUpdateClient,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const RECORDS_PER_PAGE = 10;
  const { searchTerm, setSearchTerm } = useSearch(setCurrentPage);
  const [searchParams, setSearchParams] = useSearchParams();
  const filterStatus = searchParams.get("view") || "Active";
  const setFilterStatus = (value) => {
    const nextParams = new URLSearchParams(searchParams);
    if (!value || value === "Active") {
      nextParams.delete("view");
    } else {
      nextParams.set("view", value);
    }
    setSearchParams(nextParams, { replace: true });
    setCurrentPage(1);
  };
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus]);
  const [leadTypeFilter, setLeadTypeFilter] = useState("All");
  const [isFilterPopupOpen, setIsFilterPopupOpen] = useState(false);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [onboardingLeadId, setOnboardingLeadId] = useState(null);
  const [isNameDropdownOpen, setIsNameDropdownOpen] = useState(false);
  const [nameSearch, setNameSearch] = useState("");
  const [leadView, setLeadView] = useState("Pending");
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isPriorityDropdownOpen, setIsPriorityDropdownOpen] = useState(false);
  const [isOnboardStatusDropdownOpen, setIsOnboardStatusDropdownOpen] =
    useState(false);
  const [isOnboardPriorityDropdownOpen, setIsOnboardPriorityDropdownOpen] =
    useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [followUpLeadId, setFollowUpLeadId] = useState(null);
  const [followUpLeadName, setFollowUpLeadName] = useState("");
  const [followUpData, setFollowUpData] = useState({
    type: "Call",
    description: "",
    date: new Date().toISOString().split("T")[0],
    time: new Date().toTimeString().split(" ")[0].substring(0, 5),
  });

  const [onboardingData, setOnboardingData] = useState({
    name: "",
    email: "",
    phone: "",
    clientType: "New",
    status: "Active",
    projectName: "",
    projectStatus: "Planning",
    projectCategory: 1,
    projectPriority: "High",
    projectDescription: "",
    projectBudget: "",
    country: "India",
    currency: "INR",
  });

  const [formData, setFormData] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    status: "Active",
    leadType: undefined,
    industry: "",
    notes: "",
    projectName: "",
    projectStatus: "Planning",
    projectCategory: 1,
    projectPriority: "High",
    projectDescription: "",
    country: "India",
    state: "",
    currency: "INR",
    organisationName: "",
    clientStatus: "Active",
  });
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [isEditStatusDropdownOpen, setIsEditStatusDropdownOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    organisationName: "",
    email: "",
    phone: "",
    country: "",
    state: "",
    currency: "",
    clientStatus: "Active",
    projectCategory: 1,
    country_code: "",
  });

  // Lock scroll when any modal is open
  useScrollLock(showAddModal || showOnboardModal || showEditModal || showFollowUpModal);

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
    }
  }, [isFilterPopupOpen]);

  const handleEditClick = (client) => {
    setEditingClient(client);
    setEditFormData({
      name: (client.name || client.client_name || "").trim(),
      organisationName: (client.organisation_name || client.organisation || client.company || client.organisationName || "").trim(),
      email: (client.email || "").trim(),
      phone: (client.phone || "").trim(),
      country: (client.country || client.client_country || "India").trim(),
      state: (client.state || client.client_state || client.clientState || "").trim(),
      currency: (client.currency || client.client_currency || "INR").trim(),
      clientStatus: client.status || client.client_status || client.clientStatus || "Active",
      projectCategory: client.projectCategory || client.project_category || 1,
      country_code: client.country_code || "",
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onUpdateClient(editingClient.id, editFormData);
      setShowEditModal(false);
      setEditingClient(null);
    } catch (err) {
      console.error("Edit failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOnboardSubmit = async (e) => {
    e.preventDefault();
    if (
      !validateForm(onboardingData, {
        name: { required: true, minLength: 2, label: "Full Name" },
        email: { required: true, pattern: /^\S+@\S+\.\S+$/, label: "Email" },
        phone: { required: true, minLength: 10, label: "Phone Number" },
        organisationName: { required: true, label: "Organization Name" },
        projectName: { required: true, label: "Project Name" },
        projectBudget: {
          required: true,
          type: "number",
          label: "Project Budget",
        },
      })
    )
      return;

    setIsSubmitting(true);
    try {
      await onOnboardClient(onboardingLeadId, onboardingData);
      setShowOnboardModal(false);
      setOnboardingData({
        name: "",
        email: "",
        phone: "",
        clientType: "New",
        organisationName: "",
        country: "India",
        state: "",
        currency: "INR",
        clientStatus: "Active",
        projectName: "",
        projectStatus: "In Progress",
        projectCategory: 1,
        projectPriority: "High",
        projectDescription: "",
        projectBudget: "",
        onboardingDate: new Date().toISOString().split("T")[0],
        deadline: "",
        scopeDocument: "",
      });
    } catch (err) {
      console.error("Onboarding failed:", err);
      toast.error("Failed to onboard client.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredClients = clients.filter((client) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      (client.name || "").toLowerCase().includes(q) ||
      (client.company || client.organisation_name || "").toLowerCase().includes(q) ||
      (client.email || "").toLowerCase().includes(q) ||
      (client.phone || "").toLowerCase().includes(q);

    let matchesStatus =
      filterStatus === "All" || client.status === filterStatus;
    let matchesLeadType = true;
    if (title === "Leads") {
      // Sub-filter by Lead View (Pending, Converted, Dismissed)
      if (leadView === "Pending") {
        if (client.status !== "Lead" || client.isConverted) return false;
      } else if (leadView === "Converted") {
        if (!client.isConverted || client.status === "Dismissed") return false;
      } else if (leadView === "Dismissed") {
        if (client.status !== "Dismissed") return false;
      }

      matchesLeadType =
        leadTypeFilter === "All" || client.leadType === leadTypeFilter;
    }

    // Date Range Filter
    if (startDate || endDate) {
      const joinedDate = new Date(client.joinedDate);
      if (startDate && joinedDate < new Date(startDate)) return false;
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (joinedDate > end) return false;
      }
    }

    return matchesSearch && matchesStatus && matchesLeadType;
  });

  const sortedClients = [...filteredClients].sort((a, b) => {
    // Status priority: Active (0) > Inactive (1) > Dismissed (2)
    const statusPriority = {
      Active: 0,
      Inactive: 1,
      Dismissed: 2,
    };

    const priorityA = statusPriority[a.status] ?? 3;
    const priorityB = statusPriority[b.status] ?? 3;

    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    // Secondary sort by name
    const nameA = (a.name || "").toLowerCase();
    const nameB = (b.name || "").toLowerCase();
    return nameA.localeCompare(nameB);
  });

  const totalPages = Math.ceil(sortedClients.length / RECORDS_PER_PAGE);
  const currentClients = sortedClients.slice(
    (currentPage - 1) * RECORDS_PER_PAGE,
    currentPage * RECORDS_PER_PAGE,
  );

  const getStatusBadge = (client) => {
    if (client.status === "Lead" && client.leadType) {
      switch (client.leadType) {
        case "Hot":
          return {
            label: "Hot",
            className: "bg-error/10 text-error border-error/20",
            icon: <Flame size={12} strokeWidth={3} />,
          };
        case "Warm":
          return {
            label: "Warm",
            className: "bg-warning/10 text-warning border-warning/20",
            icon: <Sun size={12} strokeWidth={3} />,
          };
        case "Cold":
          return {
            label: "Cold",
            className: "bg-info/10 text-info border-info/20",
            icon: <Snowflake size={12} strokeWidth={3} />,
          };
        default:
          return {
            label: "Lead",
            className: "bg-primary/10 text-primary border-primary/20",
            icon: null,
          };
      }
    }

    switch (client.status) {
      case "Lead":
        return {
          label: "Lead",
          className: "bg-info/10 text-info border-info/20",
          icon: null,
        };
      case "Active":
        return {
          label: "Active",
          className: "bg-emerald-50 text-emerald-600 border-emerald-100",
          icon: null,
        };
      case "Pending":
        return {
          label: "Pending",
          className: "bg-slate-100 text-slate-500 border-slate-200",
          icon: null,
        };
      case "Churned":
        return {
          label: "Churned",
          className: "bg-slate-200 text-slate-400 border-slate-300",
          icon: null,
        };
      case "Inactive":
        return {
          label: "Inactive",
          className: "bg-slate-100 text-slate-400 border-slate-200",
          icon: null,
        };
      case "Dismissed":
        return {
          label: "Dismissed",
          className: "bg-slate-100 text-slate-400 border-slate-200",
          icon: <UserX size={12} />,
        };
      default:
        return {
          label: client.status,
          className: "bg-slate-100 text-slate-700 border-slate-200",
          icon: null,
        };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !validateForm(formData, {
        name: { required: true, minLength: 2, label: "Full Name" },
        email: { required: true, pattern: /^\S+@\S+\.\S+$/, label: "Email" },
        phone: { required: true, minLength: 10, label: "Phone Number" },
        organisationName: { required: true, label: "Organization Name" },
      })
    )
      return;
    setIsSubmitting(true);
    try {
      await onAddClient(formData);
      setShowAddModal(false);
      setFormData({
        name: "",
        email: "",
        phone: "",
        organisationName: "",
        status: "Active",
        projectCategory: 1,
      });
      toast.success("Client added successfully!");
    } catch (error) {
      console.error("Error adding client:", error);
      toast.error("Failed to add client.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="w-full flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <p className="text-sm text-slate-500">
            Loading {title.toLowerCase()}...
          </p>
        </div>
      </div>
    );
  }

  const renderContactDetails = (client) => {
    if (!client.phone && !client.email) return "N/A";

    const countryInput = (client.country || "").trim();
    let countryCode = "";

    if (client.country_code) {
      countryCode = client.country_code;
    } else if (countryInput) {
      const countryObj = countries.find(
        (c) =>
          c.name.toLowerCase() === countryInput.toLowerCase() ||
          c.code === countryInput ||
          c.code.replace("+", "") === countryInput.replace("+", ""),
      );
      countryCode = countryObj ? countryObj.code : countryInput;
    }

    // Ensure countryCode has + prefix if it's just numbers
    if (countryCode && /^\d+$/.test(countryCode)) {
      countryCode = `+${countryCode}`;
    }

    let phone = (client.phone || "").trim();
    if (countryCode) {
      const match = countryCode.match(/\(([^)]+)\)/);
      if (match && match[1]) {
        countryCode = match[1];
      }

      const plainCountryCode = countryCode.replace("+", "");
      const cleanPhone = phone.replace("+", "").replace(/\s/g, "");

      if (phone.startsWith(countryCode)) {
        phone = phone.slice(countryCode.length).trim();
      }
    }

    return (
      <div className="flex flex-col">
        <div className="flex items-center gap-2 text-primary">
          <Phone size={12} className="text-secondary" />
          <span className="text-xs font-bold whitespace-nowrap">
            {countryCode ? `${countryCode} ` : ""}
            {phone || "N/A"}
          </span>
        </div>
        {client.email && (
          <div className="flex items-center gap-2 text-slate-400 mt-1">
            <Mail size={12} />
            <span className="text-[12px] font-bold truncate max-w-[150px]">
              {client.email}
            </span>
          </div>
        )}
      </div>
    );
  };

  const handleOpenFollowUpModal = (client) => {
    if (!client) return;

    const clientId = client.lead_id || client.id;
    setFollowUpLeadId(clientId);
    setFollowUpLeadName(client.name || client.client_name || "Client");
    setFollowUpData({
      type: "Call",
      description: "",
      date: new Date().toISOString().split("T")[0],
      time: new Date().toTimeString().split(" ")[0].substring(0, 5),
    });
    setShowFollowUpModal(true);
  };

  const handleClientStatusUpdate = (client, clientStatus) => {
    if (!onUpdateClient || !client) return;

    onUpdateClient(client.id, {
      organisationName:
        client.company ||
        client.organisation_name ||
        client.organisationName ||
        "",
      name: client.name || client.client_name || "",
      country: client.country || client.client_country || "",
      state: client.state || client.client_state || "",
      currency: client.currency || client.client_currency || "",
      clientStatus,
      status: clientStatus,
    });
  };

  const allClientRecords = (clients || []).filter(Boolean);
  const totalClientsCount = allClientRecords.length;
  const activeClientsCount = allClientRecords.filter(
    (client) => client.status === "Active",
  ).length;
  const inactiveClientsCount = allClientRecords.filter(
    (client) => client.status === "Inactive",
  ).length;
  const dismissedClientsCount = allClientRecords.filter(
    (client) => client.status === "Dismissed",
  ).length;

  return (
    <div className="w-full relative">
      <div className="space-y-5 animate-fade-in w-full">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="max-w-2xl">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary tracking-tight mb-2">
              Clients
            </h2>
            <p className="text-xs md:text-sm text-textMuted font-medium leading-relaxed">
              Manage your network of clients and strategic partnerships.
            </p>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-3 sm:p-5 rounded-2xl shadow-sm border border-slate-200 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="p-2 sm:p-3 rounded-full bg-blue-50 text-blue-500 shrink-0">
                <Briefcase className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="text-slate-500 text-[10px] sm:text-xs font-semibold truncate">
                  Total Clients
                </h3>
                <p className="text-lg sm:text-2xl font-bold text-[#18254D] leading-none mt-1">
                  {totalClientsCount}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-3 sm:p-5 rounded-2xl shadow-sm border border-slate-200 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="p-2 sm:p-3 rounded-full bg-emerald-50 text-emerald-500 shrink-0">
                <UserCheck className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="text-slate-500 text-[10px] sm:text-xs font-semibold truncate">
                  Active Clients
                </h3>
                <p className="text-lg sm:text-2xl font-bold text-[#18254D] leading-none mt-1">
                  {activeClientsCount}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-3 sm:p-5 rounded-2xl shadow-sm border border-slate-200 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="p-2 sm:p-3 rounded-full bg-amber-50 text-amber-500 shrink-0">
                <Users className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="text-slate-500 text-[10px] sm:text-xs font-semibold truncate">
                  Inactive Clients
                </h3>
                <p className="text-lg sm:text-2xl font-bold text-[#18254D] leading-none mt-1">
                  {inactiveClientsCount}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-3 sm:p-5 rounded-2xl shadow-sm border border-slate-200 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="p-2 sm:p-3 rounded-full bg-slate-100 text-slate-500 shrink-0">
                <UserX className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="text-slate-500 text-[10px] sm:text-xs font-semibold truncate">
                  Dismissed Clients
                </h3>
                <p className="text-lg sm:text-2xl font-bold text-[#18254D] leading-none mt-1">
                  {dismissedClientsCount}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Control Bar: Filters */}
        <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm relative z-[60]">
          <div className="flex flex-col md:flex-row md:justify-between gap-2 w-full items-center">
            {/* 1. Search Bar */}
            <div className="relative w-full md:w-64 flex-none transition-all duration-300">
              <Search
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder={`Search ${title.toLowerCase()}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-[38px] pl-11 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-secondary/10 focus:border-secondary transition-all"
              />
            </div>

            {/* 2. Filters Button */}
            <div className="relative w-full md:w-auto flex-none" ref={filterButtonRef}>
              <button
                onClick={() => setIsFilterPopupOpen(!isFilterPopupOpen)}
                className={`w-full md:w-auto h-[38px] flex items-center justify-center gap-2.5 px-6 py-2 rounded-xl text-[12px] font-bold tracking-widest transition-all shadow-sm active:scale-95 group border ${
                  startDate || endDate
                    ? "bg-secondary/5 border-secondary text-secondary"
                    : "bg-slate-50 border-slate-100 text-[#18254D] hover:bg-white hover:border-slate-200 shadow-slate-200/50"
                }`}
              >
                <Filter
                  size={14}
                  className={
                    startDate || endDate
                      ? "text-secondary"
                      : "text-slate-400"
                  }
                />
                <span>FILTERS</span>
                {(startDate || endDate) && (
                  <span className="flex items-center justify-center w-5 h-5 bg-secondary text-white text-[10px] font-black rounded-full ml-1 shadow-sm">
                    {[!!startDate, !!endDate].filter(Boolean).length}
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
                        className="bg-white border border-slate-200 shadow-[0_20px_50px_rgba(24,37,77,0.15)] overflow-hidden animate-fade-in-up ring-1 ring-black/5 rounded-3xl pointer-events-auto flex flex-col animate-pop"
                        style={filterPopupStyle}
                      >
                      {/* Sticky Header */}
                      <div className="flex-none p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 relative z-10">
                        <div className="flex items-center gap-2">
                          <Filter size={14} className="text-[#18254D]" />
                          <h3 className="text-[11px] font-black text-[#18254D] tracking-wider uppercase">
                            Filter Clients
                          </h3>
                        </div>
                        {(startDate || endDate) && (
                          <button
                            onClick={() => {
                              setStartDate("");
                              setEndDate("");
                              setIsFilterPopupOpen(false);
                            }}
                            className="text-[10px] font-black text-[#F43F5E] hover:text-[#E11D48] tracking-wider uppercase transition-colors"
                          >
                            Clear All
                          </button>
                        )}
                      </div>

                      {/* Scrollable Body */}
                      <div className="flex-1 p-5 space-y-4 overflow-y-auto custom-scrollbar">
                        {/* Date Range Section */}
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-400 tracking-wider uppercase ml-1 flex items-center gap-1.5">
                            <Calendar size={12} /> Joined Date Range
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
                      <div className="flex-none p-4 bg-slate-50/50 border-t border-slate-100 relative z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
                        <button
                          onClick={() => setIsFilterPopupOpen(false)}
                          className="w-full py-2.5 bg-[#18254D] text-white rounded-xl text-[11px] font-black tracking-wider uppercase hover:bg-slate-800 transition-all shadow-md active:scale-95"
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

        {/* Client View Toggles (Pill Style) */}
        <div className="flex overflow-x-auto no-scrollbar [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] justify-start gap-2 sm:gap-3 w-full px-1 sm:px-0 pb-1">
          <button
            onClick={() => setFilterStatus("All")}
            className={`px-4 py-2 sm:px-5 sm:py-2 rounded-full text-[12px] sm:text-[13px] font-bold flex items-center gap-2 transition-all cursor-pointer border whitespace-nowrap flex-shrink-0 ${filterStatus === "All" ? "bg-[#0F172A] text-white border-[#0F172A] shadow-sm" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700"}`}
          >
            <LayoutGrid size={16} />
            All
          </button>
          <button
            onClick={() => setFilterStatus("Active")}
            className={`px-4 py-2 sm:px-5 sm:py-2 rounded-full text-[12px] sm:text-[13px] font-bold flex items-center gap-2 transition-all cursor-pointer border whitespace-nowrap flex-shrink-0 ${filterStatus === "Active" ? "bg-[#ECFDF5] text-[#059669] border-[#A7F3D0] shadow-sm" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700"}`}
          >
            <UserCheck size={16} />
            Active
          </button>
          <button
            onClick={() => setFilterStatus("Inactive")}
            className={`px-4 py-2 sm:px-5 sm:py-2 rounded-full text-[12px] sm:text-[13px] font-bold flex items-center gap-2 transition-all cursor-pointer border whitespace-nowrap flex-shrink-0 ${filterStatus === "Inactive" ? "bg-[#FFF7ED] text-[#C2410C] border-[#FDBA74] shadow-sm" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700"}`}
          >
            <Users size={16} />
            Inactive
          </button>
          <button
            onClick={() => setFilterStatus("Dismissed")}
            className={`px-4 py-2 sm:px-5 sm:py-2 rounded-full text-[12px] sm:text-[13px] font-bold flex items-center gap-2 transition-all cursor-pointer border whitespace-nowrap flex-shrink-0 ${filterStatus === "Dismissed" ? "bg-[#FEF2F2] text-[#E11D48] border-[#FECACA] shadow-sm" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700"}`}
          >
            <UserX size={16} />
            Dismissed
          </button>
        </div>

        {/* Main List */}
        <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden w-full">
          <div className="w-full">
            <table className="w-full border-collapse">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-y border-slate-100 first:border-l first:rounded-l-xl">
                    Client Name
                  </th>
                  <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-y border-slate-100">
                    Contact Details
                  </th>
                  <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-y border-slate-100">
                    Client Category
                  </th>
                  <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-y border-slate-100">
                    Created By
                  </th>
                  <th className="px-6 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest border-y border-slate-100 last:border-r last:rounded-r-xl">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentClients.map((client, index) => {
                  const status = getStatusBadge(client);
                  return (
                    <tr
                      key={`client-table-${client.id || 'no-id'}-${index}`}
                      onClick={() =>
                        client.status !== "Dismissed" && onSelectClient(client)
                      }
                      className={`group transition-all ${
                        client.status === "Dismissed"
                          ? "bg-slate-50/30 opacity-80 cursor-default"
                          : "bg-white hover:bg-slate-50/50 cursor-pointer shadow-sm border border-slate-100 rounded-xl hover:shadow-md"
                      }`}
                      style={{
                        cursor:
                          client.status !== "Dismissed" ? "pointer" : "default",
                      }}
                    >
                      <td className="px-6 py-4 border-y border-slate-100 first:border-l first:rounded-l-xl">
                        <div className="flex flex-col min-w-0">
                          <div className="font-bold text-[13px] text-[#18254D] tracking-tight leading-none mb-1 group-hover:text-secondary transition-colors">
                            {client.name}
                          </div>
                          <div className="text-[12px] text-slate-400 font-medium">
                            {client.email || "No email provided"}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 border-y border-slate-100">
                        {renderContactDetails(client)}
                      </td>

                      <td className="px-6 py-4 border-y border-slate-100">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${client.projectCategory === 1 ? "bg-secondary" : client.projectCategory === 2 ? "bg-blue-400" : client.projectCategory === 3 ? "bg-purple-400" : "bg-slate-300"}`}
                          />
                          <span className="text-[12px] font-bold text-slate-600">
                            {(() => {
                              const catName =
                                CATEGORY_MAP[client.projectCategory] ||
                                client.industry ||
                                "Other";
                              if (catName === "Other" || catName === "others") {
                                console.log(
                                  "Category mismatch for client:",
                                  client.name,
                                  {
                                    projectCategory: client.projectCategory,
                                    industry: client.industry,
                                    catName,
                                  },
                                );
                              }
                              return catName;
                            })()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 border-y border-slate-100">
                        <div className="flex items-center gap-1.5 text-[12px] font-bold text-slate-600 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 w-fit">
                          <Users size={12} className="text-slate-400" />
                          <span className="truncate max-w-[120px]">{client.created_by_name || client.createdByName || "System"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 border-y border-slate-100 last:border-r last:rounded-r-xl text-right">
                        <div
                          className="flex justify-end gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {onAddActivity && client.status !== "Dismissed" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenFollowUpModal(client);
                              }}
                              className="w-[34px] h-[34px] flex items-center justify-center bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-[10px] hover:bg-indigo-100 transition-all active:scale-90 shadow-sm relative group/btn"
                            >
                              <BellRing size={16} />
                              <div className="absolute bottom-[calc(100%+8px)] right-0 opacity-0 group-hover/btn:opacity-100 transition-opacity bg-[#18254D] text-white text-[10px] font-bold px-2.5 py-1 rounded-[6px] whitespace-nowrap pointer-events-none z-[100] shadow-md">Add Follow Up</div>
                            </button>
                          )}
                          {onOnboardClient && client.status === "Lead" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOnboardingLeadId(client.id);
                                setOnboardingData({
                                  name: client.name,
                                  email: client.email,
                                  phone: client.phone,
                                  clientType: "New",
                                  status: "Active",
                                  projectName: "",
                                  projectCategory: 1,
                                  projectPriority: "High",
                                  projectDescription: "",
                                  onboardingDate: new Date()
                                    .toISOString()
                                    .split("T")[0],
                                  deadline: "",
                                  scopeDocument: "",
                                  projectStatus: "In Progress",
                                });
                                setShowOnboardModal(true);
                              }}
                              className="w-[34px] h-[34px] flex items-center justify-center bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-[10px] hover:bg-emerald-100 transition-all active:scale-90 shadow-sm relative group/btn"
                            >
                              <UserCheck size={16} />
                              <div className="absolute bottom-[calc(100%+8px)] right-0 opacity-0 group-hover/btn:opacity-100 transition-opacity bg-[#18254D] text-white text-[10px] font-bold px-2.5 py-1 rounded-[6px] whitespace-nowrap pointer-events-none z-[100] shadow-md">Convert to Client</div>
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditClick(client);
                            }}
                            className="w-[34px] h-[34px] flex items-center justify-center bg-blue-50 text-blue-600 border border-blue-100 rounded-[10px] hover:bg-blue-100 transition-all active:scale-90 shadow-sm relative group/btn"
                            >
                              <Pencil size={16} />
                              <div className="absolute bottom-[calc(100%+8px)] right-0 opacity-0 group-hover/btn:opacity-100 transition-opacity bg-[#18254D] text-white text-[10px] font-bold px-2.5 py-1 rounded-[6px] whitespace-nowrap pointer-events-none z-[100] shadow-md">Edit Client</div>
                            </button>
                          {onUpdateClient && client.status === "Active" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleClientStatusUpdate(client, "Inactive");
                              }}
                              className="w-[34px] h-[34px] flex items-center justify-center bg-orange-50 text-orange-600 border border-orange-100 rounded-[10px] hover:bg-orange-100 transition-all active:scale-90 shadow-sm relative group/btn"
                            >
                              <UserMinus size={16} />
                              <div className="absolute bottom-[calc(100%+8px)] right-0 opacity-0 group-hover/btn:opacity-100 transition-opacity bg-[#18254D] text-white text-[10px] font-bold px-2.5 py-1 rounded-[6px] whitespace-nowrap pointer-events-none z-[100] shadow-md">Mark Inactive</div>
                            </button>
                          )}
                          {onUpdateClient && client.status === "Inactive" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleClientStatusUpdate(client, "Active");
                              }}
                              className="w-[34px] h-[34px] flex items-center justify-center bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-[10px] hover:bg-emerald-100 transition-all active:scale-90 shadow-sm relative group/btn"
                            >
                              <UserCheck size={16} />
                              <div className="absolute bottom-[calc(100%+8px)] right-0 opacity-0 group-hover/btn:opacity-100 transition-opacity bg-[#18254D] text-white text-[10px] font-bold px-2.5 py-1 rounded-[6px] whitespace-nowrap pointer-events-none z-[100] shadow-md">Mark Active</div>
                            </button>
                          )}
                          {onUpdateClient && client.status === "Dismissed" && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleClientStatusUpdate(client, "Active");
                                }}
                                className="w-[34px] h-[34px] flex items-center justify-center bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-[10px] hover:bg-emerald-100 transition-all active:scale-90 shadow-sm relative group/btn"
                            >
                              <UserCheck size={16} />
                              <div className="absolute bottom-[calc(100%+8px)] right-0 opacity-0 group-hover/btn:opacity-100 transition-opacity bg-[#18254D] text-white text-[10px] font-bold px-2.5 py-1 rounded-[6px] whitespace-nowrap pointer-events-none z-[100] shadow-md">Mark Active</div>
                            </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleClientStatusUpdate(client, "Inactive");
                                }}
                                className="w-[34px] h-[34px] flex items-center justify-center bg-orange-50 text-orange-600 border border-orange-100 rounded-[10px] hover:bg-orange-100 transition-all active:scale-90 shadow-sm relative group/btn"
                            >
                              <UserMinus size={16} />
                              <div className="absolute bottom-[calc(100%+8px)] right-0 opacity-0 group-hover/btn:opacity-100 transition-opacity bg-[#18254D] text-white text-[10px] font-bold px-2.5 py-1 rounded-[6px] whitespace-nowrap pointer-events-none z-[100] shadow-md">Mark Inactive</div>
                            </button>
                            </>
                          )}
                          {onUpdateClient && client.status !== "Dismissed" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleClientStatusUpdate(client, "Dismissed");
                              }}
                              className="w-[34px] h-[34px] flex items-center justify-center bg-rose-50 text-rose-600 border border-rose-100 rounded-[10px] hover:bg-rose-100 transition-all active:scale-90 shadow-sm relative group/btn"
                            >
                              <UserX size={16} />
                              <div className="absolute bottom-[calc(100%+8px)] right-0 opacity-0 group-hover/btn:opacity-100 transition-opacity bg-[#18254D] text-white text-[10px] font-bold px-2.5 py-1 rounded-[6px] whitespace-nowrap pointer-events-none z-[100] shadow-md">Dismiss Client</div>
                            </button>
                          )}
                          {client.status === "Dismissed" && onRestoreLead && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onRestoreLead(client.id);
                              }}
                              className="w-[34px] h-[34px] flex items-center justify-center bg-blue-50 text-blue-600 border border-blue-100 rounded-[10px] hover:bg-blue-100 transition-all active:scale-90 shadow-sm relative group/btn"
                            >
                              <RotateCcw size={16} />
                              <div className="absolute bottom-[calc(100%+8px)] right-0 opacity-0 group-hover/btn:opacity-100 transition-opacity bg-[#18254D] text-white text-[10px] font-bold px-2.5 py-1 rounded-[6px] whitespace-nowrap pointer-events-none z-[100] shadow-md">Restore Client</div>
                            </button>
                          )}
                          {client.status === "Dismissed" && onDeleteClient && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteClient(client.id);
                              }}
                              className="w-[34px] h-[34px] flex items-center justify-center bg-red-50 text-red-600 border border-red-200 rounded-[10px] hover:bg-red-100 transition-all active:scale-90 shadow-sm relative group/btn"
                            >
                              <Trash2 size={16} />
                              <div className="absolute bottom-[calc(100%+8px)] right-0 opacity-0 group-hover/btn:opacity-100 transition-opacity bg-[#18254D] text-white text-[10px] font-bold px-2.5 py-1 rounded-[6px] whitespace-nowrap pointer-events-none z-[100] shadow-md">Delete Client</div>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredClients.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-10 py-32 text-center">
                      <div className="text-slate-300 p-4 rounded-xl mb-4 flex items-center justify-center mx-auto">
                        <Users size={32} strokeWidth={1.5} />
                      </div>
                      <p className="text-[13px] font-bold text-[#18254D] tracking-wider">
                        No Clients Found
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Card List View */}
        <div className="lg:hidden grid grid-cols-1 gap-4">
          {currentClients.map((client, index) => {
            const status = getStatusBadge(client);
            return (
              <div
                key={`client-mobile-${client.id || 'no-id'}-${index}`}
                onClick={() => onSelectClient(client)}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 shrink-0 rounded-xl bg-[#EFF6FF] text-[#3B82F6] border-[#DBEAFE] flex items-center justify-center font-bold text-lg border shadow-md">
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-[#18254D] truncate">
                        {client.name}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${client.projectCategory === 1 ? "bg-secondary" : client.projectCategory === 2 ? "bg-blue-400" : client.projectCategory === 3 ? "bg-purple-400" : "bg-slate-300"}`}
                        />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {CATEGORY_MAP[client.projectCategory] ||
                            client.industry ||
                            "Other"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-md text-[10px] font-bold border flex items-center gap-1 shadow-sm uppercase ${status.className}`}
                  >
                    {status.icon}
                    {status.label}
                  </span>
                </div>

                <div className="space-y-3 mb-4">
                  {client.status === "Lead" ? (
                    <div className="space-y-3">
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <p className="text-xs text-[#18254D]/80 font-medium italic line-clamp-2">
                          "{client.notes || client.industry || "No notes available"}"
                        </p>
                      </div>
                      <div className="px-1">
                        {renderContactDetails(client)}
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2">
                      {renderContactDetails(client)}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectClient(client);
                      }}
                      className="flex items-center gap-1 text-[11px] font-bold text-secondary uppercase tracking-wider hover:text-secondary/80 transition-colors"
                    >
                      View Details
                      <ChevronRight size={14} />
                    </button>
                  </div>
                  <div
                    className="flex items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {onOnboardClient && client.status === "Lead" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOnboardingLeadId(client.id);
                          setOnboardingData({
                            name: client.name,
                            email: client.email,
                            phone: client.phone,
                            clientType: "New",
                            status: "Active",
                            projectName: "",
                            projectDescription: "",
                            onboardingDate: new Date()
                              .toISOString()
                              .split("T")[0],
                            deadline: "",
                            scopeDocument: "",
                            projectStatus: "Planning",
                            projectPriority: "High",
                          });
                          setShowOnboardModal(true);
                        }}
                        className="p-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg hover:bg-emerald-100 transition-all active:scale-90"
                      >
                        <UserCheck size={16} />
                      </button>
                    )}
                    {onDeleteClient &&
                      (title !== "Leads" || leadView === "Dismissed") && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteClient(client.id);
                          }}
                          className="w-[34px] h-[34px] flex items-center justify-center bg-red-50 text-red-600 border border-red-200 rounded-[10px] hover:bg-red-100 transition-all active:scale-90 shadow-sm relative group/btn"
                            >
                              <Trash2 size={16} />
                              <div className="absolute bottom-[calc(100%+8px)] right-0 opacity-0 group-hover/btn:opacity-100 transition-opacity bg-[#18254D] text-white text-[10px] font-bold px-2.5 py-1 rounded-[6px] whitespace-nowrap pointer-events-none z-[100] shadow-md">Delete</div>
                            </button>
                      )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditClick(client);
                      }}
                      className="w-[34px] h-[34px] flex items-center justify-center bg-slate-50 text-slate-600 border border-slate-200 rounded-[10px] hover:bg-slate-100 transition-all active:scale-90 shadow-sm relative group/btn"
                            >
                              <Pencil size={16} />
                              <div className="absolute bottom-[calc(100%+8px)] right-0 opacity-0 group-hover/btn:opacity-100 transition-opacity bg-[#18254D] text-white text-[10px] font-bold px-2.5 py-1 rounded-[6px] whitespace-nowrap pointer-events-none z-[100] shadow-md">Edit Client</div>
                            </button>
                    {onUpdateClient && client.status === "Active" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClientStatusUpdate(client, "Inactive");
                        }}
                        className="w-[34px] h-[34px] flex items-center justify-center bg-orange-50 text-orange-600 border border-orange-100 rounded-[10px] hover:bg-orange-100 transition-all active:scale-90 shadow-sm relative group/btn"
                            >
                              <UserMinus size={16} />
                              <div className="absolute bottom-[calc(100%+8px)] right-0 opacity-0 group-hover/btn:opacity-100 transition-opacity bg-[#18254D] text-white text-[10px] font-bold px-2.5 py-1 rounded-[6px] whitespace-nowrap pointer-events-none z-[100] shadow-md">Mark Inactive</div>
                            </button>
                    )}
                    {onUpdateClient && client.status === "Inactive" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClientStatusUpdate(client, "Active");
                        }}
                        className="w-[34px] h-[34px] flex items-center justify-center bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-[10px] hover:bg-emerald-100 transition-all active:scale-90 shadow-sm relative group/btn"
                            >
                              <UserCheck size={16} />
                              <div className="absolute bottom-[calc(100%+8px)] right-0 opacity-0 group-hover/btn:opacity-100 transition-opacity bg-[#18254D] text-white text-[10px] font-bold px-2.5 py-1 rounded-[6px] whitespace-nowrap pointer-events-none z-[100] shadow-md">Mark Active</div>
                            </button>
                    )}
                    {onUpdateClient && client.status === "Dismissed" && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClientStatusUpdate(client, "Active");
                          }}
                          className="w-[34px] h-[34px] flex items-center justify-center bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-[10px] hover:bg-emerald-100 transition-all active:scale-90 shadow-sm relative group/btn"
                            >
                              <UserCheck size={16} />
                              <div className="absolute bottom-[calc(100%+8px)] right-0 opacity-0 group-hover/btn:opacity-100 transition-opacity bg-[#18254D] text-white text-[10px] font-bold px-2.5 py-1 rounded-[6px] whitespace-nowrap pointer-events-none z-[100] shadow-md">Mark Active</div>
                            </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClientStatusUpdate(client, "Inactive");
                          }}
                          className="w-[34px] h-[34px] flex items-center justify-center bg-orange-50 text-orange-600 border border-orange-100 rounded-[10px] hover:bg-orange-100 transition-all active:scale-90 shadow-sm relative group/btn"
                            >
                              <UserMinus size={16} />
                              <div className="absolute bottom-[calc(100%+8px)] right-0 opacity-0 group-hover/btn:opacity-100 transition-opacity bg-[#18254D] text-white text-[10px] font-bold px-2.5 py-1 rounded-[6px] whitespace-nowrap pointer-events-none z-[100] shadow-md">Mark Inactive</div>
                            </button>
                      </>
                    )}
                    {onUpdateClient && client.status !== "Dismissed" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClientStatusUpdate(client, "Dismissed");
                        }}
                        className="w-[34px] h-[34px] flex items-center justify-center bg-rose-50 text-rose-600 border border-rose-100 rounded-[10px] hover:bg-rose-100 transition-all active:scale-90 shadow-sm relative group/btn"
                            >
                              <UserX size={16} />
                              <div className="absolute bottom-[calc(100%+8px)] right-0 opacity-0 group-hover/btn:opacity-100 transition-opacity bg-[#18254D] text-white text-[10px] font-bold px-2.5 py-1 rounded-[6px] whitespace-nowrap pointer-events-none z-[100] shadow-md">Dismiss Client</div>
                            </button>
                    )}
                    {onDismissLead && title === "Leads" &&
                      (client.status === "Lead" || client.isConverted) &&
                      client.status !== "Dismissed" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDismissLead(client.id);
                          }}
                          className="w-[34px] h-[34px] flex items-center justify-center bg-rose-50 text-rose-600 border border-rose-100 rounded-[10px] hover:bg-rose-100 transition-all active:scale-90 shadow-sm relative group/btn"
                            >
                              <UserX size={16} />
                              <div className="absolute bottom-[calc(100%+8px)] right-0 opacity-0 group-hover/btn:opacity-100 transition-opacity bg-[#18254D] text-white text-[10px] font-bold px-2.5 py-1 rounded-[6px] whitespace-nowrap pointer-events-none z-[100] shadow-md">Dismiss Lead</div>
                            </button>
                      )}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredClients.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-10 bg-white rounded-3xl border border-slate-200 shadow-sm w-full">
              <Users size={22} className="text-slate-350 mb-2" />
              <p className="text-xs font-bold text-slate-400 tracking-wider uppercase">No clients</p>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8 mb-4">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-10 w-10 flex items-center justify-center rounded-full border border-[#DBEAFE] bg-white text-[#3B82F6] shadow-sm transition-all duration-200 hover:bg-[#EFF6FF] hover:border-[#93C5FD] hover:text-[#2563EB] active:scale-95 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-300 disabled:hover:bg-slate-100 disabled:hover:border-slate-200 disabled:hover:text-slate-300"
            >
              <ChevronLeft size={17} strokeWidth={2.75} />
            </button>

            <div className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-full shadow-sm mx-2">
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
                        key={`ellipsis-${pageNum}-${i}`}
                        className="text-slate-350 px-1 font-bold"
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
                    className={`min-w-8 h-8 px-2 flex items-center justify-center rounded-full text-[12px] font-black transition-all duration-200 ${
                      currentPage === pageNum
                        ? "bg-[#18254D] text-white shadow-md shadow-slate-300 scale-110"
                        : "text-slate-500 hover:text-[#18254D] hover:bg-[#EFF6FF]"
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
              className="h-10 w-10 flex items-center justify-center rounded-full border border-[#DBEAFE] bg-white text-[#3B82F6] shadow-sm transition-all duration-200 hover:bg-[#EFF6FF] hover:border-[#93C5FD] hover:text-[#2563EB] active:scale-95 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-300 disabled:hover:bg-slate-100 disabled:hover:border-slate-200 disabled:hover:text-slate-300"
            >
              <ChevronRight size={17} strokeWidth={2.75} />
            </button>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[99999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="absolute inset-0" onClick={() => setShowAddModal(false)} />
          <div className="relative z-10 bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-pop flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#EFF6FF] text-[#3B82F6] rounded-xl flex items-center justify-center border border-[#DBEAFE] shadow-sm">
                  <UserPlus size={16} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#18254D] tracking-tight">
                    New {title === "Leads" ? "Lead" : "Client"}
                  </h3>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-0.5">
                    {title === "Leads" ? "Lead Details" : "Client Details"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 hover:bg-slate-200 rounded-xl text-slate-400 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-6 space-y-5 overflow-y-auto no-scrollbar"
            >
              {title === "Leads" ? (
                /* ADD LEAD FIELDS */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                      CLIENT NAME <span className="text-rose-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. John Doe"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                      EMAIL ID <span className="text-rose-500">*</span>
                    </label>
                    <input
                      required
                      type="email"
                      placeholder="e.g. john@gmail.com"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                      PHONE NUMBER <span className="text-rose-500">*</span>
                    </label>
                    <input
                      required
                      type="tel"
                      placeholder="e.g. 9876543210"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          phone: e.target.value.replace(/\D/g, ""),
                        })
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                      WEBSITE URL
                    </label>
                    <input
                      type="url"
                      placeholder="e.g. https://www.company.com"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200"
                      value={formData.website}
                      onChange={(e) =>
                        setFormData({ ...formData, website: e.target.value })
                      }
                    />
                  </div>

                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                      LEAD CATEGORY
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3].map((catId) => (
                        <button
                          key={`cat-${catId}`}
                          type="button"
                          onClick={() =>
                            setFormData({ ...formData, projectCategory: catId })
                          }
                          className={`flex-1 py-2.5 px-3 rounded-xl border text-[12px] font-bold tracking-wider transition-all ${
                            formData.projectCategory === catId
                              ? "bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm"
                              : "bg-white border-slate-200 text-slate-400 hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          {CATEGORY_MAP[catId]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                      LEAD STATUS
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {["Hot", "Warm", "Cold"].map((type) => (
                        <button
                          key={`status-type-${type}`}
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              leadType: type,
                            })
                          }
                          className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border transition-all ${
                            formData.leadType === type
                              ? type === "Hot"
                                ? "bg-rose-50 border-rose-200 text-rose-600 shadow-sm scale-[1.02]"
                                : type === "Warm"
                                  ? "bg-orange-50 border-orange-200 text-orange-600 shadow-sm scale-[1.02]"
                                  : "bg-blue-50 border-blue-200 text-blue-600 shadow-sm scale-[1.02]"
                              : "bg-slate-50 border-slate-200 text-slate-400 grayscale opacity-70 hover:opacity-100 hover:grayscale-0 hover:bg-white"
                          }`}
                        >
                          {type === "Hot" ? (
                            <Flame size={14} strokeWidth={2.5} />
                          ) : type === "Warm" ? (
                            <Sun size={14} strokeWidth={2.5} />
                          ) : (
                            <Snowflake size={14} strokeWidth={2.5} />
                          )}
                          <span className="text-[12px] font-bold tracking-wider">
                            {type}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                      NOTE
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Add any additional context..."
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200 resize-none"
                      value={formData.notes || formData.industry}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          notes: e.target.value,
                          industry: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              ) : (
                /* ADD CLIENT FIELDS */
                <div className="space-y-5">
                  {/* CLIENT DETAILS HEADING */}
                  <div className="flex items-center gap-2 pt-1">
                    <div className="h-[2px] w-6 bg-indigo-500 rounded-full" />
                    <h4 className="text-[11px] font-black text-[#18254D] tracking-widest uppercase">
                      Client Details
                    </h4>
                    <div className="h-[2px] flex-1 bg-slate-100 rounded-full" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* NAME & EMAIL */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                        CLIENT NAME <span className="text-rose-500">*</span>
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. John Doe"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                        EMAIL ID <span className="text-rose-500">*</span>
                      </label>
                      <input
                        required
                        type="email"
                        placeholder="e.g. john@gmail.com"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                      />
                    </div>

                    {/* PHONE & STATUS */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                        PHONE NUMBER <span className="text-rose-500">*</span>
                      </label>
                      <input
                        required
                        type="tel"
                        placeholder="e.g. 9876543210"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            phone: e.target.value.replace(/\D/g, ""),
                          })
                        }
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                        ORGANISATION NAME <span className="text-rose-500">*</span>
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. Acme Corp"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200"
                        value={formData.organisationName || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            organisationName: e.target.value,
                          })
                        }
                      />
                    </div>

                    <SearchableDropdown
                      label="CLIENT COUNTRY"
                      options={countries.map((c) => ({
                        name: c.name,
                        value: c.name,
                        code: c.code,
                      }))}
                      value={formData.country}
                      onChange={(val) => {
                        const countryObj = countries.find(c => c.name === val || c.code === val);
                        const countryCurrency = countryToCurrency[val] || (countryObj ? countryToCurrency[countryObj.name] : null);
                        setFormData({
                          ...formData,
                          country: countryObj ? countryObj.name : val,
                          currency: countryCurrency
                            ? countryCurrency.code
                            : formData.currency,
                          state: "", // Reset state when country changes
                        });
                      }}
                      placeholder="Select Country"
                    />

                    {countryToStates[formData.country] ? (
                      <SearchableDropdown
                        label="CLIENT STATE"
                        options={countryToStates[formData.country]}
                        value={formData.state}
                        onChange={(val) =>
                          setFormData({ ...formData, state: val })
                        }
                        placeholder="Select State"
                      />
                    ) : (
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                          CLIENT STATE
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. State/Province"
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200"
                          value={formData.state || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              state: e.target.value,
                            })
                          }
                        />
                      </div>
                    )}

                    <SearchableDropdown
                      label="CLIENT CURRENCY"
                      options={commonCurrencies.map((c) => ({
                        name: `${c.code} (${c.symbol})`,
                        code: c.code,
                      }))}
                      value={formData.currency}
                      onChange={(val) =>
                        setFormData({ ...formData, currency: val })
                      }
                      placeholder="Select Currency"
                    />

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                        CLIENT STATUS
                      </label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                          className="w-full h-10 flex items-center justify-between px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold shadow-sm hover:border-[#18254D]/30 transition-all text-[#18254D]"
                        >
                          <span>{formData.clientStatus || "Active"}</span>
                          <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isStatusDropdownOpen ? "rotate-180" : ""}`} />
                        </button>
                        {isStatusDropdownOpen && (
                          <>
                            <div className="fixed inset-0 z-[80]" onClick={() => setIsStatusDropdownOpen(false)} />
                            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden z-[90] animate-pop origin-bottom">
                              <div className="bg-[#18254D] px-4 py-2.5 border-b border-white/10">
                                <p className="text-[10px] font-bold text-white/50 tracking-wider uppercase">Select Status</p>
                              </div>
                              {["Active", "Inactive", "Dismissed"].map((status) => (
                                <button
                                  key={status}
                                  type="button"
                                  onClick={() => {
                                    setFormData({ ...formData, clientStatus: status });
                                    setIsStatusDropdownOpen(false);
                                  }}
                                  className={`w-full text-left px-4 py-2.5 text-xs font-semibold tracking-wider transition-colors ${formData.clientStatus === status ? "bg-slate-100 text-[#18254D]" : "text-[#18254D] hover:bg-slate-50"}`}
                                >
                                  {status}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* PROJECT DETAILS HEADING */}
                  <div className="flex items-center gap-2 pt-3">
                    <div className="h-[2px] w-6 bg-indigo-500 rounded-full" />
                    <h4 className="text-[11px] font-black text-[#18254D] tracking-widest uppercase">
                      Project Details
                    </h4>
                    <div className="h-[2px] flex-1 bg-slate-100 rounded-full" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* PROJECT NAME & STATUS */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                        PROJECT NAME
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Website Redesign"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200"
                        value={formData.projectName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            projectName: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                        PROJECT STATUS
                      </label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsPriorityDropdownOpen(!isPriorityDropdownOpen)}
                          className="w-full h-[42px] flex items-center justify-between px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold shadow-sm hover:border-[#18254D]/30 transition-all text-[#18254D]"
                        >
                          <span>{formData.projectStatus}</span>
                          <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isPriorityDropdownOpen ? "rotate-180" : ""}`} />
                        </button>
                        {isPriorityDropdownOpen && (
                          <>
                            <div className="fixed inset-0 z-[80]" onClick={() => setIsPriorityDropdownOpen(false)} />
                            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden z-[90] animate-pop origin-bottom">
                              <div className="bg-[#18254D] px-4 py-2.5 border-b border-white/10">
                                <p className="text-[10px] font-bold text-white/50 tracking-wider uppercase">Select Status</p>
                              </div>
                              {(formData.projectCategory === 1 ? ["Planning", "In Progress", "Testing", "Live"] : ["Planning", "In Progress", "Completed"]).map((status) => (
                                <button
                                  key={status}
                                  type="button"
                                  onClick={() => {
                                    setFormData({ ...formData, projectStatus: status });
                                    setIsPriorityDropdownOpen(false);
                                  }}
                                  className={`w-full text-left px-4 py-2.5 text-xs font-semibold tracking-wider transition-colors ${formData.projectStatus === status ? "bg-slate-100 text-[#18254D]" : "text-[#18254D] hover:bg-slate-50"}`}
                                >
                                  {status}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="md:col-span-2 space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                        PROJECT CATEGORY
                      </label>
                      <div className="flex gap-2">
                        {[1, 2, 3].map((catId) => (
                          <button
                            key={`cat-${catId}`}
                            type="button"
                            onClick={() =>
                              setFormData({ ...formData, projectCategory: catId })
                            }
                            className={`flex-1 py-2.5 px-3 rounded-xl border text-[12px] font-bold tracking-wider transition-all ${
                              formData.projectCategory === catId
                                ? "bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm"
                                : "bg-white border-slate-200 text-slate-400 hover:border-slate-300 hover:bg-slate-50"
                            }`}
                          >
                            {CATEGORY_MAP[catId]}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="md:col-span-2 space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                        PROJECT DESCRIPTION
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Brief overview of the project scope..."
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200 resize-none"
                        value={formData.projectDescription}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            projectDescription: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 bg-[#18254D] text-white rounded-xl text-xs font-bold tracking-wider shadow-lg active:scale-[0.97] transition-all hover:bg-[#1e2e5e] hover:shadow-xl flex items-center justify-center gap-2 group/btn disabled:opacity-70 disabled:cursor-not-allowed btn-animated"
                >
                  {isSubmitting ? (
                    <>
                      <span>ADDING...</span>
                      <Loader2 size={16} className="animate-spin" />
                    </>
                  ) : (
                    <>
                      <span>ADD {title === "Leads" ? "LEAD" : "CLIENT"}</span>
                      <UserPlus
                        size={14}
                        strokeWidth={2.5}
                        className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform"
                      />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Onboard Modal */}
      {showOnboardModal && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[99999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="absolute inset-0" onClick={() => setShowOnboardModal(false)} />
          <div className="relative z-10 bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-pop flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100 shadow-sm">
                  <UserCheck size={16} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#18254D] tracking-tight">
                    Convert to Client
                  </h3>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-0.5">
                    Onboard Lead to Active Status
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowOnboardModal(false)}
                className="p-1.5 hover:bg-slate-200 rounded-xl text-slate-400 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleOnboardSubmit} className="p-6 space-y-5 overflow-y-auto no-scrollbar">
              {/* CLIENT DETAILS HEADING */}
              <div className="flex items-center gap-2 pt-1">
                <div className="h-[2px] w-6 bg-emerald-500 rounded-full" />
                <h4 className="text-[11px] font-black text-[#18254D] tracking-widest uppercase">
                  Client Details
                </h4>
                <div className="h-[2px] flex-1 bg-slate-100 rounded-full" />
              </div>

              {/* CLIENT TYPE */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                  CLIENT TYPE
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label
                    className={`flex-1 flex items-center gap-3 p-4 bg-white border-2 rounded-xl cursor-pointer transition-all group shadow-sm ${
                      onboardingData.clientType === "New"
                        ? "border-[#18254D] bg-slate-50/50"
                        : "border-slate-100"
                    }`}
                  >
                    <div className="relative flex items-center justify-center">
                      <input
                        type="radio"
                        name="onboardClientType"
                        value="New"
                        checked={onboardingData.clientType === "New"}
                        onChange={() =>
                          setOnboardingData({
                            ...onboardingData,
                            clientType: "New",
                          })
                        }
                        className="peer appearance-none w-5 h-5 border-2 border-slate-300 rounded-full checked:border-[#18254D] transition-all"
                      />
                      <div
                        className={`absolute w-2.5 h-2.5 bg-[#18254D] rounded-full transition-transform ${
                          onboardingData.clientType === "New" ? "scale-100" : "scale-0"
                        }`}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#18254D] leading-none">
                        New Client
                      </p>
                      <p className="text-[11px] text-slate-400 font-semibold mt-1">
                        First-time engagement
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex-1 flex items-center gap-3 p-4 bg-white border-2 rounded-xl cursor-pointer transition-all group shadow-sm ${
                      onboardingData.clientType === "Existing Client"
                        ? "border-[#18254D] bg-slate-50/50"
                        : "border-slate-100"
                    }`}
                  >
                    <div className="relative flex items-center justify-center">
                      <input
                        type="radio"
                        name="onboardClientType"
                        value="Existing Client"
                        checked={onboardingData.clientType === "Existing Client"}
                        onChange={() =>
                          setOnboardingData({
                            ...onboardingData,
                            clientType: "Existing Client",
                          })
                        }
                        className="peer appearance-none w-5 h-5 border-2 border-slate-300 rounded-full checked:border-[#18254D] transition-all"
                      />
                      <div
                        className={`absolute w-2.5 h-2.5 bg-[#18254D] rounded-full transition-transform ${
                          onboardingData.clientType === "Existing Client" ? "scale-100" : "scale-0"
                        }`}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#18254D] leading-none">
                        Existing Client
                      </p>
                      <p className="text-[11px] text-slate-400 font-semibold mt-1">
                        Returning or Converted
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 relative">
                  <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                    CLIENT NAME <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    {onboardingData.clientType === "Existing Client" ? (
                      <div className="relative">
                        <button
                          type="button"
                          className="w-full h-10 flex items-center justify-between px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold shadow-sm hover:border-[#18254D]/30 transition-all text-[#18254D]"
                          onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
                        >
                          <span className={`truncate ${onboardingData.name ? "text-[#18254D]" : "text-slate-400"}`}>
                            {onboardingData.name || "Select an existing client"}
                          </span>
                          <ChevronDown
                            size={16}
                            className={`text-slate-400 transition-transform duration-200 ${isClientDropdownOpen ? "rotate-180" : ""}`}
                          />
                        </button>

                        {isClientDropdownOpen && (
                          <>
                            <div className="fixed inset-0 z-[80]" onClick={() => setIsClientDropdownOpen(false)} />
                            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden z-[90] animate-pop origin-bottom">
                              <div className="p-3 border-b border-slate-100 bg-slate-50/50">
                                <div className="relative">
                                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                  <input
                                    type="text"
                                    placeholder="Search by name..."
                                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#18254D]/20 focus:border-[#18254D]/30"
                                    value={clientSearchQuery}
                                    onChange={(e) => setClientSearchQuery(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    autoFocus
                                  />
                                </div>
                              </div>
                              <div className="max-h-[200px] overflow-y-auto p-1.5 custom-scrollbar">
                                {allClients
                                  .filter((c) => c.status === "Active" && c.name.toLowerCase().includes(clientSearchQuery.toLowerCase()))
                                  .map((client) => (
                                    <button
                                      key={client.id}
                                      type="button"
                                      className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-xl cursor-pointer group transition-colors flex flex-col gap-0.5"
                                      onClick={() => {
                                        setOnboardingData({
                                          ...onboardingData,
                                          name: client.name,
                                          email: client.email,
                                          phone: client.phone,
                                          existingClientId: client.id,
                                        });
                                        setIsClientDropdownOpen(false);
                                        setClientSearchQuery("");
                                      }}
                                    >
                                      <span className="text-sm font-bold text-[#18254D]">{client.name}</span>
                                      <span className="text-[11px] text-slate-400 font-semibold">{client.company || client.email}</span>
                                    </button>
                                  ))}
                                {allClients.filter((c) => c.status !== "Lead" && c.name.toLowerCase().includes(clientSearchQuery.toLowerCase())).length === 0 && (
                                  <div className="p-4 text-center">
                                    <p className="text-[11px] font-bold text-slate-400">No clients found</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <input
                        required
                        type="text"
                        placeholder="e.g. John Doe"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200"
                        value={onboardingData.name}
                        onChange={(e) =>
                          setOnboardingData({
                            ...onboardingData,
                            name: e.target.value,
                          })
                        }
                      />
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                    EMAIL ID <span className="text-rose-500">*</span>
                  </label>
                  <input
                    required
                    type="email"
                    placeholder="e.g. john@gmail.com"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200"
                    value={onboardingData.email}
                    onChange={(e) =>
                      setOnboardingData({
                        ...onboardingData,
                        email: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                    PHONE NUMBER <span className="text-rose-500">*</span>
                  </label>
                  <input
                    required
                    type="tel"
                    placeholder="e.g. 9876543210"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200"
                    value={onboardingData.phone}
                    onChange={(e) =>
                      setOnboardingData({
                        ...onboardingData,
                        phone: e.target.value.replace(/\D/g, ""),
                      })
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                    ORGANISATION NAME <span className="text-rose-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Acme Corp"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200"
                    value={onboardingData.organisationName}
                    onChange={(e) =>
                      setOnboardingData({
                        ...onboardingData,
                        organisationName: e.target.value,
                      })
                    }
                  />
                </div>

                <SearchableDropdown
                  label="CLIENT COUNTRY"
                  options={countries.map((c) => ({
                    name: c.name,
                    value: c.name,
                    code: c.code,
                  }))}
                  value={onboardingData.country}
                  onChange={(val) => {
                    const countryObj = countries.find(c => c.name === val || c.code === val);
                    const countryCurrency = countryToCurrency[val] || (countryObj ? countryToCurrency[countryObj.name] : null);
                    setOnboardingData({
                      ...onboardingData,
                      country: countryObj ? countryObj.name : val,
                      currency: countryCurrency
                        ? countryCurrency.code
                        : onboardingData.currency,
                      state: "", // Reset state when country changes
                    });
                  }}
                  placeholder="Select Country"
                />

                {countryToStates[onboardingData.country] ? (
                  <SearchableDropdown
                    label="CLIENT STATE"
                    options={countryToStates[onboardingData.country]}
                    value={onboardingData.state}
                    onChange={(val) =>
                      setOnboardingData({ ...onboardingData, state: val })
                    }
                    placeholder="Select State"
                  />
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                      CLIENT STATE
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. State/Province"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200"
                      value={onboardingData.state}
                      onChange={(e) =>
                        setOnboardingData({
                          ...onboardingData,
                          state: e.target.value,
                        })
                      }
                    />
                  </div>
                )}

                <SearchableDropdown
                  label="CLIENT CURRENCY"
                  options={commonCurrencies.map((c) => ({
                    name: `${c.code} (${c.symbol})`,
                    code: c.code,
                  }))}
                  value={onboardingData.currency}
                  onChange={(val) =>
                    setOnboardingData({ ...onboardingData, currency: val })
                  }
                  placeholder="Select Currency"
                />

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                    CLIENT STATUS
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                      className="w-full h-10 flex items-center justify-between px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold shadow-sm hover:border-[#18254D]/30 transition-all text-[#18254D]"
                    >
                      <span>{onboardingData.clientStatus || "Active"}</span>
                      <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isStatusDropdownOpen ? "rotate-180" : ""}`} />
                    </button>
                    {isStatusDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-[80]" onClick={() => setIsStatusDropdownOpen(false)} />
                        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden z-[90] animate-pop origin-bottom">
                          <div className="bg-[#18254D] px-4 py-2.5 border-b border-white/10">
                            <p className="text-[10px] font-bold text-white/50 tracking-wider uppercase">Select Status</p>
                          </div>
                          {["Active", "Inactive", "Dismissed"].map((status) => (
                            <button
                              key={status}
                              type="button"
                              onClick={() => {
                                setOnboardingData({ ...onboardingData, clientStatus: status });
                                setIsStatusDropdownOpen(false);
                              }}
                              className={`w-full text-left px-4 py-2.5 text-xs font-semibold tracking-wider transition-colors ${onboardingData.clientStatus === status ? "bg-slate-100 text-[#18254D]" : "text-[#18254D] hover:bg-slate-50"}`}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* PROJECT DETAILS HEADING */}
              <div className="flex items-center gap-2 pt-2">
                <div className="h-[2px] w-6 bg-emerald-500 rounded-full" />
                <h4 className="text-[11px] font-black text-[#18254D] tracking-widest uppercase">
                  Project Details
                </h4>
                <div className="h-[2px] flex-1 bg-slate-100 rounded-full" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                    PROJECT NAME <span className="text-rose-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Website Redesign"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200"
                    value={onboardingData.projectName}
                    onChange={(e) =>
                      setOnboardingData({
                        ...onboardingData,
                        projectName: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                    PROJECT STATUS
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsOnboardStatusDropdownOpen(!isOnboardStatusDropdownOpen)}
                      className="w-full h-10 flex items-center justify-between px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold shadow-sm hover:border-[#18254D]/30 transition-all text-[#18254D]"
                    >
                      <span>{onboardingData.projectStatus}</span>
                      <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isOnboardStatusDropdownOpen ? "rotate-180" : ""}`} />
                    </button>
                    {isOnboardStatusDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-[80]" onClick={() => setIsOnboardStatusDropdownOpen(false)} />
                        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden z-[90] animate-pop origin-bottom">
                          <div className="bg-[#18254D] px-4 py-2.5 border-b border-white/10">
                            <p className="text-[10px] font-bold text-white/50 tracking-wider uppercase">Select Status</p>
                          </div>
                          {(onboardingData.projectCategory === 1 ? ["Planning", "In Progress", "Testing", "Live"] : ["Planning", "In Progress", "Completed"]).map((status) => (
                            <button
                              key={status}
                              type="button"
                              onClick={() => {
                                setOnboardingData({ ...onboardingData, projectStatus: status });
                                setIsOnboardStatusDropdownOpen(false);
                              }}
                              className={`w-full text-left px-4 py-2.5 text-xs font-semibold tracking-wider transition-colors ${onboardingData.projectStatus === status ? "bg-slate-100 text-[#18254D]" : "text-[#18254D] hover:bg-slate-50"}`}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                    PROJECT CATEGORY
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3].map((catId) => (
                      <button
                        key={`cat-${catId}`}
                        type="button"
                        onClick={() =>
                          setOnboardingData({ ...onboardingData, projectCategory: catId })
                        }
                        className={`flex-1 py-2.5 px-3 rounded-xl border text-[12px] font-bold tracking-wider transition-all ${
                          onboardingData.projectCategory === catId
                            ? "bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm"
                            : "bg-white border-slate-200 text-slate-400 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        {CATEGORY_MAP[catId]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                    PROJECT PRIORITY
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsOnboardPriorityDropdownOpen(!isOnboardPriorityDropdownOpen)}
                      className="w-full h-10 flex items-center justify-between px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold shadow-sm hover:border-[#18254D]/30 transition-all text-[#18254D]"
                    >
                      <span>{onboardingData.projectPriority}</span>
                      <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isOnboardPriorityDropdownOpen ? "rotate-180" : ""}`} />
                    </button>
                    {isOnboardPriorityDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-[80]" onClick={() => setIsOnboardPriorityDropdownOpen(false)} />
                        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden z-[90] animate-pop origin-bottom">
                          <div className="bg-[#18254D] px-4 py-2.5 border-b border-white/10">
                            <p className="text-[10px] font-bold text-white/50 tracking-wider uppercase">Select Priority</p>
                          </div>
                          {["High", "Medium", "Low"].map((level) => (
                            <button
                              key={level}
                              type="button"
                              onClick={() => {
                                setOnboardingData({ ...onboardingData, projectPriority: level });
                                setIsOnboardPriorityDropdownOpen(false);
                              }}
                              className={`w-full text-left px-4 py-2.5 text-xs font-semibold tracking-wider transition-colors ${onboardingData.projectPriority === level ? "bg-slate-100 text-[#18254D]" : "text-[#18254D] hover:bg-slate-50"}`}
                            >
                              {level}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                    PROJECT BUDGET <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                      {commonCurrencies.find((c) => c.code === onboardingData.currency)?.symbol || "₹"}
                    </span>
                    <input
                      required
                      type="text"
                      placeholder="e.g. 50000"
                      className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-[#18254D]/5 focus:border-[#18254D]/30 focus:outline-none text-sm font-semibold text-[#18254D]"
                      value={formatBudget(onboardingData.projectBudget, onboardingData.currency)}
                      onChange={(e) =>
                        setOnboardingData({
                          ...onboardingData,
                          projectBudget: parseBudget(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                    PROJECT DESCRIPTION
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Brief overview of the project scope..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200 resize-none"
                    value={onboardingData.projectDescription}
                    onChange={(e) =>
                      setOnboardingData({
                        ...onboardingData,
                        projectDescription: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                    ONBOARDING DATE
                  </label>
                  <DatePicker
                    value={onboardingData.onboardingDate}
                    onChange={(val) =>
                      setOnboardingData({
                        ...onboardingData,
                        onboardingDate: val,
                      })
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                    DEADLINE (TENTATIVE)
                  </label>
                  <DatePicker
                    value={onboardingData.deadline}
                    onChange={(val) =>
                      setOnboardingData({
                        ...onboardingData,
                        deadline: val,
                      })
                    }
                  />
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                    SCOPE DOCUMENT
                  </label>
                  <div className="relative group">
                    <input
                      type="file"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setOnboardingData({
                            ...onboardingData,
                            scopeDocument: file.name,
                          });
                        }
                      }}
                    />
                    <div className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl group-hover:border-emerald-300 transition-all flex items-center gap-3 shadow-sm">
                      <div className="p-1.5 bg-white border border-slate-200 rounded-lg shadow-sm">
                        <Upload size={16} className="text-emerald-500" />
                      </div>
                      <span className={`text-sm font-semibold truncate ${onboardingData.scopeDocument ? "text-[#18254D]" : "text-slate-400"}`}>
                        {onboardingData.scopeDocument || "Click to upload scope document (PDF, DOCX)"}
                      </span>
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
                  {isSubmitting ? (
                    <>
                      <span>CONVERTING...</span>
                      <Loader2 size={16} className="animate-spin" />
                    </>
                  ) : (
                    <>
                      <span>CONVERT TO CLIENT</span>
                      <UserCheck
                        size={14}
                        strokeWidth={2.5}
                        className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform"
                      />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Edit Client Modal */}
      {showEditModal && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[99999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="absolute inset-0" onClick={() => setShowEditModal(false)} />
          <div className="relative z-10 bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-pop flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center border border-blue-100 shadow-sm">
                  <Pencil size={16} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#18254D] tracking-tight">
                    Edit Client Information
                  </h3>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-0.5">
                    Update client data
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1.5 hover:bg-slate-200 rounded-xl text-slate-400 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-5 overflow-y-auto no-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                    ORGANISATION NAME <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200"
                    placeholder="Enter Organisation Name"
                    value={editFormData.organisationName}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        organisationName: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                    CLIENT NAME <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200"
                    placeholder="Enter Client Name"
                    value={editFormData.name}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        name: e.target.value,
                      })
                    }
                  />
                </div>

                <SearchableDropdown
                  label="CLIENT COUNTRY"
                  options={countries.map((c) => ({
                    name: c.name,
                    value: c.name,
                    code: c.code,
                  }))}
                  value={editFormData.country}
                  onChange={(val) => {
                    const countryObj = countries.find(c => c.name === val || c.code === val);
                    const countryCurrency = countryToCurrency[val] || (countryObj ? countryToCurrency[countryObj.name] : null);
                    setEditFormData({
                      ...editFormData,
                      country: countryObj ? countryObj.name : val,
                      currency: countryCurrency
                        ? countryCurrency.code
                        : editFormData.currency,
                      state: "", // Reset state when country changes
                    });
                  }}
                  placeholder="Select Country"
                />

                {countryToStates[editFormData.country] ? (
                  <SearchableDropdown
                    label="CLIENT STATE"
                    options={countryToStates[editFormData.country]}
                    value={editFormData.state}
                    onChange={(val) =>
                      setEditFormData({
                        ...editFormData,
                        state: val,
                      })
                    }
                    placeholder="Select State"
                  />
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                      CLIENT STATE
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200"
                      placeholder="e.g. State/Province"
                      value={editFormData.state}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          state: e.target.value,
                        })
                      }
                    />
                  </div>
                )}

                <SearchableDropdown
                  label="CLIENT CURRENCY"
                  options={commonCurrencies.map((c) => ({
                    name: `${c.code} (${c.symbol})`,
                    code: c.code,
                  }))}
                  value={editFormData.currency}
                  onChange={(val) =>
                    setEditFormData({
                      ...editFormData,
                      currency: val,
                    })
                  }
                  placeholder="Select Currency"
                />

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                    CLIENT STATUS
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsEditStatusDropdownOpen(!isEditStatusDropdownOpen)}
                      className="w-full h-10 flex items-center justify-between px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold shadow-sm hover:border-[#18254D]/30 transition-all text-[#18254D]"
                    >
                      <span className="truncate">{editFormData.clientStatus || "Select Status"}</span>
                      <ChevronDown
                        size={16}
                        className={`text-slate-400 transition-transform duration-200 ${
                          isEditStatusDropdownOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {isEditStatusDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-[110]"
                          onClick={() => setIsEditStatusDropdownOpen(false)}
                        />
                        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden z-[120] animate-pop origin-bottom">
                          <div className="bg-[#18254D] px-4 py-2.5 border-b border-white/10">
                            <p className="text-[10px] font-bold text-white/50 tracking-wider uppercase">
                              Select Status
                            </p>
                          </div>
                          {["Active", "Inactive", "Dismissed"].map(
                            (status) => (
                              <button
                                key={status}
                                type="button"
                                onClick={() => {
                                  setEditFormData({
                                    ...editFormData,
                                    clientStatus: status,
                                  });
                                  setIsEditStatusDropdownOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-xs font-semibold tracking-wider transition-colors ${
                                  editFormData.clientStatus === status
                                    ? "bg-slate-100 text-[#18254D]"
                                    : "text-[#18254D] hover:bg-slate-50"
                                }`}
                              >
                                {status}
                              </button>
                            ),
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 bg-[#18254D] text-white rounded-xl text-xs font-bold tracking-wider shadow-lg active:scale-[0.97] transition-all hover:bg-[#1e2e5e] hover:shadow-xl flex items-center justify-center gap-2 group/btn disabled:opacity-70 disabled:cursor-not-allowed btn-animated"
                >
                  {isSubmitting ? (
                    <>
                      <span>SAVING CHANGES...</span>
                      <Loader2 size={16} className="animate-spin" />
                    </>
                  ) : (
                    <>
                      <span>UPDATE CLIENT</span>
                      <Pencil
                        size={14}
                        strokeWidth={2.5}
                        className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform"
                      />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Follow Up Modal */}
      {showFollowUpModal && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[99999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="absolute inset-0" onClick={() => setShowFollowUpModal(false)} />
          <div className="relative z-10 bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-pop flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center border border-indigo-100 shadow-sm">
                  <MessageSquare size={16} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#18254D] tracking-tight">
                    Follow Up
                  </h3>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-0.5">
                    {followUpLeadName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowFollowUpModal(false)}
                className="p-1.5 hover:bg-slate-200 rounded-xl text-slate-400 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (followUpData.description && followUpLeadId) {
                  if (onAddActivity) {
                    const combinedDateTime = new Date(
                      `${followUpData.date}T${followUpData.time}`,
                    );
                    onAddActivity({
                      clientId: followUpLeadId,
                      type: followUpData.type,
                      description: followUpData.description,
                      date: combinedDateTime.toISOString(),
                    });
                  }
                  setShowFollowUpModal(false);
                  const lead = clients.find((c) => c.id === followUpLeadId);
                  if (lead) {
                    onSelectClient(lead, "activity");
                  }
                }
              }}
              className="p-6 space-y-5 overflow-y-auto no-scrollbar"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                    DATE
                  </label>
                  <DatePicker
                    value={followUpData.date}
                    onChange={(val) =>
                      setFollowUpData({
                        ...followUpData,
                        date: val,
                      })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                    TIME
                  </label>
                  <input
                    required
                    type="time"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200"
                    value={followUpData.time}
                    onChange={(e) =>
                      setFollowUpData({
                        ...followUpData,
                        time: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                  INTERACTION TYPE
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["Call", "Email", "Meeting"].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() =>
                        setFollowUpData({
                          ...followUpData,
                          type: type,
                        })
                      }
                      className={`py-2.5 px-3 rounded-xl border text-[12px] font-bold tracking-wider transition-all ${
                        followUpData.type === type
                          ? "bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm"
                          : "bg-white border-slate-200 text-slate-400 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                  FOLLOW UP MESSAGE
                </label>
                <textarea
                  required
                  placeholder="Write your follow-up notes..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200 min-h-[100px] resize-none"
                  value={followUpData.description}
                  onChange={(e) =>
                    setFollowUpData({
                      ...followUpData,
                      description: e.target.value,
                    })
                  }
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full h-12 bg-[#18254D] text-white rounded-xl text-xs font-bold tracking-wider shadow-lg active:scale-[0.97] transition-all hover:bg-[#1e2e5e] hover:shadow-xl flex items-center justify-center gap-2 group/btn btn-animated"
                >
                  <span>SAVE & VIEW CONVERSATIONS</span>
                  <MessageSquare
                    size={14}
                    strokeWidth={2.5}
                    className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform"
                  />
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

export default ClientList;