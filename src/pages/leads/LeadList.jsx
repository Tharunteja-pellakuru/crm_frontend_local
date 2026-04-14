import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { createPortal } from "react-dom";
import { useScrollLock } from "../../hooks/useScrollLock";
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
  MessageSquare,
  Clock,
  Calendar,
  Zap,
  Check,
  Pencil,
  AlertTriangle,
  User,
} from "lucide-react";
import DatePicker from "../../components/ui/DatePicker";
import { countries } from "../../utils/countries";
import {
  indianStates,
  commonCurrencies,
  countryToCurrency,
} from "../../utils/locationData";
import { formatBudget, parseBudget } from "../../utils/formatters";
import SearchableDropdown from "../../components/common/SearchableDropdown";
import { validateForm, EMAIL_PATTERN } from "../../utils/validation";
import {
  CATEGORY_MAP,
  REVERSE_CATEGORY_MAP,
} from "../../constants/categoryConstants";
import { extractCountryAndPhone } from "../../utils/leadUtils";

const LeadList = ({
  leads,
  loading = false,
  onSelectLead,
  onAddLead,
  onDeleteLead,
  onOnboardLead,
  onDismissLead,
  onRestoreLead,
  onAddActivity,
  onUpdateConvertedLead,
  allLeads = [],
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [leadTypeFilter, setLeadTypeFilter] = useState("All");
  const [isTierDropdownOpen, setIsTierDropdownOpen] = useState(false);
  const [isAddStatusDropdownOpen, setIsAddStatusDropdownOpen] = useState(false);
  const [isEditCategoryDropdownOpen, setIsEditCategoryDropdownOpen] =
    useState(false);
  const [isEditStatusDropdownOpen, setIsEditStatusDropdownOpen] =
    useState(false);

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
      if (
        isTierDropdownOpen ||
        isEditCategoryDropdownOpen ||
        isEditStatusDropdownOpen
      ) {
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
    if (
      isTierDropdownOpen ||
      isEditCategoryDropdownOpen ||
      isEditStatusDropdownOpen
    ) {
      window.addEventListener("scroll", handleScrollResize, true);
      window.addEventListener("resize", handleScrollResize, true);
    }
    return () => {
      window.removeEventListener("scroll", handleScrollResize, true);
      window.removeEventListener("resize", handleScrollResize, true);
    };
  }, [
    isTierDropdownOpen,
    isEditCategoryDropdownOpen,
    isEditStatusDropdownOpen,
  ]);

  const [startDate, setStartDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const RECORDS_PER_PAGE = 10;
  const [endDate, setEndDate] = useState("");
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
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [isPriorityDropdownOpen, setIsPriorityDropdownOpen] = useState(false);
  const [isOnboardStatusDropdownOpen, setIsOnboardStatusDropdownOpen] =
    useState(false);
  const [isOnboardPriorityDropdownOpen, setIsOnboardPriorityDropdownOpen] =
    useState(false);
  const [
    isOnboardClientStatusDropdownOpen,
    setIsOnboardClientStatusDropdownOpen,
  ] = useState(false);
  const [isOnboardCategoryDropdownOpen, setIsOnboardCategoryDropdownOpen] =
    useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [followUpLeadId, setFollowUpLeadId] = useState(null);
  const [showEditConvertedModal, setShowEditConvertedModal] = useState(false);
  const [editingConvertedLeadId, setEditingConvertedLeadId] = useState(null);
  const [editConvertedData, setEditConvertedData] = useState({
    name: "",
    email: "",
    phone: "",
    countryCode: "",
    organisationName: "",
    country: "",
    state: "",
    currency: "",
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
    projectStatus: "In Progress",
    projectCategory: 1,
    projectPriority: "High",
    projectDescription: "",
    projectBudget: "",
    country: "",
    state: "",
    currency: "",
    organisationName: "",
    clientStatus: "Active",
    onboardingDate: new Date().toISOString().split("T")[0],
    deadline: "",
    scopeDocument: null,
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState(null);

  // Lock scroll when any modal is open
  useScrollLock(showAddModal || showOnboardModal || showFollowUpModal || showEditConvertedModal || showDeleteModal);

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
    projectStatus: "Planning",
    projectCategory: 1,
    projectPriority: "Medium",
    projectDescription: "",
    country: "",
    countryCode: "",
  });

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

    console.log("Extracted for editing converted lead:", { phone, dialCode: finalDialCode, name });

    setEditConvertedData({
      name: lead.name,
      email: lead.email,
      phone: phone,
      countryCode: finalDialCode,
      organisationName: lead.client_organisation || lead.organisation_name || lead.company || "",
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
    // Ensure background filters are closed
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
        const result = await onUpdateConvertedLead(
          editingConvertedLeadId,
          editConvertedData,
        );
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
      projectBudget: {
        required: true,
        type: "number",
        label: "Project Budget",
      },
      onboardingDate: { required: true, label: "Onboarding Date" },
      deadline: { required: true, label: "Deadline Date" },
      scopeDocument: { required: true, label: "Scope Document" },
    });

    if (!isValid) return;

    setIsSubmitting(true);
    try {
      if (onOnboardLead && onboardingLeadId) {
        await onOnboardLead(onboardingLeadId, onboardingData);
        setOnboardingLeadId(null);
        setShowOnboardModal(false);

        // Automatically switch to Converted view for Leads
        setLeadView("Converted");

        setOnboardingData({
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
    // Skip invalid leads
    if (!lead || typeof lead !== "object") return false;

    const matchesSearch =
      (lead.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.company || "").toLowerCase().includes(searchTerm.toLowerCase());

    let matchesStatus = filterStatus === "All" || lead.status === filterStatus;
    let matchesLeadType = true;

    // Sub-filter by Lead View (Pending, Converted, Dismissed)
    if (leadView === "Pending") {
      // Show leads that are not converted and not dismissed
      // Hot, Warm, Cold statuses should appear here
      if (lead.isConverted || lead.status === "Dismissed") return false;
    } else if (leadView === "Converted") {
      // Show only converted leads
      if (!lead.isConverted || lead.status === "Dismissed") return false;
    } else if (leadView === "Dismissed") {
      // Show only dismissed leads - strict check
      if (lead.status !== "Dismissed") return false;
    }

    matchesLeadType =
      leadTypeFilter === "All" || lead.leadType === leadTypeFilter;

    // Date Range Filter
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
  });

  const totalPages = Math.ceil(filteredLeads.length / RECORDS_PER_PAGE);
  const currentLeads = filteredLeads.slice(
    (currentPage - 1) * RECORDS_PER_PAGE,
    currentPage * RECORDS_PER_PAGE,
  );

  const renderContactDetails = (lead) => {
    if (!lead.phone && !lead.email) return "N/A";

    let countryCode = lead.country_code || "";

    // Ensure countryCode has + prefix if it's just numbers
    if (countryCode && /^\d+$/.test(countryCode)) {
      countryCode = `+${countryCode}`;
    }

    let phone = (lead.phone || "").trim();
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
        {lead.email && (
          <div className="flex items-center gap-2 text-slate-400 mt-1">
            <Mail size={12} />
            <span className="text-[12px] font-bold truncate max-w-[150px]">
              {lead.email}
            </span>
          </div>
        )}
      </div>
    );
  };

  const getStatusBadge = (lead) => {
    // For leads with status "Lead", show their leadType (Hot/Warm/Cold)
    if (lead.status === "Lead" && lead.leadType) {
      switch (lead.leadType) {
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
          // Fallback if leadType exists but doesn't match
          return {
            label: lead.leadType,
            className: "bg-primary/10 text-primary border-primary/20",
            icon: null,
          };
      }
    }

    // For converted leads
    if (lead.isConverted && lead.leadType) {
      switch (lead.leadType) {
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
            label: lead.leadType || "Converted",
            className: "bg-success/10 text-success border-success/20",
            icon: null,
          };
      }
    }

    // For other statuses (Active, Pending, Churned, Inactive, Dismissed)
    switch (lead.status) {
      case "Lead":
        return {
          label: "Lead",
          className: "bg-info/10 text-info border-info/20",
          icon: null,
        };
      case "Converted":
      case "Active":
        return {
          label: "Converted",
          className: "bg-success/10 text-success border-success/20",
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
          label: lead.status,
          className: "bg-slate-100 text-slate-700 border-slate-200",
          icon: null,
        };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const isValid = validateForm(formData, {
      name: {
        required: true,
        minLength: 2,
        label: "Full Name",
        pattern: /^[a-zA-Z\s]+$/,
        errorMessage: "Full Name must contain only alphabets.",
      },
      email: {
        required: true,
        pattern: EMAIL_PATTERN,
        label: "Email",
        errorMessage:
          "Enter a valid email (e.g. john@gmail.com, john@yahoo.com).",
      },
      phone: {
        required: true,
        minLength: 10,
        label: "Phone Number",
        pattern: /^\d+$/,
        errorMessage: "Phone Number must be at least 10 digits.",
      },
      countryCode: { required: true, label: "Country Code" },
      leadType: { required: true, label: "Lead Status" },
    });

    if (!isValid) return;

    setIsSubmitting(true);
    try {
      if (onAddLead) {
        const submissionData = {
          ...formData,
          company: formData.company || "",
          industry: formData.industry || "Unknown",
        };
        await onAddLead(submissionData);
        setShowAddModal(false);
        setFormData({
          name: "",
          company: "",
          email: "",
          phone: "",
          status: "Lead",
          leadType: "Hot",
          industry: "",
          notes: "",
          projectName: "",
          projectStatus: "Planning",
          projectCategory: 1, // Changed to numeric ID
          projectPriority: "Medium",
          projectDescription: "",
          country: "",
          countryCode: "",
        });
        toast.success("Lead added successfully!");
      }
    } catch (error) {
      toast.error("Failed to add lead.");
      console.error("Failed to add lead:", error);
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
          <p className="text-sm text-slate-500">Loading leads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full relative">
      <div className="space-y-5 animate-fade-in w-full">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="max-w-2xl">
            <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-primary tracking-tight mb-2">
              Leads
            </h2>
            <p className="text-xs md:text-sm text-textMuted font-medium leading-relaxed">
              Manage your network of leads and strategic partnerships.
            </p>
          </div>
          <div className="w-full lg:w-auto">
            <button
              onClick={() => setShowAddModal(true)}
              className="w-full lg:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-2xl hover:bg-slate-800 transition-all text-[13px] font-bold  tracking-wider shadow-lg active:scale-95 group"
            >
              <Plus
                size={16}
                strokeWidth={2.5}
                className="group-hover:rotate-90 transition-transform"
              />
              Add Lead
            </button>
          </div>
        </div>

        {/* Control Bar */}
        <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:flex gap-2 w-full items-center">
            {/* 1. Search Bar */}
            <div className="relative md:col-span-2 xl:flex-[1.5]">
              <Search
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder={`Search leads...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-[38px] pl-11 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-secondary/10 focus:border-secondary transition-all"
              />
            </div>

            {leadView !== "Converted" && leadView !== "Dismissed" && (
              <div className="col-span-1 xl:flex-1 relative z-50">
                <button
                  ref={tierButtonRef}
                  onClick={() => setIsTierDropdownOpen(!isTierDropdownOpen)}
                  className="w-full h-[38px] flex items-center justify-between gap-3 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[12px] font-bold  tracking-widest text-[#18254D] hover:bg-white hover:border-slate-200 transition-all shadow-sm shadow-slate-200/50 group"
                >
                  <span>
                    {leadTypeFilter === "All"
                      ? "All Lead Status"
                      : leadTypeFilter}
                  </span>
                  <ChevronDown
                    size={16}
                    strokeWidth={2.5}
                    className={`transition-transform duration-300 ${isTierDropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {isTierDropdownOpen &&
                  createPortal(
                    <>
                      <div
                        className="fixed inset-0 z-[9998]"
                        onClick={() => setIsTierDropdownOpen(false)}
                      />
                      <div
                        className="tier-dropdown bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden z-[9999] animate-fade-in-up origin-top"
                        style={tierDropdownStyle}
                      >
                        {["All", "Hot", "Warm", "Cold"].map((tier) => (
                          <button
                            key={tier}
                            onClick={() => {
                              setLeadTypeFilter(tier);
                              setIsTierDropdownOpen(false);
                            }}
                            className={`w-full text-left px-5 py-4 text-[12px] font-bold  tracking-wider transition-colors ${
                              tier === "All"
                                ? "bg-[#18254D] text-white"
                                : leadTypeFilter === tier
                                  ? "bg-secondary/10 text-secondary border-l-4 border-secondary"
                                  : "text-[#18254D] hover:bg-slate-50"
                            }`}
                          >
                            {tier === "All" ? "All Tiers" : tier}
                          </button>
                        ))}
                      </div>
                    </>,
                    document.body,
                  )}
              </div>
            )}

            {/* Date Filters */}
            <div className="col-span-1 xl:flex-1 relative z-50">
              <DatePicker
                label="From"
                value={startDate}
                onChange={setStartDate}
              />
            </div>

            <div className="col-span-1 lg:flex-1 lg:min-w-[130px] relative z-50">
              <DatePicker label="To" value={endDate} onChange={setEndDate} />
            </div>
          </div>
        </div>

        {/* Lead View Toggles */}
        <div className="flex justify-center my-4 w-full px-1 sm:px-0">
          <div className="relative flex flex-nowrap bg-slate-100/50 p-0.5 rounded-[14px] border border-slate-200 shadow-sm leading-none w-full sm:w-auto items-center gap-0 overflow-hidden">
            {/* Moving Indicator */}
            <div
              className="absolute top-[2px] bottom-[2px] left-[2px] bg-white rounded-[11px] shadow-sm transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] border border-white/20 z-0"
              style={{
                width: "calc(33.333% - 2px)",
                transform: `translateX(${["Pending", "Converted", "Dismissed"].indexOf(leadView) * 100}%)`,
              }}
            />

            {["Pending", "Converted", "Dismissed"].map((view) => {
              const colors = {
                Pending: "text-blue-600",
                Converted: "text-emerald-600",
                Dismissed: "text-rose-600",
              };

              return (
                <button
                  key={view}
                  onClick={() => setLeadView(view)}
                  className={`relative z-10 flex-1 sm:flex-none px-2 sm:px-5 py-2.5 sm:py-2 rounded-xl text-[10px] sm:text-[12px] font-bold tracking-wider transition-all duration-300 flex items-center justify-center min-w-[75px] sm:min-w-[110px] h-[30px] sm:h-[36px] whitespace-nowrap active:scale-95 ${
                    leadView === view
                      ? `${colors[view]} scale-[1.02]`
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {view}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main List */}
        <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden w-full">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-4 text-left text-[12px] font-bold text-slate-400  tracking-widest border-b border-slate-100">
                    Lead Name
                  </th>
                  <th className="px-6 py-4 text-left text-[12px] font-bold text-slate-400  tracking-widest border-b border-slate-100">
                    Contact Details
                  </th>
                  <th className="px-6 py-4 text-left text-[12px] font-bold text-slate-400  tracking-widest border-b border-slate-100">
                    Lead Status
                  </th>
                  <th className="px-6 py-4 text-right text-[12px] font-bold text-slate-400  tracking-widest border-b border-slate-100">
                    Control
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentLeads.map((lead, index) => {
                  const status = getStatusBadge(lead);
                  return (
                      <tr
                        key={lead.lead_id ? `lead-row-${lead.lead_id}` : `lead-row-idx-${index}`}
                        onClick={() =>
                          lead.status !== "Dismissed" && onSelectLead(lead)
                        }
                      className={`group transition-all ${
                        lead.status === "Dismissed"
                          ? "bg-slate-50/30 opacity-80 cursor-default"
                          : "hover:bg-slate-50/50 cursor-pointer"
                      }`}
                      style={{
                        cursor:
                          lead.status !== "Dismissed" ? "pointer" : "default",
                      }}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-6">
                          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-xl border-2 border-slate-50 shadow-lg shrink-0">
                            {lead.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex items-center gap-4">
                            <div className="font-bold text-sm text-primary tracking-tight leading-none group-hover:text-secondary transition-colors">
                              {lead.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {renderContactDetails(lead)}
                      </td>
                      <td className="px-6 py-4">
                        {lead.status === "Lead" ? (
                          <span
                            className={`px-3 py-1 rounded-xl text-[14px] font-bold border flex items-center gap-2 shadow-sm transition-all w-fit ${status.className}`}
                          >
                            {status.icon}
                            {status.label}
                          </span>
                        ) : (
                          <span
                            className={`px-2 py-0.5 rounded-lg text-[14px] font-bold tracking-widest w-fit ${lead.status === "Active" ? "bg-success/10 text-success border border-success/20" : "bg-slate-100 text-slate-400 border border-slate-200"}`}
                          >
                            {lead.status || "Active"}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div
                          className="flex justify-end gap-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {leadView === "Converted" ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditConvertedClick(lead);
                              }}
                              className="p-2.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-blue-500 hover:border-blue-500 hover:bg-blue-50 transition-all active:scale-90 shadow-sm"
                              title="Edit Details"
                            >
                              <Pencil size={18} />
                            </button>
                          ) : (
                            <>
                              {onOnboardLead && lead.status === "Lead" && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOnboardingLeadId(lead.lead_id);
                                    const initialCountry = lead.country || "";
                                    const countryCurrency = countryToCurrency[initialCountry]?.code || "";
                                    
                                    setOnboardingData({
                                      name: lead.name,
                                      email: lead.email,
                                      phone: lead.phone,
                                      organisationName: lead.company || "",
                                      country: initialCountry,
                                      state: lead.state || "",
                                      website: lead.website || "",
                                      clientType: "New",
                                      status: "Active",
                                      projectName: "",
                                      projectCategory: lead.projectCategory || 1,
                                      projectPriority: "High",
                                      projectDescription: "",
                                      onboardingDate: new Date()
                                        .toISOString()
                                        .split("T")[0],
                                      deadline: "",
                                      scopeDocument: "",
                                      projectStatus: "In Progress",
                                      clientStatus: "Active",
                                      currency: lead.currency || countryCurrency || "",
                                    });
                                    setShowOnboardModal(true);
                                  }}
                                  className="p-2.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-emerald-500 hover:border-emerald-500 hover:bg-emerald-50 transition-all active:scale-90 shadow-sm"
                                  title="Convert to Client"
                                >
                                  <UserCheck size={18} />
                                </button>
                              )}
                              {onDismissLead &&
                                (lead.status === "Lead" || lead.isConverted) &&
                                lead.status !== "Dismissed" && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDismissLead(lead.lead_id);
                                    }}
                                    className="p-2.5 bg-amber-50/50 border border-amber-200/50 rounded-lg text-amber-500/70 hover:text-amber-600 hover:border-amber-500 hover:bg-amber-50 transition-all active:scale-90 shadow-sm"
                                    title="Dismiss Lead"
                                  >
                                    <UserX size={18} />
                                  </button>
                                )}
                              {onRestoreLead && lead.status === "Dismissed" && (
                                <div className="flex gap-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onRestoreLead(lead.lead_id);
                                    }}
                                    className="p-2.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-blue-500 hover:border-blue-500 hover:bg-blue-50 transition-all active:scale-90 shadow-sm"
                                    title="Restore Lead"
                                  >
                                    <RotateCcw size={18} />
                                  </button>
                                  {onDeleteLead && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setLeadToDelete(lead);
                                        setShowDeleteModal(true);
                                      }}
                                      className="p-2.5 bg-rose-50/50 border border-rose-200/50 rounded-lg text-rose-500/70 hover:text-rose-600 hover:border-rose-500 hover:bg-rose-50 transition-all active:scale-90 shadow-sm"
                                      title="Delete Lead"
                                    >
                                      <Trash2 size={18} />
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
                    <td colSpan={6} className="px-10 py-32 text-center">
                      <div className=" text-slate-300 p-4 rounded-xl mb-4  flex items-center justify-center mx-auto">
                        <UserX size={32} strokeWidth={1.5} />
                      </div>
                      <p className="text-[13px] font-bold text-primary  tracking-wider">
                No Active Leads
              </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Card List View */}
        <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentLeads.map((lead, index) => {
            const status = getStatusBadge(lead);
            return (
              <div
                key={lead.lead_id ? `lead-mobile-${lead.lead_id}` : `lead-mobile-idx-${index}`}
                onClick={() =>
                  lead.status !== "Dismissed" && onSelectLead(lead)
                }
                className={`bg-white p-4 rounded-2xl border transition-all ${
                  lead.status === "Dismissed"
                    ? "border-slate-100 opacity-80 shadow-none cursor-default"
                    : "border-slate-200 shadow-sm hover:shadow-md active:scale-[0.98] cursor-pointer"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-lg border-2 border-slate-50 shadow-md shrink-0">
                      {lead.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-primary truncate">
                        {lead.name}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-lg text-[14px] font-bold border flex items-center gap-1.5 shadow-sm ${status.className}`}
                  >
                    {status.icon}
                    {status.label}
                  </span>
                </div>

                <div className="space-y-3 mb-4">
                  {lead.status === "Lead" ? (
                    <div className="space-y-3">
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <p className="text-xs text-primary/80 font-medium italic line-clamp-2">
                          "{lead.notes || lead.industry || "No notes available"}"
                        </p>
                      </div>
                      <div className="px-1">
                        {renderContactDetails(lead)}
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2">
                      {renderContactDetails(lead)}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectLead(lead);
                      }}
                      className="flex items-center gap-1 text-[12px] font-bold text-secondary uppercase tracking-widest hover:text-secondary/80 transition-colors"
                    >
                      View Details
                      <ChevronRight size={14} />
                    </button>
                  </div>
                  <div
                    className="flex items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {leadView === "Converted" ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditConvertedClick(lead);
                        }}
                        className="p-2 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg hover:bg-blue-100 transition-all active:scale-90"
                      >
                        <Pencil size={16} />
                      </button>
                    ) : (
                      <>
                        {onOnboardLead && lead.status === "Lead" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOnboardingLeadId(lead.lead_id);
                              const initialCountry = lead.country || "";
                              const countryCurrency = countryToCurrency[initialCountry]?.code || "";
                              
                              setOnboardingData({
                                name: lead.name,
                                email: lead.email,
                                phone: lead.phone,
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
                                projectCategory: lead.projectCategory || 1,
                                clientStatus: "Active",
                                currency: lead.currency || countryCurrency || "",
                                country: initialCountry,
                                state: lead.state || "",
                              });
                              setShowOnboardModal(true);
                            }}
                            className="p-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg hover:bg-emerald-100 transition-all active:scale-90"
                          >
                            <UserCheck size={16} />
                          </button>
                        )}
                        {onDismissLead &&
                          (lead.status === "Lead" || lead.isConverted) &&
                          lead.status !== "Dismissed" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDismissLead(lead.lead_id);
                              }}
                              className="p-2 bg-amber-50 text-amber-600 border border-amber-100 rounded-lg hover:bg-amber-100 transition-all active:scale-90"
                            >
                              <UserX size={16} />
                            </button>
                          )}
                        {onRestoreLead && lead.status === "Dismissed" && (
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onRestoreLead(lead.lead_id);
                              }}
                              className="p-2 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg hover:bg-blue-100 transition-all active:scale-90"
                            >
                              <RotateCcw size={16} />
                            </button>
                            {onDeleteLead && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setLeadToDelete(lead);
                                  setShowDeleteModal(true);
                                }}
                                className="p-2 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg hover:bg-rose-100 transition-all active:scale-90"
                                title="Delete Lead"
                              >
                                <Trash2 size={16} />
                              </button>
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
            <div className="col-span-full text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
              <p className="text-sm font-bold text-slate-400">
                No leads found matching your filters.
              </p>
            </div>
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
                        key={`ellipsis-${pageNum}-${index}`}
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
      </div>

      {/* Add Modal */}
      {showAddModal &&
        createPortal(
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[99999] flex items-start justify-center p-4 sm:p-6 overflow-y-auto no-scrollbar">
            <div className="bg-white w-full max-w-xl rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-fade-in my-auto flex flex-col max-h-[90vh]">
              <div className="bg-primary p-4 text-white relative shrink-0">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="absolute top-4 right-4 p-1.5 hover:bg-white/10 rounded-xl transition-colors"
                >
                  <X size={18} strokeWidth={3} />
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-secondary/10 rounded-xl flex items-center justify-center shadow-lg border border-secondary/20">
                    <UserPlus
                      size={18}
                      className="text-secondary"
                      strokeWidth={3}
                    />
                  </div>
                  <div>
                    <h3 className="text-base font-bold tracking-tighter leading-none">
                      New Lead
                    </h3>
                    <p className="text-slate-400 text-[14px] font-bold  tracking-widest mt-0.5">
                      Lead Details
                    </p>
                  </div>
                </div>
              </div>

              <form
                onSubmit={handleSubmit}
                className="p-4 md:p-5 space-y-4 overflow-y-auto no-scrollbar"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* ADD LEAD FIELDS */}
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-[#18254D] tracking-widest ml-1">
                      LEAD NAME <span className="text-rose-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-secondary/10 focus:border-secondary focus:outline-none text-sm font-medium"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          name: e.target.value.replace(/[^a-zA-Z\s]/g, ""),
                        })
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-[#18254D] tracking-widest ml-1">
                      EMAIL ID <span className="text-rose-500">*</span>
                    </label>
                    <input
                      required
                      type="email"
                      placeholder="e.g. rahul@gmail.com"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-secondary/10 focus:border-secondary focus:outline-none text-sm font-medium"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>

                   <SearchableDropdown
                    label={
                      <span className="text-[12px] font-bold text-[#18254D] tracking-widest ml-1">
                        COUNTRY CODE <span className="text-rose-500">*</span>
                      </span>
                    }
                    options={countries.map((c) => ({
                      name: `${c.name} (${c.code})`,
                      value: c.code,
                      code: c.code,
                    }))}
                    value={formData.countryCode}
                    onChange={(val) => {
                      const selectedCountry = countries.find(c => c.code === val);
                      setFormData({ 
                        ...formData, 
                        country: selectedCountry ? selectedCountry.name : "",
                        countryCode: selectedCountry ? selectedCountry.code : val
                      });
                    }}
                    placeholder="Select Country Code"
                  />

                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-[#18254D] tracking-widest ml-1">
                      PHONE NUMBER <span className="text-rose-500">*</span>
                    </label>
                    <input
                      required
                      type="tel"
                      placeholder="e.g. 9876543210 (min 10 digits)"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-secondary/10 focus:border-secondary focus:outline-none text-sm font-medium"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          phone: e.target.value.replace(/\D/g, ""),
                        })
                      }
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[12px] font-bold text-[#18254D] tracking-widest ml-1">
                      WEBSITE URL (OPTIONAL)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. www.company.com"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-secondary/10 focus:border-secondary focus:outline-none text-sm font-medium"
                      value={formData.website}
                      onChange={(e) =>
                        setFormData({ ...formData, website: e.target.value })
                      }
                    />
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[12px] font-bold text-[#18254D] tracking-widest ml-1 uppercase">
                      LEAD STATUS <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setIsAddStatusDropdownOpen(!isAddStatusDropdownOpen)
                        }
                        className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold shadow-sm hover:border-secondary transition-all"
                      >
                        <span className="text-primary truncate">
                          {formData.leadType || "Select Status"}
                        </span>
                        <ChevronDown
                          size={16}
                          className={`text-slate-400 transition-transform ${
                            isAddStatusDropdownOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {isAddStatusDropdownOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-[80]"
                            onClick={() => setIsAddStatusDropdownOpen(false)}
                          />
                          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden z-[90] animate-fade-in-up origin-top">
                            <div className="bg-[#18254D] px-4 py-3 border-b border-white/10">
                              <p className="text-[14px] font-bold text-white/50  tracking-widest">
                                Select Status
                              </p>
                            </div>
                            {["Hot", "Warm", "Cold"].map((status) => (
                              <button
                                key={status}
                                type="button"
                                onClick={() => {
                                  setFormData({
                                    ...formData,
                                    leadType: status,
                                  });
                                  setIsAddStatusDropdownOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-[12px] font-bold  tracking-widest transition-colors ${
                                  formData.leadType === status
                                    ? "bg-slate-100 text-secondary"
                                    : "text-[#18254D] hover:bg-slate-50"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {status === "Hot" && (
                                    <Flame size={12} className="text-error" />
                                  )}
                                  {status === "Warm" && (
                                    <Sun size={12} className="text-warning" />
                                  )}
                                  {status === "Cold" && (
                                    <Snowflake
                                      size={12}
                                      className="text-info"
                                    />
                                  )}
                                  <span>{status}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[12px] font-bold text-[#18254D] tracking-widest ml-1">
                      NOTE / MESSAGE
                    </label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Interested in cloud migration services..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-secondary/10 focus:border-secondary focus:outline-none text-sm font-medium resize-none shadow-sm"
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

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 bg-[#18254D] text-white rounded-2xl text-[13px] font-bold  tracking-[0.25em] shadow-xl active:scale-[0.97] transition-all hover:bg-[#1e2e5e] hover:shadow-2xl flex items-center justify-center gap-3 group/btn disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <span>ADDING LEAD...</span>
                        <Loader2 size={18} className="animate-spin" />
                      </>
                    ) : (
                      <>
                        <UserPlus
                          size={20}
                          className="group-hover/btn:translate-x-1 transition-transform"
                        />
                        <span>ADD LEAD</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}
      {/* Onboard Modal */}
      {showOnboardModal &&
        createPortal(
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[99999] flex items-start justify-center p-4 sm:p-6 overflow-y-auto no-scrollbar">
            <div className="bg-white w-full max-w-xl rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-fade-in my-auto flex flex-col max-h-[90vh]">
              <div className="bg-primary p-4 text-white relative shrink-0">
                <button
                  onClick={() => setShowOnboardModal(false)}
                  className="absolute top-4 right-4 p-1.5 hover:bg-white/10 rounded-xl transition-colors"
                >
                  <X size={18} strokeWidth={3} />
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-secondary/10 rounded-xl flex items-center justify-center shadow-lg border border-secondary/20">
                    <UserCheck
                      size={18}
                      className="text-secondary"
                      strokeWidth={3}
                    />
                  </div>
                  <div>
                    <h3 className="text-base font-bold tracking-tighter leading-none">
                      Convert to Client
                    </h3>
                    <p className="text-secondary text-[14px] font-bold  tracking-widest mt-0.5">
                      Onboard Lead to Active Status
                    </p>
                  </div>
                </div>
              </div>

              <form
                onSubmit={handleOnboardSubmit}
                className="p-5 space-y-4 overflow-y-auto no-scrollbar"
              >
                {/* CLIENT DETAILS HEADING */}
                <div className="flex items-center gap-3 pt-2">
                  <div className="h-[2px] w-8 bg-secondary rounded-full" />
                  <h4 className="text-[14px] font-bold text-[#18254D]  tracking-[0.2em]">
                    Client Details
                  </h4>
                  <div className="h-[2px] flex-1 bg-slate-100 rounded-full" />
                </div>

                <div className="space-y-3 pb-2">
                  <label className="text-[12px] font-bold text-[#18254D]  tracking-widest ml-1">
                    CLIENT TYPE
                  </label>
                  <div className="grid grid-cols-1 gap-4">
                    <label className="flex-1 flex items-center gap-3 p-4 bg-white border-2 border-[#18254D] rounded-xl cursor-default transition-all group shadow-sm">
                      <div className="relative flex items-center justify-center">
                        <input
                          type="radio"
                          checked={true}
                          readOnly
                          className="peer appearance-none w-6 h-6 border-2 border-[#18254D] rounded-full transition-all"
                        />
                        <div className="absolute w-3 h-3 bg-[#18254D] rounded-full" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#18254D] leading-none">
                          New Client
                        </p>
                        <p className="text-[14px] text-slate-400 font-bold mt-1">
                          First-time engagement
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2 relative">
                    <label className="text-[12px] font-bold text-[#18254D]  tracking-widest ml-1">
                      CLIENT NAME <span className="text-error">*</span>
                    </label>
                    <input
                      required
                      readOnly
                      disabled
                      type="text"
                      placeholder="e.g. Anand Kumar"
                      className="w-full px-3.5 py-2.5 bg-slate-100 text-slate-500 cursor-not-allowed border border-slate-200 rounded-xl focus:outline-none text-sm font-medium"
                      value={onboardingData.name}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[12px] font-bold text-[#18254D]  tracking-widest ml-1">
                      EMAIL ID <span className="text-error">*</span>
                    </label>
                    <input
                      required
                      readOnly
                      disabled
                      type="email"
                      placeholder="e.g. anand.kumar@fintech.in"
                      className="w-full px-3.5 py-2.5 bg-slate-100 text-slate-500 cursor-not-allowed border border-slate-200 rounded-xl focus:outline-none text-sm font-medium"
                      value={onboardingData.email}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[12px] font-bold text-[#18254D]  tracking-widest ml-1">
                      PHONE NUMBER <span className="text-error">*</span>
                    </label>
                    <input
                      required
                      readOnly
                      disabled
                      type="tel"
                      placeholder="+91 98765 43210"
                      className="w-full px-3.5 py-2.5 bg-slate-100 text-slate-500 cursor-not-allowed border border-slate-200 rounded-xl focus:outline-none text-sm font-medium"
                      value={onboardingData.phone}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[12px] font-bold text-[#18254D]  tracking-widest ml-1">
                      ORGANISATION NAME <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Acme Corp"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-secondary/10 focus:border-secondary focus:outline-none text-sm font-medium"
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
                    required
                    options={countries.map((c) => ({
                      name: c.name,
                      value: c.name,
                      code: c.code,
                    }))}
                    value={onboardingData.country}
                    onChange={(val) => {
                      const selectedCountry = countries.find(c => c.name === val || c.code === val);
                      const countryCurrency = countryToCurrency[val] || (selectedCountry ? countryToCurrency[selectedCountry.name] : null);
                      setOnboardingData({
                        ...onboardingData,
                        country: selectedCountry ? selectedCountry.name : val,
                        currency: countryCurrency
                          ? countryCurrency.code
                          : onboardingData.currency,
                        state: "", // Reset state when country changes
                      });
                    }}
                    placeholder="Select Country"
                  />

                  {onboardingData.country === "India" ? (
                    <SearchableDropdown
                      label="CLIENT STATE"
                      required
                      options={indianStates}
                      value={onboardingData.state}
                      onChange={(val) =>
                        setOnboardingData({ ...onboardingData, state: val })
                      }
                      placeholder="Select State"
                    />
                  ) : (
                    <div className="space-y-2">
                      <label className="text-[12px] font-bold text-[#18254D]  tracking-widest ml-1">
                        CLIENT STATE <span className="text-error">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. California"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-secondary/10 focus:border-secondary focus:outline-none text-sm font-medium"
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
                    required
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

                  <div className="space-y-2">
                    <label className="text-[12px] font-bold text-[#18254D]  tracking-widest ml-1 uppercase">
                      CLIENT STATUS <span className="text-error">*</span>
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setIsOnboardClientStatusDropdownOpen(
                            !isOnboardClientStatusDropdownOpen,
                          )
                        }
                        className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm shadow-sm hover:border-secondary transition-all"
                      >
                        <span className="text-primary truncate">
                          {onboardingData.clientStatus}
                        </span>
                        <ChevronDown
                          size={16}
                          className={`text-slate-400 transition-transform ${
                            isOnboardClientStatusDropdownOpen
                              ? "rotate-180"
                              : ""
                          }`}
                        />
                      </button>

                      {isOnboardClientStatusDropdownOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-[80]"
                            onClick={() =>
                              setIsOnboardClientStatusDropdownOpen(false)
                            }
                          />
                          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden z-[90] animate-fade-in-up origin-top">
                            <div className="bg-[#18254D] px-4 py-3 border-b border-white/10">
                              <p className="text-[14px] font-bold text-white/50  tracking-widest">
                                Select Status
                              </p>
                            </div>
                            {["Active", "Inactive"].map((status) => (
                              <button
                                key={status}
                                type="button"
                                onClick={() => {
                                  setOnboardingData({
                                    ...onboardingData,
                                    clientStatus: status,
                                  });
                                  setIsOnboardClientStatusDropdownOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-[12px] font-bold  tracking-widest transition-colors ${
                                  onboardingData.clientStatus === status
                                    ? "bg-slate-100 text-secondary"
                                    : "text-[#18254D] hover:bg-slate-50"
                                }`}
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
                <div className="flex items-center gap-3 pt-6">
                  <div className="h-[2px] w-8 bg-secondary rounded-full" />
                  <h4 className="text-[14px] font-bold text-[#18254D]  tracking-[0.2em]">
                    Project Details
                  </h4>
                  <div className="h-[2px] flex-1 bg-slate-100 rounded-full" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[12px] font-bold text-[#18254D]  tracking-widest ml-1">
                      PROJECT NAME <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Route Optimization Platform"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-secondary/10 focus:border-secondary focus:outline-none text-sm font-medium"
                      value={onboardingData.projectName}
                      onChange={(e) =>
                        setOnboardingData({
                          ...onboardingData,
                          projectName: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[12px] font-bold text-[#18254D]  tracking-widest ml-1">
                      PROJECT DESCRIPTION <span className="text-error">*</span>
                    </label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Focus on UI/UX redesign and performance optimization..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-secondary/10 focus:border-secondary focus:outline-none text-sm font-medium resize-none shadow-sm"
                      value={onboardingData.projectDescription}
                      onChange={(e) =>
                        setOnboardingData({
                          ...onboardingData,
                          projectDescription: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[12px] font-bold text-[#18254D]  tracking-widest ml-1 flex items-center justify-between">
                      <span>PROJECT CATEGORY <span className="text-error">*</span></span>
                      <span className="text-[10px] text-slate-400 font-medium italic">Linked to Lead category</span>
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        disabled={true}
                        className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold shadow-sm opacity-70 cursor-not-allowed"
                      >
                        <span className="text-primary truncate">
                          {CATEGORY_MAP[onboardingData.projectCategory] ||
                            "Select Category"}
                        </span>
                        <Tag size={16} className="text-slate-400" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-[#18254D]  tracking-widest ml-1">
                      PROJECT STATUS <span className="text-error">*</span>
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setIsOnboardStatusDropdownOpen(
                            !isOnboardStatusDropdownOpen,
                          )
                        }
                        className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium shadow-sm hover:border-secondary transition-all"
                      >
                        <span className="text-primary">
                          {onboardingData.projectStatus}
                        </span>
                        <ChevronDown
                          size={16}
                          className={`text-slate-400 transition-transform ${
                            isOnboardStatusDropdownOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {isOnboardStatusDropdownOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-[80]"
                            onClick={() =>
                              setIsOnboardStatusDropdownOpen(false)
                            }
                          />
                          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden z-[90] animate-fade-in-up origin-top">
                            <div className="bg-[#18254D] px-4 py-3 border-b border-white/10">
                              <p className="text-[14px] font-bold text-white/50  tracking-widest">
                                Select Status{" "}
                                <span className="text-error">*</span>
                              </p>
                            </div>
                            {["Hold", "In Progress", "Completed"].map(
                              (status) => (
                                <button
                                  key={status}
                                  type="button"
                                  onClick={() => {
                                    setOnboardingData({
                                      ...onboardingData,
                                      projectStatus: status,
                                    });
                                    setIsOnboardStatusDropdownOpen(false);
                                  }}
                                  className={`w-full text-left px-4 py-2.5 text-[12px] font-bold  tracking-widest transition-colors ${
                                    onboardingData.projectStatus === status
                                      ? "bg-slate-100 text-secondary"
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

                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-[#18254D]  tracking-widest ml-1">
                      PROJECT PRIORITY <span className="text-error">*</span>
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setIsOnboardPriorityDropdownOpen(
                            !isOnboardPriorityDropdownOpen,
                          )
                        }
                        className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium shadow-sm hover:border-secondary transition-all"
                      >
                        <span className="text-primary">
                          {onboardingData.projectPriority}
                        </span>
                        <ChevronDown
                          size={16}
                          className={`text-slate-400 transition-transform ${
                            isOnboardPriorityDropdownOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {isOnboardPriorityDropdownOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-[80]"
                            onClick={() =>
                              setIsOnboardPriorityDropdownOpen(false)
                            }
                          />
                          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden z-[90] animate-fade-in-up origin-top">
                            <div className="bg-[#18254D] px-4 py-3 border-b border-white/10">
                              <p className="text-[14px] font-bold text-white/50  tracking-widest">
                                Select Priority
                              </p>
                            </div>
                            {["High", "Medium", "Low"].map((level) => (
                              <button
                                key={level}
                                type="button"
                                onClick={() => {
                                  setOnboardingData({
                                    ...onboardingData,
                                    projectPriority: level,
                                  });
                                  setIsOnboardPriorityDropdownOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-[12px] font-bold  tracking-widest transition-colors ${
                                  onboardingData.projectPriority === level
                                    ? "bg-slate-100 text-secondary"
                                    : "text-[#18254D] hover:bg-slate-50"
                                }`}
                              >
                                {level}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[12px] font-bold text-[#18254D]  tracking-widest ml-1 flex items-center gap-1.5">
                      PROJECT BUDGET ({onboardingData.currency || "INR"}){" "}
                      <span className="text-error">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                        {commonCurrencies.find(
                          (c) => c.code === onboardingData.currency,
                        )?.symbol || "₹"}
                      </div>
                      <input
                        type="text"
                        placeholder={
                          onboardingData.currency === "USD"
                            ? "e.g. 5,000"
                            : "e.g. 5,00,000"
                        }
                        className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-secondary/10 focus:border-secondary focus:outline-none text-sm font-medium shadow-sm"
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

                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-[#18254D] tracking-widest ml-1">
                      ONBOARDING DATE <span className="text-error">*</span>
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
                    <label className="text-[12px] font-bold text-[#18254D] tracking-widest ml-1 whitespace-nowrap">
                      DEADLINE (TENTATIVE) <span className="text-error">*</span>
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

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[12px] font-bold text-[#18254D]  tracking-widest ml-1">
                      SCOPE DOCUMENT <span className="text-error">*</span>
                    </label>
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
                              e.target.value = ""; // Clear selection
                              return;
                            }
                            setOnboardingData({
                              ...onboardingData,
                              scopeDocument: file,
                            });
                          }
                        }}
                      />
                      <div className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl group-hover:border-secondary group-hover:bg-secondary/5 transition-all flex items-center gap-3 shadow-sm">
                        <div className="p-2 bg-white border border-slate-200 rounded-lg shadow-sm">
                          <Upload size={16} className="text-secondary" />
                        </div>
                        <span
                          className={`text-sm font-bold ${onboardingData.scopeDocument ? "text-[#18254D]" : "text-slate-400"}`}
                        >
                          {onboardingData.scopeDocument instanceof File
                            ? onboardingData.scopeDocument.name
                            : typeof onboardingData.scopeDocument ===
                                  "string" && onboardingData.scopeDocument
                              ? onboardingData.scopeDocument
                              : "Upload scope document (PDF)"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 shrink-0">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-[#18254D] text-white rounded-2xl text-[13px] font-bold  tracking-[0.25em] shadow-xl active:scale-[0.97] transition-all hover:bg-[#1e2e5e] hover:shadow-2xl flex items-center justify-center gap-3 group/btn disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <span>CONVERTING...</span>
                        <Loader2 size={20} className="animate-spin" />
                      </>
                    ) : (
                      <>
                        <UserCheck
                          size={20}
                          className="group-hover/btn:translate-x-1 transition-transform"
                        />
                        <span>CONVERT TO CLIENT</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}

      {/* Edit Converted Lead Modal */}
      {showEditConvertedModal &&
        createPortal(
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[99999] flex items-start justify-center p-4 sm:p-6 overflow-y-auto no-scrollbar">
            <div className="bg-white w-full max-w-xl rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-fade-in my-auto flex flex-col max-h-[90vh]">
              <div className="bg-primary p-4 text-white relative shrink-0">
                <button
                  onClick={() => setShowEditConvertedModal(false)}
                  className="absolute top-4 right-4 p-1.5 hover:bg-white/10 rounded-xl transition-colors"
                >
                  <X size={18} strokeWidth={3} />
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-secondary/10 rounded-xl flex items-center justify-center shadow-lg border border-secondary/20">
                    <Pencil
                      size={18}
                      className="text-secondary"
                      strokeWidth={3}
                    />
                  </div>
                  <div>
                    <h3 className="text-base font-bold tracking-tighter leading-none">
                      Edit Lead
                    </h3>
                    <p className="text-slate-400 text-[14px] font-bold  tracking-widest mt-0.5">
                      Lead Details
                    </p>
                  </div>
                </div>
              </div>

              <form
                onSubmit={handleEditConvertedSubmit}
                className="p-4 md:p-5 space-y-4 overflow-y-auto no-scrollbar"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* EDIT LEAD FIELDS (MATCHING NEW LEAD MODAL) */}
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-[#18254D]  tracking-widest ml-1">
                      LEAD NAME
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-secondary/10 focus:border-secondary focus:outline-none text-sm font-medium"
                      value={editConvertedData.name}
                      onChange={(e) =>
                        setEditConvertedData({
                          ...editConvertedData,
                          name: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-[#18254D]  tracking-widest ml-1">
                      EMAIL ID
                    </label>
                    <input
                      required
                      type="email"
                      placeholder="rahul.sharma@example.com"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-secondary/10 focus:border-secondary focus:outline-none text-sm font-medium"
                      value={editConvertedData.email}
                      onChange={(e) =>
                        setEditConvertedData({
                          ...editConvertedData,
                          email: e.target.value,
                        })
                      }
                    />
                  </div>
                  <SearchableDropdown
                    label="COUNTRY CODE"
                    options={Array.from(new Set(countries.map(c => c.name))).map(name => {
                      const c = countries.find(country => country.name === name);
                      return {
                        name: `${c.name} (${c.code})`,
                        label: c.code,
                        value: c.code,
                        code: c.code,
                      };
                    })}
                    value={editConvertedData.countryCode}
                    onChange={(val) => {
                      const countryObj = countries.find((c) => c.code === val || c.name === val);
                      setEditConvertedData({
                        ...editConvertedData,
                        countryCode: countryObj ? countryObj.code : val,
                        country: countryObj ? countryObj.name : editConvertedData.country,
                      });
                    }}
                    placeholder="Select Code"
                  />

                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-[#18254D]  tracking-widest ml-1 uppercase">
                      PHONE NUMBER
                    </label>
                    <input
                      required
                      type="tel"
                      placeholder="e.g. 9876543210"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-secondary/10 focus:border-secondary focus:outline-none text-sm font-medium"
                      value={editConvertedData.phone}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        setEditConvertedData({
                          ...editConvertedData,
                          phone: value,
                        });
                      }}
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[12px] font-bold text-[#18254D]  tracking-widest ml-1">
                      WEBSITE URL (OPTIONAL)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. www.company.com"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-secondary/10 focus:border-secondary focus:outline-none text-sm font-medium"
                      value={editConvertedData.website}
                      onChange={(e) =>
                        setEditConvertedData({
                          ...editConvertedData,
                          website: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[12px] font-bold text-[#18254D]  tracking-widest ml-1 uppercase">
                      LEAD CATEGORY
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setIsEditCategoryDropdownOpen(
                            !isEditCategoryDropdownOpen,
                          )
                        }
                        className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold shadow-sm hover:border-secondary transition-all"
                      >
                        <span className="text-primary truncate">
                          {CATEGORY_MAP[editConvertedData.projectCategory] ||
                            "Select Category"}
                        </span>
                        <ChevronDown
                          size={16}
                          className={`text-slate-400 transition-transform ${
                            isEditCategoryDropdownOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {isEditCategoryDropdownOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-[80]"
                            onClick={() => setIsEditCategoryDropdownOpen(false)}
                          />
                          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden z-[90] animate-fade-in-up origin-top edit-category-dropdown">
                            <div className="bg-[#18254D] px-4 py-3 border-b border-white/10">
                              <p className="text-[14px] font-bold text-white/50  tracking-widest">
                                Select Category
                              </p>
                            </div>
                            {[1, 2, 3].map((catId) => (
                              <button
                                key={`edit-cat-${catId}`}
                                type="button"
                                onClick={() => {
                                  setEditConvertedData({
                                    ...editConvertedData,
                                    projectCategory: catId,
                                  });
                                  setIsEditCategoryDropdownOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-[12px] font-bold  tracking-widest transition-colors ${
                                  editConvertedData.projectCategory === catId
                                    ? "bg-slate-100 text-secondary"
                                    : "text-[#18254D] hover:bg-slate-50"
                                }`}
                              >
                                {CATEGORY_MAP[catId]}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[12px] font-bold text-[#18254D]  tracking-widest ml-1 uppercase">
                      LEAD STATUS
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setIsEditStatusDropdownOpen(!isEditStatusDropdownOpen)
                        }
                        className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold shadow-sm hover:border-secondary transition-all"
                      >
                        <span className="text-primary truncate">
                          {editConvertedData.leadType || "Select Status"}
                        </span>
                        <ChevronDown
                          size={16}
                          className={`text-slate-400 transition-transform ${
                            isEditStatusDropdownOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {isEditStatusDropdownOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-[80]"
                            onClick={() => setIsEditStatusDropdownOpen(false)}
                          />
                          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden z-[90] animate-fade-in-up origin-top edit-status-dropdown">
                            <div className="bg-[#18254D] px-4 py-3 border-b border-white/10">
                              <p className="text-[14px] font-bold text-white/50  tracking-widest">
                                Select Status
                              </p>
                            </div>
                            {["Hot", "Warm", "Cold", "Converted"].map((status) => (
                              <button
                                key={`edit-status-${status}`}
                                type="button"
                                onClick={() => {
                                  setEditConvertedData({
                                    ...editConvertedData,
                                    leadType: status,
                                  });
                                  setIsEditStatusDropdownOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-[12px] font-bold  tracking-widest transition-colors ${
                                  editConvertedData.leadType === status
                                    ? "bg-slate-100 text-secondary"
                                    : "text-[#18254D] hover:bg-slate-50"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {status === "Hot" && (
                                    <Flame size={12} className="text-error" />
                                  )}
                                  {status === "Warm" && (
                                    <Sun size={12} className="text-warning" />
                                  )}
                                  {status === "Cold" && (
                                    <Snowflake
                                      size={12}
                                      className="text-info"
                                    />
                                  )}
                                  {status === "Converted" && (
                                    <UserCheck
                                      size={12}
                                      className="text-success"
                                    />
                                  )}
                                  <span>{status}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[12px] font-bold text-[#18254D]  tracking-widest ml-1">
                      MESSAGE
                    </label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Interested in cloud migration services..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-secondary/10 focus:border-secondary focus:outline-none text-sm font-medium resize-none shadow-sm"
                      value={editConvertedData.projectDescription}
                      onChange={(e) =>
                        setEditConvertedData({
                          ...editConvertedData,
                          projectDescription: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="pt-2 shrink-0">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 bg-[#18254D] text-white rounded-2xl text-[13px] font-bold  tracking-[0.25em] shadow-xl active:scale-[0.97] transition-all hover:bg-[#1e2e5e] hover:shadow-2xl flex items-center justify-center gap-3 group/btn disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <span>SAVING CHANGES...</span>
                        <Loader2 size={20} className="animate-spin" />
                      </>
                    ) : (
                      <>
                        <Check
                          size={20}
                          className="group-hover/btn:scale-110 transition-transform"
                        />
                        <span>SAVE CHANGES</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}

      {showFollowUpModal &&
        createPortal(
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[99999] flex items-center justify-center p-4 overflow-y-auto no-scrollbar">
            <div className="bg-white w-full max-w-md rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-fade-in flex flex-col max-h-[85vh]">
              <div className="bg-primary p-4 text-white relative">
                <button
                  onClick={() => setShowFollowUpModal(false)}
                  className="absolute top-4 right-4 p-1.5 hover:bg-white/10 rounded-xl transition-colors"
                >
                  <X size={18} strokeWidth={3} />
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-400/20 rounded-xl flex items-center justify-center shadow-lg border border-indigo-400/30">
                    <MessageSquare
                      size={18}
                      className="text-indigo-300"
                      strokeWidth={2.5}
                    />
                  </div>
                  <div>
                    <h3 className="text-base font-bold tracking-tighter leading-none">
                      Follow Up
                    </h3>
                    <p className="text-slate-400 text-[14px] font-bold  tracking-widest mt-0.5">
                      {followUpLeadName}
                    </p>
                  </div>
                </div>
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
                    const lead = clients.find((c) => c.lead_id === followUpLeadId);
                    if (lead) {
                      onSelectClient(lead, "activity");
                    }
                  }
                }}
                className="p-4 space-y-3 overflow-y-auto no-scrollbar"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-[12px] font-bold text-primary  tracking-widest ml-1">
                      Date
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
                  <div className="space-y-2">
                    <label className="text-[12px] font-bold text-primary  tracking-widest ml-1">
                      Time
                    </label>
                    <div className="relative">
                      <input
                        required
                        type="time"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 focus:outline-none text-sm font-medium"
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
                </div>

                <div className="space-y-2">
                  <label className="text-[12px] font-bold text-primary  tracking-widest ml-1">
                    Interaction Type
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
                        className={`py-2.5 px-3 rounded-xl border text-[12px] font-bold  tracking-widest transition-all ${
                          followUpData.type === type
                            ? "bg-indigo-500 border-indigo-500 text-white shadow-md shadow-indigo-200"
                            : "bg-white border-slate-100 text-slate-400 hover:border-slate-300"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[12px] font-bold text-primary  tracking-widest ml-1">
                    Follow Up Message
                  </label>
                  <textarea
                    required
                    placeholder="e.g. Discussed budget constraints and finalized timeline..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 focus:outline-none text-sm font-medium min-h-[80px] resize-none"
                    value={followUpData.description}
                    onChange={(e) =>
                      setFollowUpData({
                        ...followUpData,
                        description: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="pt-1 shrink-0">
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-primary text-white rounded-xl hover:bg-slate-800 text-[13px] font-bold tracking-[0.2em] transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                  >
                    <MessageSquare size={16} />
                    Save & View Conversations
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && leadToDelete &&
        createPortal(
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99999] flex items-start justify-center p-4 animate-fade-in overflow-y-auto no-scrollbar py-20">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-scale-in my-auto">
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-100 shadow-sm">
                  <AlertTriangle size={32} className="text-rose-500" />
                </div>
                <h3 className="text-xl font-bold text-primary mb-2">
                  Confirm Deletion
                </h3>
                <p className="text-slate-500 text-sm font-medium leading-relaxed px-4">
                  Are you sure you want to delete the lead 
                  <span className="text-primary font-bold"> "{leadToDelete.name}"</span>? 
                  This action cannot be undone and all associated data will be removed.
                </p>
              </div>
              <div className="bg-slate-50 p-4 border-t border-slate-100 flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setLeadToDelete(null);
                  }}
                  className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold tracking-widest hover:bg-slate-50 transition-all active:scale-95 uppercase"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (onDeleteLead && leadToDelete) {
                      onDeleteLead(leadToDelete.lead_id);
                    }
                    setShowDeleteModal(false);
                    setLeadToDelete(null);
                  }}
                  className="flex-1 px-4 py-2.5 bg-rose-500 text-white rounded-xl text-xs font-bold tracking-widest hover:bg-rose-600 shadow-lg shadow-rose-200 transition-all active:scale-95 uppercase"
                >
                  Delete Lead
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default LeadList;
