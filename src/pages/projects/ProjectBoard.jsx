import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import { createPortal } from "react-dom";
import { useScrollLock } from "../../hooks/useScrollLock";
import { useSearch } from "../../hooks/useSearch";
// MOCK_PROJECTS and MOCK_CLIENTS are now passed as props
import {
  Briefcase,
  Calendar,
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
  LayoutGrid,
  Pencil,
  Trash2,
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
    id: "All",
    title: "All",
    color: "text-slate-600",
    dotColor: "bg-slate-400",
    activeTabBg: "bg-slate-100",
    activeTabText: "text-slate-700",
  },
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
  const [menuStyle, setMenuStyle] = useState({});
  const menuButtonRef = useRef(null);
  const client = clients.find((c) => c.id == project.clientId || c.client_id == project.clientId);

  const getPriorityStyles = (priority) => {
    switch (priority?.toLowerCase()) {
      case "critical":
        return { badge: "bg-rose-100 text-rose-600 border-rose-200", icon: AlertCircle };
      case "high":
        return { badge: "bg-amber-100 text-amber-600 border-amber-200", icon: Zap };
      case "medium":
        return { badge: "bg-emerald-100 text-emerald-600 border-emerald-200", icon: CheckCircle };
      case "low":
        return { badge: "bg-sky-100 text-sky-600 border-sky-200", icon: Tag };
      default:
        return { badge: "bg-slate-100 text-slate-600 border-slate-200", icon: Tag };
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case "in_progress":
      case "in progress":
        return "bg-amber-50 text-amber-600 border-amber-100";
      case "on_hold":
      case "on hold":
      case "planning":
      case "pending":
        return "bg-sky-50 text-sky-600 border-sky-100";
      case "testing":
        return "bg-violet-50 text-violet-600 border-violet-100";
      case "live":
        return "bg-emerald-50 text-emerald-600 border-emerald-100";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  const handleStatusUpdate = (newStatus) => {
    if (onUpdateProject) {
      let newProgress = project.progress;
      if (newStatus === "Live" || newStatus === "Completed") newProgress = 100;
      else if (newStatus === "Testing") newProgress = 75;
      else if (newStatus === "In Progress") newProgress = 40;
      else if (newStatus === "Planning" || newStatus === "Pending") newProgress = 10;

      onUpdateProject({
        ...project,
        status: newStatus,
        progress: newProgress,
      });
    }
    setIsMenuOpen(false);
  };

  useEffect(() => {
    if (!isMenuOpen || !menuButtonRef.current) return;

    const rect = menuButtonRef.current.getBoundingClientRect();
    const menuWidth = 192;
    const menuHeight = 180;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    let left = rect.right - menuWidth;
    if (left < 12) left = 12;
    if (left + menuWidth > viewportWidth - 12) left = viewportWidth - menuWidth - 12;

    let top = rect.bottom + 8;
    if (top + menuHeight > viewportHeight - 12) {
      top = rect.top - menuHeight - 8;
    }

    setMenuStyle({
      position: "fixed",
      top: `${top}px`,
      left: `${left}px`,
      width: `${menuWidth}px`,
      zIndex: 99999,
    });
  }, [isMenuOpen]);

  useEffect(() => {
    if (!isMenuOpen) return;

    const closeMenu = () => setIsMenuOpen(false);
    window.addEventListener("scroll", closeMenu, true);
    window.addEventListener("resize", closeMenu);
    return () => {
      window.removeEventListener("scroll", closeMenu, true);
      window.removeEventListener("resize", closeMenu);
    };
  }, [isMenuOpen]);

  const priorityStyle = getPriorityStyles(project.priority);
  const PriorityIcon = priorityStyle.icon;

  return (
    <tr
      onClick={() => onSelectProject && onSelectProject(project)}
      className="group transition-all hover:bg-slate-50/50 cursor-pointer"
    >
      <td className="px-6 py-5 border-y border-slate-100 first:border-l first:rounded-l-xl">
        <div className="min-w-0">
          <div className="font-bold text-[13px] text-[#18254D] tracking-tight leading-none mb-1 group-hover:text-secondary transition-colors truncate">
            {project.name}
          </div>
          <div className="text-[12px] font-medium text-slate-400 truncate max-w-[140px] sm:max-w-[220px] xl:max-w-[320px]">
            {project.description || "No description provided"}
          </div>
        </div>
      </td>

      <td className="px-6 py-5 border-y border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-secondary" />
          <span className="text-[12px] font-semibold text-slate-600">
            {client?.name || client?.company || "System"}
          </span>
        </div>
      </td>

      <td className="px-6 py-5 border-y border-slate-100">
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border tracking-wider uppercase ${priorityStyle.badge}`}>
          <PriorityIcon size={10} />
          {project.priority || "MEDIUM"}
        </span>
      </td>

      <td className="px-6 py-5 border-y border-slate-100">
        <div className="flex items-center gap-1.5 text-[12px] font-bold text-slate-500">
          <Calendar size={12} className="text-secondary" />
          <span>
            {project.onboardingDate
              ? new Date(project.onboardingDate).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "N/A"}
          </span>
        </div>
      </td>

      <td className="px-6 py-5 border-y border-slate-100">
        <div className="flex items-center gap-1.5 text-[12px] font-bold text-slate-500">
          <Calendar size={12} className="text-secondary" />
          <span>
            {project.deadline
              ? new Date(project.deadline).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "N/A"}
          </span>
        </div>
      </td>

      <td className="px-6 py-5 border-y border-slate-100">
        <span className="text-[12px] font-semibold text-slate-600">
          {project.createdByName || "System"}
        </span>
      </td>

      <td className="px-6 py-5 border-y border-slate-100 last:border-r last:rounded-r-xl text-right">
        <div className="flex justify-end gap-2 flex-nowrap" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit && onEdit(project);
            }}
            className="w-9 h-9 sm:w-[34px] sm:h-[34px] flex items-center justify-center bg-blue-50 text-blue-600 border border-blue-100 rounded-[10px] hover:bg-blue-100 transition-all active:scale-90 shadow-sm relative group/btn"
            title="Edit Project"
          >
            <Pencil size={16} />
            <div className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 opacity-0 group-hover/btn:opacity-100 transition-opacity bg-[#18254D] text-white text-[10px] font-bold px-2.5 py-1 rounded-[6px] whitespace-nowrap pointer-events-none z-[100] shadow-md">
              Edit Project
            </div>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete && onDelete(project);
            }}
            className="w-[34px] h-[34px] flex items-center justify-center bg-[#FEF2F2] border border-[#FECACA] rounded-[10px] text-[#EF4444] hover:text-[#DC2626] hover:border-[#FCA5A5] transition-all active:scale-90 shadow-sm relative group/btn"
            title="Delete Project"
          >
            <Trash2 size={16} />
            <div className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 opacity-0 group-hover/btn:opacity-100 transition-opacity bg-[#18254D] text-white text-[10px] font-bold px-2.5 py-1 rounded-[6px] whitespace-nowrap pointer-events-none z-[100] shadow-md">
              Delete Project
            </div>
          </button>
          <div className="relative">
            <button
              ref={menuButtonRef}
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
              type="button"
              className={`w-[34px] h-[34px] flex items-center justify-center bg-white border rounded-[10px] shadow-sm transition-all ${isMenuOpen ? "border-primary text-primary" : "border-slate-200 text-slate-400 hover:border-slate-300 hover:text-primary"}`}
              title="Change Status"
            >
              <MoreVertical size={16} />
            </button>
            {isMenuOpen && (
              createPortal(
                <>
                  <div
                    className="fixed inset-0 z-[99990]"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMenuOpen(false);
                    }}
                  />
                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={menuStyle}
                    className="bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden animate-pop origin-top-right py-2"
                  >
                    <div className="bg-[#18254D] px-4 py-2.5 border-b border-white/10 mb-1">
                      <p className="text-[10px] font-bold text-white/50 tracking-wider uppercase">
                        Quick Actions
                      </p>
                    </div>
                    {availableStatuses.map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => handleStatusUpdate(status)}
                        className="w-full text-left px-4 py-2.5 text-xs font-semibold tracking-wider text-[#18254D] hover:bg-slate-50 transition-colors"
                      >
                        Move to {status}
                      </button>
                    ))}
                  </div>
                </>,
                document.body,
              )
            )}
          </div>
        </div>
      </td>
    </tr>
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
  const [selectedPriority, setSelectedPriority] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const { searchTerm, setSearchTerm } = useSearch(setCurrentPage);
  const [isFilterPopupOpen, setIsFilterPopupOpen] = useState(false);
  const COLUMNS =
    selectedCategory === 1
      ? TECH_COLUMNS
      : selectedCategory === 2
        ? MEDIA_COLUMNS
        : ALL_COLUMNS;

  const [activeStage, setActiveStage] = useState("All");

  // Sync activeStage when selectedCategory changes if current activeStage is not in new COLUMNS
  useEffect(() => {
    if (!COLUMNS.find((c) => c.id === activeStage)) {
      setActiveStage("All");
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
        style.maxHeight = "calc(100dvh - 24px)";
        style.minWidth = "min(92vw, 400px)";
        style.borderRadius = "24px";
      } else {
        const popupWidth = Math.min(384, windowWidth - 32); 
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

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    projectName: "",
    projectStatus: "In Progress",
    projectCategory: 1,
    projectPriority: "High",
    projectDescription: "",
    country: "India",
    state: "",
    currency: "INR",
    organisationName: "",
    clientStatus: "Active",
    onboardingDate: new Date().toISOString().split("T")[0],
    deadline: "",
    budget: "",
    scopeDocument: "",
  });

  const getAvailableStatuses = (currentStatus) => {
    return COLUMNS.filter(
      (col) => col.id !== currentStatus && col.id !== "All",
    ).map((col) => col.id);
  };
  const activeColumn = COLUMNS.find((c) => c.id === activeStage) || COLUMNS[0];
  const filteredProjects = projects.filter((p) => {
    const matchesStatus = activeStage === "All" ? true : p.status === activeStage;
    const matchesCategory =
      selectedCategory === "All" ? true : (p.category || 1) === selectedCategory;
    const matchesPriority = 
      selectedPriority === "All" ? true : (p.priority?.toLowerCase() === selectedPriority.toLowerCase());
    const query = searchTerm.toLowerCase();
    const matchedClient = clients.find(
      (c) => c.id == p.clientId || c.client_id == p.clientId
    );
    const matchesSearch =
      !query ||
      p.name?.toLowerCase().includes(query) ||
      p.description?.toLowerCase().includes(query) ||
      matchedClient?.company?.toLowerCase().includes(query) ||
      matchedClient?.name?.toLowerCase().includes(query);
    return matchesStatus && matchesCategory && matchesPriority && matchesSearch;
  }).sort((a, b) => {
    if (!a.deadline && !b.deadline) return 0;
    if (!a.deadline) return 1;
    if (!b.deadline) return -1;
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  });
  const RECORDS_PER_PAGE = 10;
  const totalPages = Math.ceil(filteredProjects.length / RECORDS_PER_PAGE);
  const currentProjects = filteredProjects.slice(
    (currentPage - 1) * RECORDS_PER_PAGE,
    currentPage * RECORDS_PER_PAGE,
  );

  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
  };

  const handleEditProject = (project) => {
    if (onSelectProject) {
      onSelectProject(project);
    }
  };

  const totalProjectsCount = projects.length;
  const inProgressCount = projects.filter((p) => p.status === "In Progress").length;
  const holdCount = projects.filter((p) => p.status === "Hold").length;
  const completedCount = projects.filter((p) => p.status === "Completed").length;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedClientId) {
      toast.error("Please select an existing client.");
      return;
    }

    const isValid = validateForm(formData, {
      projectName: { required: true, minLength: 2, label: "Project Name" },
      projectDescription: { required: true, label: "Project Description" },
      projectCategory: { required: true, label: "Project Category" },
      projectStatus: { required: true, label: "Project Status" },
      projectPriority: { required: true, label: "Project Priority" },
      budget: { required: true, type: "number", label: "Project Budget" },
      onboardingDate: { required: true, label: "Onboarding Date" },
      deadline: { required: true, label: "Deadline Date" },
      scopeDocument: { required: true, label: "Scope Document" },
    });

    if (!isValid) return;

    setIsSubmitting(true);

    try {
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
        country: "India",
        state: "",
        currency: "INR",
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
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-screen relative overflow-x-hidden">  
      <div className="space-y-4 sm:space-y-5 lg:space-y-6 animate-fade-in px-0">
        {/* Header */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          <div className="max-w-2xl">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary tracking-tight mb-2">
              Projects
            </h2>
            <p className="text-sm text-textMuted font-medium leading-relaxed">
              Manage and track all your projects and their delivery status.
            </p>
          </div>
          <div className="w-full lg:w-auto">
            <button
              onClick={() => setShowAddModal(true)}
              className="w-full lg:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-[#18254D] text-white rounded-2xl hover:bg-slate-800 transition-all text-[13px] font-bold tracking-wider shadow-lg active:scale-95 group"
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

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 sm:p-5 lg:p-6 rounded-2xl shadow-sm border border-slate-200 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="p-2 sm:p-3 rounded-full bg-blue-50 text-blue-500 shrink-0">
                <Briefcase className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="text-slate-500 text-[10px] sm:text-xs font-semibold truncate">
                  Total Projects
                </h3>
                <p className="text-lg sm:text-2xl font-bold text-[#18254D] leading-none mt-1">
                  {totalProjectsCount}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-3 sm:p-5 rounded-2xl shadow-sm border border-slate-200 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="p-2 sm:p-3 rounded-full bg-amber-50 text-amber-500 shrink-0">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="text-slate-500 text-[10px] sm:text-xs font-semibold truncate">
                  In Progress
                </h3>
                <p className="text-lg sm:text-2xl font-bold text-[#18254D] leading-none mt-1">
                  {inProgressCount}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-3 sm:p-5 rounded-2xl shadow-sm border border-slate-200 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="p-2 sm:p-3 rounded-full bg-rose-50 text-rose-500 shrink-0">
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="text-slate-500 text-[10px] sm:text-xs font-semibold truncate">
                  Hold
                </h3>
                <p className="text-lg sm:text-2xl font-bold text-[#18254D] leading-none mt-1">
                  {holdCount}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-3 sm:p-5 rounded-2xl shadow-sm border border-slate-200 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="p-2 sm:p-3 rounded-full bg-emerald-50 text-emerald-500 shrink-0">
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="text-slate-500 text-[10px] sm:text-xs font-semibold truncate">
                  Completed
                </h3>
                <p className="text-lg sm:text-2xl font-bold text-[#18254D] leading-none mt-1">
                  {completedCount}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Control Bar */}
        <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm relative z-[60]">
          <div className="flex flex-col lg:flex-row lg:justify-between gap-4 w-full items-center">
            {/* 1. Search Bar */}
            <div className="relative w-full lg:w-[320px] flex-none transition-all duration-300">
              <Search
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-[38px] pl-11 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium text-[#18254D] focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-400"
              />
            </div>

            {/* 2. Filters Button */}
            <div className="relative w-full sm:w-auto flex-none" ref={filterButtonRef}>
              <button
                onClick={() => setIsFilterPopupOpen(!isFilterPopupOpen)}
                className={`w-full md:w-auto h-[38px] flex items-center justify-center gap-2.5 px-6 py-2 rounded-xl text-[12px] font-bold tracking-widest transition-all shadow-sm active:scale-95 group border ${
                  selectedCategory !== "All" || selectedPriority !== "All"
                    ? "bg-indigo-50 border-indigo-500 text-indigo-600"
                    : "bg-slate-50 border-slate-100 text-[#18254D] hover:bg-white hover:border-slate-200 shadow-slate-200/50"
                }`}
              >
                <Filter
                  size={14}
                  className={selectedCategory !== "All" || selectedPriority !== "All" ? "text-indigo-600" : "text-slate-400"}
                />
                <span>FILTERS</span>
                {selectedCategory !== "All" || selectedPriority !== "All" ? (
                  <span className="flex items-center justify-center w-5 h-5 bg-indigo-600 text-white text-[10px] font-black rounded-full ml-1 shadow-sm">
                    {(selectedCategory !== "All" ? 1 : 0) + (selectedPriority !== "All" ? 1 : 0)}
                  </span>
                ) : null}
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
                            Filter Projects
                          </h3>
                        </div>
                        {(selectedCategory !== "All" || selectedPriority !== "All") && (
                          <button
                            onClick={() => {
                              handleCategoryChange("All");
                              setSelectedPriority("All");
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
                        {/* Category Section */}
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-400 tracking-wider uppercase ml-1 flex items-center gap-1.5">
                            <Tag size={12} /> Project Category
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

                        {/* Priority Section */}
                        <div className="space-y-3 pt-4 border-t border-slate-50">
                          <label className="text-[10px] font-black text-slate-400 tracking-wider uppercase ml-1 flex items-center gap-1.5">
                            <Zap size={12} /> Project Priority
                          </label>
                          <SearchableDropdown
                            placeholder="Select Priority..."
                            options={[
                              { label: "ALL", value: "All" },
                              { label: "HIGH", value: "High" },
                              { label: "MEDIUM", value: "Medium" },
                              { label: "LOW", value: "Low" },
                            ]}
                            value={selectedPriority}
                            onChange={(val) => {
                              setSelectedPriority(val);
                              setCurrentPage(1);
                            }}
                          />
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

        {/* Stage Tabs */}
        <div className="flex overflow-x-auto scrollbar-hide sm:flex-wrap sm:overflow-visible justify-start gap-2 pb-1 sm:gap-3 w-full px-1 sm:px-0">
          {["All", "In Progress", "Hold", "Completed"].map((status) => {
            const isActive = activeStage === status;
            const activeStyles =
              status === "All"
                ? "bg-[#EFF6FF] text-[#2563EB] border-[#3B82F6] shadow-sm"
                : status === "In Progress"
                  ? "bg-[#FFF7ED] text-[#C2410C] border-[#F97316] shadow-sm"
                  : status === "Hold"
                    ? "bg-[#FFF1F2] text-[#BE123C] border-[#F43F5E] shadow-sm"
                    : "bg-[#F0FDF4] text-[#15803D] border-[#16A34A] shadow-sm";
            const inactiveStyles = "bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700";

            return (
              <button
                key={status}
                onClick={() => {
                  setActiveStage(status);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 sm:px-5 sm:py-2 rounded-full text-[12px] sm:text-[13px] font-bold flex items-center gap-2 transition-all cursor-pointer border ${isActive ? activeStyles : inactiveStyles}`}
              >
                <LayoutGrid size={16} />
                {status}
              </button>
            );
          })}
        </div>

        {/* Main List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden w-full">
          <div className="w-full overflow-x-auto custom-scrollbar rounded-2xl">
            <table className="min-w-[1100px] w-full border-collapse">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-y border-slate-100 first:border-l first:rounded-l-xl">
                    Project Name
                  </th>
                  <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-y border-slate-100">
                    Client
                  </th>
                  <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-y border-slate-100">
                    Priority
                  </th>
                  <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-y border-slate-100">
                    Onboard Date
                  </th>
                  <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-y border-slate-100">
                    Deadline
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
                {currentProjects.map((project, index) => (
                  <ProjectCard
                    key={project.id || `project-row-${index}`}
                    project={project}
                    clients={clients}
                    onEdit={handleEditProject}
                    onUpdateProject={onUpdateProject}
                    availableStatuses={getAvailableStatuses(project.status)}
                    onSelectProject={onSelectProject}
                    onDelete={setProjectToDelete}
                  />
                ))}
                {filteredProjects.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-10 py-32 text-center">
                      <div className="text-slate-300 p-4 rounded-xl mb-4 flex items-center justify-center mx-auto">
                        <Briefcase size={32} strokeWidth={1.5} />
                      </div>
                      <p className="text-[13px] font-bold text-[#18254D] tracking-wider">
                        No Projects Found
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

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
              <span className="text-[12px] font-bold text-slate-500 tracking-widest px-2">
                {currentPage} / {totalPages}
              </span>
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
      {showAddModal &&
        createPortal(
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[99999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto no-scrollbar">
            <div className="absolute inset-0" onClick={() => setShowAddModal(false)} />
            <div className="relative z-10 bg-white w-full max-w-[95vw] sm:max-w-xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-pop flex flex-col h-[100dvh] sm:h-auto sm:max-h-[90vh]">
              <div className="p-4 sm:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#EFF6FF] text-[#3B82F6] rounded-xl flex items-center justify-center border border-[#DBEAFE] shadow-sm">
                    <Briefcase size={16} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#18254D] tracking-tight">
                      New Project
                    </h3>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-0.5">
                      Create Project & Link Client
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

              <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto no-scrollbar">
              {/* CLIENT DETAILS HEADING */}
              <div className="flex items-center gap-2 pt-1">
                <div className="h-[2px] w-6 bg-indigo-500 rounded-full" />
                <h4 className="text-[11px] font-black text-[#18254D] tracking-widest uppercase">
                  Client Assignment
                </h4>
                <div className="h-[2px] flex-1 bg-slate-100 rounded-full" />
              </div>

              {/* CLIENT NAME SEARCHABLE DROPDOWN */}
              <div className="space-y-1.5 relative">
                <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                  SELECT EXISTING CLIENT <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search existing clients..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200"
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
                    size={16}
                    className={`absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-transform ${isClientDropdownOpen ? "rotate-180" : ""}`}
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
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden z-[90] animate-fade-in-up origin-top max-h-[200px] overflow-y-auto custom-scrollbar">
                        <div className="bg-[#18254D] px-4 py-2.5 border-b border-white/10 sticky top-0">
                          <p className="text-[10px] font-bold text-white/50 tracking-wider uppercase">
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
                                  ? "bg-slate-100 border-l-4 border-indigo-500"
                                  : "hover:bg-slate-50"
                              }`}
                            >
                              <p className="text-sm font-bold text-[#18254D]">
                                {client.name}
                              </p>
                              <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
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
                          <p className="px-4 py-3 text-[11px] text-slate-400 font-bold text-center">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                      ORGANISATION NAME
                    </label>
                    <p className="px-4 min-h-[44px] py-2.5 bg-white border border-slate-200 rounded-xl text-[13px] font-semibold text-[#18254D] shadow-sm truncate">
                      {formData.organisationName || "—"}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                      EMAIL
                    </label>
                    <p className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[13px] font-semibold text-[#18254D] shadow-sm truncate">
                      {formData.email || "—"}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                      PHONE
                    </label>
                    <p className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[13px] font-semibold text-[#18254D] shadow-sm truncate">
                      {formData.phone || "—"}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                      COUNTRY
                    </label>
                    <p className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[13px] font-semibold text-[#18254D] shadow-sm truncate">
                      {formData.country || "—"}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                      CURRENCY
                    </label>
                    <p className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[13px] font-semibold text-[#18254D] shadow-sm truncate">
                      {formData.currency || "—"}
                    </p>
                  </div>
                </div>
              )}

              {/* PROJECT DETAILS HEADING */}
              <div className="flex items-center gap-2 pt-3">
                <div className="h-[2px] w-6 bg-indigo-500 rounded-full" />
                <h4 className="text-[11px] font-black text-[#18254D] tracking-widest uppercase">
                  Project Details
                </h4>
                <div className="h-[2px] flex-1 bg-slate-100 rounded-full" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* PROJECT NAME */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                    PROJECT NAME <span className="text-rose-500">*</span>
                  </label>
                  <input
                    required
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

                {/* PROJECT DESCRIPTION */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                    PROJECT DESCRIPTION <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
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

                {/* PROJECT CATEGORY */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                    PROJECT CATEGORY <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                      className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold shadow-sm hover:border-[#18254D]/30 transition-all text-[#18254D]"
                    >
                      <span>
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
                        <div className="absolute top-full left-0 right-0 max-h-[260px] overflow-y-auto mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden z-[90] animate-fade-in-up origin-top">
                          <div className="bg-[#18254D] px-4 py-2.5 border-b border-white/10">
                            <p className="text-[10px] font-bold text-white/50 tracking-wider uppercase">
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
                              className={`w-full text-left px-4 py-2.5 text-xs font-semibold tracking-wider transition-colors ${
                                formData.projectCategory === catId
                                  ? "bg-slate-100 text-indigo-600"
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
                  <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                    PROJECT STATUS <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setIsStatusDropdownOpen(!isStatusDropdownOpen)
                      }
                      className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold shadow-sm hover:border-[#18254D]/30 transition-all text-[#18254D]"
                    >
                      <span>
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
                          <div className="bg-[#18254D] px-4 py-2.5 border-b border-white/10">
                            <p className="text-[10px] font-bold text-white/50 tracking-wider uppercase">
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
                              className={`w-full text-left px-4 py-2.5 text-xs font-semibold tracking-wider transition-colors ${
                                formData.projectStatus === status
                                  ? "bg-slate-100 text-indigo-600"
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
                  <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                    PROJECT PRIORITY <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setIsPriorityDropdownOpen(!isPriorityDropdownOpen)
                      }
                      className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold shadow-sm hover:border-[#18254D]/30 transition-all text-[#18254D]"
                    >
                      <span>
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
                          <div className="bg-[#18254D] px-4 py-2.5 border-b border-white/10">
                            <p className="text-[10px] font-bold text-white/50 tracking-wider uppercase">
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
                              className={`w-full text-left px-4 py-2.5 text-xs font-semibold tracking-wider transition-colors ${
                                formData.projectPriority === level
                                  ? "bg-slate-100 text-indigo-600"
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
                  <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1 flex items-center gap-1.5">
                    PROJECT BUDGET
                    {formData.currency && (
                      <span className="text-slate-400 font-bold">
                        ({formData.currency})
                      </span>
                    )}
                    <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                      {commonCurrencies.find((c) => c.code === formData.currency)?.symbol ||
                        (formData.currency ? formData.currency : "₹")}
                    </div>
                    <input
                      type="text"
                      placeholder={
                        formData.currency === "USD"
                          ? "e.g. 5,000"
                          : "e.g. 5,00,000"
                      }
                      className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-[#18254D]/5 focus:border-[#18254D]/30 focus:outline-none text-sm font-semibold text-[#18254D]"
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
                  <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                    ONBOARDING DATE <span className="text-rose-500">*</span>
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
                  <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                    DEADLINE (TENTATIVE) <span className="text-rose-500">*</span>
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
                  <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">
                    SCOPE DOCUMENT <span className="text-rose-500">*</span>
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
                    <div className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl group-hover:border-indigo-300 transition-all flex items-center gap-3 shadow-sm">
                      <div className="p-1.5 bg-white border border-slate-200 rounded-lg shadow-sm">
                        <Upload size={16} className="text-indigo-500" />
                      </div>
                      <span
                        className={`text-sm font-semibold truncate max-w-[180px] sm:max-w-full ${formData.scopeDocument ? "text-[#18254D]" : "text-slate-400"}`}
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
                    disabled={isSubmitting}
                    className="w-full h-12 bg-[#18254D] text-white rounded-xl text-xs font-bold tracking-wider shadow-lg active:scale-[0.97] transition-all hover:bg-[#1e2e5e] hover:shadow-xl flex items-center justify-center gap-2 group/btn disabled:opacity-70 disabled:cursor-not-allowed btn-animated"
                  >
                    {isSubmitting ? (
                      <>
                        <span>ADDING PROJECT...</span>
                        <Loader2 size={16} className="animate-spin" />
                      </>
                    ) : (
                      <>
                        <span>ADD PROJECT</span>
                        <Briefcase
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
      {/* Delete Confirmation Modal */}
      {projectToDelete &&
        createPortal(
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[99999] flex items-center justify-center p-4 overflow-y-auto">
            <div className="absolute inset-0" onClick={() => setProjectToDelete(null)} />
            <div className="relative z-10 bg-white w-full max-w-[95vw] sm:max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-pop flex flex-col">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#FFF1F2] text-[#F43F5E] rounded-xl flex items-center justify-center border border-[#FFE4E6] shadow-sm">
                    <AlertTriangle size={16} />
                  </div>
                  <h3 className="text-base font-bold text-[#18254D] tracking-tight">
                    Confirm Deletion
                  </h3>
                </div>
                <button
                  onClick={() => setProjectToDelete(null)}
                  className="p-1.5 hover:bg-slate-200 rounded-xl text-slate-400 transition-all"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div className="space-y-2">
                  <p className="text-slate-600 text-sm font-semibold leading-relaxed">
                    Are you sure you want to delete the project{" "}
                    <span className="text-[#F43F5E] font-bold underline underline-offset-4">
                      "{projectToDelete.name}"
                    </span>
                    ? This action cannot be undone and all associated data will be removed.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setProjectToDelete(null)}
                    className="flex-1 h-12 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold tracking-wider hover:bg-slate-200 transition-all active:scale-[0.98] btn-animated uppercase"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteProject && onDeleteProject(projectToDelete.project_id || projectToDelete.id);
                      setProjectToDelete(null);
                    }}
                    className="flex-1 h-12 bg-[#F43F5E] text-white rounded-xl text-xs font-bold tracking-wider shadow-md hover:bg-[#E11D48] transition-all active:scale-[0.98] flex items-center justify-center gap-1 sm:gap-2 flex-wrap btn-animated uppercase"
                  >
                    <span>Delete Project</span>
                    <Trash2 size={14} />
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

export default ProjectBoard;