import React, { useState, useRef } from "react";
import { toast } from "react-hot-toast";
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
} from "lucide-react";
import DatePicker from "../../components/ui/DatePicker";
import {
  CATEGORY_MAP,
} from "../../constants/categoryConstants";
import { BASE_URL } from "../../constants/config";
import { validateForm } from "../../utils/validation";
import { commonCurrencies } from "../../utils/locationData";
import { formatBudget, parseBudget } from "../../utils/formatters";

const ProjectOverview = ({
  project,
  client,
  lead,
  onBack,
  onUpdateProject,
  followUps,
  activities,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const pendingRef = useRef(null);
  const historyRef = useRef(null);

  const scrollContainer = (ref, dir) => {
    if (ref.current) {
      const scrollAmount = ref.current.clientWidth;
      ref.current.scrollBy({ left: dir === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };
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

  // Sync formData with project prop when it changes
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

  // State for custom dropdowns
  const [activeDropdown, setActiveDropdown] = useState(null); // 'status', 'priority', 'category'

  const handleSave = async () => {
    if (!validateForm(formData, {
      name: { required: true, minLength: 2, label: "Project Name" },
      description: { required: true, label: "Project Description" },
      status: { required: true, label: "Project Status" },
      category: { required: true, label: "Project Category" },
      priority: { required: true, label: "Project Priority" },
      budget: { required: true, type: "number", label: "Budget" },
      onboardingDate: { required: true, label: "Onboarding Date" },
      deadline: { required: true, label: "Deadline Date" },
    })) return;

    setIsSubmitting(true);
    try {
      if (onUpdateProject && project?.id) {
        await onUpdateProject({
          ...project,
          ...formData,
        });
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Failed to update project:", error);
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
      case "live":
      case "completed":
        return "bg-success/10 text-success border-success/30";
      case "testing":
        return "bg-secondary/10 text-secondary border-secondary/30";
      case "in progress":
      case "in_progress":
        return "bg-warning/10 text-warning border-warning/30";
      case "pending":
      case "planning":
        return "bg-info/10 text-info border-info/30";
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

  const CustomDropdown = ({ label, value, options, field, icon: Icon }) => (
    <div className="space-y-2 relative">
      <label className="text-[11px] sm:text-[12px] font-bold text-primary tracking-widest ml-1 opacity-50">
        {label} {isEditing && <span className="text-error">*</span>}
      </label>
      <button
        type="button"
        onClick={() =>
          setActiveDropdown(activeDropdown === field ? null : field)
        }
        className="w-full flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-white hover:border-secondary transition-all text-xs sm:text-sm font-bold text-[#18254D]"
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon size={16} className="text-secondary" />}
          <span>{CATEGORY_MAP[value] || value}</span>
        </div>
        <ChevronDown
          size={14}
          className={`text-slate-400 transition-transform ${activeDropdown === field ? "rotate-180" : ""}`}
        />
      </button>

      {activeDropdown === field && (
        <>
          <div
            className="fixed inset-0 z-[110]"
            onClick={() => setActiveDropdown(null)}
          />
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden z-[120] animate-fade-in origin-top py-2">
            <div className="bg-[#18254D] px-4 py-2 border-b border-white/10 -mt-2 mb-1">
              <p className="text-[12px] sm:text-[14px] font-bold text-white/50 tracking-widest">
                Select {label}
              </p>
            </div>
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  setFormData({ ...formData, [field]: opt });
                  setActiveDropdown(null);
                }}
                className={`w-full text-left px-5 py-2.5 sm:py-3 text-[11px] sm:text-[12px] font-bold tracking-widest transition-colors ${
                  value === opt
                    ? "bg-slate-50 text-secondary"
                    : "text-[#18254D] hover:bg-slate-50"
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
    <div className="w-full h-full relative space-y-6">
      <div className="max-w-2xl">
        <h2 className="text-lg sm:text-lg md:text-xl lg:text-2xl font-bold text-primary tracking-tight mb-2">
          Project Overview
        </h2>
        <p className="text-xs sm:text-sm text-textMuted font-medium leading-relaxed">
          Get a complete overview of all your projects, including progress,
          timelines, and current status.
        </p>
      </div>

      <div className="bg-white rounded-2xl p-4 md:p-5 border border-slate-200 shadow-sm flex items-center justify-between gap-3 md:gap-5 animate-fade-in">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-primary transition-all shrink-0"
            title="Back to Board"
          >
            <ArrowLeft size={18} strokeWidth={2.5} />
          </button>
          <h2 className="text-base md:text-xl font-bold text-[#18254D] tracking-tight leading-tight line-clamp-1">
            {formData.name}
          </h2>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="px-2.5 sm:px-4 py-1.5 sm:py-2 bg-slate-100/50 text-slate-500 rounded-xl text-[10px] sm:text-[12px] font-bold tracking-widest hover:bg-slate-200 transition-all border border-slate-200/50"
              >
                Cancel
              </button>
                <button
                  onClick={handleSave}
                  disabled={isSubmitting}
                  className="px-3.5 sm:px-6 py-1.5 sm:py-2.5 bg-secondary text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 shadow-lg shadow-secondary/20 hover:bg-secondary/90 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 sm:px-5 py-1.5 sm:py-2.5 bg-white border border-slate-200 text-[#18254D] rounded-xl text-[10px] sm:text-[12px] font-bold tracking-widest hover:border-secondary hover:text-secondary transition-all shadow-sm flex items-center justify-center gap-1.5 sm:gap-2 group"
            >
              <Edit2
                size={14}
                className="group-hover:rotate-12 transition-transform"
              />
              <span>Edit Project</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 pb-12">
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <Zap size={18} className="text-warning" />
              <h3 className="text-xs sm:text-sm font-bold text-[#18254D] tracking-widest">
                Details
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[12px] font-bold text-primary  tracking-widest ml-1 opacity-50">
                  Project Name {isEditing && <span className="text-error">*</span>}
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-secondary/10 focus:border-secondary focus:outline-none text-xs sm:text-sm font-bold text-[#18254D]"
                  />
                ) : (
                  <div className="px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs sm:text-sm font-bold text-[#18254D]">
                    {formData.name}
                  </div>
                )}
              </div>

              {isEditing ? (
                <CustomDropdown
                  label="Current Status"
                  value={formData.status}
                  field="status"
                  options={["Hold", "In Progress", "Completed"]}
                  icon={Zap}
                />
              ) : (
                <div className="space-y-2">
                  <label className="text-[11px] sm:text-[12px] font-bold text-primary tracking-widest ml-1 opacity-50">
                    Current Status
                  </label>
                  <div className="flex flex-wrap items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs sm:text-sm font-bold text-[#18254D]">
                    <Zap size={16} className="text-secondary shrink-0" />
                    <span>{formData.status}</span>
                    <span
                      className={`sm:ml-auto px-2 py-0.5 text-[11px] md:text-[13px] border rounded-md whitespace-nowrap ${getStatusColor(formData.status)}`}
                    >
                      {formData.status}
                    </span>
                  </div>
                </div>
              )}

              {isEditing ? (
                <CustomDropdown
                  label="Priority Level"
                  value={formData.priority}
                  field="priority"
                  options={["Low", "Medium", "High"]}
                  icon={AlertCircle}
                />
              ) : (
                <div className="space-y-2">
                  <label className="text-[11px] sm:text-[12px] font-bold text-primary tracking-widest ml-1 opacity-50">
                    Priority Level
                  </label>
                  <div className="flex flex-wrap items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs sm:text-sm font-bold text-[#18254D]">
                    <AlertCircle size={16} className="text-secondary shrink-0" />
                    <span>{formData.priority}</span>
                    <span
                      className={`sm:ml-auto inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] md:text-[13px] border rounded-md whitespace-nowrap ${getPriorityStyles(formData.priority).badge}`}
                    >
                      {formData.priority}
                    </span>
                  </div>
                </div>
              )}

              {isEditing ? (
                <CustomDropdown
                  label="Project Category"
                  value={formData.category}
                  field="category"
                  options={[1, 2]}
                  icon={Tag}
                />
              ) : (
                <div className="space-y-2">
                  <label className="text-[11px] sm:text-[12px] font-bold text-primary tracking-widest ml-1 opacity-50 flex items-center justify-between">
                    <span>Project Category</span>
                  </label>
                  <div className="flex flex-wrap items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs sm:text-sm font-bold text-[#18254D]">
                    <Tag size={16} className="text-secondary shrink-0" />
                    <span className="truncate">
                      {CATEGORY_MAP[formData.category] || formData.category}
                    </span>
                    <span
                      className={`sm:ml-auto px-2 py-0.5 text-[11px] md:text-[13px] border rounded-md whitespace-nowrap ${getCategoryColor(formData.category)}`}
                    >
                      {CATEGORY_MAP[formData.category] || formData.category}
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-2 md:col-span-2">
                <label className="text-[12px] font-bold text-primary  tracking-widest ml-1 opacity-50">
                  Project Description {isEditing && <span className="text-error">*</span>}
                </label>
                {isEditing ? (
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-secondary/10 focus:border-secondary focus:outline-none text-xs sm:text-sm font-bold text-[#18254D] min-h-[100px] resize-none"
                    placeholder="Brief overview of the project scope..."
                  />
                ) : (
                  <div className="px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs sm:text-sm font-bold text-[#18254D] min-h-[100px]">
                    {formData.description ||
                      "No specific objectives defined for this project yet."}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm animate-fade-in-up">
            <div className="bg-slate-50/50 px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-bold text-[#18254D] tracking-widest flex items-center gap-3">
                <FileText size={18} className="text-secondary" />
                Documents
              </h3>
            </div>
            <div className="p-4 md:p-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 group hover:border-secondary transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-secondary border border-slate-100 shadow-sm">
                    <FileText size={20} />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-primary">
                      Project Scope Document
                    </p>
                    <p className="text-[11px] sm:text-[12px] font-bold text-slate-400 tracking-widest">
                      {project?.scopeDocument
                        ? project.scopeDocument
                        : "No document uploaded"}
                    </p>
                  </div>
                </div>
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept=".pdf"
                      id="scope-upload"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setFormData({ ...formData, scopeFile: file });
                        }
                      }}
                    />
                    <label
                      htmlFor="scope-upload"
                      className="px-3 py-2 bg-secondary text-white rounded-lg text-[11px] md:text-[12px] font-bold tracking-widest hover:bg-secondary/90 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap"
                    >
                      <Upload size={14} />
                      {formData.scopeFile ? "File Selected" : "Upload New PDF"}
                    </label>
                  </div>
                ) : project?.scopeDocument ? (
                  <div className="flex items-center gap-2">
                    <a
                      href={`${BASE_URL}/uploads/${project.scopeDocument}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-white border border-slate-200 text-[#18254D] rounded-lg text-[11px] md:text-[12px] font-bold tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2 whitespace-nowrap"
                    >
                      <Eye size={14} className="text-secondary" />
                      View
                    </a>
                    <button
                      onClick={() => handleDownload(project.scopeDocument)}
                      className="px-3 py-2 bg-white border border-slate-200 text-[#18254D] rounded-lg text-[11px] md:text-[12px] font-bold tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2 whitespace-nowrap"
                    >
                      <Download size={14} className="text-secondary" />
                      Download
                    </button>
                  </div>
                ) : (
                  <span className="text-[12px] font-bold text-slate-400 tracking-widest bg-slate-100/50 px-3 py-1 rounded-md border border-slate-100">
                    No Document
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Follow-ups & History */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm animate-fade-in-up">
            <div className="bg-slate-50/50 px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-bold text-[#18254D] tracking-widest flex items-center gap-3">
                <MessageSquare size={18} className="text-secondary" />
                Follow-ups & History
              </h3>
            </div>
            <div className="p-5">
              {(() => {
                const projectFollowUps = followUps?.filter((f) => (f.projectId || f.project_id) == project.id) || [];
                const projectActivities = activities?.filter((a) => (a.projectId || a.project_id) == project.id) || [];

                const pendingOrUpcoming = projectFollowUps.filter(f => f.status === 'pending').sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

                const completedAndHistory = [
                  ...projectFollowUps.filter(f => f.status === 'completed'),
                  ...projectActivities
                ].sort((a, b) => {
                  const dateA = new Date(a.dueDate || a.date || a.createdAt);
                  const dateB = new Date(b.dueDate || b.date || b.createdAt);
                  return dateB - dateA;
                });

                if (pendingOrUpcoming.length === 0 && completedAndHistory.length === 0) {
                  return (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300">
                        <MessageSquare size={24} />
                      </div>
                      <p className="text-[10px] sm:text-xs font-bold text-slate-400 tracking-widest">
                        No history linked to this project
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-8">
                    {/* Pending or upcoming Follow ups */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-[11px] sm:text-[13px] font-bold text-slate-400 tracking-[0.2em] uppercase flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-warning"></span>
                          Pending Follow-ups ({pendingOrUpcoming.length})
                        </h4>
                        {pendingOrUpcoming.length > 1 && (
                          <div className="flex items-center gap-2">
                            <button onClick={() => scrollContainer(pendingRef, 'left')} className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-primary transition-colors border border-slate-200 shadow-sm"><ChevronLeft size={16} /></button>
                            <button onClick={() => scrollContainer(pendingRef, 'right')} className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-primary transition-colors border border-slate-200 shadow-sm"><ChevronRight size={16} /></button>
                          </div>
                        )}
                      </div>
                      {pendingOrUpcoming.length > 0 ? (
                        <div ref={pendingRef} className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory no-scrollbar scroll-smooth">
                          {pendingOrUpcoming.map((item, idx) => {
                            const date = new Date(item.dueDate);
                            const type = (item.followup_mode || "call").toLowerCase();
                            return (
                              <div key={`pending-${item.id || idx}`} className="min-w-full w-full shrink-0 snap-start bg-warning/5 border border-warning/20 rounded-xl p-4 flex flex-col hover:shadow-md transition-all">
                                <div className="flex items-center justify-between mb-3">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm ${
                                      type === "email" ? "bg-info" : type === "call" ? "bg-success" : type === "meeting" ? "bg-secondary" : "bg-slate-400"
                                  }`}>
                                    {type === "call" ? <Phone size={14} strokeWidth={2.5} /> : type === "meeting" ? <Calendar size={14} strokeWidth={2.5} /> : <Mail size={14} strokeWidth={2.5} />}
                                  </div>
                                  <span className="text-[11px] md:text-[13px] font-bold tracking-widest px-2 py-0.5 rounded-md bg-warning/10 text-warning uppercase">
                                    PENDING
                                  </span>
                                </div>
                                <h5 className="text-[14px] font-bold text-primary tracking-tight mb-2 line-clamp-1">{item.title}</h5>
                                {item.description && <p className="text-[12px] font-medium text-slate-500 line-clamp-2 mb-3">{item.description}</p>}
                                <div className="mt-auto pt-3 border-t border-warning/10 flex items-center gap-2 text-[12px] font-bold text-slate-400 tracking-widest">
                                  <Calendar size={14} className="text-warning" />
                                  <span>
                                    {date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                                    {" · "}
                                    {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-[12px] font-bold text-slate-400 tracking-widest italic bg-slate-50 p-4 rounded-xl border border-slate-100">No pending follow-ups.</div>
                      )}
                    </div>

                    {/* Completed Follow ups & History */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-[11px] sm:text-[13px] font-bold text-slate-400 tracking-[0.2em] uppercase flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-success"></span>
                          History & Completed ({completedAndHistory.length})
                        </h4>
                        {completedAndHistory.length > 1 && (
                          <div className="flex items-center gap-2">
                            <button onClick={() => scrollContainer(historyRef, 'left')} className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-primary transition-colors border border-slate-200 shadow-sm"><ChevronLeft size={16} /></button>
                            <button onClick={() => scrollContainer(historyRef, 'right')} className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-primary transition-colors border border-slate-200 shadow-sm"><ChevronRight size={16} /></button>
                          </div>
                        )}
                      </div>
                      {completedAndHistory.length > 0 ? (
                        <div ref={historyRef} className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory no-scrollbar scroll-smooth">
                          {completedAndHistory.map((item, idx) => {
                            const isFollowUp = !!item.dueDate;
                            const date = new Date(item.dueDate || item.date || item.createdAt);
                            const type = (item.followup_mode || item.type || "call").toLowerCase();
                            return (
                              <div key={`history-${item.id || idx}`} className={`min-w-full w-full shrink-0 snap-start rounded-xl p-4 flex flex-col hover:shadow-md transition-all ${isFollowUp ? 'bg-success/5 border border-success/20' : 'bg-slate-50 border border-slate-100'}`}>
                                <div className="flex items-center justify-between mb-3">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm ${
                                      isFollowUp ? "bg-success" : type === "email" ? "bg-info" : type === "call" ? "bg-success" : type === "meeting" ? "bg-secondary" : "bg-slate-400"
                                  }`}>
                                    {type === "call" ? <Phone size={14} strokeWidth={2.5} /> : type === "meeting" ? <Calendar size={14} strokeWidth={2.5} /> : <Mail size={14} strokeWidth={2.5} />}
                                  </div>
                                  <span className={`text-[11px] md:text-[13px] font-bold tracking-widest px-2 py-0.5 rounded-md uppercase ${isFollowUp ? 'bg-success/10 text-success' : 'bg-slate-200 text-slate-600'}`}>
                                    {isFollowUp ? "COMPLETED" : "LOGGED"}
                                  </span>
                                </div>
                                <h5 className="text-[14px] font-bold text-primary tracking-tight mb-2 line-clamp-1">{item.title || "Conversation Logged"}</h5>
                                
                                {isFollowUp ? (
                                  <div className="flex-1">
                                    {item.follow_brief && (
                                      <div className="mb-2">
                                        <p className="text-[12px] font-medium text-primary line-clamp-3">
                                          "{item.follow_brief}"
                                        </p>
                                      </div>
                                    )}
                                    {item.completed_by && (
                                      <p className="text-[11px] font-bold text-slate-400 tracking-widest mt-1">
                                        By: {item.completed_by}
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-[12px] font-medium text-primary/80 leading-relaxed italic line-clamp-3 flex-1">
                                    "{item.description}"
                                  </p>
                                )}
                                
                                <div className={`mt-auto pt-3 flex flex-col gap-1.5 text-[12px] font-bold tracking-widest ${isFollowUp ? 'border-t border-success/10 text-success/70' : 'border-t border-slate-200 text-slate-400'}`}>
                                  {isFollowUp ? (
                                    <>
                                      <div className="flex items-center gap-2">
                                        <Calendar size={14} className="text-success" />
                                        <span>Scheduled: {new Date(item.dueDate).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })} · {new Date(item.dueDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })}</span>
                                      </div>
                                      {item.completed_at && (
                                        <div className="flex items-center gap-2">
                                          <CheckCircle size={14} className="text-success" />
                                          <span>Completed: {new Date(item.completed_at).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })} · {new Date(item.completed_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })}</span>
                                        </div>
                                      )}
                                    </>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <Calendar size={14} className="text-slate-400" />
                                      <span>
                                        {date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                                        {" · "}
                                        {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-[12px] font-bold text-slate-400 tracking-widest italic bg-slate-50 p-4 rounded-xl border border-slate-100">No history available.</div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>


        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm group hover:border-success/30 transition-all animate-fade-in-right">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-success/10 text-success font-bold rounded-2xl flex items-center justify-center">
                {client?.currency}
              </div>
              <label className="text-[11px] sm:text-[12px] font-bold text-slate-400 tracking-[0.2em]">
                Project Budget {isEditing && <span className="text-error">*</span>}
              </label>
            </div>
            {isEditing ? (
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                  {commonCurrencies.find((c) => c.code === client?.currency)?.symbol || "₹"}
                </div>
                <input
                  type="text"
                  value={formatBudget(formData.budget, client?.currency)}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      budget: parseBudget(e.target.value),
                    })
                  }
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-success text-2xl font-black text-primary tracking-tighter"
                />
              </div>
            ) : (
              <p className="text-xl sm:text-2xl font-bold text-[#18254D] tracking-tight shrink-0">
                {formData.budget > 0
                  ? `${commonCurrencies.find((c) => c.code === client?.currency)?.symbol || "₹"}${formatBudget(formData.budget, client?.currency)}`
                  : `${commonCurrencies.find((c) => c.code === client?.currency)?.symbol || "₹"}0`}
              </p>
            )}
          </div>

          <div className="bg-[#18254D] rounded-2xl p-5 text-white shadow-xl animate-fade-in-right relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-secondary/10 transition-all duration-700" />
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <Calendar size={18} className="text-secondary" />
              <h3 className="text-[11px] sm:text-[12px] font-bold tracking-[0.2em] opacity-60">
                Timeline
              </h3>
            </div>

            <div className="space-y-6 relative z-10">
              <div className="space-y-1">
                <p className="text-[12px] sm:text-[14px] font-bold text-white/40 tracking-widest">
                  Onboarding Date {isEditing && <span className="text-error">*</span>}
                </p>
                {isEditing ? (
                  <DatePicker
                    value={formData.onboardingDate}
                    onChange={(val) =>
                      setFormData({
                        ...formData,
                        onboardingDate: val,
                      })
                    }
                  />
                ) : (
                  <p className="text-xs sm:text-sm font-bold">
                    {formData.onboardingDate
                      ? new Date(formData.onboardingDate).toLocaleDateString(
                          [],
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          },
                        )
                      : "No date set"}
                  </p>
                )}
              </div>

              <div className="h-px bg-white/10 w-full" />

              <div className="space-y-2">
                <p className="text-[12px] sm:text-[14px] font-bold text-secondary tracking-widest">
                  Deadline(Tentative) {isEditing && <span className="text-error">*</span>}
                </p>
                {isEditing ? (
                  <DatePicker
                    value={formData.deadline}
                    onChange={(val) =>
                      setFormData({
                        ...formData,
                        deadline: val,
                      })
                    }
                  />
                ) : (
                  <p className="text-sm sm:text-base font-bold tracking-tight leading-none">
                    {formData.deadline
                      ? new Date(formData.deadline).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "No deadline set"}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm animate-slide-up">
            <h3 className="text-[11px] sm:text-[12px] font-bold text-slate-400 tracking-widest border-b border-slate-50 pb-3">
              Client Details
            </h3>
            <div className="flex items-center gap-4 mb-6 pt-3">
              <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center font-bold text-lg border-4 border-slate-50 shadow-md">
                {client?.name?.charAt(0) || "C"}
              </div>
              <div>
                <p className="text-[11px] sm:text-[12px] font-bold text-slate-400 tracking-widest mt-0.5">
                  {client?.name || ""}
                </p>
                <p className="text-[13px] font-bold text-primary truncate max-w-[150px]">
                  {client?.company || ""}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 group hover:border-secondary transition-all cursor-pointer">
                <Mail
                  size={14}
                  className="text-slate-400 group-hover:text-secondary"
                />
                <span className="text-[11px] sm:text-[12px] font-bold text-primary truncate">
                  {client?.email || "No email documented"}
                </span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 group hover:border-secondary transition-all cursor-pointer">
                <Phone
                  size={14}
                  className="text-slate-400 group-hover:text-secondary"
                />
                <span className="text-[11px] sm:text-[12px] font-bold text-primary">
                  {client?.phone || "No phone documented"}
                </span>
              </div>
            </div>
          </div>

          {lead && (
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm animate-slide-up">
              <h3 className="text-[11px] sm:text-[12px] font-bold text-slate-400 tracking-widest border-b border-slate-50 pb-3 uppercase">
                Project Source (Lead)
              </h3>
              <div className="flex items-center gap-4 mb-6 pt-3">
                <div className="w-12 h-12 bg-secondary text-white rounded-2xl flex items-center justify-center font-bold text-lg border-4 border-slate-50 shadow-md">
                  {lead?.name?.charAt(0) || "L"}
                </div>
                <div>
                  <p className="text-[11px] sm:text-[12px] font-bold text-slate-400 tracking-widest mt-0.5">
                    {lead?.name || ""}
                  </p>
                  <p className="text-[13px] font-bold text-primary truncate max-w-[150px]">
                    {lead?.company || ""}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 group hover:border-secondary transition-all">
                  <Mail
                    size={14}
                    className="text-slate-400 group-hover:text-secondary"
                  />
                  <span className="text-[11px] sm:text-[12px] font-bold text-primary truncate">
                    {lead?.email || "No email documented"}
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 group hover:border-secondary transition-all">
                  <Phone
                    size={14}
                    className="text-slate-400 group-hover:text-secondary"
                  />
                  <span className="text-[11px] sm:text-[12px] font-bold text-primary">
                    {lead?.phone || "No phone documented"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectOverview;
