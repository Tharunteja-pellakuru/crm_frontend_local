import React, { useState, useEffect, useRef, useMemo } from "react";
import { toast } from "react-hot-toast";
import { createPortal } from "react-dom";
import { useScrollLock } from "../../hooks/useScrollLock";
import { useSearch } from "../../hooks/useSearch";
import {
  Mail,
  Phone,
  Globe,
  Ban,
  CheckCircle,
  Clock,
  PauseCircle,
  Pause,
  ShieldAlert,
  Layout,
  RefreshCcw,
  Trash2,
  Flame,
  Sun,
  Snowflake,
  Plus,
  Send,
  Inbox,
  Search,
  X,
  Sparkles,
  ChevronDown,
  Loader2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserX,
  AlertTriangle,
  Filter,
  Share2,
  Users,
  Pencil,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  MessageCircle,
} from "lucide-react";
import favIcon from "../../assets/fav-icon.png";
import DatePicker from "../../components/ui/DatePicker";
// CATEGORY_MAP removed - category now managed at Project level only
import { countries } from "../../utils/countries";
import SearchableDropdown from "../../components/common/SearchableDropdown";
import { validateForm, EMAIL_PATTERN } from "../../utils/validation";
import {
  analyzeEnquiryRelevance,
  batchAnalyzeEnquiries,
} from "../../services/aiService";
import { BASE_URL } from "../../constants/config";
import { getAuthHeaders } from "../../utils/auth";

const getSourceIcon = (source) => {
  if (!source) return <Share2 size={10} />;
  const s = source.toLowerCase();
  if (s.includes("facebook") || s.includes("fb")) return <Facebook size={10} />;
  if (s.includes("instagram") || s.includes("ig")) return <Instagram size={10} />;
  if (s.includes("twitter") || s.includes("x")) return <Twitter size={10} />;
  if (s.includes("linkedin")) return <Linkedin size={10} />;
  if (s.includes("whatsapp") || s.includes("sms") || s.includes("message")) return <MessageCircle size={10} />;
  if (s.includes("web") || s.includes("site") || s.includes("online")) return <Globe size={10} />;
  return <Share2 size={10} />;
};

const EnquiryList = ({
  enquiries,
  onPromote,
  onDismiss,
  onHold,
  onRestore,
  onDelete,
  onDeleteAll,
  onUpdate,
  onAdd,
  onEdit,
  aiModels = [],
}) => {
  const [activeTab, setActiveTab] = useState("new");
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const aiModelRef = useRef(null);
  const [modelDropdownStyle, setModelDropdownStyle] = useState({});

  useEffect(() => {
    if (isModelDropdownOpen && aiModelRef.current) {
      const rect = aiModelRef.current.getBoundingClientRect();
      setModelDropdownStyle({
        position: "fixed",
        top: `${rect.bottom + 8}px`,
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        zIndex: 9999,
      });
    }
  }, [isModelDropdownOpen]);

  useEffect(() => {
    const handleScrollResize = (e) => {
      if (isModelDropdownOpen) {
        if (
          e.type === "scroll" &&
          e.target.closest &&
          e.target.closest(".ai-model-dropdown")
        ) {
          return;
        }
        setIsModelDropdownOpen(false);
      }
    };
    if (isModelDropdownOpen) {
      window.addEventListener("scroll", handleScrollResize, true);
      window.addEventListener("resize", handleScrollResize, true);
    }
    return () => {
      window.removeEventListener("scroll", handleScrollResize, true);
      window.removeEventListener("resize", handleScrollResize, true);
    };
  }, [isModelDropdownOpen]);
  const [filterQuery, setFilterQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const RECORDS_PER_PAGE = 10;
  const { searchTerm, setSearchTerm } = useSearch(setCurrentPage);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysisError, setAiAnalysisError] = useState(null);
  const [aiAnalysisEnabled, setAiAnalysisEnabled] = useState(false);
  const [hideIrrelevant, setHideIrrelevant] = useState(false);
  // store the *database record id* here; provider-specific modelId is
  // available as `model.modelId` on the objects in `aiModels`.
  const [selectedAiModel, setSelectedAiModel] = useState("");
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isFilterPopupOpen, setIsFilterPopupOpen] = useState(false);
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
        // Mobile styles: Centering handled by the Flexbox wrapper in JSX
        const popupWidth = Math.min(windowWidth - 32, 400);
        style.width = `${popupWidth}px`;
        style.maxHeight = "calc(100dvh - 32px)";
        style.borderRadius = "24px";
      } else {
        // Desktop: Button-relative design
        const popupWidth = 384; // w-96
        let left = rect.right - popupWidth;
        if (left < 16) left = 16;
        if (left + popupWidth > windowWidth - 16) left = windowWidth - popupWidth - 16;

        const spaceBelow = windowHeight - rect.bottom - 24;
        const spaceAbove = rect.top - 24;

        style.left = `${left}px`;
        style.width = `${popupWidth}px`;

        if (spaceBelow < 400 && spaceAbove > spaceBelow) {
          // Open Upwards
          style.bottom = `${windowHeight - rect.top + 8}px`;
          style.maxHeight = `calc(${spaceAbove}px - 16px)`;
          style.transformOrigin = "bottom right";
        } else {
          // Open Downwards
          style.top = `${rect.bottom + 8}px`;
          style.maxHeight = `calc(${spaceBelow}px - 16px)`;
          style.transformOrigin = "top right";
        }
      }

      setFilterPopupStyle(style);
    }
  }, [isFilterPopupOpen, aiAnalysisEnabled, activeTab]); // Recalculate if content expands (AI enabled) or tab changes

  useEffect(() => {
    const handleScrollResize = (e) => {
      if (isFilterPopupOpen) {
        // If the scroll is happening inside the filter popup, don't close it
        if (e.type === "scroll" && filterPopupRef.current && filterPopupRef.current.contains(e.target)) {
          return;
        }
        setIsFilterPopupOpen(false);
      }
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

  const [promoteFormData, setPromoteFormData] = useState({
    name: "",
    email: "",
    phone: "",
    website: "",
    leadType: "Hot",
    country: "India",
    countryCode: "+91",
    notes: "",
  });
  const [showSimulateForm, setShowSimulateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editFormData, setEditFormData] = useState({
    id: "",
    name: "",
    email: "",
    phone: "",
    website: "",
    source: "",
    message: "",
  });
  const [isEditSourceDropdownOpen, setIsEditSourceDropdownOpen] = useState(false);
  const [isEnquiryStatusDropdownOpen, setIsEnquiryStatusDropdownOpen] =
    useState(false);
  const [isSourceDropdownOpen, setIsSourceDropdownOpen] = useState(false);
  const [holdModalOpen, setHoldModalOpen] = useState(false);
  const [holdReason, setHoldReason] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    website: "",
    source: "",
    message: "",
  });
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lock scroll when any modal is open
  useScrollLock(leadModalOpen || holdModalOpen || showSimulateForm || showDeleteAllModal || showEditForm || showDetailsModal);

  // Auto-select default model for AI Analysis
  useEffect(() => {
    if (aiModels.length > 0 && !selectedAiModel) {
      const def = aiModels.find((m) => m.isDefault) || aiModels[0];
      // select the database id on startup
      setSelectedAiModel(def.aimodel_id);
    }
  }, [aiModels]);

  const hideIrrelevantRef = React.useRef(hideIrrelevant);
  useEffect(() => {
    hideIrrelevantRef.current = hideIrrelevant;
  }, [hideIrrelevant]);

  // When Filter Spam is turned ON, dismiss all already analyzed irrelevant enquiries
  useEffect(() => {
    if (hideIrrelevant) {
      const toDismiss = enquiries.filter(
        (e) =>
          (e.status === "new" || e.status === "read") &&
          e.aiAnalysis &&
          !e.aiAnalysis.isRelevant,
      );
      toDismiss.forEach((e) => {
        onDismiss(e.id);
      });
    }
  }, [hideIrrelevant, enquiries, onDismiss]);

  const analysisLoopRef = React.useRef(false);

  // whenever the selected model changes, clear any existing analysis so
  // that the new model will be used instead. this also resets the error
  // state and allows the main effect below to kick off again.
  useEffect(() => {
    if (aiAnalysisEnabled) {
      setAiAnalysisError(null);
      analysisLoopRef.current = false;
      enquiries.forEach((e) => {
        if (e.aiAnalysis) {
          onUpdate({ id: e.id, aiAnalysis: null });
        }
      });
    }
  }, [selectedAiModel]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    startDate,
    endDate,
    activeTab,
    hideIrrelevant,
    selectedAiModel,
  ]);

  useEffect(() => {
    if (aiAnalysisEnabled && activeTab === "new" && !analysisLoopRef.current) {
      const runAnalysis = async () => {
        const toAnalyze = enquiries.filter(
          (e) => (e.status === "new" || e.status === "read") && !e.aiAnalysis,
        );
        if (toAnalyze.length > 0) {
          analysisLoopRef.current = true;
          setIsAnalyzing(true);
          setAiAnalysisError(null);
          // look up using the record id stored in state
          const modelObj =
            aiModels.find((m) => m.aimodel_id === selectedAiModel) ||
            aiModels.find((m) => m.isDefault) ||
            aiModels[0];
          const apiKey = modelObj?.apiKey || process.env.API_KEY;
          // provider model identifier that backend expects when doing
          // lookups internally (we now also support fallback lookup).
          const providerModelId = modelObj?.modelId || "gemini-2.0-flash";

          const batchSize = 10; // increased per request chunk size
          for (let i = 0; i < toAnalyze.length; i += batchSize) {
            const batch = toAnalyze.slice(i, i + batchSize);
            try {
              const results = await batchAnalyzeEnquiries(
                batch,
                apiKey,
                providerModelId,
              );
              console.log("Batch analysis results:", results);
              console.log("Original batch:", batch.map(b => ({ id: b.id, name: b.name })));

              results.forEach((res) => {
                const enq = batch.find((b) => b.id === res.id);
                if (enq) {
                  console.log("Matched enquiry:", enq.id, "with result:", res);
                  onUpdate({ id: enq.id, aiAnalysis: res });
                  // If Filter Spam is enabled and this is irrelevant, dismiss it immediately
                  if (hideIrrelevantRef.current && !res.isRelevant) {
                    onDismiss(enq.id);
                  }
                } else {
                  console.warn("Could not match result to enquiry:", res);
                }
              });

              if (i + batchSize < toAnalyze.length) {
                // Wait 8 seconds to stay under 10 RPM (Requests Per Minute)
                await new Promise((r) => setTimeout(r, 8000));
              }
            } catch (err) {
              console.error("Failed to analyze batch:", err);
              const isQuota =
                err.status === "RESOURCE_EXHAUSTED" ||
                err.message?.toLowerCase().includes("quota exceeded") ||
                err.message?.toLowerCase().includes("rate_limit_exceeded");
              const retryDelay = err.retryDelay || 10;

              if (err.message?.includes("429")) {
                const waitMsg = err.retryAfter
                  ? `Try after ${err.retryAfter}`
                  : `Waiting ${retryDelay}s then retrying...`;
                setAiAnalysisError(`Rate limit hit. ${waitMsg}`);
                await new Promise((r) => setTimeout(r, retryDelay * 1000));
                i -= batchSize; // Retry this batch
                continue;
              }

              if (isQuota) {
                setAiAnalysisError(
                  `Daily Quota Reached for ${modelObj.name}. Try switching API keys or models.`,
                );
              } else if (
                err.message?.toLowerCase().includes("credit balance") ||
                err.message?.toLowerCase().includes("low to access")
              ) {
                setAiAnalysisError(
                  `Claude Error: Insufficient credits. Please check your Anthropic billing dashboard.`,
                );
              } else {
                setAiAnalysisError(
                  `AI Error: ${err.message || "Unknown error"}`,
                );
              }
              break; // Stop loop on fatal error or unhandled quota
            }
          }
          setIsAnalyzing(false);
          analysisLoopRef.current = false;
        }
      };
      runAnalysis();
    }
  }, [aiAnalysisEnabled, activeTab, enquiries, selectedAiModel]);

  const filteredEnquiries = enquiries.filter((e) => {
    const isIrrelevant =
      e.status === "irrelevant" || (e.aiAnalysis && !e.aiAnalysis.isRelevant);

    let matchesTab = false;
    if (activeTab === "new") {
      matchesTab = e.status === "new" || e.status === "read";
      // Hide irrelevant if spam filter is ON
      if (hideIrrelevant && isIrrelevant) matchesTab = false;
    } else if (activeTab === "hold" || activeTab === "onHold") {
      matchesTab = e.status === "hold" || e.status === "onHold";
    } else if (activeTab === "converted") {
      matchesTab = e.status === "converted";
    } else if (activeTab === "dismissed") {
      matchesTab = e.status === "dismissed" || e.status === "irrelevant";
      // Show irrelevant from Inbox if spam filter is ON
      if (
        hideIrrelevant &&
        (e.status === "new" || e.status === "read") &&
        isIrrelevant
      ) {
        matchesTab = true;
      }
    }

    if (!matchesTab) return false;

    const matchesSearch =
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.message && e.message.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    // Date Range Filter
    if (startDate || endDate) {
      const enquiryDate = new Date(e.date);
      if (startDate && enquiryDate < new Date(startDate)) return false;
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (enquiryDate > end) return false;
      }
    }

    return true;
  });

  const totalPages = Math.ceil(filteredEnquiries.length / RECORDS_PER_PAGE);
  const paginatedEnquiries = filteredEnquiries.slice(
    (currentPage - 1) * RECORDS_PER_PAGE,
    currentPage * RECORDS_PER_PAGE,
  );

  const enquiriesInTab = enquiries.filter((e) => {
    const isIrrelevant =
      e.status === "irrelevant" || (e.aiAnalysis && !e.aiAnalysis.isRelevant);

    if (activeTab === "new") {
      const isBase = e.status === "new" || e.status === "read";
      if (hideIrrelevant && isIrrelevant) return false;
      return isBase;
    }
    if (activeTab === "hold") return e.status === "hold";
    if (activeTab === "converted") return e.status === "converted";
    if (activeTab === "dismissed") {
      const isBase = e.status === "dismissed" || e.status === "irrelevant";
      if (
        hideIrrelevant &&
        (e.status === "new" || e.status === "read") &&
        isIrrelevant
      )
        return true;
      return isBase;
    }
    return false;
  });

  const totalInTabCount = enquiriesInTab.length;
  const analyzedInTabCount = enquiriesInTab.filter((e) => e.aiAnalysis).length;

  // Calculate how many are hidden from the current tab due to the SPAM filter
  const spamFilteredCount = enquiries.filter((e) => {
    const isBase =
      activeTab === "new" ? e.status === "new" || e.status === "read" : false;
    const isIrrelevant =
      e.status === "irrelevant" || (e.aiAnalysis && !e.aiAnalysis.isRelevant);
    return isBase && isIrrelevant && hideIrrelevant;
  }).length;

  const openLeadModal = (enquiry) => {
    setSelectedEnquiry(enquiry);
    setPromoteFormData({
      name: enquiry.name,
      email: enquiry.email,
      phone: enquiry.phone,
      website: enquiry.website,
      leadType: "Hot",
      country: enquiry.countryName || enquiry.country || "India",
      countryCode: enquiry.countryCode || "+91",
      notes: enquiry.message,
    });
    setLeadModalOpen(true);
  };

  const confirmLeadConversion = async () => {
    if (!selectedEnquiry) return;

    const isValid = validateForm(promoteFormData, {
      name: {
        required: true,
        minLength: 2,
        label: "Full Name",
        pattern: /^[a-zA-Z\s]+$/,
        errorMessage: "Full Name must contain only alphabets.",
      },
      email: {
        required: false,
        pattern: EMAIL_PATTERN,
        label: "Email",
        errorMessage: "Enter a valid email address.",
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
      // Pass the data to the parent handler
      onPromote(
        {
          ...promoteFormData,
          status: "Lead", // Ensure handleAddClient knows it's a lead
        },
        selectedEnquiry.id || selectedEnquiry.uuid,
      );

      setLeadModalOpen(false);
      setSelectedEnquiry(null);
      // toast is now handled in App.jsx handlers
    } catch (err) {
      toast.error("Lead Creation Failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openHoldModal = (enquiry) => {
    setSelectedEnquiry(enquiry);
    setHoldModalOpen(true);
    setHoldReason("");
  };

  const confirmHold = async () => {
    if (!selectedEnquiry) return;
    if (!holdReason.trim()) return;
    setIsSubmitting(true);
    try {
      await onUpdate({
        ...selectedEnquiry,
        status: "hold",
        holdReason: holdReason,
      });
      setHoldModalOpen(false);
      setSelectedEnquiry(null);
      setHoldReason("");
    } catch (err) {
      console.error("Hold failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSimulateSubmit = async (e) => {
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
        required: false,
        pattern: EMAIL_PATTERN,
        label: "Email",
        errorMessage: "Enter a valid email address.",
      },
      phone: {
        required: true,
        minLength: 10,
        label: "Phone Number",
        pattern: /^\d+$/,
        errorMessage: "Phone Number must be at least 10 digits.",
      },
      message: { required: true, label: "Note / Requirement Briefing" },
    });

    if (!isValid) return;

    setIsSubmitting(true);
    try {
      await onAdd({ ...formData });
      setShowSimulateForm(false);
      setFormData({ name: "", email: "", phone: "", website: "", source: "", message: "" });
      setActiveTab("new");
    } catch (err) {
      console.error("Add Enquiry Failed:", err);
      toast.error("Failed to add enquiry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (enquiry) => {
    setEditFormData({
      id: enquiry.id,
      name: enquiry.name || "",
      email: enquiry.email || "",
      phone: enquiry.phone || "",
      website: enquiry.website || "",
      source: enquiry.source || "",
      message: enquiry.message || "",
    });
    setShowEditForm(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    const isValid = validateForm(editFormData, {
      name: {
        required: true,
        minLength: 2,
        label: "Full Name",
        pattern: /^[a-zA-Z\s]+$/,
        errorMessage: "Full Name must contain only alphabets.",
      },
      email: {
        required: false,
        pattern: EMAIL_PATTERN,
        label: "Email",
        errorMessage: "Enter a valid email address.",
      },
      phone: {
        required: true,
        minLength: 10,
        label: "Phone Number",
        pattern: /^\d+$/,
        errorMessage: "Phone Number must be at least 10 digits.",
      },
      message: { required: true, label: "Note / Requirement Briefing" },
    });

    if (!isValid) return;

    setIsSubmitting(true);
    try {
      const success = await onEdit({ ...editFormData });
      if (success) {
        setShowEditForm(false);
      }
    } catch (err) {
      console.error("Edit Enquiry Failed:", err);
      toast.error("Failed to edit enquiry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalEnquiriesCount = enquiries.filter(e => e.status !== "dismissed" && e.status !== "irrelevant").length;
  const inboxCount = enquiries.filter(e => e.status === "new" || e.status === "read").length;
  const holdCount = enquiries.filter(e => e.status === "hold").length;
  const convertedCount = enquiries.filter(e => e.status === "converted").length;

  return (
    <div className="w-full relative">
      <div className="space-y-5 animate-fade-in w-full">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="max-w-2xl">
            <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-primary tracking-tight mb-2 flex items-center gap-2">
              Enquiry Hub
            </h2>
            <p className="text-xs md:text-sm text-textMuted font-medium leading-relaxed">
              Manage and qualify all incoming business enquiries.
            </p>
          </div>
          <div className="w-full lg:w-auto flex flex-col sm:flex-row items-center gap-3">
            {activeTab === "dismissed" && totalInTabCount > 0 && (
              <button
                onClick={() => setShowDeleteAllModal(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-[#FFF1F2] text-[#F43F5E] border border-[#FFE4E6] rounded-2xl hover:bg-[#FFE4E6] transition-all text-[13px] font-bold tracking-wider shadow-sm active:scale-95 group"
              >
                <Trash2 size={16} strokeWidth={2.5} className="group-hover:scale-110 transition-transform" />
                Clear All
              </button>
            )}
            <button
              onClick={() => setShowSimulateForm(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-[#18254D] text-white rounded-2xl hover:bg-slate-800 transition-all text-[13px] font-bold tracking-wider shadow-lg active:scale-95 group"
            >
              <Plus size={16} strokeWidth={2.5} className="group-hover:rotate-90 transition-transform" />
              New Enquiry
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Total Card */}
          <div className="bg-white p-3 sm:p-5 rounded-2xl shadow-sm border border-slate-200 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="p-2 sm:p-3 rounded-full bg-slate-100 text-slate-500 shrink-0">
                <Inbox className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="text-slate-500 text-[10px] sm:text-xs font-semibold truncate">Total Active</h3>
                <p className="text-lg sm:text-2xl font-bold text-[#18254D] leading-none mt-1">{totalEnquiriesCount}</p>
              </div>
            </div>
          </div>
          {/* Inbox Card */}
          <div className="bg-white p-3 sm:p-5 rounded-2xl shadow-sm border border-slate-200 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="p-2 sm:p-3 rounded-full bg-blue-50 text-blue-500 shrink-0">
                <Mail className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="text-slate-500 text-[10px] sm:text-xs font-semibold truncate">Inbox</h3>
                <p className="text-lg sm:text-2xl font-bold text-[#18254D] leading-none mt-1">{inboxCount}</p>
              </div>
            </div>
          </div>
          {/* On Hold Card */}
          <div className="bg-white p-3 sm:p-5 rounded-2xl shadow-sm border border-slate-200 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="p-2 sm:p-3 rounded-full bg-amber-50 text-amber-500 shrink-0">
                <PauseCircle className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="text-slate-500 text-[10px] sm:text-xs font-semibold truncate">On Hold</h3>
                <p className="text-lg sm:text-2xl font-bold text-[#18254D] leading-none mt-1">{holdCount}</p>
              </div>
            </div>
          </div>
          {/* Converted Card */}
          <div className="bg-white p-3 sm:p-5 rounded-2xl shadow-sm border border-slate-200 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="p-2 sm:p-3 rounded-full bg-green-50 text-green-500 shrink-0">
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="text-slate-500 text-[10px] sm:text-xs font-semibold truncate">Converted</h3>
                <p className="text-lg sm:text-2xl font-bold text-[#18254D] leading-none mt-1">{convertedCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Control Bar */}
        <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm relative z-[60]">
          <div className="flex flex-col md:flex-row gap-2 w-full items-center">
            {/* 1. Search Bar */}
            <div className="relative w-full md:w-64 flex-none transition-all duration-300 md:order-1">
              <Search
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search enquiries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-[38px] pl-11 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
              />
            </div>

            {/* 2. Filters Button */}
            <div className="relative w-full md:w-auto flex-none md:ml-auto md:order-3" ref={filterButtonRef}>
              <button
                onClick={() => setIsFilterPopupOpen(!isFilterPopupOpen)}
                className={`w-full md:w-auto h-[38px] flex items-center justify-center gap-2.5 px-6 py-2 rounded-xl text-[12px] font-bold tracking-widest transition-all shadow-sm active:scale-95 group border ${
                  startDate || endDate || aiAnalysisEnabled
                    ? "bg-indigo-50 border-indigo-500 text-indigo-600"
                    : "bg-slate-50 border-slate-100 text-[#18254D] hover:bg-white hover:border-slate-200 shadow-slate-200/50"
                }`}
              >
                <Filter
                  size={14}
                  className={startDate || endDate || aiAnalysisEnabled ? "text-indigo-600" : "text-slate-400"}
                />
                <span>FILTERS</span>
                {(startDate || endDate || aiAnalysisEnabled) && (
                  <span className="flex items-center justify-center w-5 h-5 bg-indigo-600 text-white text-[10px] font-black rounded-full ml-1 shadow-sm">
                    {[!!startDate, !!endDate, aiAnalysisEnabled].filter(Boolean).length}
                  </span>
                )}
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-300 ${isFilterPopupOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* Filters Popup - Portaled */}
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
                        className="bg-white border border-slate-200 shadow-[0_20px_50px_rgba(24,37,77,0.15)] overflow-hidden animate-fade-in-up ring-1 ring-black/5 rounded-3xl pointer-events-auto flex flex-col animate-pop"
                        style={filterPopupStyle}
                        onWheel={(e) => e.stopPropagation()}
                        onTouchMove={(e) => e.stopPropagation()}
                      >
                        {/* Sticky Header */}
                        <div className="flex-none p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 relative z-10">
                          <div className="flex items-center gap-2">
                            <Filter size={14} className="text-[#18254D]" />
                            <h3 className="text-[11px] font-black text-[#18254D] tracking-wider uppercase">
                              Filter Enquiries
                            </h3>
                          </div>
                          {(startDate || endDate || aiAnalysisEnabled) && (
                            <button
                              onClick={() => {
                                setStartDate("");
                                setEndDate("");
                                setAiAnalysisEnabled(false);
                                setHideIrrelevant(false);
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
                          {/* AI Settings Section - Only show in Inbox tab */}
                          {activeTab === "new" && (
                            <>
                              <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 tracking-wider uppercase ml-1">
                                  AI Analysis
                                </label>
                                <div className="space-y-2">
                                  {/* AI Toggle */}
                                  <label className="flex items-center justify-between p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl cursor-pointer group hover:bg-indigo-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${aiAnalysisEnabled ? "bg-indigo-500 text-white shadow-sm" : "bg-white border border-slate-200 text-slate-400"}`}>
                                        <Sparkles size={14} />
                                      </div>
                                      <div>
                                        <p className="text-[13px] font-bold text-[#18254D]">Smart Analysis</p>
                                        <p className="text-[10px] font-medium text-slate-500">Auto-score & categorize</p>
                                      </div>
                                    </div>
                                    <div className={`w-10 h-6 rounded-full p-1 transition-colors ${aiAnalysisEnabled ? "bg-indigo-500" : "bg-slate-200"}`}>
                                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${aiAnalysisEnabled ? "translate-x-4" : "translate-x-0"}`} />
                                    </div>
                                    <input
                                      type="checkbox"
                                      className="hidden"
                                      checked={aiAnalysisEnabled}
                                      onChange={(e) => setAiAnalysisEnabled(e.target.checked)}
                                    />
                                  </label>

                                  {/* Spam Filter Toggle */}
                                  {aiAnalysisEnabled && (
                                    <label className="flex items-center justify-between p-3 bg-rose-50/50 border border-rose-100 rounded-xl cursor-pointer group hover:bg-rose-50 transition-colors animate-fade-in-up">
                                      <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${hideIrrelevant ? "bg-rose-500 text-white shadow-sm" : "bg-white border border-slate-200 text-slate-400"}`}>
                                          <ShieldAlert size={14} />
                                        </div>
                                        <div>
                                          <p className="text-[13px] font-bold text-[#18254D]">Filter Irrelevant</p>
                                          <p className="text-[10px] font-medium text-slate-500">Hide spam & promotions</p>
                                        </div>
                                      </div>
                                      <div className={`w-10 h-6 rounded-full p-1 transition-colors ${hideIrrelevant ? "bg-rose-500" : "bg-slate-200"}`}>
                                        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${hideIrrelevant ? "translate-x-4" : "translate-x-0"}`} />
                                      </div>
                                      <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={hideIrrelevant}
                                        onChange={(e) => setHideIrrelevant(e.target.checked)}
                                      />
                                    </label>
                                  )}
                                </div>
                              </div>

                              {/* AI Provider Settings (Only visible if AI is enabled) */}
                              {aiAnalysisEnabled && aiModels.length > 0 && (
                                <div className="space-y-1.5 animate-fade-in-up">
                                  <label className="text-[10px] font-black text-slate-400 tracking-wider uppercase ml-1 flex items-center gap-1.5">
                                    <Layout size={12} /> Model Selection
                                  </label>
                                  <div className="relative" ref={aiModelRef}>
                                    <button
                                      type="button"
                                      onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                                      className="w-full h-11 flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold shadow-sm hover:border-[#18254D]/30 transition-all text-[#18254D]"
                                    >
                                      <span className={selectedAiModel ? "text-[#18254D]" : "text-slate-400 font-medium"}>
                                        {aiModels.find((m) => m.aimodel_id === selectedAiModel)?.name || "Default Auto"}
                                      </span>
                                      <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${isModelDropdownOpen ? "rotate-180" : ""}`} />
                                    </button>

                                    {isModelDropdownOpen && createPortal(
                                      <>
                                        <div className="fixed inset-0 z-[100000]" onClick={() => setIsModelDropdownOpen(false)} />
                                        <div className="absolute bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden z-[100001] animate-pop origin-top" style={modelDropdownStyle}>
                                          <div className="bg-[#18254D] px-4 py-2.5 border-b border-white/10">
                                            <p className="text-[10px] font-bold text-white/50 tracking-wider uppercase">Available Models</p>
                                          </div>
                                          <div className="max-h-[200px] overflow-y-auto custom-scrollbar p-1.5">
                                            {aiModels.map((model) => (
                                              <button
                                                key={model.aimodel_id}
                                                type="button"
                                                onClick={() => {
                                                  setSelectedAiModel(model.aimodel_id);
                                                  setIsModelDropdownOpen(false);
                                                }}
                                                className={`w-full text-left px-3 py-2 text-xs font-semibold tracking-wider transition-all rounded-xl flex items-center justify-between ${selectedAiModel === model.aimodel_id ? "bg-indigo-50 text-indigo-700" : "text-[#18254D] hover:bg-slate-50"}`}
                                              >
                                                <span>{model.name}</span>
                                                {model.isDefault && (
                                                  <span className="text-[9px] bg-slate-200/50 text-slate-500 px-1.5 py-0.5 rounded-full uppercase tracking-wider">Default</span>
                                                )}
                                              </button>
                                            ))}
                                          </div>
                                        </div>
                                      </>,
                                      document.body
                                    )}
                                  </div>
                                  {aiAnalysisError && (
                                    <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2">
                                      <ShieldAlert size={14} className="text-red-500 shrink-0 mt-0.5" />
                                      <p className="text-xs text-red-600 font-medium leading-relaxed">{aiAnalysisError}</p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </>
                          )}

                          {/* Date Range Section */}
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 tracking-wider uppercase ml-1 flex items-center gap-1.5">
                              <Calendar size={12} /> Date Range
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              <DatePicker label="From" value={startDate} onChange={setStartDate} />
                              <DatePicker label="To" value={endDate} onChange={setEndDate} />
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
                  document.body
                )}
            </div>

            {/* Analysis Progress / Stats (Inbox only) */}
            {activeTab === "new" && (
              <div className="hidden lg:flex items-center px-4 md:order-2">
                {aiAnalysisEnabled && (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {isAnalyzing && (
                        <Loader2 size={12} className="animate-spin text-indigo-500" strokeWidth={3} />
                      )}
                      <span className="text-[11px] font-bold text-slate-600">
                        {analyzedInTabCount} of {totalInTabCount}
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                        Analyzed
                      </span>
                    </div>
                    {hideIrrelevant && spamFilteredCount > 0 && (
                      <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
                        <span className="text-[11px] font-bold text-rose-500">{spamFilteredCount}</span>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Hidden</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* View Toggles */}
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-2 pt-2">
          <button onClick={() => setActiveTab("new")} className={`px-4 py-2 sm:px-5 sm:py-2 rounded-full text-[12px] sm:text-[13px] font-bold flex items-center gap-2 transition-all cursor-pointer border ${activeTab === "new" ? "bg-[#EFF6FF] text-[#3B82F6] border-[#DBEAFE]" : "bg-white text-[#3B82F6] border-[#DBEAFE] hover:bg-[#EFF6FF]"}`}>
            Inbox
          </button>
          <button onClick={() => setActiveTab("hold")} className={`px-4 py-2 sm:px-5 sm:py-2 rounded-full text-[12px] sm:text-[13px] font-bold flex items-center gap-2 transition-all cursor-pointer border ${activeTab === "hold" ? "bg-[#FFF7ED] text-[#F97316] border-[#FFEDD5]" : "bg-white text-[#F97316] border-[#FFEDD5] hover:bg-[#FFF7ED]"}`}>
            On Hold
          </button>
          <button onClick={() => setActiveTab("converted")} className={`px-4 py-2 sm:px-5 sm:py-2 rounded-full text-[12px] sm:text-[13px] font-bold flex items-center gap-2 transition-all cursor-pointer border ${activeTab === "converted" ? "bg-[#F0FDF4] text-[#16A34A] border-[#DCFCE7]" : "bg-white text-[#16A34A] border-[#DCFCE7] hover:bg-[#F0FDF4]"}`}>
            Converted
          </button>
          <button onClick={() => setActiveTab("dismissed")} className={`px-4 py-2 sm:px-5 sm:py-2 rounded-full text-[12px] sm:text-[13px] font-bold flex items-center gap-2 transition-all cursor-pointer border ${activeTab === "dismissed" ? "bg-[#FFF1F2] text-[#F43F5E] border-[#FFE4E6]" : "bg-white text-[#F43F5E] border-[#FFE4E6] hover:bg-[#FFF1F2]"}`}>
            Dismissed
          </button>
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block bg-white rounded-3xl border border-slate-200 shadow-sm p-4 overflow-x-auto relative">
          <div className="min-w-[1000px]">
            <table className="w-full text-left border-separate border-spacing-y-2">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="pb-3 pt-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-y border-slate-100 first:border-l first:rounded-l-xl last:border-r last:rounded-r-xl w-[15%]">Enquiry Info</th>
                  <th className="pb-3 pt-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-y border-slate-100 w-[20%]">Contact Details</th>
                  <th className="pb-3 pt-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-y border-slate-100 w-[25%]">Message</th>
                  <th className="pb-3 pt-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-y border-slate-100 w-[10%]">Source</th>
                  <th className="pb-3 pt-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-y border-slate-100 w-[15%]">Created By</th>
                  <th className="pb-3 pt-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-y border-slate-100 last:border-r last:rounded-r-xl w-[15%] text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedEnquiries.map((enquiry) => (
                  <tr key={enquiry.id} onClick={() => { setSelectedEnquiry(enquiry); setShowDetailsModal(true); }} className="group bg-white hover:bg-slate-50/50 transition-colors shadow-sm border border-slate-100 rounded-xl hover:shadow-md cursor-pointer">
                    <td className="p-4 border-y border-slate-100 first:border-l first:rounded-l-xl">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center font-bold text-base border shadow-sm ${
                          activeTab === "hold" ? "bg-[#FFF7ED] text-[#F97316] border-[#FFEDD5]" :
                          activeTab === "converted" ? "bg-[#F0FDF4] text-[#16A34A] border-[#DCFCE7]" :
                          activeTab === "dismissed" ? "bg-[#FFF1F2] text-[#F43F5E] border-[#FFE4E6]" :
                          "bg-[#EFF6FF] text-[#3B82F6] border-[#DBEAFE]"
                        }`}>
                          {enquiry.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[13px] font-bold text-[#18254D] truncate">{enquiry.name}</span>
                          <span className="text-[11px] font-semibold text-slate-500 mt-0.5">
                            {new Date(enquiry.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 border-y border-slate-100">
                      <div className="flex flex-col gap-1.5 text-[12px] font-semibold text-slate-500">
                        <div className="flex items-center gap-2 hover:text-[#18254D] transition-colors"><Mail size={12} className="text-slate-400"/> <span className="truncate">{enquiry.email || "N/A"}</span></div>
                        <div className="flex items-center gap-2 hover:text-[#18254D] transition-colors"><Phone size={12} className="text-slate-400"/> <span className="truncate">{enquiry.phone || "N/A"}</span></div>
                      </div>
                    </td>
                    <td className="p-4 border-y border-slate-100">
                      <div className="flex flex-col min-w-0">
                        <span className="text-[12px] font-medium text-slate-600 line-clamp-2 italic">"{enquiry.message}"</span>
                      </div>
                    </td>
                    <td className="p-4 border-y border-slate-100">
                      <div className="flex flex-col min-w-0 items-start">
                        {enquiry.source ? (
                          <span className="text-[10px] font-bold text-[#18254D] bg-slate-100 px-2 py-1 rounded-md uppercase flex items-center gap-1 w-fit">{getSourceIcon(enquiry.source)} {enquiry.source}</span>
                        ) : (
                          <span className="text-[10px] font-medium text-slate-400 px-2 py-1">N/A</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 border-y border-slate-100">
                      <div className="flex flex-col gap-2 items-start">
                        <div className="flex items-center gap-1.5 text-[12px] font-bold text-slate-600 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                          <Users size={12} className="text-slate-400" />
                          <span className="truncate max-w-[120px]">{enquiry.createdByName || "System"}</span>
                        </div>
                        {activeTab === "hold" && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#F97316] bg-[#FFF7ED] px-2 py-0.5 rounded border border-[#FFEDD5]">On Hold</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 border-y border-slate-100 last:border-r last:rounded-r-xl">
                      <div className="flex items-center justify-end gap-2">
                        {activeTab === "new" ? (
                          <>
                            <button onClick={(e) => { e.stopPropagation(); openLeadModal(enquiry); }} className="p-2 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg hover:bg-indigo-100 transition-all active:scale-90" title="Add to Lead"><CheckCircle size={16} /></button>
                            <button onClick={(e) => { e.stopPropagation(); openHoldModal(enquiry); }} className="p-2 bg-amber-50 text-amber-600 border border-amber-100 rounded-lg hover:bg-amber-100 transition-all active:scale-90" title="Hold"><PauseCircle size={16} /></button>
                            <button onClick={(e) => { e.stopPropagation(); onDismiss(enquiry.id); }} className="p-2 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg hover:bg-rose-100 transition-all active:scale-90" title="Dismiss"><UserX size={16} /></button>
                            <button onClick={(e) => { e.stopPropagation(); openEditModal(enquiry); }} className="p-2 bg-slate-50 text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100 transition-all active:scale-90" title="Edit"><Pencil size={16} /></button>
                          </>
                        ) : activeTab === "hold" ? (
                          <>
                            <button onClick={(e) => { e.stopPropagation(); onRestore(enquiry.id); }} className="p-2 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg hover:bg-blue-100 transition-all active:scale-90" title="Restore"><RefreshCcw size={16} /></button>
                            <button onClick={(e) => { e.stopPropagation(); onDismiss(enquiry.id); }} className="p-2 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg hover:bg-rose-100 transition-all active:scale-90" title="Dismiss"><UserX size={16} /></button>
                            <button onClick={(e) => { e.stopPropagation(); openEditModal(enquiry); }} className="p-2 bg-slate-50 text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100 transition-all active:scale-90" title="Edit"><Pencil size={16} /></button>
                          </>
                        ) : (
                          <>
                            <button onClick={(e) => { e.stopPropagation(); onRestore(enquiry.id); }} className="p-2 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg hover:bg-blue-100 transition-all active:scale-90" title="Restore"><RefreshCcw size={16} /></button>
                            <button onClick={(e) => { e.stopPropagation(); onDelete(enquiry.id); }} className="p-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-all active:scale-90" title="Delete Permanently"><Trash2 size={16} /></button>
                            <button onClick={(e) => { e.stopPropagation(); openEditModal(enquiry); }} className="p-2 bg-slate-50 text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100 transition-all active:scale-90" title="Edit"><Pencil size={16} /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {paginatedEnquiries.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-10 py-32 text-center">
                      <div className="text-slate-300 p-4 rounded-xl mb-4 flex items-center justify-center mx-auto">
                        <Inbox size={32} strokeWidth={1.5} />
                      </div>
                      <p className="text-[13px] font-bold text-[#18254D] tracking-wider">No Enquiries Found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Card List View */}
        <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-4">
          {paginatedEnquiries.map((enquiry) => (
            <div key={enquiry.id} onClick={() => { setSelectedEnquiry(enquiry); setShowDetailsModal(true); }} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center font-bold text-lg border-2 border-slate-50 shadow-md ${
                    activeTab === "hold" ? "bg-[#FFF7ED] text-[#F97316] border-[#FFEDD5]" :
                    activeTab === "converted" ? "bg-[#F0FDF4] text-[#16A34A] border-[#DCFCE7]" :
                    activeTab === "dismissed" ? "bg-[#FFF1F2] text-[#F43F5E] border-[#FFE4E6]" :
                    "bg-[#EFF6FF] text-[#3B82F6] border-[#DBEAFE]"
                  }`}>
                    {enquiry.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-[#18254D] truncate">{enquiry.name}</div>
                    <div className="text-[10px] font-bold text-slate-400 mt-0.5">
                      {new Date(enquiry.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                    <span className="truncate max-w-[100px]">{enquiry.createdByName || "System"}</span>
                    <Users size={12} className="text-slate-400" />
                  </div>
                  {activeTab === "hold" && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#F97316] bg-[#FFF7ED] px-2 py-0.5 rounded border border-[#FFEDD5]">On Hold</span>
                  )}
                </div>
              </div>

              <div className="mb-4 space-y-2">
                <div className="flex items-center gap-2 text-[12px] font-medium text-slate-500 hover:text-[#18254D]"><Mail size={12}/> <span className="truncate">{enquiry.email || "N/A"}</span></div>
                <div className="flex items-center gap-2 text-[12px] font-medium text-slate-500 hover:text-[#18254D]"><Phone size={12}/> <span className="truncate">{enquiry.phone || "N/A"}</span></div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mb-4">
                <p className="text-xs text-[#18254D]/80 font-medium italic line-clamp-3 mb-2">"{enquiry.message}"</p>
                {enquiry.source ? (
                  <span className="text-[10px] font-bold text-[#18254D] bg-white px-2 py-1 rounded-md uppercase flex items-center gap-1 w-fit border border-slate-200 shadow-sm">{getSourceIcon(enquiry.source)} {enquiry.source}</span>
                ) : (
                  <span className="text-[10px] font-medium text-slate-400 px-2 py-1">Source: N/A</span>
                )}
                {(activeTab === "hold" || activeTab === "dismissed") && enquiry.holdReason && (
                  <div className="mt-2 pt-2 border-t border-slate-200">
                    <p className="text-[10px] font-bold text-[#F97316] uppercase">Reason: {enquiry.holdReason}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                {activeTab === "new" ? (
                  <>
                    <button onClick={(e) => { e.stopPropagation(); openLeadModal(enquiry); }} className="p-2 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg hover:bg-indigo-100 transition-all active:scale-90" title="Add to Lead"><CheckCircle size={16} /></button>
                    <button onClick={(e) => { e.stopPropagation(); openHoldModal(enquiry); }} className="p-2 bg-amber-50 text-amber-600 border border-amber-100 rounded-lg hover:bg-amber-100 transition-all active:scale-90" title="Hold"><PauseCircle size={16} /></button>
                    <button onClick={(e) => { e.stopPropagation(); onDismiss(enquiry.id); }} className="p-2 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg hover:bg-rose-100 transition-all active:scale-90" title="Dismiss"><UserX size={16} /></button>
                    <button onClick={(e) => { e.stopPropagation(); openEditModal(enquiry); }} className="p-2 bg-slate-50 text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100 transition-all active:scale-90" title="Edit"><Pencil size={16} /></button>
                  </>
                ) : activeTab === "hold" ? (
                  <>
                    <button onClick={(e) => { e.stopPropagation(); onRestore(enquiry.id); }} className="p-2 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg hover:bg-blue-100 transition-all active:scale-90" title="Restore"><RefreshCcw size={16} /></button>
                    <button onClick={(e) => { e.stopPropagation(); onDismiss(enquiry.id); }} className="p-2 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg hover:bg-rose-100 transition-all active:scale-90" title="Dismiss"><UserX size={16} /></button>
                    <button onClick={(e) => { e.stopPropagation(); openEditModal(enquiry); }} className="p-2 bg-slate-50 text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100 transition-all active:scale-90" title="Edit"><Pencil size={16} /></button>
                  </>
                ) : (
                  <>
                    <button onClick={(e) => { e.stopPropagation(); onRestore(enquiry.id); }} className="p-2 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg hover:bg-blue-100 transition-all active:scale-90" title="Restore"><RefreshCcw size={16} /></button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(enquiry.id); }} className="p-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-all active:scale-90" title="Delete Permanently"><Trash2 size={16} /></button>
                    <button onClick={(e) => { e.stopPropagation(); openEditModal(enquiry); }} className="p-2 bg-slate-50 text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100 transition-all active:scale-90" title="Edit"><Pencil size={16} /></button>
                  </>
                )}
              </div>
            </div>
          ))}
          {paginatedEnquiries.length === 0 && (
            <div className="col-span-1 md:col-span-2 flex flex-col items-center justify-center py-10 bg-white rounded-3xl border border-slate-200 shadow-sm w-full">
              <Inbox size={22} className="text-slate-350 mb-2" />
              <p className="text-xs font-bold text-slate-400 tracking-wider uppercase">No enquiries</p>
            </div>
          )}
        </div>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8 mb-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-[#18254D] hover:border-[#18254D] disabled:opacity-30 disabled:hover:border-slate-200 disabled:hover:text-slate-400 transition-all shadow-sm active:scale-95 btn-animated"
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
                  className={`min-w-[32px] h-8 flex items-center justify-center rounded-lg text-sm font-black transition-all ${currentPage === pageNum
                      ? "bg-[#18254D] text-white shadow-lg shadow-slate-300 scale-110"
                      : "text-slate-400 hover:text-[#18254D] hover:bg-white"
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
            className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-[#18254D] hover:border-[#18254D] disabled:opacity-30 disabled:hover:border-slate-200 disabled:hover:text-slate-400 transition-all shadow-sm active:scale-95 btn-animated"
          >
            <ChevronRight size={16} strokeWidth={2.5} />
          </button>
        </div>
      )}


      {showSimulateForm &&
        createPortal(
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[99999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <div className="absolute inset-0" onClick={() => setShowSimulateForm(false)} />
            <div className="relative z-10 bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-pop flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
                <div>
                  <h3 className="text-base font-bold text-[#18254D] tracking-tight">
                    New Enquiry
                  </h3>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-0.5">
                    Manual Entry
                  </p>
                </div>
                <button
                  onClick={() => setShowSimulateForm(false)}
                  className="p-1.5 hover:bg-slate-200 rounded-xl text-slate-400 transition-all"
                >
                  <X size={18} />
                </button>
              </div>
              <form
                onSubmit={handleSimulateSubmit}
                className="p-6 space-y-5 overflow-y-auto no-scrollbar"
              >
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200"
                      placeholder="e.g. John Doe"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          name: e.target.value.replace(/[^a-zA-Z\s]/g, ""),
                        })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                        Email
                      </label>
                      <input
                        type="email"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200"
                        placeholder="e.g. john@gmail.com"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                        Phone <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200"
                        placeholder="e.g. 9876543210 "
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            phone: e.target.value.replace(/\D/g, ""),
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                        Website URL (Optional)
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200"
                        placeholder="e.g. www.example.com"
                        value={formData.website}
                        onChange={(e) =>
                          setFormData({ ...formData, website: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                        Source (Optional)
                      </label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsSourceDropdownOpen(!isSourceDropdownOpen)}
                          className="w-full h-10 flex items-center justify-between px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold shadow-sm hover:border-[#18254D]/30 transition-all text-[#18254D]"
                        >
                          <span className={formData.source ? "text-[#18254D]" : "text-slate-400 font-medium"}>
                            {formData.source || "Select a source..."}
                          </span>
                          <ChevronDown
                            size={16}
                            className={`text-slate-400 transition-transform duration-200 ${isSourceDropdownOpen ? "rotate-180" : ""}`}
                          />
                        </button>

                        {isSourceDropdownOpen && (
                          <>
                            <div
                              className="fixed inset-0 z-[80]"
                              onClick={() => setIsSourceDropdownOpen(false)}
                            />
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden z-[90] animate-pop origin-top">
                              <div className="bg-[#18254D] px-4 py-2.5 border-b border-white/10">
                                <p className="text-[10px] font-bold text-white/50 tracking-wider uppercase">
                                  Select Source
                                </p>
                              </div>
                              {/* Meta Ad */}
                              <button
                                type="button"
                                onClick={() => { setFormData({ ...formData, source: "Meta Ad (Insta/FB)" }); setIsSourceDropdownOpen(false); }}
                                className={`w-full text-left px-4 py-2.5 text-xs font-semibold tracking-wider transition-colors ${ formData.source === "Meta Ad (Insta/FB)" ? "bg-slate-100 text-[#18254D]" : "text-[#18254D] hover:bg-slate-50" }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" fill="#E1306C"/>
                                  </svg>
                                  <span>Meta Ad (Insta/FB)</span>
                                </div>
                              </button>

                              {/* LinkedIn */}
                              <button
                                type="button"
                                onClick={() => { setFormData({ ...formData, source: "LinkedIn" }); setIsSourceDropdownOpen(false); }}
                                className={`w-full text-left px-4 py-2.5 text-xs font-semibold tracking-wider transition-colors ${ formData.source === "LinkedIn" ? "bg-slate-100 text-[#18254D]" : "text-[#18254D] hover:bg-slate-50" }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" fill="#0077B5"/>
                                  </svg>
                                  <span>LinkedIn</span>
                                </div>
                              </button>

                              {/* Referral */}
                              <button
                                type="button"
                                onClick={() => { setFormData({ ...formData, source: "Referral" }); setIsSourceDropdownOpen(false); }}
                                className={`w-full text-left px-4 py-2.5 text-xs font-semibold tracking-wider transition-colors ${ formData.source === "Referral" ? "bg-slate-100 text-[#18254D]" : "text-[#18254D] hover:bg-slate-50" }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <Users size={13} className="text-[#8B5CF6]" />
                                  <span>Referral</span>
                                </div>
                              </button>

                              {/* Selyst */}
                              <button
                                type="button"
                                onClick={() => { setFormData({ ...formData, source: "Selyst" }); setIsSourceDropdownOpen(false); }}
                                className={`w-full text-left px-4 py-2.5 text-xs font-semibold tracking-wider transition-colors ${ formData.source === "Selyst" ? "bg-slate-100 text-[#18254D]" : "text-[#18254D] hover:bg-slate-50" }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <Globe size={13} className="text-[#F97316]" />
                                  <span>Selyst</span>
                                </div>
                              </button>

                              {/* eParivartan */}
                              <button
                                type="button"
                                onClick={() => { setFormData({ ...formData, source: "eParivartan" }); setIsSourceDropdownOpen(false); }}
                                className={`w-full text-left px-4 py-2.5 text-xs font-semibold tracking-wider transition-colors ${ formData.source === "eParivartan" ? "bg-slate-100 text-[#18254D]" : "text-[#18254D] hover:bg-slate-50" }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <img src={favIcon} alt="eParivartan" className="w-3.5 h-3.5 object-contain rounded-sm" />
                                  <span>eParivartan</span>
                                </div>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                      Note / Requirement Briefing <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={4}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200 resize-none animate-pop"
                      placeholder="Describe the enquiry or message..."
                      value={formData.message}
                      onChange={(e) =>
                        setFormData({ ...formData, message: e.target.value })
                      }
                    />
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
                        <span>Adding Enquiry...</span>
                        <Loader2 size={16} className="animate-spin" />
                      </>
                    ) : (
                      <>
                        <span>Add Enquiry</span>
                        <Send
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
          document.body,
        )}

      {showEditForm &&
        createPortal(
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[99999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <div className="absolute inset-0" onClick={() => setShowEditForm(false)} />
            <div className="relative z-10 bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-pop flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
                <div>
                  <h3 className="text-base font-bold text-[#18254D] tracking-tight">
                    Edit Enquiry
                  </h3>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-0.5">
                    Update details
                  </p>
                </div>
                <button
                  onClick={() => setShowEditForm(false)}
                  className="p-1.5 hover:bg-slate-200 rounded-xl text-slate-400 transition-all"
                >
                  <X size={18} />
                </button>
              </div>
              <form
                onSubmit={handleEditSubmit}
                className="p-6 space-y-5 overflow-y-auto no-scrollbar"
              >
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200"
                      placeholder="e.g. John Doe"
                      value={editFormData.name}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          name: e.target.value.replace(/[^a-zA-Z\s]/g, ""),
                        })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                        Email
                      </label>
                      <input
                        type="email"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200"
                        placeholder="e.g. john@gmail.com"
                        value={editFormData.email}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, email: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                        Phone <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200"
                        placeholder="e.g. 9876543210"
                        value={editFormData.phone}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            phone: e.target.value.replace(/\D/g, ""),
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                        Website URL (Optional)
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200"
                        placeholder="e.g. www.example.com"
                        value={editFormData.website}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, website: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                        Source (Optional)
                      </label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsEditSourceDropdownOpen(!isEditSourceDropdownOpen)}
                          className="w-full h-10 flex items-center justify-between px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold shadow-sm hover:border-[#18254D]/30 transition-all text-[#18254D]"
                        >
                          <span className={editFormData.source ? "text-[#18254D]" : "text-slate-400 font-medium"}>
                            {editFormData.source || "Select a source..."}
                          </span>
                          <ChevronDown
                            size={16}
                            className={`text-slate-400 transition-transform duration-200 ${isEditSourceDropdownOpen ? "rotate-180" : ""}`}
                          />
                        </button>

                        {isEditSourceDropdownOpen && (
                          <>
                            <div
                              className="fixed inset-0 z-[80]"
                              onClick={() => setIsEditSourceDropdownOpen(false)}
                            />
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden z-[90] animate-pop origin-top">
                              <div className="bg-[#18254D] px-4 py-2.5 border-b border-white/10">
                                <p className="text-[10px] font-bold text-white/50 tracking-wider uppercase">
                                  Select Source
                                </p>
                              </div>
                              {/* Meta Ad */}
                              <button
                                type="button"
                                onClick={() => { setEditFormData({ ...editFormData, source: "Meta Ad (Insta/FB)" }); setIsEditSourceDropdownOpen(false); }}
                                className={`w-full text-left px-4 py-2.5 text-xs font-semibold tracking-wider transition-colors ${ editFormData.source === "Meta Ad (Insta/FB)" ? "bg-slate-100 text-[#18254D]" : "text-[#18254D] hover:bg-slate-50" }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" fill="#E1306C"/>
                                  </svg>
                                  <span>Meta Ad (Insta/FB)</span>
                                </div>
                              </button>

                              {/* LinkedIn */}
                              <button
                                type="button"
                                onClick={() => { setEditFormData({ ...editFormData, source: "LinkedIn" }); setIsEditSourceDropdownOpen(false); }}
                                className={`w-full text-left px-4 py-2.5 text-xs font-semibold tracking-wider transition-colors ${ editFormData.source === "LinkedIn" ? "bg-slate-100 text-[#18254D]" : "text-[#18254D] hover:bg-slate-50" }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0h.003z" fill="#0077B5"/>
                                  </svg>
                                  <span>LinkedIn</span>
                                </div>
                              </button>

                              {/* Referral */}
                              <button
                                type="button"
                                onClick={() => { setEditFormData({ ...editFormData, source: "Referral" }); setIsEditSourceDropdownOpen(false); }}
                                className={`w-full text-left px-4 py-2.5 text-xs font-semibold tracking-wider transition-colors ${ editFormData.source === "Referral" ? "bg-slate-100 text-[#18254D]" : "text-[#18254D] hover:bg-slate-50" }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <Users size={13} className="text-[#8B5CF6]" />
                                  <span>Referral</span>
                                </div>
                              </button>

                              {/* Selyst */}
                              <button
                                type="button"
                                onClick={() => { setEditFormData({ ...editFormData, source: "Selyst" }); setIsEditSourceDropdownOpen(false); }}
                                className={`w-full text-left px-4 py-2.5 text-xs font-semibold tracking-wider transition-colors ${ editFormData.source === "Selyst" ? "bg-slate-100 text-[#18254D]" : "text-[#18254D] hover:bg-slate-50" }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <Globe size={13} className="text-[#F97316]" />
                                  <span>Selyst</span>
                                </div>
                              </button>

                              {/* eParivartan */}
                              <button
                                type="button"
                                onClick={() => { setEditFormData({ ...editFormData, source: "eParivartan" }); setIsEditSourceDropdownOpen(false); }}
                                className={`w-full text-left px-4 py-2.5 text-xs font-semibold tracking-wider transition-colors ${ editFormData.source === "eParivartan" ? "bg-slate-100 text-[#18254D]" : "text-[#18254D] hover:bg-slate-50" }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <img src={favIcon} alt="eParivartan" className="w-3.5 h-3.5 object-contain rounded-sm" />
                                  <span>eParivartan</span>
                                </div>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                      Note / Requirement Briefing <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={4}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200 resize-none animate-pop"
                      placeholder="Describe the enquiry or message..."
                      value={editFormData.message}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, message: e.target.value })
                      }
                    />
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
                        <span>Saving Changes...</span>
                        <Loader2 size={16} className="animate-spin" />
                      </>
                    ) : (
                      <>
                        <span>Save Changes</span>
                        <Send
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
          document.body,
        )}


      {/* Details Modal */}
      {showDetailsModal && selectedEnquiry && createPortal(
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 sm:p-6">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
            onClick={() => { setShowDetailsModal(false); setSelectedEnquiry(null); }}
          />
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden relative z-10 animate-fade-in-up flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 font-bold text-xl shadow-sm">
                  {selectedEnquiry.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-[#18254D]">{selectedEnquiry.name}</h2>
                  <p className="text-xs font-medium text-slate-500 mt-0.5">
                    {new Date(selectedEnquiry.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setShowDetailsModal(false); setSelectedEnquiry(null); }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>
            
            <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-2 flex items-center gap-1.5">
                    <Phone size={12} /> Phone Number
                  </p>
                  <p className="text-sm font-semibold text-[#18254D] break-all">
                    {selectedEnquiry.phone || "N/A"}
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-2 flex items-center gap-1.5">
                    <Mail size={12} /> Email
                  </p>
                  <p className="text-sm font-semibold text-[#18254D] break-all">
                    {selectedEnquiry.email || "N/A"}
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-2 flex items-center gap-1.5">
                    <ShieldAlert size={12} /> AI Status
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    {selectedEnquiry.aiAnalysis ? (
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-black tracking-widest border uppercase ${selectedEnquiry.aiAnalysis.isRelevant ? "bg-[#F0FDF4] border-[#DCFCE7] text-[#16A34A]" : "bg-[#FFF1F2] border-[#FFE4E6] text-[#F43F5E]"}`}>
                        {selectedEnquiry.aiAnalysis.isRelevant ? (selectedEnquiry.aiAnalysis.category || "Relevant") : "Irrelevant"}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md uppercase tracking-wider border border-slate-200">
                        Pending AI
                      </span>
                    )}
                    {selectedEnquiry.status === "hold" && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#F97316] bg-[#FFF7ED] px-2.5 py-1 rounded-md border border-[#FFEDD5]">
                        On Hold
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-2 flex items-center gap-1.5">
                    <Users size={12} /> Created By
                  </p>
                  <p className="text-sm font-semibold text-[#18254D] break-all">
                    {selectedEnquiry.createdByName || "System"}
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-2 flex items-center gap-1.5">
                    <Share2 size={12} /> Source
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    {selectedEnquiry.source ? (
                      <span className="text-[10px] font-bold text-[#18254D] bg-white px-2 py-1 rounded-md uppercase flex items-center gap-1 border border-slate-200 shadow-sm">
                        {getSourceIcon(selectedEnquiry.source)} {selectedEnquiry.source}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md uppercase tracking-wider border border-slate-200">
                        N/A
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase flex items-center gap-1.5">
                    <MessageCircle size={12} /> Message
                  </p>
                </div>
                <p className="text-sm text-[#18254D] leading-relaxed whitespace-pre-wrap font-medium">
                  {selectedEnquiry.message || "N/A"}
                </p>
              </div>

              {(selectedEnquiry.status === "hold" || selectedEnquiry.status === "dismissed") && selectedEnquiry.holdReason && (
                <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
                  <p className="text-[10px] font-black tracking-widest text-orange-400 uppercase mb-2 flex items-center gap-1.5"><AlertTriangle size={12} /> Reason</p>
                  <p className="text-sm font-semibold text-orange-700">{selectedEnquiry.holdReason}</p>
                </div>
              )}
            </div>

          </div>
        </div>,
        document.body
      )}

      {leadModalOpen &&
        createPortal(
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[99999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <div className="absolute inset-0" onClick={() => setLeadModalOpen(false)} />
            <div className="relative z-10 bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-pop flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#EFF6FF] text-[#3B82F6] rounded-xl flex items-center justify-center border border-[#DBEAFE] shadow-sm">
                    <Plus size={16} />
                  </div>
                  <h3 className="text-base font-bold text-[#18254D] tracking-tight">
                    Add to Lead
                  </h3>
                </div>
                <button
                  onClick={() => setLeadModalOpen(false)}
                  className="p-1.5 hover:bg-slate-200 rounded-xl text-slate-400 transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto no-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Doe"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200"
                      value={promoteFormData.name}
                      onChange={(e) =>
                        setPromoteFormData({
                          ...promoteFormData,
                          name: e.target.value.replace(/[^a-zA-Z\s]/g, ""),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                      Email ID
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. john@gmail.com"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200"
                      value={promoteFormData.email}
                      onChange={(e) =>
                        setPromoteFormData({
                          ...promoteFormData,
                          email: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <SearchableDropdown
                      label={
                        <span>
                          Country Code <span className="text-rose-500">*</span>
                        </span>
                      }
                      options={countries.map((c) => ({
                        name: `${c.name} (${c.code})`,
                        value: c.name,
                        code: c.code,
                      }))}
                      value={promoteFormData.country}
                      onChange={(val) => {
                        const selectedCountry = countries.find(c => c.name === val);
                        setPromoteFormData({
                          ...promoteFormData,
                          country: selectedCountry ? selectedCountry.name : "",
                          countryCode: selectedCountry ? selectedCountry.code : ""
                        });
                      }}
                      placeholder="Search country..."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                      Phone Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9876543210"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200"
                      value={promoteFormData.phone}
                      onChange={(e) =>
                        setPromoteFormData({
                          ...promoteFormData,
                          phone: e.target.value.replace(/\D/g, ""),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                      Website URL (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. www.google.com"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200"
                      value={promoteFormData.website}
                      onChange={(e) =>
                        setPromoteFormData({
                          ...promoteFormData,
                          website: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                    Lead Status <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setIsEnquiryStatusDropdownOpen(
                          !isEnquiryStatusDropdownOpen,
                        )
                      }
                      className="w-full h-10 flex items-center justify-between px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold shadow-sm hover:border-[#18254D]/30 transition-all text-[#18254D]"
                    >
                      <span>
                        {promoteFormData.leadType || "Select Status"}
                      </span>
                      <ChevronDown
                        size={16}
                        className={`text-slate-400 transition-transform ${isEnquiryStatusDropdownOpen ? "rotate-180" : ""
                          }`}
                      />
                    </button>

                    {isEnquiryStatusDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-[80]"
                          onClick={() => setIsEnquiryStatusDropdownOpen(false)}
                        />
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden z-[90] animate-pop origin-top">
                          <div className="bg-[#18254D] px-4 py-2.5 border-b border-white/10">
                            <p className="text-[10px] font-bold text-white/50 tracking-wider uppercase">
                              Select Status
                            </p>
                          </div>
                          {["Hot", "Warm", "Cold"].map((status) => (
                            <button
                              key={`enq-status-${status}`}
                              type="button"
                              onClick={() => {
                                setPromoteFormData({
                                  ...promoteFormData,
                                  leadType: status,
                                });
                                setIsEnquiryStatusDropdownOpen(false);
                              }}
                              className={`w-full text-left px-4 py-2.5 text-xs font-semibold tracking-wider transition-colors ${promoteFormData.leadType === status
                                  ? "bg-slate-100 text-[#18254D]"
                                  : "text-[#18254D] hover:bg-slate-50"
                                }`}
                            >
                              <div className="flex items-center gap-2">
                                {status === "Hot" && (
                                  <Flame size={12} className="text-[#F43F5E]" />
                                )}
                                {status === "Warm" && (
                                  <Sun size={12} className="text-[#F97316]" />
                                )}
                                {status === "Cold" && (
                                  <Snowflake size={12} className="text-[#3B82F6]" />
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

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                    Enquiry Message / Note
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Enter briefing or message..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200 resize-none"
                    value={promoteFormData.notes}
                    onChange={(e) =>
                      setPromoteFormData({
                        ...promoteFormData,
                        notes: e.target.value,
                      })
                    }
                  />
                </div>

                <button
                  type="button"
                  onClick={confirmLeadConversion}
                  disabled={isSubmitting}
                  className="w-full h-12 bg-[#18254D] text-white rounded-xl text-xs font-bold tracking-wider shadow-lg active:scale-[0.98] transition-all hover:bg-slate-800 flex items-center justify-center gap-2 btn-animated disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <span>Adding Lead...</span>
                      <Loader2 size={16} className="animate-spin" />
                    </>
                  ) : (
                    <span>Add Lead</span>
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {holdModalOpen &&
        createPortal(
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[99999] flex items-center justify-center p-4 overflow-y-auto">
            <div className="absolute inset-0" onClick={() => setHoldModalOpen(false)} />
            <div className="relative z-10 bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-pop flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#FFF7ED] text-[#F97316] rounded-xl flex items-center justify-center border border-[#FFEDD5] shadow-sm">
                    <Pause size={16} />
                  </div>
                  <h3 className="text-base font-bold text-[#18254D] tracking-tight">
                    On Hold
                  </h3>
                </div>
                <button
                  onClick={() => setHoldModalOpen(false)}
                  className="p-1.5 hover:bg-slate-200 rounded-xl text-slate-400 transition-all"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-6 space-y-6 overflow-y-auto no-scrollbar">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                      Hold Reason
                    </label>
                    <textarea
                      required
                      rows={4}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-350 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200 resize-none"
                      placeholder="Enter reason for suspending this enquiry..."
                      value={holdReason}
                      onChange={(e) => setHoldReason(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-4 pt-2">
                  <button
                    type="button"
                    onClick={confirmHold}
                    disabled={!holdReason.trim() || isSubmitting}
                    className="w-full h-12 bg-[#18254D] text-white rounded-xl text-xs font-bold tracking-wider shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 btn-animated disabled:opacity-50 disabled:grayscale hover:bg-slate-800 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <span>Processing...</span>
                        <Loader2 size={16} className="animate-spin" />
                      </>
                    ) : (
                      <>
                        <span>Add To Hold</span>
                        <PauseCircle size={16} strokeWidth={2.5} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {showDeleteAllModal &&
        createPortal(
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[99999] flex items-center justify-center p-4 overflow-y-auto">
            <div className="absolute inset-0" onClick={() => setShowDeleteAllModal(false)} />
            <div className="relative z-10 bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-pop flex flex-col">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#FFF1F2] text-[#F43F5E] rounded-xl flex items-center justify-center border border-[#FFE4E6] shadow-sm">
                    <AlertTriangle size={16} />
                  </div>
                  <h3 className="text-base font-bold text-[#18254D] tracking-tight">
                    Confirm Clear All
                  </h3>
                </div>
                <button
                  onClick={() => setShowDeleteAllModal(false)}
                  className="p-1.5 hover:bg-slate-200 rounded-xl text-slate-400 transition-all"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div className="space-y-2">
                  <p className="text-slate-600 text-sm font-semibold leading-relaxed">
                    Are you sure you want to{" "}
                    <span className="text-[#F43F5E] font-bold underline underline-offset-4">
                      permanently delete all
                    </span>{" "}
                    dismissed enquiries? This action cannot be undone.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDeleteAllModal(false)}
                    className="flex-1 h-12 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold tracking-wider hover:bg-slate-200 transition-all active:scale-[0.98] btn-animated"
                  >
                    CANCEL
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteAll();
                      setShowDeleteAllModal(false);
                    }}
                    className="flex-1 h-12 bg-[#F43F5E] text-white rounded-xl text-xs font-bold tracking-wider shadow-md hover:bg-[#E11D48] transition-all active:scale-[0.98] flex items-center justify-center gap-2 btn-animated"
                  >
                    <span>DELETE ALL</span>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default EnquiryList;
