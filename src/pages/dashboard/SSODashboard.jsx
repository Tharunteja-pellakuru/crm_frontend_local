import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search,
  Bell,
  LogOut,
  BarChart3,
  Users,
  FileText,
  ChevronRight,
  ShieldCheck,
  Activity,
  Lock,
  Globe,
  Clock,
  Sparkles,
} from "lucide-react";
import favIcon from "../../assets/Parivartan-Leaf.png";

const SSODashboard = ({ onLogout }) => {
  const navigate = useNavigate();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time for the session info
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Parse user from local storage
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : { name: "User", role: "Administrator" };
  const firstName = user?.name ? user.name.split(" ")[0] : "User";

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.3 },
    },
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    show: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 280, damping: 20 },
    },
  };

  const modules = [
    {
      id: "crm",
      title: "CRM Portal",
      description: "Manage leads, pipelines, customer relationships, follow-ups, and sales operations.",
      icon: <BarChart3 className="w-7 h-7 text-white" />,
      theme: "from-blue-600 to-emerald-500",
      bgGradient: "from-blue-50/50 to-emerald-50/30",
      borderGlow: "group-hover:shadow-[0_0_40px_-10px_rgba(59,130,246,0.4)]",
      status: "Operational",
      statusColor: "text-emerald-600 bg-emerald-50 border-emerald-200",
      stats: [
        { label: "Active Leads", value: "1,240" },
        { label: "Follow-ups Today", value: "45" },
      ],
      onClick: () => navigate("/dashboard"),
      btnText: "Open CRM",
      btnTheme: "bg-primary text-white hover:bg-primary/90",
      isActive: true,
    },
    {
      id: "hr",
      title: "HR Portal",
      description: "Manage employees, payroll, onboarding, attendance, and HR operations.",
      icon: <Users className="w-7 h-7 text-white" />,
      theme: "from-purple-600 to-indigo-500",
      bgGradient: "from-purple-50/50 to-indigo-50/30",
      borderGlow: "group-hover:shadow-[0_0_40px_-10px_rgba(168,85,247,0.4)]",
      status: "Operational",
      statusColor: "text-emerald-600 bg-emerald-50 border-emerald-200",
      stats: [
        { label: "Employees", value: "156" },
        { label: "Attendance Today", value: "98%" },
      ],
      onClick: () => {
        // Create a hidden form to submit credentials via POST to the HR Portal login
        const form = document.createElement("form");
        form.method = "POST";
        form.action = "https://hrportal.eparivartan.com/admin/login";
        form.target = "_blank"; // Open in new tab

        const emailInput = document.createElement("input");
        emailInput.type = "hidden";
        emailInput.name = "email"; // Assuming standard email field name
        emailInput.value = "eparivartan@gmail.com";
        form.appendChild(emailInput);

        const passwordInput = document.createElement("input");
        passwordInput.type = "hidden";
        passwordInput.name = "password"; // Assuming standard password field name
        passwordInput.value = "admin@2026";
        form.appendChild(passwordInput);

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
      },
      btnText: "Open HR Portal",
      btnTheme: "bg-primary text-white hover:bg-primary/90",
      isActive: true, // Make the button active
    },
    {
      id: "invoice",
      title: "Invoice Module",
      description: "Generate invoices, manage payments, billing history, and financial records.",
      icon: <FileText className="w-7 h-7 text-white" />,
      theme: "from-orange-500 to-amber-500",
      bgGradient: "from-orange-50/50 to-amber-50/30",
      borderGlow: "group-hover:shadow-[0_0_40px_-10px_rgba(249,115,22,0.4)]",
      status: "Coming Soon",
      statusColor: "text-orange-600 bg-orange-50 border-orange-200",
      stats: [
        { label: "Pending Invoices", value: "24" },
        { label: "Revenue This Month", value: "$42.5k" },
      ],
      onClick: () => {},
      btnText: "Open Invoice Module",
      btnTheme: "bg-surface text-textMuted border border-slate-200 cursor-not-allowed",
      isActive: false,
    },
  ];

  return (
    <div className="min-h-screen bg-background text-textPrimary font-sans relative overflow-hidden flex flex-col selection:bg-primary/10">
      
      {/* ---------------- BACKGROUND EFFECTS ---------------- */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Soft Mesh Gradient */}
        <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-white/60 to-transparent backdrop-blur-3xl" />
        {/* Glowing Orbs */}
        <motion.div 
          animate={{ scale: [1, 1.1, 1], rotate: [0, 90, 0] }} 
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-64 -left-64 w-[800px] h-[800px] rounded-full bg-emerald-400/10 blur-[120px]" 
        />
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, -90, 0] }} 
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -top-64 -right-64 w-[800px] h-[800px] rounded-full bg-blue-400/10 blur-[120px]" 
        />
      </div>

      {/* ---------------- TOP NAVBAR ---------------- */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="sticky top-0 z-50 w-full bg-surface/60 backdrop-blur-2xl border-b border-white/40 shadow-[0_4px_30px_rgba(0,0,0,0.02)]"
      >
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-20">
            {/* Left: Logo & Badge */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-[14px] bg-surface shadow-sm border border-slate-200/60 flex items-center justify-center p-2">
                <img src={favIcon} alt="Parivartan" className="w-full h-full object-contain" />
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-xl font-bold text-textPrimary tracking-tight leading-tight">
                  Parivartan
                </span>
                <span className="text-xs font-semibold tracking-wider text-textMuted uppercase">
                  Enterprise
                </span>
              </div>
              <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 ml-4">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">
                  SSO Enabled
                </span>
              </div>
            </div>

            {/* Center: Search */}
            <div className="hidden lg:flex flex-1 max-w-2xl mx-12">
              <div className={`relative w-full transition-all duration-300 ${isSearchFocused ? "scale-[1.02]" : "scale-100"}`}>
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className={`h-5 w-5 transition-colors ${isSearchFocused ? "text-primary" : "text-slate-400"}`} />
                </div>
                <input
                  type="text"
                  className="block w-full pl-12 pr-4 py-3 border border-slate-200/80 rounded-2xl leading-5 bg-surface/50 backdrop-blur-md placeholder-slate-400 focus:outline-none focus:bg-surface focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all duration-300 text-sm font-medium shadow-sm hover:shadow-md"
                  placeholder="Search modules, settings, or documents..."
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                />
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                   <div className="hidden md:flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 border border-slate-200">
                     <span className="text-[10px] font-bold text-slate-500">⌘K</span>
                   </div>
                </div>
              </div>
            </div>

            {/* Right: Profile */}
            <div className="flex items-center gap-4 sm:gap-6">
              <button className="relative p-2.5 rounded-xl text-slate-400 hover:text-primary hover:bg-primary/5 transition-colors group">
                <Bell className="h-5 w-5 group-hover:animate-shake" />
                <span className="absolute top-2 right-2 block h-2.5 w-2.5 rounded-full bg-error ring-2 ring-surface" />
              </button>
              
              <div className="h-8 w-px bg-slate-200/80 hidden sm:block"></div>
              
              <div className="flex items-center gap-3 cursor-pointer group">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-sm font-bold text-textPrimary leading-none mb-1">
                    {firstName}
                  </span>
                  <span className="text-xs font-medium text-textMuted leading-none">
                    {user?.role || "Administrator"}
                  </span>
                </div>
                <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-primary to-info p-[2px] shadow-sm group-hover:shadow-lg transition-all duration-300 hover-scale">
                  <div className="w-full h-full bg-surface rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-textPrimary">
                      {firstName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={onLogout}
                className="p-2.5 text-slate-400 hover:text-error hover:bg-error/10 rounded-xl transition-colors ml-1"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* ---------------- MAIN LAYOUT ---------------- */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto px-6 lg:px-12 py-12 z-10 flex flex-col min-h-0">
        
        {/* HERO SECTION */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
          className="mb-14 flex flex-col md:flex-row md:items-end justify-between gap-6"
        >
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-semibold tracking-wide text-emerald-700 uppercase">
                  All Systems Operational
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface border border-slate-200/60 text-slate-500 shadow-sm">
                <Lock className="w-3 h-3" />
                <span className="text-xs font-medium">Secure Session Active</span>
              </div>
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-extrabold text-textPrimary tracking-tight mb-4">
              Welcome back, {firstName} <span className="inline-block origin-[70%_70%] animate-shake">👋</span>
            </h1>
            <p className="text-xl text-textMuted max-w-2xl font-medium leading-relaxed">
              Access all enterprise applications securely through Single Sign-On. Select a module to launch your workspace.
            </p>
          </div>

          <div className="hidden lg:flex flex-col items-end gap-2 p-4 rounded-2xl bg-surface/50 border border-white/40 shadow-sm backdrop-blur-xl">
            <div className="text-sm font-semibold text-textPrimary flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
            <div className="text-2xl font-bold text-textPrimary tracking-tight">
              {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </motion.div>

        {/* MODULE CARDS GRID */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {modules.map((module) => (
            <motion.div
              key={module.id}
              variants={itemVariants}
              whileHover={{ y: -12 }}
              className={`group relative bg-surface/80 backdrop-blur-xl rounded-[24px] p-8 border border-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-500 flex flex-col h-full overflow-hidden ${module.borderGlow}`}
            >
              {/* Decorative Background Gradient */}
              <div className={`absolute top-0 right-0 w-[250px] h-[250px] bg-gradient-to-br ${module.bgGradient} rounded-bl-[100%] opacity-60 pointer-events-none group-hover:scale-110 transition-transform duration-700 ease-out`} />
              
              <div className="relative z-10 flex flex-col h-full">
                
                {/* Top: Icon & Status */}
                <div className="flex justify-between items-start mb-8">
                  <div className={`w-16 h-16 rounded-[20px] bg-gradient-to-br ${module.theme} flex items-center justify-center shadow-lg shadow-${module.theme.split('-')[1]}/30 group-hover:scale-110 transition-transform duration-500 ease-bounce-out`}>
                    {module.icon}
                  </div>
                  <div className={`px-3.5 py-1.5 rounded-full text-xs font-bold border tracking-wide uppercase ${module.statusColor} flex items-center gap-1.5 shadow-sm`}>
                    {module.isActive && <Sparkles className="w-3.5 h-3.5" />}
                    {module.status}
                  </div>
                </div>

                {/* Center: Title & Description */}
                <div className="flex-1 mb-8">
                  <h3 className="text-2xl font-extrabold text-textPrimary mb-3 tracking-tight">
                    {module.title}
                  </h3>
                  <p className="text-textMuted text-content-base">
                    {module.description}
                  </p>
                </div>

                {/* Bottom: Quick Stats Strip */}
                <div className="mb-8 grid grid-cols-2 gap-4 p-4 rounded-2xl bg-background/50 border border-slate-100">
                  {module.stats.map((stat, idx) => (
                    <div key={idx} className="flex flex-col">
                      <span className="text-[11px] font-bold text-textMuted uppercase tracking-wider mb-1">{stat.label}</span>
                      <span className="text-lg font-extrabold text-textPrimary">{stat.value}</span>
                    </div>
                  ))}
                </div>

                {/* Action Button */}
                <div className="mt-auto">
                  <button
                    onClick={module.onClick}
                    disabled={!module.isActive}
                    className={`w-full flex items-center justify-between px-6 py-4 rounded-[16px] font-bold text-[15px] transition-all duration-300 ${module.btnTheme} ${module.isActive ? 'shadow-md group-hover:shadow-xl hover:-translate-y-0.5' : ''}`}
                  >
                    <span>{module.btnText}</span>
                    {module.isActive && (
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform duration-300" />
                    )}
                  </button>
                </div>

              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* SECURE GATEWAY FOOTER */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-auto pt-16 pb-6"
        >
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between p-4 rounded-2xl bg-surface/40 backdrop-blur-md border border-white/50 shadow-sm text-xs font-medium text-slate-500">
            <div className="flex items-center gap-6 mb-4 md:mb-0">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-slate-400" />
                <span>IP: 192.168.1.104 (Trusted)</span>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <Activity className="w-4 h-4 text-slate-400" />
                <span>Latency: 24ms</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-500" />
              <span>End-to-End Encrypted Session</span>
              <span className="mx-2">•</span>
              <span>Last login: {currentTime.toLocaleDateString()}</span>
            </div>
          </div>
        </motion.div>

      </main>
    </div>
  );
};

export default SSODashboard;
