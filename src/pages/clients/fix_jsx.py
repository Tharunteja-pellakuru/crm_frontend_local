import re

def main():
    file_path = "/Users/tharunteja/Desktop/Working/CRM/crm_frontend/src/pages/clients/ClientDetail.jsx"
    
    with open(file_path, "r") as f:
        content = f.read()

    # We need to wrap the contents of {activeTab === "..." && ( ... )} in Fragments <> ... </>
    # Right now they are:
    # {activeTab === "Details" && (
    #       {/* Main Details */}
    #       <div ...>...</div>
    # )}
    # We want:
    # {activeTab === "Details" && (
    #       <>
    #       {/* Main Details */}
    #       <div ...>...</div>
    #       </>
    # )}

    content = content.replace(
        '{activeTab === "Details" && (\n          {/* Main Details */}',
        '{activeTab === "Details" && (\n          <>\n          {/* Main Details */}'
    )
    content = content.replace(
        '{activeTab === "Conversations" && (\n          {/* Activity / Conversations */}',
        '{activeTab === "Conversations" && (\n          <>\n          {/* Activity / Conversations */}'
    )
    content = content.replace(
        '{activeTab === "Projects" && (\n          {/* Projects */}',
        '{activeTab === "Projects" && (\n          <>\n          {/* Projects */}'
    )
    content = content.replace(
        '{activeTab === "Follow Ups" && (\n          {/* Upcoming Follow-ups Card */}',
        '{activeTab === "Follow Ups" && (\n          <>\n          {/* Upcoming Follow-ups Card */}'
    )

    # Now close the fragments before the ending parenthesis
    # Currently it's:
    #          )}
    # Let's replace the ending sequence.
    # Note: earlier I replaced with `          )}\n\n          {activeTab === "Conversations" && (`
    # We can just replace `          )}` with `          </>\n          )}` if we are careful.
    
    # Let's find all instances of `          )}` that close these blocks.
    # There are exactly 4 of them.
    content = content.replace('          )}\n\n          {activeTab === "Conversations"', '          </>\n          )}\n\n          {activeTab === "Conversations"')
    content = content.replace('          )}\n\n          {activeTab === "Projects"', '          </>\n          )}\n\n          {activeTab === "Projects"')
    content = content.replace('          )}\n        </div>\n\n        {/* Right Column Wrapper */}', '          </>\n          )}\n        </div>\n\n        {/* Right Column Wrapper */}')
    content = content.replace('          )}\n        </div>\n\n      </div>\n\n      {/* ══════════════════════ MODALS ══════════════════════ */}', '          </>\n          )}\n        </div>\n\n      </div>\n\n      {/* ══════════════════════ MODALS ══════════════════════ */}')
    
    with open(file_path, "w") as f:
        f.write(content)
        
    print("Success")

if __name__ == "__main__":
    main()
