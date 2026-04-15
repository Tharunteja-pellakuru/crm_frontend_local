import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useScrollLock } from "../../hooks/useScrollLock";
import { toast as hotToast } from "react-hot-toast";
import {
  User,
  Lock,
  Save,
  Camera,
  Check,
  ChevronRight,
  Mail,
  Phone,
  Building2,
  ChevronDown,
  Users,
  Plus,
  Trash2,
  Edit2,
  Bot,
  Key,
  Zap,
  X,
  Loader2,
  Download,
  Inbox,
  UserPlus,
  BellRing,
  FolderKanban,
  FileText,
  Eye,
  EyeOff,
  Users as UsersIcon,
  Calendar,
  Briefcase,
  MessageSquare,
} from "lucide-react";
import { BASE_URL } from "../../constants/config";
import { getAuthHeaders } from "../../utils/auth";
import openaiLogo from "../../assets/openai_logo.png";
import geminiLogo from "../../assets/gemini_logo.png";
import grokLogo from "../../assets/grok_logo.png";
import anthropicLogo from "../../assets/anthropic_logo.png";
import mistralLogo from "../../assets/mistral_logo.png";
import deepseekLogo from "../../assets/deepseek_logo.png";
import llamaLogo from "../../assets/llama_logo.png";
import groqLogo from "../../assets/groq_logo.png";
import { CATEGORY_MAP } from "../../constants/categoryConstants";

const Settings = ({
  aiModels = [],
  onAddAiModel,
  onUpdateAiModel,  
  onDeleteAiModel,
}) => {
  const [activeTab, setActiveTab] = useState("profile");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [exportingType, setExportingType] = useState(null);
  const [showFollowupExportModal, setShowFollowupExportModal] = useState(false);

  const [profile, setProfile] = useState(
    JSON.parse(localStorage.getItem("user")) || null,
  );

  const [isProfileSaved, setIsProfileSaved] = useState(false);
  const [isProfileEditing, setIsProfileEditing] = useState(false);
  const [aiSettings, setAiSettings] = useState({
    provider: "chatgpt",
    apiKey: "",
    blockedKeywords: "",
    restrictedInstructions: "",
    guardPrompt: "",
  });
  const [isAiSaved, setIsAiSaved] = useState(false);
  const [isAiEditing, setIsAiEditing] = useState(false);

  // AI Model management state
  const [showAddModelModal, setShowAddModelModal] = useState(false);
  const [newModel, setNewModel] = useState({
    name: "",
    provider: "openai",
    modelId: "",
    apiKey: "",
  });
  const [editingModelId, setEditingModelId] = useState(null);
  const [editModelData, setEditModelData] = useState({});

  const [admins, setAdmins] = useState([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);

  // Fetch admin users when team tab is active
  useEffect(() => {
    if (activeTab === "team") {
      fetchAdminUsers();
    }
  }, [activeTab]);

  const fetchAdminUsers = async () => {
    setLoadingAdmins(true);
    try {
      const loggedInUser = JSON.parse(localStorage.getItem("user"));
      const excludeUuid = loggedInUser?.uuid || loggedInUser?.admin_id;

      const response = await fetch(
        `${BASE_URL}/api/admin-users${excludeUuid ? `?excludeUuid=${excludeUuid}` : ""}`,
        {
          headers: getAuthHeaders(),
        },
      );

      if (response.ok) {
        const data = await response.json();
        setAdmins(data.users || []);
      } else {
        console.error("Failed to fetch admin users");
      }
    } catch (error) {
      console.error("Error fetching admin users:", error);
    } finally {
      setLoadingAdmins(false);
    }
  };

  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    name: "",
    email: "",
    password: "",
    role: "Admin",
    status: "Active",
    privileges: 3,
  });
  const [editingAdminId, setEditingAdminId] = useState(null);
  const [editAdminData, setEditAdminData] = useState({
    name: "",
    email: "",
    role: "Admin",
    status: "Active",
    privileges: 3,
  });

  const [activeDropdown, setActiveDropdown] = useState(null);


  const CustomDropdown = ({
    label,
    value,
    options,
    field,
    icon: Icon,
    onChange,
  }) => {
    const buttonRef = useRef(null);
    const [dropdownStyles, setDropdownStyles] = useState({});

    const updateDropdownPosition = () => {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setDropdownStyles({
          position: "fixed",
          top: `${rect.bottom + 8}px`,
          left: `${rect.left}px`,
          width: `${rect.width}px`,
          zIndex: 9999,
        });
      }
    };

    useEffect(() => {
      if (activeDropdown === field) {
        updateDropdownPosition();
        window.addEventListener("scroll", updateDropdownPosition, true);
        window.addEventListener("resize", updateDropdownPosition);
      }
      return () => {
        window.removeEventListener("scroll", updateDropdownPosition, true);
        window.removeEventListener("resize", updateDropdownPosition);
      };
    }, [activeDropdown, field]);

    return (
      <div className="space-y-2 relative">
        <label className="text-[12px] font-bold text-slate-400 tracking-widest ml-1 uppercase opacity-60">
          {label}
        </label>
        <button
          ref={buttonRef}
          type="button"
          onClick={() =>
            setActiveDropdown(activeDropdown === field ? null : field)
          }
          className="w-full h-[40px] sm:h-[46px] flex items-center justify-between px-3 sm:px-4 bg-white border border-slate-200 rounded-xl hover:border-secondary transition-all text-[11px] sm:text-sm font-bold text-[#18254D] shadow-sm"
        >
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {Icon && <Icon size={14} className="text-secondary shrink-0" />}
            <span className="truncate">
              {options.find(
                (opt) => (typeof opt === "string" ? opt : opt.value) === value,
              )?.label ||
                (typeof options[0] === "string"
                  ? value
                  : options.find((opt) => opt.value === value)?.label || value)}
            </span>
          </div>
          <ChevronDown
            size={14}
            className={`text-slate-400 shrink-0 transition-transform ${activeDropdown === field ? "rotate-180" : ""}`}
          />
        </button>

        {activeDropdown === field &&
          createPortal(
            <>
              <div
                className="fixed inset-0 z-[9998] pointer-events-auto"
                onClick={() => setActiveDropdown(null)}
              />
              <div
                style={dropdownStyles}
                className="bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden animate-fade-in origin-top py-1.5 sm:py-2 z-[9999] max-h-[300px] overflow-y-auto"
              >
                <div className="bg-[#18254D] px-3 sm:px-4 py-1.5 sm:py-2 border-b border-white/10 -mt-2 mb-1 sticky top-0 z-10">
                  <p className="text-[10px] sm:text-[12px] font-bold text-white/50 tracking-widest uppercase truncate">
                    Select {label}
                  </p>
                </div>
                {options.map((opt) => {
                  const optValue = typeof opt === "string" ? opt : opt.value;
                  const optLabel = typeof opt === "string" ? opt : opt.label;
                  return (
                    <button
                      key={optValue}
                      type="button"
                      onClick={() => {
                        onChange(optValue);
                        setActiveDropdown(null);
                      }}
                      className={`w-full text-left px-4 sm:px-5 py-2 sm:py-3 text-[10px] sm:text-[12px] font-bold tracking-widest transition-colors flex items-center justify-between gap-2 ${
                        optValue === value
                          ? "bg-slate-50 text-secondary"
                          : "text-[#18254D] hover:bg-slate-50"
                      }`}
                    >
                      <span className="truncate">{optLabel}</span>
                      {optValue === value && (
                        <Check size={12} className="text-secondary shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </>,
            document.body,
          )}
      </div>
    );
  };

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [isPasswordSaved, setIsPasswordSaved] = useState(false);

  const [showToast, setShowToast] = useState(false);
  const [showAdminToast, setShowAdminToast] = useState(false);
  const [adminToastMessage, setAdminToastMessage] = useState("");
  const [selectedImageFile, setSelectedImageFile] = useState(null);

  // Removed generic toast state as react-hot-toast handles it globally

  const showToastMessage = (message, type = "success") => {
    if (type === "success") {
      hotToast.success(message);
    } else {
      hotToast.error(message);
    }
  };

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: "",
    message: "",
    onConfirm: null,
  });

  const showConfirmModal = (title, message, onConfirm) => {
    setConfirmModal({
      show: true,
      title,
      message,
      onConfirm,
    });
  };

  // Lock scroll when any modal is open
  useScrollLock(showFollowupExportModal || showAddModelModal || !!editingModelId || showAddAdminModal || !!editingAdminId || showPasswordForm || confirmModal.show);

  const hideConfirmModal = () => {
    setConfirmModal({
      show: false,
      title: "",
      message: "",
      onConfirm: null,
    });
  };

  const handleProfileSave = async () => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("full_name", profile.full_name || "");
      formData.append("role", profile.role || "");
      formData.append("email", profile.email || "");
      formData.append("privileges", profile.privileges || 3);
      formData.append(
        "status",
        profile.status !== undefined ? profile.status : 1,
      );

      if (selectedImageFile) {
        formData.append("image", selectedImageFile);
      }

      const userId = profile.uuid || profile.admin_id;
      const response = await fetch(
        `${BASE_URL}/api/admin-users/update/${userId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: formData,
        },
      );

      const contentType = response.headers.get("content-type");
      let data;

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error("Server returned non-JSON response:", text);
        showToastMessage(
          `Server error: ${response.status}. Check console for details.`,
          "error",
        );
        return;
      }

      if (response.ok) {
        // Update profile with returned image URL if available
        const updatedProfile = {
          ...profile,
          image: data.image || profile.image,
        };
        setProfile(updatedProfile);
        // Update localStorage with new profile data
        localStorage.setItem("user", JSON.stringify(updatedProfile));
        setSelectedImageFile(null);
        setIsProfileEditing(false);
        showToastMessage("Profile updated successfully", "success");
      } else {
        showToastMessage(data.message || "Failed to update profile", "error");
      }
    } catch (error) {
      console.error("Profile save error:", error);
      showToastMessage(
        "Server error while updating profile. Check console for details.",
        "error",
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleAiSettingsSave = () => {
    setIsAiSaved(true);
    setIsAiEditing(false);
    setTimeout(() => setIsAiSaved(false), 3000);
  };

  const [addAdminErrors, setAddAdminErrors] = useState({});

  const validateAddAdmin = () => {
    const errors = {};
    
    if (!newAdmin.name.trim()) {
      errors.name = "Full name is required";
    } else if (newAdmin.name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters";
    }
    
    if (!newAdmin.email.trim()) {
      errors.email = "Email is required";   
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newAdmin.email)) {
      errors.email = "Please enter a valid email address";
    }
    
    if (!newAdmin.password) {
      errors.password = "Password is required";
    } else if (newAdmin.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }
    
    setAddAdminErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddAdmin = async () => {
    if (!validateAddAdmin()) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`${BASE_URL}/api/admin-users`, {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          full_name: newAdmin.name,
          email: newAdmin.email,
          password: newAdmin.password,
          role: newAdmin.role,
          privileges: newAdmin.privileges,
        }),
      });

      const contentType = response.headers.get("content-type");
      let data;

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error("Server returned non-JSON response:", text);
        showToastMessage(
          `Server error: ${response.status}. Check console for details.`,
          "error",
        );
        return;
      }

      if (response.ok) {
        // Add the new admin to local state with returned UUID
        const admin = {
          id: data.uuid,
          name: newAdmin.name,
          email: newAdmin.email,
          role: newAdmin.role,
          status: newAdmin.status,
          privileges: newAdmin.privileges,
          joinDate: new Date().toISOString().split("T")[0],
        };
        setAdmins([...admins, admin]);
        setNewAdmin({
          name: "",
          email: "",
          password: "",
          role: "Admin",
          status: "Active",
          privileges: 3,
        });
        setShowAddAdminModal(false);
        showToastMessage(
          "Admin created successfully!",
          "success",
        );
        // Refresh the admin list
        fetchAdminUsers();
      } else {
        showToastMessage(data.message || "Failed to create admin", "error");
      }
    } catch (error) {
      console.error("Add admin error:", error);
      showToastMessage(
        "Server error while creating admin. Check console for details.",
        "error",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAdmin = (id) => {
    showConfirmModal(
      "Delete User",
      "Are you sure you want to delete this user? This action cannot be undone.",
      async () => {
        hideConfirmModal();
        try {
          const response = await fetch(`${BASE_URL}/api/admin-users/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders(),
          });

          const contentType = response.headers.get("content-type");
          let data;

          if (contentType && contentType.includes("application/json")) {
            data = await response.json();
          } else {
            const text = await response.text();
            console.error("Server returned non-JSON response:", text);
            showToastMessage(
              `Server error: ${response.status}. Check console for details.`,
              "error",
            );
            return;
          }

          if (response.ok) {
            // Remove user from local state
            setAdmins(admins.filter((admin) => admin.id !== id));
            showToastMessage("User deleted successfully", "success");
          } else {
            showToastMessage(data.message || "Failed to delete user", "error");
          }
        } catch (error) {
          console.error("Delete user error:", error);
          showToastMessage(
            "Server error while deleting user. Check console for details.",
            "error",
          );
        }
      },
    );
  };

  const handleStartEditAdmin = (admin) => {
    setEditingAdminId(admin.id);
    setEditAdminData({
      name: admin.name,
      email: admin.email,
      role: admin.role,
      status: admin.status,
      privileges: parseInt(admin.privileges) || 3,
    });
  };

  const handleCancelEditAdmin = () => {
    setEditingAdminId(null);
    setEditAdminData({
      name: "",
      email: "",
      role: "Admin",
      status: "Active",
      privileges: 3,
    });
  };

  const handleSaveEditAdmin = async (id) => {
    if (!editAdminData.name || !editAdminData.email) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`${BASE_URL}/api/admin-users/update/${id}`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          full_name: editAdminData.name,
          email: editAdminData.email,
          role: editAdminData.role,
          status: editAdminData.status === "Active" ? 1 : 0,
          privileges: editAdminData.privileges,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // update UI
        setAdmins(
          admins.map((admin) =>
            admin.id === id
              ? {
                  ...admin,
                  name: editAdminData.name,
                  email: editAdminData.email,
                  role: editAdminData.role,
                  status: editAdminData.status,
                  privileges: editAdminData.privileges,
                }
              : admin,
          ),
        );
        showToastMessage("Admin updated successfully", "success");
        handleCancelEditAdmin();
      } else {
        showToastMessage(data.message || "Failed to update admin", "error");
      }
    } catch (error) {
      console.error(error);
      showToastMessage("Server error while updating admin", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const validatePassword = (password) => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(
      password,
    );

    const errors = [];
    if (!minLength) errors.push("at least 8 characters");
    if (!hasUpperCase) errors.push("one uppercase letter");
    if (!hasNumber) errors.push("one number");
    if (!hasSpecialChar) errors.push("one special character");

    return {
      isValid: minLength && hasUpperCase && hasNumber && hasSpecialChar,
      errors,
    };
  };

  const handleUpdatePassword = async () => {
    if (
      passwordData.currentPassword &&
      passwordData.newPassword &&
      passwordData.confirmPassword
    ) {
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        showToastMessage("New passwords do not match", "error");
        return;
      }

      const validation = validatePassword(passwordData.newPassword);
      if (!validation.isValid) {
        showToastMessage(
          `Password must contain ${validation.errors.join(", ")}`,
          "error",
        );
        return;
      }

      setIsSubmitting(true);
      try {
        const userId = profile?.uuid || profile?.admin_id;
        const response = await fetch(
          `${BASE_URL}/api/admin-users/update-password/${userId}`,
          {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({
              currentPassword: passwordData.currentPassword,
              newPassword: passwordData.newPassword,
            }),
          },
        );

        const contentType = response.headers.get("content-type");
        let data;

        if (contentType && contentType.includes("application/json")) {
          data = await response.json();
        } else {
          const text = await response.text();
          console.error("Server returned non-JSON response:", text);
          showToastMessage(
            `Server error: ${response.status}. Check console for details.`,
            "error",
          );
          return;
        }

        if (response.ok) {
          showToastMessage("Password updated successfully", "success");
          setShowPasswordForm(false);
          setPasswordData({
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
          });
        } else {
          showToastMessage(
            data.message || "Failed to update password",
            "error",
          );
        }
      } catch (error) {
        console.error("Update password error:", error);
        showToastMessage(
          "Server error while updating password. Check console for details.",
          "error",
        );
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Export functions
  // Export functions
  const handleExport = async (exportType, filename) => {
    setExportingType(exportType);
    try {
      const response = await fetch(`${BASE_URL}/api/export/${exportType}`, {
        headers: getAuthHeaders(),
      });

      if (response.status === 404) {
        hotToast.error("Empty records");
        return;
      }

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        // Use window.location.href for a more direct download invocation
        window.location.href = url;

        // Significantly longer delay for cleanup to ensure download starts
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
        }, 1000);

        const typeLabels = {
          enquiries: "Enquiries",
          leads: "Leads",
          followups: "Follow-ups",
          clients: "Clients",
          projects: "Projects",
          "all-crm-data": "All CRM Data",
        };

        const label = typeLabels[exportType.split("?")[0]] || "File";
        const successMessage = `${label} Downloaded Successfully!`;

        hotToast.success(successMessage);
      } else {
        const errorData = await response.json().catch(() => ({}));
        hotToast.error(errorData.message || `Failed to export ${exportType}`);
      }
    } catch (error) {
      console.error(`Export error for ${exportType}:`, error);
      hotToast.error(`Error downloading ${filename}`);
    } finally {
      setExportingType(null);
    }
  };

  return (
    <div className="w-full relative">
      <div className="space-y-5 animate-fade-in w-full">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="max-w-2xl">
            <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-primary tracking-tight mb-2">
              Settings
            </h2>
            <p className="text-sm text-textMuted font-medium leading-relaxed">
              Manage your profile, AI, security, and team settings.
            </p>
          </div>
        </div>

        {/* Top Navigation Tabs */}
        <div className="flex justify-center my-4 w-full px-1 sm:px-0">
          <div className="relative flex flex-nowrap bg-slate-100/50 p-0.5 rounded-[14px] border border-slate-200 shadow-sm leading-none w-full sm:w-auto items-center gap-0 overflow-hidden">
            {/* Moving Indicator */}
            <div
              className="absolute top-[2px] bottom-[2px] left-[2px] bg-white rounded-[11px] shadow-sm transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] border border-white/20 z-0"
              style={{
                width: "calc(20% - 2px)",
                transform: `translateX(${["profile", "security", "ai", "team", "export"].indexOf(activeTab) * 100}%)`,
              }}
            />

            {[
              ["profile", "My Profile"],
              ["security", "Security"],
              ["ai", "AI Settings"],
              ["team", "Admins"],
              ["export", "Data Export"],
            ].map((tab) => (
              <button
                key={tab[0]}
                onClick={() => setActiveTab(tab[0])}
                className={`relative z-10 flex-1 sm:flex-none px-2 sm:px-6 py-2.5 sm:py-2 rounded-xl text-[10px] sm:text-[12px] font-bold tracking-wider transition-all duration-300 flex items-center justify-center min-w-[75px] sm:min-w-[120px] h-[30px] sm:h-[36px] whitespace-nowrap active:scale-95 ${
                  activeTab === tab[0]
                    ? "text-blue-600 scale-[1.02]"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {tab[1]}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="w-full">
          <div className="bg-white rounded-[20px] p-6 md:p-8 lg:p-10 border border-slate-200/60 shadow-sm w-full">
            {/* PROFILE TAB */}
            {activeTab === "profile" && (
              <div className="space-y-8 animate-fade-in w-full">
                {/* Profile Header */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 pb-10 border-b border-slate-100">
                  <div className="relative group shrink-0">
                    <label
                      htmlFor="profile-photo-upload"
                      className={`block relative ${isProfileEditing ? "cursor-pointer" : "cursor-default"}`}
                    >
                      <div className="absolute inset-0 bg-blue-500/10 rounded-[32px] blur-3xl opacity-50 group-hover:opacity-80 transition-opacity" />
                      {profile.image ? (
                        <img
                          key={profile.image}
                          src={profile.image}
                          alt="Profile"
                          className="w-32 h-32 rounded-[32px] border-4 border-white object-cover shadow-2xl relative z-10 group-hover:scale-[1.02] transition-transform duration-500"
                          onError={(e) => {
                            e.target.style.display = "none";
                            e.target.nextSibling.style.display = "flex";
                          }}
                        />
                      ) : null}
                      <div
                        className={`w-32 h-32 rounded-[32px] bg-gradient-to-br from-[#18254D] to-[#2a3f7a] flex items-center justify-center border-4 border-white shadow-2xl relative z-10 ${profile.image ? "hidden" : "flex"}`}
                      >
                        <span className="text-4xl font-black text-white">
                          {profile.full_name?.charAt(0).toUpperCase() || "U"}
                        </span>
                      </div>
                      {isProfileEditing && (
                        <div className="absolute inset-0 bg-[#18254D]/40 backdrop-blur-[2px] rounded-[32px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-20">
                          <Camera
                            className="text-white"
                            size={32}
                            strokeWidth={2.5}
                          />
                        </div>
                      )}
                    </label>
                    <input
                      type="file"
                      id="profile-photo-upload"
                      accept="image/*"
                      className="hidden"
                      disabled={!isProfileEditing}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setSelectedImageFile(file);
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setProfile((prev) => ({
                              ...prev,
                              image: reader.result,
                            }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </div>
                  <div className="text-center sm:text-left pt-4 flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-3xl font-black text-[#18254D] mb-2 tracking-tight">
                          {profile.full_name}
                        </h3>
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-700 border border-blue-100/50 rounded-full text-[12px] font-black tracking-widest uppercase">
                            <Zap size={12} className="text-blue-500" />
                            {profile.role}
                          </span>
                          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100/50 rounded-full text-[12px] font-black tracking-widest uppercase">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Active Member
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setIsProfileEditing(!isProfileEditing)}
                        className={`p-3 rounded-2xl border transition-all duration-300 group ${
                          isProfileEditing
                            ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/30"
                            : "bg-white border-slate-200 text-slate-400 hover:text-[#18254D] hover:border-[#18254D]/30 hover:shadow-lg"
                        }`}
                        title={isProfileEditing ? "Editing..." : "Edit profile"}
                      >
                        <Edit2 size={20} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Profile Form */}
                <div className="space-y-8 pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                    <div className="space-y-2.5">
                      <label className="text-[10px] font-black text-slate-400 tracking-[0.25em] uppercase ml-1 flex items-center gap-2">
                        <User
                          size={12}
                          strokeWidth={3}
                          className="text-blue-500"
                        />
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={profile.full_name}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            full_name: e.target.value,
                          })
                        }
                        disabled={!isProfileEditing}
                        className={`w-full h-12 px-5 border rounded-2xl transition-all duration-300 text-sm font-black ${
                          isProfileEditing
                            ? "bg-white border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none text-[#18254D] shadow-sm"
                            : "bg-slate-50 border-slate-100 text-slate-500 cursor-not-allowed"
                        }`}
                      />
                    </div>
                    <div className="space-y-2.5">
                      <label className="text-[10px] font-black text-slate-400 tracking-[0.25em] uppercase ml-1 flex items-center gap-2">
                        <Building2
                          size={12}
                          strokeWidth={3}
                          className="text-blue-500"
                        />
                        Designation
                      </label>
                      <input
                        type="text"
                        value={profile.role}
                        disabled
                        className="w-full h-12 px-5 bg-slate-50 border border-slate-100 rounded-2xl text-slate-500 cursor-not-allowed text-sm font-black"
                      />
                    </div>
                    <div className="space-y-2.5 md:col-span-2">
                      <label className="text-[10px] font-black text-slate-400 tracking-[0.25em] uppercase ml-1 flex items-center gap-2">
                        <Mail
                          size={12}
                          strokeWidth={3}
                          className="text-blue-500"
                        />
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={profile.email}
                        readOnly
                        className="w-full h-12 px-5 bg-slate-50 border border-slate-100 rounded-2xl text-slate-400 cursor-not-allowed text-sm font-black"
                      />
                    </div>
                  </div>

                  {isProfileEditing && (
                    <div className="flex justify-end pt-8 border-t border-slate-100">
                      <button
                        onClick={handleProfileSave}
                        disabled={isSubmitting || isProfileSaved}
                        className="flex items-center justify-center gap-2 px-8 py-3.5 bg-[#18254D] text-white rounded-2xl hover:bg-[#1e2e5e] transition-all active:scale-95 text-sm font-black disabled:opacity-50 shadow-xl shadow-[#18254D]/20 animate-fade-in-up"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 size={18} className="animate-spin" />
                            <span>SAVING...</span>
                          </>
                        ) : isProfileSaved ? (
                          <>
                            <Check size={18} strokeWidth={3} />
                            CHANGES SAVED
                          </>
                        ) : (
                          <>
                            <Save size={18} strokeWidth={3} />
                            SAVE PROFILE
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Toast Notification */}
                {showToast && (
                  <div className="fixed top-6 right-6 z-50 animate-fade-in">
                    <div className="flex items-center gap-3 px-5 py-3 bg-primary text-white rounded-xl shadow-lg shadow-primary/30 border border-white/10">
                      <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                        <Check size={14} className="text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-bold tracking-wide">
                          Saved Successfully
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* AI SETTINGS TAB */}
            {activeTab === "ai" && (
              <div className="space-y-8 animate-fade-in w-full">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-bold text-primary mb-2 tracking-tight">
                      AI Integration Settings
                    </h3>
                    <p className="text-sm text-slate-500 font-bold">
                      Manage AI models for enquiry filtering and analysis.
                    </p>
                  </div>
                </div>

                {/* AI Models Management Section */}
                <div className="pt-6 border-t border-slate-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                      <h4 className="text-[12px] font-bold text-primary tracking-[0.2em] flex items-center gap-2">
                        <Bot size={14} className="text-violet-500" />
                        AI MODELS ({aiModels.length})
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 font-bold">
                        Add and manage AI models for enquiry filtering.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowAddModelModal(true)}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-2xl hover:bg-slate-800 transition-all active:scale-95 text-[13px] font-bold tracking-wider shadow-lg"
                    >
                      <Plus size={16} />
                      ADD AI MODEL
                    </button>
                  </div>

                  {/* Add AI Model Modal */}
                  {showAddModelModal &&
                    createPortal(
                      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <div
                          className="absolute inset-0 bg-[#18254D]/60 backdrop-blur-xl"
                          onClick={() => setShowAddModelModal(false)}
                        />
                        {/* Modal Content */}
                        <div className="relative w-full max-w-2xl max-h-[85vh] bg-white rounded-3xl shadow-2xl overflow-hidden animate-fade-in flex flex-col">
                          {/* Header */}
                          <div className="bg-gradient-to-r from-[#18254D] to-[#1e2e5e] px-6 sm:px-8 py-5 sm:py-6 flex-shrink-0">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 rounded-xl sm:rounded-2xl flex items-center justify-center">
                                  <Zap size={20} className="text-white sm:hidden" />
                                  <Zap size={24} className="text-white hidden sm:block" />
                                </div>
                                <div>
                                  <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                                    Add AI Model
                                  </h3>
                                  <p className="text-xs sm:text-sm text-white/60 font-medium hidden sm:block">
                                    Configure a new AI model for the system
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => setShowAddModelModal(false)}
                                className="w-9 h-9 sm:w-10 sm:h-10 bg-white/10 hover:bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center transition-all"
                              >
                                <X size={18} className="text-white sm:hidden" />
                                <X size={20} className="text-white hidden sm:block" />
                              </button>
                            </div>
                          </div>

                          {/* Form Content - Scrollable */}
                          <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-5 sm:space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                              <div className="space-y-2">
                                <label className="text-[10px] sm:text-[11px] font-black text-slate-400 tracking-widest uppercase ml-1">
                                  Display Name *
                                </label>
                                <input
                                  type="text"
                                  value={newModel.name}
                                  onChange={(e) =>
                                    setNewModel({ ...newModel, name: e.target.value })
                                  }
                                  placeholder="e.g., GPT-4o Mini"
                                  className="w-full h-[46px] sm:h-[50px] px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 focus:outline-none transition-all text-sm font-bold text-[#18254D] placeholder:font-medium placeholder:text-slate-400"
                                />
                              </div>
                              <CustomDropdown
                                label="Provider"
                                value={newModel.provider}
                                field="add_ai_provider"
                                icon={Bot}
                                options={[
                                  { value: "openai", label: "OpenAI (ChatGPT)" },
                                  { value: "gemini", label: "Google Gemini" },
                                  { value: "grok", label: "xAI (Grok)" },
                                  { value: "anthropic", label: "Anthropic (Claude)" },
                                  { value: "mistral", label: "Mistral AI" },
                                  { value: "deepseek", label: "DeepSeek" },
                                  { value: "llama", label: "Meta Llama (Groq)" },
                                  { value: "groq", label: "Groq (Ultra Fast)" },
                                  { value: "other", label: "Other" },
                                ]}
                                onChange={(val) =>
                                  setNewModel({ ...newModel, provider: val })
                                }
                              />
                              <div className="space-y-2">
                                <label className="text-[10px] sm:text-[11px] font-black text-slate-400 tracking-widest uppercase ml-1">
                                  Model ID (exact) *
                                </label>
                                <input
                                  type="text"
                                  value={newModel.modelId}
                                  onChange={(e) =>
                                    setNewModel({ ...newModel, modelId: e.target.value })
                                  }
                                  placeholder="e.g., gpt-4o-mini, grok-2, claude-3-haiku"
                                  className="w-full h-[46px] sm:h-[50px] px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 focus:outline-none transition-all text-sm font-bold text-[#18254D] placeholder:font-medium placeholder:text-slate-400"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] sm:text-[11px] font-black text-slate-400 tracking-widest uppercase ml-1 flex items-center gap-1.5">
                                  <Key size={12} />
                                  API Key *
                                </label>
                                <input
                                  type="password"
                                  value={newModel.apiKey}
                                  onChange={(e) =>
                                    setNewModel({ ...newModel, apiKey: e.target.value })
                                  }
                                  placeholder="Enter API key for this model"
                                  className="w-full h-[46px] sm:h-[50px] px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 focus:outline-none transition-all text-sm font-bold text-[#18254D] placeholder:font-medium placeholder:text-slate-400"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Footer Actions */}
                          <div className="px-6 sm:px-8 py-4 sm:py-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-3 flex-shrink-0">
                            <button
                              onClick={() => {
                                if (newModel.name && newModel.modelId && newModel.apiKey) {
                                  onAddAiModel(newModel);
                                  setNewModel({
                                    name: "",
                                    provider: "openai",
                                    modelId: "",
                                    apiKey: "",
                                  });
                                  setShowAddModelModal(false);
                                }
                              }}
                              disabled={!newModel.name || !newModel.modelId || !newModel.apiKey}
                              className="flex-1 flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 bg-[#1C2B5A] text-white rounded-xl hover:bg-[#1e2e5e] active:scale-95 transition-all text-[12px] sm:text-[13px] font-black tracking-widest shadow-lg shadow-[#18254D]/20 disabled:cursor-not-allowed"
                            >
                              <Check size={16} strokeWidth={3} className=   "sm:hidden" />
                              <Check size={18} strokeWidth={3} className="hidden sm:block" />
                              ADD MODEL
                            </button>

                          </div>
                        </div>
                      </div>,
                      document.body
                    )}

                  {/* Edit AI Model Modal */}
                  {editingModelId &&
                    createPortal(
                      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <div
                          className="absolute inset-0 bg-[#18254D]/60 backdrop-blur-xl"
                          onClick={() => setEditingModelId(null)}
                        />
                        {/* Modal Content */}
                        <div className="relative w-full max-w-2xl max-h-[85vh] bg-white rounded-3xl shadow-2xl overflow-hidden animate-fade-in flex flex-col">
                          {/* Header */}
                          <div className="bg-gradient-to-r from-[#18254D] to-[#1e2e5e] px-6 sm:px-8 py-5 sm:py-6 flex-shrink-0">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 rounded-xl sm:rounded-2xl flex items-center justify-center">
                                  <Edit2 size={20} className="text-white sm:hidden" />
                                  <Edit2 size={24} className="text-white hidden sm:block" />
                                </div>
                                <div>
                                  <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                                    Edit AI Model
                                  </h3>
                                  <p className="text-xs sm:text-sm text-white/60 font-medium hidden sm:block">
                                    Update AI model configuration
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => setEditingModelId(null)}
                                className="w-9 h-9 sm:w-10 sm:h-10 bg-white/10 hover:bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center transition-all"
                              >
                                <X size={18} className="text-white sm:hidden" />
                                <X size={20} className="text-white hidden sm:block" />
                              </button>
                            </div>
                          </div>

                          {/* Form Content - Scrollable */}
                          <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-5 sm:space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                              <div className="space-y-2">
                                <label className="text-[10px] sm:text-[11px] font-black text-slate-400 tracking-widest uppercase ml-1">
                                  Display Name *
                                </label>
                                <input
                                  type="text"
                                  value={editModelData.name || ""}
                                  onChange={(e) =>
                                    setEditModelData({ ...editModelData, name: e.target.value })
                                  }
                                  placeholder="e.g., GPT-4o Mini"
                                  className="w-full h-[46px] sm:h-[50px] px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 focus:outline-none transition-all text-sm font-bold text-[#18254D] placeholder:font-medium placeholder:text-slate-400"
                                />
                              </div>
                              <CustomDropdown
                                label="Provider"
                                value={editModelData.provider}
                                field="edit_ai_provider"
                                icon={Bot}
                                options={[
                                  { value: "openai", label: "OpenAI (ChatGPT)" },
                                  { value: "gemini", label: "Google Gemini" },
                                  { value: "grok", label: "xAI (Grok)" },
                                  { value: "anthropic", label: "Anthropic (Claude)" },
                                  { value: "mistral", label: "Mistral AI" },
                                  { value: "deepseek", label: "DeepSeek" },
                                  { value: "llama", label: "Meta Llama (Groq)" },
                                  { value: "groq", label: "Groq (Ultra Fast)" },
                                  { value: "other", label: "Other" },
                                ]}
                                onChange={(val) =>
                                  setEditModelData({ ...editModelData, provider: val })
                                }
                              />
                              <div className="space-y-2">
                                <label className="text-[10px] sm:text-[11px] font-black text-slate-400 tracking-widest uppercase ml-1">
                                  Model ID (exact) *
                                </label>
                                <input
                                  type="text"
                                  value={editModelData.modelId || ""}
                                  onChange={(e) =>
                                    setEditModelData({ ...editModelData, modelId: e.target.value })
                                  }
                                  placeholder="e.g., gpt-4o-mini, grok-2, claude-3-haiku"
                                  className="w-full h-[46px] sm:h-[50px] px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 focus:outline-none transition-all text-sm font-bold text-[#18254D] placeholder:font-medium placeholder:text-slate-400"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] sm:text-[11px] font-black text-slate-400 tracking-widest uppercase ml-1 flex items-center gap-1.5">
                                  <Key size={12} />
                                  API Key *
                                </label>
                                <input
                                  type="password"
                                  value={editModelData.apiKey || ""}
                                  onChange={(e) =>
                                    setEditModelData({ ...editModelData, apiKey: e.target.value })
                                  }
                                  placeholder="Enter API key for this model"
                                  className="w-full h-[46px] sm:h-[50px] px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 focus:outline-none transition-all text-sm font-bold text-[#18254D] placeholder:font-medium placeholder:text-slate-400"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Footer Actions */}
                          <div className="px-6 sm:px-8 py-4 sm:py-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-3 flex-shrink-0">
                            <button
                              onClick={() => {
                                onUpdateAiModel(editModelData);
                                setEditingModelId(null);
                              }}
                              disabled={!editModelData.name || !editModelData.modelId || !editModelData.apiKey}
                              className="flex-1 flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 bg-[#18254D] text-white rounded-xl hover:bg-[#1e2e5e] active:scale-95 transition-all text-[12px] sm:text-[13px] font-black tracking-widest shadow-lg shadow-[#18254D]/20 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                              <Check size={16} strokeWidth={3} className="sm:hidden" />
                              <Check size={18} strokeWidth={3} className="hidden sm:block" />
                              SAVE CHANGES
                            </button>
                            
                          </div>
                        </div>
                      </div>,
                      document.body
                    )}

                  {/* Models List */}
                  <div className="space-y-3">
                    {aiModels.length === 0 && (
                      <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <Bot
                          size={48}
                          className="mx-auto text-slate-300 mb-4"
                        />
                        <p className="text-slate-500 font-bold text-sm">
                          No AI models configured
                        </p>
                        <p className="text-slate-400 text-xs mt-1">
                          Add a new AI model to get started
                        </p>
                      </div>
                    )}
                    {aiModels.map((model) => {
                      const providerLabels = {
                        openai: {
                          label: "OpenAI",
                          color: "bg-emerald-100 text-emerald-700",
                          logo: openaiLogo,
                        },
                        gemini: {
                          label: "Google Gemini",
                          color: "bg-blue-100 text-blue-700",
                          logo: geminiLogo,
                        },
                        grok: {
                          label: "xAI Grok",
                          color: "bg-orange-100 text-orange-700",
                          logo: grokLogo,
                        },
                        anthropic: {
                          label: "Anthropic",
                          color: "bg-amber-100 text-amber-700",
                          logo: anthropicLogo,
                        },
                        mistral: {
                          label: "Mistral",
                          color: "bg-cyan-100 text-cyan-700",
                          logo: mistralLogo,
                        },
                        deepseek: {
                          label: "DeepSeek",
                          color: "bg-indigo-100 text-indigo-700",
                          logo: deepseekLogo,
                        },
                        llama: {
                          label: "Llama 3 (Groq)",
                          color: "bg-orange-100/20 text-orange-800",
                          logo: llamaLogo,
                        },
                        groq: {
                          label: "Groq (Ultra Fast)",
                          color: "bg-orange-500/10 text-orange-600",
                          logo: groqLogo,
                        },
                        other: {
                          label: "Other",
                          color: "bg-slate-100 text-slate-700",
                          logo: null,
                        },
                      };
                      const prov =
                        providerLabels[model.provider] || providerLabels.other;

                      return (
                        <div
                          key={model.aimodel_id}
                          className="p-4 bg-white border border-slate-200 rounded-xl hover:border-violet-200 hover:shadow-md transition-all"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">
                                  {prov.logo ? (
                                    <img
                                      src={prov.logo}
                                      alt={prov.label}
                                      className="w-8 h-8 object-contain opacity-80"
                                    />
                                  ) : (
                                    <Bot
                                      size={20}
                                      className="text-violet-600 opacity-60"
                                    />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h5 className="font-bold text-slate-900 truncate">
                                      {model.name}
                                    </h5>
                                    {!!model.isDefault && (
                                      <span className="text-[10px] px-2 py-0.5 bg-primary text-white rounded-full font-bold tracking-widest uppercase">
                                        Default
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-slate-400 font-mono font-bold truncate mt-0.5">
                                    {model.modelId}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center justify-end gap-1.5 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 w-full sm:w-auto">
                                <button
                                  onClick={() => {
                                    setEditingModelId(model.aimodel_id);
                                    setEditModelData({ ...model });
                                  }}
                                  className="flex-1 sm:flex-none p-2.5 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-primary flex items-center justify-center gap-2 text-[12px] font-bold group"
                                  title="Edit model"
                                >
                                  <Edit2
                                    size={16}
                                    className="group-hover:scale-110 transition-transform"
                                  />
                                  <span>Edit</span>
                                </button>
                                {!model.isDefault && (
                                  <button
                                    onClick={() => onDeleteAiModel(model.aimodel_id)}
                                    className="flex-1 sm:flex-none p-2.5 hover:bg-red-50 rounded-xl transition-all text-slate-400 hover:text-red-500 flex items-center justify-center gap-2 text-[12px] font-bold group"
                                    title="Delete model"
                                  >
                                    <Trash2
                                      size={16}
                                      className="group-hover:scale-110 transition-transform"
                                    />
                                    <span>Delete</span>
                                  </button>
                                )}
                              </div>
                            </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100 hidden">
                  <button
                    onClick={handleAiSettingsSave}
                    disabled={!isAiEditing}
                    className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-[13px] font-bold tracking-wider transition-all ${
                      isAiEditing
                        ? "bg-primary text-white hover:bg-slate-800 active:scale-95 shadow-lg"
                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    {isAiSaved ? (
                      <>
                        <Check size={16} strokeWidth={2.5} />
                        Saved
                      </>
                    ) : (
                      <>
                        <Save size={16} strokeWidth={2.5} />
                        Save AI Settings
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
            {/* SECURITY TAB */}
            {activeTab === "security" && (
              <div className="space-y-8 animate-fade-in w-full">
                <div>
                  <h3 className="text-2xl font-bold text-primary mb-2 tracking-tight">
                    Security Settings
                  </h3>
                  <p className="text-sm text-slate-500 font-bold">
                    Manage your account security and access controls.
                  </p>
                </div>

                <div className="p-6 bg-slate-50 border border-slate-200/60 rounded-[20px]">
                  <h4 className="font-bold text-slate-900 flex items-center gap-2 mb-4 tracking-tight">
                    Change Password
                  </h4>
                  <button
                    onClick={() => setShowPasswordForm(true)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-2xl hover:bg-slate-800 transition-all active:scale-95 text-[13px] font-bold tracking-wider shadow-lg"
                  >
                    <Lock size={14} strokeWidth={2.5} />
                    Update Password
                  </button>

                  {/* Password Update Modal */}
                  {showPasswordForm &&
                    createPortal(
                      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <div
                          className="absolute inset-0 bg-[#18254D]/60 backdrop-blur-xl"
                          onClick={() => setShowPasswordForm(false)}
                        />
                        {/* Modal Content */}
                        <div className="relative w-full max-w-xl max-h-[85vh] bg-white rounded-3xl shadow-2xl overflow-hidden animate-fade-in flex flex-col">
                          {/* Header */}
                          <div className="bg-gradient-to-r from-[#18254D] to-[#1e2e5e] px-6 sm:px-8 py-5 sm:py-6 flex-shrink-0">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 rounded-xl sm:rounded-2xl flex items-center justify-center">
                                  <Lock size={20} className="text-white sm:hidden" />
                                  <Lock size={24} className="text-white hidden sm:block" />
                                </div>
                                <div>
                                  <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                                    Update Password
                                  </h3>
                                  <p className="text-xs sm:text-sm text-white/60 font-medium hidden sm:block">
                                    Change your account password
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => setShowPasswordForm(false)}
                                className="w-9 h-9 sm:w-10 sm:h-10 bg-white/10 hover:bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center transition-all"
                              >
                                <X size={18} className="text-white sm:hidden" />
                                <X size={20} className="text-white hidden sm:block" />
                              </button>
                            </div>
                          </div>

                          {/* Form Content */}
                          <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-5">
                            <div className="space-y-2">
                              <label className="text-[10px] sm:text-[11px] font-black text-slate-400 tracking-widest uppercase ml-1">
                                Current Password
                              </label>
                              <div className="relative">
                                <input
                                  type={showPasswords.current ? "text" : "password"}
                                  value={passwordData.currentPassword}
                                  onChange={(e) =>
                                    setPasswordData({
                                      ...passwordData,
                                      currentPassword: e.target.value,
                                    })
                                  }
                                  placeholder="Enter current password"
                                  className="w-full h-[46px] sm:h-[50px] px-4 pr-12 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#18254D]/20 focus:border-[#18254D] focus:outline-none transition-all text-sm font-bold text-[#18254D] placeholder:font-medium placeholder:text-slate-400"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-[#18254D] transition-colors"
                                >
                                  {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] sm:text-[11px] font-black text-slate-400 tracking-widest uppercase ml-1">
                                New Password
                              </label>
                              <div className="relative">
                                <input
                                  type={showPasswords.new ? "text" : "password"}
                                  value={passwordData.newPassword}
                                  onChange={(e) =>
                                    setPasswordData({
                                      ...passwordData,
                                      newPassword: e.target.value,
                                    })
                                  }
                                  placeholder="Enter new password"
                                  className="w-full h-[46px] sm:h-[50px] px-4 pr-12 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#18254D]/20 focus:border-[#18254D] focus:outline-none transition-all text-sm font-bold text-[#18254D] placeholder:font-medium placeholder:text-slate-400"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-[#18254D] transition-colors"
                                >
                                  {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] sm:text-[11px] font-black text-slate-400 tracking-widest uppercase ml-1">
                                Confirm New Password
                              </label>
                              <div className="relative">
                                <input
                                  type={showPasswords.confirm ? "text" : "password"}
                                  value={passwordData.confirmPassword}
                                  onChange={(e) =>
                                    setPasswordData({
                                      ...passwordData,
                                      confirmPassword: e.target.value,
                                    })
                                  }
                                  placeholder="Confirm new password"
                                  className="w-full h-[46px] sm:h-[50px] px-4 pr-12 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#18254D]/20 focus:border-[#18254D] focus:outline-none transition-all text-sm font-bold text-[#18254D] placeholder:font-medium placeholder:text-slate-400"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-[#18254D] transition-colors"
                                >
                                  {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Footer Actions */}
                          <div className="px-6 sm:px-8 py-4 sm:py-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-3 flex-shrink-0">
                            <button
                              onClick={handleUpdatePassword}
                              disabled={isSubmitting}
                              className="flex-1 flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 bg-[#18254D] text-white rounded-xl hover:bg-[#1e2e5e] active:scale-95 transition-all text-[12px] sm:text-[13px] font-black tracking-widest shadow-lg shadow-[#18254D]/20 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                              {isSubmitting ? (
                                <>
                                  <Loader2 size={16} className="animate-spin sm:hidden" />
                                  <Loader2 size={18} className="animate-spin hidden sm:block" />
                                  <span>Updating...</span>
                                </>
                              ) : (
                                <>
                                  <Save size={16} strokeWidth={3} className="sm:hidden" />
                                  <Save size={18} strokeWidth={3} className="hidden sm:block" />
                                  UPDATE PASSWORD
                                </>
                              )}
                            </button>
                            
                          </div>
                        </div>
                      </div>,
                      document.body
                    )}
                </div>
              </div>
            )}

            {/* TEAM & ADMINS TAB */}
            {activeTab === "team" && (
              <div className="space-y-8 animate-fade-in w-full">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="text-3xl font-black text-[#18254D] mb-2 tracking-tight">
                      Manage Admins
                    </h3>
                    <p className="text-sm font-black text-slate-500">
                      View and manage your network of administrators.
                    </p>
                  </div>
                  {/* Add Admin Button */}
                  {profile?.role !== "Admin" && (
                    <button
                      onClick={() => setShowAddAdminModal(true)}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-[#18254D] text-white rounded-2xl hover:bg-[#1e2e5e] transition-all active:scale-95 text-[13px] font-black tracking-widest shadow-xl shadow-[#18254D]/20 group"
                    >
                      <Plus
                        size={18}
                        strokeWidth={3}
                        className="group-hover:rotate-90 transition-transform"
                      />
                      <span>ADD ADMIN</span>
                    </button>
                  )}
                </div>

                {/* Add Admin Modal */}
                {showAddAdminModal &&
                  createPortal(
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                      {/* Backdrop */}
                      <div
                        className="absolute inset-0 bg-[#18254D]/60 backdrop-blur-xl"
                        onClick={() => setShowAddAdminModal(false)}
                      />
                      {/* Modal Content */}
                      <div className="relative w-full max-w-2xl max-h-[85vh] bg-white rounded-3xl shadow-2xl overflow-hidden animate-fade-in flex flex-col">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-[#18254D] to-[#1e2e5e] px-6 sm:px-8 py-5 sm:py-6 flex-shrink-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 rounded-xl sm:rounded-2xl flex items-center justify-center">
                                <UserPlus size={20} className="text-white sm:hidden" />
                                <UserPlus size={24} className="text-white hidden sm:block" />
                              </div>
                              <div>
                                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                                  Add New Admin
                                </h3>
                                <p className="text-xs sm:text-sm text-white/60 font-medium hidden sm:block">
                                  Create a new admin account with specific privileges
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => setShowAddAdminModal(false)}
                              className="w-9 h-9 sm:w-10 sm:h-10 bg-white/10 hover:bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center transition-all"
                            >
                              <X size={18} className="text-white sm:hidden" />
                              <X size={20} className="text-white hidden sm:block" />
                            </button>
                          </div>
                        </div>

                        {/* Form Content - Scrollable */}
                        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-5 sm:space-y-6">
                          {/* Name & Email Row */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                            <div className="space-y-2">
                              <label className="text-[10px] sm:text-[11px] font-black text-slate-400 tracking-widest uppercase ml-1">
                                Full Name *
                              </label>
                              <input
                                type="text"
                                value={newAdmin.name}
                                onChange={(e) => {
                                  setNewAdmin({ ...newAdmin, name: e.target.value });
                                  if (addAdminErrors.name) {
                                    setAddAdminErrors({ ...addAdminErrors, name: null });
                                  }
                                }}
                                placeholder="Enter full name"
                                className={`w-full h-[46px] sm:h-[50px] px-4 bg-slate-50 border rounded-xl focus:ring-2 focus:outline-none transition-all text-sm font-bold text-[#18254D] placeholder:font-medium placeholder:text-slate-400 ${
                                  addAdminErrors.name 
                                    ? "border-red-300 focus:border-red-400 focus:ring-red-200" 
                                    : "border-slate-200 focus:border-[#18254D] focus:ring-[#18254D]/20"
                                }`}
                              />
                              {addAdminErrors.name && (
                                <p className="text-[10px] text-red-500 font-medium ml-1">{addAdminErrors.name}</p>
                              )}
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] sm:text-[11px] font-black text-slate-400 tracking-widest uppercase ml-1">
                                Email Address *
                              </label>
                              <input
                                type="email"
                                value={newAdmin.email}
                                onChange={(e) => {
                                  setNewAdmin({ ...newAdmin, email: e.target.value });
                                  if (addAdminErrors.email) {
                                    setAddAdminErrors({ ...addAdminErrors, email: null });
                                  }
                                }}
                                placeholder="Enter email address"
                                className={`w-full h-[46px] sm:h-[50px] px-4 bg-slate-50 border rounded-xl focus:ring-2 focus:outline-none transition-all text-sm font-bold text-[#18254D] placeholder:font-medium placeholder:text-slate-400 ${
                                  addAdminErrors.email 
                                    ? "border-red-300 focus:border-red-400 focus:ring-red-200" 
                                    : "border-slate-200 focus:border-[#18254D] focus:ring-[#18254D]/20"
                                }`}
                              />
                              {addAdminErrors.email && (
                                <p className="text-[10px] text-red-500 font-medium ml-1">{addAdminErrors.email}</p>
                              )}
                            </div>
                          </div>

                          {/* Password Field */}
                          <div className="space-y-2">
                            <label className="text-[10px] sm:text-[11px] font-black text-slate-400 tracking-widest uppercase ml-1">
                              Password *
                            </label>
                            <input
                              type="password"
                              value={newAdmin.password}
                              onChange={(e) => {
                                setNewAdmin({ ...newAdmin, password: e.target.value });
                                if (addAdminErrors.password) {
                                  setAddAdminErrors({ ...addAdminErrors, password: null });
                                }
                              }}
                              placeholder="Set a secure password"
                              className={`w-full h-[46px] sm:h-[50px] px-4 bg-slate-50 border rounded-xl focus:ring-2 focus:outline-none transition-all text-sm font-bold text-[#18254D] placeholder:font-medium placeholder:text-slate-400 ${
                                addAdminErrors.password 
                                  ? "border-red-300 focus:border-red-400 focus:ring-red-200" 
                                  : "border-slate-200 focus:border-[#18254D] focus:ring-[#18254D]/20"
                              }`}
                            />
                            {addAdminErrors.password ? (
                              <p className="text-[10px] text-red-500 font-medium ml-1">{addAdminErrors.password}</p>
                            ) : (
                              <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium ml-1">
                                Minimum 8 characters required
                              </p>
                            )}
                          </div>

                          {/* Role, Status, Privileges Row */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
                            <CustomDropdown
                              label="Role"
                              value={newAdmin.role}
                              field="add_admin_role"
                              icon={Briefcase}
                              options={["Admin", "Manager"]}
                              onChange={(val) =>
                                setNewAdmin({ ...newAdmin, role: val })
                              }
                            />
                            <CustomDropdown
                              label="Status"
                              value={newAdmin.status}
                              field="add_admin_status"
                              icon={Check}
                              options={["Active", "Inactive"]}
                              onChange={(val) =>
                                setNewAdmin({ ...newAdmin, status: val })
                              }
                            />
                            <CustomDropdown
                              label="Privileges"
                              value={newAdmin.privileges}
                              field="add_admin_privileges"
                              icon={Key}
                              options={[
                                { value: 1, label: "Tech" },
                                { value: 2, label: "Social Media" },
                                { value: 3, label: "Both" },
                              ]}
                              onChange={(val) =>
                                setNewAdmin({ ...newAdmin, privileges: val })
                              }
                            />
                          </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="px-6 sm:px-8 py-4 sm:py-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-3 flex-shrink-0">
                          <button
                            onClick={handleAddAdmin}
                            disabled={isSubmitting}
                            className="flex-1 flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 bg-[#18254D] text-white rounded-xl hover:bg-[#1e2e5e] active:scale-95 transition-all text-[12px] sm:text-[13px] font-black tracking-widest shadow-lg shadow-[#18254D]/20 disabled:opacity-70 disabled:cursor-not-allowed"
                          >
                            {isSubmitting ? (
                              <>
                                <Loader2 size={16} className="animate-spin sm:hidden" />
                                <Loader2 size={18} className="animate-spin hidden sm:block" />
                                <span>CREATING...</span>
                              </>
                            ) : (
                              <>
                                <Check size={16} strokeWidth={3} className="sm:hidden" />
                                <Check size={18} strokeWidth={3} className="hidden sm:block" />
                                CREATE ADMIN
                              </>
                            )}
                          </button>
                          
                        </div>
                      </div>
                    </div>,
                    document.body
                  )}

                {/* Edit Admin Modal */}
                {editingAdminId &&
                  createPortal(
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                      {/* Backdrop */}
                      <div
                        className="absolute inset-0 bg-[#18254D]/60 backdrop-blur-xl"
                        onClick={handleCancelEditAdmin}
                      />
                      {/* Modal Content */}
                      <div className="relative w-full max-w-2xl max-h-[85vh] bg-white rounded-3xl shadow-2xl overflow-hidden animate-fade-in flex flex-col">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-[#18254D] to-[#1e2e5e] px-6 sm:px-8 py-5 sm:py-6 flex-shrink-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 rounded-xl sm:rounded-2xl flex items-center justify-center">
                                <Edit2 size={20} className="text-white sm:hidden" />
                                <Edit2 size={24} className="text-white hidden sm:block" />
                              </div>
                              <div>
                                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                                  Edit Admins
                                </h3>
                                <p className="text-xs sm:text-sm text-white/60 font-medium hidden sm:block">
                                  Update admin account details and permissions
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={handleCancelEditAdmin}
                              className="w-9 h-9 sm:w-10 sm:h-10 bg-white/10 hover:bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center transition-all"
                            >
                              <X size={18} className="text-white sm:hidden" />
                              <X size={20} className="text-white hidden sm:block" />
                            </button>
                          </div>
                        </div>

                        {/* Form Content - Scrollable */}
                        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-5 sm:space-y-6">
                          {/* Name & Email Row */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                            <div className="space-y-2">
                              <label className="text-[10px] sm:text-[11px] font-black text-slate-400 tracking-widest uppercase ml-1">
                                Full Name *
                              </label>
                              <input
                                type="text"
                                value={editAdminData.name}
                                onChange={(e) =>
                                  setEditAdminData({ ...editAdminData, name: e.target.value })
                                }
                                placeholder="Enter full name"
                                className="w-full h-[46px] sm:h-[50px] px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#18254D]/20 focus:border-[#18254D] focus:outline-none transition-all text-sm font-bold text-[#18254D] placeholder:font-medium placeholder:text-slate-400"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] sm:text-[11px] font-black text-slate-400 tracking-widest uppercase ml-1">
                                Email Address *
                              </label>
                              <input
                                type="email"
                                value={editAdminData.email}
                                onChange={(e) =>
                                  setEditAdminData({ ...editAdminData, email: e.target.value })
                                }
                                placeholder="Enter email address"
                                className="w-full h-[46px] sm:h-[50px] px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#18254D]/20 focus:border-[#18254D] focus:outline-none transition-all text-sm font-bold text-[#18254D] placeholder:font-medium placeholder:text-slate-400"
                              />
                            </div>
                          </div>

                          {/* Role, Status, Privileges Row */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
                            <CustomDropdown
                              label="Role"
                              value={editAdminData.role}
                              field="edit_admin_role"
                              icon={Briefcase}
                              options={["Admin", "Manager"]}
                              onChange={(val) =>
                                setEditAdminData({ ...editAdminData, role: val })
                              }
                            />
                            <CustomDropdown
                              label="Status"
                              value={editAdminData.status}
                              field="edit_admin_status"
                              icon={Check}
                              options={["Active", "Inactive"]}
                              onChange={(val) =>
                                setEditAdminData({ ...editAdminData, status: val })
                              }
                            />
                            <CustomDropdown
                              label="Privileges"
                              value={editAdminData.privileges}
                              field="edit_admin_privileges"
                              icon={Key}
                              options={[
                                { value: 1, label: "Tech" },
                                { value: 2, label: "Social Media" },
                                { value: 3, label: "Both" },
                              ]}
                              onChange={(val) =>
                                setEditAdminData({ ...editAdminData, privileges: val })
                              }
                            />
                          </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="px-6 sm:px-8 py-4 sm:py-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-3 flex-shrink-0">
                          <button
                            onClick={() => handleSaveEditAdmin(editingAdminId)}
                            disabled={isSubmitting}
                            className="flex-1 flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 bg-[#18254D] text-white rounded-xl hover:bg-[#1e2e5e] active:scale-95 transition-all text-[12px] sm:text-[13px] font-black tracking-widest shadow-lg shadow-[#18254D]/20 disabled:opacity-70 disabled:cursor-not-allowed"
                          >
                            {isSubmitting ? (
                              <>
                                <Loader2 size={16} className="animate-spin sm:hidden" />
                                <Loader2 size={18} className="animate-spin hidden sm:block" />
                                <span>SAVING...</span>
                              </>
                            ) : (
                              <>
                                <Save size={16} strokeWidth={3} className="sm:hidden" />
                                <Save size={18} strokeWidth={3} className="hidden sm:block" />
                                SAVE CHANGES
                              </>
                            )}
                          </button>
                          
                        </div>
                      </div>
                    </div>,
                    document.body
                  )}

                {/* Admins List */}
                <div className="space-y-4">
                  <h4 className="text-[12px] font-bold text-primary  tracking-[0.2em] ml-1">
                    Current Users ({admins.length})
                  </h4>

                  {loadingAdmins ? (
                    <div className="flex items-center justify-center py-10">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : admins.length === 0 ? (
                    <div className="text-center py-10 text-slate-400">
                      <Users size={48} className="mx-auto mb-3 opacity-50" />
                      <p className="text-sm font-medium">
                        No other administrators found
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                      {admins.map((admin) => (
                        <div
                          key={admin.id}
                          className="group bg-white border border-slate-200/60 rounded-[28px] hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 flex flex-col overflow-hidden hover:scale-[1.01]"
                        >
                          {/* Card Header / Avatar Area */}
                              <div className="p-6 flex flex-col items-center text-center relative overflow-hidden">
                                <div className="absolute top-4 right-4 z-10">
                                  <div
                                    className={`w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm ${admin.status === "Active" ? "bg-emerald-500" : "bg-rose-500"}`}
                                  />
                                </div>

                                <div className="relative mb-4">
                                  <div className="absolute inset-0 bg-blue-500/10 rounded-3xl blur-2xl group-hover:bg-blue-500/20 transition-all duration-500" />
                                  {admin.image ? (
                                    <img
                                      src={admin.image}
                                      alt={admin.name}
                                      className="w-20 h-20 rounded-[28px] object-cover border-4 border-white shadow-xl relative z-0"
                                    />
                                  ) : (
                                    <div className="w-20 h-20 rounded-[28px] bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center border-4 border-white shadow-xl relative z-0">
                                      <span className="text-2xl font-black text-white">
                                        {admin.name?.charAt(0).toUpperCase()}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                <h5 className="text-lg font-black text-[#18254D] tracking-tight mb-1">
                                  {admin.name}
                                </h5>
                                <div className="flex items-center gap-1.5 text-slate-500 mb-4 px-3 py-1 bg-slate-50 rounded-full border border-slate-100">
                                  <Mail size={12} strokeWidth={2.5} />
                                  <p className="text-[11px] font-bold truncate max-w-[150px]">
                                    {admin.email}
                                  </p>
                                </div>

                                <div className="grid grid-cols-2 gap-2 w-full">
                                  <div className="px-3 py-2 bg-blue-50 border border-blue-100/50 rounded-2xl flex flex-col items-center gap-1">
                                    <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">
                                      Role
                                    </span>
                                    <span className="text-[11px] font-bold text-blue-700 uppercase">
                                      {admin.role}
                                    </span>
                                  </div>
                                  <div
                                    className={`px-3 py-2 border rounded-2xl flex flex-col items-center gap-1 ${admin.status === "Active" ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-rose-50 border-rose-100 text-rose-700"}`}
                                  >
                                    <span
                                      className={`text-[9px] font-black uppercase tracking-widest ${admin.status === "Active" ? "text-emerald-400" : "text-rose-400"}`}
                                    >
                                      Status
                                    </span>
                                    <span className="text-[11px] font-bold uppercase">
                                      {admin.status}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="mt-auto px-6 pb-6 pt-2">
                                <div className="flex items-center justify-between gap-3 p-1.5 bg-slate-50/50 border border-slate-100 rounded-[20px]">
                                  <div className="flex items-center gap-2 pl-2">
                                    <Zap size={14} className="text-amber-500" />
                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">
                                      {CATEGORY_MAP[admin.privileges] || "Full"}{" "}
                                      Access
                                    </span>
                                  </div>
                                  <div className="flex gap-1">
                                    {admin.role !== "Root Admin" && (
                                      <>
                                        <button
                                          onClick={() =>
                                            handleStartEditAdmin(admin)
                                          }
                                          className="p-2 hover:bg-white hover:text-blue-600 hover:shadow-sm rounded-xl transition-all text-slate-400"
                                          title="Edit Profile"
                                        >
                                          <Edit2 size={16} />
                                        </button>
                                        <button
                                          onClick={() =>
                                            handleDeleteAdmin(admin.id)
                                          }
                                          className="p-2 hover:bg-white hover:text-rose-600 hover:shadow-sm rounded-xl transition-all text-slate-400"
                                          title="Delete Admin"
                                        >
                                          <Trash2 size={16} />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Admin Creation Toast Notification */}
                {showAdminToast && (
                  <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
                    <div className="flex items-center gap-3 px-5 py-3 bg-primary text-white rounded-xl shadow-lg shadow-primary/30 border border-white/10 min-w-[320px]">
                      <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                        <Check size={14} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold tracking-wide text-center">
                          {adminToastMessage}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* DATA EXPORT TAB */}
            {activeTab === "export" && (
              <div className="space-y-8 animate-fade-in w-full">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="text-3xl font-black text-[#18254D] mb-2 tracking-tight">
                      Data Export Center
                    </h3>
                    <p className="text-sm font-black text-slate-500">
                      Download your CRM data in CSV format for analysis and
                      reporting.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Enquiries Export */}
                  <div className="group bg-white border border-slate-200/60 rounded-[20px] p-6 hover:border-slate-300 hover:shadow-lg transition-all duration-300 flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                        <Inbox size={24} className="text-blue-600" />
                      </div>
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full border border-blue-100">
                        Raw Data
                      </span>
                    </div>
                    <h4 className="text-lg font-bold text-[#18254D] mb-2">
                      Enquiries
                    </h4>
                    <p className="text-sm text-slate-600 mb-4 leading-relaxed flex-1">
                      All incoming enquiries before conversion to leads.
                    </p>
                    <button
                      onClick={() =>
                        handleExport("enquiries", "enquiries_export.xlsx")
                      }
                      disabled={exportingType === "enquiries"}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#18254D] text-white rounded-xl hover:bg-[#1e2e5e] transition-all active:scale-95 text-sm font-bold shadow-lg shadow-slate-900/20 mt-auto disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {exportingType === "enquiries" ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>Downloading...</span>
                        </>
                      ) : (
                        <>
                          <Download size={16} />
                          <span>Download Excel</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Leads Export */}
                  <div className="group bg-white border border-slate-200/60 rounded-[20px] p-6 hover:border-slate-300 hover:shadow-lg transition-all duration-300 flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center flex-shrink-0">
                        <UserPlus size={24} className="text-green-600" />
                      </div>
                      <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100">
                        Converted
                      </span>
                    </div>
                    <h4 className="text-lg font-bold text-[#18254D] mb-2">
                      Leads
                    </h4>
                    <p className="text-sm text-slate-600 mb-4 leading-relaxed flex-1">
                      Converted leads with enquiry linkage and contact details.
                    </p>
                    <button
                      onClick={() => handleExport("leads", "leads_export.xlsx")}
                      disabled={exportingType === "leads"}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#18254D] text-white rounded-xl hover:bg-[#1e2e5e] transition-all active:scale-95 text-sm font-bold shadow-lg shadow-slate-900/20 mt-auto disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {exportingType === "leads" ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>Downloading...</span>
                        </>
                      ) : (
                        <>
                          <Download size={16} />
                          <span>Download Excel</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Follow-ups Export */}
                  <div className="group bg-white border border-slate-200/60 rounded-[20px] p-6 hover:border-slate-300 hover:shadow-lg transition-all duration-300 flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center flex-shrink-0">
                        <BellRing size={24} className="text-purple-600" />
                      </div>
                      <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-full border border-purple-100">
                        Activity
                      </span>
                    </div>
                    <h4 className="text-lg font-bold text-[#18254D] mb-2">
                      Follow-ups
                    </h4>
                    <p className="text-sm text-slate-600 mb-4 leading-relaxed flex-1">
                      All follow-up activities with lead and project details.
                    </p>
                    <button
                      onClick={() => setShowFollowupExportModal(true)}
                      disabled={exportingType === "followups"}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#18254D] text-white rounded-xl hover:bg-[#1e2e5e] transition-all active:scale-95 text-sm font-bold shadow-lg shadow-slate-900/20 mt-auto disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {exportingType === "followups" ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>Downloading...</span>
                        </>
                      ) : (
                        <>
                          <Download size={16} />
                          <span>Download Excel</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Clients Export */}
                  <div className="group bg-white border border-slate-200/60 rounded-[20px] p-6 hover:border-slate-300 hover:shadow-lg transition-all duration-300 flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center flex-shrink-0">
                        <Users size={24} className="text-orange-600" />
                      </div>
                      <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-full border border-orange-100">
                        Business
                      </span>
                    </div>
                    <h4 className="text-lg font-bold text-[#18254D] mb-2">
                      Clients
                    </h4>
                    <p className="text-sm text-slate-600 mb-4 leading-relaxed flex-1">
                      Converted business entities with organization details.
                    </p>
                    <button
                      onClick={() =>
                        handleExport("clients", "clients_export.xlsx")
                      }
                      disabled={exportingType === "clients"}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#18254D] text-white rounded-xl hover:bg-[#1e2e5e] transition-all active:scale-95 text-sm font-bold shadow-lg shadow-slate-900/20 mt-auto disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {exportingType === "clients" ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>Downloading...</span>
                        </>
                      ) : (
                        <>
                          <Download size={16} />
                          <span>Download Excel</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Projects Export */}
                  <div className="group bg-white border border-slate-200/60 rounded-[20px] p-6 hover:border-slate-300 hover:shadow-lg transition-all duration-300 flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center flex-shrink-0">
                        <FolderKanban size={24} className="text-red-600" />
                      </div>
                      <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full border border-red-100">
                        Revenue
                      </span>
                    </div>
                    <h4 className="text-lg font-bold text-[#18254D] mb-2">
                      Projects
                    </h4>
                    <p className="text-sm text-slate-600 mb-4 leading-relaxed flex-1">
                      Active projects with budget, deadlines, and client info.
                    </p>
                    <button
                      onClick={() =>
                        handleExport("projects", "projects_export.xlsx")
                      }
                      disabled={exportingType === "projects"}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#18254D] text-white rounded-xl hover:bg-[#1e2e5e] transition-all active:scale-95 text-sm font-bold shadow-lg shadow-slate-900/20 mt-auto disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {exportingType === "projects" ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>Downloading...</span>
                        </>
                      ) : (
                        <>
                          <Download size={16} />
                          <span>Download Excel</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* All-in-One Export */}
                  {/* <div className="group bg-white border border-slate-200/60 rounded-[20px] p-6 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 md:col-span-2 lg:col-span-3">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                        <MessageSquare size={24} className="text-indigo-600" />
                      </div>
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full border border-indigo-100">
                        Complete View
                      </span>
                    </div>
                    <h4 className="text-lg font-bold text-slate-900 mb-2">
                      All CRM Data
                    </h4>
                    <p className="text-sm text-slate-500 mb-4 leading-relaxed">
                      Comprehensive export linking leads, clients, projects, and
                      follow-ups for complete CRM analysis.
                    </p>
                    <button
                      onClick={() =>
                        handleExport("all-crm-data", "all_crm_data_export.csv")
                      }
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all active:scale-95 text-sm font-bold shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/30"
                    >
                      <Download size={16} />
                      Download Complete CSV
                    </button>
                  </div> */}
                </div>
{/* 
                <div className="bg-slate-50 border border-slate-200 rounded-[20px] p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
                      <Zap size={20} className="text-slate-600" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-[#18254D] mb-2">
                        Export Features
                      </h4>
                      <ul className="text-sm text-slate-700 space-y-1">
                        <li>
                          • <strong>User-friendly column names</strong> instead
                          of raw database fields
                        </li>
                        <li>
                          • <strong>Proper date formatting</strong> (DD-MM-YYYY
                          format)
                        </li>
                        <li>
                          • <strong>Currency formatting</strong> with Indian
                          Rupee symbol
                        </li>
                        <li>
                          • <strong>Serial numbers</strong> for easy reference
                        </li>
                        <li>
                          • <strong>Linked data</strong> showing relationships
                          between tables
                        </li>
                        <li>
                          • <strong>Excel format (.xlsx)</strong> with
                          professional styling and formatting
                        </li>
                        <li>
                          • <strong>Auto-sized columns</strong> and{" "}
                          <strong>alternating row colors</strong>
                        </li>
                        <li>
                          • <strong>Sheet titles</strong> and{" "}
                          <strong>metadata</strong> for better organization
                        </li>
                      </ul>
                    </div>
                  </div>
                </div> */}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Generic Toast Notification replaced by react-hot-toast */}

      {/* Confirmation Modal */}
      {confirmModal.show &&
        createPortal(
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-[#18254D]/60 backdrop-blur-xl"
              onClick={hideConfirmModal}
            />
            <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full animate-pop border border-slate-100">
              <h3 className="text-lg font-bold text-primary mb-2">
                {confirmModal.title}
              </h3>
              <p className="text-sm text-slate-600 mb-6">
                {confirmModal.message}
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={hideConfirmModal}
                  className="px-4 py-2.5 rounded-2xl border border-slate-200 text-slate-600 text-[13px] font-bold tracking-wider hover:bg-slate-50 hover:border-slate-300 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmModal.onConfirm}
                  className="px-4 py-2.5 rounded-2xl bg-primary text-white text-[13px] font-bold tracking-wider hover:bg-slate-800 transition-all shadow-lg"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Follow-up Export Selection Modal */}
      {showFollowupExportModal &&
        createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-[#18254D]/40 backdrop-blur-sm animate-fade-in"
              onClick={() => setShowFollowupExportModal(false)}
            />
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-sm overflow-hidden animate-pop relative z-10">
              <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-sm font-bold text-[#18254D] tracking-tight">
                  Follow-up Export Options
                </h3>
                <button
                  onClick={() => setShowFollowupExportModal(false)}
                  className="p-1.5 hover:bg-slate-200 rounded-xl text-slate-400 transition-all"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <button
                  onClick={() => {
                    handleExport("followups?type=new", "new_followups.xlsx");
                    setShowFollowupExportModal(false);
                  }}
                  disabled={exportingType === "followups"}
                  className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-[#18254D] hover:text-white transition-all group border border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-xl group-hover:bg-white/10 shadow-sm border border-slate-100">
                      <UserPlus
                        size={18}
                        className="text-primary group-hover:text-white"
                      />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold tracking-tight">
                        New Follow-ups
                      </p>
                      <p className="text-[12px] opacity-60 font-medium">
                        Focused on leads and prospects
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={16} />
                </button>

                <button
                  onClick={() => {
                    handleExport(
                      "followups?type=reference",
                      "reference_followups.xlsx",
                    );
                    setShowFollowupExportModal(false);
                  }}
                  disabled={exportingType === "followups"}
                  className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-[#18254D] hover:text-white transition-all group border border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-xl group-hover:bg-white/10 shadow-sm border border-slate-100">
                      <Briefcase
                        size={18}
                        className="text-primary group-hover:text-white"
                      />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold tracking-tight">
                        Reference Follow-ups
                      </p>
                      <p className="text-[12px] opacity-60 font-medium">
                        Focused on active clients & projects
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default Settings;
