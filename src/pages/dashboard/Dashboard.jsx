import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useScrollLock } from "../../hooks/useScrollLock";
import { Area, Line, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart } from "recharts";
import { Users, UserPlus, Clock, CheckCircle2, ChevronRight, ChevronDown, Filter, Calendar, TrendingUp, X, Bell, Info, Inbox, Activity, Mail, ArrowUpRight, ArrowRight, Lightbulb, BarChart2, LayoutGrid, FileText, BarChart3, Grip, Globe } from "lucide-react";
import { BASE_URL } from "../../constants/config";
import { addToGoogleCalendar } from "../../utils/calendar";
import { toast } from "react-hot-toast";
import { getAuthHeaders } from "../../utils/auth";
import favIcon from "../../assets/Parivartan-Leaf.png";


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
function StatCard({ title, value, trend, trendUp, badge, icon, description, delay = 0, colorClass, data, strokeColor, onClick }) {
  const colorMap = {
    blue: { bg: "bg-blue-50", text: "text-blue-500", badgeBg: "bg-blue-50", badgeText: "text-blue-600" },
    teal: { bg: "bg-[#F0FDF4]", text: "text-[#16A34A]", badgeBg: "bg-[#DCFCE7]", badgeText: "text-[#16A34A]" },
    purple: { bg: "bg-purple-50", text: "text-purple-500", badgeBg: "bg-[#F3E8FF]", badgeText: "text-[#9333EA]" },
    orange: { bg: "bg-orange-50", text: "text-orange-500", badgeBg: "bg-[#FFEDD5]", badgeText: "text-[#EA580C]" },
  };
  const colors = colorMap[colorClass] || colorMap.blue;

  return (
    <div
      onClick={onClick}
      className={`bg-[#FFFFFF] p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200 hover:-translate-y-1 hover:shadow-md transition-all duration-300 relative animate-fade-in-up flex flex-col justify-between ${onClick ? "cursor-pointer" : ""}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-full ${colors.bg} ${colors.text}`}>
            {icon}
          </div>
          <div>
            <h3 className="text-slate-500 text-xs font-semibold">{title}</h3>
            <p className="text-2xl font-bold text-[#18254D] mt-0.5 leading-none">{value}</p>
          </div>
        </div>
        {badge && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colors.badgeBg} ${colors.badgeText}`}>
            {badge}
          </span>
        )}
      </div>

      <div className="flex justify-between items-end mt-2">
        <div className="flex items-center gap-1">
          {trend ? (
            <span className={`text-[11px] font-bold flex items-center gap-0.5 ${trendUp ? "text-[#16A34A]" : "text-slate-400"}`}>
              {trend} {trendUp && <ArrowUpRight size={14} />}
            </span>
          ) : (
            <span className="text-[11px] font-semibold text-slate-400">
              No change
            </span>
          )}
        </div>

        <div className="w-16 h-8">
          <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
            <LineChart data={data}>
              <Line type="monotone" dataKey="value" stroke={strokeColor} strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ followUps, clients, leads = [], enquiries, aiModels = [], onSelectFollowUp, onNavigate, onClearNotifications, loading = false }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAppSwitcher, setShowAppSwitcher] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Combine db new enquiries with our mock ones
  const dbNotifications = (enquiries || [])
    .filter(e => e.status === "new")
    .map((e) => {
      const colors = [
        "bg-[#EFF6FF] text-[#3B82F6]",
        "bg-[#F5F3FF] text-[#8B5CF6]",
        "bg-[#ECFDF5] text-[#10B981]",
        "bg-[#FFF7ED] text-[#F97316]",
        "bg-[#FFF1F2] text-[#F43F5E]"
      ];
      const avatarColor = colors[(e.name || "").charCodeAt(0) % colors.length] || colors[0];
      const dateStr = e.date ? new Date(e.date).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' }) : "Just now";
      const timeStr = e.date ? new Date(e.date).toLocaleTimeString("en-US", { hour: 'numeric', minute: '2-digit' }) : "";

      return {
        id: `db-${e.id}`,
        dbId: e.id,
        name: e.name || "New Enquiry",
        subtitle: e.interest || e.message || "Interested in Services",
        time: timeStr ? `${dateStr} • ${timeStr}` : dateStr,
        status: "new",
        avatar: (e.name || "E").charAt(0).toUpperCase(),
        avatarColor,
        isDb: true
      };
    });

  const allNotificationsList = [...dbNotifications, ...notifications];
  const unreadCount = allNotificationsList.filter(n => n.status === "new").length;

  const renderSubtitle = (subtitle) => {
    if (subtitle && subtitle.includes("Qualified")) {
      const parts = subtitle.split("Qualified");
      return (
        <>
          {parts[0]}
          <span className="text-[#10B981] font-bold">Qualified</span>
          {parts[1]}
        </>
      );
    }
    return subtitle;
  };

  const handleNotifClick = async (n) => {
    if (n.isDb) {
      if (n.status === "new") {
        try {
          await fetch(`${BASE_URL}/api/update-enquiry-status/${n.dbId}`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify({ status: "read" })
          });
        } catch (err) {
          console.error("Failed to mark notification as read:", err);
        }
      }
      onNavigate("enquiries");
    } else {
      setNotifications(prev =>
        prev.map(item => (item.id === n.id ? { ...item, status: "read" } : item))
      );
      onNavigate("enquiries");
    }
    setShowNotifications(false);
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(item => ({ ...item, status: "read" })));
    if (onClearNotifications) {
      onClearNotifications();
    }
  };

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
  const yearDropdownRef = useRef(null);
  const monthDropdownRef = useRef(null);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (yearDropdownRef.current && !yearDropdownRef.current.contains(event.target)) {
        setIsYearDropdownOpen(false);
      }
      if (monthDropdownRef.current && !monthDropdownRef.current.contains(event.target)) {
        setIsMonthDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Lock scroll when any modal is open
  useScrollLock(showNotifications || showViewAllModal || showAppSwitcher);

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
    return parseLocalDate(date) < new Date();
  }

  const handleAddToCalendar = async (f) => {
    try {
      const startTime = parseLocalDate(f.dueDate);
      const endTime = new Date(startTime.getTime() + 30 * 60000); // 30 mins later

      const client = clients.find(
        (c) =>
          (f.clientId && (c.id == f.clientId || c.client_id == f.clientId)) ||
          (f.leadId && (c.lead_id == f.leadId || c.id == f.leadId)),
      );

      const eventData = {
        title: `Follow-up: ${f.title}`,
        description: `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n 📋 Follow-up Title\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n 📌 TITLE:     ${f.title}\n 👤 CLIENT:    ${client?.name || "N/A"}\n 🏢 COMPANY:   ${client?.company || "N/A"}\n 📞 MODE:      ${f.followup_mode || "Call"}\n\n ──────────────────────────────\n 📝 DESCRIPTION:\n ${f.description || "No description provided."}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nGenerated via Parivartan CRM`,
        start: startTime,
        end: endTime
      };

      toast.promise(addToGoogleCalendar(eventData), {
        loading: 'Connecting to Google Calendar...',
        success: 'Event added to your calendar!',
        error: 'Failed to add event to calendar.'
      });
    } catch (error) {
      console.error(error);
      toast.error("Could not sync with Google Calendar.");
    }
  };


  // Calculate stats
  const newEnquiries = enquiries.filter((e) => e.status === "new" || e.status === "read");
  const pendingTasks = followUps.filter((f) => f.status === "pending" && !isMissed(f.dueDate));
  const missedTasks = followUps.filter((f) => isMissed(f.dueDate) && f.status === "pending");
  const completedTasks = followUps.filter((f) => f.status === "completed");
  const displayTasks = activeTaskTab === "Pending" ? pendingTasks : activeTaskTab === "Overdue" ? missedTasks : completedTasks;
  const totalNotifications = unreadCount;
  const newEnquiriesCount = newEnquiries.length;

  const leadCount = leads.filter((l) => l.status === "Lead").length;
  const clientCount = clients.filter((c) => c.status === "Active").length;
  const totalPool = leadCount + clientCount;
  const engagementRate = totalPool > 0 ? Math.round((clientCount / totalPool) * 100) : 0;

  // Helper for monthly aggregation
  const getLast6MonthsData = (items, dateField) => {
    const data = [];
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(today.getMonth() - i);
      const targetYear = d.getFullYear();
      const targetMonth = d.getMonth();

      const count = items.filter(item => {
        const itemDate = parseLocalDate(item[dateField]);
        return itemDate.getFullYear() === targetYear && itemDate.getMonth() === targetMonth;
      }).length;

      data.push({ value: count });
    }
    return data;
  };

  // Get cumulative leads data for trailing 6 months
  const getLeadsLast6Months = () => {
    const data = [];
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(today.getMonth() - i);
      const targetDate = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const count = leads.filter(l => l.status === "Lead" && parseLocalDate(l.joinedDate) <= targetDate).length;
      data.push({ value: count });
    }
    return data;
  };

  // Get cumulative clients data for trailing 6 months
  const getClientsLast6Months = () => {
    const data = [];
    const today = new Date();
    const activeClients = clients.filter(c => c.status === "Active");
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(today.getMonth() - i);
      const targetDate = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const count = activeClients.filter(c => parseLocalDate(c.joinedDate) <= targetDate).length;
      data.push({ value: count });
    }
    return data;
  };

  // Get cumulative engagement rate data for trailing 6 months
  const getEngagementRateLast6Months = () => {
    const data = [];
    const today = new Date();
    const activeClients = clients.filter(c => c.status === "Active");

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(today.getMonth() - i);
      const targetDate = new Date(d.getFullYear(), d.getMonth() + 1, 0);

      const clientsCount = activeClients.filter(c => parseLocalDate(c.joinedDate) <= targetDate).length;
      const leadsCount = leads.filter(l => l.status === "Lead" && parseLocalDate(l.joinedDate) <= targetDate).length;

      const total = clientsCount + leadsCount;
      const rate = total > 0 ? Math.round((clientsCount / total) * 100) : 0;

      data.push({ value: rate });
    }
    return data;
  };

  // Dynamic calculations for Stat Cards
  const enquiriesToday = enquiries.filter(e => isToday(e.date)).length;

  const getLeadsTrendAndBadge = () => {
    const today = new Date();
    const getDiffDays = (d) => {
      const diffTime = today - parseLocalDate(d);
      return diffTime / (1000 * 60 * 60 * 24);
    };
    const last7 = leads.filter(l => l.status === "Lead" && getDiffDays(l.joinedDate) <= 7).length;
    const prev7 = leads.filter(l => l.status === "Lead" && getDiffDays(l.joinedDate) > 7 && getDiffDays(l.joinedDate) <= 14).length;

    let badge = "Steady";
    if (last7 > prev7) {
      badge = "Growing";
    } else if (last7 < prev7 && prev7 > 0) {
      badge = "Declining";
    }

    const todayCount = leads.filter(l => l.status === "Lead" && isToday(l.joinedDate)).length;
    return {
      badge,
      trend: todayCount > 0 ? `+${todayCount} today` : undefined,
      trendUp: todayCount > 0
    };
  };

  const getClientsTrendAndBadge = () => {
    const today = new Date();
    const getDiffDays = (d) => {
      const diffTime = today - parseLocalDate(d);
      return diffTime / (1000 * 60 * 60 * 24);
    };
    const last30 = clients.filter(c => c.status === "Active" && getDiffDays(c.joinedDate) <= 30).length;
    const badge = last30 > 0 ? `+${last30} New` : "Retained";

    const todayCount = clients.filter(c => c.status === "Active" && isToday(c.joinedDate)).length;
    return {
      badge,
      trend: todayCount > 0 ? `+${todayCount} today` : undefined,
      trendUp: todayCount > 0
    };
  };

  const getEngagementTrendAndBadge = () => {
    let badge = "Low";
    if (engagementRate >= 75) badge = "High";
    else if (engagementRate >= 45) badge = "Medium";

    const activeClients = clients.filter(c => c.status === "Active");
    const getDiffDays = (d) => {
      const today = new Date();
      return (today - parseLocalDate(d)) / (1000 * 60 * 60 * 24);
    };
    const prevLeads = leads.filter(l => l.status === "Lead" && getDiffDays(l.joinedDate) > 7).length;
    const prevClients = activeClients.filter(c => getDiffDays(c.joinedDate) > 7).length;
    const prevTotal = prevLeads + prevClients;
    const prevEngagementRate = prevTotal > 0 ? Math.round((prevClients / prevTotal) * 100) : 0;

    const diff = engagementRate - prevEngagementRate;
    let trend = undefined;
    let trendUp = false;
    if (diff > 0) {
      trend = `+${diff}% this week`;
      trendUp = true;
    } else if (diff < 0) {
      trend = `${diff}% this week`;
      trendUp = false;
    }

    return { badge, trend, trendUp };
  };

  const leadsInfo = getLeadsTrendAndBadge();
  const clientsInfo = getClientsTrendAndBadge();
  const engagementInfo = getEngagementTrendAndBadge();


  // Chart data
  function getChartData() {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const yearNum = parseInt(selectedYear);
    const activeClients = clients.filter(c => c.status === "Active");

    if (selectedMonth === "All") {
      const prevYearNum = yearNum - 1;
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

        // Previous year engagement rate from real data
        const prevMonthlyEnquiries = enquiries.filter(e => {
          const d = new Date(e.date);
          return d.getFullYear() === prevYearNum && d.getMonth() === index;
        }).length;
        const prevMonthlyClients = activeClients.filter(c => {
          const d = new Date(c.joinedDate);
          return d.getFullYear() === prevYearNum && d.getMonth() === index;
        }).length;
        const prevMonthlyLeads = leads.filter(l => {
          const d = new Date(l.joinedDate);
          return l.status === "Lead" && d.getFullYear() === prevYearNum && d.getMonth() === index;
        }).length;
        const prevTotalPotential = prevMonthlyEnquiries + prevMonthlyLeads;
        const previousYear = prevTotalPotential > 0 ? Math.round((prevMonthlyClients / prevTotalPotential) * 100) : 0;

        return {
          name: month,
          enquiries: monthlyEnquiries,
          clients: monthlyClients,
          leads: monthlyLeads,
          engagement,
          previousYear,
        };
      });
    }

    // Weekly for specific month
    const monthIndex = months.indexOf(selectedMonth);
    const prevYearNum = yearNum - 1;
    return [1, 2, 3, 4].map(week => {
      const startDay = (week - 1) * 7 + 1;
      const endDay = week === 4 ? 31 : week * 7;

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

      // Previous year engagement rate from real data
      const prevWeeklyEnquiries = enquiries.filter(e => {
        const d = new Date(e.date);
        return d.getFullYear() === prevYearNum && d.getMonth() === monthIndex && d.getDate() >= startDay && d.getDate() <= endDay;
      }).length;
      const prevWeeklyClients = activeClients.filter(c => {
        const d = new Date(c.joinedDate);
        return d.getFullYear() === prevYearNum && d.getMonth() === monthIndex && d.getDate() >= startDay && d.getDate() <= endDay;
      }).length;
      const prevWeeklyLeads = leads.filter(l => {
        const d = new Date(l.joinedDate);
        return l.status === "Lead" && d.getFullYear() === prevYearNum && d.getMonth() === monthIndex && d.getDate() >= startDay && d.getDate() <= endDay;
      }).length;
      const prevTotalPotential = prevWeeklyEnquiries + prevWeeklyLeads;
      const previousYear = prevTotalPotential > 0 ? Math.round((prevWeeklyClients / prevTotalPotential) * 100) : 0;

      return {
        name: `Week ${week}`,
        enquiries: weeklyEnquiries,
        clients: weeklyClients,
        leads: weeklyLeads,
        engagement,
        previousYear,
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
    <div className="w-full relative lg:flex lg:flex-col lg:h-[calc(100vh-140px)]">
      <div className="space-y-4 md:space-y-5 animate-fade-in w-full lg:flex-1 lg:min-h-0 lg:flex lg:flex-col relative z-0">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-6 lg:gap-4 animate-fade-in relative z-50 shrink-0 w-full" style={{ animationDelay: '100ms' }}>
          <div className="max-w-2xl shrink-0 text-center lg:text-left w-full lg:w-auto">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary tracking-tight mb-2">
              Welcome {currentUser?.full_name?.split(' ')[0] || 'Admin'} <span className="text-2xl animate-waving-hand inline-block origin-[70%_70%]">👋</span>
            </h2>
            <p className="text-sm text-textMuted font-medium leading-relaxed">
                Let's build something remarkable today.
            </p>
          </div>

          <div className="flex items-center justify-between w-full lg:w-auto gap-4 relative z-20">
            {/* Icons Group */}
            <div className="flex items-center gap-4 order-2 lg:order-1">
              {/* App Switcher */}
              <div className="relative shrink-0 group">
                <button
                  onClick={() => setShowAppSwitcher(!showAppSwitcher)}
                  className={`w-[42px] h-[42px] rounded-full border border-slate-200 bg-white flex items-center justify-center transition-all ${showAppSwitcher
                    ? "text-primary shadow-md"
                    : "text-slate-500 hover:bg-slate-50 shadow-sm"
                    }`}
                >
                  <Globe size={18} strokeWidth={2.5} />
                </button>
                <div className="absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#18254D] text-white text-[10px] font-bold px-2.5 py-1.5 rounded-[6px] whitespace-nowrap pointer-events-none z-[100] shadow-md">
                  Parivartan Hub
                </div>
                {showAppSwitcher && createPortal(
                <>
                  <div
                    className="fixed inset-0 z-[1000] bg-slate-900/10 backdrop-blur-[2px]"
                    onClick={() => setShowAppSwitcher(false)}
                  />
                  <div className="fixed top-24 left-4 right-4 sm:left-auto md:right-24 w-auto sm:w-[320px] bg-white rounded-2xl shadow-[0_20px_50px_-12px_rgba(24,37,77,0.15)] border border-slate-100/85 overflow-hidden animate-pop z-[1001] p-5">
                    <h3 className="text-[13px] font-bold text-slate-400 tracking-wider mb-4 px-1">Parivartan Hub</h3>
                    <div className="grid grid-cols-2 gap-3">

                      {/* HR Portal App */}
                      <button 
                        onClick={() => {
                          setShowAppSwitcher(false);
                          const form = document.createElement("form");
                          form.method = "POST";
                          form.action = "https://hrportal.eparivartan.com/admin/login";
                          form.target = "_blank";
                          const emailInput = document.createElement("input");
                          emailInput.type = "hidden";
                          emailInput.name = "email";
                          emailInput.value = "eparivartan@gmail.com";
                          form.appendChild(emailInput);
                          const passwordInput = document.createElement("input");
                          passwordInput.type = "hidden";
                          passwordInput.name = "password";
                          passwordInput.value = "admin@2026";
                          form.appendChild(passwordInput);
                          document.body.appendChild(form);
                          form.submit();
                          document.body.removeChild(form);
                        }}
                        className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl hover:bg-slate-50 transition-colors group"
                        title="Shift to HR Portal"
                      >
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md border-1 border-gray-300 group-hover:shadow-xl transition-all">
                          <img src={favIcon} alt="HR" className="w-8 h-8 object-contain" />
                        </div>
                        <span className="text-[11px] font-bold text-[#18254D]">HR Portal </span>
                      </button>

                      {/* Invoice App */}
                      <button 
                        className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl opacity-60 cursor-not-allowed group relative"
                        title="Coming Soon"
                      >
                        <div className="absolute -top-1 -right-1 z-10 w-2.5 h-2.5 rounded-full border-2 border-white" />
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-xl transition-all">
                          <img src={favIcon} alt="HR" className="w-8 h-8 object-contain" />
                        </div>
                        <span className="text-[11px] font-bold text-slate-500">Invoice</span>
                      </button>
                    </div>
                  </div>
                </>,
                document.body
              )}
            </div>

            {/* Notifications */}
            <div
              className="relative shrink-0"
              ref={dropdownRef}
            >
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`w-[42px] h-[42px] rounded-full border border-slate-200 bg-white flex items-center justify-center transition-all ${showNotifications
                  ? "text-primary shadow-md"
                  : "text-slate-500 hover:bg-slate-50 shadow-sm"
                  }`}
              >
                <div className="relative">
                  <Bell size={18} strokeWidth={2.5} />
                  {totalNotifications > 0 && !showNotifications && (
                    <span className="bg-[#3B82F6] text-white text-[10px] font-bold rounded-full w-[18px] h-[18px] flex items-center justify-center absolute -top-1.5 -right-1.5 border-[1.5px] border-white">
                      {totalNotifications}
                    </span>
                  )}
                </div>
              </button>
              {showNotifications && createPortal(
                <>
                  <div
                    className="fixed inset-0 z-[1000] bg-slate-900/10 backdrop-blur-[2px]"
                    onClick={() => setShowNotifications(false)}
                  />
                  <div className="fixed top-24 left-4 right-4 sm:left-auto md:right-10 w-auto sm:w-full sm:max-w-[380px] bg-white rounded-[24px] shadow-[0_20px_50px_-12px_rgba(24,37,77,0.15)] border border-slate-100/85 overflow-hidden animate-pop z-[1001]">

                    {/* HEADER */}
                    <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 bg-[#EFF6FF] text-[#3B82F6] rounded-full flex items-center justify-center relative">
                          <Bell size={18} strokeWidth={2} />
                          {unreadCount > 0 && (
                            <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-blue-600 rounded-full border-2 border-[#EFF6FF]" />
                          )}
                        </div>
                        <h3 className="text-base font-bold text-[#18254D]">
                          Notifications
                        </h3>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={handleMarkAllRead}
                          className="text-[11px] font-bold text-[#3B82F6] hover:text-blue-700 transition-colors"
                        >
                          Mark all as read
                        </button>
                        <button
                          onClick={() => setShowNotifications(false)}
                          className="w-7 h-7 rounded-full bg-slate-50 text-slate-500 hover:bg-slate-100 flex items-center justify-center transition-colors"
                        >
                          <X size={14} strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>

                    {/* BODY / LIST */}
                    <div className="max-h-[380px] overflow-y-auto no-scrollbar">
                      {allNotificationsList.length === 0 ? (
                        <div className="py-12 flex flex-col items-center justify-center text-center opacity-40">
                          <Inbox size={32} strokeWidth={1} className="mb-2 text-slate-300" />
                          <p className="text-[11px] font-bold tracking-widest uppercase text-slate-400">
                            No notifications
                          </p>
                        </div>
                      ) : (
                        allNotificationsList.map((n) => (
                          <div
                            key={n.id}
                            className="flex items-center px-5 py-3 hover:bg-slate-50/70 transition-all cursor-pointer border-b border-slate-100 last:border-0 relative"
                            onClick={() => handleNotifClick(n)}
                          >
                            {/* Unread indicator */}
                            <div className="w-4 flex items-center justify-start shrink-0">
                              {n.status === "new" && (
                                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                              )}
                            </div>

                            {/* Avatar */}
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 mr-3 ${n.avatarColor}`}>
                              {n.avatar}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0 pr-3">
                              <h4 className="text-[12px] font-bold text-[#18254D] leading-tight mb-0.5">
                                {n.name}
                              </h4>
                              <p className="text-[11px] text-slate-500 font-medium leading-normal mb-1 line-clamp-2">
                                {renderSubtitle(n.subtitle)}
                              </p>
                              <div className="flex items-center gap-1 text-[9px] text-slate-400 font-semibold">
                                <Clock size={10} className="text-slate-400 shrink-0" />
                                <span>{n.time}</span>
                              </div>
                            </div>

                            {/* Badges / Chevron */}
                            <div className="flex items-center gap-2 shrink-0">
                              {n.status === "new" && (
                                <span className="text-[8px] font-extrabold text-[#3B82F6] bg-[#EFF6FF] px-1.5 py-0.5 rounded-md tracking-wider">
                                  NEW
                                </span>
                              )}
                              <ChevronRight size={14} className="text-slate-400" />
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* FOOTER */}
                    <div className="p-3 bg-slate-50/50 border-t border-slate-100 text-center rounded-b-[24px]">
                      <button
                        onClick={() => {
                          onNavigate("enquiries");
                          setShowNotifications(false);
                        }}
                        className="text-[11px] font-bold text-[#3B82F6] hover:text-blue-700 transition-colors flex items-center justify-center gap-1 mx-auto"
                      >
                        View all activity
                        <ArrowRight size={12} strokeWidth={2.5} />
                      </button>
                    </div>

                  </div>
                </>,
                document.body
              )}
            </div>
            </div> {/* End Icons Group */}

            {/* Profile */}
            <div className="order-1 lg:order-2 flex items-center bg-white py-1.5 pl-4 pr-1.5 rounded-full border border-slate-200 shadow-sm min-w-max cursor-pointer hover:bg-slate-50 transition-colors">
              <div className="text-left flex flex-col justify-center mr-3">
                <p className="text-sm font-bold text-[#18254D] leading-none mb-1">
                  {currentUser?.full_name?.split(' ')[0] || 'Anand'}
                </p>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider leading-none">
                  {currentUser?.role || 'Root Admin'}
                </p>
              </div>
              {currentUser?.image ? (
                <img
                  src={getImageUrl(currentUser.image)}
                  alt="Profile"
                  className="w-[46px] h-[46px] rounded-full object-cover shadow-sm shrink-0"
                />
              ) : (
                <div className="w-[46px] h-[46px] rounded-full bg-[#18254D] flex items-center justify-center shadow-sm shrink-0">
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
            trend={enquiriesToday > 0 ? `+${enquiriesToday} today` : undefined}
            trendUp={enquiriesToday > 0}
            icon={<Mail size={20} />}
            delay={150}
            colorClass="blue"
            strokeColor="#3B82F6"
            data={getLast6MonthsData(enquiries, 'date')}
            onClick={() => onNavigate("enquiries")}
          />
          <StatCard
            title="Total Leads"
            value={leadCount.toString()}
            badge={leadsInfo.badge}
            trend={leadsInfo.trend}
            trendUp={leadsInfo.trendUp}
            icon={<UserPlus size={20} />}
            delay={200}
            colorClass="teal"
            strokeColor="#2DD4BF"
            data={getLeadsLast6Months()}
            onClick={() => onNavigate("leads")}
          />
          <StatCard
            title="Total Clients"
            value={clientCount.toString()}
            badge={clientsInfo.badge}
            trend={clientsInfo.trend}
            trendUp={clientsInfo.trendUp}
            icon={<Users size={20} />}
            delay={250}
            colorClass="purple"
            strokeColor="#A855F7"
            data={getClientsLast6Months()}
            onClick={() => onNavigate("clients")}
          />
          <StatCard
            title="Engagement Rate"
            value={`${engagementRate}%`}
            badge={engagementInfo.badge}
            trend={engagementInfo.trend}
            trendUp={engagementInfo.trendUp}
            icon={<Activity size={20} />}
            delay={300}
            colorClass="orange"
            strokeColor="#F97316"
            data={getEngagementRateLast6Months()}
          />
        </div>

        <div className="flex flex-col lg:flex-row gap-4 md:gap-5 animate-fade-in-up lg:flex-1 lg:min-h-0" style={{ animationDelay: '350ms' }}>
          <div className="w-full lg:w-[35%] xl:w-[30%] bg-white rounded-[24px] shadow-sm border border-slate-200 flex flex-col min-h-[420px] lg:min-h-0 lg:h-full overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#0A578E] to-[#15B49F] p-5">
              <div className="flex flex-row justify-between items-start">
                <div className="flex gap-3 items-center">
                  <div className="text-white">
                    <CheckCircle2 size={24} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-[18px] font-extrabold text-white tracking-wide">Tasks</h3>
                    <p className="text-[13px] text-white/90 font-medium">{displayTasks.length} {activeTaskTab.toLowerCase()}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    onNavigate("followups");
                  }}
                  className="text-[14px] font-bold text-white hover:text-white/80 flex items-center gap-1 transition-colors"
                >
                  View all <ChevronRight size={16} strokeWidth={3} />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-white">
              <button
                onClick={() => setActiveTaskTab("Pending")}
                className={`px-5 py-2 rounded-xl text-[13px] font-bold transition-all ${activeTaskTab === "Pending" ? "text-white bg-[#15B49F] shadow-sm" : "text-slate-500 bg-slate-50 border border-slate-200 hover:bg-slate-100"}`}
              >
                Pending
              </button>
              <button
                onClick={() => setActiveTaskTab("Overdue")}
                className={`px-5 py-2 rounded-xl text-[13px] font-bold transition-all ${activeTaskTab === "Overdue" ? "text-white bg-red-500 shadow-sm" : "text-slate-500 bg-slate-50 border border-slate-200 hover:bg-slate-100"}`}
              >
                Overdue
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar animate-fade-in bg-slate-50/50" key={activeTaskTab}>
              {displayTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                  <CheckCircle2 size={32} className="text-slate-200 mb-3" />
                  <p className="text-[14px] font-bold text-slate-400 tracking-wider">
                    No Tasks Here
                  </p>
                </div>
              ) : (
                displayTasks.slice(0, 4).map((f) => {
                  const client = clients.find(
                    (c) =>
                      (f.clientId && (c.id == f.clientId || c.client_id == f.clientId)) ||
                      (f.leadId && (c.lead_id == f.leadId || c.id == f.leadId)),
                  );
                  const isOverdue = isMissed(f.dueDate) && f.status === "pending";
                  return (
                    <div
                      key={`dash-task-${f.id}`}
                      onClick={() => {
                        if (!client) return;
                        onSelectFollowUp(client);
                      }}
                      className={`px-5 py-4 flex items-center justify-between border-b border-slate-100 last:border-0 hover:bg-white transition-colors cursor-pointer bg-slate-50/30 group`}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        {/* Avatar */}
                        <div className="w-[46px] h-[46px] rounded-full bg-slate-900 text-white flex items-center justify-center text-[18px] font-bold shrink-0 border-2 border-white shadow-sm">
                          {client ? client.name.charAt(0).toUpperCase() : "T"}
                        </div>
                        
                        <div className="flex flex-col min-w-0 pr-2">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-[15px] font-bold text-[#18254D] truncate group-hover:text-primary transition-colors">
                              {f.title}
                            </h4>
                            {isOverdue ? (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-100 text-red-600 shrink-0 tracking-wider">OVERDUE</span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#18254D] text-white shrink-0 tracking-wider">NEW</span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1.5 text-[13px] font-bold">
                            {client && (
                              <span className="text-slate-500 truncate max-w-[120px]">
                                {client.name}
                              </span>
                            )}
                            {client && <span className="text-slate-300">•</span>}
                            <span className={`flex items-center gap-1 ${isOverdue ? "text-red-500" : "text-[#15B49F]"}`}>
                              <Calendar size={12} strokeWidth={3} />
                              {parseLocalDate(f.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right Icon */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isOverdue ? "bg-red-50 text-red-500" : "bg-[#E6F8F5] text-[#15B49F]"}`}>
                         <CheckCircle2 size={18} strokeWidth={3} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          <div className="w-full lg:w-[65%] xl:w-[70%] bg-[#FFFFFF] p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[480px] lg:h-full overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h3 className="text-base font-bold text-primary tracking-tight">
                  Engagement Rate
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex gap-2">
                  {/* Custom Year Dropdown */}
                  <div className="relative" ref={yearDropdownRef}>
                    <button
                      onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
                      className="flex items-center justify-between gap-2 px-3 py-1.5 bg-white border border-slate-200/70 rounded-xl text-[12px] font-semibold text-[#18254D] hover:bg-slate-50 hover:border-slate-300 transition-all min-w-[90px] shadow-sm active:scale-[0.98] outline-none group"
                    >
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-slate-500" />
                        <span>{selectedYear}</span>
                      </div>
                      <ChevronDown
                        size={14}
                        strokeWidth={2.5}
                        className={`transition-transform duration-300 text-slate-500 ${isYearDropdownOpen ? "rotate-180" : ""}`}
                      />
                    </button>

                    {isYearDropdownOpen && (
                      <div className="absolute top-full right-0 mt-2 bg-white border border-slate-100/85 rounded-2xl shadow-[0_12px_30px_-6px_rgba(24,37,77,0.12)] overflow-hidden z-[90] animate-pop origin-top w-28 no-scrollbar">
                        {availableYears.map((y) => (
                          <button
                            key={`dash-year-${y}`}
                            onClick={() => {
                              setSelectedYear(y);
                              setIsYearDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-[12px] font-medium transition-colors ${selectedYear === y
                              ? "bg-[#18254D] text-white"
                              : "text-[#18254D] hover:bg-slate-50"
                              }`}
                          >
                            {y}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Custom Month Dropdown */}
                  <div className="relative" ref={monthDropdownRef}>
                    <button
                      onClick={() =>
                        setIsMonthDropdownOpen(!isMonthDropdownOpen)
                      }
                      className="flex items-center justify-between gap-2 px-3 py-1.5 bg-white border border-slate-200/70 rounded-xl text-[12px] font-semibold text-[#18254D] hover:bg-slate-50 hover:border-slate-300 transition-all min-w-[105px] shadow-sm active:scale-[0.98] outline-none group"
                    >
                      <span>
                        {selectedMonth === "All" ? "All Months" : selectedMonth}
                      </span>
                      <ChevronDown
                        size={14}
                        strokeWidth={2.5}
                        className={`transition-transform duration-300 text-slate-500 ${isMonthDropdownOpen ? "rotate-180" : ""}`}
                      />
                    </button>

                    {isMonthDropdownOpen && (
                      <div className="absolute top-full right-0 mt-2 bg-white border border-slate-100/85 rounded-2xl shadow-[0_12px_30px_-6px_rgba(24,37,77,0.12)] overflow-hidden z-[90] animate-pop origin-top w-36 max-h-60 overflow-y-auto no-scrollbar">
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
                            className={`w-full text-left px-4 py-2 text-[12px] font-medium transition-colors ${selectedMonth === m
                              ? "bg-[#18254D] text-white"
                              : "text-[#18254D] hover:bg-slate-50"
                              }`}
                          >
                            {m === "All" ? "All Months" : m}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-1 w-full mt-2 relative" style={{ minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <ComposedChart data={chartData} margin={{ top: 10, right: 44, left: -20, bottom: 0 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#F1F5F9"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 10, fontWeight: 600 }}
                  />
                  <YAxis
                    yAxisId="left"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 10, fontWeight: 600 }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#F97316", fontSize: 10, fontWeight: 600 }}
                    tickFormatter={(v) => `${v}%`}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #E2E8F0",
                      fontSize: "10px",
                    }}
                    formatter={(value, name) => {
                      if (name === "Engagement Rate %") return [`${value}%`, name];
                      return [value, name];
                    }}
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="enquiries"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.1}
                    strokeWidth={2}
                    name="Enquiries"
                    dot={false}
                    activeDot={{ r: 6, fill: "#3B82F6" }}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="leads"
                    stroke="#2DD4BF"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    name="Pending Leads"
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="clients"
                    stroke="#A855F7"
                    strokeWidth={2}
                    dot={{ r: 3.5, stroke: "#A855F7", strokeWidth: 2, fill: "#FFF" }}
                    activeDot={{ r: 5 }}
                    name="Active Clients"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="engagement"
                    stroke="#F97316"
                    strokeWidth={2.5}
                    dot={{ r: 3.5, stroke: "#F97316", strokeWidth: 2, fill: "#FFF" }}
                    activeDot={{ r: 6, fill: "#F97316" }}
                    name="Engagement Rate %"
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



