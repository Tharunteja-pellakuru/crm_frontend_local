import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useScrollLock } from "../../hooks/useScrollLock";
import { Area, Line, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Users, UserPlus, Clock, CheckCircle2, ChevronRight, ChevronDown, Filter, Calendar, TrendingUp, X, Bell, Info, Inbox, Activity } from "lucide-react";
import { BASE_URL } from "../../constants/config";

const parseLocalDate = (dateStr) => {
  if (!dateStr) return new Date();
  if (dateStr instanceof Date) return dateStr;
  if (typeof dateStr === 'string' && dateStr.includes('T') && dateStr.endsWith('Z')) {
    const normalized = dateStr.replace('T', ' ').replace('Z', '').split('.')[0];
    const date = new Date(normalized);
    if (!isNaN(date.getTime())) return date;
  }
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? new Date() : date;
};

// Simple stat card component
function StatCard({ title, value, trend, trendUp, icon, description, delay = 0 }) {
  return (
    <div 
      className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200 hover:-translate-y-1 hover:shadow-md transition-all duration-300 relative animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="p-2 bg-primary/5 text-primary rounded-xl">
          {icon}
        </div>
        {trend && (
          <span className={`text-[12px] font-bold px-2 py-0.5 rounded-full ${trendUp ? "bg-success/10 text-success" : "bg-error/10 text-error"}`}>
            {trend}
          </span>
        )}
      </div>
      <h3 className="text-textMuted text-[13px] font-semibold tracking-wider">{title}</h3>
      <p className="text-2xl sm:text-3xl font-bold text-primary mt-1.5">{value}</p>
      
      {description && (
        <div className="absolute bottom-4 right-4 group/info">
          <Info size={14} className="text-slate-300 hover:text-primary cursor-help" />
          <div className="absolute bottom-full right-0 mb-2 w-48 p-2.5 bg-[#18254D] text-white text-[12px] rounded-xl opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all">
            {description}
          </div>
        </div>
      )}
    </div>
  );
}

function Dashboard({ followUps, clients, leads = [], enquiries, aiModels = [], onSelectFollowUp, onNavigate, onClearNotifications, loading = false }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedYear, setSelectedYear] = useState(() => {
    // Default to current year, but if there's no data, try to find the latest year with data
    const currentYear = new Date().getFullYear().toString();
    const allYears = [
      ...clients.map(c => c.joinedDate ? new Date(c.joinedDate).getFullYear() : null),
      ...enquiries.map(e => e.date ? new Date(e.date).getFullYear() : null),
      ...leads.map(l => l.joinedDate ? new Date(l.joinedDate).getFullYear() : null)
    ].filter(Boolean);
    
    if (allYears.length > 0) {
      const latestYear = Math.max(...allYears).toString();
      return latestYear;
    }
    return currentYear;
  });
  const [selectedMonth, setSelectedMonth] = useState("All");
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);
  const [showViewAllModal, setShowViewAllModal] = useState(false);
  const [viewAllTab, setViewAllTab] = useState("Overdue");
  const [activeTaskTab, setActiveTaskTab] = useState("Pending");
  const [currentUser, setCurrentUser] = useState(null);
  const dropdownRef = useRef(null);

  // Lock scroll when any modal is open
  useScrollLock(showNotifications || showViewAllModal);

  // Load user from localStorage and sync year with data
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) setCurrentUser(user);

    // Sync selectedYear with latest data available
    const dataYears = [
      ...clients.map(c => c.joinedDate ? new Date(c.joinedDate).getFullYear() : null),
      ...enquiries.map(e => e.date ? new Date(e.date).getFullYear() : null),
      ...leads.map(l => l.joinedDate ? new Date(l.joinedDate).getFullYear() : null)
    ].filter(Boolean);
    
    if (dataYears.length > 0) {
      const latestYear = Math.max(...dataYears).toString();
      setSelectedYear(latestYear);
    }
  }, [clients.length, enquiries.length, leads.length]);

  // Helper functions
  function isToday(date) {
    const d = parseLocalDate(date);
    const today = new Date();
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  }

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    // If it's already a full URL (starts with http), return as-is
    if (imagePath.startsWith('http')) return imagePath;
    // If it's a relative path, prepend BASE_URL
    return BASE_URL + imagePath;
  };

  function isMissed(date) {
    const d = parseLocalDate(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d < today;
  }

  // Calculate stats
  const newEnquiries = enquiries.filter((e) => e.status === "new");
  const todayTasks = followUps.filter((f) => isToday(f.dueDate) && f.status === "pending");
  const missedTasks = followUps.filter((f) => isMissed(f.dueDate) && f.status === "pending");
  const totalNotifications = newEnquiries.length;
  const newEnquiriesCount = newEnquiries.length;
  
  const leadCount = leads.filter((l) => l.status === "Lead").length;
  const clientCount = clients.filter((c) => c.status === "Active").length;
  const totalPool = leadCount + clientCount;
  const engagementRate = totalPool > 0 ? Math.round((clientCount / totalPool) * 100) : 0;

  // Chart data
  function getChartData() {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const yearNum = parseInt(selectedYear);
    const activeClients = clients.filter(c => c.status === "Active");
    
    if (selectedMonth === "All") {
      return months.map((month, index) => {
        const monthlyEnquiries = enquiries.filter(e => {
          const d = new Date(e.date);
          return d.getFullYear() === yearNum && d.getMonth() === index;
        }).length;
        
        const monthlyClients = activeClients.filter(c => {
          const d = new Date(c.joinedDate);
          return d.getFullYear() === yearNum && d.getMonth() === index;
        }).length;

        const monthlyLeads = leads.filter(l => {
          const d = new Date(l.joinedDate);
          return l.status === "Lead" && d.getFullYear() === yearNum && d.getMonth() === index;
        }).length;

        // Engagement rate: (Clients / (Enquiries + Leads)) * 100
        const totalPotential = monthlyEnquiries + monthlyLeads;
        const engagement = totalPotential > 0 ? Math.round((monthlyClients / totalPotential) * 100) : 0;

        return {
          name: month,
          enquiries: monthlyEnquiries,
          clients: monthlyClients,
          leads: monthlyLeads,
          engagement: engagement
        };
      });
    }
    
    // Weekly for specific month
    const monthIndex = months.indexOf(selectedMonth);
    return [1, 2, 3, 4].map(week => {
      const startDay = (week - 1) * 7 + 1;
      const endDay = week * 7;
      
      const weeklyEnquiries = enquiries.filter(e => {
        const d = new Date(e.date);
        return d.getFullYear() === yearNum && d.getMonth() === monthIndex && d.getDate() >= startDay && d.getDate() <= endDay;
      }).length;
      
      const weeklyClients = activeClients.filter(c => {
        const d = new Date(c.joinedDate);
        return d.getFullYear() === yearNum && d.getMonth() === monthIndex && d.getDate() >= startDay && d.getDate() <= endDay;
      }).length;

      const weeklyLeads = leads.filter(l => {
        const d = new Date(l.joinedDate);
        return l.status === "Lead" && d.getFullYear() === yearNum && d.getMonth() === monthIndex && d.getDate() >= startDay && d.getDate() <= endDay;
      }).length;

      const totalPotential = weeklyEnquiries + weeklyLeads;
      const engagement = totalPotential > 0 ? Math.round((weeklyClients / totalPotential) * 100) : 0;

      return {
        name: `Week ${week}`,
        enquiries: weeklyEnquiries,
        clients: weeklyClients,
        leads: weeklyLeads,
        engagement: engagement
      };
    });
  }

  const chartData = getChartData();

  // Dynamic years for dropdown
  const availableYears = (() => {
    const currentYear = new Date().getFullYear();
    const dataYears = [
      ...clients.map(c => c.joinedDate ? new Date(c.joinedDate).getFullYear() : null),
      ...enquiries.map(e => e.date ? new Date(e.date).getFullYear() : null),
      ...leads.map(l => l.joinedDate ? new Date(l.joinedDate).getFullYear() : null)
    ].filter(Boolean);
    
    const yearSet = new Set([currentYear, ...dataYears]);
    return Array.from(yearSet).sort((a, b) => b - a).map(String);
  })();

  // Show loading state
  if (loading) {
    return (
      <div className="w-full flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <p className="text-sm text-slate-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full relative flex flex-col lg:h-[calc(100vh-150px)]">
      <div className="flex-1 min-h-0 flex flex-col space-y-4 md:space-y-5 relative z-0">
        <div className="flex flex-row flex-wrap justify-between items-center gap-4 animate-fade-in relative z-50 shrink-0" style={{ animationDelay: '100ms' }}>
          <div className="max-w-2xl shrink-0">
            <h2 className="text-base md:text-lg lg:text-xl font-bold text-[#18254D] tracking-tight mb-1">
              Welcome back, {currentUser?.full_name?.split(' ')[0] || 'Admin'}
            </h2>
            <p className="text-[11px] md:text-xs text-textMuted font-medium leading-relaxed">
              Let's build something remarkable today.
            </p>
          </div>

          <div className="flex items-center bg-white p-1 rounded-full border border-slate-200 shadow-sm w-auto relative z-20">
            <div
              className="relative flex-1 lg:flex-initial lg:w-10 shrink-0"
              ref={dropdownRef}
            >
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`h-11 md:h-12 w-full rounded-full transition-all relative flex items-center justify-center shrink-0 ${
                  showNotifications
                    ? "bg-primary text-white"
                    : "bg-transparent text-primary hover:bg-slate-50"
                }`}
              >
                <div className="relative">
                  <Bell size={18} strokeWidth={2.5} />
                  {totalNotifications > 0 && !showNotifications && (
                    <span className="bg-[#18254D] text-white text-[12px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg absolute -top-1.5 -right-1.5 border border-white">
                      {totalNotifications}
                    </span>
                  )}
                </div>
              </button>
              {showNotifications && createPortal(
                <>
                  <div
                    className="fixed inset-0 z-[1000] bg-[#18254D]/10 backdrop-blur-sm"
                    onClick={() => setShowNotifications(false)}
                  />
                  <div className="fixed top-24 right-4 md:right-10 w-[320px] bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(24,37,77,0.3)] border border-slate-100 overflow-hidden animate-pop z-[1001]">
                    <div className="p-5 pb-3 border-b border-slate-50 bg-slate-50/50">
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                          <h3 className="text-[11px] font-black text-[#18254D] tracking-[0.2em] uppercase">
                            Notifications
                          </h3>
                        </div>
                        <div className="flex items-center gap-2">
                          {newEnquiries.length > 0 && (
                            <button
                              onClick={onClearNotifications}
                              className="text-[10px] font-black text-blue-600 hover:text-white hover:bg-blue-600 px-3 py-1.5 rounded-xl border border-blue-100 transition-all active:scale-95 uppercase tracking-wider"
                            >
                              Clear
                            </button>
                          )}
                          <button
                            onClick={() => setShowNotifications(false)}
                            className="p-1.5 hover:bg-slate-200 rounded-xl text-slate-400 transition-all"
                          >
                            <X size={16} strokeWidth={2.5} />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="max-h-[380px] overflow-y-auto p-3 no-scrollbar space-y-2">
                      {newEnquiries.length === 0 ? (
                        <div className="py-12 flex flex-col items-center justify-center text-center opacity-40">
                          <Inbox size={40} strokeWidth={1} className="mb-3 text-slate-300" />
                          <p className="text-[12px] font-bold tracking-widest uppercase text-slate-400">
                            No New Enquiries
                          </p>
                        </div>
                      ) : (
                        newEnquiries.map((e) => (
                          <div
                            key={`notif-enq-${e.id}`}
                            className="p-4 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 hover:border-blue-100 transition-all cursor-pointer group shadow-sm"
                            onClick={() => {
                              onNavigate("enquiries");
                              setShowNotifications(false);
                            }}
                          >
                            <div className="flex items-start gap-4">
                              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-black text-sm shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors uppercase">
                                {e.name?.charAt(0) || "E"}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                  <p className="text-sm font-black text-[#18254D] truncate pr-2">
                                    {e.name}
                                  </p>
                                  <span className="text-[10px] font-black text-blue-500 uppercase tracking-wider shrink-0">
                                    New
                                  </span>
                                </div>
                                <p className="text-[13px] text-slate-500 font-medium line-clamp-1 mb-2">
                                  {e.interest || e.message || "Interested in Services"}
                                </p>
                                <div className="flex items-center gap-2 text-[11px] font-black text-slate-400 tracking-wider uppercase">
                                  <Clock size={10} strokeWidth={3} />
                                  <span>{e.date ? new Date(e.date).toLocaleDateString() : "Just now"}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="p-4 bg-slate-50/80 border-t border-slate-100 text-center">
                      <button 
                         onClick={() => {
                           onNavigate("enquiries");
                           setShowNotifications(false);
                         }}
                         className="text-[11px] font-black text-blue-600 hover:text-blue-800 tracking-[0.15em] uppercase transition-colors"
                      >
                        View All Activity
                      </button>
                    </div>
                  </div>
                </>,
                document.body
              )}
            </div>
            <div className="w-[1px] h-6 bg-slate-100 mx-1" />
            <div className="flex-1 lg:flex-initial flex items-center justify-center sm:justify-end gap-2 px-2 min-w-max">
              <div className="text-right flex flex-col items-end">
                <p className="text-xs font-bold text-primary leading-none">
                  {currentUser?.full_name?.split(' ')[0] || 'Admin'}
                </p>
                <p className="text-[14px] font-bold text-secondary  tracking-widest mt-0.5">
                  {currentUser?.role || 'Admin'}
                </p>
                
              </div>
              {currentUser?.image ? (
                <img
                  src={getImageUrl(currentUser.image)}
                  alt="Profile"
                  className="w-8 h-8 md:w-9 md:h-9 rounded-lg object-cover border border-slate-100 shadow-sm"
                />
              ) : (
                <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-primary flex items-center justify-center border border-slate-100 shadow-sm">
                  <span className="text-sm font-bold text-white">
                    {currentUser?.full_name?.charAt(0).toUpperCase() || "A"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 shrink-0">
          <StatCard
            title="New Enquiries"
            value={newEnquiriesCount.toString()}
            trend="+4 today"
            trendUp={true}
            icon={<Inbox />}
            description="Total number of new enquiry messages received from the landing page."
            delay={150}
          />
          <StatCard
            title="Total Leads"
            value={leadCount.toString()}
            trend="Steady"
            trendUp={true}
            icon={<UserPlus />}
            description="Total count of potential customers currently in the 'Lead' status."
            delay={200}
          />
          <StatCard
            title="Lead → Client Conversion"
            value={clientCount.toString()}
            trend="Retained"
            trendUp={true}
            icon={<CheckCircle2 />}
            description="Number of leads who have been successfully onboarded as active clients."
            delay={250}
          />
          <StatCard
            title="Engagement Rate"
            value={`${engagementRate}%`}
            trend="High"
            trendUp={true}
            icon={<Activity />}
            description="Percentage of total prospects that have been converted into active clients."
            delay={300}
          />
        </div>

        <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4 md:gap-5 animate-fade-in-up" style={{ animationDelay: '350ms' }}>
            <div className="w-full lg:w-[35%] xl:w-[30%] bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col min-h-[420px] lg:min-h-0 lg:h-full">
            <div className="flex flex-row justify-between items-center gap-2 mb-6 flex-nowrap">
              <div className="flex items-center gap-1 p-0.5 bg-slate-50 rounded-xl border border-slate-100 shrink-0">
                <button
                  onClick={() => setActiveTaskTab("Today")}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold tracking-wider transition-all whitespace-nowrap ${
                    activeTaskTab === "Today"
                      ? "bg-white text-primary shadow-sm border border-slate-100"
                      : "text-slate-400 hover:text-primary"
                  }`}
                >
                  Today's Task
                </button>
                <button
                  onClick={() => setActiveTaskTab("Pending")}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold tracking-wider transition-all whitespace-nowrap ${
                    activeTaskTab === "Pending"
                      ? "bg-white text-error shadow-sm border border-slate-100"
                      : "text-slate-400 hover:text-error"
                  }`}
                >
                  Pending Tasks
                </button>
              </div>
              <button
                onClick={() => {
                  setViewAllTab(activeTaskTab === "Today" ? "Today" : "Overdue");
                  setShowViewAllModal(true);
                }}
                className={`text-[11px] font-bold tracking-wider px-2 py-1.5 rounded-lg border transition-all whitespace-nowrap shrink-0 ${
                  activeTaskTab === "Today"
                    ? "text-primary bg-slate-50 border-slate-100 hover:bg-slate-100 hover:border-slate-200"
                    : "text-error bg-error/5 border-error/10 hover:bg-error/10 hover:border-error/20"
                }`}
              >
                View All
              </button>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto pr-1 no-scrollbar animate-fade-in" key={activeTaskTab}>
              {activeTaskTab === "Today" ? (
                todayTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <CheckCircle2 size={24} className="text-slate-200 mb-3" />
                    <p className="text-[12px] font-bold text-slate-300 tracking-widest">
                      All Caught Up
                    </p>
                  </div>
                ) : (
                  todayTasks.slice(0, 4).map((f) => {
                    const client = clients.find(
                      (c) =>
                        (f.clientId && (c.id == f.clientId || c.client_id == f.clientId)) ||
                        (f.leadId && (c.lead_id == f.leadId || c.id == f.leadId)),
                    );
                    return (
                      <div
                        key={`dash-task-today-${f.id}`}
                        onClick={() => {
                          if (!client) return;
                          const route = client.status?.toLowerCase() === "lead" ? "followups-leads" : "followups-clients";
                          onNavigate(route);
                        }}
                        className="p-4 bg-slate-50 border border-slate-100 rounded-xl hover:bg-white hover:border-secondary transition-all cursor-pointer shadow-sm group"
                      >
                        <div className="flex justify-between items-start mb-2.5">
                          <div className="flex gap-1.5 flex-wrap">
                            <span
                              className={`px-2 py-0.5 rounded-lg text-[13px] font-bold tracking-widest ${f.priority === "High" ? "bg-error/10 text-error" : "bg-info/10 text-info"}`}
                            >
                              {f.priority}
                            </span>
                            {client && (
                              <span
                                className={`px-2 py-0.5 rounded-lg text-[13px] font-bold tracking-widest ${
                                  client.status === "Active"
                                    ? "bg-primary text-white uppercase shadow-sm"
                                    : "bg-secondary text-white uppercase shadow-sm"
                                }`}
                              >
                                {client.status?.toLowerCase() === "lead" ? "New" : "Reference"}
                              </span>
                            )}
                          </div>
                          <span className="text-[14px] text-textMuted font-bold flex items-center gap-1 ">
                            <Clock size={10} />{" "}
                            {parseLocalDate(f.dueDate).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })}
                          </span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          {client && (
                            <p className="text-[12px] font-bold text-slate-400 group-hover:text-primary transition-colors">
                              {client.name}
                            </p>
                          )}
                          <h4 className="text-sm font-bold text-primary group-hover:text-secondary truncate">
                            {f.title}
                          </h4>
                        </div>
                      </div>
                    );
                  })
                )
              ) : (
                missedTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <CheckCircle2 size={24} className="text-slate-200 mb-3" />
                    <p className="text-[12px] font-bold text-slate-300 tracking-widest">
                      No Missed Tasks
                    </p>
                  </div>
                ) : (
                  missedTasks.slice(0, 4).map((f) => {
                    const client = clients.find(
                      (c) =>
                        (f.clientId && (c.id == f.clientId || c.client_id == f.clientId)) ||
                        (f.leadId && (c.id == f.leadId || c.lead_id == f.leadId)),
                    );
                    return (
                      <div
                        key={`dash-task-missed-${f.id}`}
                        onClick={() => {
                          if (!client) return;
                          const route = client.status?.toLowerCase() === "lead" ? "followups-leads" : "followups-clients";
                          onNavigate(route);
                        }}
                        className="p-4 bg-error/5 border border-error/10 rounded-xl hover:bg-white hover:border-error transition-all cursor-pointer shadow-sm group"
                      >
                        <div className="flex justify-between items-start mb-2.5">
                          <div className="flex gap-1.5 flex-wrap">
                            <span
                              className={`px-2 py-0.5 rounded-lg text-[13px] font-black tracking-widest bg-white/50 text-error border border-error/10`}
                            >
                              Overdue
                            </span>
                            {client && (
                              <span
                                className={`px-2 py-0.5 rounded-lg text-[13px] font-bold tracking-widest ${
                                  client.status === "Active"
                                    ? "bg-primary text-white uppercase shadow-sm"
                                    : "bg-secondary text-white uppercase shadow-sm"
                                }`}
                              >
                                {client.status?.toLowerCase() === "lead" ? "New" : "Reference"}
                              </span>
                            )}
                          </div>
                          <span className="text-[13px] text-error/60 font-black flex items-center gap-1 ">
                            <Clock size={10} />{" "}
                            {parseLocalDate(f.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          {client && (
                            <p className="text-[12px] font-bold text-error/60 group-hover:text-error transition-colors">
                              {client.name}
                            </p>
                          )}
                          <h4 className="text-sm font-bold text-primary group-hover:text-error truncate">
                            {f.title}
                          </h4>
                        </div>
                      </div>
                    );
                  })
                )
              )}
            </div>
          </div>
          <div className="w-full lg:w-[65%] xl:w-[70%] bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[480px] lg:h-full overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h3 className="text-base font-bold text-primary tracking-tight">
                  Engagement Rate
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex gap-2">
                  {/* Custom Year Dropdown */}
                  <div className="relative" ref={null}>
                    <button
                      onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
                      className="flex items-center justify-between gap-3 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[12px] font-bold tracking-widest text-[#18254D] hover:bg-white hover:border-slate-300 transition-all min-w-[90px] shadow-sm group"
                    >
                      <span>{selectedYear}</span>
                      <ChevronDown
                        size={14}
                        strokeWidth={2.5}
                        className={`transition-transform duration-300 ${isYearDropdownOpen ? "rotate-180" : ""}`}
                      />
                    </button>

                    {isYearDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-[80]"
                          onClick={() => setIsYearDropdownOpen(false)}
                        />
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-xl shadow-2xl overflow-hidden z-[90] animate-fade-in-up origin-top no-scrollbar">
                          {availableYears.map((y) => (
                            <button
                              key={`dash-year-${y}`}
                              onClick={() => {
                                setSelectedYear(y);
                                setIsYearDropdownOpen(false);
                              }}
                              className={`w-full text-left px-4 py-2.5 text-[12px] font-bold tracking-wider transition-colors ${
                                selectedYear === y
                                  ? "bg-[#18254D] text-white"
                                  : "text-[#18254D] hover:bg-slate-50"
                              }`}
                            >
                              {y}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Custom Month Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() =>
                        setIsMonthDropdownOpen(!isMonthDropdownOpen)
                      }
                      className="flex items-center justify-between gap-3 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[12px] font-bold tracking-widest text-[#18254D] hover:bg-white hover:border-slate-300 transition-all min-w-[100px] shadow-sm group"
                    >
                      <span>
                        {selectedMonth === "All" ? "All Months" : selectedMonth}
                      </span>
                      <ChevronDown
                        size={14}
                        strokeWidth={2.5}
                        className={`transition-transform duration-300 ${isMonthDropdownOpen ? "rotate-180" : ""}`}
                      />
                    </button>

                    {isMonthDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-[80]"
                          onClick={() => setIsMonthDropdownOpen(false)}
                        />
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-xl shadow-2xl overflow-hidden z-[90] animate-fade-in-up origin-top max-h-60 overflow-y-auto no-scrollbar">
                          {[
                            "All",
                            "Jan",
                            "Feb",
                            "Mar",
                            "Apr",
                            "May",
                            "Jun",
                            "Jul",
                            "Aug",
                            "Sep",
                            "Oct",
                            "Nov",
                            "Dec",
                          ].map((m) => (
                            <button
                              key={`dash-month-${m}`}
                              onClick={() => {
                                setSelectedMonth(m);
                                setIsMonthDropdownOpen(false);
                              }}
                              className={`w-full text-left px-4 py-2.5 text-[12px] font-bold tracking-wider transition-colors ${
                                selectedMonth === m
                                  ? "bg-[#18254D] text-white"
                                  : "text-[#18254D] hover:bg-slate-50"
                              }`}
                            >
                              {m === "All" ? "All Months" : m}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-1 w-full mt-2 relative" style={{ minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <ComposedChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#F1F5F9"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 9, fontWeight: 800 }}
                  />
                  <YAxis
                    yAxisId="left"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 9, fontWeight: 800 }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #E2E8F0",
                      fontSize: "10px",
                    }}
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="enquiries"
                    stroke="#1F3A5F"
                    fill="#1F3A5F"
                    fillOpacity={0.05}
                    strokeWidth={2.5}
                    name="Enquiries"
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="leads"
                    stroke="#F5A623"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ r: 2 }}
                    name="Pending Leads"
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="clients"
                    stroke="#2EC4B6"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                    name="Active Clients"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
      </div>

        {/* View All Follow-ups Selection Modal */}
        {
  showViewAllModal &&
    createPortal(
      <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4">

        {/* BACKDROP */}
        <div
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity duration-200"
          onClick={() => setShowViewAllModal(false)}
        />

        {/* MODAL */}
        <div className="relative z-10 bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-sm overflow-hidden animate-pop">

          {/* HEADER */}
          <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
            <h3 className="text-sm font-bold text-[#18254D] tracking-tight">
              View Follow-ups
            </h3>

            <button
              onClick={() => setShowViewAllModal(false)}
              className="p-1.5 hover:bg-slate-200 rounded-xl text-slate-400 transition-all"
            >
              <X size={18} />
            </button>
          </div>

          {/* BODY */}
          <div className="p-4 space-y-3">

            {/* Reference Follow-ups */}
            <button
              onClick={() => {
                onNavigate("followups-clients", viewAllTab);
                setShowViewAllModal(false);
              }}
              className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-[#18254D] hover:text-white transition-all group border border-slate-100"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-xl group-hover:bg-white/10 shadow-sm border border-slate-100">
                  <Users
                    size={18}
                    className="text-primary group-hover:text-white"
                  />
                </div>

                <div className="text-left">
                  <p className="text-xs font-bold tracking-tight">
                    Reference Follow-ups
                  </p>
                  <p className="text-[14px] opacity-60 font-medium">
                    Continue with existing clients
                  </p>
                </div>
              </div>

              <ChevronRight size={16} />
            </button>

            {/* New Follow-ups */}
            <button
              onClick={() => {
                onNavigate("followups-leads", viewAllTab);
                setShowViewAllModal(false);
              }}
              className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-[#18254D] hover:text-white transition-all group border border-slate-100"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-xl group-hover:bg-white/10 shadow-sm border border-slate-100">
                  <UserPlus
                    size={18}
                    className="text-secondary group-hover:text-white"
                  />
                </div>

                <div className="text-left">
                  <p className="text-xs font-bold tracking-tight">
                    New Follow-ups
                  </p>
                  <p className="text-[14px] opacity-60 font-medium">
                    Connect with potential leads
                  </p>
                </div>
              </div>

              <ChevronRight size={16} />
            </button>

          </div>
        </div>
      </div>,
      document.body
    )
}
      </div>
    </div>
  );
};

export default Dashboard;



