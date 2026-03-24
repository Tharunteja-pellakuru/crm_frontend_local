import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { BASE_URL } from "../../constants/config";
import { getAuthHeaders } from "../../utils/auth";
import anandImg from "../../assets/Anand.png";
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
  const [showAddModelForm, setShowAddModelForm] = useState(false);
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
      const excludeUuid = loggedInUser?.uuid || loggedInUser?.id;

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

  const [showAddAdminForm, setShowAddAdminForm] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    name: "",
    email: "",
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
  }) => (
    <div className="space-y-2 relative">
      <label className="text-[12px] font-bold text-slate-400 tracking-widest ml-1 uppercase opacity-60">
        {label}
      </label>
      <button
        type="button"
        onClick={() =>
          setActiveDropdown(activeDropdown === field ? null : field)
        }
        className="w-full h-[46px] flex items-center justify-between px-4 bg-white border border-slate-200 rounded-xl hover:border-secondary transition-all text-sm font-bold text-[#18254D] shadow-sm"
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon size={16} className="text-secondary" />}
          <span>
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
              <p className="text-[14px] font-bold text-white/50 tracking-widest uppercase">
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
                  className={`w-full text-left px-5 py-3 text-[12px] font-bold tracking-widest transition-colors flex items-center justify-between ${
                    optValue === value
                      ? "bg-slate-50 text-secondary"
                      : "text-[#18254D] hover:bg-slate-50"
                  }`}
                >
                  {optLabel}
                  {optValue === value && (
                    <Check size={12} className="text-secondary" />
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
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

      const userId = profile.uuid || profile.id;
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

  const handleAddAdmin = async () => {
    if (newAdmin.name && newAdmin.email) {
      setIsSubmitting(true);
      try {
        // Generate a default password (you might want to change this logic)
        const defaultPassword = "Password@123"; // Or generate random

        const response = await fetch(`${BASE_URL}/api/admin-users`, {
          method: "POST",
          headers: {
            ...getAuthHeaders(),
          },
          body: JSON.stringify({
            full_name: newAdmin.name,
            email: newAdmin.email,
            password: defaultPassword,
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
            role: "Admin",
            status: "Active",
            privileges: 3,
          });
          setShowAddAdminForm(false);
          showToastMessage(
            `Admin created successfully! Default password: ${defaultPassword}`,
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
      privileges: admin.privileges || 3,
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
        const userId = profile?.uuid || profile?.id;
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
                width: "calc(25% - 2px)",
                transform: `translateX(${["profile", "security", "ai", "team"].indexOf(activeTab) * 100}%)`,
              }}
            />

            {[
              { id: "profile", label: "My Profile" },
              { id: "security", label: "Security" },
              { id: "ai", label: "AI Settings" },
              { id: "team", label: "Admins" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative z-10 flex-1 sm:flex-none px-2 sm:px-6 py-2.5 sm:py-2 rounded-xl text-[10px] sm:text-[12px] font-bold tracking-wider transition-all duration-300 flex items-center justify-center min-w-[75px] sm:min-w-[120px] h-[30px] sm:h-[36px] whitespace-nowrap active:scale-95 ${
                  activeTab === tab.id
                    ? "text-blue-600 scale-[1.02]"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {tab.label}
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
                      <div className={`w-32 h-32 rounded-[32px] bg-gradient-to-br from-[#18254D] to-[#2a3f7a] flex items-center justify-center border-4 border-white shadow-2xl relative z-10 ${profile.image ? "hidden" : "flex"}`}>
                        <span className="text-4xl font-black text-white">
                          {profile.full_name?.charAt(0).toUpperCase() || "U"}
                        </span>
                      </div>
                      {isProfileEditing && (
                        <div className="absolute inset-0 bg-[#18254D]/40 backdrop-blur-[2px] rounded-[32px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-20">
                          <Camera className="text-white" size={32} strokeWidth={2.5} />
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
                        <User size={12} strokeWidth={3} className="text-blue-500" />
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
                        <Building2 size={12} strokeWidth={3} className="text-blue-500" />
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
                        <Mail size={12} strokeWidth={3} className="text-blue-500" />
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
                    {/* <button
                      onClick={() => setShowAddModelForm(!showAddModelForm)}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-2xl hover:bg-slate-800 transition-all active:scale-95 text-[13px] font-bold tracking-wider shadow-lg"
                    >
                      <Plus size={16} />
                      ADD AI MODEL
                    </button> */}
                  </div>

                  {/* Add Model Form */}
                  {showAddModelForm && (
                    <div className="p-6 bg-violet-50/50 border border-violet-200 rounded-2xl space-y-5 mb-6 animate-fade-in">
                      <h4 className="font-bold text-slate-900 flex items-center gap-2 tracking-tight">
                        <Zap size={16} className="text-violet-500" />
                        Add New AI Model
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <label className="text-[12px]  font-bold text-slate-500 tracking-widest">
                            Display Name
                          </label>
                          <input
                            type="text"
                            value={newModel.name}
                            onChange={(e) =>
                              setNewModel({ ...newModel, name: e.target.value })
                            }
                            placeholder="e.g., GPT-4o Mini"
                            className="w-full h-[46px] px-4 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-secondary/30 focus:border-secondary focus:outline-none transition-all text-sm font-bold shadow-sm"
                          />
                        </div>
                        <CustomDropdown
                          label="Provider"
                          value={newModel.provider}
                          field="add_ai_provider"
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
                          <label className="text-[12px]  font-bold text-slate-500 tracking-widest">
                            Model ID (exact)
                          </label>
                          <input
                            type="text"
                            value={newModel.modelId}
                            onChange={(e) =>
                              setNewModel({
                                ...newModel,
                                modelId: e.target.value,
                              })
                            }
                            placeholder="e.g., gpt-4o-mini, grok-2, claude-3-haiku"
                            className="w-full h-[46px] px-4 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-secondary/30 focus:border-secondary focus:outline-none transition-all text-sm font-bold shadow-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[12px]  font-bold text-slate-500 tracking-widest flex items-center gap-1.5">
                            <Key size={12} className="text-slate-400" />
                            API Key
                          </label>
                          <input
                            type="password"
                            value={newModel.apiKey}
                            onChange={(e) =>
                              setNewModel({
                                ...newModel,
                                apiKey: e.target.value,
                              })
                            }
                            placeholder="Enter API key for this model"
                            className="w-full h-[46px] px-4 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-secondary/30 focus:border-secondary focus:outline-none transition-all text-sm font-bold shadow-sm"
                          />
                        </div>
                      </div>
                      <div className="flex gap-3 pt-3">
                        <button
                          onClick={() => {
                            if (
                              newModel.name &&
                              newModel.modelId &&
                              newModel.apiKey
                            ) {
                              onAddAiModel(newModel);
                              setNewModel({
                                name: "",
                                provider: "openai",
                                modelId: "",
                                apiKey: "",
                              });
                              setShowAddModelForm(false);
                            }
                          }}
                          disabled={
                            !newModel.name ||
                            !newModel.modelId ||
                            !newModel.apiKey
                          }
                          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-2xl hover:bg-slate-800 transition-all active:scale-95 text-[13px] font-bold tracking-wider disabled:bg-primary/50 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                          <Check size={16} />
                          Add Model
                        </button>
                        <button
                          onClick={() => setShowAddModelForm(false)}
                          className="px-4 py-2.5 bg-slate-200 text-slate-700 rounded-2xl hover:bg-slate-300 transition-all text-[13px] font-bold tracking-wider"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
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
                          key={model.id}
                          className="p-4 bg-white border border-slate-200 rounded-xl hover:border-violet-200 hover:shadow-md transition-all"
                        >
                          {editingModelId === model.id ? (
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                  <label className="text-[12px]  font-bold text-slate-500 tracking-widest">
                                    Display Name
                                  </label>
                                  <input
                                    type="text"
                                    value={editModelData.name}
                                    onChange={(e) =>
                                      setEditModelData({
                                        ...editModelData,
                                        name: e.target.value,
                                      })
                                    }
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 focus:outline-none transition-all text-sm font-bold"
                                  />
                                </div>
                                <CustomDropdown
                                  label="Provider"
                                  value={editModelData.provider}
                                  field={`edit_ai_provider_${model.id}`}
                                  options={[
                                    {
                                      value: "openai",
                                      label: "OpenAI (ChatGPT)",
                                    },
                                    { value: "gemini", label: "Google Gemini" },
                                    { value: "grok", label: "xAI (Grok)" },
                                    {
                                      value: "anthropic",
                                      label: "Anthropic (Claude)",
                                    },
                                    { value: "mistral", label: "Mistral AI" },
                                    { value: "deepseek", label: "DeepSeek" },
                                    { value: "llama", label: "Llama 3 (Groq)" },
                                    {
                                      value: "groq",
                                      label: "Groq (Ultra Fast)",
                                    },
                                    { value: "other", label: "Other" },
                                  ]}
                                  onChange={(val) =>
                                    setEditModelData({
                                      ...editModelData,
                                      provider: val,
                                    })
                                  }
                                />
                                <div className="space-y-2">
                                  <label className="text-[12px]  font-bold text-slate-500 tracking-widest">
                                    Model ID
                                  </label>
                                  <input
                                    type="text"
                                    value={editModelData.modelId}
                                    onChange={(e) =>
                                      setEditModelData({
                                        ...editModelData,
                                        modelId: e.target.value,
                                      })
                                    }
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 focus:outline-none transition-all text-sm font-bold"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-[12px]  font-bold text-slate-500 tracking-widest">
                                    API Key
                                  </label>
                                  <input
                                    type="password"
                                    value={editModelData.apiKey}
                                    onChange={(e) =>
                                      setEditModelData({
                                        ...editModelData,
                                        apiKey: e.target.value,
                                      })
                                    }
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 focus:outline-none transition-all text-sm font-bold"
                                  />
                                </div>
                              </div>
                              <div className="flex gap-3 pt-4">
                                <button
                                  onClick={() => {
                                    onUpdateAiModel(editModelData);
                                    setEditingModelId(null);
                                  }}
                                  className="px-6 py-2.5 bg-[#18254D] text-white rounded-[20px] hover:bg-[#1e2e5e] transition-all text-[13px] font-black tracking-wider shadow-lg shadow-[#18254D]/10"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingModelId(null)}
                                  className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-[20px] hover:bg-slate-200 transition-all text-[13px] font-black tracking-wider"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
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
                                    setEditingModelId(model.id);
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
                                    onClick={() => onDeleteAiModel(model.id)}
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
                          )}
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
                  {!showPasswordForm ? (
                    <button
                      onClick={() => setShowPasswordForm(true)}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-2xl hover:bg-slate-800 transition-all active:scale-95 text-[13px] font-bold tracking-wider shadow-lg"
                    >
                      <Lock size={14} strokeWidth={2.5} />
                      Update Password
                    </button>
                  ) : (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        <div className="space-y-2">
                          <label className="text-[12px]  font-bold text-slate-500 tracking-widest uppercase">
                            Current Password
                          </label>
                          <input
                            type="password"
                            value={passwordData.currentPassword}
                            onChange={(e) =>
                              setPasswordData({
                                ...passwordData,
                                currentPassword: e.target.value,
                              })
                            }
                            placeholder="Current password"
                            className="w-full h-[46px] px-4 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-secondary/30 focus:border-secondary focus:outline-none transition-all text-sm font-bold shadow-sm"
                          />
                        </div>
                        <div className="hidden md:block" /> {/* Spacer */}
                        <div className="space-y-2">
                          <label className="text-[12px]  font-bold text-slate-500 tracking-widest uppercase">
                            New Password
                          </label>
                          <input
                            type="password"
                            value={passwordData.newPassword}
                            onChange={(e) =>
                              setPasswordData({
                                ...passwordData,
                                newPassword: e.target.value,
                              })
                            }
                            placeholder="New password"
                            className="w-full h-[46px] px-4 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-secondary/30 focus:border-secondary focus:outline-none transition-all text-sm font-bold shadow-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[12px]  font-bold text-slate-500 tracking-widest uppercase">
                            Confirm New Password
                          </label>
                          <input
                            type="password"
                            value={passwordData.confirmPassword}
                            onChange={(e) =>
                              setPasswordData({
                                ...passwordData,
                                confirmPassword: e.target.value,
                              })
                            }
                            placeholder="Confirm password"
                            className="w-full h-[46px] px-4 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-secondary/30 focus:border-secondary focus:outline-none transition-all text-sm font-bold shadow-sm"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-slate-100">
                        <button
                          onClick={handleUpdatePassword}
                          disabled={isSubmitting}
                          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#18254D] text-white rounded-xl hover:bg-[#1e2e5e] transition-all active:scale-95 text-sm font-bold shadow-lg shadow-[#18254D]/20 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 size={16} className="animate-spin" />
                              <span>Updating...</span>
                            </>
                          ) : (
                            <>
                              <Save size={18} strokeWidth={2.5} />
                              Update Password
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setShowPasswordForm(false);
                            setPasswordData({
                              currentPassword: "",
                              newPassword: "",
                              confirmPassword: "",
                            });
                          }}
                          className="flex-1 px-6 py-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all text-sm font-bold active:scale-95"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
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
                      onClick={() => setShowAddAdminForm(!showAddAdminForm)}
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

                {/* Add Admin Form */}
                {showAddAdminForm && (
                  <div className="p-6 bg-slate-50 border border-slate-200/60 rounded-[20px] space-y-5">
                    <h4 className="font-bold text-slate-900 tracking-tight">
                      Add New Administrator
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      <div className="space-y-2">
                        <label className="text-[12px]  font-bold text-slate-500 tracking-widest uppercase">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={newAdmin.name}
                          onChange={(e) =>
                            setNewAdmin({ ...newAdmin, name: e.target.value })
                          }
                          placeholder="Full name"
                          className="w-full h-[46px] px-4 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-secondary/30 focus:border-secondary focus:outline-none transition-all text-sm font-bold shadow-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[12px]  font-bold text-slate-500 tracking-widest uppercase">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={newAdmin.email}
                          onChange={(e) =>
                            setNewAdmin({
                              ...newAdmin,
                              email: e.target.value,
                            })
                          }
                          placeholder="Email"
                          className="w-full h-[46px] px-4 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-secondary/30 focus:border-secondary focus:outline-none transition-all text-sm font-bold shadow-sm"
                        />
                      </div>
                      <CustomDropdown
                        label="Role"
                        value={newAdmin.role}
                        field="add_admin_role"
                        options={["Admin", "Manager"]}
                        onChange={(val) =>
                          setNewAdmin({ ...newAdmin, role: val })
                        }
                      />
                      <CustomDropdown
                        label="Status"
                        value={newAdmin.status}
                        field="add_admin_status"
                        options={["Active", "Inactive"]}
                        onChange={(val) =>
                          setNewAdmin({ ...newAdmin, status: val })
                        }
                      />
                      <div className="sm:col-span-2 lg:col-span-1">
                        <CustomDropdown
                          label="Privileges"
                          value={newAdmin.privileges}
                          field="add_admin_privileges"
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
                    <div className="flex gap-3 pt-4 border-t border-slate-100">
                      <button
                        onClick={handleAddAdmin}
                        disabled={isSubmitting}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3 bg-[#18254D] text-white rounded-2xl hover:bg-[#1e2e5e] active:scale-95 transition-all text-[13px] font-black tracking-widest shadow-xl shadow-[#18254D]/20 disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 size={18} className="animate-spin" />
                            <span>CREATING...</span>
                          </>
                        ) : (
                          <>
                            <Check size={18} strokeWidth={3} />
                            CREATE ADMIN
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setShowAddAdminForm(false)}
                        className="flex-1 sm:flex-none px-8 py-3 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-all text-[13px] font-black tracking-widest uppercase"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
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
                            className={`group bg-white border border-slate-200/60 rounded-[28px] hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 flex flex-col overflow-hidden ${
                              editingAdminId === admin.id ? "ring-2 ring-blue-500" : ""
                            }`}
                          >
                            {editingAdminId === admin.id ? (
                              <div className="p-6 space-y-5">
                                <div className="space-y-4">
                                  <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase ml-1">
                                      Full Name
                                    </label>
                                    <input
                                      type="text"
                                      value={editAdminData.name}
                                      onChange={(e) =>
                                        setEditAdminData({
                                          ...editAdminData,
                                          name: e.target.value,
                                        })
                                      }
                                      className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all text-sm font-bold"
                                    />
                                  </div>
                                  <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase ml-1">
                                      Email
                                    </label>
                                    <input
                                      type="email"
                                      value={editAdminData.email}
                                      onChange={(e) =>
                                        setEditAdminData({
                                          ...editAdminData,
                                          email: e.target.value,
                                        })
                                      }
                                      className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all text-sm font-bold"
                                    />
                                  </div>
                                  <CustomDropdown
                                    label="Role"
                                    value={editAdminData.role}
                                    field={`edit_admin_role_${admin.id}`}
                                    options={["Admin", "Manager"]}
                                    onChange={(val) =>
                                      setEditAdminData({ ...editAdminData, role: val })
                                    }
                                  />
                                  <div className="grid grid-cols-2 gap-3">
                                    <CustomDropdown
                                      label="Status"
                                      value={editAdminData.status}
                                      field={`edit_admin_status_${admin.id}`}
                                      options={["Active", "Inactive"]}
                                      onChange={(val) =>
                                        setEditAdminData({ ...editAdminData, status: val })
                                      }
                                    />
                                    <CustomDropdown
                                      label="Privileges"
                                      value={editAdminData.privileges}
                                      field={`edit_admin_privileges_${admin.id}`}
                                      options={[
                                        { value: 1, label: "Tech" },
                                        { value: 2, label: "Social" },
                                        { value: 3, label: "Both" },
                                      ]}
                                      onChange={(val) =>
                                        setEditAdminData({ ...editAdminData, privileges: val })
                                      }
                                    />
                                  </div>
                                </div>
                                <div className="flex gap-2.5 pt-4">
                                  <button
                                    onClick={() => handleSaveEditAdmin(admin.id)}
                                    disabled={isSubmitting}
                                    className="flex-1 py-2.5 bg-[#18254D] text-white rounded-xl hover:bg-[#1e2e5e] transition-all text-xs font-bold shadow-lg shadow-[#18254D]/20 disabled:opacity-70 disabled:cursor-not-allowed"
                                  >
                                    {isSubmitting ? (
                                      <Loader2 size={14} className="animate-spin mx-auto" />
                                    ) : (
                                      "Save"
                                    )}
                                  </button>
                                  <button
                                    onClick={handleCancelEditAdmin}
                                    className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all text-xs font-bold"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                {/* Card Header / Avatar Area */}
                                <div className="p-6 flex flex-col items-center text-center relative overflow-hidden">
                                  <div className="absolute top-4 right-4 z-10">
                                    <div className={`w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm ${admin.status === "Active" ? "bg-emerald-500" : "bg-rose-500"}`} />
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
                                      <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Role</span>
                                      <span className="text-[11px] font-bold text-blue-700 uppercase">{admin.role}</span>
                                    </div>
                                    <div className={`px-3 py-2 border rounded-2xl flex flex-col items-center gap-1 ${admin.status === "Active" ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-rose-50 border-rose-100 text-rose-700"}`}>
                                      <span className={`text-[9px] font-black uppercase tracking-widest ${admin.status === "Active" ? "text-emerald-400" : "text-rose-400"}`}>Status</span>
                                      <span className="text-[11px] font-bold uppercase">{admin.status}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="mt-auto px-6 pb-6 pt-2">
                                  <div className="flex items-center justify-between gap-3 p-1.5 bg-slate-50/50 border border-slate-100 rounded-[20px]">
                                    <div className="flex items-center gap-2 pl-2">
                                      <Zap size={14} className="text-amber-500" />
                                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">
                                        {CATEGORY_MAP[admin.privileges] || "Full"} Access
                                      </span>
                                    </div>
                                    <div className="flex gap-1">
                                      {admin.role !== "Root Admin" && (
                                        <>
                                          <button
                                            onClick={() => handleStartEditAdmin(admin)}
                                            className="p-2 hover:bg-white hover:text-blue-600 hover:shadow-sm rounded-xl transition-all text-slate-400"
                                            title="Edit Profile"
                                          >
                                            <Edit2 size={16} />
                                          </button>
                                          <button
                                            onClick={() => handleDeleteAdmin(admin.id)}
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
                              </>
                            )}
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
          </div>
        </div>
      </div>

      {/* Generic Toast Notification replaced by react-hot-toast */}

      {/* Confirmation Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
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
        </div>
      )}
    </div>
  );
};

export default Settings;
