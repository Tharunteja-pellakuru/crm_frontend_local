import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import { createPortal } from "react-dom";
import { useScrollLock } from "../../hooks/useScrollLock";
// MOCK_PROJECTS and MOCK_CLIENTS are now passed as props
import {
  Calendar,
  IndianRupee,
  MoreVertical,
  Plus,
  Clock,
  UserPlus,
  X,
  Upload,
  ChevronDown,
  Tag,
  AlertCircle,
  CheckCircle,
  Zap,
  Monitor,
  Film,
  Search,
  Filter,
  AlertTriangle,
  Loader2,
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
} from "../../utils/locationData";
import { formatBudget, parseBudget } from "../../utils/formatters";
import SearchableDropdown from "../../components/common/SearchableDropdown";
import { validateForm } from "../../utils/validation";

const TECH_COLUMNS = [
  {
    id: "In Progress",
    title: "In Progress",
    color: "text-info",
    dotColor: "bg-info",
    activeTabBg: "bg-info/10",
    activeTabText: "text-info",
  },
  {
    id: "Hold",
    title: "Hold",
    color: "text-warning",
    dotColor: "bg-warning",
    activeTabBg: "bg-warning/10",
    activeTabText: "text-warning",
  },
  {
    id: "Completed",
    title: "Completed",
    color: "text-success",
    dotColor: "bg-success",
    activeTabBg: "bg-success/10",
    activeTabText: "text-success",
  },
];

const MEDIA_COLUMNS = [
  {
    id: "In Progress",
    title: "In Progress",
    color: "text-info",
    dotColor: "bg-info",
    activeTabBg: "bg-info/10",
    activeTabText: "text-info",
  },
  {
    id: "Hold",
    title: "Hold",
    color: "text-warning",
    dotColor: "bg-warning",
    activeTabBg: "bg-warning/10",
    activeTabText: "text-warning",
  },
  {
    id: "Completed",
    title: "Completed",
    color: "text-success",
    dotColor: "bg-success",
    activeTabBg: "bg-success/10",
    activeTabText: "text-success",
  },
];

const ALL_COLUMNS = [
  {
    id: "In Progress",
    title: "In Progress",
    color: "text-info",
    dotColor: "bg-info",
    activeTabBg: "bg-info/10",
    activeTabText: "text-info",
  },
  {
    id: "Hold",
    title: "Hold",
    color: "text-warning",
    dotColor: "bg-warning",
    activeTabBg: "bg-warning/10",
    activeTabText: "text-warning",
  },
  {
    id: "Completed",
    title: "Completed",
    color: "text-success",
    dotColor: "bg-success",
    activeTabBg: "bg-success/10",
    activeTabText: "text-success",
  },
];

const ProjectCard = ({
  project,
  clients,
  onEdit,
  onUpdateProject,
  availableStatuses,
  onSelectProject,
  onDelete,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const client = clients.find((c) => c.id == project.clientId || c.client_id == project.clientId);

  const getPriorityStyles = (priority) => {
    switch (priority?.toLowerCase()) {
      case "critical":
        return {
          badge: "bg-error/10 text-error border-error/30",
          icon: AlertCircle,
          color: "text-error",
        };
      case "high":
        return {
          badge: "bg-warning/10 text-warning border-warning/30",
          icon: Zap,
          color: "text-warning",
        };
      case "medium":
        return {
          badge: "bg-secondary/10 text-secondary border-secondary/30",
          icon: CheckCircle,
          color: "text-secondary",
        };
      case "low":
        return {
          badge: "bg-info/10 text-info border-info/30",
          icon: Tag,
          color: "text-info",
        };
      default:
        return {
          badge: "bg-slate-100 text-slate-600 border-slate-200",
          icon: Tag,
          color: "text-slate-400",
        };
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-success/10 text-success border-success/30";
      case "in_progress":
      case "in progress":
        return "bg-warning/10 text-warning border-warning/30";
      case "on_hold":
      case "on hold":
      case "planning":
      case "pending":
        return "bg-info/10 text-info border-info/30";
      case "testing":
        return "bg-secondary/10 text-secondary border-secondary/30";
      case "live":
        return "bg-success/10 text-success border-success/30";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 1:
      case "tech":
        return "bg-secondary/10 text-secondary border-secondary/30";
      case 2:
      case "social media":
        return "bg-warning/10 text-warning border-warning/30";
      case 3:
      case "both":
        return "bg-purple-500/10 text-purple-500 border-purple-500/30";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  const handleStatusUpdate = (newStatus) => {
    if (onUpdateProject) {
      // Calculate new progress based on status if needed
      let newProgress = project.progress;
      if (newStatus === "Live" || newStatus === "Completed") newProgress = 100;
      else if (newStatus === "Testing") newProgress = 75;
      else if (newStatus === "In Progress") newProgress = 40;
      else if (newStatus === "Planning" || newStatus === "Pending")
        newProgress = 10;

      onUpdateProject({
        ...project,
        status: newStatus,
        progress: newProgress,
      });
    }
    setIsMenuOpen(false);
  };

  const priorityStyle = getPriorityStyles(project.priority);
  const PriorityIcon = priorityStyle.icon;

  return (
    <div
      onClick={() => onSelectProject && onSelectProject(project)}
      className="group bg-white p-5 rounded-2xl border border-slate-200 hover:border-secondary/50 hover:shadow-xl transition-all cursor-pointer animate-fade-in flex flex-col h-full relative"
    >
      {/* Header with Category */}
      <div className="flex items-start mb-4">
        <span
          className={`px-2 py-0.5 text-[13px] font-bold tracking-widest border rounded-md ${getCategoryColor(project.category)}`}
        >
          {CATEGORY_MAP[project.category] || project.category || "Tech"}
        </span>
      </div>

      {/* Project Title & Description */}
      <div className="mb-4 flex-grow">
        <h4 className="font-bold text-[#18254D] text-sm tracking-tight mb-2 group-hover:text-secondary transition-colors line-clamp-2">
          {project.name}
        </h4>
        {project.description && (
          <p className="text-[13px] text-slate-500 line-clamp-2 leading-relaxed font-medium">
            {project.description}
          </p>
        )}
      </div>

      {/* Status & Priority Row */}
      <div className="flex items-center justify-between mb-4 mt-auto pt-4 border-t border-slate-50">
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-black text-slate-300 tracking-widest uppercase">Status</span>
          <span
            className={`px-2 py-0.5 text-[13px] font-bold tracking-widest border rounded-md w-fit ${getStatusColor(project.status)}`}
          >
            {project.status?.replace("_", " ") || "Planning"}
          </span>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className="text-[13px] font-black text-slate-300 tracking-widest uppercase text-right">Priority</span>
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 text-[13px] font-bold tracking-widest border rounded-md ${priorityStyle.badge}`}
          >
            <PriorityIcon size={10} />
            {project.priority?.toUpperCase() || "MEDIUM"}
          </span>
        </div>
      </div>

      {/* Action Menu (Floating top-right) */}
      <div className="absolute top-5 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
            }}
            className={`p-1.5 transition-colors rounded-lg ${isMenuOpen ? "bg-slate-100 text-primary" : "bg-white border border-slate-100 text-slate-300 hover:text-primary hover:border-slate-300 shadow-sm"}`}
          >
            <MoreVertical size={14} />
          </button>

          {isMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-[60]"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(false);
                }}
              />
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden z-[70] animate-fade-in origin-top-right py-2 scale-90 -translate-y-2 translate-x-2"
                style={{ transform: "scale(1) translate(0, 0)" }}
              >
                <div className="px-4 py-2 border-b border-slate-50 mb-1">
                  <p className="text-[14px] font-black text-slate-400  tracking-widest">
                    Quick Actions
                  </p>
                </div>
                {availableStatuses.map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusUpdate(status)}
                    className="w-full text-left px-4 py-2.5 text-[12px] font-bold  tracking-widest text-[#18254D] hover:bg-slate-50 hover:text-secondary transition-colors"
                  >
                    Move to {status}
                  </button>
                ))}
                <div className="border-t border-slate-50 mt-1 pt-1">
                  <button
                    onClick={() => {
                      onEdit && onEdit(project);
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-[12px] font-bold  tracking-widest text-slate-400 hover:bg-slate-50 hover:text-primary transition-colors"
                  >
                    Edit Details
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete && onDelete(project);
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-[12px] font-bold  tracking-widest text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-colors border-t border-slate-50"
                  >
                    Delete Project
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer with Budget & Deadline */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
        <div className="flex flex-col gap-1">
          <span className="text-[13px] font-black text-slate-300 tracking-widest uppercase">Budget</span>
          <span className="text-[12px] font-bold text-primary flex items-center gap-0.5">
            <IndianRupee size={10} strokeWidth={3} />
            {project.budget?.toLocaleString("en-IN") || "0"}
          </span>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-[13px] font-black text-slate-300 tracking-widest uppercase text-right">Deadline</span>
          <div className="flex items-center gap-1.5 text-[12px] font-bold text-slate-500">
            <Calendar size={12} className="text-secondary" />
            <span>
              {project.deadline
                ? new Date(project.deadline).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })
                : "N/A"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProjectBoard = ({
  projects,
  clients,
  onAddProject,
  onAddClient,
  onSelectProject,
  onUpdateProject,
  onDeleteProject,
}) => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterPopupOpen, setIsFilterPopupOpen] = useState(false);
  const COLUMNS =
    selectedCategory === 1
      ? TECH_COLUMNS
      : selectedCategory === 2
        ? MEDIA_COLUMNS
        : ALL_COLUMNS;

  const [activeStage, setActiveStage] = useState(COLUMNS[0].id);

  // Sync activeStage when selectedCategory changes if current activeStage is not in new COLUMNS
  useEffect(() => {
    if (!COLUMNS.find((c) => c.id === activeStage)) {
      setActiveStage(COLUMNS[0].id);
    }
  }, [selectedCategory, COLUMNS, activeStage]);

  const [isSubmitting, setIsSubmitting] = useState(false); // Added isSubmitting state
  const [showAddModal, setShowAddModal] = useState(false);

  // Lock scroll when any modal is open
  useScrollLock(showAddModal || !!projectToDelete);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isPriorityDropdownOpen, setIsPriorityDropdownOpen] = useState(false);
  const [isClientStatusDropdownOpen, setIsClientStatusDropdownOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [clientSearch, setClientSearch] = useState("");
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
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

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
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
    budget: "",
    scopeDocument: "",
  });

  const getAvailableStatuses = (currentStatus) => {
    return COLUMNS.filter((col) => col.id !== currentStatus).map(
      (col) => col.id,
    );
  };
  const activeColumn = COLUMNS.find((c) => c.id === activeStage) || COLUMNS[0];
  const filteredProjects = projects.filter((p) => {
    const matchesStatus = p.status === activeStage;
    const matchesCategory =
      selectedCategory === "All" ? true : (p.category || 1) === selectedCategory;
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !query ||
      p.name?.toLowerCase().includes(query) ||
      p.description?.toLowerCase().includes(query) ||
      clients
        .find((c) => c.id == p.clientId || c.client_id == p.clientId)
        ?.company?.toLowerCase()
        .includes(query);
    return matchesStatus && matchesCategory && matchesSearch;
  });

  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat);
    setActiveStage("Planning");
    setIsCategoryDropdownOpen(false);
  };

  const handleEditProject = (project) => {
    if (onSelectProject) {
      onSelectProject(project);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const isValid = validateForm(formData, {
      projectName: { required: true, minLength: 2, label: "Project Name" },
      projectDescription: { required: true, label: "Project Description" },
      budget: { required: true, type: "number", label: "Budget" },
      onboardingDate: { required: true, label: "Onboarding Date" },
      phone: { minLength: 10, label: "Phone Number" }
    });

    if (!isValid) return;

    if (!selectedClientId) {
      toast.error("Please select an existing client.");
      return;
    }

    setIsSubmitting(true); // Set submitting state to true

    try {
      // Create project using the selected existing client ID
      if (onAddProject) {
        await onAddProject({
          clientId: selectedClientId,
          name: formData.projectName,
          description: formData.projectDescription,
          projectCategory: formData.projectCategory,
          projectStatus: formData.projectStatus,
          projectPriority: formData.projectPriority,
          budget: formData.budget,
          onboardingDate: formData.onboardingDate,
          deadline: formData.deadline,
          scopeDocument: formData.scopeDocument,
        });
      }

      setShowAddModal(false);
      // Reset form
      setSelectedClientId(null);
      setClientSearch("");
      setFormData({
        name: "",
        email: "",
        phone: "",
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
        budget: "",
        scopeDocument: "",
      });
    } catch (error) {
      toast.error("Failed to add project.");
      console.error(error);
    } finally {
      setIsSubmitting(false); // Reset submitting state
    }
  };

  return (
    <div className="w-full h-full relative">
      <div className="space-y-5 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="max-w-2xl">
            <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-primary tracking-tight mb-2">
              Projects
            </h2>
            <p className="text-sm text-textMuted font-medium leading-relaxed">
              Manage and track all your projects and their delivery status.
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
              Add New Project
            </button>
          </div>
        </div>

        {/* Control Bar */}
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
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-[38px] pl-11 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium text-[#18254D] focus:outline-none focus:ring-4 focus:ring-[#18254D]/10 focus:border-[#18254D]/20 transition-all placeholder:text-[#18254D]/30"
              />
            </div>

            {/* 2. Filters Button */}
            <div className="relative w-full md:w-auto flex-none" ref={filterButtonRef}>
              <button
                onClick={() => setIsFilterPopupOpen(!isFilterPopupOpen)}
                className={`w-full md:w-auto h-[38px] flex items-center justify-center gap-2.5 px-6 py-2 rounded-xl text-[12px] font-bold tracking-widest transition-all shadow-sm active:scale-95 group border ${
                  selectedCategory !== "All"
                    ? "bg-secondary/5 border-secondary text-secondary"
                    : "bg-slate-50 border-slate-100 text-[#18254D] hover:bg-white hover:border-slate-200 shadow-slate-200/50"
                }`}
              >
                <Filter
                  size={14}
                  className={selectedCategory !== "All" ? "text-secondary" : "text-slate-400"}
                />
                <span>FILTERS</span>
                {selectedCategory !== "All" && (
                  <span className="flex items-center justify-center w-5 h-5 bg-secondary text-white text-[10px] font-black rounded-full ml-1 shadow-sm">
                    1
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
                            Filter Projects
                          </h3>
                        </div>
                        {selectedCategory !== "All" && (
                          <button
                            onClick={() => {
                              handleCategoryChange("All");
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
                        {/* Category Section */}
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase ml-1">
                            Project Category
                          </label>
                          <SearchableDropdown
                            placeholder="Select Category..."
                            options={[
                              { label: "ALL", value: "All" },
                              { label: "TECH", value: 1 },
                              { label: "SOCIAL MEDIA", value: 2 },
                            ]}
                            value={selectedCategory}
                            onChange={(val) => {
                              handleCategoryChange(val);
                            }}
                          />
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

        {/* Stage Toggle Tabs */}
        <div className="flex justify-center my-4 w-full px-1 sm:px-0">
        <div className="relative flex flex-nowrap bg-slate-100/50 p-0.5 rounded-[14px] border border-slate-200 shadow-sm leading-none w-full sm:w-auto items-center gap-0 overflow-hidden">
          {/* Moving Indicator */}
          <div
            className="absolute top-[2px] bottom-[2px] left-[2px] bg-white rounded-[11px] shadow-sm transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] border border-white/20 z-0"
            style={{
              width: "calc(33.333% - 2px)",
              transform: `translateX(${COLUMNS.findIndex((c) => c.id === activeStage) * 100}%)`,
            }}
          />

          {COLUMNS.map((column) => {
            const count = projects.filter(
              (p) =>
                p.status === column.id &&
                (selectedCategory === 3 ||
                  (p.category || 1) === selectedCategory),
            ).length;
            const isActive = activeStage === column.id;
            return (
              <button
                key={column.id}
                onClick={() => setActiveStage(column.id)}
                className={`relative z-10 flex-1 sm:flex-none px-2 sm:px-5 py-2.5 sm:py-2 rounded-xl text-[10px] sm:text-[12px] font-bold tracking-wider transition-all duration-300 flex items-center justify-center min-w-[75px] sm:min-w-[110px] h-[30px] sm:h-[36px] whitespace-nowrap gap-2 active:scale-95 ${
                  isActive
                    ? "text-[#18254D] scale-[1.02]"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <span>{column.title}</span>
                <span
                  className={`min-w-[18px] h-4.5 px-1.5 rounded-full text-[10px] sm:text-[12px] font-black flex items-center justify-center transition-colors duration-300 ${
                    isActive
                      ? "bg-[#18254D] text-white"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        </div>

        {/* Active Stage Content */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-6 min-h-[300px]">
          {/* Stage Header */}
          <div className="flex justify-between items-center mb-4 px-1">
            <div className="flex items-center gap-4">
              <div
                className={`w-3 h-3 rounded-full ${activeColumn.dotColor}`}
              ></div>
              <h3 className="text-sm font-bold text-primary  tracking-[0.25em]">
                {activeColumn.title}
              </h3>
            </div>
            <span className="bg-slate-100 text-slate-500 text-[12px] font-bold px-3 py-1 rounded-full border border-slate-200  tracking-widest">
              {filteredProjects.length}{" "}
              {filteredProjects.length === 1 ? "Project" : "Projects"}
            </span>
          </div>

          {/* Project Cards Grid — Month-wise grouping for all tabs */}
          {filteredProjects.length > 0 ? (
            <div className="space-y-10">
              {(() => {
                // Determine which date field to use for grouping based on the active tab
                const getGroupDate = (project) => {
                  if (activeStage === "In Progress") {
                    // Group by onboarding month
                    return project.onboardingDate
                      ? new Date(project.onboardingDate)
                      : new Date();
                  } else {
                    // Completed → completion month, Hold → hold month
                    // Both use updatedAt (the date the status was last changed)
                    return project.updatedAt
                      ? new Date(project.updatedAt)
                      : project.onboardingDate
                        ? new Date(project.onboardingDate)
                        : new Date();
                  }
                };

                // Build month groups
                const groups = filteredProjects.reduce((acc, project) => {
                  const date = getGroupDate(project);
                  const monthKey = date.toLocaleString("default", {
                    month: "long",
                    year: "numeric",
                  });
                  if (!acc[monthKey]) acc[monthKey] = { date, projects: [] };
                  acc[monthKey].projects.push(project);
                  return acc;
                }, {});

                // Sort months in reverse chronological order (newest first)
                const sortedMonths = Object.entries(groups).sort(
                  ([, a], [, b]) => b.date - a.date
                );

                // Get the label for the month section based on active tab
                const getMonthLabel = () => {
                  if (activeStage === "In Progress") return "Onboarded";
                  if (activeStage === "Completed") return "Completed";
                  if (activeStage === "Hold") return "On Hold since";
                  return "";
                };

                return sortedMonths.map(([month, { projects: monthProjects }]) => (
                  <div key={month} className="space-y-5">
                    <div className="flex items-center gap-4">
                      <div className="h-px flex-1 bg-slate-100" />
                      <h4 className="text-[13px] font-bold text-slate-400 tracking-[0.3em] uppercase bg-slate-50 px-4 py-1.5 rounded-full border border-slate-100 shadow-sm flex items-center gap-2">
                        <span>{getMonthLabel()} — {month}</span>
                      </h4>
                      <div className="h-px flex-1 bg-slate-100" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                      {monthProjects.map((project) => (
                        <ProjectCard
                          key={project.id}
                          project={project}
                          clients={clients}
                          onEdit={handleEditProject}
                          onUpdateProject={onUpdateProject}
                          availableStatuses={getAvailableStatuses(
                            project.status,
                          )}
                          onSelectProject={onSelectProject}
                          onDelete={setProjectToDelete}
                        />
                      ))}
                    </div>
                  </div>
                ));
              })()}
              {/* Add Project Button */}
              <div className="flex justify-center">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="w-full max-w-sm py-6 border-2 border-dashed border-slate-100 rounded-2xl text-slate-300 text-[12px] font-bold  tracking-widest hover:border-secondary hover:text-secondary hover:bg-secondary/[0.02] transition-all group flex flex-col items-center justify-center gap-2 min-h-[100px]"
                >
                  <Plus
                    size={16}
                    strokeWidth={3}
                    className="group-hover:scale-125 transition-transform"
                  />
                  Initiate Project
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10">
              <button
                onClick={() => setShowAddModal(true)}
                className="w-full max-w-sm py-6 border-2 border-dashed border-slate-100 rounded-2xl text-slate-300 text-[12px] font-bold  tracking-widest hover:border-secondary hover:text-secondary hover:bg-secondary/[0.02] transition-all group flex flex-col items-center justify-center gap-2"
              >
                <Plus
                  size={18}
                  strokeWidth={2.5}
                  className="group-hover:scale-125 transition-transform"
                />
                Initiate Project
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal &&
        createPortal(
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[99999] flex items-start justify-center p-4 overflow-y-auto no-scrollbar">
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
                      Add New Project
                    </h3>
                    <p className="text-secondary text-[14px] font-bold  tracking-widest mt-0.5">
                      Project and Client Details
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto no-scrollbar">

              {/* CLIENT DETAILS HEADING */}
              <div className="flex items-center gap-3 pt-2">
                <div className="h-[2px] w-8 bg-secondary rounded-full" />
                <h4 className="text-[14px] font-bold text-[#18254D]  tracking-[0.2em]">
                  Client Details
                </h4>
                <div className="h-[2px] flex-1 bg-slate-100 rounded-full" />
              </div>

              {/* CLIENT TYPE */}
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
                        Existing Client
                      </p>
                      <p className="text-[14px] text-slate-400 font-bold mt-1">
                        Select from your client list
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* CLIENT NAME SEARCHABLE DROPDOWN */}
              <div className="space-y-2 relative">
                <label className="text-[12px] font-bold text-[#18254D]  tracking-widest ml-1">
                  CLIENT NAME
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search existing clients..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-secondary/10 focus:border-secondary focus:outline-none text-sm font-medium"
                    value={clientSearch}
                    onChange={(e) => {
                      setClientSearch(e.target.value);
                      setIsClientDropdownOpen(true);
                      if (!e.target.value) {
                        setSelectedClientId(null);
                        setFormData(prev => ({
                          ...prev,
                          name: "",
                          email: "",
                          phone: "",
                          country: "",
                          state: "",
                          currency: "",
                          organisationName: "",
                        }));
                      }
                    }}
                    onFocus={() => setIsClientDropdownOpen(true)}
                  />
                  <ChevronDown
                    size={14}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-transform ${isClientDropdownOpen ? "rotate-180" : ""}`}
                  />

                  {isClientDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-[80] pointer-events-auto"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsClientDropdownOpen(false);
                        }}
                      />
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden z-[90] animate-fade-in-up origin-top max-h-[200px] overflow-y-auto">
                        <div className="bg-[#18254D] px-4 py-3 border-b border-white/10 sticky top-0">
                          <p className="text-[14px] font-bold text-white/50  tracking-widest">
                            Select Client
                          </p>
                        </div>
                        {clients
                          .filter(
                            (c) =>
                              c.status === "Active" &&
                              (!clientSearch ||
                                c.name?.toLowerCase().includes(clientSearch.toLowerCase()) ||
                                c.company?.toLowerCase().includes(clientSearch.toLowerCase()) ||
                                c.email?.toLowerCase().includes(clientSearch.toLowerCase()))
                          )
                          .map((client) => (
                            <button
                              key={`proj-client-sel-${client.id}`}
                              type="button"
                              onClick={() => {
                                setSelectedClientId(client.id);
                                setClientSearch(client.name);
                                setIsClientDropdownOpen(false); 
                                setFormData((prev) => ({
                                  ...prev,
                                  name: client.name,
                                  email: client.email || "",
                                  phone: client.phone || "",
                                  country: client.country || "",
                                  state: client.state || "",
                                  currency: client.currency || "INR",
                                  organisationName: client.company || "",
                                  clientStatus: client.status || "Active",
                                  projectCategory: client.projectCategory || 1,
                                }));
                              }}
                              className={`w-full text-left px-5 py-3 transition-colors ${
                                selectedClientId === client.id
                                  ? "bg-slate-100 border-l-4 border-secondary"
                                  : "hover:bg-slate-50"
                              }`}
                            >
                              <p className="text-[14px] font-bold text-[#18254D]">
                                {client.name}
                              </p>
                              <p className="text-[14px] text-slate-400 font-medium mt-0.5">
                                {client.email}
                                {client.company ? ` · ${client.company}` : ""}
                              </p>
                            </button>
                          ))}
                        {clients.filter(
                          (c) =>
                            c.status === "Active" &&
                            (!clientSearch ||
                              c.name?.toLowerCase().includes(clientSearch.toLowerCase()) ||
                              c.company?.toLowerCase().includes(clientSearch.toLowerCase()) ||
                              c.email?.toLowerCase().includes(clientSearch.toLowerCase()))
                        ).length === 0 && (
                          <p className="px-4 py-3 text-[12px] text-slate-400 font-bold text-center">
                            No clients found
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* AUTO-FILLED CLIENT INFO (read-only) */}
              {selectedClientId && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1 col-span-2">
                    <label className="text-[14px] font-bold text-slate-400 tracking-widest ml-1">
                      ORGANISATION NAME
                    </label>
                    <p className="px-3.5 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-medium text-[#18254D] truncate">
                      {formData.organisationName || "—"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[14px] font-bold text-slate-400 tracking-widest ml-1">
                      EMAIL
                    </label>
                    <p className="px-3.5 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-medium text-[#18254D] truncate">
                      {formData.email || "—"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[14px] font-bold text-slate-400 tracking-widest ml-1">
                      PHONE
                    </label>
                    <p className="px-3.5 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-medium text-[#18254D] truncate">
                      {formData.phone || "—"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[14px] font-bold text-slate-400 tracking-widest ml-1">
                      COUNTRY
                    </label>
                    <p className="px-3.5 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-medium text-[#18254D] truncate">
                      {formData.country || "—"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[14px] font-bold text-slate-400 tracking-widest ml-1">
                      STATE
                    </label>
                    <p className="px-3.5 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-medium text-[#18254D] truncate">
                      {formData.state || "—"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[14px] font-bold text-slate-400 tracking-widest ml-1">
                      CURRENCY
                    </label>
                    <p className="px-3.5 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-medium text-[#18254D] truncate">
                      {formData.currency || "—"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[14px] font-bold text-slate-400 tracking-widest ml-1">
                      CLIENT STATUS
                    </label>
                    <p className="px-3.5 py-2 bg-slate-100 border border-slate-200 rounded-xl text-[13px] font-medium text-secondary truncate">
                      {formData.clientStatus || "—"}
                    </p>
                  </div>
                </div>
              )}

              {/* PROJECT DETAILS HEADING */}
              <div className="flex items-center gap-3 pt-6">
                <div className="h-[2px] w-8 bg-secondary rounded-full" />
                <h4 className="text-[14px] font-bold text-[#18254D]  tracking-[0.2em]">
                  Project Details
                </h4>
                <div className="h-[2px] flex-1 bg-slate-100 rounded-full" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* PROJECT NAME */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[12px] font-bold text-[#18254D]  tracking-widest ml-1">
                    PROJECT NAME
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Route Optimization Platform"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-secondary/10 focus:border-secondary focus:outline-none text-sm font-medium"
                    value={formData.projectName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        projectName: e.target.value,
                      })
                    }
                  />
                </div>

                {/* PROJECT DESCRIPTION */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[12px] font-bold text-[#18254D]  tracking-widest ml-1">
                    PROJECT DESCRIPTION
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Focus on UI/UX redesign and performance optimization..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-secondary/10 focus:border-secondary focus:outline-none text-sm font-medium resize-none shadow-sm"
                    value={formData.projectDescription}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        projectDescription: e.target.value,
                      })
                    }
                  />
                </div>

                {/* PROJECT CATEGORY */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[12px] font-bold text-[#18254D]  tracking-widest ml-1">
                    PROJECT CATEGORY <span className="text-error">*</span>
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium shadow-sm hover:border-secondary transition-all"
                    >
                      <span className="text-primary">
                        {CATEGORY_MAP[formData.projectCategory] || "Select Category"}
                      </span>
                      <ChevronDown
                        size={16}
                        className={`text-slate-400 transition-transform ${isCategoryDropdownOpen ? "rotate-180" : ""}`}
                      />
                    </button>

                    {isCategoryDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-[80] pointer-events-auto"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsCategoryDropdownOpen(false);
                          }}
                        />
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden z-[90] animate-fade-in-up origin-top">
                          <div className="bg-[#18254D] px-4 py-3 border-b border-white/10">
                            <p className="text-[14px] font-bold text-white/50  tracking-widest">
                              Select Category
                            </p>
                          </div>
                          {[1, 2].map((catId) => (
                            <button
                              key={`proj-new-cat-${catId}`}
                              type="button"
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  projectCategory: catId,
                                });
                                setIsCategoryDropdownOpen(false);
                              }}
                              className={`w-full text-left px-4 py-2.5 text-[12px] font-bold  tracking-widest transition-colors ${
                                formData.projectCategory === catId
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

                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-[#18254D]  tracking-widest ml-1">
                    PROJECT STATUS
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setIsStatusDropdownOpen(!isStatusDropdownOpen)
                      }
                      className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium shadow-sm hover:border-secondary transition-all"
                    >
                      <span className="text-primary">
                        {formData.projectStatus}
                      </span>
                      <ChevronDown
                        size={16}
                        className={`text-slate-400 transition-transform ${isStatusDropdownOpen ? "rotate-180" : ""}`}
                      />
                    </button>

                    {isStatusDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-[80] pointer-events-auto"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsStatusDropdownOpen(false);
                          }}
                        />
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden z-[90] animate-fade-in-up origin-top">
                          <div className="bg-[#18254D] px-4 py-3 border-b border-white/10">
                            <p className="text-[14px] font-bold text-white/50  tracking-widest">
                              Select Status
                            </p>
                          </div>
                          {["In Progress", "Hold", "Completed"].map((status) => (
                            <button
                              key={`proj-new-status-${status}`}
                              type="button"
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  projectStatus: status,
                                });
                                setIsStatusDropdownOpen(false);
                              }}
                              className={`w-full text-left px-4 py-2.5 text-[12px] font-bold  tracking-widest transition-colors ${
                                formData.projectStatus === status
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


                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-[#18254D]  tracking-widest ml-1">
                    PROJECT PRIORITY
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setIsPriorityDropdownOpen(!isPriorityDropdownOpen)
                      }
                      className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium shadow-sm hover:border-secondary transition-all"
                    >
                      <span className="text-primary">
                        {formData.projectPriority}
                      </span>
                      <ChevronDown
                        size={16}
                        className={`text-slate-400 transition-transform ${isPriorityDropdownOpen ? "rotate-180" : ""}`}
                      />
                    </button>

                    {isPriorityDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-[80] pointer-events-auto"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsPriorityDropdownOpen(false);
                          }}
                        />
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden z-[90] animate-fade-in-up origin-top">
                          <div className="bg-[#18254D] px-4 py-3 border-b border-white/10">
                            <p className="text-[14px] font-bold text-white/50  tracking-widest">
                              Select Priority
                            </p>
                          </div>
                          {["High", "Medium", "Low"].map((level) => (
                            <button
                              key={`proj-new-priority-${level}`}
                              type="button"
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  projectPriority: level,
                                });
                                setIsPriorityDropdownOpen(false);
                              }}
                              className={`w-full text-left px-4 py-2.5 text-[12px] font-bold  tracking-widest transition-colors ${
                                formData.projectPriority === level
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
                    PROJECT BUDGET (
                    {formData.currency === "USD" ? "USD" : "INR"})
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                      {formData.currency === "USD" ? "$" : "₹"}
                    </div>
                    <input
                      type="text"
                      placeholder={
                        formData.currency === "USD"
                          ? "e.g. 5,000"
                          : "e.g. 5,00,000"
                      }
                      className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-secondary/10 focus:border-secondary focus:outline-none text-sm font-medium shadow-sm"
                      value={formatBudget(formData.budget, formData.currency)}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          budget: parseBudget(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>

                {/* DATES */}
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-[#18254D]  tracking-widest ml-1">
                    ONBOARDING DATE
                  </label>
                  <DatePicker
                    value={formData.onboardingDate}
                    onChange={(val) =>
                      setFormData({
                        ...formData,
                        onboardingDate: val,
                      })
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-[#18254D]  tracking-widest ml-1">
                    DEADLINE (TENTATIVE)
                  </label>
                  <DatePicker
                    value={formData.deadline}
                    onChange={(val) =>
                      setFormData({
                        ...formData,
                        deadline: val,
                      })
                    }
                  />
                </div>

                {/* SCOPE DOCUMENT */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[12px] font-bold text-[#18254D]  tracking-widest ml-1">
                    SCOPE DOCUMENT
                  </label>
                  <div className="relative group">
                    <input
                      type="file"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setFormData({
                            ...formData,
                            scopeDocument: file,
                          });
                        }
                      }}
                    />
                    <div className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl group-hover:border-secondary group-hover:bg-secondary/5 transition-all flex items-center gap-3 shadow-sm">
                      <span
                        className={`text-sm font-bold ${formData.scopeDocument ? "text-[#18254D]" : "text-slate-400"}`}
                      >
                        {formData.scopeDocument instanceof File
                          ? formData.scopeDocument.name
                          : typeof formData.scopeDocument === "string" &&
                              formData.scopeDocument
                            ? formData.scopeDocument
                            : "Upload scope document (PDF)"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

                <div className="pt-2 shrink-0">
                  <button
                    type="submit"
                    disabled={isSubmitting} // Disabled when submitting
                    className="w-full py-3 bg-[#18254D] text-white rounded-2xl text-[13px] font-bold  tracking-[0.25em] shadow-xl active:scale-[0.97] transition-all hover:bg-[#1e2e5e] hover:shadow-2xl flex items-center justify-center gap-3 group/btn disabled:opacity-70 disabled:cursor-not-allowed" // Added disabled styles
                  >
                    {isSubmitting ? ( // Conditional rendering for loading state
                      <>
                        <span>ADDING PROJECT...</span>
                        <Loader2 size={20} className="animate-spin" />
                      </>
                    ) : (
                      <>
                        <UserPlus
                          size={20}
                          className="group-hover/btn:translate-x-1 transition-transform"
                        />
                        <span>ADD PROJECT</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
      {/* Delete Confirmation Modal */}
      {projectToDelete &&
        createPortal(
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99999] flex items-start justify-center p-4 animate-fade-in overflow-y-auto no-scrollbar py-20">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-scale-in my-auto">
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-[#18254E] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#18254E] shadow-sm">
                  <AlertTriangle size={32} className="text-[#18254E]" />
                </div>
                <h3 className="text-xl font-bold text-primary mb-2">
                  Confirm Deletion
                </h3>
                <p className="text-slate-500 text-sm font-medium leading-relaxed px-4">
                  Are you sure you want to delete the project 
                  <span className="text-primary font-bold"> "{projectToDelete.name}"</span>? 
                  This action cannot be undone and all associated data will be removed.
                </p>
              </div>
              <div className="bg-slate-50 p-4 border-t border-slate-100 flex gap-3">
                <button
                  onClick={() => setProjectToDelete(null)}
                  className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold tracking-widest hover:bg-slate-50 transition-all active:scale-95 uppercase"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onDeleteProject && onDeleteProject(projectToDelete.project_id || projectToDelete.id);
                    setProjectToDelete(null);
                  }}
                  className="flex-1 px-4 py-2.5 bg-[#18254E] text-white rounded-xl text-xs font-bold tracking-widest hover:bg-[#1e2e5e] shadow-lg shadow-[#18254E]/20 transition-all active:scale-95 uppercase"
                >
                  Delete Project
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default ProjectBoard;
