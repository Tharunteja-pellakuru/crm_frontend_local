import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Settings,
  Inbox,
  UserPlus,
  BellRing,
  LogOut,
  X,
  ChevronDown,
} from "lucide-react";
import logoImg from "../assets/Parivartan_Logo.png";

function Sidebar({
  activeTab,
  setActiveTab,
  onLogout,
  enquiryCount = 0,
  followUpCount = 0,
  clientFollowUpCount = 0,
  leadFollowUpCount = 0,
  onCloseMobile,
  isCollapsed = false,
}) {
  const [expandedItems, setExpandedItems] = useState(["followups"]);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [imgError, setImgError] = useState(false);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "enquiries", label: "Enquiries", icon: Inbox, badge: enquiryCount },
    {
      id: "followups-leads",
      label: "Follow-ups",
      icon: BellRing,
      badge: leadFollowUpCount,
    },
    { id: "leads", label: "Leads", icon: UserPlus },
    { id: "clients", label: "Clients", icon: Users },
    { id: "projects", label: "Projects", icon: FolderKanban },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside
      className={`${isCollapsed ? "w-20" : "w-60"} bg-white text-slate-600 flex flex-col h-screen border-r border-slate-200 shadow-lg overflow-hidden select-none transition-all duration-300 relative`}
    >
      {/* Logo Section */}
      <div className="px-5 pt-5 pb-3 relative shrink-0 flex items-center justify-between">
        {!isCollapsed && (
          <div
            onClick={() => {
              setActiveTab("dashboard");
              if (onCloseMobile) onCloseMobile();
            }}
            className="cursor-pointer transition-transform duration-300 hover:scale-[1.02] active:scale-95 animate-fade-in flex items-center gap-2"
          >
            {!imgError ? (
              <img
                src={logoImg}
                alt="Parivartan Logo"
                className="h-auto object-contain"
                style={{ width: 200 }}
                onError={() => setImgError(true)}
              />
            ) : null}
          </div>
        )}
        {isCollapsed && (
          <div
            onClick={() => {
              setActiveTab("dashboard");
              if (onCloseMobile) onCloseMobile();
            }}
            className="mx-auto flex items-center justify-center w-full cursor-pointer transition-transform duration-300 hover:scale-110 active:scale-90"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4CAF50] to-[#2E7D32] flex items-center justify-center text-white font-bold text-lg shadow-md">
              P
            </div>
          </div>
        )}
        {/* Collapse/Settings toggle button */}
        {/* {!isCollapsed && (
          <button
            className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-all"
            title="Toggle"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="1" />
              <circle cx="12" cy="5" r="1" />
              <circle cx="12" cy="19" r="1" />
            </svg>
          </button>
        )} */}
      </div>



      {/* Menu Items */}
      <nav
        className={`flex-1 ${isCollapsed ? "px-2" : "px-3"} py-2 overflow-y-auto no-scrollbar`}
      >
        {menuItems.map((item, index) => {
          const isActive =
            activeTab === item.id ||
            (item.subItems &&
              item.subItems.some((sub) => activeTab === sub.id));
          const isExpanded = expandedItems.includes(item.id);
          const isHovered = hoveredItem === item.id;

          const toggleExpand = (e) => {
            if (item.subItems) {
              e.stopPropagation();
              setExpandedItems((prev) =>
                prev.includes(item.id)
                  ? prev.filter((id) => id !== item.id)
                  : [...prev, item.id],
              );
            }
          };

          return (
            <div
              key={item.id}
              className="animate-fade-in duration-200"
              style={{
                animationDelay: `${index * 30}ms`,
                marginBottom: '2px',
              }}
            >
              <button
                onClick={() => {
                  if (item.isLogout) {
                    onLogout();
                  } else if (item.subItems) {
                    setExpandedItems((prev) => {
                      const exists = prev.includes(item.id);
                      return exists
                        ? prev.filter((id) => id !== item.id)
                        : [...prev, item.id];
                    });
                  } else {
                    setActiveTab(item.id);
                    if (onCloseMobile) onCloseMobile();
                  }
                }}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                className={`w-full flex items-center ${isCollapsed ? "justify-center px-0 py-3.5" : "justify-between px-4 py-3"} rounded-xl transition-all duration-200 group ${isActive
                  ? "text-[rgb(2,192,206)]"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                  } ${isHovered && !isActive ? "translate-x-0.5" : ""}`}
                title={isCollapsed ? item.label : ""}
              >
                <div className="flex items-center gap-3.5">
                  <span
                    className={`${isActive ? "text-[rgb(2,192,206)]" : "text-slate-400 group-hover:text-slate-600"
                      } transition-all duration-200 ${isHovered && !isActive ? "scale-110" : ""}`}
                  >
                    <item.icon size={20} strokeWidth={1.8} />
                  </span>
                  {!isCollapsed && (
                    <span
                      style={{
                        fontFamily: "Inter, system-ui, sans-serif",
                        fontSize: "14.8px",
                        fontWeight: 500,
                        lineHeight: "14.8px",
                      }}
                      className={isActive ? "text-[rgb(2,192,206)]" : "text-slate-500"}
                    >
                      {item.label}
                    </span>
                  )}
                </div>
                {!isCollapsed && (
                  <div className="flex items-center gap-2.5">
                    {item.badge !== undefined &&
                      item.badge > 0 &&
                      (!isExpanded || item.id === "followups") && (
                        <span className="bg-[rgb(2,192,206)] text-white text-[10px] font-bold px-2 h-5 min-w-[1.25rem] rounded-full flex items-center justify-center shadow-sm animate-bounce-in">
                          {item.badge}
                        </span>
                      )}
                    <div className="w-4 flex items-center justify-center">
                      {item.subItems && (
                        <ChevronDown
                          size={14}
                          className={`text-slate-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                          onClick={toggleExpand}
                        />
                      )}
                    </div>
                  </div>
                )}
                {isCollapsed && item.badge > 0 && !isExpanded && (
                  <div className="absolute top-1 right-1">
                    <div className="w-2 h-2 bg-[rgb(2,192,206)] rounded-full shadow-sm animate-pulse-soft" />
                  </div>
                )}
              </button>

              {item.subItems && isExpanded && !isCollapsed && (
                <div className="ml-10 space-y-1 py-1.5 animate-fade-in">
                  {item.subItems.map((sub, subIndex) => {
                    const isSubActive = activeTab === sub.id;
                    return (
                      <button
                        key={sub.id}
                        onClick={() => {
                          setActiveTab(sub.id);
                          if (onCloseMobile) onCloseMobile();
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${isSubActive
                          ? "text-[rgb(2,192,206)]"
                          : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                          }`}
                        style={{
                          fontFamily: 'Inter, system-ui, sans-serif',
                          fontSize: '13px',
                          fontWeight: 500,
                          lineHeight: '13px',
                          animationDelay: `${subIndex * 75}ms`,
                        }}
                      >
                        <span className={isSubActive ? "text-[rgb(2,192,206)]" : "text-slate-400"}>
                          <sub.icon size={16} strokeWidth={1.8} />
                        </span>
                        <div className="flex-1 flex items-center justify-between gap-2.5">
                          <span>{sub.label}</span>
                          {sub.badge !== undefined && sub.badge > 0 && (
                            <span className="bg-[rgb(2,192,206)] text-white text-[10px] font-bold px-2 h-4.5 min-w-[1.125rem] rounded-full flex items-center justify-center shadow-sm">
                              {sub.badge}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

      </nav>

      {/* Logout at the bottom - pinned */}
      <div className={`p-4 bg-white mt-auto ${isCollapsed ? "px-2" : "px-4"}`}>
        <button
          onClick={onLogout}
          onMouseEnter={() => setHoveredItem("logout")}
          onMouseLeave={() => setHoveredItem(null)}
          className={`w-full flex items-center ${isCollapsed ? "justify-center px-0 py-3.5" : "gap-3.5 px-4 py-3"} rounded-xl transition-all duration-200 text-slate-400 hover:text-red-500 hover:bg-red-50 group`}
          title={isCollapsed ? "Log Out" : ""}
        >
          <LogOut size={20} strokeWidth={1.8} className="transition-colors" />
          {!isCollapsed && (
            <span className="text-[13.5px] font-medium tracking-wide">
              Logout
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
