import React, { useState, useRef } from "react";
import { toast } from "react-hot-toast";
import { addToGoogleCalendar } from "../../utils/calendar";

import {
  ArrowLeft,
  Calendar,
  IndianRupee,
  Edit2,
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
        className="w-full flex items-center justify-between px-4 py-3 bg-white border border-slate-200 rounded-xl hover:border-blue-400 transition-colors text-sm font-medium text-slate-700 shadow-sm"
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon size={16} className="text-slate-400" />}
          <span>{CATEGORY_MAP[value] || value}</span>
        </div>
        <ChevronDown size={14} className={`text-slate-400 transition-transform ${activeDropdown === field ? "rotate-180" : ""}`} />
      </button>

      {activeDropdown === field && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setActiveDropdown(null)} />
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-xl shadow-xl overflow-hidden z-50 py-1">
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  setFormData({ ...formData, [field]: opt });
                  setActiveDropdown(null);
                }}
                className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${
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

  return (
    <div className="w-full h-full relative space-y-6 min-h-screen pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <button onClick={onBack} className="p-2.5 hover:bg-white rounded-xl text-slate-400 hover:text-slate-700 transition-colors shadow-sm bg-white">
              <ArrowLeft size={20} />
            </button>
            <h2 className="text-xl md:text-2xl ml-2 font-bold text-slate-800 tracking-tight">
              {isEditing ? "Edit Project Details" : "Project Overview"}
            </h2>
          </div>
          <p className="text-sm text-slate-500 ml-14">Get a complete overview of the project progress and timeline.</p>
        </div>
      </div>

      {/* Project Name Section */}
      <div className="bg-gradient-to-r from-[#18254D] to-[#243B7A] rounded-2xl p-6 md:p-7 shadow-xl border border-[#243B7A]/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">

          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-sm flex items-center justify-center text-white shadow-lg">
              <Briefcase size={26} />
            </div>

            <div className="space-y-2">

              {isEditing ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      name: e.target.value,
                    })
                  }
                  placeholder="Enter Project Name"
                  className="w-full md:w-[450px] px-5 py-3 bg-white/10 border border-white/10 rounded-2xl text-white placeholder:text-blue-100/50 text-2xl md:text-3xl font-bold outline-none focus:border-white/30 backdrop-blur-sm"
                />
              ) : (
                <h1 className="w-full md:w-[450px] px-5 py-3 border-white/10 rounded-2xl text-white placeholder:text-blue-100/50 text-2xl md:text-3xl font-bold outline-none focus:border-white/30 backdrop-blur-sm">
                  {formData.name}
                </h1>
              )}

              {/* <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-blue-50 text-[11px] font-bold uppercase tracking-wider">
                  {formData.status}
                </span>

                <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-blue-50 text-[11px] font-bold uppercase tracking-wider">
                  {formData.priority} Priority
                </span>

                <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-blue-50 text-[11px] font-bold uppercase tracking-wider">
                  {CATEGORY_MAP[formData.category] || formData.category}
                </span>
              </div> */}
            </div>
          </div>
          <div className="flex items-center gap-3">
                {isEditing ? (
                  <>
                    <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-white text-slate-600 border border-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm">
                      Cancel  
                    </button>
                    <button onClick={handleSave} disabled={isSubmitting} className="px-5 py-2 bg-[#1B2B5B] text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-md hover:bg-[#111A3A] transition-colors disabled:opacity-70">
                      {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                      Save Changes
                    </button>
                  </>
                ) : (
                  <button onClick={() => setIsEditing(true)} className="px-3 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 transition-all shadow-sm flex items-center gap-2 group">
                    <Edit2 size={16} className="text-blue-500 group-hover:rotate-12 transition-transform" /> 
                  </button>
                )}
              </div>
        </div>
      </div>

      {/* KPI Top Row */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        
        
        {/* Budget */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100/50 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
                <IndianRupee size={18} />
              </div>
              <span className="text-sm font-semibold text-slate-500">Project Budget</span>
            </div>
          </div>
          {isEditing ? (
            <input
              type="text"
              value={formatBudget(formData.budget, client?.currency)}
              onChange={(e) => setFormData({ ...formData, budget: parseBudget(e.target.value) })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-lg font-bold text-slate-800 focus:outline-none focus:border-blue-400"
            />
          ) : (
            <div>
              <h3 className="text-2xl font-bold text-slate-800">{currencySymbol}{formatBudget(formData.budget, client?.currency)}</h3>
              <p className="text-xs text-emerald-500 font-medium mt-1 flex items-center gap-1"><TrendingUp size={12}/> Allocated</p>
            </div>
          )}
        </div>

        {/* Status */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100/50 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getStatusStyles(formData.status).bg} ${getStatusStyles(formData.status).color}`}>
                <CheckCircle2 size={18} />
              </div>
              <span className="text-sm font-semibold text-slate-500">Status</span>
            </div>
          </div>
          {isEditing ? (
             <CustomDropdown label="Status" value={formData.status} field="status" options={["Hold", "In Progress", "Completed"]} />
          ) : (
            <div>
              <h3 className="text-xl font-bold text-slate-800 mb-1">{formData.status}</h3>
              <span className={`inline-flex px-2.5 py-0.5 text-[11px] font-bold rounded-full uppercase tracking-wider ${getStatusStyles(formData.status).badge}`}>
                Current State
              </span>
            </div>
          )}
        </div>

        {/* Priority */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100/50 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getPriorityStyles(formData.priority).iconBg} ${getPriorityStyles(formData.priority).color}`}>
                <AlertCircle size={18} />
              </div>
              <span className="text-sm font-semibold text-slate-500">Priority</span>
            </div>
          </div>
          {isEditing ? (
             <CustomDropdown label="Priority" value={formData.priority} field="priority" options={["Low", "Medium", "High"]} />
          ) : (
            <div>
               <h3 className="text-xl font-bold text-slate-800 mb-1">{formData.priority}</h3>
               <span className={`inline-flex px-2.5 py-0.5 text-[11px] font-bold rounded-full uppercase tracking-wider ${getPriorityStyles(formData.priority).badge}`}>
                 Attention Level
               </span>
            </div>
          )}
        </div>

        {/* Category */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100/50 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center">
                <Briefcase size={18} />
              </div>
              <span className="text-sm font-semibold text-slate-500">Category</span>
            </div>
          </div>
          {isEditing ? (
             <CustomDropdown label="Category" value={formData.category} field="category" options={[1, 2]} />
          ) : (
            <div>
               <h3 className="text-xl font-bold text-slate-800 mb-1 truncate">{CATEGORY_MAP[formData.category] || formData.category}</h3>
               <span className="inline-flex px-2.5 py-0.5 text-[11px] font-bold rounded-full uppercase tracking-wider bg-purple-50 text-purple-600 border border-purple-100">
                 Domain
               </span>
            </div>
          )}
        </div>

      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Main Details) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Details & Description */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100/50">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Project Details</h3>
            
            <div className="space-y-5">
              
              <div className="space-y-1.5">
                <label className="text-xs font-semibold texat-slate-500">Description {isEditing && <span className="text-red-500">*</span>}</label>
                {isEditing ? (
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-blue-400 shadow-sm min-h-[120px] resize-none"
                    placeholder="Brief overview of the project scope..."
                  />
                ) : (
                  <p className="text-sm text-slate-600 leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-100/50">
                    {formData.description || "No specific objectives defined for this project yet."}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100/50">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Documents</h3>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-50/50 rounded-xl border border-slate-100 hover:border-blue-200 transition-colors">
              <div className="flex items-center gap-4 mb-3 sm:mb-0">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-blue-500">
                  <FileText size={24} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Project Scope Document</p>
                  <p className="text-xs text-slate-500 mt-0.5">{project?.scopeDocument || "No document uploaded"}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {isEditing ? (
                  <>
                    <input type="file" accept=".pdf" id="scope-upload" className="hidden" onChange={(e) => setFormData({ ...formData, scopeFile: e.target.files[0] })} />
                    <label htmlFor="scope-upload" className="w-full sm:w-auto px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-semibold hover:bg-blue-100 transition-colors cursor-pointer text-center">
                      {formData.scopeFile ? "File Selected" : "Upload PDF"}
                    </label>
                  </>
                ) : project?.scopeDocument && (
                  <>
                    <a href={`${BASE_URL}/uploads/${project.scopeDocument}`} target="_blank" rel="noreferrer" className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                      <Eye size={16} /> View
                    </a>
                    <button 
                      onClick={() => handleDownload(project.scopeDocument)}
                      className="px-4 py-2 bg-blue-50 border border-blue-100 text-blue-600 rounded-lg text-sm font-semibold hover:bg-blue-100 transition-colors flex items-center justify-center gap-2">
                      <Download size={16} /> Download
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Follow-ups & History */}
          {/* <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100/50">
            <div className="flex items-center justify-between mb-6">
               <h3 className="text-lg font-bold text-slate-800">Activity & Tasks</h3>
               <span className="text-sm font-semibold text-blue-600 hover:text-blue-700 cursor-pointer">View all &rarr;</span>
            </div>
            
            <div className="space-y-6">
              {(() => {
                const projectFollowUps = followUps?.filter((f) => (f.projectId || f.project_id) == project.id) || [];
                const projectActivities = activities?.filter((a) => (a.projectId || a.project_id) == project.id) || [];
                const pendingOrUpcoming = projectFollowUps.filter(f => f.status === 'pending').sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

                if (pendingOrUpcoming.length === 0 && projectActivities.length === 0) {
                  return (
                    <div className="text-center py-10 bg-slate-50/50 rounded-xl border border-slate-100 border-dashed">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300 shadow-sm">
                        <CheckCircle2 size={24} />
                      </div>
                      <p className="text-sm font-semibold text-slate-400">No tasks here</p>
                    </div>
                  );
                }

                return (
                  <div className="flex overflow-x-auto gap-4 pb-2 snap-x snap-mandatory no-scrollbar scroll-smooth">
                    {pendingOrUpcoming.map((item, idx) => (
                      <div key={idx} className="w-full sm:w-[300px] shrink-0">
                        <ConversationCard conv={{ ...item, source: "pending" }} />
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div> */}

        </div>

        {/* Right Column (Sidebar) */}
        <div className="space-y-6">
          
          {/* Timeline Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100/50">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Timeline</h3>
            
            <div className="relative pl-6 border-l-2 border-slate-100 space-y-8">
              
              {/* Onboarding Node */}
              <div className="relative">
                <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-[#1B2B5B] border-4 border-white shadow-sm ring-1 ring-slate-100"></div>
                <p className="text-xs font-semibold text-slate-500 mb-1">Onboarding Date</p>
                {isEditing ? (
                  <div className="mt-2"><DatePicker value={formData.onboardingDate} onChange={(val) => setFormData({ ...formData, onboardingDate: val })} /></div>
                ) : (
                  <p className="text-sm font-bold text-slate-800">
                    {formData.onboardingDate ? new Date(formData.onboardingDate).toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" }) : "Not set"}
                  </p>
                )}
              </div>

              {/* Deadline Node */}
              <div className="relative">
                <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-emerald-500 border-4 border-white shadow-sm ring-1 ring-slate-100"></div>
                <p className="text-xs font-semibold text-slate-500 mb-1">Deadline (Tentative)</p>
                {isEditing ? (
                  <div className="mt-2"><DatePicker value={formData.deadline} onChange={(val) => setFormData({ ...formData, deadline: val })} /></div>
                ) : (
                  <p className="text-sm font-bold text-slate-800">
                    {formData.deadline ? new Date(formData.deadline).toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" }) : "Not set"}
                  </p>
                )}
              </div>

            </div>
          </div>

          {/* Stakeholders Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100/50">
            <h3 className="text-lg font-bold text-slate-800 mb-5">Client</h3>
            
            <div className="space-y-4">
              {/* Client Card */}
              <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-[#1B2B5B] text-white rounded-full flex items-center justify-center font-bold text-lg shadow-sm">
                    {client?.name?.charAt(0) || "C"}
                  </div>
                  <div>
                    <p className="text-[15px] font-bold text-slate-800 leading-tight">{client?.name || "Unknown Client"}</p>
                    <p className="text-[13px] text-slate-500 font-medium">Client Role</p>
                  </div>
                </div>
                
                <hr className="border-slate-50 mb-4" />
                
                <div className="space-y-3 pl-1">
                  <div className="flex items-center gap-3">
                    <Mail size={16} className="text-slate-400" />
                    <span className="text-sm text-slate-600 font-medium truncate">{client?.email || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone size={16} className="text-slate-400" />
                    <span className="text-sm text-slate-600 font-medium">{client?.phone || "N/A"}</span>
                  </div>
                </div>
              </div>

              {/* Lead Source Card */}
              {lead && (
                <><h3 className="text-lg font-bold text-slate-800 mb-5">Lead Source</h3>
                <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                  
                  <div className="flex items-center gap-4 mb-4">
                    
                    <div className="w-12 h-12 bg-[#E2E8F0] text-slate-700 rounded-full flex items-center justify-center font-bold text-lg shadow-sm">
                      {lead?.name?.charAt(0) || "L"}
                    </div>
                    <div>
                      <p className="text-[15px] font-bold text-slate-800 leading-tight">{lead?.name}</p>
                      <p className="text-[13px] text-slate-500 font-medium">Lead Source</p>
                    </div>
                  </div>
                  
                  <hr className="border-slate-50 mb-4" />
                  
                  <div className="space-y-3 pl-1">
                    <div className="flex items-center gap-3">
                      <Mail size={16} className="text-slate-400" />
                      <span className="text-sm text-slate-600 font-medium truncate">{lead?.email || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone size={16} className="text-slate-400" />
                      <span className="text-sm text-slate-600 font-medium">{lead?.phone || "N/A"}</span>
                    </div>
                  </div>
                </div>
                </>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProjectOverview;