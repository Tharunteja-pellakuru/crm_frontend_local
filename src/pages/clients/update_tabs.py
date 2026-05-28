import re

def main():
    file_path = "/Users/tharunteja/Desktop/Working/CRM/crm_frontend/src/pages/clients/ClientDetail.jsx"
    
    with open(file_path, "r") as f:
        content = f.read()
        
    # Find the end of the KPI row
    # KPI row ends just before {/* Main Grid Layout */}
    main_grid_idx = content.find("{/* Main Grid Layout */}")
    
    # We will inject the tabs right before main_grid_idx
    tabs_ui = """      {/* Tabs UI */}
      <div className="flex flex-wrap gap-3 mt-8 mb-6 border-b border-slate-200 pb-4">
        {[
          { id: "Details", label: "Details", icon: <Info size={14} /> },
          { id: "Follow Ups", label: "Follow Ups", icon: <Clock size={14} /> },
          { id: "Conversations", label: "Conversations", icon: <MessageSquare size={14} /> },
          ...(isLead ? [] : [{ id: "Projects", label: "Projects", icon: <Briefcase size={14} /> }])
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-bold transition-all shadow-sm border ${
              activeTab === tab.id
                ? "bg-slate-800 text-white border-slate-800 scale-105"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

"""

    # For the Main Grid Layout, let's wrap individual sections.
    # Contact Info: 
    contact_start = content.find('{/* Main Details */}')
    contact_end = content.find('{/* Activity / Conversations */}')
    
    activity_start = contact_end
    activity_end = content.find('{/* Projects */}')
    
    projects_start = activity_end
    projects_end = content.find('{/* Right Column Wrapper */}')
    
    right_start = content.find('{/* Upcoming Follow-ups Card */}')
    right_end = content.find('      </div>\n\n      {/* ══════════════════════ MODALS ══════════════════════ */}')
    
    # It's easier to just do string replacements for the boundaries to inject {activeTab === "..." && ( ... )}
    
    content = content.replace('{/* Main Details */}', '{activeTab === "Details" && (\n          {/* Main Details */}')
    content = content.replace('{/* Activity / Conversations */}', '          )}\n\n          {activeTab === "Conversations" && (\n          {/* Activity / Conversations */}')
    content = content.replace('{/* Projects */}', '          )}\n\n          {activeTab === "Projects" && (\n          {/* Projects */}')
    content = content.replace('{/* Right Column Wrapper */}', '          )}\n        </div>\n\n        {/* Right Column Wrapper */}');
    content = content.replace('{/* Upcoming Follow-ups Card */}', '{activeTab === "Follow Ups" && (\n          {/* Upcoming Follow-ups Card */}')
    content = content.replace('      </div>\n\n      {/* ══════════════════════ MODALS ══════════════════════ */}', '          )}\n        </div>\n\n      </div>\n\n      {/* ══════════════════════ MODALS ══════════════════════ */}')
    
    # Also inject initialTab
    content = content.replace('initialTab = "overview"', 'initialTab = "Details"')

    new_content = content[:main_grid_idx] + tabs_ui + content[main_grid_idx:]
    
    with open(file_path, "w") as f:
        f.write(new_content)

    print("Success")

if __name__ == "__main__":
    main()
