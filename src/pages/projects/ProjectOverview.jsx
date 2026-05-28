import React, { useState, useRef } from "react";
import { toast } from "react-hot-toast";
import { addToGoogleCalendar } from "../../utils/calendar";

import {
  ArrowLeft,
  Calendar,
  IndianRupee,
  Pencil,
  Save,
  AlertCircle,
  CheckCircle,
  Zap,
  Tag,
  Mail,
  Phone,
  MessageSquare,
  FileText,
  Eye,
  Download,
  Upload,
  Loader2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  Briefcase,
  TrendingUp,
  Info,
  Users,
  Trash2,
  PlayCircle,
  PauseCircle,
} from "lucide-react";
import DatePicker from "../../components/ui/DatePicker";
import { CATEGORY_MAP } from "../../constants/categoryConstants";
import { BASE_URL } from "../../constants/config";
import { validateForm } from "../../utils/validation";
import { commonCurrencies } from "../../utils/locationData";
import { formatBudget, parseBudget } from "../../utils/formatters";

const parseLocalDate = (dateStr) => {
  if (!dateStr) return new Date();
  if (dateStr instanceof Date) return dateStr;
  if (typeof dateStr === "string" && dateStr.includes("T") && dateStr.endsWith("Z")) {
    const normalized = dateStr.replace("T", " ").replace("Z", "").split(".")[0];
    const date = new Date(normalized);
    if (!isNaN(date.getTime())) return date;
  }
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? new Date() : date;
};

const getModeBadge = (mode) => {
  switch (mode?.toLowerCase()) {
    case "call":
      return "bg-green-100 text-green-700 border-green-200";
    case "email":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "meeting":
      return "bg-purple-100 text-purple-700 border-purple-200";
    case "whatsapp":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
};

const getPriorityStyles = (p) => {
  switch (p?.toLowerCase()) {
    case "critical":
    case "high":
      return {
        badge: "bg-red-50 text-red-600 border-red-100",
        icon: AlertCircle,
        color: "text-red-500",
        iconBg: "bg-red-50",
      };
    case "medium":
      return {
        badge: "bg-orange-50 text-orange-600 border-orange-100",
        icon: Zap,
        color: "text-orange-500",
        iconBg: "bg-orange-50",
      };
    case "low":
      return {
        badge: "bg-blue-50 text-blue-600 border-blue-100",
        icon: Tag,
        color: "text-blue-500",
        iconBg: "bg-blue-50",
      };
    default:
      return {
        badge: "bg-slate-50 text-slate-600 border-slate-200",
        icon: Tag,
        color: "text-slate-400",
        iconBg: "bg-slate-50",
      };
  }
};

const getStatusStyles = (status) => {
  switch (status?.toLowerCase()) {
    case "completed":
    case "live":
      return { color: "text-emerald-500", bg: "bg-emerald-50", badge: "bg-emerald-50 text-emerald-600 border-emerald-100" };
    case "in progress":
    case "in_progress":
      return { color: "text-blue-500", bg: "bg-blue-50", badge: "bg-blue-50 text-blue-600 border-blue-100" };
    default:
      return { color: "text-slate-500", bg: "bg-slate-50", badge: "bg-slate-50 text-slate-600 border-slate-200" };
  }
};

const ConversationCard = ({ conv, onClick, onAddToCalendar }) => {
  const isFollowup = conv.source === "followup";
  const isPending = conv.source === "pending";
  const type = (conv.type || conv.followup_mode || "call").toLowerCase();

  const createdDate = parseLocalDate(conv.created_at || conv.createdAt || conv.joinedDate || conv.date || conv.dueDate);
  const completedDate = conv.completed_at ? parseLocalDate(conv.completed_at) : null;
  const dueDate = conv.followup_date ? parseLocalDate(conv.followup_date) : conv.dueDate ? parseLocalDate(conv.dueDate) : createdDate;

  return (
    <div
      onClick={onClick}
      className={`group min-w-full w-full shrink-0 snap-start rounded-2xl p-5 flex flex-col border border-slate-100 bg-white hover:shadow-lg transition-all cursor-pointer relative`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-50 text-slate-500 border border-slate-100">
            {type === "call" ? <Phone size={16} /> : type === "meeting" ? <Calendar size={16} /> : type === "whatsapp" ? <MessageSquare size={16} /> : <Mail size={16} />}
          </div>
          <div className="flex flex-col">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full w-max ${getModeBadge(type)}`}>
              {isPending ? "PENDING" : isFollowup ? "COMPLETED" : type}
            </span>
          </div>
        </div>

        {isPending && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToCalendar(conv);
            }}
            className="p-2 bg-slate-50 text-slate-400 rounded-full hover:bg-blue-50 hover:text-blue-600 transition-colors"
            title="Add to Google Calendar"
          >
            <Calendar size={16} />
          </button>
        )}
      </div>

      {conv.title && <h5 className="text-[15px] font-semibold text-slate-800 mb-2 line-clamp-1">{conv.title}</h5>}

      <div className="flex-1 mb-4">
        <p className="text-[13px] text-slate-500 leading-relaxed line-clamp-3">{conv.description || conv.follow_brief}</p>
      </div>

      <div className="mt-auto pt-4 border-t border-slate-50 flex flex-col gap-2 text-[12px] text-slate-400 font-medium">
        <div className="flex items-center gap-2">
          <Clock size={14} className={isPending ? "text-orange-400" : "text-slate-400"} />
          <span>{dueDate.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}</span>
        </div>
      </div>
    </div>
  );
};

const ProjectOverview = ({
  project,
  client,
  lead,
  onBack,
  onUpdateProject,
  followUps,
  activities,
  onSelectClient,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const pendingRef = useRef(null);
  const historyRef = useRef(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  const [formData, setFormData] = useState({
    name: project?.name || "",
    status: project?.status || "Pending",
    category: project?.category || 1,
    priority: project?.priority || "Medium",
    progress: project?.progress || 0,
    onboardingDate: project?.onboardingDate || "",
    deadline: project?.deadline || "",
    budget: project?.budget || 0,
    description: project?.description || "",
    scopeFile: null,
  });

  React.useEffect(() => {
    if (project && !isEditing) {
      setFormData({
        name: project.name || "",
        status: project.status || "Pending",
        category: project.category || 1,
        priority: project.priority || "Medium",
        progress: project.progress || 0,
        onboardingDate: project.onboardingDate || "",
        deadline: project.deadline || "",
        budget: project.budget || 0,
        description: project.description || "",
        scopeFile: null,
      });
    }
  }, [project, isEditing]);

  const handleSave = async () => {
    if (!validateForm(formData, {
      name: { required: true, minLength: 2, label: "Project Name" },
      status: { required: true, label: "Project Status" },
      priority: { required: true, label: "Project Priority" },
    })) return;

    setIsSubmitting(true);
    try {
      if (onUpdateProject && project?.id) {
        await onUpdateProject({ ...project, ...formData });
        setIsEditing(false);
      }
    } catch (error) {
      toast.error("Failed to update project.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = async (filename) => {
    try {
      const response = await fetch(`${BASE_URL}/uploads/${filename}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
      window.open(`${BASE_URL}/uploads/${filename}`, "_blank");
    }
  };

  const scrollContainer = (ref, dir) => {
    if (ref.current) {
      const scrollAmount = ref.current.clientWidth;
      ref.current.scrollBy({ left: dir === "left" ? -scrollAmount : scrollAmount, behavior: "smooth" });
    }
  };

  const currencySymbol = commonCurrencies.find((c) => c.code === client?.currency)?.symbol || "₹";

  const CustomDropdown = ({ label, value, options, field, icon: Icon }) => (
    <div className="space-y-1 relative w-full">
      <button
        type="button"
        onClick={() => setActiveDropdown(activeDropdown === field ? null : field)}
        className="w-full flex items-center justify-between px-2.5 py-1.5 sm:px-4 sm:py-3 bg-white border border-slate-200 rounded-lg sm:rounded-xl hover:border-blue-400 transition-colors text-xs sm:text-sm font-medium text-slate-700 shadow-sm"
      >
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          {Icon && <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 shrink-0" />}
          <span className="truncate">{CATEGORY_MAP[value] || value}</span>
        </div>
        <ChevronDown size={14} className={`text-slate-400 shrink-0 transition-transform ${activeDropdown === field ? "rotate-180" : ""}`} />
      </button>

      {activeDropdown === field && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setActiveDropdown(null)} />
          <div className="absolute top-full left-0 right-0 mt-1 sm:mt-2 bg-white border border-slate-100 rounded-lg sm:rounded-xl shadow-xl overflow-hidden z-50 py-1">
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  setFormData({ ...formData, [field]: opt });
                  setActiveDropdown(null);
                }}
                className={`w-full text-left px-2.5 py-1.5 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-medium transition-colors ${
                  value === opt ? "bg-blue-50 text-blue-600" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                {CATEGORY_MAP[opt] || opt}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );

  const SquareIcon = ({ colorClass }) => (
    <div className={`w-[13px] h-[13px] border-[1.5px] rounded-[3px] ${colorClass} shrink-0`} />
  );

  return (
    <div className="w-full h-full relative space-y-6 pb-12">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-[13px] font-medium text-slate-400 mb-6">
        <button onClick={onBack} className="hover:text-blue-500 transition-colors">Projects</button>
        <ChevronRight size={14} className="text-slate-300" />
        <span className="text-[#18254D] truncate max-w-[200px]">{project?.name || "Untitled Project"}</span>
        <ChevronRight size={14} className="text-slate-300" />
        <span className="text-slate-500">Details</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#18254D] rounded-xl flex items-center justify-center shrink-0 shadow-sm text-white">
             <Briefcase size={20} />
          </div>
          <div>
            <h2 className="text-xl sm:text-[22px] font-medium text-[#18254D] leading-tight mb-0.5">
              {project?.name || "Untitled Project"}
            </h2>
            <p className="text-xs sm:text-[13px] text-slate-500 font-medium">
              Overview of the project progress and timeline
            </p>
          </div>
        </div>
        
        {isEditing ? (
          <div className="flex w-full sm:w-auto justify-between sm:justify-start gap-3">
             <button onClick={() => setIsEditing(false)} className="flex-1 sm:flex-none px-5 py-2.5 bg-white border border-slate-200/60 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 shadow-sm transition-colors text-center">
               Cancel
             </button>
             <button onClick={handleSave} disabled={isSubmitting} className="flex-1 sm:flex-none justify-center px-5 py-2.5 bg-[#18254D] rounded-xl text-sm font-semibold text-white hover:bg-[#2B3B60] shadow-sm transition-colors flex items-center gap-2">
               {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save
             </button>
          </div>
        ) : (
          <div className="flex items-center w-full sm:w-auto justify-between sm:justify-start gap-2 mt-2 sm:mt-0">
            <button onClick={() => setIsEditing(true)} className="w-[45%] sm:w-[34px] h-[38px] sm:h-[34px] flex items-center justify-center bg-blue-50 text-blue-600 border border-blue-100 rounded-xl sm:rounded-[10px] hover:bg-blue-100 transition-all active:scale-90 shadow-sm relative group/btn" title="Edit Project">
              <Pencil size={16} />
              <div className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 opacity-0 group-hover/btn:opacity-100 transition-opacity bg-[#18254D] text-white text-[10px] font-bold px-2.5 py-1 rounded-[6px] whitespace-nowrap pointer-events-none z-[100] shadow-md">
                Edit
              </div>
            </button>
            <button onClick={() => toast.error("Delete function not bound in overview yet")} className="w-[45%] sm:w-[34px] h-[38px] sm:h-[34px] flex items-center justify-center bg-[#FEF2F2] border border-[#FECACA] rounded-xl sm:rounded-[10px] text-[#EF4444] hover:text-[#DC2626] hover:border-[#FCA5A5] transition-all active:scale-90 shadow-sm relative group/btn" title="Delete Project">
              <Trash2 size={16} />
              <div className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 opacity-0 group-hover/btn:opacity-100 transition-opacity bg-[#18254D] text-white text-[10px] font-bold px-2.5 py-1 rounded-[6px] whitespace-nowrap pointer-events-none z-[100] shadow-md">
                Delete
              </div>
            </button>
          </div>
        )}
      </div>

      {/* KPI Top Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
        
        {/* Budget */}
        <div className="bg-white p-4 sm:p-5 lg:p-6 rounded-2xl shadow-sm border border-slate-200 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="p-2 sm:p-3 rounded-full bg-emerald-50 text-emerald-500 shrink-0">
              <IndianRupee className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0 w-full">
              <h3 className="text-slate-500 text-[10px] sm:text-xs font-semibold truncate">
                Budget
              </h3>
              {isEditing ? (
                 <input type="text" value={formatBudget(formData.budget, client?.currency)} onChange={(e) => setFormData({ ...formData, budget: parseBudget(e.target.value) })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 mt-1 text-lg sm:text-xl font-bold text-[#18254D] outline-none focus:border-blue-400" />
              ) : (
               <p className="text-base sm:text-lg font-bold text-[#18254D] leading-none mt-1">
                   {currencySymbol}{formatBudget(formData.budget, client?.currency)}
                 </p>
              )}
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="bg-white p-4 sm:p-5 lg:p-6 rounded-2xl shadow-sm border border-slate-200 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="p-2 sm:p-3 rounded-full bg-blue-50 text-blue-500 shrink-0">
              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0 w-full">
              <h3 className="text-slate-500 text-[10px] sm:text-xs font-semibold truncate">
                Status
              </h3>
              {isEditing ? (
                 <div className="mt-1"><CustomDropdown label="Status" value={formData.status} field="status" options={["Hold", "In Progress", "Completed"]} /></div>
              ) : (
               <p className="text-base sm:text-lg font-bold text-[#18254D] leading-none mt-1">
                   {formData.status}
                 </p>
              )}
            </div>
          </div>
        </div>

        {/* Priority */}
        <div className="bg-white p-4 sm:p-5 lg:p-6 rounded-2xl shadow-sm border border-slate-200 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="p-2 sm:p-3 rounded-full bg-orange-50 text-orange-500 shrink-0">
              <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0 w-full">
              <h3 className="text-slate-500 text-[10px] sm:text-xs font-semibold truncate">
                Priority
              </h3>
              {isEditing ? (
                 <div className="mt-1"><CustomDropdown label="Priority" value={formData.priority} field="priority" options={["Low", "Medium", "High"]} /></div>
              ) : (
               <p className="text-base sm:text-lg font-bold text-[#18254D] leading-none mt-1">
                   {formData.priority}
                 </p>
              )}
            </div>
          </div>
        </div>

        {/* Category */}
        <div className="bg-white p-4 sm:p-5 lg:p-6 rounded-2xl shadow-sm border border-slate-200 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="p-2 sm:p-3 rounded-full bg-purple-50 text-purple-500 shrink-0">
              <Briefcase className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0 w-full">
              <h3 className="text-slate-500 text-[10px] sm:text-xs font-semibold truncate">
                Category
              </h3>
              {isEditing ? (
                 <div className="mt-1"><CustomDropdown label="Category" value={formData.category} field="category" options={[1, 2]} /></div>
              ) : (
               <p className="text-base sm:text-lg font-bold text-[#18254D] leading-none mt-1">
                   {CATEGORY_MAP[formData.category] || formData.category}
                 </p>
              )}
            </div>
          </div>
        </div>

      </div>      {/* Main Grid Layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-stretch">
        
        {/* Left Column Wrapper */}
        <div className="contents lg:flex lg:flex-col lg:w-2/3 lg:gap-6">
          
          {/* Main Details */}
          <div className="bg-white rounded-2xl p-5 lg:p-6 shadow-sm border border-slate-200 order-1 lg:order-none w-full flex-1 flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
                <Info size={16} />
              </div>
              <h3 className="text-[15px] font-bold text-[#18254D]">Project details</h3>
            </div>
            
            <h4 className="text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-3">Project Name</h4>
            <div className="mb-6">
               {isEditing ? (
                 <input
                   type="text"
                   value={formData.name}
                   onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                   className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-[13px] font-medium text-[#18254D] focus:outline-none focus:border-blue-400 shadow-sm"
                   placeholder="Enter Project Name"
                 />
               ) : (
                 <p className="text-[13px] font-bold text-[#18254D] bg-slate-50 p-4 rounded-xl border border-slate-100">
                   {formData.name || "Untitled Project"}
                 </p>
               )}
            </div>

            <h4 className="text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-3">Description</h4>
            
            <div className="bg-slate-50 rounded-2xl p-5 min-h-[200px] border border-slate-100 flex-1 flex flex-col">
               {isEditing ? (
                 <textarea
                   value={formData.description}
                   onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                   className="w-full h-full min-h-[160px] bg-transparent border-none text-[13px] font-medium text-slate-600 focus:outline-none resize-none flex-1"
                   placeholder="Brief overview of the project scope..."
                 />
               ) : (
                 <div className="flex-1 flex flex-col">
                   <p className={`text-[13px] font-medium text-slate-500 leading-relaxed whitespace-pre-wrap ${!isDescriptionExpanded ? "line-clamp-6" : ""}`}>
                     {formData.description || "Project details"}
                   </p>
                   {formData.description && formData.description.length > 300 && (
                     <button 
                       onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                       className="text-blue-500 text-[13px] font-medium mt-3 self-start hover:text-blue-600 transition-colors"
                     >
                       {isDescriptionExpanded ? "Read Less" : "Read More"}
                     </button>
                   )}
                 </div>
               )}
            </div>
          </div>

          {/* Documents */}
          <div className="bg-white rounded-2xl p-5 lg:p-6 shadow-sm border border-slate-200 order-4 lg:order-none w-full">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center">
                <FileText size={16} />
              </div>
              <h3 className="text-[15px] font-bold text-[#18254D]">Documents</h3>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-4 mb-3 sm:mb-0 pl-2">
                <div className="w-10 h-10 bg-white shadow-sm rounded-xl flex items-center justify-center border border-slate-100">
                   <FileText size={16} className="text-blue-500" />
                </div>
                <div>
                  <p className="text-[13px] font-bold text-[#18254D]">Project Scope Document</p>
                  <p className="text-[11px] font-medium text-slate-400 mt-0.5">{project?.scopeDocument || "scope-1779779311855.pdf"}</p>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 pr-1 w-full sm:w-auto">
                {isEditing ? (
                  <>
                    <input type="file" accept=".pdf" id="scope-upload" className="hidden" onChange={(e) => setFormData({ ...formData, scopeFile: e.target.files[0] })} />
                    <label htmlFor="scope-upload" className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-[12px] font-bold text-slate-500 hover:bg-slate-50 transition-colors flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center shadow-sm">
                      <Upload size={14} className="text-slate-400" /> {formData.scopeFile ? "File Selected" : "Upload"}
                    </label>
                  </>
                ) : project?.scopeDocument ? (
                  <>
                    <a href={`${BASE_URL}/uploads/${project.scopeDocument}`} target="_blank" rel="noreferrer" className="flex-1 sm:flex-none px-5 py-2 bg-white border border-slate-200 rounded-xl text-[12px] font-bold text-slate-500 hover:bg-slate-50 shadow-sm transition-all flex items-center justify-center gap-2">
                      <Eye size={14} className="text-slate-400" /> View
                    </a>
                    <button 
                      onClick={() => handleDownload(project.scopeDocument)}
                      className="flex-1 sm:flex-none px-5 py-2 bg-white border border-slate-200 rounded-xl text-[12px] font-bold text-slate-500 hover:bg-slate-50 shadow-sm transition-all flex items-center justify-center gap-2">
                      <Download size={14} className="text-slate-400" /> Download
                    </button>
                  </>
                ) : (
                   <span className="text-[12px] font-medium text-slate-400 pr-3">No document attached</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column Wrapper */}
        <div className="contents lg:flex lg:flex-col lg:w-1/3 lg:gap-6">
          
          {/* Timeline Card */}
          <div className="bg-white rounded-2xl p-5 lg:p-6 shadow-sm border border-slate-200 order-2 lg:order-none w-full">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
                <Clock size={16} />
              </div>
              <h3 className="text-[15px] font-bold text-[#18254D]">Timeline</h3>
            </div>
            
            <div className="relative pl-6 space-y-8 before:absolute before:left-[4.5px] before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-200">
              
              <div className="relative">
                <div className="absolute -left-[28.5px] top-1.5 w-[11px] h-[11px] rounded-full bg-blue-500 ring-4 ring-white border border-slate-100"></div>
                <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-1">Onboarding Date</p>
                {isEditing ? (
                  <div className="mt-2"><DatePicker value={formData.onboardingDate} onChange={(val) => setFormData({ ...formData, onboardingDate: val })} /></div>
                ) : (
                  <p className="text-[13px] font-bold text-[#18254D]">
                    {formData.onboardingDate ? new Date(formData.onboardingDate).toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" }) : "May 27, 2026"}
                  </p>
                )}
              </div>

              <div className="relative">
                <div className="absolute -left-[28.5px] top-1.5 w-[11px] h-[11px] rounded-full bg-emerald-500 ring-4 ring-white border border-slate-100"></div>
                <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-1">Deadline (Tentative)</p>
                {isEditing ? (
                  <div className="mt-2"><DatePicker value={formData.deadline} onChange={(val) => setFormData({ ...formData, deadline: val })} /></div>
                ) : (
                  <p className="text-[13px] font-bold text-[#18254D]">
                    {formData.deadline ? new Date(formData.deadline).toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" }) : "June 2, 2026"}
                  </p>
                )}
              </div>

            </div>
          </div>

          {/* Stakeholders Card */}
          <div className="bg-white rounded-2xl p-5 lg:p-6 shadow-sm border border-slate-200 order-3 lg:order-none w-full flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center">
                  <Users size={16} />
                </div>
                <h3 className="text-[15px] font-bold text-[#18254D]">Client</h3>
              </div>
              
              <div className="flex items-center gap-4 mb-5">
                <div className="w-10 h-10 bg-[#18254D] text-white rounded-full flex items-center justify-center font-bold text-[13px] shadow-sm">
                  {client?.name?.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase() || "CW"}
                </div>
                <div>
                  <p className="text-[13px] font-bold text-[#18254D] leading-tight">{client?.name || "Carey Williams"}</p>
                  <p className="text-[11px] font-medium text-slate-400 mt-0.5">Client role</p>
                </div>
              </div>
              
              <div className="space-y-3 pl-1 mb-8">
                <div className="flex items-center gap-3">
                  <Mail size={14} className="text-slate-400" />
                  <span className="text-[12px] font-medium text-slate-500">{client?.email || "carey1@gmail.com"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone size={14} className="text-slate-400" />
                  <span className="text-[12px] font-medium text-slate-500">{client?.phone || "9618149706"}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-4 pt-4 border-t border-slate-100">Lead Source</h4>
              
              <div className="flex items-center gap-4 mb-5">
                <div className="w-10 h-10 bg-slate-50 text-slate-600 rounded-full flex items-center justify-center font-bold text-[13px] border border-slate-200">
                  {lead?.name?.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase() || "CW"}
                </div>
                <div>
                  <p className="text-[13px] font-bold text-[#18254D] leading-tight">{lead?.name || "Carey Williams"}</p>
                  <p className="text-[11px] font-medium text-slate-400 mt-0.5">Lead source</p>
                </div>
              </div>
              
              <div className="space-y-3 pl-1">
                <div className="flex items-center gap-3">
                  <Mail size={14} className="text-slate-400" />
                  <span className="text-[12px] font-medium text-slate-500">{lead?.email || "carey1@gmail.com"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone size={14} className="text-slate-400" />
                  <span className="text-[12px] font-medium text-slate-500">{lead?.phone || "9618149706"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProjectOverview;