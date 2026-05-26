const fs = require('fs');
const path = require('path');

const detailPath = path.join(__dirname, 'src/pages/clients/ClientDetail.jsx');
let content = fs.readFileSync(detailPath, 'utf8');

// 1. Add states
const stateCode = `  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [onboardingData, setOnboardingData] = useState({
    name: client.name || "",
    email: client.email || "",
    phone: client.phone || "",
    clientType: "New",
    status: "Active",
    projectName: "",
    projectStatus: "Planning",
    projectCategory: client.projectCategory || 1,
    projectPriority: "High",
    projectDescription: "",
    projectBudget: "",
    country: client.country || "India",
    currency: client.currency || "INR",
    clientStatus: "Active",
  });
  const [isOnboardStatusDropdownOpen, setIsOnboardStatusDropdownOpen] = useState(false);
  const [isOnboardPriorityDropdownOpen, setIsOnboardPriorityDropdownOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOnboardSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm(onboardingData, {
      name: { required: true, minLength: 2, label: "Full Name" },
      email: { required: true, pattern: /^\\S+@\\S+\\.\\S+$/, label: "Email" },
      phone: { required: true, minLength: 10, label: "Phone Number" },
      organisationName: { required: true, label: "Organization Name" },
      projectName: { required: true, label: "Project Name" },
      projectBudget: { required: true, type: "number", label: "Project Budget" },
    })) return;

    setIsSubmitting(true);
    try {
      if (onOnboardClient) {
        await onOnboardClient(leadId, onboardingData);
        setShowOnboardModal(false);
      }
    } catch (error) {
      toast.error("Failed to convert lead.");
    } finally {
      setIsSubmitting(false);
    }
  };
`;
content = content.replace('const [editFormData, setEditFormData] = useState({', stateCode + '\n  const [editFormData, setEditFormData] = useState({');

// 2. Change the button onClick
const oldButton = `const confirmConvert = window.confirm("Are you sure you want to convert this lead to an active client?");
                                if (confirmConvert && typeof onOnboardClient === "function") {
                                  onOnboardClient(leadId, {
                                    clientType: "New",
                                    name: client.name,
                                    email: client.email,
                                    phone: client.phone,
                                    country: client.country,
                                    state: client.state,
                                    currency: client.currency,
                                    organisationName: orgName || client.name,
                                    clientStatus: "Active",
                                  });
                                }`;
const newButton = `setShowOnboardModal(true);`;
content = content.replace(oldButton, newButton);

// 3. Add Modal JSX before the final </div>
const modalContent = fs.readFileSync(path.join(__dirname, 'modal_extracted.txt'), 'utf8');
// Remove Existing Client logic from modal
let simplifiedModal = modalContent.replace(/\{onboardingData\.clientType === "Existing Client" \? \([\s\S]*?\) : \(/, '(');
simplifiedModal = simplifiedModal.replace(/\}\s*<\/div>\s*<\/div>\s*<div className="space-y-1\.5">/, '</div></div><div className="space-y-1.5">'); // Clean up end of ternary

// Or instead of complex regex, we can just patch it by adding imports
const finalContent = content.replace('    </div>\n  );\n};\n\nexport default ClientDetail;', `\n      {showOnboardModal && createPortal(\n        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[99999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">\n          <div className="absolute inset-0" onClick={() => setShowOnboardModal(false)} />\n          <div className="relative z-10 bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-pop flex flex-col max-h-[90vh]">\n            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">\n              <div className="flex items-center gap-3">\n                <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100 shadow-sm">\n                  <UserCheck size={16} />\n                </div>\n                <div>\n                  <h3 className="text-base font-bold text-[#18254D] tracking-tight">\n                    Convert to Client\n                  </h3>\n                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-0.5">\n                    Onboard Lead to Active Status\n                  </p>\n                </div>\n              </div>\n              <button\n                onClick={() => setShowOnboardModal(false)}\n                className="p-1.5 hover:bg-slate-200 rounded-xl text-slate-400 transition-all"\n              >\n                <X size={18} />\n              </button>\n            </div>\n\n            <form onSubmit={handleOnboardSubmit} className="p-6 space-y-5 overflow-y-auto custom-scrollbar">\n              <div className="space-y-4">\n                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">\n                  <div className="space-y-1.5">\n                    <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">\n                      Client Name <span className="text-rose-500">*</span>\n                    </label>\n                    <input required type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] focus:bg-white focus:border-[#18254D]/30 outline-none" value={onboardingData.name} onChange={(e) => setOnboardingData({...onboardingData, name: e.target.value})} />\n                  </div>\n                  <div className="space-y-1.5">\n                    <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">\n                      Organisation Name <span className="text-rose-500">*</span>\n                    </label>\n                    <input required type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] focus:bg-white focus:border-[#18254D]/30 outline-none" value={onboardingData.organisationName} onChange={(e) => setOnboardingData({...onboardingData, organisationName: e.target.value})} />\n                  </div>\n                </div>\n                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">\n                  <div className="space-y-1.5">\n                    <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">\n                      Email <span className="text-rose-500">*</span>\n                    </label>\n                    <input required type="email" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] focus:bg-white focus:border-[#18254D]/30 outline-none" value={onboardingData.email} onChange={(e) => setOnboardingData({...onboardingData, email: e.target.value})} />\n                  </div>\n                  <div className="space-y-1.5">\n                    <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">\n                      Phone <span className="text-rose-500">*</span>\n                    </label>\n                    <input required type="tel" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] focus:bg-white focus:border-[#18254D]/30 outline-none" value={onboardingData.phone} onChange={(e) => setOnboardingData({...onboardingData, phone: e.target.value})} />\n                  </div>\n                </div>\n                <hr className="border-slate-100" />\n                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">\n                  <div className="space-y-1.5">\n                    <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">\n                      Project Name <span className="text-rose-500">*</span>\n                    </label>\n                    <input required type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] focus:bg-white focus:border-[#18254D]/30 outline-none" value={onboardingData.projectName} onChange={(e) => setOnboardingData({...onboardingData, projectName: e.target.value})} />\n                  </div>\n                  <div className="space-y-1.5">\n                    <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase ml-1">\n                      Project Budget <span className="text-rose-500">*</span>\n                    </label>\n                    <input required type="number" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#18254D] focus:bg-white focus:border-[#18254D]/30 outline-none" value={onboardingData.projectBudget} onChange={(e) => setOnboardingData({...onboardingData, projectBudget: e.target.value})} />\n                  </div>\n                </div>\n              </div>\n              <div className="pt-2">\n                <button type="submit" disabled={isSubmitting} className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">\n                  {isSubmitting ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><UserCheck size={18} /> Convert to Client</>}\n                </button>\n              </div>\n            </form>\n          </div>\n        </div>,\n        document.body\n      )}\n    </div>\n  );\n};\n\nexport default ClientDetail;`);

// Add imports
if (!content.includes('createPortal')) {
  finalContent = finalContent.replace('import React, { useState, useRef, useEffect } from "react";', 'import React, { useState, useRef, useEffect } from "react";\nimport { createPortal } from "react-dom";');
}

fs.writeFileSync(detailPath, finalContent);
console.log("Updated ClientDetail.jsx with simplified onboard modal.");
