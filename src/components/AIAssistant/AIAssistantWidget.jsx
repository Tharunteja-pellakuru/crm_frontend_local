import React, { useState, useEffect, useRef } from 'react';
import { BASE_URL } from '../../constants/config';
import { getAuthHeaders } from '../../utils/auth';
import './AIAssistantWidget.css';
import favIcon from '../../assets/Parivartan-Leaf.png';
import Draggable from 'react-draggable';

const helpOptions = [
  // Actions
  "Create a New Enquiry",
  
  // Dashboard
  "How to view overall CRM statistics?",
  "How to check my recent activities?",
  "How to view conversion rates?",
  
  // Leads
  "How to add a new lead?",
  "How to convert a lead to a client?",
  "How to edit lead details?",
  "How to dismiss a lead?",
  
  // Follow Ups
  "How to create a new follow up?",
  "How to update follow up status?",
  "How to mark follow up as completed?",
  "How to schedule next follow up?",
  "How to filter follow ups?",
  "How to search customer follow ups?",
  "How to assign follow ups to team members?",
  "How to view overdue follow ups?",
  "How to track today's follow ups?",
  "How to export follow up data?",
  "How to add follow up notes?",
  "How to set follow up reminders?",
  "How to change follow up priority?",
  "How to view follow up history?",
  "How to manage pending follow ups?",
  
  // Clients
  "How to add a new client?",
  "How to view client details?",
  "How to edit client information?",
  "How to delete a client?",
  "How to track client interactions?",
  
  // Projects
  "How to create a new project?",
  "How to view project status?",
  "How to update project details?",
  "How to manage project board?",
  "How to track project deadlines?",
  
  // Settings
  "How to update my profile?",
  "How to change password?",
  "How to manage system settings?",
  "How to configure AI models?"
];

export default function AIAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const nodeRef = useRef(null);
  
  // Theme state
  const [theme, setTheme] = useState('light'); // Forced to light
  
  const [isListening, setIsListening] = useState(false);
  const [chatInput, setChatInput] = useState('');

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Your browser does not support voice input.");
      return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (selectedQuestion) {
        setChatInput(transcript);
      } else {
        setSearchQuery(transcript);
      }
    };
    
    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };
    
    recognition.onend = () => setIsListening(false);
    
    recognition.start();
  };

  const filteredOptions = helpOptions.filter(option =>
    option.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSelectedQuestion(null);
      setMessages([]);
      setSearchQuery('');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput.trim();
    const newMessages = [...messages, { text: userText, sender: 'user' }];
    setMessages(newMessages);
    setChatInput('');
    setIsTyping(true);

    try {
      const res = await fetch(`${BASE_URL}/api/ai/chat`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ messages: newMessages }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages([...newMessages, { text: data.botMessage, sender: 'ai' }]);
      } else {
        setMessages([...newMessages, { text: "❌ Sorry, I encountered an error connecting to the server.", sender: 'ai' }]);
      }
    } catch (error) {
      setMessages([...newMessages, { text: "❌ Sorry, I could not reach the server.", sender: 'ai' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleOptionClick = async (question) => {
    setSelectedQuestion(question);
    const newMessages = [{ text: question, sender: 'user' }];
    setMessages(newMessages);
    setIsTyping(true);
    
    try {
      const res = await fetch(`${BASE_URL}/api/ai/chat`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ messages: newMessages }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages([...newMessages, { text: data.botMessage, sender: 'ai' }]);
      } else {
        setMessages([...newMessages, { text: "❌ Sorry, I encountered an error connecting to the server.", sender: 'ai' }]);
      }
    } catch (error) {
      setMessages([...newMessages, { text: "❌ Sorry, I could not reach the server.", sender: 'ai' }]);
    } finally {
      setIsTyping(false);
    }
  };
  
  const handleBack = () => {
    setSelectedQuestion(null);
    setMessages([]);
    setChatInput('');
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  return (
    <Draggable handle=".drag-handle" nodeRef={nodeRef}>
      <div ref={nodeRef} className={`ai-assistant-container ${theme}`}>
        {/* Assistant Panel */}
        <div className={`ai-assistant-panel ${isOpen ? 'open' : ''}`}>
        <div className="ai-panel-header drag-handle" style={{ cursor: 'grab' }}>
          <div className="ai-header-left">
            <div className="ai-avatar">
              <img src={favIcon} alt="AI" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
            </div>
            <div className="ai-header-title">
              <h3>Parivartan AI Bot</h3>
              <p>How can I help you today?</p>
            </div>
          </div>
          <button className="ai-close-btn" onClick={toggleOpen} aria-label="Close Assistant">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div className="ai-panel-body">
          {!selectedQuestion ? (
            <div className="ai-help-menu">
              <div className="ai-welcome-msg">
                👋 Welcome! I'm here to help you navigate <strong>Parivartan CRM</strong>.
              </div>
              <div className="ai-search-box">
                <svg className="ai-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <input 
                  type="text" 
                  placeholder="Ask anything about CRM workflow..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button 
                  className={`ai-voice-btn ${isListening ? 'listening' : ''}`} 
                  onClick={startListening}
                  title="Search by voice"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                    <line x1="12" y1="19" x2="12" y2="22"></line>
                  </svg>
                </button>
              </div>
              
              <div className="ai-options-list">
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((option, idx) => (
                    <button key={idx} className="ai-option-card" onClick={() => handleOptionClick(option)}>
                      <span>{option}</span>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </button>
                  ))
                ) : (
                  <div className="ai-empty-state">
                    <p>No matching questions found.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="ai-chat-section">
              <button className="ai-back-btn" onClick={handleBack}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
                Back to topics
              </button>
              
              <div className="ai-messages-area">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`ai-message-wrapper ${msg.sender}`}>
                    {msg.sender === 'ai' && (
                      <div className="ai-message-avatar">
                        <img src={favIcon} alt="AI" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
                      </div>
                    )}
                    <div className="ai-message">
                      {msg.text.split('\n').map((line, i) => (
                        <span key={i}>{line}<br/></span>
                      ))}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="ai-message-wrapper ai">
                    <div className="ai-message-avatar">
                      <img src={favIcon} alt="AI" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
                    </div>
                    <div className="ai-message typing">
                      <span className="dot"></span>
                      <span className="dot"></span>
                      <span className="dot"></span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              
              <div className="ai-chat-input-area">
                <form onSubmit={handleSendMessage} className="ai-chat-form">
                  <input 
                    type="text" 
                    placeholder="Type a message..." 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                  />
                  <button 
                    type="button" 
                    className={`ai-chat-voice-btn ${isListening ? 'listening' : ''}`}
                    onClick={startListening}
                    title="Speak"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                      <line x1="12" y1="19" x2="12" y2="22"></line>
                    </svg>
                  </button>
                  <button type="submit" disabled={!chatInput.trim()} className="ai-chat-send-btn">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Button */}
      <div className="ai-floating-btn-wrapper drag-handle" onClick={toggleOpen} style={{ cursor: 'grab' }}>
        <div className="ai-btn-tooltip">AI Bot</div>
        <div className="ai-notification-badge">1</div>
        <button className={`ai-floating-btn ${isOpen ? 'active' : ''}`}>
          {isOpen ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          ) : (
            <img src={favIcon} alt="AI" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
          )}
        </button>
      </div>
    </div>
    </Draggable>
  );
}
