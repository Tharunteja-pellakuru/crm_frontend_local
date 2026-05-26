import React, { useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-hot-toast";
import {
  UserCheck,
  X,
  ChevronDown,
  Upload,
  Loader2,
} from "lucide-react";
import DatePicker from "../ui/DatePicker";
import SearchableDropdown from "../common/SearchableDropdown";
import { formatBudget, parseBudget } from "../../utils/formatters";
import { countries } from "../../utils/countries";
import {
  countryToCurrency,
  countryToStates,
  commonCurrencies,
} from "../../utils/locationData";
import { CATEGORY_MAP } from "../../constants/categoryConstants";
import { validateForm } from "../../utils/validation";

/**
 * ConvertToClientModal
 * Reusable modal mirroring the "Convert to Client" modal in LeadList.jsx.
 *
 * Props:
 *  - isOpen        : boolean
 *  - onClose       : () => void
 *  - leadId        : string | number
 *  - initialData   : { name, email, phone, country, state, currency, projectCategory, company, organisationName }
 *  - onSubmit      : (leadId, data) => Promise<void>   – same signature as onOnboardClient
 *  - clients       : array of active client objects (for "Existing Client" selection)
 */
const ConvertToClientModal = ({
  isOpen,
  onClose,
  leadId,
  initialData = {},
  onSubmit,
  clients = [],
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [onboardingData, setOnboardingData] = useState({
    name:             initialData.name             || "",
    email:            initialData.email            || "",
    phone:            initialData.phone            || "",
    clientType:       "New",
    status:           "Active",
    projectName:      "",
    projectStatus:    "In Progress",
    projectCategory:  initialData.projectCategory  || 1,
    projectPriority:  "High",
    projectDescription: "",
    projectBudget:    "",
    country:          initialData.country          || "India",
    state:            initialData.state            || "",
    currency:         initialData.currency         || "INR",
    organisationName: initialData.organisationName || initialData.company || "",
    clientStatus:     "Active",
    onboardingDate:   new Date().toISOString().split("T")[0],
    deadline:         "",
    scopeDocument:    null,
  });

  const [selectedExistingClientId, setSelectedExistingClientId] = useState(null);
  const [existingClientSearch, setExistingClientSearch]         = useState("");
  const [isExistingClientDropdownOpen, setIsExistingClientDropdownOpen] = useState(false);
  const [isOnboardStatusDropdownOpen,  setIsOnboardStatusDropdownOpen]  = useState(false);
  const [isOnboardPriorityDropdownOpen, setIsOnboardPriorityDropdownOpen] = useState(false);
  const [isOnboardClientStatusDropdownOpen, setIsOnboardClientStatusDropdownOpen] = useState(false);
  const [isOnboardCategoryDropdownOpen, setIsOnboardCategoryDropdownOpen] = useState(false);

  if (!isOpen) return null;

  const handleOnboardSubmit = async (e) => {
    e.preventDefault();

    if (onboardingData.clientType === "Existing") {
      if (!selectedExistingClientId) {
        toast.error("Please select an existing client.");
        return;
      }
      const isValid = validateForm(onboardingData, {
        projectName:        { required: true, label: "Project Name" },
        projectDescription: { required: true, label: "Project Description" },
        projectCategory:    { required: true, label: "Project Category" },
        projectStatus:      { required: true, label: "Project Status" },
        projectPriority:    { required: true, label: "Project Priority" },
        projectBudget:      { required: true, type: "number", label: "Project Budget" },
        onboardingDate:     { required: true, label: "Onboarding Date" },
        deadline:           { required: true, label: "Deadline Date" },
        scopeDocument:      { required: true, label: "Scope Document" },
      });
      if (!isValid) return;
    } else {
      const isValid = validateForm(onboardingData, {
        name:               { required: true, minLength: 2, label: "Full Name" },
        email:              { required: true, pattern: /^\S+@\S+\.\S+$/, label: "Email" },
        phone:              { required: true, minLength: 10, label: "Phone Number" },
        organisationName:   { required: true, label: "Organisation Name" },
        country:            { required: true, label: "Client Country" },
        state:              { required: true, label: "Client State" },
        currency:           { required: true, label: "Client Currency" },
        clientStatus:       { required: true, label: "Client Status" },
        projectName:        { required: true, label: "Project Name" },
        projectDescription: { required: true, label: "Project Description" },
        projectCategory:    { required: true, label: "Project Category" },
        projectStatus:      { required: true, label: "Project Status" },
        projectPriority:    { required: true, label: "Project Priority" },
        projectBudget:      { required: true, type: "number", label: "Project Budget" },
        onboardingDate:     { required: true, label: "Onboarding Date" },
        deadline:           { required: true, label: "Deadline Date" },
        scopeDocument:      { required: true, label: "Scope Document" },
      });
      if (!isValid) return;
    }

    setIsSubmitting(true);
    try {
      const submitData = {
        ...onboardingData,
        ...(onboardingData.clientType === "Existing" ? { existingClientId: selectedExistingClientId } : {}),
      };
      await onSubmit(leadId, submitData);
      onClose();
    } catch (error) {
      toast.error("Failed to onboard lead.");
      console.error("Failed to onboard lead:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[99999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative z-10 bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-pop flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#ECFDF5] text-[#10B981] rounded-xl flex items-center justify-center border border-[#A7F3D0] shadow-sm">
              <UserCheck size={16} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#18254D] tracking-tight">Convert to Client</h3>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-0.5">Onboard Lead to Active Status</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-xl text-slate-400 transition-all">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleOnboardSubmit} className="p-6 space-y-5 overflow-y-auto no-scrollbar">

          {/* Client Type */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Client Type</label>
            <div className="grid grid-cols-2 gap-3">
              {["New", "Existing"].map((type) => (
                <label
                  key={type}
                  className={`flex items-center gap-3 p-3.5 bg-white border-2 rounded-xl cursor-pointer transition-all shadow-sm ${
                    onboardingData.clientType === type ? "border-[#18254D]" : "border-slate-200 hover:border-slate-300"
                  }`}
                  onClick={() => {
                    setOnboardingData({ ...onboardingData, clientType: type });
                    if (type === "New") { setSelectedExistingClientId(null); setExistingClientSearch(""); }
                  }}
                >
                  <div className="relative flex items-center justify-center">
                    <input type="radio" name="clientType" checked={onboardingData.clientType === type} readOnly className="peer appearance-none w-5 h-5 border-2 border-[#18254D] rounded-full transition-all" />
                    {onboardingData.clientType === type && <div className="absolute w-2.5 h-2.5 bg-[#18254D] rounded-full" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#18254D] leading-none">{type} Client</p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{type === "New" ? "First-time engagement" : "Select from client list"}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Existing Client Dropdown */}
          {onboardingData.clientType === "Existing" && (
            <div className="space-y-3">
              <div className="space-y-1.5 relative">
                <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Client Name <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <input
                    type="text" placeholder="Search existing clients..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200"
                    value={existingClientSearch}
                    onChange={(e) => { setExistingClientSearch(e.target.value); setIsExistingClientDropdownOpen(true); if (!e.target.value) setSelectedExistingClientId(null); }}
                    onFocus={() => setIsExistingClientDropdownOpen(true)}
                  />
                  <ChevronDown size={14} className={`absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-transform ${isExistingClientDropdownOpen ? "rotate-180" : ""}`} />
                  {isExistingClientDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-[80]" onClick={() => setIsExistingClientDropdownOpen(false)} />
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden z-[90] animate-pop origin-top max-h-[200px] overflow-y-auto">
                        <div className="bg-[#18254D] px-4 py-2.5 border-b border-white/10 sticky top-0">
                          <p className="text-[10px] font-bold text-white/50 tracking-wider uppercase">Select Client</p>
                        </div>
                        {clients
                          .filter((c) => c.status === "Active" && (!existingClientSearch || c.name?.toLowerCase().includes(existingClientSearch.toLowerCase()) || c.company?.toLowerCase().includes(existingClientSearch.toLowerCase())))
                          .map((c) => (
                            <button
                              key={`existing-client-${c.id}`} type="button"
                              onClick={() => {
                                setSelectedExistingClientId(c.id);
                                setExistingClientSearch(c.name);
                                setIsExistingClientDropdownOpen(false);
                                setOnboardingData((prev) => ({
                                  ...prev,
                                  organisationName: c.company || "",
                                  country:  c.country  || "",
                                  state:    c.state    || "",
                                  currency: c.currency || "INR",
                                  clientStatus:   c.status || "Active",
                                  projectCategory: c.projectCategory || 1,
                                }));
                              }}
                              className={`w-full text-left px-4 py-3 transition-colors ${selectedExistingClientId === c.id ? "bg-slate-100 border-l-4 border-[#18254D]" : "hover:bg-slate-50"}`}
                            >
                              <p className="text-[13px] font-bold text-[#18254D]">{c.name}</p>
                              <p className="text-[11px] text-slate-400 font-medium mt-0.5">{c.email}{c.company ? ` · ${c.company}` : ""}</p>
                            </button>
                          ))}
                        {clients.filter((c) => c.status === "Active" && (!existingClientSearch || c.name?.toLowerCase().includes(existingClientSearch.toLowerCase()))).length === 0 && (
                          <p className="px-4 py-3 text-[12px] text-slate-400 font-bold text-center">No clients found</p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
              {selectedExistingClientId && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Organisation</label>
                    <p className="px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold text-[#18254D] truncate">{onboardingData.organisationName || "—"}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Country</label>
                    <p className="px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold text-[#18254D] truncate">{onboardingData.country || "—"}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Currency</label>
                    <p className="px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold text-[#18254D] truncate">{onboardingData.currency || "—"}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* New Client Fields */}
          {onboardingData.clientType === "New" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-[2px] w-6 bg-slate-300 rounded-full" />
                <h4 className="text-[11px] font-black text-slate-400 tracking-wider uppercase">Client Details</h4>
                <div className="h-[2px] flex-1 bg-slate-100 rounded-full" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Client Name <span className="text-rose-500">*</span></label>
                  <input disabled readOnly type="text" className="w-full px-4 py-2.5 bg-slate-100 text-slate-500 cursor-not-allowed border border-slate-200 rounded-xl text-sm font-semibold outline-none" value={onboardingData.name} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Email <span className="text-rose-500">*</span></label>
                  <input disabled readOnly type="email" className="w-full px-4 py-2.5 bg-slate-100 text-slate-500 cursor-not-allowed border border-slate-200 rounded-xl text-sm font-semibold outline-none" value={onboardingData.email} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Phone <span className="text-rose-500">*</span></label>
                  <input disabled readOnly type="tel" className="w-full px-4 py-2.5 bg-slate-100 text-slate-500 cursor-not-allowed border border-slate-200 rounded-xl text-sm font-semibold outline-none" value={onboardingData.phone} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Organisation Name <span className="text-rose-500">*</span></label>
                  <input type="text" placeholder="e.g. Acme Corp" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200" value={onboardingData.organisationName} onChange={(e) => setOnboardingData({ ...onboardingData, organisationName: e.target.value })} />
                </div>

                <SearchableDropdown
                  label={<span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Client Country <span className="text-rose-500">*</span></span>}
                  required
                  options={countries.map((c) => ({ name: c.name, value: c.name, code: c.code }))}
                  value={onboardingData.country}
                  onChange={(val) => {
                    const selectedCountry = countries.find((c) => c.name === val || c.code === val);
                    const countryCurrency = countryToCurrency[val] || (selectedCountry ? countryToCurrency[selectedCountry.name] : null);
                    setOnboardingData({ ...onboardingData, country: selectedCountry ? selectedCountry.name : val, currency: countryCurrency ? countryCurrency.code : onboardingData.currency, state: "" });
                  }}
                  placeholder="Select Country"
                />

                {countryToStates[onboardingData.country] ? (
                  <SearchableDropdown
                    label={<span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Client State <span className="text-rose-500">*</span></span>}
                    required
                    options={countryToStates[onboardingData.country]}
                    value={onboardingData.state}
                    onChange={(val) => setOnboardingData({ ...onboardingData, state: val })}
                    placeholder="Select State"
                  />
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Client State <span className="text-rose-500">*</span></label>
                    <input type="text" placeholder="e.g. State/Province" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200" value={onboardingData.state} onChange={(e) => setOnboardingData({ ...onboardingData, state: e.target.value })} />
                  </div>
                )}

                <SearchableDropdown
                  label={<span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Client Currency <span className="text-rose-500">*</span></span>}
                  required
                  options={commonCurrencies.map((c) => ({ name: `${c.code} (${c.symbol})`, code: c.code }))}
                  value={onboardingData.currency}
                  onChange={(val) => setOnboardingData({ ...onboardingData, currency: val })}
                  placeholder="Select Currency"
                />

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Client Status <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <button type="button" onClick={() => setIsOnboardClientStatusDropdownOpen(!isOnboardClientStatusDropdownOpen)} className="w-full h-10 flex items-center justify-between px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold shadow-sm hover:border-[#18254D]/30 transition-all text-[#18254D]">
                      <span>{onboardingData.clientStatus}</span>
                      <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isOnboardClientStatusDropdownOpen ? "rotate-180" : ""}`} />
                    </button>
                    {isOnboardClientStatusDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-[80]" onClick={() => setIsOnboardClientStatusDropdownOpen(false)} />
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden z-[90] animate-pop origin-top">
                          <div className="bg-[#18254D] px-4 py-2.5 border-b border-white/10"><p className="text-[10px] font-bold text-white/50 tracking-wider uppercase">Select Status</p></div>
                          {["Active", "Inactive"].map((status) => (
                            <button key={status} type="button" onClick={() => { setOnboardingData({ ...onboardingData, clientStatus: status }); setIsOnboardClientStatusDropdownOpen(false); }} className={`w-full text-left px-4 py-2.5 text-xs font-semibold tracking-wider transition-colors ${onboardingData.clientStatus === status ? "bg-indigo-50 text-indigo-700" : "text-[#18254D] hover:bg-slate-50"}`}>{status}</button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Project Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 pt-2">
              <div className="h-[2px] w-6 bg-slate-300 rounded-full" />
              <h4 className="text-[11px] font-black text-slate-400 tracking-wider uppercase">Project Details</h4>
              <div className="h-[2px] flex-1 bg-slate-100 rounded-full" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Project Name <span className="text-rose-500">*</span></label>
                <input type="text" placeholder="e.g. Website Redesign" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200" value={onboardingData.projectName} onChange={(e) => setOnboardingData({ ...onboardingData, projectName: e.target.value })} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Project Description <span className="text-rose-500">*</span></label>
                <textarea rows={3} placeholder="Brief overview of the project scope..." className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200 resize-none" value={onboardingData.projectDescription} onChange={(e) => setOnboardingData({ ...onboardingData, projectDescription: e.target.value })} />
              </div>

              {/* Category */}
              <div className="col-span-2 space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Project Category <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <button type="button" onClick={() => setIsOnboardCategoryDropdownOpen(!isOnboardCategoryDropdownOpen)} className="w-full h-10 flex items-center justify-between px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold shadow-sm hover:border-[#18254D]/30 transition-all text-[#18254D]">
                    <span>{CATEGORY_MAP[onboardingData.projectCategory] || "Select Category"}</span>
                    <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isOnboardCategoryDropdownOpen ? "rotate-180" : ""}`} />
                  </button>
                  {isOnboardCategoryDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-[80]" onClick={() => setIsOnboardCategoryDropdownOpen(false)} />
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden z-[90] animate-pop origin-top">
                        <div className="bg-[#18254D] px-4 py-2.5 border-b border-white/10"><p className="text-[10px] font-bold text-white/50 tracking-wider uppercase">Select Category</p></div>
                        {[1, 2].map((catId) => (
                          <button key={`cat-${catId}`} type="button" onClick={() => { setOnboardingData({ ...onboardingData, projectCategory: catId }); setIsOnboardCategoryDropdownOpen(false); }} className={`w-full text-left px-4 py-2.5 text-xs font-semibold tracking-wider transition-colors ${onboardingData.projectCategory === catId ? "bg-indigo-50 text-indigo-700" : "text-[#18254D] hover:bg-slate-50"}`}>{CATEGORY_MAP[catId]}</button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Project Status <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <button type="button" onClick={() => setIsOnboardStatusDropdownOpen(!isOnboardStatusDropdownOpen)} className="w-full h-10 flex items-center justify-between px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold shadow-sm hover:border-[#18254D]/30 transition-all text-[#18254D]">
                    <span>{onboardingData.projectStatus}</span>
                    <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isOnboardStatusDropdownOpen ? "rotate-180" : ""}`} />
                  </button>
                  {isOnboardStatusDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-[80]" onClick={() => setIsOnboardStatusDropdownOpen(false)} />
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden z-[90] animate-pop origin-top">
                        <div className="bg-[#18254D] px-4 py-2.5 border-b border-white/10"><p className="text-[10px] font-bold text-white/50 tracking-wider uppercase">Select Status</p></div>
                        {["Hold", "In Progress", "Completed"].map((status) => (
                          <button key={status} type="button" onClick={() => { setOnboardingData({ ...onboardingData, projectStatus: status }); setIsOnboardStatusDropdownOpen(false); }} className={`w-full text-left px-4 py-2.5 text-xs font-semibold tracking-wider transition-colors ${onboardingData.projectStatus === status ? "bg-indigo-50 text-indigo-700" : "text-[#18254D] hover:bg-slate-50"}`}>{status}</button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Priority */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Project Priority <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <button type="button" onClick={() => setIsOnboardPriorityDropdownOpen(!isOnboardPriorityDropdownOpen)} className="w-full h-10 flex items-center justify-between px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold shadow-sm hover:border-[#18254D]/30 transition-all text-[#18254D]">
                    <span>{onboardingData.projectPriority}</span>
                    <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isOnboardPriorityDropdownOpen ? "rotate-180" : ""}`} />
                  </button>
                  {isOnboardPriorityDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-[80]" onClick={() => setIsOnboardPriorityDropdownOpen(false)} />
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden z-[90] animate-pop origin-top">
                        <div className="bg-[#18254D] px-4 py-2.5 border-b border-white/10"><p className="text-[10px] font-bold text-white/50 tracking-wider uppercase">Select Priority</p></div>
                        {["High", "Medium", "Low"].map((level) => (
                          <button key={level} type="button" onClick={() => { setOnboardingData({ ...onboardingData, projectPriority: level }); setIsOnboardPriorityDropdownOpen(false); }} className={`w-full text-left px-4 py-2.5 text-xs font-semibold tracking-wider transition-colors ${onboardingData.projectPriority === level ? "bg-indigo-50 text-indigo-700" : "text-[#18254D] hover:bg-slate-50"}`}>{level}</button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Budget */}
              <div className="col-span-2 space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Project Budget ({onboardingData.currency || "INR"}) <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{commonCurrencies.find((c) => c.code === onboardingData.currency)?.symbol || "₹"}</div>
                  <input type="text" placeholder={onboardingData.currency === "USD" ? "e.g. 5,000" : "e.g. 5,00,000"} className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] placeholder:text-slate-400 focus:bg-white focus:border-[#18254D]/30 focus:ring-4 focus:ring-[#18254D]/5 outline-none transition-all duration-200" value={formatBudget(onboardingData.projectBudget, onboardingData.currency)} onChange={(e) => setOnboardingData({ ...onboardingData, projectBudget: parseBudget(e.target.value) })} />
                </div>
              </div>

              {/* Onboarding Date */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Onboarding Date <span className="text-rose-500">*</span></label>
                <DatePicker value={onboardingData.onboardingDate} onChange={(val) => setOnboardingData({ ...onboardingData, onboardingDate: val })} />
              </div>

              {/* Deadline */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Deadline (Tentative) <span className="text-rose-500">*</span></label>
                <DatePicker value={onboardingData.deadline} onChange={(val) => setOnboardingData({ ...onboardingData, deadline: val })} />
              </div>

              {/* Scope Document */}
              <div className="col-span-2 space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">Scope Document <span className="text-rose-500">*</span></label>
                <div className="relative group">
                  <input
                    required type="file" accept="application/pdf"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        if (file.type !== "application/pdf") { toast.error("Please upload only PDF documents."); e.target.value = ""; return; }
                        setOnboardingData({ ...onboardingData, scopeDocument: file });
                      }
                    }}
                  />
                  <div className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl group-hover:border-[#18254D]/30 group-hover:bg-white transition-all flex items-center gap-3">
                    <div className="p-2 bg-white border border-slate-200 rounded-lg shadow-sm"><Upload size={16} className="text-slate-500" /></div>
                    <span className={`text-sm font-semibold ${onboardingData.scopeDocument ? "text-[#18254D]" : "text-slate-400"}`}>
                      {onboardingData.scopeDocument instanceof File ? onboardingData.scopeDocument.name : "Upload scope document (PDF)"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-[#18254D] text-white rounded-xl text-xs font-bold tracking-wider shadow-lg active:scale-[0.97] transition-all hover:bg-[#1e2e5e] hover:shadow-xl flex items-center justify-center gap-2 group/btn disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting
                ? (<><span>Converting...</span><Loader2 size={16} className="animate-spin" /></>)
                : (<><UserCheck size={14} strokeWidth={2.5} className="group-hover/btn:translate-x-0.5 transition-transform" /><span>Convert to Client</span></>)
              }
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default ConvertToClientModal;
