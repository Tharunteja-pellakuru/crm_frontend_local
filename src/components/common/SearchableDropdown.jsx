import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Search, ChevronDown, Check, X } from "lucide-react";

const SearchableDropdown = ({
  options,
  value,
  onChange,
  placeholder = "Search...",
  label,
  required = false,
  disabled = false,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);
  const menuRef = useRef(null);
  const [portalStyle, setPortalStyle] = useState({});

  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const updatePosition = () => {
        if (!dropdownRef.current) return;
        const rect = dropdownRef.current.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const dropdownHeight = 300; // Expected max height
        const spaceBelow = windowHeight - rect.bottom;
        const shouldOpenUp = spaceBelow < dropdownHeight && rect.top > dropdownHeight;

        setPortalStyle({
          position: "fixed",
          top: shouldOpenUp ? "auto" : `${rect.bottom + 8}px`,
          bottom: shouldOpenUp ? `${windowHeight - rect.top + 8}px` : "auto",
          left: `${rect.left}px`,
          width: `${rect.width}px`,
          zIndex: 100001,
          transformOrigin: shouldOpenUp ? "bottom" : "top",
        });
      };

      updatePosition();
      window.addEventListener("scroll", () => setIsOpen(false), true);
      window.addEventListener("resize", () => setIsOpen(false));

      return () => {
        window.removeEventListener("scroll", () => setIsOpen(false), true);
        window.removeEventListener("resize", () => setIsOpen(false));
      };
    }
  }, [isOpen]);

  const filteredOptions = options.filter((option) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    
    if (typeof option === "string") {
      return option.toLowerCase().includes(term);
    }
    
    return (
      (option.name || "").toLowerCase().includes(term) ||
      (option.label || "").toLowerCase().includes(term) ||
      (option.code || "").toLowerCase().includes(term) ||
      (option.value || "").toLowerCase().includes(term)
    );
  });

  const selectedOption = options.find((opt) => {
    if (typeof opt === "string") return opt === value;
    return (
      opt.name === value ||
      opt.label === value ||
      opt.value === value ||
      opt.id === value ||
      opt.code === value ||
      (opt.code &&
        value &&
        opt.code.replace("+", "") === String(value).replace("+", ""))
    );
  });

  const displayValue = selectedOption
    ? (typeof selectedOption === "string" ? selectedOption : (selectedOption.label || selectedOption.name || selectedOption.value || selectedOption.code))
    : value || placeholder;

  useEffect(() => {
    const handleClickOutside = (event) => {
      const isInsideTrigger = dropdownRef.current && dropdownRef.current.contains(event.target);
      const isInsideMenu = menuRef.current && menuRef.current.contains(event.target);
      
      if (!isInsideTrigger && !isInsideMenu) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (option) => {
    const optionValue =
      typeof option === "string"
        ? option
        : option.id || option.value || option.code || option.name || option.label;
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div className={`space-y-1.5 ${className}`} ref={dropdownRef}>
      {label && (
        <label className="text-[12px] font-bold text-[#18254D] tracking-widest ml-1 uppercase">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-50 border ${isOpen ? "border-secondary ring-4 ring-secondary/10" : "border-slate-200"} rounded-2xl text-sm font-medium transition-all ${disabled ? "opacity-50 cursor-not-allowed" : "hover:border-secondary"}`}
          disabled={disabled}
        >
          <span className={displayValue ? "text-primary" : "text-slate-400"}>
            {displayValue || placeholder}
          </span>
          <ChevronDown
            size={16}
            className={`text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </button>

        {isOpen && createPortal(
          <div 
            ref={menuRef}
            className="fixed bg-white border border-slate-200 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden animate-fade-in-up"
            style={portalStyle}
          >
            <div className="p-3 bg-slate-50 border-b border-slate-50">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={14}
                />
                <input
                  autoFocus
                  type="text"
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-100 rounded-2xl text-xs font-medium focus:outline-none focus:border-secondary"
                  placeholder="Type to search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto py-1 custom-scrollbar">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option, index) => {
                  const optionValue =
                    typeof option === "string"
                      ? option
                      : option.id || option.value || option.code || option.name || option.label;
                  const optionLabel =
                    typeof option === "string"
                      ? option
                      : (option.label || option.name || option.code);
                  const isSelected = optionValue === value;

                  return (
                    <button
                      key={`${optionValue}-${index}`}
                      type="button"
                      onClick={() => handleSelect(option)}
                      className={`w-full text-left px-4 py-2.5 text-[13px] font-bold tracking-widest transition-colors flex items-center justify-between ${
                        isSelected
                          ? "bg-secondary/5 text-secondary"
                          : "text-[#18254D] hover:bg-slate-50"
                      }`}
                    >
                      <span>{optionLabel}</span>
                      {isSelected && (
                        <Check
                          size={14}
                          className="text-secondary"
                          strokeWidth={3}
                        />
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="px-4 py-4 text-center">
                  <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">
                    No results found
                  </p>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
      </div>
    </div>
  );
};

export default SearchableDropdown;
