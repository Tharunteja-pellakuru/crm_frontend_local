import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, X, ChevronRight, HelpCircle, Send } from "lucide-react";
import ParivartanLeaf from "../../assets/Parivartan-Leaf.png";
import { BASE_URL } from "../../constants/config";
import { getAuthHeaders } from "../../utils/auth";

const CORE_ACTIONS = [
  {
    id: "create-enquiry-flow",
    question: "Create a new Enquiry (Interactive)",
    isAction: true,
  },
  {
    id: "edit-enquiry-flow",
    question: "Edit an existing Enquiry (Interactive)",
    isAction: true,
  }
];

const SOURCE_OPTIONS = [
  "Referal", 
  "eParivartan", 
  "Selyst", 
  "LinkedIn", 
  "Meta Ad(Insta/FB)"
];

export default function HelpBot({ onEnquiryCreated, enquiries = [] }) {
  const [faqs, setFaqs] = useState(CORE_ACTIONS);
  const [botEnabled, setBotEnabled] = useState(true);

  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth - 80, y: window.innerHeight - 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // Chat & Conversational Flow State
  const [messages, setMessages] = useState([
    { type: "bot", text: "Hi! I'm your Parivartan Helper. How can I help you today?" }
  ]);
  const [flowMode, setFlowMode] = useState(null); // 'create' | 'edit' | null
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [inputValue, setInputValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Editing state
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [faqSearchTerm, setFaqSearchTerm] = useState("");

  const messagesEndRef = useRef(null);

  useEffect(() => {
    const initBot = async () => {
      try {
        const [faqsRes, setRes] = await Promise.all([
          fetch(`${BASE_URL}/api/bot/faqs`, { headers: getAuthHeaders() }),
          fetch(`${BASE_URL}/api/bot/settings`, { headers: getAuthHeaders() })
        ]);
        if (setRes.ok) {
          const settings = await setRes.json();
          if (settings.bot_enabled === 'false') {
            setBotEnabled(false);
            return; // no need to fetch faqs if disabled
          }
        }
        if (faqsRes.ok) {
          const dbFaqs = await faqsRes.json();
          setFaqs([...CORE_ACTIONS, ...dbFaqs]);
        }
      } catch (e) {
        console.error("Error init bot");
      }
    };
    initBot();

    const handleSettingChange = (e) => {
      setBotEnabled(e.detail);
    };

    const handleFaqsChange = () => {
      initBot(); // re-fetch FAQs
    };

    window.addEventListener('bot_setting_changed', handleSettingChange);
    window.addEventListener('faqs_changed', handleFaqsChange);

    return () => {
      window.removeEventListener('bot_setting_changed', handleSettingChange);
      window.removeEventListener('faqs_changed', handleFaqsChange);
    };
  }, []);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, currentStep, searchResults]);

  // Handle window resize to keep bot on screen
  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => ({
        x: Math.min(Math.max(0, prev.x), window.innerWidth - 60),
        y: Math.min(Math.max(0, prev.y), window.innerHeight - 60)
      }));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Drag Handlers
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      const newX = Math.min(Math.max(0, e.clientX - dragOffset.x), window.innerWidth - 60);
      const newY = Math.min(Math.max(0, e.clientY - dragOffset.y), window.innerHeight - 60);
      setPosition({ x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    } else {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragOffset, position]);

  const toggleOpen = (e) => {
    if (!isDragging) {
      setIsOpen(!isOpen);
    }
  };

  const appendBotMsg = (text) => setMessages(prev => [...prev, { type: "bot", text }]);
  const appendUserMsg = (text) => setMessages(prev => [...prev, { type: "user", text }]);

  const handleFaqClick = (faq) => {
    if (faq.isAction && faq.id === "create-enquiry-flow") {
      startEnquiryFlow("create");
    } else if (faq.isAction && faq.id === "edit-enquiry-flow") {
      startEnquiryFlow("edit");
    } else {
      setMessages(prev => [
        ...prev,
        { type: "user", text: faq.question },
        { type: "bot", text: faq.answer }
      ]);
    }
  };

  // --- Conversational Flow Logic ---
  const startEnquiryFlow = (mode) => {
    setFlowMode(mode);
    setFormData({});
    setSelectedEnquiry(null);
    setSearchResults([]);
    
    if (mode === "create") {
      setCurrentStep(0);
      setMessages(prev => [
        ...prev,
        { type: "user", text: "I want to create a new Enquiry" },
        { type: "bot", text: "Great! Let's create an Enquiry. What is the Full Name? (Required)" }
      ]);
    } else if (mode === "edit") {
      setCurrentStep(-1); // Search Step
      setMessages(prev => [
        ...prev,
        { type: "user", text: "I want to edit an existing Enquiry" },
        { type: "bot", text: "Sure. Please type the Name or Phone Number of the Enquiry you want to edit." }
      ]);
    }
  };

  const cancelFlow = () => {
    setFlowMode(null);
    setFormData({});
    setSelectedEnquiry(null);
    appendBotMsg(flowMode === "edit" ? "Editing cancelled." : "Enquiry creation cancelled.");
  };

  const proceedToEditStep0 = (enq) => {
    setSelectedEnquiry(enq);
    setFormData({
      full_name: enq.name,
      phone_number: enq.phone,
      email: enq.email || "",
      website_url: enq.website || enq.website_url || "",
      source: enq.source || "",
      message: enq.message || "",
    });
    setCurrentStep(0);
    appendBotMsg(`Found: ${enq.name}. Let's edit.
Current Name: ${enq.name}
Type a new name, or type 'skip' to keep it.`);
  };

  const handleSelectEnquiryResult = (enq) => {
    appendUserMsg(`Select: ${enq.name} (${enq.phone})`);
    proceedToEditStep0(enq);
  };

  const handleUserInput = (value) => {
    const val = typeof value === 'string' ? value.trim() : value;
    if (!val && currentStep !== 4 && currentStep !== 6 && currentStep !== -2) return; 

    // Handle Search Step for Edit Flow
    if (currentStep === -1) {
      appendUserMsg(val);
      const query = val.toLowerCase();
      const matches = enquiries.filter(e => 
        (e.name && e.name.toLowerCase().includes(query)) || 
        (e.phone && e.phone.includes(query))
      );
      
      if (matches.length === 0) {
        appendBotMsg(`I couldn't find any enquiry matching "${val}". Please try another name or phone number.`);
        return;
      } else if (matches.length === 1) {
        proceedToEditStep0(matches[0]);
        return;
      } else {
        // Multiple matches
        setSearchResults(matches);
        setCurrentStep(-2);
        appendBotMsg(`Found multiple matches. Please click one to select it:`);
        return;
      }
    }
    
    // Add user message to chat for normal steps
    if (currentStep !== 6 && currentStep !== -2) {
      appendUserMsg(val);
    }

    const isSkip = val.toLowerCase() === 'skip';

    if (currentStep === 0) { // Name
      if (!isSkip) {
        if (val.length < 2) {
          appendBotMsg("Name must be at least 2 characters long. Please try again or type 'skip'.");
          return;
        }
        setFormData(prev => ({ ...prev, full_name: val }));
      }
      
      setCurrentStep(1);
      const msg = flowMode === 'create' 
        ? "Got it. What is their Phone Number? (Required, at least 10 digits)"
        : `Current Phone: ${selectedEnquiry?.phone || '-'}\nEnter new phone number, or type 'skip'.`;
      appendBotMsg(msg);
    } 
    else if (currentStep === 1) { // Phone
      if (!isSkip) {
        const phoneDigits = val.replace(/\D/g, '');
        if (phoneDigits.length < 10) {
          appendBotMsg("Phone number must contain at least 10 digits. Please try again or type 'skip'.");
          return;
        }
        setFormData(prev => ({ ...prev, phone_number: val }));
      }
      
      setCurrentStep(2);
      const msg = flowMode === 'create' 
        ? "Thanks! What is their Email Address? (Type 'skip' to leave blank)"
        : `Current Email: ${selectedEnquiry?.email || '-'}\nEnter new email, or type 'skip'.`;
      appendBotMsg(msg);
    }
    else if (currentStep === 2) { // Email
      if (!isSkip) {
        const emailRegex = /^\S+@\S+\.\S+$/;
        if (!emailRegex.test(val)) {
          appendBotMsg("That doesn't look like a valid email address. Please enter a valid email or type 'skip'.");
          return;
        }
        setFormData(prev => ({ ...prev, email: val }));
      }
      
      setCurrentStep(3);
      const msg = flowMode === 'create' 
        ? "Thanks! What is their Website URL? (Type 'skip' to leave blank)"
        : `Current Website: ${selectedEnquiry?.website || selectedEnquiry?.website_url || '-'}\nEnter new Website URL, or type 'skip'.`;
      appendBotMsg(msg);
    }
    else if (currentStep === 3) { // Website URL
      if (!isSkip) {
        setFormData(prev => ({ ...prev, website_url: val }));
      }
      
      setCurrentStep(4);
      const msg = flowMode === 'create' 
        ? "Where did this enquiry come from? Select a Source:"
        : `Current Source: ${selectedEnquiry?.source || '-'}\nSelect a new Source, or click 'Keep Current':`;
      appendBotMsg(msg);
    }
    else if (currentStep === 4) { // Source (Buttons)
      if (!isSkip) {
        setFormData(prev => ({ ...prev, source: val }));
      }
      
      setCurrentStep(5);
      const msg = flowMode === 'create' 
        ? "Any message or remarks? (Type 'skip' to leave blank)"
        : `Current Remarks: ${selectedEnquiry?.message || '-'}\nEnter new remarks, or type 'skip'.`;
      appendBotMsg(msg);
    }
    else if (currentStep === 5) { // Message
      if (!isSkip) {
        setFormData(prev => ({ ...prev, message: val }));
      }
      
      setCurrentStep(6);
      
      // Build Summary
      setTimeout(() => {
        // We read from the pending state because setFormData is async
        const finalName = !isSkip && currentStep === 5 && val !== 'skip' ? formData.full_name : formData.full_name;
        
        // Actually, state is batched, so we will show the confirmation message using the latest state values after render.
        setMessages(prev => [...prev, { 
          type: "bot", 
          text: "Here is the summary of the data:\n" +
                `Name: ${formData.full_name}\n` +
                `Phone: ${formData.phone_number}\n` +
                `Email: ${formData.email || '-'}\n` +
                `Website: ${formData.website_url || '-'}\n` +
                `Source: ${formData.source || '-'}`
        }]);
        appendBotMsg(flowMode === "create" ? "Would you like to save this Enquiry now?" : "Would you like to save these changes?");
      }, 100);
    }
  };

  const submitEnquiry = async () => {
    setIsSubmitting(true);
    appendUserMsg("Yes, save it.");
    
    try {
      const url = flowMode === "create" 
        ? `${BASE_URL}/api/add-enquiry`
        : `${BASE_URL}/api/update-enquiry/${selectedEnquiry.id}`;
        
      const method = flowMode === "create" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      if (response.ok) {
        appendBotMsg(flowMode === "create" ? "✅ Enquiry created successfully!" : "✅ Enquiry updated successfully!");
        if (onEnquiryCreated) {
          onEnquiryCreated();
        }
      } else {
        appendBotMsg(`❌ Error: ${data.message || "Failed to process enquiry"}`);
      }
    } catch (error) {
      appendBotMsg("❌ Server error. Please try again later.");
    } finally {
      setIsSubmitting(false);
      setFlowMode(null);
      setFormData({});
      setSelectedEnquiry(null);
    }
  };

  const resetChat = () => {
    setMessages([{ type: "bot", text: "Hi! I'm your Parivartan Helper. How can I help you today?" }]);
    setFlowMode(null);
    setFormData({});
    setSelectedEnquiry(null);
  };

  const renderInputArea = () => {
    if (!flowMode) return null;

    if (currentStep === -2) {
      // Multiple matches selection
      return (
        <div className="p-3 bg-white border-t border-slate-100 shrink-0 max-h-[160px] overflow-y-auto custom-scrollbar">
          <div className="flex flex-col gap-2">
            {searchResults.map(enq => (
              <button 
                key={enq.id} 
                onClick={() => handleSelectEnquiryResult(enq)}
                className="text-left px-3 py-2 bg-slate-50 hover:bg-indigo-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200"
              >
                {enq.name} ({enq.phone})
              </button>
            ))}
          </div>
          <button onClick={cancelFlow} className="mt-2 text-[10px] text-slate-400 hover:text-rose-500 font-bold underline">Cancel</button>
        </div>
      );
    }

    if (currentStep === 4) {
      // Source Buttons
      return (
        <div className="p-3 bg-white border-t border-slate-100 shrink-0">
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Select Source:</p>
          <div className="flex flex-wrap gap-2">
            {flowMode === 'edit' && (
              <button 
                onClick={() => handleUserInput("skip")}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-lg transition-colors border border-slate-300"
              >
                Keep Current
              </button>
            )}
            {SOURCE_OPTIONS.map(opt => (
              <button 
                key={opt} 
                onClick={() => handleUserInput(opt)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 text-xs font-semibold rounded-lg transition-colors border border-slate-200"
              >
                {opt}
              </button>
            ))}
          </div>
          <button onClick={cancelFlow} className="mt-2 text-[10px] text-slate-400 hover:text-rose-500 font-bold underline">Cancel</button>
        </div>
      );
    }

    if (currentStep === 6) {
      // Confirmation Buttons
      return (
        <div className="p-3 bg-white border-t border-slate-100 shrink-0 flex items-center justify-center gap-3">
          <button 
            disabled={isSubmitting}
            onClick={submitEnquiry}
            className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
          >
            {isSubmitting ? "Saving..." : "Yes, Save"}
          </button>
          <button 
            disabled={isSubmitting}
            onClick={cancelFlow}
            className="flex-1 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-xl transition-colors"
          >
            No, Cancel
          </button>
        </div>
      );
    }

    // Standard Text Input
    return (
      <div className="p-3 bg-white border-t border-slate-100 shrink-0 flex gap-2">
        <input 
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleUserInput(inputValue);
              setInputValue("");
            }
          }}
          placeholder={flowMode === "edit" ? "Type answer or 'skip'..." : "Type your answer..."}
          className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-300 transition-colors"
          autoFocus
        />
        <button 
          onClick={() => {
            handleUserInput(inputValue);
            setInputValue("");
          }}
          disabled={!inputValue.trim()}
          className="w-9 h-9 rounded-xl bg-[#18254D] text-white flex items-center justify-center shrink-0 hover:bg-slate-800 disabled:opacity-50 transition-colors"
        >
          <Send size={14} />
        </button>
        <button onClick={cancelFlow} className="absolute right-3 -top-6 text-[10px] text-slate-400 hover:text-rose-500 font-bold bg-white px-2 py-0.5 rounded-t-lg shadow-sm border border-slate-100 border-b-0">Cancel</button>
      </div>
    );
  };

  if (!botEnabled) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 999999,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end"
      }}
    >
      {/* Chat Window */}
      {isOpen && (
        <div 
          className="bg-white shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] rounded-2xl border border-slate-200 mb-4 overflow-hidden flex flex-col transform origin-bottom-right transition-all animate-pop absolute bottom-full right-0 sm:right-0 -right-2"
          style={{ 
            height: '450px',
            maxHeight: 'calc(100vh - 120px)',
            width: 'calc(100vw - 32px)',
            maxWidth: '350px'
          }}
        >
          {/* Header */}
          <div className="bg-[#18254D] p-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                <img src={ParivartanLeaf} alt="Bot" className="w-5 h-5 object-contain" />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm leading-tight">Help Assistant</h3>
                <p className="text-white/60 text-[10px] uppercase tracking-wider font-bold">Online</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={resetChat} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/80 hover:text-white" title="Reset Chat">
                <HelpCircle size={16} />
              </button>
              <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/80 hover:text-white">
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[13px] shadow-sm whitespace-pre-wrap ${
                  msg.type === "user" 
                    ? "bg-[#18254D] text-white rounded-br-sm" 
                    : "bg-white text-slate-700 border border-slate-100 rounded-bl-sm"
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area (if in flow mode) */}
          {flowMode ? (
            <div className="relative">
              {renderInputArea()}
            </div>
          ) : (
            /* FAQ Suggestions */
            <div className="flex-1 flex flex-col min-h-0 bg-white border-t border-slate-100">
              <div className="p-3 pb-2 shrink-0">
                <input 
                  type="text" 
                  placeholder="Search questions..." 
                  value={faqSearchTerm}
                  onChange={(e) => setFaqSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-300 transition-colors"
                />
              </div>
              <div className="p-3 pt-0 overflow-y-auto custom-scrollbar flex-1 max-h-[180px]">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Suggested Questions</p>
                <div className="flex flex-col gap-1.5">
                  {faqs.filter(f => f.question.toLowerCase().includes(faqSearchTerm.toLowerCase())).length > 0 ? (
                    faqs.filter(f => f.question.toLowerCase().includes(faqSearchTerm.toLowerCase())).map(faq => (
                      <button
                        key={faq.id}
                        onClick={() => handleFaqClick(faq)}
                        className="text-left px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors flex items-center justify-between group"
                      >
                        <span className={`truncate pr-2 ${faq.isAction ? "text-indigo-600 font-bold" : ""}`}>{faq.question}</span>
                        <ChevronRight size={14} className="text-slate-400 group-hover:text-[#18254D] shrink-0" />
                      </button>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-4">No questions found.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Action Button */}
      <div 
        className={`w-14 h-14 rounded-full shadow-[0_8px_20px_rgba(0,0,0,0.15)] flex items-center justify-center cursor-move transition-transform active:scale-95 ${isOpen ? "bg-rose-50 border border-rose-100 text-rose-500" : "bg-white border border-slate-100"}`}
        onMouseDown={handleMouseDown}
        onClick={toggleOpen}
        title="Drag to move, click to open help"
      >
        {isOpen ? (
          <X size={24} />
        ) : (
          <div className="relative flex items-center justify-center w-full h-full">
            <img 
              src={ParivartanLeaf} 
              alt="Help" 
              className="w-8 h-8 object-contain drop-shadow-md pointer-events-none"
            />
            {/* Notification dot */}
            <span className="absolute top-0 right-0 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white"></span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
