import React, { useState, useEffect, useRef } from 'react';

interface Option {
  id: string;
  label: string;
  sublabel?: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: boolean;
  style?: React.CSSProperties;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "Search...",
  label,
  error,
  style
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.id === value);

  // Filter options based on search term
  const filteredOptions = options.filter(o =>
    o.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (o.sublabel && o.sublabel.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (option: Option) => {
    onChange(option.id);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      {label && <label className="portal-form-label">{label}</label>}

      <div
        style={{
          width: '100%',
          position: 'relative'
        }}
      >
        <input
          type="text"
          value={isOpen ? searchTerm : (selectedOption ? selectedOption.label : searchTerm)}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            setIsOpen(true);
            if (selectedOption) setSearchTerm(selectedOption.label);
          }}
          placeholder={placeholder}
          style={{
            width: '100%',
            background: 'rgba(0,0,0,0.25)',
            border: error ? '1px solid var(--saffron)' : `1px solid ${isOpen ? 'var(--saffron)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: 8,
            padding: '14px 40px 14px 20px',
            color: 'white',
            fontSize: '0.88rem',
            transition: 'all 0.2s ease',
            outline: 'none',
            boxShadow: error ? '0 0 0 3px rgba(255,153,51,0.08)' : (isOpen ? '0 0 0 3px rgba(255,153,51,0.1)' : 'none'),
            ...style
          }}
        />
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          style={{ 
            position: 'absolute',
            right: 16,
            top: '50%',
            transform: 'translateY(-50%)',
            opacity: 0.3,
            pointerEvents: 'none'
          }}
        >
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          left: 0,
          right: 0,
          background: 'rgba(13, 27, 62, 0.98)',
          backdropFilter: 'blur(60px)',
          WebkitBackdropFilter: 'blur(60px)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 12,
          zIndex: 1000,
          boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
          overflow: 'hidden',
          animation: 'fadeInScale 0.15s ease-out'
        }}>
          {/* List */}
          <div style={{ maxHeight: 240, overflowY: 'auto', padding: 4 }}>
            {filteredOptions.length > 0 ? filteredOptions.map(option => (
              <div
                key={option.id}
                onClick={() => handleSelect(option)}
                className="select-option-hover"
                style={{
                  padding: '10px 12px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  background: value === option.id ? 'rgba(255,153,51,0.1)' : 'transparent',
                  transition: 'background 0.2s'
                }}
              >
                <div style={{ fontSize: '0.88rem', color: value === option.id ? 'var(--saffron)' : 'white', fontWeight: value === option.id ? 600 : 400 }}>
                  {option.label}
                </div>
                {option.sublabel && (
                  <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
                    {option.sublabel}
                  </div>
                )}
              </div>
            )) : (
              <div style={{ padding: '30px 20px', textAlign: 'center' }}>
                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic', marginBottom: 8 }}>
                  No Active Mandates Found
                </p>
                <p style={{ fontSize: '0.62rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--saffron)', opacity: 0.6 }}>
                  Please Verify Search Term Or Create A New Request
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Global Style for hover (if not using CSS modules) */}
      <style>{`
        .select-option-hover:hover {
          background: rgba(255,255,255,0.05) !important;
        }
        @keyframes fadeInScale {
          from { opacity: 0; transform: translateY(-10px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
};

export default SearchableSelect;
