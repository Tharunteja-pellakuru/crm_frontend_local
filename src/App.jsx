



import { useState, useEffect } from "react";
import { Toaster, toast } from "react-hot-toast";
import {
  HashRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useParams,
  useLocation,
} from "react-router-dom";
import { getAuthHeaders, getMultipartAuthHeaders, isAuthenticated, logout } from "./utils/auth";
import Layout from "./layouts/Layout";
import Dashboard from "./pages/dashboard/Dashboard";
import ClientList from "./pages/clients/ClientList";
import ClientDetail from "./pages/clients/ClientDetail";
import LeadList from "./pages/leads/LeadList";
import ProjectBoard from "./pages/projects/ProjectBoard";
import ProjectOverview from "./pages/projects/ProjectOverview";
import EnquiryList from "./pages/enquiries/EnquiryList";
import FollowUpList from "./pages/followups/FollowUpList";
import Settings from "./pages/settings/Settings";
import LoginPage from "./pages/auth/LoginPage";
import {
  MOCK_CLIENTS,
  MOCK_ENQUIRIES,
  MOCK_FOLLOW_UPS,
  MOCK_ACTIVITIES,
  MOCK_PROJECTS,
} from "./constants/mockData";
import { BASE_URL } from "./constants/config";
import {
  CATEGORY_MAP,
  REVERSE_CATEGORY_MAP,
} from "./constants/categoryConstants";
import { countries } from "./utils/countries";
import { extractCountryAndPhone } from "./utils/leadUtils";

// Simple wrapper for client detail pages
function ClientDetailWrapper({
  clients,
  type,
  activities,
  followUps,
  onUpdateClient,
  onAddActivity,
  onAddFollowUp, // Added this prop
  onSelectProject,
  projects,
  loading,
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  if (loading) {
    return (
      <div className="w-full flex items-center justify-center h-[calc(100vh-100px)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <p className="text-sm text-slate-500">Loading details...</p>
        </div>
      </div>
    );
  }

  const client = clients.find(
    (c) => c.id == id || c.lead_id == id || c.client_id == id,
  );

  if (!client) return <Navigate to={`/${type}`} replace />;

  return (
    <ClientDetail
      client={client}
      onBack={() => navigate(`/${type}`)}
      onUpdateClient={onUpdateClient}
      onAddActivity={onAddActivity}
      onAddFollowUp={onAddFollowUp} // Passed this prop
      activities={activities}
      followUps={followUps}
      initialTab={location.state?.tab || "overview"}
      onSelectProject={onSelectProject}
      projects={projects}
    />
  );
}

// Simple wrapper for project overview
function ProjectOverviewWrapper({
  projects,
  clients,
  followUps,
  activities,
  onUpdateProject,
  onAddActivity,
  onAddFollowUp,
  loading,
}) {
  const { id } = useParams();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center h-[calc(100vh-100px)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <p className="text-sm text-slate-500">Loading project...</p>
        </div>
      </div>
    );
  }

  const project = projects.find((p) => p.id == id);

  if (!project) return <Navigate to="/projects" replace />;

  return (
    <ProjectOverview
      project={project}
      client={clients.find((c) => c.id == project.clientId || c.client_id == project.clientId)}
      onBack={() => navigate("/projects")}
      onUpdateProject={onUpdateProject}
      onAddActivity={onAddActivity}
      onAddFollowUp={onAddFollowUp}
      followUps={followUps}
      activities={activities}
    />
  );
}

// Main App Routes
function AppRoutes() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    // Check for both user and token
    const user = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    return !!(user && token);
  });

  // Data states
  const [clients, setClients] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [activities, setActivities] = useState([]);
  const [projects, setProjects] = useState([]);
  const [aiModels, setAiModels] = useState([]);
  const [leads, setLeads] = useState([]);
  
  const [leadsLoading, setLeadsLoading] = useState(true);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [followUpsLoading, setFollowUpsLoading] = useState(true);

  // --- Reusable refresh helpers ---
  // Extracts only the +XX dial code from any string (e.g. "India (+91)" → "+91", "91" → "+91")
  const sanitizeDialCode = (raw) => {
    if (!raw) return "";
    const str = String(raw).trim();
    if (/^\+\d{1,4}$/.test(str)) return str;          // already clean: "+91"
    const match = str.match(/(\+\d{1,4})/);
    if (match) return match[1];                        // extract from "India (+91)"
    if (/^\d{1,4}$/.test(str)) return `+${str}`;     // bare digits: "91" → "+91"
    return "";
  };

  const refreshLeads = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/get-leads`, { headers: getAuthHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      const leadsArray = Array.isArray(data) ? data : data.leads || [];
      const transformedLeads = leadsArray.map((lead) => {
        const { countryCode: autoCode, countryName: autoName } = extractCountryAndPhone(
          lead.phone_number, lead.client_country || lead.country, countries
        );
        return {
          id: lead.lead_id?.toString() || lead.uuid,
          lead_id: lead.lead_id?.toString() || lead.uuid,
          name: lead.full_name || "Unknown",
          company: lead.client_organisation || lead.organisation_name || lead.company || lead.website_url?.replace(/^https?:\/\//, "").split("/")[0] || "",
          organisation_name: lead.client_organisation || lead.organisation_name || lead.company || "",
          email: lead.email || "",
          phone: lead.phone_number || "",
          country_code: lead.country_code || autoCode || "",
          isConverted: lead.lead_status === "Converted" || !!lead.client_organisation,
          status:
            lead.lead_status === "Dismissed"
              ? "Dismissed"
              : lead.lead_status === "Converted" || !!lead.client_organisation
              ? "Converted"
              : "Lead",
          leadType: (() => {
            const isConverted = lead.lead_status === "Converted" || !!lead.client_organisation;
            if (isConverted) {
              return lead.lead_status === "Converted"
                ? (leads.find((l) => l.lead_id == (lead.lead_id?.toString() || lead.uuid))?.leadType || "Converted")
                : lead.lead_status || "Converted";
            }
            return lead.lead_status || "Warm";
          })(),
          projectCategory: typeof lead.lead_category === 'string'
            ? (REVERSE_CATEGORY_MAP[lead.lead_category] || parseInt(lead.lead_category, 10) || 1)
            : (lead.lead_category || 1),
          industry: typeof lead.lead_category === 'string'
            ? (REVERSE_CATEGORY_MAP[lead.lead_category] || parseInt(lead.lead_category, 10) || 1)
            : (lead.lead_category || 1),
          website: lead.website_url || "",
          country: lead.client_country || lead.country || autoName || "",
          state: lead.client_state || lead.state || "",
          notes: lead.message || "",
          joinedDate: lead.created_at ? lead.created_at.split("T")[0] : new Date().toISOString().split("T")[0],
          lastContact: lead.updated_at ? lead.updated_at.split("T")[0] : new Date().toISOString().split("T")[0],
          avatar: `https://picsum.photos/100/100?random=${lead.lead_id || Math.floor(Math.random() * 100)}`,
          enquiry_id: lead.enquiry_id,
        };
      });
      setLeads(transformedLeads);
      const pendingLeads = transformedLeads.filter((l) => l.status === "Lead" || l.status === "Dismissed");
      setClients((prev) => {
        const nonLeads = prev.filter((c) => c.status !== "Lead" && c.status !== "Dismissed");
        return [...nonLeads, ...pendingLeads];
      });
    } catch (e) {
      console.error("[REFRESH] Failed to refresh leads:", e);
    }
  };

  const refreshProjects = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/get-projects`, { headers: getAuthHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      const transformedProjects = data.map((p) => ({
        id: p.project_id.toString(),
        clientId: p.client_id.toString(),
        name: p.project_name,
        description: p.project_description,
        status: p.project_status,
        budget: p.project_budget,
        deadline: p.deadline_date?.split("T")[0],
        onboardingDate: p.onboarding_date?.split("T")[0],
        priority: p.project_priority,
        category: typeof p.project_category === 'string'
          ? (REVERSE_CATEGORY_MAP[p.project_category] || parseInt(p.project_category, 10) || 1)
          : (p.project_category || 1),
        scopeDocument: p.scope_document,
        updatedAt: p.updated_at?.split("T")[0],
        progress: 0,
      }));
      setProjects(transformedProjects);
    } catch (e) {
      console.error("[REFRESH] Failed to refresh projects:", e);
    }
  };

  const refreshClients = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/get-clients`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) return;
      const data = await res.json();
      const transformedClients = data.map((c) => ({
        id: c.id?.toString() || c.client_id?.toString(),
        name: c.name || c.client_name,
        company: c.organisation_name || c.organisation || c.company || "",
        organisation_name: c.organisation_name || c.organisation || c.company || "",
        email: c.email || "",
        phone: c.phone || "",
        country_code: c.country_code || "",
        status: c.status || c.client_status || "Active",
        projectCategory: typeof (c.projectCategory || c.project_category) === 'string'
            ? (REVERSE_CATEGORY_MAP[c.projectCategory || c.project_category] || parseInt((c.projectCategory || c.project_category), 10) || 1)
            : (c.projectCategory || c.project_category || 1),
        briefMessage: c.brief_message || "",
        notes: c.brief_message || "",
        website: c.website || c.website_url || "",
        country: c.client_country || c.country || "India",
        state: c.client_state || c.state || "",
        currency: c.client_currency || c.currency || "INR",
        lead_id: c.lead_id,
        isConverted: !!c.lead_id,
        avatar: `https://picsum.photos/100/100?random=${c.client_id || c.id}`,
        joinedDate: c.created_at?.split("T")[0] || new Date().toISOString().split("T")[0],
        lastContact: c.updated_at?.split("T")[0] || new Date().toISOString().split("T")[0],
      }));
      setClients((prev) => {
        const leads = prev.filter(
          (c) => c.status === "Lead" || c.status === "Dismissed",
        );
        return [...transformedClients, ...leads];
      });
    } catch (e) {
      console.error("[REFRESH] Failed to refresh clients:", e);
    }
  };
  // --- End refresh helpers ---

  // Fetch AI models on mount
  useEffect(() => {
    if (!isLoggedIn) return;

    fetch(`${BASE_URL}/api/ai-models`, {
      headers: getAuthHeaders(),
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setAiModels(
          data.map((m) => ({
            aimodel_id: m.aimodel_id,
            name: m.name,
            provider: m.provider,
            modelId: m.model_id,
            apiKey: m.api_key,
            isDefault: m.is_default,
          })),
        );
      })
      .catch(() => console.log("Failed to fetch AI models"));
  }, [isLoggedIn]);

  // Fetch leads from API on mount
  useEffect(() => {
    if (!isLoggedIn) {
      setLeads([]);
      setLeadsLoading(false);
      return;
    }

    setLeadsLoading(true);
    fetch(`${BASE_URL}/api/get-leads`, {
      headers: getAuthHeaders(),
    })
      .then((res) => {
        if (res.status === 401) {
          // Token invalid or expired
          handleLogout();
          return null;
        }
        return res.ok ? res.json() : [];
      })
      .then((data) => {
        if (!data) return;

        // Extract leads array from response
        const leadsArray = Array.isArray(data) ? data : data.leads || [];
        console.log("Raw leads data fetched:", leadsArray);

        // Transform API data to match component expected format
        const transformedLeads = leadsArray.map((lead) => {
          const { countryCode: autoCode, countryName: autoName } = extractCountryAndPhone(
            lead.phone_number,
            lead.client_country || lead.country,
            countries
          );
          
          return {
            id: lead.lead_id?.toString() || lead.uuid,
            lead_id: lead.lead_id?.toString() || lead.uuid,
            name: lead.full_name || "Unknown",
            company: lead.client_organisation || lead.organisation_name || lead.company || lead.website_url?.replace(/^https?:\/\//, "").split("/")[0] || "",
            organisation_name: lead.client_organisation || lead.organisation_name || lead.company || "",
            email: lead.email || "",
            phone: lead.phone_number || "",
            country_code: lead.country_code || autoCode || "",
            status: lead.lead_status === "Dismissed" ? "Dismissed" : (lead.lead_status === "Converted" ? "Converted" : "Lead"),
            isConverted: lead.lead_status === "Converted",
            leadType: lead.lead_status || "Warm",
            projectCategory: typeof lead.lead_category === 'string' 
              ? (REVERSE_CATEGORY_MAP[lead.lead_category] || parseInt(lead.lead_category, 10) || 1) 
              : (lead.lead_category || 1),
            industry: typeof lead.lead_category === 'string' 
              ? (REVERSE_CATEGORY_MAP[lead.lead_category] || parseInt(lead.lead_category, 10) || 1) 
              : (lead.lead_category || 1),
            website: lead.website_url || "",
            country: lead.client_country || lead.country || autoName || "",
            state: lead.client_state || lead.state || "",
            notes: lead.message || "",
            joinedDate: lead.created_at
              ? lead.created_at.split("T")[0]
              : new Date().toISOString().split("T")[0],
            lastContact: lead.updated_at
              ? lead.updated_at.split("T")[0]
              : new Date().toISOString().split("T")[0],
            avatar: `https://picsum.photos/100/100?random=${lead.lead_id || Math.floor(Math.random() * 100)}`,
            enquiry_id: lead.enquiry_id,
          };
        });

        setLeads(transformedLeads);

        // Only add non-converted leads to clients state.
        // Converted leads already exist in crm_tbl_clients with correct org data.
        // Adding them here (with website_url as company) would overwrite correct data.
        const pendingLeads = transformedLeads.filter(
          (l) => l.status === "Lead" || l.status === "Dismissed"
        );
        setClients((prev) => {
          const nonLeads = prev.filter(
            (c) => c.status !== "Lead" && c.status !== "Dismissed",
          );
          return [...nonLeads, ...pendingLeads];
        });

        setLeadsLoading(false);
      })
      .catch(() => {
        console.log("Failed to fetch leads");
        setLeads([]);
        setLeadsLoading(false);
      });
  }, [isLoggedIn]);

  // Fetch followups on mount
  useEffect(() => {
    if (!isLoggedIn) {
      setFollowUps([]);
      setFollowUpsLoading(false);
      return;
    }

    setFollowUpsLoading(true);
    fetch(`${BASE_URL}/api/get-followups`, {
      headers: getAuthHeaders(),
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setFollowUps(data);
        setFollowUpsLoading(false);
      })
      .catch(() => {
        console.log("Failed to fetch followups");
        setFollowUps([]);
        setFollowUpsLoading(false);
      });
  }, [isLoggedIn]);

  // Fetch clients from API
  useEffect(() => {
    if (!isLoggedIn) {
      setClients([]);
      setClientsLoading(false);
      return;
    }

    setClientsLoading(true);
    refreshClients().finally(() => setClientsLoading(false));
  }, [isLoggedIn]);

  // Fetch enquiries from API
  useEffect(() => {
    if (!isLoggedIn) {
      setEnquiries([]);
      return;
    }

    fetch(`${BASE_URL}/api/get-enquiries`, {
      headers: getAuthHeaders(),
    })
      .then((res) => (res.ok ? res.json() : { enquiries: [] }))
      .then((data) => {
        const transformedEnquiries = data.enquiries.map((e) => ({
          id: e.enquiry_id || e.uuid,
          name: e.full_name,
          email: e.email,
          phone: e.phone_number,
          website: e.website_url,
          message: e.message,
          status: e.status?.toLowerCase() || "new",
          remarks: e.remarks || "",
          holdReason: e.remarks || "",
          date: e.created_at || new Date().toISOString(),
        }));
        setEnquiries(transformedEnquiries);
      })
      .catch(() => console.log("Failed to fetch enquiries"));
  }, [isLoggedIn]);

  // Fetch projects from API
  useEffect(() => {
    if (!isLoggedIn) {
      setProjects([]);
      setProjectsLoading(false);
      return;
    }

    setProjectsLoading(true);
    fetch(`${BASE_URL}/api/get-projects`, {
      headers: getAuthHeaders(),
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        const transformedProjects = data.map((p) => ({
          id: p.project_id.toString(),
          clientId: p.client_id.toString(),
          name: p.project_name,
          description: p.project_description,
          status: p.project_status,
          budget: p.project_budget,
          deadline: p.deadline_date?.split("T")[0],
          onboardingDate: p.onboarding_date?.split("T")[0],
          priority: p.project_priority,
          category: typeof p.project_category === 'string'
              ? (REVERSE_CATEGORY_MAP[p.project_category] || parseInt(p.project_category, 10) || 1)
              : (p.project_category || 1),
          scopeDocument: p.scope_document,
          updatedAt: p.updated_at?.split("T")[0],
          progress: 0, // Calculate or add to table if needed
        }));
        setProjects(transformedProjects);
        setProjectsLoading(false);
      })
      .catch(() => {
        console.log("Failed to fetch projects");
        setProjects([]);
        setProjectsLoading(false);
      });
  }, [isLoggedIn]);

  // Simple handlers
  function handleLogin(data) {
    // Store both user and token
    localStorage.setItem("user", JSON.stringify(data.user));
    if (data.token) {
      localStorage.setItem("token", data.token);
    }
    setIsLoggedIn(true);
    navigate("/dashboard");
  }

  function handleLogout() {
    logout(); // Clear localStorage
    setIsLoggedIn(false); // Update React state
    toast.success("Logged out successfully");
  }

  function handleClientSelect(client, tab = "overview") {
    // If it's a converted lead, we should redirect to the associated client detail page
    if (client.isConverted) {
      const associatedClient = clients.find((c) => c.lead_id == client.lead_id);
      if (associatedClient) {
        navigate(`/clients/${associatedClient.id}`, { state: { tab } });
        return;
      }
    }

    // Both active leads and dismissed leads should use the "leads" route
    const route =
      client.status === "Lead" || client.status === "Dismissed"
        ? "leads"
        : "clients";
    navigate(`/${route}/${client.lead_id || client.id}`, { state: { tab } });
  }

  async function handleDeleteClient(id) {
    try {
      console.log("Deleting client:", id);

      const res = await fetch(`${BASE_URL}/api/delete-client/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (res.ok) {
        toast.success("Client deleted successfully!");
        
        // Remove from clients list
        setClients((prev) => prev.filter((c) => c.id != id));

        // Also remove any projects associated with this client
        setProjects((prev) => prev.filter((p) => p.clientId != id));
      } else {
        const errorData = await res.json();
        console.error("Failed to delete client:", errorData);
        toast.error(errorData.message || "Failed to delete client. Please try again.");
      }
    } catch (e) {
      console.error("Error deleting client:", e);
      toast.error("An error occurred while deleting client.");
    }
  }

  async function handleDeleteLead(id) {
    try {
      // Find the lead to get its ID
      const leadToDelete = leads.find((l) => l.lead_id == id);
      if (!leadToDelete) return;

      console.log("Deleting lead:", id);

      // Call API to delete the lead - use correct endpoint with ID in path
      const res = await fetch(`${BASE_URL}/api/delete-lead/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      console.log("Delete API response status:", res.status);

      if (res.ok) {
        const result = await res.json();
        console.log("Lead deleted successfully:", result);

        // Remove from local state after successful API call
        setLeads((prev) => prev.filter((l) => l.lead_id != id));

        // Also update clients array and enquiries array to keep them in sync
        setClients((prev) => prev.filter((c) => (c.lead_id || c.id) != id));
        if (leadToDelete.enquiry_id) {
          setEnquiries((prev) => prev.filter((e) => e.id != leadToDelete.enquiry_id));
        }
      } else {
        const errorData = await res.json();
        console.error("Failed to delete lead:", errorData);
        toast.error("Failed to delete lead. Please try again.");
      }
    } catch (e) {
      console.error("Error deleting lead:", e);
      toast.error("An error occurred while deleting lead.");
    }
  }

  async function handleAddClient(data) {
    if (data.status === "Lead") {
      try {
        const payload = {
          full_name: data.name,
          phone_number: data.phone,
          email: data.email,
          lead_status: data.leadType || "Warm",
          message: data.notes || "",
          website_url: data.website || "",
          country: data.country || "",
          country_code: data.countryCode || "",
          enquiry_id: data.enquiry_id || null,
        };

        const res = await fetch(`${BASE_URL}/api/add-lead`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const result = await res.json();
          const newLead = {
            id:
              result.lead?.lead_id?.toString() ||
              result.lead?.uuid ||
              `new-${Date.now()}`,
            lead_id: result.lead?.lead_id?.toString() || result.lead?.uuid,
            name: result.lead?.full_name || data.name,
            company: result.lead?.website_url
              ? result.lead.website_url
                  .replace(/^https?:\/\//, "")
                  .split("/")[0]
              : "",
            email: result.lead?.email || data.email,
            phone: result.lead?.phone_number || data.phone,
            status: "Lead",
            isConverted: result.lead?.lead_status === "Converted",
            leadType: result.lead?.lead_status || data.leadType || "Warm",
            projectCategory: data.projectCategory || 1,
            industry: data.projectCategory || 1,
            country: result.lead?.country || data.country || "",
            country_code: result.lead?.country_code || data.countryCode || "",
            state: result.lead?.state || data.state || "",
            currency: result.lead?.currency || data.currency || "",
            website: result.lead?.website_url || data.website || "",
            notes: result.lead?.message || data.notes || "",
            joinedDate: result.lead?.created_at
              ? result.lead.created_at.split("T")[0]
              : new Date().toISOString().split("T")[0],
            lastContact: result.lead?.updated_at
              ? result.lead.updated_at.split("T")[0]
              : new Date().toISOString().split("T")[0],
            avatar: `https://picsum.photos/100/100?random=${result.lead?.lead_id || Date.now() % 100}`,
            enquiry_id: result.lead?.enquiry_id || data.enquiry_id,
          };

          setLeads([newLead, ...leads]);
          setClients([newLead, ...clients]);
          return newLead;
        } else {
          console.error("Failed to add lead:", await res.json());
          toast.error("Failed to add lead. Please try again.");
          return null;
        }
      } catch (err) {
        console.error("Error adding lead:", err);
        toast.error("An error occurred while adding lead.");
        return null;
      }
    } else {
      try {
        const payload = {
          organisation_name: data.organisationName || data.projectName || data.company || "",
          client_name: data.name,
          client_country: data.country || "",
          client_state: data.state || "",
          client_currency: data.currency || "",
          client_status: data.clientStatus || "Active",
          lead_id: data.lead_id || null, // Optional if adding directly
        };

        const res = await fetch(`${BASE_URL}/api/add-client`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const result = await res.json();
          const createdClient = result.client;
          const newClient = {
            id: createdClient.client_id.toString(),
            name: createdClient.client_name,
            company: createdClient.organisation_name,
            email: data.email || "",
            phone: data.phone || "",
            status: "Active",
            country: createdClient.client_country,  
            state: createdClient.client_state,
            currency: createdClient.client_currency,
            lead_id: createdClient.lead_id, // Ensure lead_id is present
            avatar: `https://picsum.photos/100/100?random=${createdClient.client_id}`,
            joinedDate: createdClient.created_at?.split("T")[0] || new Date().toISOString().split("T")[0],
            lastContact: new Date().toISOString().split("T")[0],
          };

          setClients([newClient, ...clients]);
          return newClient;
        } else {
          console.error("Failed to add client:", await res.json());
          toast.error("Failed to add client. Please try again.");
          return null;
        }
      } catch (err) {
        console.error("Error adding client:", err);
        toast.error("An error occurred while adding client.");
        return null;
      }
    }
  }

  async function handleOnboardClient(id, data) {
    try {
      const formData = new FormData();
      // Client details
      formData.append("organisation_name", data.organisationName || data.projectName || "");
      formData.append("client_name", data.name);
      formData.append("client_country", data.country || "");
      formData.append("client_state", data.state || "");
      formData.append("client_currency", data.currency || "");
      formData.append("client_status", data.clientStatus || "Active");
      formData.append("lead_id", id);

      // Project details
      if (data.projectName) {
        formData.append("project_name", data.projectName);
        formData.append("project_description", data.projectDescription || "");
        formData.append("project_category", data.projectCategory || 1);
        formData.append("project_status", data.projectStatus || "In Progress");
        formData.append("project_priority", data.projectPriority || "High");
        formData.append("project_budget", parseInt(data.projectBudget) || 0);
        formData.append("onboarding_date", data.onboardingDate || new Date().toISOString().split("T")[0]);
        formData.append("deadline_date", data.deadline || "");
        
        if (data.scopeDocument instanceof File) {
          formData.append("scope_document", data.scopeDocument);
        }
      }

      const res = await fetch(`${BASE_URL}/api/convert-lead`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to convert lead");
      }

      const result = await res.json();
      const newClient = result.client;
      const newProjectData = result.project; // Note: My backend doesn't return the project yet, let me fix it in the next step or adjust here.
      // Actually, I should probably return both from the backend.

      // Transform new client to match frontend format
      const transformedClient = {
        id: newClient.client_id.toString(),
        name: newClient.client_name,
        email: data.email || "",
        phone: data.phone || "",
        status: "Active",
        company: newClient.organisation_name,
        country: newClient.client_country || data.country || "",
        state: newClient.client_state || data.state || "",
        currency: newClient.client_currency || data.currency || "",
        avatar: `https://picsum.photos/100/100?random=${newClient.client_id}`,
        joinedDate: newClient.created_at?.split("T")[0] || new Date().toISOString().split("T")[0],
        lastContact: new Date().toISOString().split("T")[0],
        isConverted: true,
        leadType: "Converted",
        lead_id: id,
        industry: data.projectCategory || 1,
        projectCategory: data.projectCategory || 1,
        notes: data.projectDescription || data.notes || "",
      };

      // Update clients state
      setClients((prev) => [transformedClient, ...prev]);

      // If project was created, update projects state
      // (Even if backend didn't return it yet, we can refetch or optimistically add)
      // For now, I'll update the backend to return the project too.
      if (data.projectName) {
        // We'll refetch projects to get the latest DB state including the new project
        fetch(`${BASE_URL}/api/get-projects`, {
          headers: getAuthHeaders(),
        })
          .then((res) => (res.ok ? res.json() : []))
          .then((data) => {
            const transformedProjects = data.map((p) => ({
              id: p.project_id.toString(),
              clientId: p.client_id.toString(),
              name: p.project_name,
              description: p.project_description,
              status: p.project_status,
              budget: p.project_budget,
              deadline: p.deadline_date?.split("T")[0],
              onboardingDate: p.onboarding_date?.split("T")[0],
              priority: p.project_priority,
              category: typeof p.project_category === 'string'
                ? (REVERSE_CATEGORY_MAP[p.project_category] || parseInt(p.project_category, 10) || 1)
                : (p.project_category || 1),
              scopeDocument: p.scope_document,
              progress: 0,
            }));
            setProjects(transformedProjects);
          });
      }

      // Update leads state to mark as converted
      setLeads((prev) =>
        prev.map((c) =>
          c.lead_id == id ? { ...transformedClient, lead_id: c.lead_id, status: "Converted" } : c,
        ),
      );

      toast.success("Lead onboarded successfully!");
      return { success: true };
    } catch (error) {
      console.error("Conversion error:", error);
      toast.error(error.message || "Failed to convert lead to client");
      return { success: false };
    }
  }

  async function handleUpdateClient(id, data) {
    try {
      const res = await fetch(`${BASE_URL}/api/update-client/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          organisation_name: data.organisationName,
          client_name: data.name,
          client_country: data.country,
          client_state: data.state,
          client_currency: data.currency,
          client_status: data.clientStatus,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update client");
      }

      // Update local state after successful API call
      setClients((prev) => prev.map((c) => (c.id == id ? { ...c, ...data } : c)));
      toast.success("Client updated successfully");
    } catch (error) {
      console.error("Update client error:", error);
      toast.error(error.message || "Failed to update client");
      throw error;
    }
  }

  async function handleUpdateConvertedLead(id, data) {
    try {
      // 1. Find the existing lead to preserve its current status/state
      const existingLead = leads.find((l) => l.lead_id == id || l.id == id);
      if (!existingLead) throw new Error("Lead not found");

      // 2. Update Lead Details (Name, Email, Phone, Country)
      // IMPORTANT: lead_status must ALWAYS stay "Converted" for converted leads.
      // The leadType (Hot/Warm/Cold) is a visual sub-label stored in frontend state only.
      const leadPayload = {
        full_name: data.name || existingLead.name,
        email: data.email || existingLead.email,
        phone_number: data.phone || existingLead.phone,
        country: data.country || existingLead.country || "",
        country_code: data.countryCode || existingLead.countryCode || "",
        lead_status: data.leadType || existingLead.leadType || "Converted",
        website_url: data.website || existingLead.website || "",
        message: data.projectDescription || data.notes || existingLead.notes || "",
      };

      const leadRes = await fetch(`${BASE_URL}/api/update-lead/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(leadPayload),
      });

      if (!leadRes.ok) {
        const errorData = await leadRes.json();
        throw new Error(errorData.message || "Failed to update lead details");
      }

      const updatedDataFromServer = await leadRes.json();
      const revisedLead = updatedDataFromServer.lead;

      if (!revisedLead) throw new Error("No lead data returned from server");

      // 3. Update local states — map backend column names to frontend property names
      const visualLeadType = data.leadType || existingLead.leadType || "Converted";
      const updatedCategory = data.projectCategory || existingLead.projectCategory || 1;

      // Update Leads
      setLeads((prev) =>
        prev.map((l) =>
          (l.lead_id == id || l.id == id)
            ? { 
                ...l, 
                ...revisedLead,
                name: revisedLead.full_name || l.name,
                phone: revisedLead.phone_number || l.phone,
                notes: revisedLead.message || l.notes,
                projectCategory: updatedCategory,
                industry: updatedCategory,
                leadType: visualLeadType,
                isConverted: true,
                status: "Converted",
              }
            : l,
        ),
      );

      // Also update Clients
      setClients((prev) =>
        prev.map((c) =>
          c.lead_id == id
            ? {
                ...c,
                organisation_name: data.organisationName || c.organisation_name,
                projectCategory: updatedCategory,
                industry: updatedCategory,
              }
            : c,
        ),
      );

      // Also update Projects
      setProjects((prev) =>
        prev.map((p) => {
          const associatedClient = clients.find(cl => cl.id == p.clientId);
          if (associatedClient && associatedClient.lead_id == id) {
             return { ...p, category: updatedCategory };
          }
          return p;
        })
      );

      // Re-fetch both leads and projects from server to ensure full UI sync
      await refreshLeads();
      await refreshProjects();

      // Sync Clients state (if this is a converted lead, it exists in both lists)
      setClients((prev) =>
        prev.map((c) =>
          c.lead_id == id
            ? { 
                ...c, 
                ...revisedLead,
                name: revisedLead.full_name || c.name,
                phone: revisedLead.phone_number || c.phone,
                projectCategory: updatedCategory,
                industry: updatedCategory,
                leadType: visualLeadType,
              }
            : c,
        ),
      );

      // Sync category to projects state: lead -> client -> project(s)
      if (updatedCategory) {
        const associatedClient = clients.find((c) => c.lead_id == id);
        if (associatedClient) {
          setProjects((prev) =>
            prev.map((p) =>
              p.clientId == associatedClient.id
                ? { ...p, category: updatedCategory }
                : p,
            ),
          );
        }
      }

      toast.success("Lead updated successfully!");
      return { success: true };
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update lead: " + error.message);
      return { success: false };
    }
  }

  async function handleDismissLead(id) {
    try {
      // Find the lead to update
      const leadToUpdate = leads.find((l) => l.lead_id == id);
      if (!leadToUpdate) return;

      console.log("Dismissing lead:", id);

      // Call API to update lead status - use correct endpoint with ID in path
      const res = await fetch(`${BASE_URL}/api/update-lead/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          full_name: leadToUpdate.name,
          phone_number: leadToUpdate.phone,
          email: leadToUpdate.email,
          lead_status: "Dismissed",
          message: leadToUpdate.notes,
          website_url: leadToUpdate.website || "",
          country_code: leadToUpdate.country_code || "",
        }),
      });

      console.log("Dismiss API response status:", res.status);

      if (res.ok) {
        const result = await res.json();
        console.log("Lead dismissed successfully:", result);

        const dismissedLead = {
          ...leadToUpdate,
          lead_id: result.lead?.lead_id?.toString() || id.toString(),
          name: result.lead?.full_name || leadToUpdate.name,
          company: result.lead?.website_url
            ? result.lead.website_url.replace(/^https?:\/\//, "").split("/")[0]
            : leadToUpdate.company || "",
          email: result.lead?.email || leadToUpdate.email,
          phone: result.lead?.phone_number || leadToUpdate.phone,
          status: "Dismissed",
          leadType: result.lead?.lead_status || "Dismissed",
          projectCategory: leadToUpdate.projectCategory,
          industry: leadToUpdate.industry || 1,
          website: result.lead?.website_url || leadToUpdate.website,
          notes: result.lead?.message || leadToUpdate.notes,
          country: result.lead?.country || leadToUpdate.country || "",
          country_code: result.lead?.country_code || leadToUpdate.country_code || "",
        };

        console.log("Transformed dismissed lead:", dismissedLead);

        // Update local state after successful API call with complete data
        setLeads((prev) => prev.map((l) => (l.lead_id == id ? dismissedLead : l)));

        // Also update clients array to keep them in sync
        setClients((prev) => prev.map((c) => (c.lead_id == id ? dismissedLead : c)));
        toast.success("Lead dismissed successfully.");
      } else {
        const errorData = await res.json();
        console.error("Failed to dismiss lead:", errorData);
        toast.error("Failed to dismiss lead. Please try again.");
      }
    } catch (e) {
      console.error("Error dismissing lead:", e);
      toast.error("An error occurred while dismissing lead.");
    }
  }

  async function handleRestoreLead(id) {
    try {
      // Find the lead to update
      const leadToUpdate = leads.find((l) => l.lead_id == id);
      if (!leadToUpdate) return;

      console.log("Restoring lead:", id);

      // Call API to update lead status back to Warm (Pending)
      // Send all required fields to preserve lead data
      const res = await fetch(`${BASE_URL}/api/update-lead/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          full_name: leadToUpdate.name,
          phone_number: leadToUpdate.phone,
          email: leadToUpdate.email,
          lead_status: "Warm",
          message: leadToUpdate.notes,
          website_url: leadToUpdate.website || "",
          country_code: leadToUpdate.country_code || "",
        }),
      });

      console.log("Restore API response status:", res.status);

      if (res.ok) {
        const result = await res.json();
        const restoredLead = {
          ...leadToUpdate,
          lead_id: result.lead?.lead_id?.toString() || id.toString(),
          name: result.lead?.full_name || leadToUpdate.name,
          company: result.lead?.website_url
            ? result.lead.website_url.replace(/^https?:\/\//, "").split("/")[0]
            : leadToUpdate.company || "",
          email: result.lead?.email || leadToUpdate.email,
          phone: result.lead?.phone_number || leadToUpdate.phone,
          status: "Lead",
          leadType: result.lead?.lead_status || "Warm",
          projectCategory: leadToUpdate.projectCategory,
          industry: leadToUpdate.industry || 1,
          website: result.lead?.website_url || leadToUpdate.website,
          notes: result.lead?.message || leadToUpdate.notes,
          country: result.lead?.country || leadToUpdate.country || "",
          country_code: result.lead?.country_code || leadToUpdate.country_code || "",
          isConverted: false,
        };

        // Update local state after successful API call
        setLeads((prev) => prev.map((l) => (l.lead_id == id ? restoredLead : l)));
        setClients((prev) => prev.map((c) => (c.lead_id == id ? restoredLead : c)));
        toast.success("Lead restored successfully.");
      } else {
        const errorData = await res.json();
        console.error("Failed to restore lead:", errorData);
        toast.error("Failed to restore lead. Please try again.");
      }
    } catch (e) {
      console.error("Error restoring lead:", e);
      toast.error("An error occurred while restoring lead.");
    }
  }

  async function handleEditLead(id, editData) {
    try {
      // Find the lead to update
      const leadToUpdate = leads.find((l) => l.lead_id == id);
      if (!leadToUpdate) return;

      // 1. Calculate the expected new state (Optimistic Update)
      const websiteValue =
        editData.website !== undefined && editData.website !== null
          ? editData.website
          : leadToUpdate.website || "";
      const newCompany = websiteValue
        ? websiteValue.replace(/^https?:\/\//, "").split("/")[0]
        : "";

      const optimisticLead = {
        ...leadToUpdate,
        name:
          editData.name !== undefined && editData.name !== null
            ? editData.name
            : leadToUpdate.name,
        company: editData.organisationName || newCompany,
        email:
          editData.email !== undefined && editData.email !== null
            ? editData.email
            : leadToUpdate.email,
        phone:
          editData.phone !== undefined && editData.phone !== null
            ? editData.phone
            : leadToUpdate.phone,
        leadType:
          editData.leadType !== undefined && editData.leadType !== null
            ? editData.leadType
            : leadToUpdate.leadType,
        isConverted:
          editData.leadType !== undefined
            ? editData.leadType === "Converted"
            : leadToUpdate.isConverted,
        projectCategory:
          editData.projectCategory !== undefined &&
          editData.projectCategory !== null
            ? editData.projectCategory
            : leadToUpdate.projectCategory || 1,
        website: websiteValue,
        notes:
          editData.notes !== undefined && editData.notes !== null
            ? editData.notes
            : leadToUpdate.notes,
        country:
          editData.country !== undefined && editData.country !== null
            ? editData.country
            : leadToUpdate.country || "",
        state:
          editData.state !== undefined && editData.state !== null
            ? editData.state
            : leadToUpdate.state || "",
        currency:
          editData.currency !== undefined && editData.currency !== null
            ? editData.currency
            : leadToUpdate.currency || "",
        country_code: sanitizeDialCode(
          editData.countryCode !== undefined && editData.countryCode !== null
            ? editData.countryCode
            : leadToUpdate.country_code || ""
        ),
        organisationName:
          editData.organisationName !== undefined &&
          editData.organisationName !== null
            ? editData.organisationName
            : leadToUpdate.organisationName || "",
        clientStatus:
          editData.clientStatus !== undefined && editData.clientStatus !== null
            ? editData.clientStatus
            : leadToUpdate.clientStatus || "Active",
      };

      // 2. Update state immediately
      setLeads((prev) => prev.map((l) => (l.lead_id == id ? optimisticLead : l)));
      setClients((prev) => prev.map((c) => (c.lead_id == id ? optimisticLead : c)));

      // Call API to update the lead
      const res = await fetch(`${BASE_URL}/api/update-lead/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          full_name: optimisticLead.name,
          phone_number: optimisticLead.phone,
          email: optimisticLead.email,
          lead_status: optimisticLead.leadType,
          website_url: optimisticLead.website,
          country: optimisticLead.country,
          country_code: sanitizeDialCode(optimisticLead.country_code),
          message: optimisticLead.notes,
        }),
      });

      if (!res.ok) {
        // Rollback on failure
        setLeads((prev) => prev.map((l) => (l.lead_id == id ? leadToUpdate : l)));
        setClients((prev) => prev.map((c) => (c.lead_id == id ? leadToUpdate : c)));
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update lead");
      }

      const updatedLeadData = await res.json();

      // Update with final data from API if necessary (e.g. IDs, timestamps)
      const finalLead = {
        ...optimisticLead,
        lead_id: updatedLeadData.lead?.lead_id?.toString() || id.toString(),
        name: updatedLeadData.lead?.full_name || optimisticLead.name,
        email: updatedLeadData.lead?.email || optimisticLead.email,
        phone: updatedLeadData.lead?.phone_number || optimisticLead.phone,
        leadType: updatedLeadData.lead?.lead_status || optimisticLead.leadType,
        isConverted: updatedLeadData.lead?.lead_status === "Converted",
        projectCategory: optimisticLead.projectCategory,
        industry: optimisticLead.industry,
        website: updatedLeadData.lead?.website_url || optimisticLead.website,
        notes: updatedLeadData.lead?.message || optimisticLead.notes,
        joinedDate: updatedLeadData.lead?.created_at
          ? updatedLeadData.lead.created_at.split("T")[0]
          : optimisticLead.joinedDate,
        lastContact: updatedLeadData.lead?.updated_at
          ? updatedLeadData.lead.updated_at.split("T")[0]
          : optimisticLead.lastContact,
        country: updatedLeadData.lead?.country || optimisticLead.country,
        country_code: updatedLeadData.lead?.country_code || optimisticLead.country_code,
        status:
          updatedLeadData.lead?.lead_status === "Dismissed"
            ? "Dismissed"
            : updatedLeadData.lead?.lead_status === "Converted"
              ? "Active"
              : "Lead",
      };

      setLeads((prev) => prev.map((l) => (l.lead_id == id ? finalLead : l)));
      setClients((prev) => prev.map((c) => (c.lead_id == id ? finalLead : c)));

      // Sync category to projects state: lead -> client -> project(s)
      const newCategoryNum = finalLead.projectCategory;
      if (newCategoryNum) {
        const associatedClient = clients.find((c) => c.lead_id == id);
        if (associatedClient) {
          setProjects((prev) =>
            prev.map((p) =>
              p.clientId == associatedClient.id
                ? { ...p, category: newCategoryNum }
                : p,
            ),
          );
        }
      }

      toast.success("Lead updated successfully!");
      return finalLead;
    } catch (error) {
      console.error("Error updating lead:", error);
      toast.error("Failed to update lead.");
      throw error;
    }
  }

  async function handleEditClient(clientId, data) {
    try {
      // 1. Find existing client to get lead_id and original data
      const clientToUpdate = clients.find((c) => c.id == clientId);
      if (!clientToUpdate) throw new Error("Client not found");

      const leadId = clientToUpdate.lead_id || clientToUpdate.id;

      console.log("=== EDIT CLIENT DEBUG ===");
      console.log("Client ID:", clientId);
      console.log("Lead ID:", leadId);
      console.log("Client to update:", clientToUpdate);
      console.log("Update data:", data);
      console.log("Clients before update:", clients.length);
      console.log("Leads before update:", leads.length);

      // 2. Optimistic update for clients state
      const updatedClient = {
        ...clientToUpdate,
        name: data.name || clientToUpdate.name,
        company: data.organisationName || clientToUpdate.company,
        organisation_name: data.organisationName || clientToUpdate.organisation_name,
        email: data.email || clientToUpdate.email,
        phone: data.phone || clientToUpdate.phone,
        country: data.country || clientToUpdate.country,
        state: data.state || clientToUpdate.state,
        currency: data.currency || clientToUpdate.currency,
        clientStatus: data.clientStatus || clientToUpdate.clientStatus,
        status: data.clientStatus || clientToUpdate.status,
        projectCategory: data.projectCategory || clientToUpdate.projectCategory,
      };

      setClients((prev) => {
        console.log("Previous clients:", prev.length);
        console.log("Looking for clientId:", clientId, "type:", typeof clientId);
        
        // Debug: check if client exists
        const foundClient = prev.find((c) => {
          const match = c.id == clientId;
          if (match) {
            console.log("Found matching client:", c.id, c.name);
          }
          return match;
        });
        
        if (!foundClient) {
          console.warn("Client not found! This will cause an issue!");
          console.log("Available client IDs:", prev.map(c => ({ id: c.id, name: c.name })));
        }
        
        const newClients = prev.map((c) => {
          const isMatch = c.id == clientId;
          if (isMatch) {
            console.log("Updating client:", c.id, "-> updated");
          }
          return isMatch ? updatedClient : c;
        });
        
        console.log("New clients count:", newClients.length);
        return newClients;
      });

      // 3. Update Client Table (organisation, name, country, etc.)
      const clientPayload = {
        organisation_name: data.organisationName || updatedClient.company,
        client_name: data.name || updatedClient.name,
        client_country: data.country || updatedClient.country,
        client_state: data.state || updatedClient.state,
        client_currency: data.currency || updatedClient.currency,
        client_status: data.clientStatus || updatedClient.clientStatus || "Active",
      };

      const clientRes = await fetch(`${BASE_URL}/api/update-client/${clientId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(clientPayload),
      });

      if (!clientRes.ok) throw new Error("Failed to update client details");

      // 4. Update Lead Table (email, phone, notes if any)
      // Only call if these fields are provided or we want to keep them in sync
      const leadPayload = {
        full_name: data.name || updatedClient.name,
        phone_number: data.phone || updatedClient.phone,
        email: data.email || updatedClient.email,
        country: data.country || updatedClient.country,
        lead_status: "Converted", // Keep status as converted
      };

      const leadRes = await fetch(`${BASE_URL}/api/update-lead/${leadId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(leadPayload),
      });

      if (!leadRes.ok) {
        console.warn("Failed to update lead table, but client table was updated.");
      }

      toast.success("Client updated successfully!");
      
      // Refresh data from server to ensure consistency and prevent duplicates
      await refreshClients();
      await refreshLeads();
      
      return { success: true };
    } catch (error) {
      console.error("Error editing client:", error);
      toast.error("Failed to update client: " + error.message);
      // Refresh data to rollback optimistic update if needed
      return { success: false };
    }
  }

  async function handleAddProject(data) {
    try {
      const formData = new FormData();
      formData.append("project_name", data.name);
      formData.append("project_description", data.description || "");
      formData.append("project_category", data.projectCategory || 1);
      formData.append("project_status", data.projectStatus || "Planning");
      formData.append("project_priority", data.projectPriority || "High");
      formData.append("project_budget", parseInt(data.budget) || 0);
      formData.append("onboarding_date", data.onboardingDate || new Date().toISOString().split("T")[0]);
      formData.append("deadline_date", data.deadline || "");
      formData.append("client_id", data.clientId);
      
      if (data.scopeDocument instanceof File) {
        formData.append("scope_document", data.scopeDocument);
      } else if (data.scopeDocument) {
        formData.append("scope_document", data.scopeDocument);
      }

      const res = await fetch(`${BASE_URL}/api/add-project`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      if (res.ok) {
        const result = await res.json();
        const createdProject = result.project;
        const newProject = {
          id: createdProject.project_id.toString(),
          name: createdProject.project_name,
          description: createdProject.project_description,
          status: createdProject.project_status,
          category: createdProject.project_category,
          priority: createdProject.project_priority,
          budget: createdProject.project_budget,
          onboardingDate: createdProject.onboarding_date,
          deadline: createdProject.deadline_date,
          scopeDocument: createdProject.scope_document,
          clientId: createdProject.client_id.toString(),
        };

        setProjects([newProject, ...projects]);
        toast.success("Project added successfully!");
        return newProject;
      } else {
        console.error("Failed to add project:", await res.json());
        toast.error("Failed to add project. Please try again.");
        return null;
      }
    } catch (err) {
      console.error("Error adding project:", err);
      toast.error("An error occurred while adding project.");
      return null;
    }
  }



  function handleProjectSelect(project) {
    navigate(`/projects/${project.id}`);
  }

  async function handleUpdateProject(updated) {
    try {
      const formData = new FormData();
      formData.append("project_name", updated.name);
      formData.append("project_description", updated.description);
      formData.append("project_category", updated.category || 1);
      formData.append("project_status", updated.status);
      formData.append("project_priority", updated.priority);
      formData.append("project_budget", updated.budget);
      formData.append("onboarding_date", updated.onboardingDate);
      formData.append("deadline_date", updated.deadline);

      if (updated.scopeFile) {
        formData.append("scope_document", updated.scopeFile);
      } else if (updated.scopeDocument) {
        formData.append("scope_document", updated.scopeDocument);
      }

      const res = await fetch(`${BASE_URL}/api/update-project/${updated.id}`, {
        method: "PUT",
        headers: getMultipartAuthHeaders(),
        body: formData,
      });

      if (res.ok) {
        const result = await res.json();
        // If the server returned a new filename for the document, update it in local state
        const updatedProject = {
          ...updated,
          id: updated.id.toString(),
          name: updated.name,
          description: updated.description,
          status: updated.status,
          category: updated.category || 1,
          priority: updated.priority,
          budget: updated.budget,
          onboardingDate: updated.onboardingDate,
          deadline: updated.deadline,
          scopeDocument: result.project?.scope_document || updated.scopeDocument
        };
        setProjects((prev) => prev.map((p) => (p.id == updated.id ? updatedProject : p)));

        // Sync category to leads and clients state: project -> client -> lead
        const newCategoryNum = parseInt(updatedProject.category || 1, 10);
        const associatedClient = clients.find((c) => c.id == updated.clientId);
        if (associatedClient && associatedClient.lead_id) {
          const leadId = associatedClient.lead_id;
          setLeads((prev) =>
            prev.map((l) =>
              l.lead_id == leadId
                ? { ...l, projectCategory: newCategoryNum, industry: newCategoryNum }
                : l,
            ),
          );
          setClients((prev) =>
            prev.map((c) =>
              c.lead_id == leadId
                ? { ...c, projectCategory: newCategoryNum, industry: newCategoryNum }
                : c,
            ),
          );
        }

        // Re-fetch everything from server to ensure full UI sync
        await refreshLeads();
        await refreshProjects();
        await refreshClients();
        toast.success("Project updated successfully!");
      } else {
        const errorData = await res.json();
        console.error("Failed to update project:", errorData);
        toast.error("Failed to update project. Rolling back...");
      }
    } catch (err) {
      console.error("Error updating project:", err);
      toast.error("An error occurred while updating project.");
    }
  }

  function handleAddActivity(data) {
    setActivities([{ id: `a-${Date.now()}`, ...data }, ...activities]);
  }

  async function handleAddFollowUp(data) {
    try {
      const res = await fetch(`${BASE_URL}/api/add-followup`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const result = await res.json();
        setFollowUps((prev) => [result.followup, ...prev]);
        toast.success("Follow-up added successfully!");
      } else {
        console.error("Failed to add follow-up:", await res.json());
        toast.error("Failed to add follow-up.");
      }
    } catch (err) {
      console.error("Error adding follow-up:", err);
      toast.error("An error occurred while adding follow-up.");
    }
  }

  async function handleEditFollowUp(updated) {
    try {
      const res = await fetch(`${BASE_URL}/api/update-followup/${updated.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(updated),
      });

      if (res.ok) {
        const result = await res.json();
        const updatedFollowup = {
          ...updated,
          status: updated.followup_status?.toLowerCase() || "pending",
          dueDate: updated.followup_date,
        };
        setFollowUps((prev) =>
          prev.map((f) => (f.id == updated.id ? updatedFollowup : f)),
        );
        toast.success("Follow-up updated successfully!");
      } else {
        console.error("Failed to update follow-up:", await res.json());
        toast.error("Failed to update follow-up.");
      }
    } catch (err) {
      console.error("Error updating follow-up:", err);
      toast.error("An error occurred while updating follow-up.");
    }
  }

  async function handleDeleteFollowUp(id) {
    try {
      const res = await fetch(`${BASE_URL}/api/delete-followup/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (res.ok) {
        setFollowUps((prev) => prev.filter((f) => f.id != id));
        toast.success("Follow-up deleted successfully!");
      } else {
        console.error("Failed to delete follow-up:", await res.json());
        toast.error("Failed to delete follow-up.");
      }
    } catch (err) {
      console.error("Error deleting follow-up:", err);
      toast.error("An error occurred while deleting follow-up.");
    }
  }

  async function handleToggleFollowUpStatus(
    id,
    brief = "",
    completed_at = "",
    completed_by = "",
  ) {
    try {
      const followUp = followUps.find((f) => f.id == id);
      if (!followUp) return;

      const nextStatus =
        followUp.status === "completed" ? "pending" : "completed";
      const res = await fetch(`${BASE_URL}/api/toggle-followup-status/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          status: nextStatus,
          brief,
          completed_at,
          completed_by,
        }),
      });

      if (res.ok) {
        setFollowUps((prev) =>
          prev.map((f) =>
            f.id == id
              ? {
                  ...f,
                  status: nextStatus,
                  followup_status: nextStatus,
                  follow_brief: brief,
                  completed_at: completed_at,
                  completed_by: completed_by,
                }
              : f,
          ),
        );
        toast.success(`Follow-up marked as ${nextStatus}!`);
      } else {
        console.error("Failed to toggle follow-up status:", await res.json());
        toast.error("Failed to toggle follow-up status.");
      }
    } catch (err) {
      console.error("Error toggling follow-up status:", err);
      toast.error("An error occurred while toggling follow-up status.");
    }
  }

  // Enquiry handlers


  function handleUpdateEnquiry(updated) {
    setEnquiries((prev) =>
      prev.map((e) => (e.id == updated.id ? { ...e, ...updated } : e)),
    );
  }

  function handleAddEnquiry(data) {
    setEnquiries([
      {
        id: `e-${Date.now()}`,
        ...data,
        date: new Date().toISOString(),
        status: "new",
      },
      ...enquiries,
    ]);
  }

  function handleClearNotifications() {
    setEnquiries((prev) =>
      prev.map((e) => (e.status === "new" ? { ...e, status: "read" } : e)),
    );
  }

  // AI Model handlers
  async function handleAddAiModel(model) {
    try {
      const res = await fetch(`${BASE_URL}/api/ai-models`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(model),
      });
      if (res.ok) {
        const data = await res.json();
        setAiModels([...aiModels, { ...model, aimodel_id: data.aimodel_id }]);
        toast.success("AI model added successfully!");
      } else {
        toast.error("Failed to add AI model.");
      }
    } catch (e) {
      console.log("Failed to add AI model");
      toast.error("An error occurred while adding AI model.");
    }
  }

  async function handleUpdateAiModel(updated) {
    try {
      const res = await fetch(`${BASE_URL}/api/ai-models/${updated.aimodel_id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(updated),
      });
      if (res.ok) {
        setAiModels(aiModels.map((m) => (m.aimodel_id == updated.aimodel_id ? updated : m)));
        toast.success("AI model updated successfully!");
      } else {
        toast.error("Failed to update AI model.");
      }
    } catch (e) {
      console.log("Failed to update AI model");
      toast.error("An error occurred while updating AI model.");
    }
  }

  async function handleDeleteAiModel(id) {
    try {
      const res = await fetch(`${BASE_URL}/api/ai-models/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        setAiModels(aiModels.filter((m) => m.aimodel_id != id));
        toast.success("AI model deleted successfully!");
      } else {
        toast.error("Failed to delete AI model.");
      }
    } catch (e) {
      console.log("Failed to delete AI model");
      toast.error("An error occurred while deleting AI model.");
    }
  }

  async function handleAddEnquiry(data) {
    try {
      const res = await fetch(`${BASE_URL}/api/add-enquiry`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          full_name: data.name,
          email: data.email,
          phone_number: data.phone,
          website_url: data.website,
          message: data.message,
          status: "New"
        }),
      });

      if (res.ok) {
        const result = await res.json();
        const newEnquiry = {
          id: result.enquiry.enquiry_id,
          name: result.enquiry.full_name,
          email: result.enquiry.email,
          phone: result.enquiry.phone_number,
          website: result.enquiry.website_url,
          message: result.enquiry.message,
          status: result.enquiry.status.toLowerCase(),
          date: result.enquiry.created_at,
          remarks: result.enquiry.remarks || ""
        };
        setEnquiries((prev) => [newEnquiry, ...prev]);
        toast.success("Enquiry added successfully!");
      } else {
        toast.error("Failed to add enquiry.");
      }
    } catch (err) {
      console.error("Error adding enquiry:", err);
      toast.error("An error occurred.");
    }
  }

  async function handleUpdateEnquiryStatus(id, status, remarks, message) {
    let actualId = id;
    let actualStatus = status;
    let actualRemarks = remarks;
    let actualMessage = message;

    // Handle object argument from some components
    if (typeof id === 'object' && id !== null) {
      if (id.status === undefined) {
        // Handle non-status updates (like aiAnalysis) locally
        return handleUpdateEnquiry(id);
      }
      actualId = id.id;
      actualStatus = id.status;
      actualRemarks = id.holdReason || id.remarks || "";
    }

    try {
      const res = await fetch(`${BASE_URL}/api/update-enquiry-status/${actualId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: actualStatus, remarks: actualRemarks, message: actualMessage }),
      });

      if (res.ok) {
        // If status was 'converted' and now it's not, we need to remove the lead from state
        const prevEnquiry = enquiries.find(e => e.id == actualId);
        if (prevEnquiry?.status === 'converted' && actualStatus.toLowerCase() !== 'converted') {
            setLeads(prev => prev.filter(l => l.enquiry_id != actualId));
            setClients(prev => prev.filter(c => c.enquiry_id != actualId));
        }

        setEnquiries((prev) =>
          prev.map((e) => (e.id == actualId ? { ...e, status: actualStatus.toLowerCase(), remarks: actualRemarks, holdReason: actualRemarks, message: actualMessage !== undefined ? actualMessage : e.message } : e))
        );
        toast.success(`Enquiry marked as ${actualStatus}!`);
      } else {
        toast.error("Failed to update enquiry status.");
      }
    } catch (err) {
      console.error("Error updating enquiry:", err);
      toast.error("An error occurred.");
    }
  }

  async function handleDeleteEnquiry(id) {
    try {
      const res = await fetch(`${BASE_URL}/api/delete-enquiry/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (res.ok) {
        setEnquiries((prev) => prev.filter((e) => e.id != id));
        setLeads((prev) => prev.filter((l) => l.enquiry_id != id));
        setClients((prev) => prev.filter((c) => c.enquiry_id != id));
        toast.success("Enquiry deleted successfully!");
      } else {
        toast.error("Failed to delete enquiry.");
      }
    } catch (err) {
      console.error("Error deleting enquiry:", err);
      toast.error("An error occurred.");
    }
  }

  async function handlePromoteEnquiry(leadData, enquiryUuid) {
    try {
      // Find enquiry by UUID if possible, or use the one from state
      const enquiry = enquiries.find(e => e.uuid === enquiryUuid || e.id == enquiryUuid);
      
      // Pass enquiry_id to handleAddClient
      const leadDataWithEnquiry = { ...leadData, enquiry_id: enquiry?.id };
      
      const newLead = await handleAddClient(leadDataWithEnquiry);
      if (newLead && enquiry) {
        await handleUpdateEnquiryStatus(enquiry.id, "Converted");
      } else if (newLead && enquiryUuid) {
        await handleUpdateEnquiryStatus(enquiryUuid, "Converted");
      }
      navigate("/leads");
    } catch (err) {
      console.error("Error promoting enquiry:", err);
    }
  }

  async function handleDeleteProject(id) {
    try {
      const res = await fetch(`${BASE_URL}/api/delete-project/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (res.ok) {
        setProjects((prev) => prev.filter((p) => (p.project_id || p.id) != id));
        toast.success("Project deleted successfully!");
      } else {
        toast.error("Failed to delete project.");
      }
    } catch (err) {
      console.error("Error deleting project:", err);
      toast.error("An error occurred.");
    }
  }

  // Common props for FollowUpList routes
  const followUpProps = {
    followUps,
    clients,
    loading: followUpsLoading,
    onToggleStatus: handleToggleFollowUpStatus,
    onAddFollowUp: handleAddFollowUp,
    onEditFollowUp: handleEditFollowUp,
    onDeleteFollowUp: handleDeleteFollowUp,
    onSelectClient: handleClientSelect,
    onNavigate: (tab) => navigate(`/${tab}`),
    projects: projects,
  };

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isLoggedIn ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <LoginPage onLogin={handleLogin} />
          )
        }
      />

      <Route
        element={
          isLoggedIn ? (
            <Layout
              onLogout={handleLogout}
              enquiries={enquiries}
              followUps={followUps}
              clients={clients}
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route
          path="/dashboard"
          element={
            <Dashboard
              followUps={followUps}
              clients={clients}
              leads={leads}
              enquiries={enquiries}
              aiModels={aiModels}
              loading={leadsLoading || clientsLoading || followUpsLoading || projectsLoading}
              onSelectFollowUp={handleClientSelect}
              onViewAllFollowUps={() => navigate("/followups")}
              onNavigate={(tab) => navigate(`/${tab}`)}
              onClearNotifications={handleClearNotifications}
            />
          }
        />

        <Route
          path="/enquiries"
          element={
            <EnquiryList
              enquiries={enquiries}
              aiModels={aiModels}
              onPromote={handlePromoteEnquiry}
              onDismiss={(id) => handleUpdateEnquiryStatus(id, "Dismissed")}
              onHold={(id) => handleUpdateEnquiryStatus(id, "Hold")}
              onRestore={(id) => handleUpdateEnquiryStatus(id, "New", "")}
              onDelete={handleDeleteEnquiry}
              onDeleteAll={() => {
                const dismissed = enquiries.filter(e => e.status === "dismissed");
                dismissed.forEach(e => handleDeleteEnquiry(e.id));
              }}
              onUpdate={handleUpdateEnquiryStatus}
              onAdd={handleAddEnquiry}
            />
          }
        />

        <Route
          path="/followups"
          element={<FollowUpList {...followUpProps} typeFilter="All" />}
        />
        <Route
          path="/followups-clients"
          element={<FollowUpList {...followUpProps} typeFilter="Active" />}
        />
        <Route
          path="/followups-leads"
          element={<FollowUpList {...followUpProps} typeFilter="Lead" />}
        />

        <Route
          path="/leads"
          element={
            <LeadList
              leads={leads}
              loading={leadsLoading}
              onSelectLead={handleClientSelect}
              onDeleteLead={handleDeleteLead}
              onOnboardLead={handleOnboardClient}
              onDismissLead={handleDismissLead}
              onRestoreLead={handleRestoreLead}
              onAddLead={handleAddClient}
              onUpdateConvertedLead={handleUpdateConvertedLead}
              onAddActivity={handleAddActivity}
              onEditLead={handleEditLead}
              allLeads={leads}
            />
          }
        />

        <Route
          path="/clients"
          element={
            <ClientList
              clients={clients.filter((c) => c.status !== "Lead" && c.status !== "Dismissed")}
              loading={clientsLoading}
              onSelectClient={handleClientSelect}
              onDeleteClient={handleDeleteClient}
              onAddClient={handleAddClient}
              onUpdateClient={handleEditClient}
              allClients={clients}
            />
          }
        />

        <Route
          path="/projects"
          element={
            <ProjectBoard
              projects={projects}
              loading={projectsLoading}
              clients={clients}
              onAddClient={handleAddClient}
              onAddProject={handleAddProject}
              onUpdateProject={handleUpdateProject}
              onSelectProject={handleProjectSelect}
              onDeleteProject={handleDeleteProject}
            />
          }
        />

        <Route
          path="/settings"
          element={
            <Settings
              aiModels={aiModels}
              onAddAiModel={handleAddAiModel}
              onUpdateAiModel={handleUpdateAiModel}
              onDeleteAiModel={handleDeleteAiModel}
            />
          }
        />

        <Route
          path="/clients/:id"
          element={
            <ClientDetailWrapper
              clients={clients}
              type="clients"
              activities={activities}
              onUpdateClient={handleUpdateClient}
              onAddActivity={handleAddActivity}
              onAddFollowUp={handleAddFollowUp} // Added this
              onSelectProject={handleProjectSelect}
              projects={projects}
              loading={clientsLoading}
            />
          }
        />

        <Route
          path="/leads/:id"
          element={
            <ClientDetailWrapper
              clients={leads}
              type="leads"
              activities={activities}
              followUps={followUps}
              onUpdateClient={handleEditLead}
              onAddActivity={handleAddActivity}
              onAddFollowUp={handleAddFollowUp} // Added this
              onSelectProject={handleProjectSelect}
              projects={projects}
              loading={leadsLoading}
            />
          }
        />

        <Route
          path="/projects/:id"
          element={
            <ProjectOverviewWrapper
              projects={projects}
              clients={clients}
              followUps={followUps}
              activities={activities}
              onUpdateProject={handleUpdateProject}
              onAddActivity={handleAddActivity}
              onAddFollowUp={handleAddFollowUp}
              loading={projectsLoading || clientsLoading}
            />
          }
        />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Toaster 
        position="top-right" 
        containerStyle={{
          zIndex: 9999999,
        }}
      />
      <AppRoutes />
    </HashRouter>
  );
}
