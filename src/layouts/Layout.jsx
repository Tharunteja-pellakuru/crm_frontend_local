import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { X } from "lucide-react";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import AIAssistantWidget from "../components/AIAssistant/AIAssistantWidget";
import favIcon from "../assets/Parivartan-Leaf.png";
import "remixicon/fonts/remixicon.css";

const Layout = ({
  onLogout, enquiries, followUps, clients
}) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isPageTransitioning, setIsPageTransitioning] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false); // ✅ Add mobile view state
  const location = useLocation();
  const navigate = useNavigate();
  const prevPathRef = useRef(location.pathname);

  // ✅ Detect mobile/tablet view synchronously
  useLayoutEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 1201); // Match your breakpoint
    };
    handleResize(); // Check immediately
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Handle active tab from current URL
  const pathParts = location.pathname.split("/").filter(Boolean);
  const activeTab = pathParts.length > 0 ? pathParts[0] : "dashboard";

  // Page transition effect
  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      setIsPageTransitioning(true);
      const timer = setTimeout(() => {
        setIsPageTransitioning(false);
      }, 300);
      prevPathRef.current = location.pathname;
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen bg-[#F1F2F8] overflow-x-hidden">
      {/* Mobile Backdrop */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[105] min-[1201px]:hidden animate-fade-in"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <div className={`fixed inset-y-0 left-0 transform ${isMobileSidebarOpen ? "translate-x-0 animate-slide-left-sidebar" : "-translate-x-full"} min-[1201px]:translate-x-0 transition-transform duration-300 ease-smooth z-[110] min-[1201px]:z-20`}>
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            navigate(`/${tab}`);
            setIsMobileSidebarOpen(false);
          }}
          onLogout={onLogout}
          enquiryCount={enquiries.filter(e => e.status === "new" || e.status === "read").length}
          followUpCount={followUps.filter(f => f.status === "pending").length}
          clientFollowUpCount={
            followUps.filter((f) => f.status === "pending" && !!f.projectId).length
          }
          leadFollowUpCount={
            followUps.filter((f) => f.status === "pending" && !!f.leadId && !f.projectId).length
          }
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          isMobile={isMobileView} // ✅ Pass mobile state to Sidebar
          isCollapsed={false}
        />
      </div>

      {/* ✅ Header with Conditional Logo */}
      <header
        className="
          min-[1201px]:hidden
          fixed top-0 left-0 right-0 z-[100]
          h-[72px]
          px-4
          flex items-center justify-between
          bg-white/90
          backdrop-blur-xl
          border-b border-slate-200/80
          shadow-sm
          animate-fade-in-down
        "
      >
        {/* Left Section */}
        <div className="flex items-center gap-3">
          {/* Logo */}
          <a
            href="/"
            className="flex items-center justify-center transition-transform duration-300 active:scale-95"
          >
            <img
              src={favIcon}
              alt="Parivartan"
              className="
                w-11 h-11
                object-contain
                drop-shadow-sm
              "
            />
          </a>
        </div>

        {/* Right Section */}
        <button
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          className="
            relative
            w-11 h-11
            flex items-center justify-center
            rounded-2xl
            bg-slate-100
            hover:bg-slate-200
            active:scale-95
            transition-all duration-300
            shadow-sm
            border border-slate-200
          "
        >
          <div className="flex items-center justify-center text-slate-800">
            {isMobileSidebarOpen ? (
              <X size={22} strokeWidth={2.2} />
            ) : (
              <i className="ri-menu-5-line text-[24px] text-slate-800"></i>
            )}
          </div>
        </button>
      </header>

      {/* Main Container */}
      <div className={`flex-1 min-w-0 flex flex-col min-[1201px]:ml-[240px] transition-all duration-300 ease-smooth ${isPageTransitioning ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"}`}>
        
        {/* Scalable Content Injection */}
        <main className="flex-1 p-3 min-[1201px]:px-8 min-[1201px]:py-6 min-w-0 overflow-x-hidden mt-24 min-[1201px]:mt-2 flex flex-col">
          <div
            key={location.pathname}
            className="w-full min-w-0 pb-8 flex-1 animate-fade-in-up"
          >
            <Outlet />
          </div>
          <Footer />
        </main>
      </div>

      <AIAssistantWidget />
    </div>
  );
};

export default Layout;