const fs = require('fs');
const path = require('path');

const leadListPath = path.join(__dirname, 'src/pages/leads/LeadList.jsx');
const leadListContent = fs.readFileSync(leadListPath, 'utf8');

// The modal code is roughly from line 1280 to 1740. I already extracted it.
const modalJSX = fs.readFileSync(path.join(__dirname, 'extractLeadModal.txt'), 'utf8');

// I need to write the wrapper around it
const componentCode = `import React, { useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-hot-toast";
import {
  UserCheck,
  X,
  Search,
  ChevronDown,
  Upload,
  Send,
  Loader2,
} from "lucide-react";
import DatePicker from "../../components/ui/DatePicker";
import SearchableDropdown from "../../components/common/SearchableDropdown";
import { formatBudget, parseBudget } from "../../utils/formatters";
import { countries } from "../../utils/countries";
import {
  countryToCurrency,
  countryToStates,
  commonCurrencies,
} from "../../utils/locationData";
import { CATEGORY_MAP } from "../../constants/categoryConstants";
import { validateForm } from "../../utils/validation";

const ConvertClientModal = ({
  isOpen,
  onClose,
  onSubmit,
  leadId,
  initialData,
  clients = [],
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [onboardingData, setOnboardingData] = useState({
    name: initialData?.name || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    clientType: "New",
    status: "Active",
    projectName: "",
    projectStatus: "In Progress",
    projectCategory: initialData?.projectCategory || 1,
    projectPriority: "High",
    projectDescription: "",
    projectBudget: "",
    country: initialData?.country || "India",
    state: initialData?.state || "",
    currency: initialData?.currency || "INR",
    organisationName: initialData?.company || initialData?.organisationName || "",
    clientStatus: "Active",
    onboardingDate: new Date().toISOString().split("T")[0],
    deadline: "",
    scopeDocument: null,
  });

  const [selectedExistingClientId, setSelectedExistingClientId] = useState(null);
  const [existingClientSearch, setExistingClientSearch] = useState("");
  const [isExistingClientDropdownOpen, setIsExistingClientDropdownOpen] = useState(false);
  const [isOnboardStatusDropdownOpen, setIsOnboardStatusDropdownOpen] = useState(false);
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
        projectName: { required: true, label: "Project Name" },
        projectDescription: { required: true, label: "Project Description" },
        projectCategory: { required: true, label: "Project Category" },
        projectStatus: { required: true, label: "Project Status" },
        projectPriority: { required: true, label: "Project Priority" },
        projectBudget: { required: true, type: "number", label: "Project Budget" },
        onboardingDate: { required: true, label: "Onboarding Date" },
        deadline: { required: true, label: "Deadline Date" },
        scopeDocument: { required: true, label: "Scope Document" },
      });
      if (!isValid) return;
    } else {
      const isValid = validateForm(onboardingData, {
        name: { required: true, minLength: 2, label: "Full Name" },
        email: { required: true, pattern: /^\\S+@\\S+\\.\\S+$/, label: "Email" },
        phone: { required: true, minLength: 10, label: "Phone Number" },
        organisationName: { required: true, label: "Organisation Name" },
        country: { required: true, label: "Client Country" },
        state: { required: true, label: "Client State" },
        currency: { required: true, label: "Client Currency" },
        clientStatus: { required: true, label: "Client Status" },
        projectName: { required: true, label: "Project Name" },
        projectDescription: { required: true, label: "Project Description" },
        projectCategory: { required: true, label: "Project Category" },
        projectStatus: { required: true, label: "Project Status" },
        projectPriority: { required: true, label: "Project Priority" },
        projectBudget: { required: true, type: "number", label: "Project Budget" },
        onboardingDate: { required: true, label: "Onboarding Date" },
        deadline: { required: true, label: "Deadline Date" },
        scopeDocument: { required: true, label: "Scope Document" },
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const showOnboardModal = true;
  const setShowOnboardModal = onClose;

  return (
    <>
      ${modalJSX.replace(/\{showOnboardModal && createPortal\(/, 'createPortal(').replace(/\s*document\.body\n\s*\)}/, '\n        document.body\n      )')}
    </>
  );
};

export default ConvertClientModal;
`;

fs.writeFileSync(path.join(__dirname, 'src/components/clients/ConvertClientModal.jsx'), componentCode);
console.log("Component created.");
