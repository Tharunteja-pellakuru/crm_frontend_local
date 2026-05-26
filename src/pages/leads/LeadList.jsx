import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { createPortal } from "react-dom";
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
  Loader2,
  Upload,
  Paperclip,
  UserX,
  RotateCcw,
  BellRing,
  Clock,
  Calendar,
  AlertTriangle,
  User,
  Pencil,
  LayoutGrid,
  XCircle,
  CheckCircle2,
  Send,
} from "lucide-react";
import DatePicker from "../../components/ui/DatePicker";
import { countries } from "../../utils/countries";
import {
  indianStates,
  commonCurrencies,
  countryToCurrency,
  countryToStates,
} from "../../utils/locationData";
import { formatBudget, parseBudget } from "../../utils/formatters";
import SearchableDropdown from "../../components/common/SearchableDropdown";
import { validateForm, EMAIL_PATTERN } from "../../utils/validation";
import {
  CATEGORY_MAP,
  REVERSE_CATEGORY_MAP,
} from "../../constants/categoryConstants";
import { extractCountryAndPhone, sanitizeDialCode } from "../../utils/leadUtils";

const LeadList = ({
  leads,
  clients = [],
  loading = false,
  onSelectLead,
  onAddLead,
  onDeleteLead,
  onOnboardLead,
  onDismissLead,
  onRestoreLead,
  onAddActivity,
  onUpdateConvertedLead,
  onEditLead,
  onAddFollowUp,
  allLeads = [],
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const RECORDS_PER_PAGE = 10;
  const { searchTerm, setSearchTerm } = useSearch(setCurrentPage);
  const [filterStatus, setFilterStatus] = useState("All");
  const [leadTypeFilter, setLeadTypeFilter] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isFilterPopupOpen, setIsFilterPopupOpen] = useState(false);
  const filterButtonRef = useRef(null);
  const [filterPopupStyle, setFilterPopupStyle] = useState({});

  useEffect(() => {
    if (isFilterPopupOpen && filterButtonRef.current) {
      const rect = filterButtonRef.current.getBoundingClientRect();
      // FIX: use visualViewport when available (fixes iOS Safari drift)
      const vv = window.visualViewport;
      const windowWidth = vv ? vv.width : window.innerWidth;
      const windowHeight = vv ? vv.height : window.innerHeight;
      const isMobile = windowWidth < 1024;

      const style = {
        position: "fixed",
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
      };

      if (isMobile) {
        const popupWidth = Math.min(windowWidth - 32, 400);
        style.width = `${popupWidth}px`;
        // FIX: use dvh-equivalent via visualViewport height
        style.maxHeight = `calc(${windowHeight}px - 32px)`;
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
      // FIX: also listen to visualViewport resize for iOS Safari
      if (window.visualViewport) {
        window.visualViewport.addEventListener("resize", handleScrollResize);
        window.visualViewport.addEventListener("scroll", handleScrollResize);
      }
    }
    return () => {
      window.removeEventListener("scroll", handleScrollResize, true);
      window.removeEventListener("resize", handleScrollResize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", handleScrollResize);
        window.visualViewport.removeEventListener("scroll", handleScrollResize);
      }
    };
  }, [isFilterPopupOpen]);

  const [isTierDropdownOpen, setIsTierDropdownOpen] = useState(false);
  const [isAddStatusDropdownOpen, setIsAddStatusDropdownOpen] = useState(false);
  const [isEditCategoryDropdownOpen, setIsEditCategoryDropdownOpen] = useState(false);
  const [isEditStatusDropdownOpen, setIsEditStatusDropdownOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

  const tierButtonRef = useRef(null);
  const [tierDropdownStyle, setTierDropdownStyle] = useState({});

  useEffect(() => {
    if (isTierDropdownOpen && tierButtonRef.current) {
      const rect = tierButtonRef.current.getBoundingClientRect();
      setTierDropdownStyle({
        position: "fixed",
        top: `${rect.bottom + 8}px`,
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        zIndex: 9999,
      });
    }
  }, [isTierDropdownOpen]);

  useEffect(() => {
    const handleScrollResize = (e) => {
      if (isTierDropdownOpen || isEditCategoryDropdownOpen || isEditStatusDropdownOpen) {
        if (
          e.type === "scroll" &&
          e.target.closest &&
          (e.target.closest(".tier-dropdown") ||
            e.target.closest(".edit-category-dropdown") ||
            e.target.closest(".edit-status-dropdown") ||
            e.target.closest(".country-dropdown"))
        ) {
          return;
        }
        setIsTierDropdownOpen(false);
        setIsEditCategoryDropdownOpen(false);
        setIsEditStatusDropdownOpen(false);
      }
    };
    if (isTierDropdownOpen || isEditCategoryDropdownOpen || isEditStatusDropdownOpen) {
      window.addEventListener("scroll", handleScrollResize, true);
      window.addEventListener("resize", handleScrollResize, true);
    }
    return () => {
      window.removeEventListener("scroll", handleScrollResize, true);
      window.removeEventListener("resize", handleScrollResize, true);
    };
  }, [isTierDropdownOpen, isEditCategoryDropdownOpen, isEditStatusDropdownOpen]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [onboardingLeadId, setOnboardingLeadId] = useState(null);
  const [isNameDropdownOpen, setIsNameDropdownOpen] = useState(false);
  const [nameSearch, setNameSearch] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const leadView = searchParams.get("view") || "Pending";

  const setLeadView = (view) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("view", view);
    setSearchParams(newParams, { replace: true });
  };

  useEffect(() => {
    if (leadView !== "Pending") {
      setLeadTypeFilter("All");
    }
  }, [leadView]);

  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [isOnboardStatusDropdownOpen, setIsOnboardStatusDropdownOpen] = useState(false);
  const [isOnboardPriorityDropdownOpen, setIsOnboardPriorityDropdownOpen] = useState(false);
  const [isOnboardClientStatusDropdownOpen, setIsOnboardClientStatusDropdownOpen] = useState(false);
  const [isOnboardCategoryDropdownOpen, setIsOnboardCategoryDropdownOpen] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [followUpLeadId, setFollowUpLeadId] = useState(null);
  const [followUpLeadName, setFollowUpLeadName] = useState("");
  const [showEditConvertedModal, setShowEditConvertedModal] = useState(false);
  const [editingConvertedLeadId, setEditingConvertedLeadId] = useState(null);

  const [selectedExistingClientId, setSelectedExistingClientId] = useState(null);
  const [existingClientSearch, setExistingClientSearch] = useState("");
  const [isExistingClientDropdownOpen, setIsExistingClientDropdownOpen] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    phone: "",
    countryCode: "",
    country: "",
    leadType: "Hot",
    notes: "",
    website: "",
  });
  const [isEditLeadStatusDropdownOpen, setIsEditLeadStatusDropdownOpen] = useState(false);

  const [editConvertedData, setEditConvertedData] = useState({
    name: "",
    email: "",
    phone: "",
    countryCode: "",
    organisationName: "",
    country: "India",
    state: "",
    currency: "INR",
    clientStatus: "Active",
    projectName: "",
    projectDescription: "",
    projectCategory: 1,
    projectStatus: "In Progress",
    projectPriority: "High",
    projectBudget: "",
    deadline: "",
    onboardingDate: "",
  });

  const [followUpData, setFollowUpData] = useState({
    clientId: "",
    title: "",
    description: "",
    followup_date: new Date().toLocaleDateString("en-CA"),
    priority: "High",
    followup_mode: "Call",
    followup_status: "Pending",
    timeHour: "12",
    timeMinute: "00",
    timePeriod: new Date().getHours() >= 12 ? "PM" : "AM",
    follow_brief: "",
    completed_by: "",
    completionDate: new Date().toLocaleDateString("en-CA"),
    completionHour: "12",
    completionMinute: "00",
    completionPeriod: new Date().getHours() >= 12 ? "PM" : "AM",
  });

  const [isPriorityDropdownOpen, setIsPriorityDropdownOpen] = useState(false);
  const [isHourDropdownOpen, setIsHourDropdownOpen] = useState(false);
  const [isMinuteDropdownOpen, setIsMinuteDropdownOpen] = useState(false);
  const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);
  const [isModeDropdownOpen, setIsModeDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isCompHourOpen, setIsCompHourOpen] = useState(false);
  const [isCompMinOpen, setIsCompMinOpen] = useState(false);
  const [isCompPeriodOpen, setIsCompPeriodOpen] = useState(false);

  const [onboardingData, setOnboardingData] = useState({
    name: "",
    email: "",
    phone: "",
    clientType: "New",
    status: "Active",
    projectName: "",
    projectStatus: "In Progress",
    projectCategory: 1,
    projectPriority: "High",
    projectDescription: "",
    projectBudget: "",
    country: "India",
    state: "",
    currency: "INR",
    organisationName: "",
    clientStatus: "Active",
    onboardingDate: new Date().toISOString().split("T")[0],
    deadline: "",
    scopeDocument: null,
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState(null);

  const handleOpenFollowUpModal = (lead) => {
    if (!lead) return;
    setFollowUpLeadId(lead.lead_id);
    setFollowUpLeadName(lead.name || "Lead");
    setFollowUpData({
      clientId: lead.lead_id,
      title: "",
      description: "",
      followup_date: new Date().toLocaleDateString("en-CA"),
      priority: "High",
      followup_mode: "Call",
      followup_status: "Pending",
      timeHour: "12",
      timeMinute: "00",
      timePeriod: new Date().getHours() >= 12 ? "PM" : "AM",
      follow_brief: "",
      completed_by: "",
      completionDate: new Date().toLocaleDateString("en-CA"),
      completionHour: "12",
      completionMinute: "00",
      completionPeriod: new Date().getHours() >= 12 ? "PM" : "AM",
    });
    setShowFollowUpModal(true);
  };

  const resetFollowUpModal = () => {
    setShowFollowUpModal(false);
    setFollowUpLeadId(null);
    setFollowUpLeadName("");
    setFollowUpData({
      clientId: "",
      title: "",
      description: "",
      followup_date: new Date().toLocaleDateString("en-CA"),
      priority: "High",
      followup_mode: "Call",
      followup_status: "Pending",
      timeHour: "12",
      timeMinute: "00",
      timePeriod: new Date().getHours() >= 12 ? "PM" : "AM",
      follow_brief: "",
      completed_by: "",
      completionDate: new Date().toLocaleDateString("en-CA"),
      completionHour: "12",
      completionMinute: "00",
      completionPeriod: new Date().getHours() >= 12 ? "PM" : "AM",
    });
    setIsPriorityDropdownOpen(false);
    setIsHourDropdownOpen(false);
    setIsMinuteDropdownOpen(false);
    setIsPeriodDropdownOpen(false);
    setIsModeDropdownOpen(false);
    setIsStatusDropdownOpen(false);
    setIsCompHourOpen(false);
    setIsCompMinOpen(false);
    setIsCompPeriodOpen(false);
  };

  const getPriorityBadge = (priority) => {
    switch ((priority || "").toLowerCase()) {
      case "high": return "bg-rose-100 text-rose-500";
      case "medium": return "bg-amber-100 text-amber-600";
      case "low": return "bg-emerald-100 text-emerald-600";
      default: return "bg-slate-100 text-slate-500";
    }
  };

  useScrollLock(showAddModal || showOnboardModal || showFollowUpModal || showEditConvertedModal || showDeleteModal || showEditModal);

  const [formData, setFormData] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    status: "Lead",
    leadType: "Hot",
    industry: "",
    notes: "",
    projectName: "",
    projectStatus: "In Progress",
    projectCategory: 1,
    projectPriority: "High",
    projectDescription: "",
    country: "India",
    countryCode: "+91",
  });

  const buildEditLeadFormData = (lead) => {
    const { phone, countryCode, countryName } = extractCountryAndPhone(
      lead.phone,
      lead.country || lead.client_country,
      countries
    );
    const dialCode = sanitizeDialCode(lead.country_code) || countryCode || "";
    return {
      name: lead.name || "",
      email: lead.email || "",
      phone: phone || lead.phone || "",
      countryCode: dialCode,
      country: lead.country || lead.client_country || countryName || "",
      leadType: lead.leadType || "Hot",
      notes: lead.notes || "",
      website: lead.website || "",
    };
  };

  const handleEditConvertedClick = (lead) => {
    setEditingConvertedLeadId(lead.lead_id);
    const { phone: extractedPhone, countryCode: extractedDialCode, countryName: extractedCountryName } =
      extractCountryAndPhone(lead.phone, lead.country, countries);
    const dialCode = lead.country_code || extractedDialCode || "";
    const name = lead.client_country || lead.country || extractedCountryName || "";
    const phone = extractedPhone || lead.phone || "";
    let finalDialCode = dialCode || "";
    if (finalDialCode && !finalDialCode.startsWith("+") && /^\d+$/.test(finalDialCode)) {
      finalDialCode = `+${finalDialCode}`;
    }
    setEditConvertedData({
      name: lead.name,
      email: lead.email,
      phone: phone,
      countryCode: finalDialCode,
      organisationName: lead.client_organisation || lead.organisation_name || "",
      country: name,
      state: lead.client_state || lead.state || "",
      currency: lead.currency || "",
      clientStatus: lead.status || "Active",
      projectName: lead.projectName || "",
      projectDescription: lead.projectDescription || lead.notes || "",
      projectCategory: lead.projectCategory || 1,
      projectStatus: lead.projectStatus || "In Progress",
      projectPriority: lead.projectPriority || "High",
      projectBudget: lead.budget || "",
      deadline: lead.deadline || "",
      onboardingDate: lead.onboardingDate || lead.joinedDate || "",
      website: lead.website || "",
      leadType: lead.leadType || "Converted",
    });
    setIsCategoryDropdownOpen(false);
    setIsTierDropdownOpen(false);
    setShowEditConvertedModal(true);
  };

  const handleEditConvertedSubmit = async (e) => {
    e.preventDefault();
    const isValid = validateForm(editConvertedData, {
      name: { required: true, minLength: 2, label: "Full Name" },
      email: { required: true, pattern: /^\S+@\S+\.\S+$/, label: "Email" },
      countryCode: { required: true, minLength: 2, label: "Country Code" },
      phone: { required: true, minLength: 10, label: "Phone Number" },
    });
    if (!isValid) return;
    setIsSubmitting(true);
    try {
      if (onUpdateConvertedLead && editingConvertedLeadId) {
        const result = await onUpdateConvertedLead(editingConvertedLeadId, editConvertedData);
        if (result.success) {
          setShowEditConvertedModal(false);
          setEditingConvertedLeadId(null);
        } else {
          toast.error("Failed to update converted lead.");
        }
      }
    } catch (error) {
      toast.error("Error updating converted lead.");
      console.error("Failed to update converted lead:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOnboardSubmit = async (e) => {
    e.preventDefault();
    if (onboardingData.clientType === "Existing") {
      if (!selectedExistingClientId) {
        toast.error("Please select an existing client.");
        return;
      }
      const isValid = validateForm(onboardingData, {
        projectName: { required: true, label: "Project Name" },
        projectDescription: { required: true, label: "Project Description" },
        projectCategory: { required: true, label: "Project Category" },
        projectStatus: { required: true, label: "Project Status" },
        projectPriority: { required: true, label: "Project Priority" },
        projectBudget: { required: true, type: "number", label: "Project Budget" },
        onboardingDate: { required: true, label: "Onboarding Date" },
        deadline: { required: true, label: "Deadline Date" },
        scopeDocument: { required: true, label: "Scope Document" },
      });
      if (!isValid) return;
    } else {
      const isValid = validateForm(onboardingData, {
        name: { required: true, minLength: 2, label: "Full Name" },
        email: { required: true, pattern: /^\S+@\S+\.\S+$/, label: "Email" },
        phone: { required: true, minLength: 10, label: "Phone Number" },
        organisationName: { required: true, label: "Organisation Name" },
        country: { required: true, label: "Client Country" },
        state: { required: true, label: "Client State" },
        currency: { required: true, label: "Client Currency" },
        clientStatus: { required: true, label: "Client Status" },
        projectName: { required: true, label: "Project Name" },
        projectDescription: { required: true, label: "Project Description" },
        projectCategory: { required: true, label: "Project Category" },
        projectStatus: { required: true, label: "Project Status" },
        projectPriority: { required: true, label: "Project Priority" },
        projectBudget: { required: true, type: "number", label: "Project Budget" },
        onboardingDate: { required: true, label: "Onboarding Date" },
        deadline: { required: true, label: "Deadline Date" },
        scopeDocument: { required: true, label: "Scope Document" },
      });
      if (!isValid) return;
    }
    setIsSubmitting(true);
    try {
      if (onOnboardLead && onboardingLeadId) {
        const submitData = {
          ...onboardingData,
          ...(onboardingData.clientType === "Existing" ? { existingClientId: selectedExistingClientId } : {}),
        };
        await onOnboardLead(onboardingLeadId, submitData);
        setOnboardingLeadId(null);
        setShowOnboardModal(false);
        setSelectedExistingClientId(null);
        setExistingClientSearch("");
        setLeadView("Converted");
        setOnboardingData({
          name: "",
          email: "",
          phone: "",
          clientType: "New",
          status: "",
          projectName: "",
          projectStatus: "In Progress",
          projectCategory: 1,
          projectPriority: "High",
          projectDescription: "",
          country: "",
          state: "",
          currency: "",
          organisationName: "",
          clientStatus: "Active",
          onboardingDate: new Date().toISOString().split("T")[0],
          deadline: "",
          scopeDocument: null,
          website: "",
        });
      }
    } catch (error) {
      toast.error("Failed to onboard lead.");
      console.error("Failed to onboard lead:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredLeads = (leads || []).filter((lead) => {
    if (!lead || typeof lead !== "object") return false;
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      (lead.name || "").toLowerCase().includes(q) ||
      (lead.company || "").toLowerCase().includes(q) ||
      (lead.email || "").toLowerCase().includes(q) ||
      (lead.phone || "").toLowerCase().includes(q);

    let matchesStatus = filterStatus === "All" || lead.status === filterStatus;
    let matchesLeadType = true;

    if (leadView === "Pending") {
      if (lead.isConverted || lead.status === "Dismissed") return false;
    } else if (leadView === "Converted") {
      if (!lead.isConverted || lead.status === "Dismissed") return false;
    } else if (leadView === "Dismissed") {
      if (lead.status !== "Dismissed") return false;
    }

    matchesLeadType = leadTypeFilter === "All" || lead.leadType === leadTypeFilter;

    if (startDate || endDate) {
      const joinedDate = new Date(lead.joinedDate);
      if (startDate && joinedDate < new Date(startDate)) return false;
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (joinedDate > end) return false;
      }
    }

    return matchesSearch && matchesStatus && matchesLeadType;
  }).sort((a, b) => {
    const priority = { Hot: 1, Warm: 2, Cold: 3 };
    const aPriority = priority[a.leadType] || 4;
    const bPriority = priority[b.leadType] || 4;
    if (aPriority !== bPriority) return aPriority - bPriority;
    const dateA = new Date(a.joinedDate || 0);
    const dateB = new Date(b.joinedDate || 0);
    return dateB - dateA;
  });

  const totalPages = Math.ceil(filteredLeads.length / RECORDS_PER_PAGE);
  const currentLeads = filteredLeads.slice(
    (currentPage - 1) * RECORDS_PER_PAGE,
    currentPage * RECORDS_PER_PAGE,
  );

  const renderContactDetails = (lead) => {
    if (!lead.phone && !lead.email) return "N/A";
    let countryCode = lead.country_code || "";
    if (countryCode && /^\d+$/.test(countryCode)) countryCode = `+${countryCode}`;
    let phone = (lead.phone || "").trim();
    if (countryCode) {
      const match = countryCode.match(/\(([^)]+)\)/);
      if (match && match[1]) countryCode = match[1];
      if (phone.startsWith(countryCode)) phone = phone.slice(countryCode.length).trim();
    }
    return (
      <div className="flex flex-col">
        <div className="flex items-center gap-2 text-primary">
          <Phone size={14} className="text-secondary" />
          <span className="text-[13px] font-bold whitespace-nowrap">
            {countryCode ? `${countryCode} ` : ""}{phone || "N/A"}
          </span>
        </div>
      </div>
    );
  };

  const getStatusBadge = (lead) => {
    if (lead.status === "Lead" && lead.leadType) {
      switch (lead.leadType) {
        case "Hot": return { label: "Hot", className: "bg-error/10 text-error border-error/20", icon: <Flame size={12} strokeWidth={3} /> };
        case "Warm": return { label: "Warm", className: "bg-warning/10 text-warning border-warning/20", icon: <Sun size={12} strokeWidth={3} /> };
        case "Cold": return { label: "Cold", className: "bg-info/10 text-info border-info/20", icon: <Snowflake size={12} strokeWidth={3} /> };
        default: return { label: lead.leadType, className: "bg-primary/10 text-primary border-primary/20", icon: null };
      }
    }
    if (lead.isConverted && lead.leadType) {
      switch (lead.leadType) {
        case "Hot": return { label: "Hot", className: "bg-error/10 text-error border-error/20", icon: <Flame size={12} strokeWidth={3} /> };
        case "Warm": return { label: "Warm", className: "bg-warning/10 text-warning border-warning/20", icon: <Sun size={12} strokeWidth={3} /> };
        case "Cold": return { label: "Cold", className: "bg-info/10 text-info border-info/20", icon: <Snowflake size={12} strokeWidth={3} /> };
        default: return { label: lead.leadType || "Converted", className: "bg-success/10 text-success border-success/20", icon: null };
      }
    }
    switch (lead.status) {
      case "Lead": return { label: "Lead", className: "bg-info/10 text-info border-info/20", icon: null };
      case "Converted":
      case "Active": return { label: "Converted", className: "bg-success/10 text-success border-success/20", icon: null };
      case "Pending": return { label: "Pending", className: "bg-slate-100 text-slate-500 border-slate-200", icon: null };
      case "Churned": return { label: "Churned", className: "bg-slate-200 text-slate-400 border-slate-300", icon: null };
      case "Inactive": return { label: "Inactive", className: "bg-slate-100 text-slate-400 border-slate-200", icon: null };
      case "Dismissed": return { label: "Dismissed", className: "bg-slate-100 text-slate-400 border-slate-200", icon: <UserX size={12} /> };
      default: return { label: lead.status, className: "bg-slate-100 text-slate-700 border-slate-200", icon: null };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isValid = validateForm(formData, {
      name: { required: true, minLength: 2, label: "Full Name", pattern: /^[a-zA-Z0-9\s]+$/, errorMessage: "Full Name must contain only letters and numbers." },
      email: { required: true, pattern: EMAIL_PATTERN, label: "Email", errorMessage: "Enter a valid email (e.g. john@gmail.com, john@yahoo.com)." },
      phone: { required: true, minLength: 10, label: "Phone Number", pattern: /^\d+$/, errorMessage: "Phone Number must be at least 10 digits." },
      countryCode: { required: true, label: "Country Code" },
      leadType: { required: true, label: "Lead Status" },
    });
    if (!isValid) return;
    setIsSubmitting(true);
    try {
      if (onAddLead) {
        const submissionData = { ...formData, company: formData.company || "", industry: formData.industry || "Unknown" };
        await onAddLead(submissionData);
        setShowAddModal(false);
        setFormData({ name: "", company: "", email: "", phone: "", status: "Lead", leadType: "Hot", industry: "", notes: "", projectName: "", projectStatus: "In Progress", projectCategory: 1, projectPriority: "High", projectDescription: "", country: "India", countryCode: "+91" });
        toast.success("Lead added successfully!");
      }
    } catch (error) {
      toast.error("Failed to add lead.");
      console.error("Failed to add lead:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <p className="text-sm text-slate-500">Loading leads...</p>
        </div>
      </div>
    );
  }

  const viewLeads = (leads || []).filter((lead) => {
    if (!lead || typeof lead !== "object") return false;
    if (leadView === "Pending") { if (lead.isConverted || lead.status === "Dismissed") return false; }
    else if (leadView === "Converted") { if (!lead.isConverted || lead.status === "Dismissed") return false; }
    else if (leadView === "Dismissed") { if (lead.status !== "Dismissed") return false; }
    return true;
  });

  const totalLeadsCount = viewLeads.length;
  const hotLeadsCount = viewLeads.filter((l) => l.leadType === "Hot").length;
  const warmLeadsCount = viewLeads.filter((l) => l.leadType === "Warm").length;
  const coldLeadsCount = viewLeads.filter((l) => l.leadType === "Cold").length;

  return (
    <div className="w-full relative">
      <div className="space-y-5 animate-fade-in w-full">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="max-w-2xl">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary tracking-tight mb-2">Leads</h2>
            <p className="text-xs md:text-sm text-textMuted font-medium leading-relaxed">Manage your network of leads and strategic partnerships.</p>
          </div>
          <div className="w-full lg:w-auto">
            <button
              onClick={() => setShowAddModal(true)}
              className="w-full lg:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-[#18254D] text-white rounded-2xl hover:bg-slate-800 transition-all text-[13px] font-bold tracking-wider shadow-lg active:scale-95 group"
            >
              <Plus size={16} strokeWidth={2.5} className="group-hover:rotate-90 transition-transform" />
              Add Lead
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* FIX: added min-w-0 on inner text div of every stat card to prevent overflow at 320px */}
          <div className="bg-white p-3 sm:p-5 rounded-2xl shadow-sm border border-slate-200 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="p-2 sm:p-3 rounded-full bg-blue-50 text-blue-500 shrink-0"><Briefcase className="w-5 h-5 sm:w-6 sm:h-6" /></div>
              <div className="min-w-0 flex-1">
                <h3 className="text-slate-500 text-[10px] sm:text-xs font-semibold truncate">Total Leads</h3>
                <p className="text-lg sm:text-2xl font-bold text-[#18254D] leading-none mt-1 truncate">{totalLeadsCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-3 sm:p-5 rounded-2xl shadow-sm border border-slate-200 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="p-2 sm:p-3 rounded-full bg-rose-50 text-rose-500 shrink-0"><Flame className="w-5 h-5 sm:w-6 sm:h-6" /></div>
              <div className="min-w-0 flex-1">
                <h3 className="text-slate-500 text-[10px] sm:text-xs font-semibold truncate">Hot Leads</h3>
                <p className="text-lg sm:text-2xl font-bold text-[#18254D] leading-none mt-1 truncate">{hotLeadsCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-3 sm:p-5 rounded-2xl shadow-sm border border-slate-200 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="p-2 sm:p-3 rounded-full bg-amber-50 text-amber-500 shrink-0"><Sun className="w-5 h-5 sm:w-6 sm:h-6" /></div>
              <div className="min-w-0 flex-1">
                <h3 className="text-slate-500 text-[10px] sm:text-xs font-semibold truncate">Warm Leads</h3>
                <p className="text-lg sm:text-2xl font-bold text-[#18254D] leading-none mt-1 truncate">{warmLeadsCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-3 sm:p-5 rounded-2xl shadow-sm border border-slate-200 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="p-2 sm:p-3 rounded-full bg-sky-50 text-sky-500 shrink-0"><Snowflake className="w-5 h-5 sm:w-6 sm:h-6" /></div>
              <div className="min-w-0 flex-1">
                <h3 className="text-slate-500 text-[10px] sm:text-xs font-semibold truncate">Cold Leads</h3>
                <p className="text-lg sm:text-2xl font-bold text-[#18254D] leading-none mt-1 truncate">{coldLeadsCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Control Bar */}
        <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm relative z-[60]">
          <div className="flex flex-col md:flex-row md:justify-between gap-2 w-full items-center">
            <div className="relative w-full md:w-64 flex-none transition-all duration-300">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-[38px] pl-11 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-secondary/10 focus:border-secondary transition-all"
              />
            </div>

            {/* FIX: added shrink-0 to prevent filter button from being squeezed on 768–900px */}
            <div className="relative w-full md:w-auto flex-none shrink-0" ref={filterButtonRef}>
              <button
                onClick={() => setIsFilterPopupOpen(!isFilterPopupOpen)}
                className={`w-full md:w-auto h-[38px] flex items-center justify-center gap-2.5 px-6 py-2 rounded-xl text-[12px] font-bold tracking-widest transition-all shadow-sm active:scale-95 group border ${
                  leadTypeFilter !== "All" || startDate || endDate
                    ? "bg-secondary/5 border-secondary text-secondary"
                    : "bg-slate-50 border-slate-100 text-[#18254D] hover:bg-white hover:border-slate-200 shadow-slate-200/50"
                }`}
              >
                <Filter size={14} className={leadTypeFilter !== "All" || startDate || endDate ? "text-secondary" : "text-slate-400"} />
                <span>FILTERS</span>
                {(leadTypeFilter !== "All" || startDate || endDate) && (
                  <span className="flex items-center justify-center w-5 h-5 bg-secondary text-white text-[10px] font-black rounded-full ml-1 shadow-sm">
                    {[leadTypeFilter !== "All", !!startDate, !!endDate].filter(Boolean).length}
                  </span>
                )}
                <ChevronDown size={14} className={`transition-transform duration-300 ${isFilterPopupOpen ? "rotate-180" : ""}`} />
              </button>

              {isFilterPopupOpen && createPortal(
                <>
                  <div className="fixed inset-0 z-[99998] bg-slate-900/20 backdrop-blur-[2px] animate-fade-in" onClick={() => setIsFilterPopupOpen(false)} />
                  <div className={`${window.innerWidth < 1024 ? "fixed inset-0 flex items-center justify-center p-4 z-[99999] pointer-events-none" : ""}`}>
                    <div className="bg-white border border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden animate-fade-in-up ring-1 ring-black/5 rounded-3xl pointer-events-auto" style={filterPopupStyle}>
                      <div className="flex-none p-4 border-b border-slate-50 flex items-center justify-between bg-white relative z-10">
                        <div className="flex items-center gap-2">
                          <Filter size={14} className="text-secondary" />
                          <h3 className="text-[11px] font-black text-[#18254D] tracking-[0.2em] uppercase">Filter Leads</h3>
                        </div>
                        {(leadTypeFilter !== "All" || startDate || endDate) && (
                          <button onClick={() => { setLeadTypeFilter("All"); setStartDate(""); setEndDate(""); setIsFilterPopupOpen(false); }} className="text-[10px] font-black text-rose-500 hover:text-rose-600 tracking-widest uppercase transition-colors">
                            Clear All
                          </button>
                        )}
                      </div>
                      <div className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
                        {leadView === "Pending" && (
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase ml-1">Lead Status</label>
                            <SearchableDropdown
                              placeholder="Select Lead Status..."
                              options={[
                                { label: <div className="flex items-center gap-2 text-slate-600"><LayoutGrid size={14} /> ALL</div>, name: "ALL", value: "All" },
                                { label: <div className="flex items-center gap-2 text-red-500"><Flame size={14} /> HOT</div>, name: "HOT", value: "Hot" },
                                { label: <div className="flex items-center gap-2 text-amber-500"><Sun size={14} /> WARM</div>, name: "WARM", value: "Warm" },
                                { label: <div className="flex items-center gap-2 text-blue-500"><Snowflake size={14} /> COLD</div>, name: "COLD", value: "Cold" },
                              ]}
                              value={leadTypeFilter}
                              onChange={setLeadTypeFilter}
                            />
                          </div>
                        )}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase ml-1">Date Range</label>
                          <div className="grid grid-cols-2 gap-2">
                            <DatePicker label="From" value={startDate} onChange={setStartDate} />
                            <DatePicker label="To" value={endDate} onChange={setEndDate} />
                          </div>
                        </div>
                      </div>
                      <div className="flex-none p-4 bg-white border-t border-slate-50 relative z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
                        <button onClick={() => setIsFilterPopupOpen(false)} className="w-full py-2.5 bg-[#18254D] text-white rounded-2xl text-[11px] font-black tracking-[0.2em] uppercase hover:bg-slate-800 transition-all shadow-lg active:scale-95">
                          Apply Filters
                        </button>
                      </div>
                    </div>
                  </div>
                </>,
                document.body
              )}
            </div>
          </div>
        </div>

        {/* Lead View Toggles */}
        {/* FIX: replaced flex-wrap with a horizontally scrollable row — prevents the 3+1 orphan-pill wrap on 375px */}
        <div className="flex overflow-x-auto scrollbar-hide gap-2 sm:gap-3 my-4 w-full px-1 sm:px-0 pb-1">
          <button onClick={() => setLeadView("All")} className={`px-4 py-2 sm:px-5 sm:py-2 rounded-full text-[12px] sm:text-[13px] font-bold flex items-center gap-2 transition-all cursor-pointer border whitespace-nowrap flex-shrink-0 ${leadView === "All" || !["Pending","Converted","Dismissed"].includes(leadView) ? "bg-[#0F172A] text-white border-[#0F172A] shadow-sm" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700"}`}>
            <LayoutGrid size={16} /> All
          </button>
          <button onClick={() => setLeadView("Pending")} className={`px-4 py-2 sm:px-5 sm:py-2 rounded-full text-[12px] sm:text-[13px] font-bold flex items-center gap-2 transition-all cursor-pointer border whitespace-nowrap flex-shrink-0 ${leadView === "Pending" ? "bg-[#FFF9ED] text-[#B45309] border-[#FDE68A] shadow-sm" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700"}`}>
            <Clock size={16} /> Pending
          </button>
          <button onClick={() => setLeadView("Converted")} className={`px-4 py-2 sm:px-5 sm:py-2 rounded-full text-[12px] sm:text-[13px] font-bold flex items-center gap-2 transition-all cursor-pointer border whitespace-nowrap flex-shrink-0 ${leadView === "Converted" ? "bg-[#ECFDF5] text-[#059669] border-[#A7F3D0] shadow-sm" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700"}`}>
            <CheckCircle2 size={16} /> Converted
          </button>
          <button onClick={() => setLeadView("Dismissed")} className={`px-4 py-2 sm:px-5 sm:py-2 rounded-full text-[12px] sm:text-[13px] font-bold flex items-center gap-2 transition-all cursor-pointer border whitespace-nowrap flex-shrink-0 ${leadView === "Dismissed" ? "bg-[#FEF2F2] text-[#E11D48] border-[#FECACA] shadow-sm" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700"}`}>
            <XCircle size={16} /> Dismissed
          </button>
        </div>

        {/* Desktop Table */}
        <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden w-full">
          <div className="w-full">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Lead Name</th>
                  <th className="px-6 py-5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Contact Details</th>
                  <th className="px-6 py-5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Lead Status</th>
                  <th className="px-6 py-5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Created By</th>
                  <th className="px-6 py-5 text-right text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentLeads.map((lead, index) => {
                  const status = getStatusBadge(lead);
                  return (
                    <tr
                      key={lead.lead_id ? `lead-row-${lead.lead_id}` : `lead-row-idx-${index}`}
                      onClick={() => lead.status !== "Dismissed" && onSelectLead(lead)}
                      className={`group transition-all ${lead.status === "Dismissed" ? "bg-slate-50/30 opacity-80 cursor-default" : "hover:bg-slate-50/50 cursor-pointer"}`}
                    >
                      <td className="px-6 py-5">
                        <div className="flex flex-col min-w-0">
                          <div className="font-bold text-[13px] text-[#18254D] tracking-tight leading-none mb-1 group-hover:text-secondary transition-colors">{lead.name}</div>
                          <div className="text-[12px] text-slate-400">{lead.email || "No email provided"}</div>
                        </div>
                      </td>
                      <td className="px-6 py-5">{renderContactDetails(lead)}</td>
                      <td className="px-6 py-5">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1.5 shadow-sm transition-all w-fit ${status.className}`}>
                          {status.icon}{status.label}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-[12px] font-semibold text-slate-600">{lead.createdByName || "System"}</div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        {/* FIX: added aria-label on every icon button for touch/screen-reader accessibility */}
                        <div className="flex justify-end gap-3" onClick={(e) => e.stopPropagation()}>
                          {lead.status !== "Dismissed" && (
                            <button aria-label="Add Follow Up" onClick={(e) => { e.stopPropagation(); handleOpenFollowUpModal(lead); }} className="w-[34px] h-[34px] flex items-center justify-center bg-indigo-50/50 border border-indigo-100 rounded-[10px] text-indigo-500 hover:bg-indigo-100 transition-all active:scale-90 shadow-sm relative group/btn">
                              <BellRing size={16} />
                              <div className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 opacity-0 group-hover/btn:opacity-100 transition-opacity bg-[#18254D] text-white text-[10px] font-bold px-2.5 py-1 rounded-[6px] whitespace-nowrap pointer-events-none z-[100] shadow-md">Add Follow Up</div>
                            </button>
                          )}
                          {leadView === "Converted" ? (
                            <button
                              aria-label="Edit Lead"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingLead(lead);
                                setEditFormData(buildEditLeadFormData(lead));
                                setShowEditModal(true);
                              }}
                              className="w-[34px] h-[34px] flex items-center justify-center bg-blue-50/50 border border-blue-100 rounded-[10px] text-blue-500 hover:bg-blue-100 transition-all active:scale-90 shadow-sm relative group/btn"
                            >
                              <Pencil size={16} />
                              <div className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 opacity-0 group-hover/btn:opacity-100 transition-opacity bg-[#18254D] text-white text-[10px] font-bold px-2.5 py-1 rounded-[6px] whitespace-nowrap pointer-events-none z-[100] shadow-md">Edit Lead</div>
                            </button>
                          ) : (
                            <>
                              {onOnboardLead && lead.status === "Lead" && (
                                <button
                                  aria-label="Convert to Client"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOnboardingLeadId(lead.lead_id);
                                    const initialCountry = lead.country || "";
                                    const countryCurrency = countryToCurrency[initialCountry]?.code || "";
                                    setOnboardingData({ name: lead.name, email: lead.email, phone: lead.phone, organisationName: lead.client_organisation || lead.organisation_name || "", country: initialCountry, state: lead.state || "", website: lead.website || "", clientType: "New", status: "Active", projectName: "", projectCategory: lead.projectCategory || 1, projectPriority: "High", projectDescription: "", onboardingDate: new Date().toISOString().split("T")[0], deadline: "", scopeDocument: "", projectStatus: "In Progress", clientStatus: "Active", currency: lead.currency || countryCurrency || "" });
                                    setShowOnboardModal(true);
                                  }}
                                  className="w-[34px] h-[34px] flex items-center justify-center bg-emerald-50/50 border border-emerald-100 rounded-[10px] text-emerald-500 hover:bg-emerald-100 transition-all active:scale-90 shadow-sm relative group/btn"
                                >
                                  <UserCheck size={16} />
                                  <div className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 opacity-0 group-hover/btn:opacity-100 transition-opacity bg-[#18254D] text-white text-[10px] font-bold px-2.5 py-1 rounded-[6px] whitespace-nowrap pointer-events-none z-[100] shadow-md">Convert to Client</div>
                                </button>
                              )}
                              {lead.status === "Lead" && onEditLead && (
                                <button
                                  aria-label="Edit Lead"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingLead(lead);
                                    setEditFormData(buildEditLeadFormData(lead));
                                    setShowEditModal(true);
                                  }}
                                  className="w-[34px] h-[34px] flex items-center justify-center bg-blue-50/50 border border-blue-100 rounded-[10px] text-blue-500 hover:bg-blue-100 transition-all active:scale-90 shadow-sm relative group/btn"
                                >
                                  <Pencil size={16} />
                                  <div className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 opacity-0 group-hover/btn:opacity-100 transition-opacity bg-[#18254D] text-white text-[10px] font-bold px-2.5 py-1 rounded-[6px] whitespace-nowrap pointer-events-none z-[100] shadow-md">Edit Lead</div>
                                </button>
                              )}
                              {onDismissLead && (lead.status === "Lead" || lead.isConverted) && lead.status !== "Dismissed" && (
                                <button aria-label="Dismiss Lead" onClick={(e) => { e.stopPropagation(); onDismissLead(lead.lead_id); }} className="w-[34px] h-[34px] flex items-center justify-center bg-[#FFF9ED] border border-[#FDE68A] rounded-[10px] text-[#F59E0B] hover:text-[#D97706] hover:border-[#FCD34D] transition-all active:scale-90 shadow-sm relative group/btn">
                                  <UserX size={16} />
                                  <div className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 opacity-0 group-hover/btn:opacity-100 transition-opacity bg-[#18254D] text-white text-[10px] font-bold px-2.5 py-1 rounded-[6px] whitespace-nowrap pointer-events-none z-[100] shadow-md">Dismiss Lead</div>
                                </button>
                              )}
                              {onRestoreLead && lead.status === "Dismissed" && (
                                <div className="flex gap-2">
                                  <button aria-label="Restore Lead" onClick={(e) => { e.stopPropagation(); onRestoreLead(lead.lead_id); }} className="w-[34px] h-[34px] flex items-center justify-center bg-blue-50/50 border border-blue-100 rounded-[10px] text-blue-500 hover:bg-blue-100 transition-all active:scale-90 shadow-sm relative group/btn">
                                    <RotateCcw size={16} />
                                    <div className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 opacity-0 group-hover/btn:opacity-100 transition-opacity bg-[#18254D] text-white text-[10px] font-bold px-2.5 py-1 rounded-[6px] whitespace-nowrap pointer-events-none z-[100] shadow-md">Restore Lead</div>
                                  </button>
                                  {onDeleteLead && (
                                    <button aria-label="Delete Lead" onClick={(e) => { e.stopPropagation(); setLeadToDelete(lead); setShowDeleteModal(true); }} className="w-[34px] h-[34px] flex items-center justify-center bg-[#FEF2F2] border border-[#FECACA] rounded-[10px] text-[#EF4444] hover:text-[#DC2626] hover:border-[#FCA5A5] transition-all active:scale-90 shadow-sm relative group/btn">
                                      <Trash2 size={16} />
                                      <div className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 opacity-0 group-hover/btn:opacity-100 transition-opacity bg-[#18254D] text-white text-[10px] font-bold px-2.5 py-1 rounded-[6px] whitespace-nowrap pointer-events-none z-[100] shadow-md">Delete Lead</div>
                                    </button>
                                  )}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredLeads.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-10 py-32 text-center">
                      <div className="text-slate-300 p-4 rounded-xl mb-4 flex items-center justify-center mx-auto"><UserX size={32} strokeWidth={1.5} /></div>
                      <p className="text-[13px] font-bold text-primary tracking-wider">No Active Leads</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Card List */}
        <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentLeads.map((lead, index) => {
            const status = getStatusBadge(lead);
            return (
              <div
                key={lead.lead_id ? `lead-mobile-${lead.lead_id}` : `lead-mobile-idx-${index}`}
                onClick={() => lead.status !== "Dismissed" && onSelectLead(lead)}
                className={`bg-white p-4 rounded-2xl border transition-all ${lead.status === "Dismissed" ? "border-slate-100 opacity-80 shadow-none cursor-default" : "border-slate-200 shadow-sm hover:shadow-md active:scale-[0.98] cursor-pointer"}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-lg border-2 border-slate-50 shadow-md shrink-0">
                      {lead.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-primary truncate">{lead.name}</div>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-lg text-[14px] font-bold border flex items-center gap-1.5 shadow-sm shrink-0 ml-2 ${status.className}`}>
                    {status.icon}{status.label}
                  </span>
                </div>
                <div className="mb-4 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-[12px] font-medium text-slate-500">
                  Created By: <span className="font-semibold text-slate-700">{lead.createdByName || "System"}</span>
                </div>
                <div className="space-y-3 mb-4">
                  {lead.status === "Lead" ? (
                    <div className="space-y-3">
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <p className="text-xs text-primary/80 font-medium italic line-clamp-2">"{lead.notes || lead.industry || "No notes available"}"</p>
                      </div>
                      <div className="px-1">{renderContactDetails(lead)}</div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2">{renderContactDetails(lead)}</div>
                  )}
                </div>
                {/* FIX: added min-w-0 on the left side and shrink-0 on the action cluster to prevent overflow at 320px */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <button onClick={(e) => { e.stopPropagation(); onSelectLead(lead); }} className="flex items-center gap-1 text-[12px] font-bold text-secondary uppercase tracking-widest hover:text-secondary/80 transition-colors min-w-0">
                    <span className="truncate">View Details</span> <ChevronRight size={14} className="shrink-0" />
                  </button>
                  <div className="flex items-center gap-2 shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                    {lead.status !== "Dismissed" && (
                      <button aria-label="Add Follow Up" onClick={(e) => { e.stopPropagation(); handleOpenFollowUpModal(lead); }} className="p-2 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg hover:bg-indigo-100 transition-all active:scale-90"><BellRing size={16} /></button>
                    )}
                    {leadView === "Converted" ? (
                      <button
                        aria-label="Edit Lead"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingLead(lead);
                          setEditFormData(buildEditLeadFormData(lead));
                          setShowEditModal(true);
                        }}
                        className="p-2 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg hover:bg-blue-100 transition-all active:scale-90"
                      >
                        <Pencil size={16} />
                      </button>
                    ) : (
                      <>
                        {onOnboardLead && lead.status === "Lead" && (
                          <button
                            aria-label="Convert to Client"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOnboardingLeadId(lead.lead_id);
                              const initialCountry = lead.country || "";
                              const countryCurrency = countryToCurrency[initialCountry]?.code || "";
                              setOnboardingData({ name: lead.name, email: lead.email, phone: lead.phone, clientType: "New", status: "Active", projectName: "", projectDescription: "", onboardingDate: new Date().toISOString().split("T")[0], deadline: "", scopeDocument: "", projectStatus: "In Progress", projectCategory: lead.projectCategory || 1, projectPriority: "High", clientStatus: "Active", currency: lead.currency || countryCurrency || "", country: initialCountry, state: lead.state || "" });
                              setShowOnboardModal(true);
                            }}
                            className="p-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg hover:bg-emerald-100 transition-all active:scale-90"
                          >
                            <UserCheck size={16} />
                          </button>
                        )}
                        {onDismissLead && (lead.status === "Lead" || lead.isConverted) && lead.status !== "Dismissed" && (
                          <button aria-label="Dismiss Lead" onClick={(e) => { e.stopPropagation(); onDismissLead(lead.lead_id); }} className="p-2 bg-amber-50 text-amber-600 border border-amber-100 rounded-lg hover:bg-amber-100 transition-all active:scale-90"><UserX size={16} /></button>
                        )}
                        {onEditLead && lead.status === "Lead" && (
                          <button
                            aria-label="Edit Lead"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingLead(lead);
                              setEditFormData(buildEditLeadFormData(lead));
                              setShowEditModal(true);
                            }}
                            className="p-2 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg hover:bg-blue-100 transition-all active:scale-90"
                          >
                            <Pencil size={16} />
                          </button>
                        )}
                        {onRestoreLead && lead.status === "Dismissed" && (
                          <div className="flex gap-2">
                            <button aria-label="Restore Lead" onClick={(e) => { e.stopPropagation(); onRestoreLead(lead.lead_id); }} className="p-2 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg hover:bg-blue-100 transition-all active:scale-90"><RotateCcw size={16} /></button>
                            {onDeleteLead && (
                              <button aria-label="Delete Lead" onClick={(e) => { e.stopPropagation(); setLeadToDelete(lead); setShowDeleteModal(true); }} className="p-2 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg hover:bg-rose-100 transition-all active:scale-90"><Trash2 size={16} /></button>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {filteredLeads.length === 0 && (
            <div className="col-span-full text-center py-10 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-slate-300 p-4 rounded-xl mb-4 flex items-center justify-center mx-auto"><UserX size={32} strokeWidth={1.5} /></div>
              <p className="text-[13px] font-bold text-primary tracking-wider">No Active Leads</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {/* FIX: added overflow-x-auto so pagination doesn't break layout on very small screens */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8 mb-4 overflow-x-auto px-2">
            <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-primary hover:border-primary disabled:opacity-30 disabled:hover:border-slate-200 disabled:hover:text-slate-400 transition-all shadow-sm active:scale-95 shrink-0">
              <ChevronLeft size={16} strokeWidth={2.5} />
            </button>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-2xl shadow-inner mx-2">
              {[...Array(totalPages)].map((_, i) => {
                const pageNum = i + 1;
                if (totalPages > 7 && pageNum !== 1 && pageNum !== totalPages && Math.abs(pageNum - currentPage) > 1) {
                  if (pageNum === 2 || pageNum === totalPages - 1) return <span key={`ellipsis-${pageNum}`} className="text-slate-300 px-1 font-bold">…</span>;
                  return null;
                }
                return (
                  <button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={`min-w-[32px] h-8 flex items-center justify-center rounded-lg text-sm font-black transition-all ${currentPage === pageNum ? "bg-[#18254D] text-white shadow-lg shadow-slate-300 scale-110" : "text-slate-400 hover:text-primary hover:bg-white"}`}>
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-primary hover:border-primary disabled:opacity-30 disabled:hover:border-slate-200 disabled:hover:text-slate-400 transition-all shadow-sm active:scale-95 shrink-0">
              <ChevronRight size={16} strokeWidth={2.5} />
            </button>
          </div>
        )}
      </div>

      {/* ── ADD LEAD MODAL ── */}
      {/* FIX: modal uses dvh so it doesn't overflow iOS Safari's visible area; submit button is sticky outside scroll */}
      {showAddModal && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[99999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="absolute inset-0" onClick={() => setShowAddModal(false)} />
          <div className="relative z-10 bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-pop flex flex-col max-h-[90dvh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#EFF6FF] text-[#3B82F6] rounded-xl flex items-center justify-center border border-[#DBEAFE] shadow-sm">
                  <UserPlus size={16} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#18254D] tracking-tight">New Lead</h3>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-0.5">Lead Details</p>
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 hover:bg-slate-200 rounded-xl text-slate-400 transition-all">
                <X size={18} />
              </button>
            </div>
            {/* FIX: scrollable fields, sticky submit button outside the scroll container */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Lead Name <span className="text-rose-500">*</span></label>
                  <input
                    required type="text" placeholder="e.g. Rahul Sharma"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value.replace(/[^a-zA-Z0-9\s]/g, "") })}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Email <span className="text-rose-500">*</span></label>
                    <input
                      required type="email" placeholder="e.g. rahul@gmail.com"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Phone <span className="text-rose-500">*</span></label>
                    <input
                      required type="tel" placeholder="e.g. 9876543210"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, "") })}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <SearchableDropdown
                    label={<span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Country Code <span className="text-rose-500">*</span></span>}
                    options={countries.map((c) => ({ name: `${c.name} (${c.code})`, value: c.code, code: c.code }))}
                    value={formData.countryCode}
                    onChange={(val) => {
                      const selectedCountry = countries.find(c => c.code === val);
                      setFormData({ ...formData, country: selectedCountry ? selectedCountry.name : "", countryCode: selectedCountry ? selectedCountry.code : val });
                    }}
                    placeholder="Select Country Code"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Website URL (Optional)</label>
                  <input
                    type="text" placeholder="e.g. www.company.com"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200"
                    value={formData.website || ""}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Lead Status <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <button type="button" onClick={() => setIsAddStatusDropdownOpen(!isAddStatusDropdownOpen)} className="w-full h-10 flex items-center justify-between px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold shadow-sm hover:border-[#18254D]/30 transition-all text-[#18254D]">
                      <span className={formData.leadType ? "text-[#18254D]" : "text-slate-400 font-medium"}>{formData.leadType || "Select Status"}</span>
                      <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isAddStatusDropdownOpen ? "rotate-180" : ""}`} />
                    </button>
                    {isAddStatusDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-[80]" onClick={() => setIsAddStatusDropdownOpen(false)} />
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden z-[90] animate-pop origin-top">
                          <div className="bg-[#18254D] px-4 py-2.5 border-b border-white/10">
                            <p className="text-[10px] font-bold text-white/50 tracking-wider uppercase">Select Status</p>
                          </div>
                          {["Hot", "Warm", "Cold"].map((status) => (
                            <button key={status} type="button" onClick={() => { setFormData({ ...formData, leadType: status }); setIsAddStatusDropdownOpen(false); }} className={`w-full text-left px-4 py-2.5 text-xs font-semibold tracking-wider transition-colors ${formData.leadType === status ? "bg-indigo-50 text-indigo-700" : "text-[#18254D] hover:bg-slate-50"}`}>
                              <div className="flex items-center gap-2">
                                {status === "Hot" && <Flame size={12} className="text-[#F43F5E]" />}
                                {status === "Warm" && <Sun size={12} className="text-[#F97316]" />}
                                {status === "Cold" && <Snowflake size={12} className="text-[#3B82F6]" />}
                                <span>{status}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Note / Message</label>
                  <textarea
                    rows={3} placeholder="e.g. Interested in cloud migration services..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200 resize-none"
                    value={formData.notes || formData.industry}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value, industry: e.target.value })}
                  />
                </div>
              </div>
              {/* Sticky submit — always visible regardless of scroll position */}
              <div className="shrink-0 p-6 pt-4 border-t border-slate-100 bg-white">
                <button type="submit" disabled={isSubmitting} className="w-full h-12 bg-[#18254D] text-white rounded-xl text-xs font-bold tracking-wider shadow-lg active:scale-[0.97] transition-all hover:bg-[#1e2e5e] hover:shadow-xl flex items-center justify-center gap-2 group/btn disabled:opacity-70 disabled:cursor-not-allowed btn-animated">
                  {isSubmitting ? (<><span>Adding Lead...</span><Loader2 size={16} className="animate-spin" /></>) : (<><span>Add Lead</span><Send size={14} strokeWidth={2.5} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" /></>)}
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
          <div className="relative z-10 bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-pop flex flex-col max-h-[90dvh]">
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
            {/* FIX: sticky submit button outside the scroll area */}
            <form onSubmit={handleOnboardSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="p-6 space-y-5 overflow-y-auto flex-1">
                {/* Client Type */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Client Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    {["New", "Existing"].map((type) => (
                      <label key={type} className={`flex items-center gap-3 p-3.5 bg-white border-2 rounded-xl cursor-pointer transition-all shadow-sm ${onboardingData.clientType === type ? "border-[#18254D]" : "border-slate-200 hover:border-slate-300"}`} onClick={() => { setOnboardingData({ ...onboardingData, clientType: type }); if (type === "New") { setSelectedExistingClientId(null); setExistingClientSearch(""); } }}>
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

                {/* Existing Client Dropdown */}
                {onboardingData.clientType === "Existing" && (
                  <div className="space-y-3">
                    <div className="space-y-1.5 relative">
                      <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Client Name <span className="text-rose-500">*</span></label>
                      <div className="relative">
                        <input
                          type="text" placeholder="Search existing clients..."
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200"
                          value={existingClientSearch}
                          onChange={(e) => { setExistingClientSearch(e.target.value); setIsExistingClientDropdownOpen(true); if (!e.target.value) setSelectedExistingClientId(null); }}
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
                              {clients.filter((c) => c.status === "Active" && (!existingClientSearch || c.name?.toLowerCase().includes(existingClientSearch.toLowerCase()) || c.company?.toLowerCase().includes(existingClientSearch.toLowerCase()) || c.email?.toLowerCase().includes(existingClientSearch.toLowerCase()))).map((client) => (
                                <button key={`onboard-client-sel-${client.id}`} type="button" onClick={() => { setSelectedExistingClientId(client.id); setExistingClientSearch(client.name); setIsExistingClientDropdownOpen(false); setOnboardingData((prev) => ({ ...prev, organisationName: client.company || "", country: client.country || "", state: client.state || "", currency: client.currency || "INR", clientStatus: client.status || "Active", projectCategory: client.projectCategory || 1 })); }} className={`w-full text-left px-4 py-3 transition-colors ${selectedExistingClientId === client.id ? "bg-slate-100 border-l-4 border-[#18254D]" : "hover:bg-slate-50"}`}>
                                  <p className="text-[13px] font-bold text-[#18254D]">{client.name}</p>
                                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">{client.email}{client.company ? ` · ${client.company}` : ""}</p>
                                </button>
                              ))}
                              {clients.filter((c) => c.status === "Active" && (!existingClientSearch || c.name?.toLowerCase().includes(existingClientSearch.toLowerCase()))).length === 0 && (
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
                      <SearchableDropdown label={<span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Client Country <span className="text-rose-500">*</span></span>} required options={countries.map((c) => ({ name: c.name, value: c.name, code: c.code }))} value={onboardingData.country} onChange={(val) => { const selectedCountry = countries.find(c => c.name === val || c.code === val); const countryCurrency = countryToCurrency[val] || (selectedCountry ? countryToCurrency[selectedCountry.name] : null); setOnboardingData({ ...onboardingData, country: selectedCountry ? selectedCountry.name : val, currency: countryCurrency ? countryCurrency.code : onboardingData.currency, state: "" }); }} placeholder="Select Country" />
                      {countryToStates[onboardingData.country] ? (
                        <SearchableDropdown label={<span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Client State <span className="text-rose-500">*</span></span>} required options={countryToStates[onboardingData.country]} value={onboardingData.state} onChange={(val) => setOnboardingData({ ...onboardingData, state: val })} placeholder="Select State" />
                      ) : (
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Client State <span className="text-rose-500">*</span></label>
                          <input type="text" placeholder="e.g. State/Province" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200" value={onboardingData.state} onChange={(e) => setOnboardingData({ ...onboardingData, state: e.target.value })} />
                        </div>
                      )}
                      <SearchableDropdown label={<span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Client Currency <span className="text-rose-500">*</span></span>} required options={commonCurrencies.map((c) => ({ name: `${c.code} (${c.symbol})`, code: c.code }))} value={onboardingData.currency} onChange={(val) => setOnboardingData({ ...onboardingData, currency: val })} placeholder="Select Currency" />
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
                      <textarea rows={3} placeholder="e.g. Focus on UI/UX redesign and performance optimization..." className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200 resize-none" value={onboardingData.projectDescription} onChange={(e) => setOnboardingData({ ...onboardingData, projectDescription: e.target.value })} />
                    </div>
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
                                <button key={`onboard-cat-${catId}`} type="button" onClick={() => { setOnboardingData({ ...onboardingData, projectCategory: catId }); setIsOnboardCategoryDropdownOpen(false); }} className={`w-full text-left px-4 py-2.5 text-xs font-semibold tracking-wider transition-colors ${onboardingData.projectCategory === catId ? "bg-indigo-50 text-indigo-700" : "text-[#18254D] hover:bg-slate-50"}`}>{CATEGORY_MAP[catId]}</button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
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
                    <div className="col-span-2 space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Project Budget ({onboardingData.currency || "INR"}) <span className="text-rose-500">*</span></label>
                      <div className="relative">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{commonCurrencies.find((c) => c.code === onboardingData.currency)?.symbol || "₹"}</div>
                        <input type="text" placeholder={onboardingData.currency === "USD" ? "e.g. 5,000" : "e.g. 5,00,000"} className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200" value={formatBudget(onboardingData.projectBudget, onboardingData.currency)} onChange={(e) => setOnboardingData({ ...onboardingData, projectBudget: parseBudget(e.target.value) })} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Onboarding Date <span className="text-rose-500">*</span></label>
                      <DatePicker value={onboardingData.onboardingDate} onChange={(val) => setOnboardingData({ ...onboardingData, onboardingDate: val })} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Deadline (Tentative) <span className="text-rose-500">*</span></label>
                      <DatePicker value={onboardingData.deadline} onChange={(val) => setOnboardingData({ ...onboardingData, deadline: val })} />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Scope Document <span className="text-rose-500">*</span></label>
                      <div className="relative group">
                        <input required type="file" accept="application/pdf" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={(e) => { const file = e.target.files[0]; if (file) { if (file.type !== "application/pdf") { toast.error("Please upload only PDF documents."); e.target.value = ""; return; } setOnboardingData({ ...onboardingData, scopeDocument: file }); } }} />
                        <div className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl group-hover:border-[#18254D]/30 group-hover:bg-white transition-all flex items-center gap-3">
                          <div className="p-2 bg-white border border-slate-200 rounded-lg shadow-sm shrink-0"><Upload size={16} className="text-slate-500" /></div>
                          <span className={`text-sm font-semibold truncate ${onboardingData.scopeDocument ? "text-[#18254D]" : "text-slate-400"}`}>
                            {onboardingData.scopeDocument instanceof File ? onboardingData.scopeDocument.name : typeof onboardingData.scopeDocument === "string" && onboardingData.scopeDocument ? onboardingData.scopeDocument : "Upload scope document (PDF)"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Sticky submit */}
              <div className="shrink-0 p-6 pt-4 border-t border-slate-100 bg-white">
                <button type="submit" disabled={isSubmitting} className="w-full h-12 bg-[#18254D] text-white rounded-xl text-xs font-bold tracking-wider shadow-lg active:scale-[0.97] transition-all hover:bg-[#1e2e5e] hover:shadow-xl flex items-center justify-center gap-2 group/btn disabled:opacity-70 disabled:cursor-not-allowed btn-animated">
                  {isSubmitting ? (<><span>Converting...</span><Loader2 size={16} className="animate-spin" /></>) : (<><UserCheck size={14} strokeWidth={2.5} className="group-hover/btn:translate-x-0.5 transition-transform" /><span>Convert to Client</span></>)}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── EDIT LEAD MODAL ── */}
      {showEditModal && editingLead && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[99999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="absolute inset-0" onClick={() => { setShowEditModal(false); setEditingLead(null); }} />
          <div className="relative z-10 bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-pop flex flex-col max-h-[90dvh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center border border-blue-100 shadow-sm">
                  <Pencil size={16} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#18254D] tracking-tight">Edit Lead</h3>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-0.5">Update Details</p>
                </div>
              </div>
              <button onClick={() => { setShowEditModal(false); setEditingLead(null); }} className="p-1.5 hover:bg-slate-200 rounded-xl text-slate-400 transition-all">
                <X size={18} />
              </button>
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
                if (onEditLead && editingLead) {
                  try {
                    await onEditLead(editingLead.lead_id, { name: editFormData.name, email: editFormData.email, phone: editFormData.phone, countryCode: editFormData.countryCode, country: editFormData.country, leadType: editFormData.leadType, notes: editFormData.notes, website: editFormData.website });
                    setShowEditModal(false);
                    setEditingLead(null);
                  } catch (error) {
                    console.error("Failed to update lead:", error);
                    toast.error("Failed to update lead. Please try again.");
                  }
                }
              }}
              className="flex flex-col flex-1 min-h-0"
            >
              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Full Name <span className="text-rose-500">*</span></label>
                  <input required type="text" placeholder="e.g. John Doe" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200" value={editFormData.name} onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Email <span className="text-rose-500">*</span></label>
                  <input required type="email" placeholder="e.g. john@gmail.com" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200" value={editFormData.email} onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Country Code <span className="text-rose-500">*</span></label>
                    <SearchableDropdown
                      options={countries.map((c) => ({ name: `${c.name} (${c.code})`, value: c.code, code: c.code }))}
                      value={editFormData.countryCode}
                      onChange={(val) => {
                        const selectedCountry = countries.find((c) => c.code === val);
                        setEditFormData({
                          ...editFormData,
                          countryCode: selectedCountry ? selectedCountry.code : val,
                          country: selectedCountry ? selectedCountry.name : editFormData.country,
                        });
                      }}
                      placeholder="Search country..."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Phone Number <span className="text-rose-500">*</span></label>
                    <input required type="tel" placeholder="e.g. 9876543210" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200" value={editFormData.phone} onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value.replace(/\D/g, "") })} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Website URL (Optional)</label>
                  <input type="text" placeholder="e.g. www.company.com" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200" value={editFormData.website} onChange={(e) => setEditFormData({ ...editFormData, website: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Lead Status</label>
                  {editingLead?.status === "Converted" ? (
                    <div className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between cursor-not-allowed opacity-70">
                      <span className="text-sm font-semibold text-[#18254D]">{editFormData.leadType || "Converted"}</span>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Locked</span>
                    </div>
                  ) : (
                    <div className="relative">
                      <button type="button" onClick={() => setIsEditLeadStatusDropdownOpen(!isEditLeadStatusDropdownOpen)} className="w-full h-10 flex items-center justify-between px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold shadow-sm hover:border-[#18254D]/30 transition-all text-[#18254D]">
                        <span className={editFormData.leadType ? "text-[#18254D]" : "text-slate-400 font-medium"}>{editFormData.leadType || "Select Lead Status"}</span>
                        <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isEditLeadStatusDropdownOpen ? "rotate-180" : ""}`} />
                      </button>
                      {isEditLeadStatusDropdownOpen && (
                        <>
                          <div className="fixed inset-0 z-[80]" onClick={() => setIsEditLeadStatusDropdownOpen(false)} />
                          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden z-[90] animate-pop origin-top">
                            <div className="bg-[#18254D] px-4 py-2.5 border-b border-white/10"><p className="text-[10px] font-bold text-white/50 tracking-wider uppercase">Select Status</p></div>
                            {["Hot", "Warm", "Cold"].map((status) => (
                              <button key={`edit-lead-status-${status}`} type="button" onClick={() => { setEditFormData({ ...editFormData, leadType: status }); setIsEditLeadStatusDropdownOpen(false); }} className={`w-full text-left px-4 py-2.5 text-xs font-semibold tracking-wider transition-colors flex items-center gap-2 ${editFormData.leadType === status ? "bg-indigo-50 text-indigo-700" : "text-[#18254D] hover:bg-slate-50"}`}>
                                {status === "Hot" && <Flame size={12} className="text-[#F43F5E]" />}
                                {status === "Warm" && <Sun size={12} className="text-[#F97316]" />}
                                {status === "Cold" && <Snowflake size={12} className="text-[#3B82F6]" />}
                                <span>{status}</span>
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Note / Message</label>
                  <textarea rows={3} placeholder="e.g. Interested in cloud migration services..." className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200 resize-none" value={editFormData.notes} onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })} />
                </div>
              </div>
              {/* Sticky submit */}
              <div className="shrink-0 p-6 pt-4 border-t border-slate-100 bg-white">
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

      {/* ── EDIT CONVERTED LEAD MODAL ── */}
      {showEditConvertedModal && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[99999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="absolute inset-0" onClick={() => setShowEditConvertedModal(false)} />
          <div className="relative z-10 bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-pop flex flex-col max-h-[90dvh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center border border-blue-100 shadow-sm">
                  <Pencil size={16} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#18254D] tracking-tight">Edit Lead</h3>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-0.5">Lead Details</p>
                </div>
              </div>
              <button onClick={() => setShowEditConvertedModal(false)} className="p-1.5 hover:bg-slate-200 rounded-xl text-slate-400 transition-all">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleEditConvertedSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Full Name</label>
                  <input required type="text" placeholder="e.g. Rahul Sharma" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200" value={editConvertedData.name} onChange={(e) => setEditConvertedData({ ...editConvertedData, name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Email</label>
                  <input required type="email" placeholder="e.g. rahul@gmail.com" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200" value={editConvertedData.email} onChange={(e) => setEditConvertedData({ ...editConvertedData, email: e.target.value })} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Country Code</label>
                    <SearchableDropdown options={Array.from(new Set(countries.map(c => c.name))).map(name => { const c = countries.find(country => country.name === name); return { name: `${c.name} (${c.code})`, label: c.code, value: c.code, code: c.code }; })} value={editConvertedData.countryCode} onChange={(val) => { const countryObj = countries.find((c) => c.code === val || c.name === val); setEditConvertedData({ ...editConvertedData, countryCode: countryObj ? countryObj.code : val, country: countryObj ? countryObj.name : editConvertedData.country }); }} placeholder="Select Code" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Phone Number</label>
                    <input required type="tel" placeholder="e.g. 9876543210" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200" value={editConvertedData.phone} onChange={(e) => setEditConvertedData({ ...editConvertedData, phone: e.target.value.replace(/\D/g, "") })} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Website URL (Optional)</label>
                  <input type="text" placeholder="e.g. www.company.com" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200" value={editConvertedData.website} onChange={(e) => setEditConvertedData({ ...editConvertedData, website: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Lead Status</label>
                  <div className="relative">
                    <button type="button" onClick={() => setIsEditStatusDropdownOpen(!isEditStatusDropdownOpen)} className="w-full h-10 flex items-center justify-between px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold shadow-sm hover:border-[#18254D]/30 transition-all text-[#18254D]">
                      <span className={editConvertedData.leadType ? "text-[#18254D]" : "text-slate-400 font-medium"}>{editConvertedData.leadType || "Select Status"}</span>
                      <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isEditStatusDropdownOpen ? "rotate-180" : ""}`} />
                    </button>
                    {isEditStatusDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-[80]" onClick={() => setIsEditStatusDropdownOpen(false)} />
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden z-[90] animate-pop origin-top edit-status-dropdown">
                          <div className="bg-[#18254D] px-4 py-2.5 border-b border-white/10"><p className="text-[10px] font-bold text-white/50 tracking-wider uppercase">Select Status</p></div>
                          {["Hot", "Warm", "Cold", "Converted"].map((status) => (
                            <button key={`edit-status-${status}`} type="button" onClick={() => { setEditConvertedData({ ...editConvertedData, leadType: status }); setIsEditStatusDropdownOpen(false); }} className={`w-full text-left px-4 py-2.5 text-xs font-semibold tracking-wider transition-colors flex items-center gap-2 ${editConvertedData.leadType === status ? "bg-indigo-50 text-indigo-700" : "text-[#18254D] hover:bg-slate-50"}`}>
                              {status === "Hot" && <Flame size={12} className="text-[#F43F5E]" />}
                              {status === "Warm" && <Sun size={12} className="text-[#F97316]" />}
                              {status === "Cold" && <Snowflake size={12} className="text-[#3B82F6]" />}
                              {status === "Converted" && <UserCheck size={12} className="text-[#10B981]" />}
                              <span>{status}</span>
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Message</label>
                  <textarea rows={3} placeholder="e.g. Interested in cloud migration services..." className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200 resize-none" value={editConvertedData.projectDescription} onChange={(e) => setEditConvertedData({ ...editConvertedData, projectDescription: e.target.value })} />
                </div>
              </div>
              {/* Sticky submit */}
              <div className="shrink-0 p-6 pt-4 border-t border-slate-100 bg-white">
                <button type="submit" disabled={isSubmitting} className="w-full h-12 bg-[#18254D] text-white rounded-xl text-xs font-bold tracking-wider shadow-lg active:scale-[0.97] transition-all hover:bg-[#1e2e5e] hover:shadow-xl flex items-center justify-center gap-2 group/btn disabled:opacity-70 disabled:cursor-not-allowed btn-animated">
                  {isSubmitting ? (<><span>Saving Changes...</span><Loader2 size={16} className="animate-spin" /></>) : (<><Send size={14} strokeWidth={2.5} className="rotate-[-45deg]" /><span>Save Changes</span></>)}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── FOLLOW UP MODAL ── */}
      {showFollowUpModal && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[99999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="absolute inset-0" onClick={resetFollowUpModal} />
          <div className="relative z-10 bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-pop flex flex-col max-h-[90dvh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center border border-indigo-100 shadow-sm">
                  <BellRing size={16} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#18254D] tracking-tight">Follow Up</h3>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-0.5">{followUpLeadName}</p>
                </div>
              </div>
              <button onClick={resetFollowUpModal} className="p-1.5 hover:bg-slate-200 rounded-xl text-slate-400 transition-all">
                <X size={18} />
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const isValid = validateForm(followUpData, {
                  title: { required: true, minLength: 2, label: "Task Title" },
                  description: { required: true, minLength: 2, label: "Description" },
                  followup_date: { required: true, label: "Follow-up Date" },
                  timeHour: { required: true, label: "Follow-up Hour" },
                  timeMinute: { required: true, label: "Follow-up Minute" },
                  timePeriod: { required: true, label: "Follow-up Period" },
                  priority: { required: true, label: "Priority" },
                  followup_mode: { required: true, label: "Follow-up Mode" },
                  followup_status: { required: true, label: "Follow-up Status" },
                });
                if (!isValid || !followUpLeadId) return;
                let hour = parseInt(followUpData.timeHour || "12", 10);
                if ((followUpData.timePeriod || "PM").toUpperCase() === "PM" && hour < 12) hour += 12;
                if ((followUpData.timePeriod || "PM").toUpperCase() === "AM" && hour === 12) hour = 0;
                const combinedDateTime = `${followUpData.followup_date} ${hour.toString().padStart(2, "0")}:${(followUpData.timeMinute || "00").padStart(2, "0")}:00`;
                const formattedStatus = followUpData.followup_status.charAt(0).toUpperCase() + followUpData.followup_status.slice(1).toLowerCase();
                const payload = {
                  clientId: followUpLeadId,
                  title: followUpData.title,
                  description: followUpData.description,
                  followup_date: combinedDateTime,
                  priority: followUpData.priority,
                  followup_mode: followUpData.followup_mode,
                  followup_status: formattedStatus,
                  follow_brief: followUpData.follow_brief || "",
                  completed_by: followUpData.completed_by || (formattedStatus === "Completed" ? JSON.parse(localStorage.getItem("user") || "{}").full_name || "System" : ""),
                  completionDate: followUpData.completionDate || "",
                  completionHour: followUpData.completionHour || "",
                  completionMinute: followUpData.completionMinute || "",
                  completionPeriod: followUpData.completionPeriod || "",
                };
                if (onAddFollowUp) await onAddFollowUp(payload);
                resetFollowUpModal();
              }}
              className="flex flex-col flex-1 min-h-0"
            >
              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                {/* Lead Name (read-only) */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Lead Name</label>
                  <div className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-semibold text-slate-500 cursor-not-allowed">{followUpLeadName || "—"}</div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Task Title <span className="text-rose-500">*</span></label>
                  <input required type="text" placeholder="e.g. Discuss project scope" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200" value={followUpData.title} onChange={(e) => setFollowUpData({ ...followUpData, title: e.target.value })} />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Description <span className="text-rose-500">*</span></label>
                  <textarea required rows={3} placeholder="Add details about your follow-up..." className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200 resize-none" value={followUpData.description} onChange={(e) => setFollowUpData({ ...followUpData, description: e.target.value })} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Follow-up Date <span className="text-rose-500">*</span></label>
                    <DatePicker value={followUpData.followup_date} onChange={(val) => setFollowUpData({ ...followUpData, followup_date: val })} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Follow-up Time <span className="text-rose-500">*</span></label>
                    <div className="flex gap-2">
                      <select className="flex-1 min-w-0 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] focus:outline-none focus:ring-4 focus:ring-[#18254D]/5 focus:border-[#18254D]/30" value={followUpData.timeHour} onChange={(e) => setFollowUpData({ ...followUpData, timeHour: e.target.value })}>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (<option key={`lead-follow-hour-${h}`} value={String(h).padStart(2, "0")}>{String(h).padStart(2, "0")}</option>))}
                      </select>
                      <select className="flex-1 min-w-0 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] focus:outline-none focus:ring-4 focus:ring-[#18254D]/5 focus:border-[#18254D]/30" value={followUpData.timeMinute || "00"} onChange={(e) => setFollowUpData({ ...followUpData, timeMinute: e.target.value })}>
                        {Array.from({ length: 60 }, (_, i) => i).map((m) => (<option key={`lead-follow-min-${m}`} value={String(m).padStart(2, "0")}>{String(m).padStart(2, "0")}</option>))}
                      </select>
                      <select className="w-16 shrink-0 px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] focus:outline-none focus:ring-4 focus:ring-[#18254D]/5 focus:border-[#18254D]/30" value={(followUpData.timePeriod || "PM").toUpperCase()} onChange={(e) => setFollowUpData({ ...followUpData, timePeriod: e.target.value })}>
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Priority <span className="text-rose-500">*</span></label>
                    <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] focus:outline-none focus:ring-4 focus:ring-[#18254D]/5 focus:border-[#18254D]/30 transition-all" value={followUpData.priority} onChange={(e) => setFollowUpData({ ...followUpData, priority: e.target.value })}>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Follow-up Mode <span className="text-rose-500">*</span></label>
                    <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] focus:outline-none focus:ring-4 focus:ring-[#18254D]/5 focus:border-[#18254D]/30 transition-all" value={followUpData.followup_mode} onChange={(e) => setFollowUpData({ ...followUpData, followup_mode: e.target.value })}>
                      <option value="Call">Call</option>
                      <option value="Email">Email</option>
                      <option value="Meeting">Meeting</option>
                      <option value="Whatsapp">Whatsapp</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Follow-up Status <span className="text-rose-500">*</span></label>
                  <select
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] focus:outline-none focus:ring-4 focus:ring-[#18254D]/5 focus:border-[#18254D]/30 transition-all"
                    value={followUpData.followup_status}
                    onChange={(e) => {
                      const status = e.target.value;
                      const updates = { followup_status: status };
                      if (status === "Completed") {
                        const user = JSON.parse(localStorage.getItem("user") || "{}");
                        if (!followUpData.completed_by) updates.completed_by = user.full_name || "";
                        if (!followUpData.completionDate) updates.completionDate = new Date().toISOString().split("T")[0];
                        if (!followUpData.completionHour) {
                          const now = new Date();
                          updates.completionHour = (now.getHours() % 12 || 12).toString();
                          updates.completionMinute = now.getMinutes().toString().padStart(2, "0");
                          updates.completionPeriod = now.getHours() >= 12 ? "PM" : "AM";
                        }
                      }
                      setFollowUpData({ ...followUpData, ...updates });
                    }}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                {followUpData.followup_status === "Completed" && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Follow Conclusion Brief</label>
                      <textarea rows={3} placeholder="Update the conclusion brief..." className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200 resize-none" value={followUpData.follow_brief || ""} onChange={(e) => setFollowUpData({ ...followUpData, follow_brief: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Completed By</label>
                      <input type="text" placeholder="e.g. John Doe" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200" value={followUpData.completed_by || ""} onChange={(e) => setFollowUpData({ ...followUpData, completed_by: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Completion Date</label>
                        <DatePicker value={followUpData.completionDate} onChange={(val) => setFollowUpData({ ...followUpData, completionDate: val })} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Completion Time</label>
                        <div className="flex gap-2">
                          <select className="flex-1 min-w-0 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] focus:outline-none focus:ring-4 focus:ring-[#18254D]/5 focus:border-[#18254D]/30" value={followUpData.completionHour} onChange={(e) => setFollowUpData({ ...followUpData, completionHour: e.target.value })}>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (<option key={`comp-hour-${h}`} value={String(h).padStart(2, "0")}>{String(h).padStart(2, "0")}</option>))}
                          </select>
                          <select className="flex-1 min-w-0 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] focus:outline-none focus:ring-4 focus:ring-[#18254D]/5 focus:border-[#18254D]/30" value={followUpData.completionMinute} onChange={(e) => setFollowUpData({ ...followUpData, completionMinute: e.target.value })}>
                            {Array.from({ length: 60 }, (_, i) => i).map((m) => (<option key={`comp-min-${m}`} value={String(m).padStart(2, "0")}>{String(m).padStart(2, "0")}</option>))}
                          </select>
                          <select className="w-16 shrink-0 px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] focus:outline-none focus:ring-4 focus:ring-[#18254D]/5 focus:border-[#18254D]/30" value={followUpData.completionPeriod} onChange={(e) => setFollowUpData({ ...followUpData, completionPeriod: e.target.value })}>
                            <option value="AM">AM</option>
                            <option value="PM">PM</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
              {/* Sticky submit */}
              <div className="shrink-0 p-6 pt-4 border-t border-slate-100 bg-white">
                <button type="submit" className="w-full h-12 bg-[#18254D] text-white rounded-xl text-xs font-bold tracking-wider shadow-lg active:scale-[0.97] transition-all hover:bg-[#1e2e5e] hover:shadow-xl flex items-center justify-center gap-2 btn-animated">
                  <BellRing size={14} strokeWidth={2.5} />
                  Create Follow-up
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── DELETE CONFIRMATION MODAL ── */}
      {showDeleteModal && leadToDelete && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[99999] flex items-center justify-center p-4">
          <div className="absolute inset-0" onClick={() => { setShowDeleteModal(false); setLeadToDelete(null); }} />
          <div className="relative z-10 bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-pop flex flex-col max-h-[90dvh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#FFF1F2] text-[#F43F5E] rounded-xl flex items-center justify-center border border-[#FFE4E6] shadow-sm">
                  <AlertTriangle size={16} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#18254D] tracking-tight">Confirm Deletion</h3>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-0.5">This action cannot be undone</p>
                </div>
              </div>
              <button onClick={() => { setShowDeleteModal(false); setLeadToDelete(null); }} className="p-1.5 hover:bg-slate-200 rounded-xl text-slate-400 transition-all">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <p className="text-slate-600 text-sm font-semibold leading-relaxed">
                Are you sure you want to <span className="text-[#F43F5E] font-bold underline underline-offset-4">permanently delete</span> the lead <span className="text-[#18254D] font-bold">"{leadToDelete.name}"</span>? All associated data will be removed.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button type="button" onClick={() => { setShowDeleteModal(false); setLeadToDelete(null); }} className="flex-1 h-12 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold tracking-wider hover:bg-slate-200 transition-all active:scale-[0.98] btn-animated">
                  Cancel
                </button>
                <button type="button" onClick={() => { if (onDeleteLead && leadToDelete) onDeleteLead(leadToDelete.lead_id); setShowDeleteModal(false); setLeadToDelete(null); }} className="flex-1 h-12 bg-[#F43F5E] text-white rounded-xl text-xs font-bold tracking-wider shadow-md hover:bg-[#E11D48] transition-all active:scale-[0.98] flex items-center justify-center gap-2 btn-animated">
                  <Trash2 size={14} /> Delete Lead
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default LeadList;